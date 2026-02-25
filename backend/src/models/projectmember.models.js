import mongoose, { Schema } from "mongoose";
import { UserRolesEnum } from "../utils/constants.js";

const projectMemberSchema = new Schema(
    {
        workspace: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true,
        },

        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },

        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        role: {
            type: String,
            enum: Object.values(UserRolesEnum),
            required: true,
            index: true,
        },
    },
    { timestamps: true },
);

projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });

export const ProjectMember = mongoose.model(
    "ProjectMember",
    projectMemberSchema,
);
