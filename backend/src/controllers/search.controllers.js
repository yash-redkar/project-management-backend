import mongoose from "mongoose";
import { Tasks } from "../models/task.models.js";
import { Project } from "../models/project.models.js";
import { User } from "../models/user.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { WorkspaceMember } from "../models/workspacemember.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const checkWorkspaceMembership = async (userId, workspaceId) => {
    const member = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: userId,
        status: "active",
    });

    if (!member) {
        throw new ApiError(403, "Access denied: Not a workspace member");
    }

    return member;
};

const searchTasks = asyncHandler(async (req, res) => {
    const { workspaceId, q, projectId, status, assignedTo } = req.query;
    const userId = req.user._id;

    if (!workspaceId) {
        throw new ApiError(400, "workspaceId is required");
    }

    if (!q || !q.trim()) {
        throw new ApiError(400, "Search query is required");
    }

    await checkWorkspaceMembership(userId, workspaceId);

    const projectMemberRows = await ProjectMember.find({
        workspace: workspaceId,
        user: userId,
        status: "active",
    }).select("project");

    const accessibleProjectIds = projectMemberRows.map((m) => m.project);

    const query = {
        workspace: workspaceId,
        project: { $in: accessibleProjectIds },
        $text: { $search: q.trim() },
    };

    if (projectId) {
        query.project = new mongoose.Types.ObjectId(projectId);
    }

    if (status) {
        query.status = status;
    }

    if (assignedTo) {
        query.assignedTo = assignedTo;
    }

    const tasks = await Tasks.find(query, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" }, createdAt: -1 })
        .limit(20)
        .populate("assignedTo", "username email avatar")
        .populate("assignedBy", "username email")
        .lean();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tasks,
                "Task search results fetched successfully",
            ),
        );
});

const searchProjects = asyncHandler(async (req, res) => {
    const { workspaceId, q } = req.query;
    const userId = req.user._id;

    if (!workspaceId) {
        throw new ApiError(400, "workspaceId is required");
    }

    if (!q || !q.trim()) {
        throw new ApiError(400, "Search query is required");
    }

    await checkWorkspaceMembership(userId, workspaceId);

    const projectMemberRows = await ProjectMember.find({
        workspace: workspaceId,
        user: userId,
        status: "active",
    }).select("project");

    const accessibleProjectIds = projectMemberRows.map((m) => m.project);

    const projects = await Project.find(
        {
            _id: { $in: accessibleProjectIds },
            workspace: workspaceId,
            $text: { $search: q.trim() },
        },
        { score: { $meta: "textScore" } },
    )
        .sort({ score: { $meta: "textScore" }, createdAt: -1 })
        .limit(20)
        .lean();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                projects,
                "Project search results fetched successfully",
            ),
        );
});

const searchMembers = asyncHandler(async (req, res) => {
    const { workspaceId, q, projectId } = req.query;
    const userId = req.user._id;

    if (!workspaceId) {
        throw new ApiError(400, "workspaceId is required");
    }

    if (!q || !q.trim()) {
        throw new ApiError(400, "Search query is required");
    }

    await checkWorkspaceMembership(userId, workspaceId);

    let memberFilter = {
        workspace: workspaceId,
        status: "active",
    };

    if (projectId) {
        const isProjectMember = await ProjectMember.findOne({
            workspace: workspaceId,
            project: projectId,
            user: userId,
            status: "active",
        });

        if (!isProjectMember) {
            throw new ApiError(403, "Access denied: Not a project member");
        }

        memberFilter = {
            workspace: workspaceId,
            project: projectId,
            status: "active",
        };

        const projectMembers =
            await ProjectMember.find(memberFilter).select("user role");

        const userIds = projectMembers.map((m) => m.user);

        const users = await User.find(
            {
                _id: { $in: userIds },
                $text: { $search: q.trim() },
            },
            { score: { $meta: "textScore" } },
        )
            .select("username email fullName avatar")
            .sort({ score: { $meta: "textScore" } })
            .limit(20)
            .lean();

        const roleMap = new Map(
            projectMembers.map((m) => [m.user.toString(), m.role]),
        );

        const results = users.map((user) => ({
            ...user,
            role: roleMap.get(user._id.toString()) || null,
            scope: "project",
        }));

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    results,
                    "Member search results fetched successfully",
                ),
            );
    }

    const workspaceMembers =
        await WorkspaceMember.find(memberFilter).select("user role");

    const userIds = workspaceMembers.map((m) => m.user);

    const users = await User.find(
        {
            _id: { $in: userIds },
            $text: { $search: q.trim() },
        },
        { score: { $meta: "textScore" } },
    )
        .select("username email fullName avatar")
        .sort({ score: { $meta: "textScore" } })
        .limit(20)
        .lean();

    const roleMap = new Map(
        workspaceMembers.map((m) => [m.user.toString(), m.role]),
    );

    const results = users.map((user) => ({
        ...user,
        role: roleMap.get(user._id.toString()) || null,
        scope: "workspace",
    }));

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                results,
                "Member search results fetched successfully",
            ),
        );
});

export { searchTasks, searchProjects, searchMembers };
