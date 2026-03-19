import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";
import { createActivityLog } from "../utils/activity-log.js";
import { Tasks } from "../models/task.models.js";

const getWorkspaceProjectOrThrow = async (workspaceId, projectId) => {
    const project = await Project.findOne({
        _id: projectId,
        workspace: workspaceId,
    });
    if (!project)
        throw new ApiError(404, "Project not found in this workspace");
    return project;
};

const getProjects = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const projects = await ProjectMember.aggregate([
        {
            $match: {
                workspace: new mongoose.Types.ObjectId(workspaceId),
                user: new mongoose.Types.ObjectId(req.user._id),
                status: "active",
            },
        },
        {
            $lookup: {
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "project",
                pipeline: [
                    {
                        $match: {
                            workspace: new mongoose.Types.ObjectId(workspaceId),
                        },
                    },
                    {
                        $lookup: {
                            from: "projectmembers",
                            let: { projectId: "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                {
                                                    $eq: [
                                                        "$project",
                                                        "$$projectId",
                                                    ],
                                                },
                                                { $eq: ["$status", "active"] },
                                            ],
                                        },
                                    },
                                },
                            ],
                            as: "projectMembers",
                        },
                    },
                    {
                        $lookup: {
                            from: "tasks",
                            let: { projectId: "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ["$project", "$$projectId"],
                                        },
                                    },
                                },
                            ],
                            as: "projectTasks",
                        },
                    },
                    {
                        $addFields: {
                            membersCount: { $size: "$projectMembers" },
                            tasksCount: { $size: "$projectTasks" },
                            completedTasksCount: {
                                $size: {
                                    $filter: {
                                        input: "$projectTasks",
                                        as: "task",
                                        cond: {
                                            $eq: ["$$task.status", "done"],
                                        },
                                    },
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            workspace: 1,
                            name: 1,
                            description: 1,
                            status: 1,
                            createdAt: 1,
                            createdBy: 1,
                            membersCount: 1,
                            tasksCount: 1,
                            completedTasksCount: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: "$project" },
        {
            $project: {
                _id: 0,
                role: 1,
                project: {
                    _id: "$project._id",
                    workspace: "$project.workspace",
                    name: "$project.name",
                    description: "$project.description",
                    status: "$project.status",
                    membersCount: "$project.membersCount",
                    tasksCount: "$project.tasksCount",
                    completedTasksCount: "$project.completedTasksCount",
                    createdAt: "$project.createdAt",
                    createdBy: "$project.createdBy",
                },
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectsById = asyncHandler(async (req, res) => {
    const { workspaceId, projectId } = req.params;

    const project = await getWorkspaceProjectOrThrow(workspaceId, projectId);

    const member = await ProjectMember.findOne({
        workspace: workspaceId,
        project: projectId,
        user: req.user._id,
        status: "active",
    });

    if (!member) {
        throw new ApiError(403, "You are not a member of this project");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                project,
                role: member.role,
                membershipStatus: member.status,
            },
            "Project fetched successfully",
        ),
    );
});

const createProject = asyncHandler(async (req, res) => {
    const { name, description, status } = req.body;
    const { workspaceId } = req.params;

    const safeStatus = ["todo", "in_progress", "done"].includes(status)
        ? status
        : "todo";

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [project] = await Project.create(
            [
                {
                    workspace: new mongoose.Types.ObjectId(workspaceId),
                    name,
                    description,
                    status: safeStatus,
                    createdBy: new mongoose.Types.ObjectId(req.user._id),
                },
            ],
            { session },
        );

        const [projectMember] = await ProjectMember.create(
            [
                {
                    workspace: new mongoose.Types.ObjectId(workspaceId),
                    project: new mongoose.Types.ObjectId(project._id),
                    user: new mongoose.Types.ObjectId(req.user._id),
                    role: UserRolesEnum.ADMIN,
                    status: "active",
                },
            ],
            { session },
        );

        await session.commitTransaction();
        session.endSession();

        await createActivityLog({
            workspace: workspaceId,
            project: project._id,
            actor: req.user._id,
            entityType: "project",
            action: "project_created",
            message: `Project "${project.name}" was created`,
            meta: {
                projectName: project.name,
                status: project.status,
            },
        });

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    { project, projectMember },
                    "Project created successfully",
                ),
            );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        if (error?.code === 11000) {
            throw new ApiError(
                409,
                "Project name already exists in this workspace",
            );
        }
        throw error;
    }
});

