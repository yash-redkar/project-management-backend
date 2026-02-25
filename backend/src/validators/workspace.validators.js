import { body } from "express-validator";
import { AvailableWorkspaceRoles } from "../utils/constants.js";

export const createWorkspaceValidator = () => [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Workspace name is required")
        .isLength({ min: 2, max: 80 })
        .withMessage("Workspace name must be between 2 and 80 characters long"),

    body("slug")
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage("Slug must be between 2 and 50 characters long"),
];

export const addWorkspaceMemberValidator = () => [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email is invalid"),
    body("role")
        .trim()
        .notEmpty()
        .withMessage("Role is required")
        .isIn(AvailableWorkspaceRoles)
        .withMessage(
            `Role must be one of: ${AvailableWorkspaceRoles.join(", ")}`,
        ),
];

export const updateWorkspaceMemberRoleValidator = () => [
    body("role")
        .trim()
        .notEmpty()
        .withMessage("Role is required")
        .isIn(AvailableWorkspaceRoles)
        .withMessage(
            `Role must be one of: ${AvailableWorkspaceRoles.join(", ")}`,
        ),
];
