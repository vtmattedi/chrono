/*Routes every service provided by the server */

import { Router } from "express";
import jwt from "jsonwebtoken";
import { chronoHandler } from "../../ChronoBasics/chronoHandler";
import { userHandler } from "../Model/users";
import { chronoController } from "../Controllers/chronoController";
import { exec } from "child_process";
import {authMiddleware, adminAuthMiddleware} from "../Controllers/authMiddleware";
import { authController } from "../Controllers/authController";
import { chronoAdminController } from "../Controllers/chronoAdminController";
/* 'All in one' Router, may need to be splitted when scaling*/
const allRouter: Router = Router()

/* Health check*/
allRouter.get("/api/healthy", (req, res) => {
    res.status(200).send("Server is live.");
});

allRouter.post("/api/token", authController.newtoken);
allRouter.post("/api/validatetoken", authController.validateToken);

// Routes that need authentication
allRouter.post("/api/newsession", authMiddleware, chronoController.startSession);
allRouter.post("/api/killsession", authMiddleware, chronoController.killSession);
allRouter.post("/api/setowner", authMiddleware, chronoController.setOwner);
allRouter.get("/api/mysessions", authMiddleware, chronoController.getSessionsWithId);
allRouter.get("/api/sessionlog/:sessionId", authMiddleware, chronoController.getLog);
allRouter.get("/api/requestadmin", authMiddleware, authController.upgradeToAdmin);
allRouter.post("/api/updateroles", authMiddleware, chronoController.updateRoles);


// Admin routes
allRouter.get("/api/listsessions", adminAuthMiddleware, chronoAdminController.listSessions);
allRouter.get("/api/listusers", adminAuthMiddleware, chronoAdminController.listUsers);


export { allRouter };

