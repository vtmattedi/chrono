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
    // console.log("Issued token for userId:", user.userId, "alias:", user.alias);
    res.status(200).json({ token });
});

allRouter.post("/api/validatetoken", (req, res) => {
    
    const  token  = req.headers.authorization ? { token: req.headers['authorization'].split(' ')[1] } :  null ;
    console.log("Validating token:", token);
    if (!token || !token) {
        res.status(400).json({ valid: false, message: 'No token provided' });
        return;
    }
    else {
        try{
            const payload = jwt.verify(token.token, process.env.JWT_SECRET as string) as any;
            const { userId, alias } = payload;
            const user = userHandler.getUserById(userId);
            if (!user || user.alias !== alias) {
                res.status(401).json({ valid: false, message: 'Invalid userId' });
                console.log("Token invalid, user not found");
                return;
            }
            res.status(200).json({ valid: true, ...payload });
            console.log("Token valid for userId:", userId, "alias:", alias);
        } catch (err) {
            res.status(401).json({ valid: false, message: 'Invalid token' });
            console.log("Token invalid,");
        }

    }

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



export { allRouter };

