
import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import * as Crypto from 'crypto';
import { Asserter, assertDotEnv } from '../Util/Asserter';
import { userHandler } from "../Model/users";
import { logger_i, logger_s, logger_w } from "../Util/Logger";
import { issueEncryptedJWT, verifyAndDecryptJWT } from "../Util/tokens";
class AuthController {
    public newtoken = async (req: Request, res: Response): Promise<void> => {
        // Creates a new token for the given alias, or refreshes the token if the old one is valid
        const oldtoken = req.header('authorization')?.replace('Bearer ', '');
        const { alias } = req.body;
        let userId = null;
        if (oldtoken) {
            const oldpayload: any = await verifyAndDecryptJWT(oldtoken);
            userId = oldpayload?.userId;
        }
        let user;
        if (userId) {
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
        const token = await issueEncryptedJWT({
            userId: user.userId,
            alias: user.alias,
            role: user.role
        });
        logger_s("Issued token for userId:", token);
        // console.log("Issued token for userId:", user.userId, "alias:", user.alias);
        res.status(200).json({ token });

    }
    public validateToken = async (req: Request, res: Response): Promise<void> => {

        const token = req.header('authorization')?.replace('Bearer ', '');

        if (!assertDotEnv()) {
            res.status(500).send({ error: 'Internal Server Error 065' });
            return;
        }

        if (!token) {
            res.status(401).send({ error: 'Access denied. No token provided.' });
            return;
        }
        const payload = await verifyAndDecryptJWT(token);
        if (!payload) {
            res.status(401).send({ error: 'Invalid token.' });
            return;
        }
        const { userId , role } = payload as { userId: string, role: 'admin' | 'user' };
        req.body.userId = userId;
        req.body.role = role;
        const user = userHandler.getUserById(userId);
        logger_i("Validated token for:", userId, "alias:", user?.alias);
        if (!user) {
            res.status(404).json({ message: 'userID not found', valid: false, userId, role });
            return;
        }
        res.status(200).json({ valid: true, userId, role });
        return;

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