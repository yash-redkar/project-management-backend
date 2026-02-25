import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

// ✅ helper: ensure project belongs to workspace
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
                            localField: "_id",
                            foreignField: "project",
                            as: "projectMembers",
                        },
                    },
                    { $addFields: { members: { $size: "$projectMembers" } } },
                    { $project: { projectMembers: 0 } },
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
                    members: "$project.members",
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

    // project must belong to workspace
    const project = await getWorkspaceProjectOrThrow(workspaceId, projectId);

    // membership check
    const member = await ProjectMember.findOne({
        workspace: workspaceId,
        project: projectId,
        user: req.user._id,
    });

    if (!member) {
        throw new ApiError(403, "You are not a member of this project");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Project fetched successfully"));
});

const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const { workspaceId } = req.params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [project] = await Project.create(
            [
                {
                    workspace: new mongoose.Types.ObjectId(workspaceId),
                    name,
                    description,
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
                },
            ],
            { session },
        );

        await session.commitTransaction();
        session.endSession();

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

        // optional: handle duplicate per workspace name nicely
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
    const { name, description } = req.body;
    const { workspaceId, projectId } = req.params;

    await getWorkspaceProjectOrThrow(workspaceId, projectId);

    const admin = await ProjectMember.findOne({
        workspace: workspaceId,
        project: projectId,
        user: req.user._id,
        role: UserRolesEnum.ADMIN,
    });

    if (!admin) throw new ApiError(403, "Only admin can perform this action");

    const project = await Project.findOneAndUpdate(
        { _id: projectId, workspace: workspaceId },
        { name, description },
        { new: true },
    );

    if (!project) throw new ApiError(404, "Project not found");

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
    });

    if (!member)
        throw new ApiError(403, "You are not a member of this project");

    const projectMembers = await ProjectMember.aggregate([
        {
            $match: {
                workspace: new mongoose.Types.ObjectId(workspaceId),
                project: new mongoose.Types.ObjectId(projectId),
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
    });

    if (!admin) throw new ApiError(403, "Only admin can perform this action");

    if (!AvailableUserRole.includes(role))
        throw new ApiError(400, "Invalid role");

    const projectMember = await ProjectMember.findOne({
        workspace: workspaceId,
        project: projectId,
        user: userId,
    });

    if (!projectMember) throw new ApiError(404, "Project member not found");

    // prevent removing last admin
    if (
        projectMember.role === UserRolesEnum.ADMIN &&
        role !== UserRolesEnum.ADMIN
    ) {
        const adminCount = await ProjectMember.countDocuments({
            workspace: workspaceId,
            project: projectId,
            role: UserRolesEnum.ADMIN,
        });

        if (adminCount === 1)
            throw new ApiError(400, "Project must have at least one admin");
    }

    const updated = await ProjectMember.findByIdAndUpdate(
        projectMember._id,
        { role },
        { new: true },
    );

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
    });

    if (!admin) throw new ApiError(403, "Only admin can perform this action");

    if (userId === req.user._id.toString()) {
        throw new ApiError(400, "Admin cannot remove himself");
    }

    const projectMember = await ProjectMember.findOne({
        workspace: workspaceId,
        project: projectId,
        user: userId,
    });

    if (!projectMember) throw new ApiError(404, "Project member not found");

    if (projectMember.role === UserRolesEnum.ADMIN) {
        const adminCount = await ProjectMember.countDocuments({
            workspace: workspaceId,
            project: projectId,
            role: UserRolesEnum.ADMIN,
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
};
