
import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import * as Crypto from 'crypto';
import { Asserter, assertDotEnv } from '../Util/Asserter';
import { userHandler } from "../Model/users";
import { logger_i, logger_w } from "../Util/Logger";
class AuthController {
    public newtoken = async (req: Request, res: Response): Promise<void> => {
        // Creates a new token for the given alias, or refreshes the token if the old one is valid
        const oldtoken = req.header('authorization')?.replace('Bearer ', '');
        const { alias } = req.body;
        let userId = null;
        if (oldtoken){
            jwt.verify(oldtoken, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
                if (err) {
                    return;
                }
                userId = decoded.userId;
            });
        }
        let user;
        if (userId){
            user = userHandler.getUserById(userId);
            logger_i("Renaming alias for:", userId, "from", user?.alias, "to", alias);
            if (!user) {
                user = userHandler.createUser(alias || 'anonymous');
            }
            else {
                user.alias = alias || user.alias;
            }
        }
        else {
             user = userHandler.createUser(alias || 'anonymous');
        }
        const token = jwt.sign({
            alias: alias || 'anonymous',
            userId: user.userId,
            role: user.isAdmin() ? 'admin' : 'user'
        }, process.env.JWT_SECRET as string);
        // console.log("Issued token for userId:", user.userId, "alias:", user.alias);
        res.status(200).json({ token });

    }
    public validateToken = (req: Request, res: Response): void => {

        const token = req.header('authorization')?.replace('Bearer ', '');

        if (!assertDotEnv()) {
            res.status(500).send({ error: 'Internal Server Error 065' });
            return;
        }

        if (!token) {
            res.status(401).send({ error: 'Access denied. No token provided.' });
            return;
        }
        try {
            jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
                if (err) {
                    res.status(401).send({ error: 'Invalid token.' });
                    return;
                }
                // Attach the userId and role to the request body
                const { userId, role } = decoded;
                req.body.userId = userId;
                req.body.role = role;
                const user = userHandler.getUserById(userId);
                logger_i("Validated token for:", userId, "alias:", user?.alias);
                if (!user) {
                    res.status(404).json({ message: 'userID not found', valid:false, userId, role });
                    return;
                }
                res.status(200).json({ valid: true, userId, role });
                return;
            }
            );

        } catch (err) {
            console.log("error on AdminAuthMiddleWare:", err);
            res.status(500).send({ error: 'Something went wrong' });
        }

    }

    public upgradeToAdmin = (req: Request, res: Response): void => {
        const { userId, userName, passwd } = req.body;
        if (!userId || !userName || !passwd) {
            res.status(400).json({ message: 'userId, userName and passwd are required' });
            return;
        }
        if (passwd !== process.env.ADMIN_PASSWD || userName !== process.env.ADMIN_NAME) {
            res.status(403).json({ message: 'Not authorized' });
            return;
        }
        const user = userHandler.getUserById(userId);
        user?.setRole('admin');
        res.status(200).json({ message: 'User upgraded to admin' });
    }
}

export const authController = new AuthController();