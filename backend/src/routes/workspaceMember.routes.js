import { Router } from "express";
import { validate } from "../middlewares/validator.middleware.js";
import {
    addWorkspaceMemberValidator,
    updateWorkspaceMemberRoleValidator,
} from "../validators/workspace.validators.js";
import {
    setWorkspaceContext,
    requireWorkspaceRole,
} from "../middlewares/workspace.middleware.js";
import { WorkspaceRolesEnum } from "../utils/constants.js";

import {
    getWorkspaceMembers,
    addWorkspaceMember,
    updateWorkspaceMemberRole,
    deleteWorkspaceMember,
} from "../controllers/workspaceMember.controllers.js";

const router = Router({ mergeParams: true });

router.use(setWorkspaceContext);

router
    .route("/")
    .get(getWorkspaceMembers)
    .post(
        requireWorkspaceRole([
            WorkspaceRolesEnum.OWNER,
            WorkspaceRolesEnum.ADMIN,
        ]),
        addWorkspaceMemberValidator(),
        validate,
        addWorkspaceMember,
    );

router
    .route("/:userId")
    .put(
        requireWorkspaceRole([WorkspaceRolesEnum.OWNER]),
        updateWorkspaceMemberRoleValidator(),
        validate,
        updateWorkspaceMemberRole,
    )
    .delete(
        requireWorkspaceRole([
            WorkspaceRolesEnum.OWNER,
            WorkspaceRolesEnum.ADMIN,
        ]),
        deleteWorkspaceMember,
    );

export default router;
