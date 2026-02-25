import mongoose, { Schema } from "mongoose";
import { WorkspaceRolesEnum } from "../utils/constants.js";

const workspaceMemberSchema = new Schema(
    {
        workspace: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
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
            enum: Object.values(WorkspaceRolesEnum),
            default: WorkspaceRolesEnum.MEMBER,
            required: true,
            index: true,
        },

        status: {
            type: String,
            enum: ["active", "invited"],
            default: "active",
        },
    },
    { timestamps: true },
);

// ✅ one user only once in a workspace
workspaceMemberSchema.index({ workspace: 1, user: 1 }, { unique: true });

export const WorkspaceMember = mongoose.model(
    "WorkspaceMember",
    workspaceMemberSchema,
);
