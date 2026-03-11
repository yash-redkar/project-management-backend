import { Router } from "express";
import {
    searchTasks,
    searchProjects,
    searchMembers,
} from "../controllers/search.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/tasks", searchTasks);
router.get("/projects", searchProjects);
router.get("/members", searchMembers);

export default router;
