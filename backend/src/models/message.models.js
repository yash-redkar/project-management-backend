import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true,
        },

        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        text: {
            type: String,
            trim: true,
            default: "",
            maxlength: 5000,
        },

        attachments: [
            {
                url: String,
                publicId: String,
                resourceType: String,
                originalName: String,
                bytes: Number,
            },
        ],

        editedAt: {
            type: Date,
            default: null,
        },

        deletedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

// Fast message pagination
messageSchema.index({ conversation: 1, createdAt: -1 });

// admin/audit feeds later
messageSchema.index({ workspace: 1, createdAt: -1 }); 

export const Message = mongoose.model("Message", messageSchema);
