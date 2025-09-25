/*Routes every service provided by the server */

import { Router } from "express";
import jwt from "jsonwebtoken";
import { chronoHandler } from "../..//chrono";
import { userHandler } from "../../users";
import { chronoController } from "../Controllers/chronoController";
import { exec } from "child_process";
/* 'All in one' Router, may need to be splitted when scaling*/
const allRouter: Router = Router()

/* Health check*/
allRouter.get("/api/healthy", (req, res) => {
    res.status(200).send("Server is live.");
});

allRouter.post("/api/token", (req, res) => {
    const { alias } = req.body;
    console.log("Creating token for alias:", alias, "from IP:", req.ip);
    const user = userHandler.createUser(req.ip || 'unknown', alias || 'anonymous');
    const token = jwt.sign({
        alias: alias || 'anonymous',
        userId: user.userId
    }, process.env.JWT_SECRET as string);
    res.status(200).json({ token });
});

allRouter.post("/api/newsession", chronoController.startSession);



allRouter.get("/api/listsessions", (req, res) => {
        const sessions = chronoHandler.listChronos();
        res.status(200).json({ sessions });
});

allRouter.get("/api/listusers", (req, res) => {
        const users = userHandler.listUsers();
        res.status(200).json({ users });
});

allRouter.get("/webhook/frontend", (req, res) => {
    res.status(200).send("Received");
    console.log("Pulling new code from GitHub")
    exec('node run.js', (error: any, stdout: any, stderr: any) => {
        if (error) {
            console.error(`Error executing script: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
});

export { allRouter };