const updateProject = asyncHandler(async (req, res) => {
    const { name, description, status } = req.body;
    const { workspaceId, projectId } = req.params;

    await getWorkspaceProjectOrThrow(workspaceId, projectId);

    const admin = await ProjectMember.findOne({
        workspace: workspaceId,
        project: projectId,
        user: req.user._id,
        role: UserRolesEnum.ADMIN,
        status: "active",
    });

    if (!admin) throw new ApiError(403, "Only admin can perform this action");

    const updatePayload = {};

    if (typeof name === "string") updatePayload.name = name;
    if (typeof description === "string")
        updatePayload.description = description;

    if (typeof status === "string") {
        if (!["todo", "in_progress", "done"].includes(status)) {
            throw new ApiError(400, "Invalid project status");
        }
        updatePayload.status = status;
    }

    const project = await Project.findOneAndUpdate(
        { _id: projectId, workspace: workspaceId },
        updatePayload,
        { new: true },
    );

    if (!project) throw new ApiError(404, "Project not found");

    await createActivityLog({
        workspace: workspaceId,
        project: projectId,
        actor: req.user._id,
        entityType: "project",
        action: "project_updated",
        message: `Project "${project.name}" was updated`,
        meta: {
            projectName: project.name,
            status: project.status,
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
    const { workspaceId, projectId } = req.params;

    await getWorkspaceProjectOrThrow(workspaceId, projectId);

    const admin = await ProjectMember.findOne({
        workspace: workspaceId,
        project: projectId,
        user: req.user._id,
        role: UserRolesEnum.ADMIN,
        status: "active",
    });

    if (!admin) throw new ApiError(403, "Only admin can perform this action");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const project = await Project.findOneAndDelete(
            { _id: projectId, workspace: workspaceId },
            { session },
        );

        if (!project) {
            await session.abortTransaction();
            session.endSession();
            throw new ApiError(404, "Project not found");
        }

        await ProjectMember.deleteMany(
            { workspace: workspaceId, project: projectId },
            { session },
        );

        await session.commitTransaction();
        session.endSession();

        await createActivityLog({
            workspace: workspaceId,
            project: projectId,
            actor: req.user._id,
            entityType: "project",
            action: "project_deleted",
            message: `Project "${project.name}" was deleted`,
            meta: {
                projectName: project.name,
            },
        });

        return res
            .status(200)
            .json(
                new ApiResponse(200, project, "Project deleted successfully"),
            );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

const addMembersToProject = asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    const { workspaceId, projectId } = req.params;

    await getWorkspaceProjectOrThrow(workspaceId, projectId);

    const admin = await ProjectMember.findOne({
        workspace: workspaceId,
        project: projectId,
        user: req.user._id,
        role: UserRolesEnum.ADMIN,
    });

    if (!admin) throw new ApiError(403, "Only admin can perform this action");

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    if (!AvailableUserRole.includes(role))
        throw new ApiError(400, "Invalid role");

    let projectMember;
    try {
        projectMember = await ProjectMember.findOneAndUpdate(
            { workspace: workspaceId, project: projectId, user: user._id },
            {
                workspace: workspaceId,
                project: projectId,
                user: user._id,
                role,
            },
            { new: true, upsert: true },
        );
    } catch (error) {
        if (error?.code === 11000)
            throw new ApiError(409, "Member already exists in project");
        throw error;
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                projectMember,
                "Member added to project successfully",
            ),
        );
});

const getProjectMembers = asyncHandler(async (req, res) => {
    const { workspaceId, projectId } = req.params;

    await getWorkspaceProjectOrThrow(workspaceId, projectId);

    const member = await ProjectMember.findOne({
        workspace: workspaceId,
        project: projectId,
        user: req.user._id,
        status: "active",
    });

    if (!member)
        throw new ApiError(403, "You are not a member of this project");

    const projectMembers = await ProjectMember.aggregate([
        {
            $match: {
                workspace: new mongoose.Types.ObjectId(workspaceId),
                project: new mongoose.Types.ObjectId(projectId),
                status: "active",
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                            email: 1,
                        },
                    },
                ],
            },
        },
        { $addFields: { userDetails: { $arrayElemAt: ["$userDetails", 0] } } },
        { $unwind: "$userDetails" },
        {
            $project: {
                _id: 0,
                user: "$userDetails",
                role: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                projectMembers,
                "Project members fetched successfully",
            ),
        );
});

const updateMemberRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const { workspaceId, projectId, userId } = req.params;

    await getWorkspaceProjectOrThrow(workspaceId, projectId);

    const admin = await ProjectMember.findOne({
        workspace: workspaceId,
        project: projectId,
        user: req.user._id,
        role: UserRolesEnum.ADMIN,
        status: "active",
    });

    if (!admin) throw new ApiError(403, "Only admin can perform this action");

    if (!AvailableUserRole.includes(role))
        throw new ApiError(400, "Invalid role");

    const projectMember = await ProjectMember.findOne({
        workspace: workspaceId,
        project: projectId,
        user: userId,
        status: "active",
    });

    if (!projectMember) throw new ApiError(404, "Project member not found");

    const oldRole = projectMember.role;

    if (
        projectMember.role === UserRolesEnum.ADMIN &&
        role !== UserRolesEnum.ADMIN
    ) {
        const adminCount = await ProjectMember.countDocuments({
            workspace: workspaceId,
            project: projectId,
            role: UserRolesEnum.ADMIN,
            status: "active",
        });

        if (adminCount === 1)
            throw new ApiError(400, "Project must have at least one admin");
    }

    const updated = await ProjectMember.findByIdAndUpdate(
        projectMember._id,
        { role },
        { new: true },
    );

    await createActivityLog({
        workspace: workspaceId,
        project: projectId,
        actor: req.user._id,
        entityType: "member",
        action: "project_member_role_updated",
        message: `Updated member role from ${oldRole} to ${role}`,
        meta: {
            targetUserId: userId,
            oldRole,
            newRole: role,
        },
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updated,
                "Project member role updated successfully",
            ),
        );
});

