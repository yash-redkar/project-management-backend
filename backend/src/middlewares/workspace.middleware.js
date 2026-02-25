import mongoose from "mongoose";
import { Workspace } from "../models/workspace.models.js";
import { WorkspaceMember } from "../models/workspacemember.models.js";
import { ApiError } from "../utils/api-error.js";
import { WorkspaceRolesEnum } from "../utils/constants.js";

export const setWorkspaceContext = async (req, res, next) => {
    const { workspaceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
        return next(new ApiError(400, "Invalid workspace id"));
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return next(new ApiError(404, "Workspace not found"));

    const member = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: req.user._id,
        status: "active",
    });

    if (!member)
        return next(
            new ApiError(403, "You are not a member of this workspace"),
        );

    req.workspace = workspace;
    req.workspaceMember = member;
    req.workspaceRole = member.role;
    next();
};

export const requireWorkspaceRole = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.workspaceRole)) {
            return next(
                new ApiError(
                    403,
                    "Forbidden: Insufficient workspace permissions",
                ),
            );
        }
        next();
    };
};

export const ensureNotLastOwner = async (workspaceId, targetUserId) => {
    const target = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: targetUserId,
        status: "active",
    });
    if (!target) throw new ApiError(404, "Workspace member not found");

    if (target.role !== WorkspaceRolesEnum.OWNER) return;

    const ownerCount = await WorkspaceMember.countDocuments({
        workspace: workspaceId,
        role: WorkspaceRolesEnum.OWNER,
        status: "active",
    });

    if (ownerCount === 1) {
        throw new ApiError(400, "Workspace must have at least one owner");
    }
};
