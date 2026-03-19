import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    inviteToProject,
    acceptProjectInvite,
    getProjectPendingInvites,
    cancelProjectInvite,
    resendProjectInvite,
    cleanupExpiredProjectInvites,
} from "../controllers/projectInvite.controllers.js";

const router = Router();

router.use(verifyJWT);

router.post(
    "/workspaces/:workspaceId/projects/:projectId/invites",
    inviteToProject,
);

router.get(
    "/workspaces/:workspaceId/projects/:projectId/invites",
    getProjectPendingInvites,
);

router.delete(
    "/workspaces/:workspaceId/projects/:projectId/invites/expired",
    cleanupExpiredProjectInvites,
);

router.post(
    "/workspaces/:workspaceId/projects/:projectId/invites/:memberId/resend",
    resendProjectInvite,
);

router.delete(
    "/workspaces/:workspaceId/projects/:projectId/invites/:memberId",
    cancelProjectInvite,
);

router.get("/invites/project/:token/accept", acceptProjectInvite);

export default router;
