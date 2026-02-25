import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized request: No token provided");
    }
    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
        );

        if (!user) {
            throw new ApiError(401, "Unauthorized request: User not found");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid or expired access token");
    }
});


export const validateProjectPermission = (roles = []) => {
    return asyncHandler(async (req, res, next) => {
        const { workspaceId, projectId } = req.params;

        if (!workspaceId) throw new ApiError(400, "Workspace ID is missing");
        if (!projectId) throw new ApiError(400, "Project ID is missing");

        if (
            !mongoose.Types.ObjectId.isValid(workspaceId) ||
            !mongoose.Types.ObjectId.isValid(projectId)
        ) {
            throw new ApiError(400, "Invalid workspaceId or projectId");
        }

        //  Project existence check
        const project = await Project.findOne({
            _id: projectId,
            workspace: workspaceId,
        }).select("_id workspace");
        if (!project)
            throw new ApiError(404, "Project not found in this workspace");

        //  Project membership check
        const projectMember = await ProjectMember.findOne({
            workspace: workspaceId,
            project: projectId,
            user: req.user._id,
        });

        if (!projectMember)
            throw new ApiError(403, "Access denied: Not a project member");

        req.project = project;
        req.projectMember = projectMember;
        req.projectRole = projectMember.role;

        if (roles.length > 0 && !roles.includes(projectMember.role)) {
            throw new ApiError(403, "Forbidden: Insufficient permissions");
        }

        next();
    });
};
