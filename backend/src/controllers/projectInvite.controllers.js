import crypto from "crypto";
import mongoose from "mongoose";

import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { WorkspaceMember } from "../models/workspacemember.models.js";

import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

import { sendEmail, projectInviteMailgenContent } from "../utils/mail.js";
import { UserRolesEnum } from "../utils/constants.js";
import { createActivityLog } from "../utils/activity-log.js";
import { createNotification } from "../utils/notification.js";

const makeInviteToken = () => {
    const unHashedToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return { unHashedToken, hashedToken, expiresAt };
};

const ensureProjectAdminAccess = async (workspaceId, projectId, userId) => {
    const membership = await ProjectMember.findOne({
        workspace: workspaceId,
        project: projectId,
        user: userId,
        status: "active",
    });

    if (!membership) {
        throw new ApiError(403, "You are not a member of this project");
    }

    if (membership.role !== UserRolesEnum.ADMIN) {
        throw new ApiError(403, "Only project admin can perform this action");
    }

    return membership;
};

export const inviteToProject = asyncHandler(async (req, res) => {
    const { workspaceId, projectId } = req.params;
    const { email, role } = req.body;

    if (!mongoose.isValidObjectId(workspaceId)) {
        throw new ApiError(400, "Invalid workspaceId");
    }

    if (!mongoose.isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid projectId");
    }

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const normalizedEmail = email.toLowerCase().trim();

    const project = await Project.findOne({
        _id: projectId,
        workspace: workspaceId,
    });

    if (!project) {
        throw new ApiError(404, "Project not found in this workspace");
    }

    await ensureProjectAdminAccess(workspaceId, projectId, req.user._id);

    const invitedUser = await User.findOne({ email: normalizedEmail });

    if (!invitedUser) {
        throw new ApiError(
            404,
            "No user found with this email. Ask them to register first.",
        );
    }

    const workspaceMember = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: invitedUser._id,
        status: "active",
    });

    if (!workspaceMember) {
        throw new ApiError(
            400,
            "User must be an active workspace member before being invited to this project",
        );
    }

    const safeRole = role || UserRolesEnum.MEMBER;

    if (![UserRolesEnum.ADMIN, UserRolesEnum.MEMBER].includes(safeRole)) {
        throw new ApiError(400, "Invalid role");
    }

    const existing = await ProjectMember.findOne({
        workspace: workspaceId,
        project: projectId,
        user: invitedUser._id,
    });

    if (existing?.status === "active") {
        throw new ApiError(409, "User is already in project");
    }

    if (existing?.status === "invited") {
        throw new ApiError(409, "Invite already sent");
    }

    const { unHashedToken, hashedToken, expiresAt } = makeInviteToken();

    const member = await ProjectMember.create({
        workspace: project.workspace,
        project: projectId,
        user: invitedUser._id,
        role: safeRole,
        status: "invited",
        invitedBy: req.user._id,
        inviteTokenHash: hashedToken,
        inviteExpiresAt: expiresAt,
    });

    const acceptUrl = `${process.env.FRONTEND_URL}/invites/project/${unHashedToken}`;

    await sendEmail({
        email: invitedUser.email,
        subject: `Invite to project: ${project.name}`,
        mailgenContent: projectInviteMailgenContent(
            invitedUser.username,
            project.name,
            acceptUrl,
        ),
    });

    await createNotification({
        user: invitedUser._id,
        actor: req.user._id,
        workspace: project.workspace,
        project: project._id,
        type: "project_invite",
        message: `You were invited to project "${project.name}"`,
        meta: {
            invitedBy: req.user._id,
            invitedByEmail: req.user.email,
            role: safeRole,
        },
    });

    await createActivityLog({
        workspace: project.workspace,
        project: project._id,
        actor: req.user._id,
        entityType: "invite",
        action: "project_invite_sent",
        message: `Invited ${invitedUser.email} to project "${project.name}"`,
        meta: {
            invitedUserId: invitedUser._id,
            invitedEmail: invitedUser.email,
            role: safeRole,
        },
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { memberId: member._id },
                "Project invite sent",
            ),
        );
});

