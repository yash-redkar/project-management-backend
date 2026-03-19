import { Workspace } from "../models/workspace.models.js";
import { WorkspaceMember } from "../models/workspacemember.models.js";
import { Project } from "../models/project.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const PLAN_LIMITS = {
    free: {
        maxProjects: 10,
        maxMembers: 10,
    },
    pro: {
        maxProjects: 50,
        maxMembers: 25,
    },
    business: {
        maxProjects: 9999,
        maxMembers: 9999,
    },
};

export const getWorkspaceBillingSummary = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const userId = req.user._id;

    const workspace = await Workspace.findById(workspaceId).lean();

    if (!workspace) {
        throw new ApiError(404, "Workspace not found");
    }

    const membership = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: userId,
        status: "active",
    }).lean();

    if (!membership) {
        throw new ApiError(403, "Access denied: Not a workspace member");
    }

    const [projectsCount, membersCount] = await Promise.all([
        Project.countDocuments({ workspace: workspaceId }),
        WorkspaceMember.countDocuments({
            workspace: workspaceId,
            status: "active",
        }),
    ]);

    const plan = workspace.plan || "free";
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                workspace: {
                    _id: workspace._id,
                    name: workspace.name,
                    slug: workspace.slug,
                    plan,
                    createdAt: workspace.createdAt,
                },
                usage: {
                    projects: projectsCount,
                    members: membersCount,
                },
                limits,
                paymentMethod: null,
                billingStatus: plan === "free" ? "free" : "active",
                subscription: {
                    billingCustomerId: workspace.billingCustomerId || "",
                    subscriptionId: workspace.subscriptionId || "",
                },
            },
            "Workspace billing summary fetched successfully",
        ),
    );
});
