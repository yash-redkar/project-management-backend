import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { WorkspaceMember } from "../models/workspacemember.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
    AvailableWorkspaceRoles,
    WorkspaceRolesEnum,
} from "../utils/constants.js";
import { ensureNotLastOwner } from "../middlewares/workspace.middleware.js";

export const getWorkspaceMembers = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const members = await WorkspaceMember.aggregate([
        {
            $match: {
                workspace: new mongoose.Types.ObjectId(workspaceId),
                status: "active",
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
                pipeline: [
                    { $project: { _id: 1, username: 1, email: 1, avatar: 1 } },
                ],
            },
        },
        { $addFields: { user: { $arrayElemAt: ["$user", 0] } } },
        {
            $project: {
                _id: 0,
                user: 1,
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
                members,
                "Workspace members fetched successfully",
            ),
        );
});

export const addWorkspaceMember = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const { email, role } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    if (!AvailableWorkspaceRoles.includes(role))
        throw new ApiError(400, "Invalid role");

    // only OWNER can assign OWNER
    if (
        role === WorkspaceRolesEnum.OWNER &&
        req.workspaceRole !== WorkspaceRolesEnum.OWNER
    ) {
        throw new ApiError(403, "Only owner can assign owner role");
    }

    const member = await WorkspaceMember.findOneAndUpdate(
        { workspace: workspaceId, user: user._id },
        { workspace: workspaceId, user: user._id, role, status: "active" },
        { new: true, upsert: true },
    );

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                member,
                "Member added to workspace successfully",
            ),
        );
});

export const updateWorkspaceMemberRole = asyncHandler(async (req, res) => {
    const { workspaceId, userId } = req.params;
    const { role } = req.body;

    if (!AvailableWorkspaceRoles.includes(role))
        throw new ApiError(400, "Invalid role");

    // only OWNER can assign OWNER
    if (
        role === WorkspaceRolesEnum.OWNER &&
        req.workspaceRole !== WorkspaceRolesEnum.OWNER
    ) {
        throw new ApiError(403, "Only owner can assign owner role");
    }

    // prevent demoting last owner
    if (role !== WorkspaceRolesEnum.OWNER) {
        await ensureNotLastOwner(workspaceId, userId);
    }

    const updated = await WorkspaceMember.findOneAndUpdate(
        { workspace: workspaceId, user: userId },
        { $set: { role } },
        { new: true },
    );

    if (!updated) throw new ApiError(404, "Workspace member not found");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updated,
                "Workspace member role updated successfully",
            ),
        );
});

export const deleteWorkspaceMember = asyncHandler(async (req, res) => {
    const { workspaceId, userId } = req.params;

    // prevent deleting last owner
    await ensureNotLastOwner(workspaceId, userId);

    const deleted = await WorkspaceMember.findOneAndDelete({
        workspace: workspaceId,
        user: userId,
    });

    if (!deleted) throw new ApiError(404, "Workspace member not found");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                deleted,
                "Workspace member deleted successfully",
            ),
        );
});
