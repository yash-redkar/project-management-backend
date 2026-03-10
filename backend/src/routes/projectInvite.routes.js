import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    inviteToProject,
    acceptProjectInvite,
    getProjectPendingInvites,
    cancelProjectInvite,
    resendProjectInvite,
    cleanupExpiredProjectInvites
} from "../controllers/projectInvite.controllers.js";

const router = Router();

router.use(verifyJWT);

// send invite (admin only check is inside controller)
router.post(
    "/workspaces/:workspaceId/projects/:projectId/invite",
    inviteToProject,
);

// accept invite
router.get("/invites/project/:token/accept", acceptProjectInvite);

router.get("/projects/:projectId/invites", verifyJWT, getProjectPendingInvites);

router.delete(
    "/projects/:projectId/invites/expired",
    verifyJWT,
    cleanupExpiredProjectInvites,
);

router.post(
    "/projects/:projectId/invites/:memberId/resend",
    verifyJWT,
    resendProjectInvite,
);

router.delete(
    "/projects/:projectId/invites/:memberId",
    verifyJWT,
    cancelProjectInvite,
);

export default router;
