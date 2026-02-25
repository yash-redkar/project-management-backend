import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: ["project", "workspace", "task"],
            required: true,
            index: true,
        },

        // For project-level chat
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null,
            index: true,
        },

        // For task threads (later)
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tasks",
            default: null,
            index: true,
        },

        name: {
            type: String,
            trim: true,
            default: null, // e.g., "Project Chat"
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true },
);

// Ensure ONLY ONE project chat per project per workspace
conversationSchema.index(
    { workspace: 1, type: 1, project: 1 },
    { unique: true, partialFilterExpression: { type: "project" } },
);

// Ensure ONLY ONE workspace general chat per workspace
conversationSchema.index(
    { workspace: 1, type: 1 },
    { unique: true, partialFilterExpression: { type: "workspace" } },
);

// Ensure ONLY ONE task thread per task per workspace
conversationSchema.index(
  { workspace: 1, type: 1, task: 1 },
  { unique: true, partialFilterExpression: { type: "task" } }
);

export const Conversation = mongoose.model("Conversation", conversationSchema);
