import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getOrCreateProjectConversation,
    getConversationMessages,
    sendMessage,
} from "../controllers/chat.controllers.js";
import { getOrCreateWorkspaceConversation } from "../controllers/workspaceChat.controllers.js";
import {getOrCreateTaskConversation} from "../controllers/taskChat.controllers.js";

const router = Router();
router.use(verifyJWT);

// Project chat conversation (get-or-create)
router
    .route("/workspaces/:workspaceId/projects/:projectId/conversation")
    .get(getOrCreateProjectConversation);

// Workspace chat conversation (get-or-create)
router
    .route("/workspaces/:workspaceId/conversation")
    .get(getOrCreateWorkspaceConversation);

// Task chat conversation (get-or-create)
router
    .route("/workspaces/:workspaceId/projects/:projectId/tasks/:taskId/conversation")
    .get(getOrCreateTaskConversation);

// Messages
router
    .route("/conversations/:conversationId/messages")
    .get(getConversationMessages);
router.route("/conversations/:conversationId/messages").post(sendMessage);

export default router;
