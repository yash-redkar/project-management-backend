import mongoose from "mongoose";
import { Conversation } from "../models/conversation.models.js";
import { Message } from "../models/message.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { WorkspaceMember } from "../models/workspacemember.models.js";
import { Tasks } from "../models/task.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

// Helper: ensure user is workspace member
const ensureWorkspaceAccess = async ({ userId, workspaceId }) => {
    const wm = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: userId,
    });

    if (!wm) {
        throw new ApiError(403, "You are not a member of this workspace");
    }

    return wm;
};

// Helper: ensure user is project member + project belongs to workspace
const ensureProjectAccess = async ({ userId, workspaceId, projectId }) => {
    const project = await Project.findOne({
        _id: projectId,
        workspace: workspaceId,
    });

    if (!project) {
        throw new ApiError(404, "Project not found in this workspace");
    }

    const pm = await ProjectMember.findOne({
        project: projectId,
        user: userId,
        workspace: workspaceId,
    });

    if (!pm) {
        throw new ApiError(403, "You are not a member of this project");
    }

    return { project, pm };
};

// Helper: ensure task belongs to same project/workspace and user can access it
const ensureTaskAccess = async ({ userId, workspaceId, projectId, taskId }) => {
    await ensureProjectAccess({
        userId,
        workspaceId,
        projectId,
    });

    const task = await Tasks.findOne({
        _id: taskId,
        workspace: workspaceId,
        project: projectId,
    });

    if (!task) {
        throw new ApiError(404, "Task not found in this project");
    }

    return task;
};

// 1) Get or Create Project Chat Conversation
export const getOrCreateProjectConversation = asyncHandler(async (req, res) => {
    const { workspaceId, projectId } = req.params;

    if (
        !mongoose.isValidObjectId(workspaceId) ||
        !mongoose.isValidObjectId(projectId)
    ) {
        throw new ApiError(400, "Invalid workspaceId or projectId");
    }

    await ensureProjectAccess({
        userId: req.user._id,
        workspaceId,
        projectId,
    });

    let conversation = await Conversation.findOne({
        workspace: workspaceId,
        type: "project",
        project: projectId,
    });

    if (!conversation) {
        conversation = await Conversation.create({
            workspace: workspaceId,
            type: "project",
            project: projectId,
            name: "Project Chat",
            createdBy: req.user._id,
            task: null,
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, conversation, "Project conversation ready"));
});

// 2) Get Messages (cursor pagination)
export const getConversationMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { cursor, limit } = req.query;

    if (!mongoose.isValidObjectId(conversationId)) {
        throw new ApiError(400, "Invalid conversationId");
    }

    const pageSize = Math.min(parseInt(limit || "30", 10), 50);

    const convo = await Conversation.findById(conversationId);
    if (!convo) {
        throw new ApiError(404, "Conversation not found");
    }

    if (String(convo.type) === "project") {
        await ensureProjectAccess({
            userId: req.user._id,
            workspaceId: convo.workspace,
            projectId: convo.project,
        });
    } else if (String(convo.type) === "workspace") {
        await ensureWorkspaceAccess({
            userId: req.user._id,
            workspaceId: convo.workspace,
        });
    } else if (String(convo.type) === "task") {
        await ensureTaskAccess({
            userId: req.user._id,
            workspaceId: convo.workspace,
            projectId: convo.project,
            taskId: convo.task,
        });
    } else {
        throw new ApiError(400, "Unsupported conversation type");
    }

    const query = {
        conversation: convo._id,
        deletedAt: null,
    };

    if (cursor) {
        const cursorDate = new Date(cursor);
        if (!isNaN(cursorDate.getTime())) {
            query.createdAt = { $lt: cursorDate };
        }
    }

    const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .populate("sender", "username email avatar fullname name")
        .lean();

    messages.reverse();

    const nextCursor = messages.length
        ? messages[0].createdAt.toISOString()
        : null;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                items: messages,
                nextCursor,
                limit: pageSize,
            },
            "Messages fetched",
        ),
    );
});

// 3) Send Message (REST fallback, sockets can reuse same logic later)
export const sendMessage = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!mongoose.isValidObjectId(conversationId)) {
        throw new ApiError(400, "Invalid conversationId");
    }

    const convo = await Conversation.findById(conversationId).lean();
    if (!convo) {
        throw new ApiError(404, "Conversation not found");
    }

    if (String(convo.type) === "project") {
        await ensureProjectAccess({
            userId: req.user._id,
            workspaceId: convo.workspace,
            projectId: convo.project,
        });
    } else if (String(convo.type) === "workspace") {
        await ensureWorkspaceAccess({
            userId: req.user._id,
            workspaceId: convo.workspace,
        });
    } else if (String(convo.type) === "task") {
        await ensureTaskAccess({
            userId: req.user._id,
            workspaceId: convo.workspace,
            projectId: convo.project,
            taskId: convo.task,
        });
    } else {
        throw new ApiError(400, "Unsupported conversation type");
    }

    const cleanText = (text || "").trim();
    if (!cleanText) {
        throw new ApiError(400, "Message text is required");
    }

    const msg = await Message.create({
        workspace: convo.workspace,
        conversation: convo._id,
        sender: req.user._id,
        text: cleanText,
    });

    await Conversation.findByIdAndUpdate(convo._id, {
        $set: { updatedAt: new Date() },
    });

    const populated = await Message.findById(msg._id)
        .populate("sender", "username email avatar fullname name")
        .lean();

    return res
        .status(201)
        .json(new ApiResponse(201, populated, "Message sent"));
});
