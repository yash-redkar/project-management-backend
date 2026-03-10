import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
    inviteToWorkspace,
    acceptWorkspaceInvite,
    getWorkspacePendingInvites,
    cancelWorkspaceInvite,
    resendWorkspaceInvite,
    cleanupExpiredWorkspaceInvites
} from "../controllers/workspaceInvite.controllers.js";

const router = Router();

// send workspace invite
router.post("/workspaces/:workspaceId/invite", verifyJWT, inviteToWorkspace);

// accept workspace invite
router.get(
    "/invites/workspace/:token/accept",
    verifyJWT,
    acceptWorkspaceInvite,
);

// get pending workspace invites
router.get(
    "/workspaces/:workspaceId/invites",
    verifyJWT,
    getWorkspacePendingInvites,
);

router.delete(
    "/workspaces/:workspaceId/invites/expired",
    verifyJWT,
    cleanupExpiredWorkspaceInvites,
);

// resend workspace invite
router.post(
    "/workspaces/:workspaceId/invites/:memberId/resend",
    verifyJWT,
    resendWorkspaceInvite,
);

// cancel workspace invite
router.delete(
    "/workspaces/:workspaceId/invites/:memberId",
    verifyJWT,
    cancelWorkspaceInvite,
);

export default router;
