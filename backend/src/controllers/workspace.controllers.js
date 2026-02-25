import mongoose from "mongoose";
import { Workspace } from "../models/workspace.models.js";
import { WorkspaceMember } from "../models/workspacemember.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { WorkspaceRolesEnum } from "../utils/constants.js";

const slugify = (s = "") =>
    s
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

export const createWorkspace = asyncHandler(async (req, res) => {
    const { name, slug } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const finalSlug = slug ? slugify(slug) : slugify(name);

        const [workspace] = await Workspace.create(
            [{ name, slug: finalSlug, createdBy: req.user._id }],
            { session },
        );

        const [member] = await WorkspaceMember.create(
            [
                {
                    workspace: workspace._id,
                    user: req.user._id,
                    role: WorkspaceRolesEnum.OWNER,
                    status: "active",
                },
            ],
            { session },
        );

        await session.commitTransaction();
        session.endSession();

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    { workspace, member },
                    "Workspace created successfully",
                ),
            );
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        if (err?.code === 11000)
            throw new ApiError(409, "Workspace slug already exists");
        throw err;
    }
});

export const getMyWorkspaces = asyncHandler(async (req, res) => {
    const data = await WorkspaceMember.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user._id),
                status: "active",
            },
        },
        {
            $lookup: {
                from: "workspaces",
                localField: "workspace",
                foreignField: "_id",
                as: "workspace",
            },
        },
        { $unwind: "$workspace" },
        {
            $project: {
                _id: 0,
                role: 1,
                status: 1,
                workspace: {
                    _id: "$workspace._id",
                    name: "$workspace.name",
                    slug: "$workspace.slug",
                    plan: "$workspace.plan",
                    createdAt: "$workspace.createdAt",
                    createdBy: "$workspace.createdBy",
                },
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, data, "Workspaces fetched successfully"));
});
