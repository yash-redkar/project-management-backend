import mongoose from "mongoose";
import { Conversation } from "../models/conversation.models.js";
import { WorkspaceMember } from "../models/workspacemember.models.js"; 
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const getOrCreateWorkspaceConversation = asyncHandler(
    async (req, res) => {
        const { workspaceId } = req.params;

        if (!mongoose.isValidObjectId(workspaceId)) {
            throw new ApiError(400, "Invalid workspaceId");
        }

        const wm = await WorkspaceMember.findOne({
            workspace: workspaceId,
            user: req.user._id,
        });

        if (!wm)
            throw new ApiError(403, "You are not a member of this workspace");

        let convo = await Conversation.findOne({
            workspace: workspaceId,
            type: "workspace",
        });

        if (!convo) {
            convo = await Conversation.create({
                workspace: workspaceId,
                type: "workspace",
                name: "Workspace General",
                createdBy: req.user._id,
                project: null,
                task: null,
            });
        }

        return res
            .status(200)
            .json(new ApiResponse(200, convo, "Workspace conversation ready"));
    },
);
