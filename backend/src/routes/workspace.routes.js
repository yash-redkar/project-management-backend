import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { createWorkspaceValidator } from "../validators/workspace.validators.js";
import {
    createWorkspace,
    getMyWorkspaces,
} from "../controllers/workspace.controllers.js";
import workspaceMemberRouter from "./workspaceMember.routes.js";
import workspaceProjectRouter from "./workspaceProject.routes.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/")
    .post(createWorkspaceValidator(), validate, createWorkspace)
    .get(getMyWorkspaces);

router.use("/:workspaceId/members", workspaceMemberRouter);
router.use("/:workspaceId/projects", workspaceProjectRouter);


export default router;
