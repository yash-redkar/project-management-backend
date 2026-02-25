import mongoose from "mongoose";
import { Conversation } from "../models/conversation.models.js";
import { Tasks } from "../models/task.models.js"; 
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const getOrCreateTaskConversation = asyncHandler(async (req, res) => {
    const { workspaceId, projectId, taskId } = req.params;

    if (
        !mongoose.isValidObjectId(workspaceId) ||
        !mongoose.isValidObjectId(projectId) ||
        !mongoose.isValidObjectId(taskId)
    ) {
        throw new ApiError(400, "Invalid ids");
    }

    // ✅ project belongs to workspace
    const project = await Project.findOne({
        _id: projectId,
        workspace: workspaceId,
    });
    if (!project)
        throw new ApiError(404, "Project not found in this workspace");

    // ✅ user is project member
    const pm = await ProjectMember.findOne({
        workspace: workspaceId,
        project: projectId,
        user: req.user._id,
    });
    if (!pm) throw new ApiError(403, "You are not a member of this project");

    // ✅ task belongs to same project + workspace
    const task = await Tasks.findOne({
        _id: taskId,
        project: projectId,
        workspace: workspaceId,
    });
    if (!task) throw new ApiError(404, "Task not found in this project");

    // ✅ find or create task thread conversation
    let convo = await Conversation.findOne({
        workspace: workspaceId,
        type: "task",
        task: taskId,
    });

    if (!convo) {
        convo = await Conversation.create({
            workspace: workspaceId,
            type: "task",
            name: `Task Thread`,
            createdBy: req.user._id,
            project: projectId,
            task: taskId,
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, convo, "Task conversation ready"));
});
