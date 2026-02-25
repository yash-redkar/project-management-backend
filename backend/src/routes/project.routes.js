import { Router } from "express";
import {
    addMembersToProject,
    createProject,
    deleteMember,
    deleteProject,
    getProjectMembers,
    getProjects,
    getProjectsById,
    updateMemberRole,
    updateProject,
} from "../controllers/project.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
    createProjectValidator,addMemberToProjectValidator
} from "../validators/index.js";
import { 
    verifyJWT, validateProjectPermission
 } from "../middlewares/auth.middleware.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const router = Router({ mergeParams: true });
router.use(verifyJWT);

router
    .route("/")
    .get(getProjects)
    .post(createProjectValidator(),validate, createProject);

router
    .route("/:projectId")
    .get(validateProjectPermission(AvailableUserRole), getProjectsById)
    .put(validateProjectPermission([UserRolesEnum.ADMIN]), validate, updateProject)
    .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteProject);

router
    .route("/:projectId/members")
    .get(getProjectMembers)
    .post(
        addMemberToProjectValidator(), 
        validate, 
        validateProjectPermission([UserRolesEnum.ADMIN]), 
        addMembersToProject
    );

router
    .route("/:projectId/members/:userId")
    .put(validateProjectPermission([UserRolesEnum.ADMIN]), updateMemberRole)
    .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteMember);


export default router;
