import { Notification } from "../models/notification.models.js";
import { getIO } from "../socket/index.js";

export const createNotification = async ({
    user,
    actor = null,
    workspace = null,
    project = null,
    task = null,
    type,
    message,
    meta = {},
}) => {
    const notification = await Notification.create({
        user,
        actor,
        workspace,
        project,
        task,
        type,
        message,
        meta,
    });

    try {
        const io = getIO();

        io.to(user.toString()).emit("notification", {
            _id: notification._id,
            actor,
            type,
            message,
            workspace,
            project,
            task,
            meta,
            isRead: notification.isRead,
            createdAt: notification.createdAt,
        });
    } catch (error) {
        console.log("Socket notification emit failed:", error.message);
    }

    return notification;
};