const deleteMember = asyncHandler(async (req, res) => {
    const { workspaceId, projectId, userId } = req.params;

    await getWorkspaceProjectOrThrow(workspaceId, projectId);

    const admin = await ProjectMember.findOne({
        workspace: workspaceId,
        project: projectId,
        user: req.user._id,
        role: UserRolesEnum.ADMIN,
        status: "active",
    });

    if (!admin) throw new ApiError(403, "Only admin can perform this action");

    if (userId === req.user._id.toString()) {
        throw new ApiError(400, "Admin cannot remove himself");
    }

    const projectMember = await ProjectMember.findOne({
        workspace: workspaceId,
        project: projectId,
        user: userId,
        status: "active",
    });

    if (!projectMember) throw new ApiError(404, "Project member not found");

    if (projectMember.role === UserRolesEnum.ADMIN) {
        const adminCount = await ProjectMember.countDocuments({
            workspace: workspaceId,
            project: projectId,
            role: UserRolesEnum.ADMIN,
            status: "active",
        });

        if (adminCount === 1)
            throw new ApiError(400, "Project must have at least one admin");
    }

    const deleted = await ProjectMember.findByIdAndDelete(projectMember._id);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                deleted,
                "Project member deleted successfully",
            ),
        );
});

const leaveProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const membership = await ProjectMember.findOne({
        project: projectId,
        user: req.user._id,
        status: "active",
    });

    if (!membership) {
        throw new ApiError(404, "You are not a member of this project");
    }

    if (membership.role === UserRolesEnum.ADMIN) {
        const adminCount = await ProjectMember.countDocuments({
            project: projectId,
            status: "active",
            role: UserRolesEnum.ADMIN,
        });

        if (adminCount === 1) {
            throw new ApiError(
                400,
                "You are the last admin of this project. Add another admin before leaving",
            );
        }
    }
    await ProjectMember.deleteOne({ _id: membership._id });

    await createActivityLog({
        workspace: membership.workspace,
        project: membership.project,
        actor: req.user._id,
        entityType: "member",
        action: "project_left",
        message: `${req.user.email} left the project`,
        meta: {
            userId: req.user._id,
            previousRole: membership.role,
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "You left the project successfully"));
});

export {
    addMembersToProject,
    createProject,
    deleteMember,
    deleteProject,
    getProjectMembers,
    getProjects,
    getProjectsById,
    updateMemberRole,
    updateProject,
    leaveProject,
};
