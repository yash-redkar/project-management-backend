import { Router } from "express";
import {
    getProjects,
    getProjectsById,
    createProject,
    updateProject,
    deleteProject,
    addMembersToProject,
    getProjectMembers,
    updateMemberRole,
    deleteMember,
} from "../controllers/project.controllers.js";

import { validate } from "../middlewares/validator.middleware.js";
import { setWorkspaceContext } from "../middlewares/workspace.middleware.js";
import { validateProjectPermission } from "../middlewares/auth.middleware.js";

import {
    createProjectValidator,
    addMemberToProjectValidator,
} from "../validators/index.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const router = Router({ mergeParams: true });

// workspace membership guard (owner/admin/member/viewer can view workspace)
router.use(setWorkspaceContext);

// /workspaces/:workspaceId/projects
router
    .route("/")
    .get(getProjects)
    .post(createProjectValidator(), validate, createProject);

// /workspaces/:workspaceId/projects/:projectId
router
    .route("/:projectId")
    .get(validateProjectPermission(AvailableUserRole), getProjectsById)
    .put(
        validateProjectPermission([UserRolesEnum.ADMIN]),
        validate,
        updateProject,
    )
    .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteProject);

// members
router
    .route("/:projectId/members")
    .get(validateProjectPermission(AvailableUserRole), getProjectMembers)
    .post(
        addMemberToProjectValidator(),
        validate,
        validateProjectPermission([UserRolesEnum.ADMIN]),
        addMembersToProject,
    );

router
    .route("/:projectId/members/:userId")
    .put(validateProjectPermission([UserRolesEnum.ADMIN]), updateMemberRole)
    .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteMember);

export default router;