export const acceptProjectInvite = asyncHandler(async (req, res) => {
    const { token } = req.params;

    if (!token) {
        throw new ApiError(400, "Token missing");
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const member = await ProjectMember.findOne({
        inviteTokenHash: hashed,
        inviteExpiresAt: { $gt: new Date() },
        status: "invited",
    });

    if (!member) {
        throw new ApiError(400, "Invite token invalid or expired");
    }

    if (String(member.user) !== String(req.user._id)) {
        throw new ApiError(403, "This invite is not for your account");
    }

    member.status = "active";
    member.inviteTokenHash = null;
    member.inviteExpiresAt = null;

    await member.save({ validateBeforeSave: false });

    await createActivityLog({
        workspace: member.workspace,
        project: member.project,
        actor: req.user._id,
        entityType: "invite",
        action: "project_invite_accepted",
        message: `${req.user.email} accepted a project invite`,
        meta: {
            userId: req.user._id,
            projectMemberId: member._id,
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Project invite accepted"));
});

export const getProjectPendingInvites = asyncHandler(async (req, res) => {
    const { workspaceId, projectId } = req.params;

    await ensureProjectAdminAccess(workspaceId, projectId, req.user._id);

    const invites = await ProjectMember.find({
        workspace: workspaceId,
        project: projectId,
        status: "invited",
    })
        .populate("user", "email username")
        .populate("invitedBy", "username email")
        .select("user invitedBy inviteExpiresAt createdAt role");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                invites,
                "Pending project invites fetched successfully",
            ),
        );
});

export const cancelProjectInvite = asyncHandler(async (req, res) => {
    const { workspaceId, projectId, memberId } = req.params;

    await ensureProjectAdminAccess(workspaceId, projectId, req.user._id);

    const invitedMember = await ProjectMember.findOne({
        _id: memberId,
        workspace: workspaceId,
        project: projectId,
        status: "invited",
    });

    if (!invitedMember) {
        throw new ApiError(404, "Pending project invite not found");
    }

    await ProjectMember.deleteOne({ _id: invitedMember._id });

    await createActivityLog({
        workspace: invitedMember.workspace,
        project: invitedMember.project,
        actor: req.user._id,
        entityType: "invite",
        action: "project_invite_cancelled",
        message: `Cancelled a project invite`,
        meta: {
            projectMemberId: invitedMember._id,
            invitedUserId: invitedMember.user,
        },
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Project invite cancelled successfully"),
        );
});

export const resendProjectInvite = asyncHandler(async (req, res) => {
    const { workspaceId, projectId, memberId } = req.params;

    await ensureProjectAdminAccess(workspaceId, projectId, req.user._id);

    const invitedMember = await ProjectMember.findOne({
        _id: memberId,
        workspace: workspaceId,
        project: projectId,
        status: "invited",
    }).populate("user", "email username");

    if (!invitedMember) {
        throw new ApiError(404, "Pending project invite not found");
    }

    const project = await Project.findOne({
        _id: projectId,
        workspace: workspaceId,
    });

    if (!project) {
        throw new ApiError(404, "Project not found in this workspace");
    }

    const unHashedToken = crypto.randomBytes(32).toString("hex");
    const inviteTokenHash = crypto
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex");

    invitedMember.inviteTokenHash = inviteTokenHash;
    invitedMember.inviteExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    invitedMember.invitedBy = req.user._id;

    await invitedMember.save();

    const inviteUrl = `${process.env.FRONTEND_URL}/invites/project/${unHashedToken}`;

    await sendEmail({
        email: invitedMember.user.email,
        subject: `Invitation to join project ${project.name}`,
        mailgenContent: projectInviteMailgenContent(
            invitedMember.user.username || invitedMember.user.email,
            project.name,
            inviteUrl,
        ),
    });

    await createActivityLog({
        workspace: invitedMember.workspace,
        project: invitedMember.project,
        actor: req.user._id,
        entityType: "invite",
        action: "project_invite_resent",
        message: `Resent project invite to ${invitedMember.user.email}`,
        meta: {
            projectMemberId: invitedMember._id,
            invitedUserId: invitedMember.user._id,
            invitedEmail: invitedMember.user.email,
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Project invite resent successfully"));
});

export const cleanupExpiredProjectInvites = asyncHandler(async (req, res) => {
    const { workspaceId, projectId } = req.params;

    await ensureProjectAdminAccess(workspaceId, projectId, req.user._id);

    const result = await ProjectMember.deleteMany({
        workspace: workspaceId,
        project: projectId,
        status: "invited",
        inviteExpiresAt: { $lt: new Date() },
    });

    const project = await Project.findOne({
        _id: projectId,
        workspace: workspaceId,
    });

    if (!project) {
        throw new ApiError(404, "Project not found in this workspace");
    }

    await createActivityLog({
        workspace: project.workspace,
        project: projectId,
        actor: req.user._id,
        entityType: "invite",
        action: "project_expired_invites_cleaned",
        message: `Cleaned up ${result.deletedCount} expired project invites`,
        meta: {
            deletedCount: result.deletedCount,
        },
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { deletedCount: result.deletedCount },
                "Expired project invites cleaned up successfully",
            ),
        );
});
