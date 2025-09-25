
import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { createUser, getUsersByEmail } from "../Model/user";
import * as Crypto from 'crypto';
import { createToken, deleteToken, isTokenValid, deleteTokenByUserId } from '../Model/refreshtokens';
import { Asserter, assertDotEnv } from '../Asserter';
import { getUserById, deleteUser } from "../Model/user";
import { chronoHandler } from '../../chrono';
import { Team } from '../../Teams';
import { userHandler } from "../../users";


/**
 * AuthController class handles user authentication operations such as sign-up, login, token refresh, and logout.
 */
class ChronoController {

    public startSession = (req: Request, res: Response): void => {
        const token = req.headers['authorization']?.split(' ')[1];
        const { teams, initialTime, start } = req.body;
        console.log("Starting session with token:", req.body);
        console.log("Starting session with teams:", teams, "initialTime:", initialTime, "start:", start);
        if (!token) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }
        if (!teams || !Array.isArray(teams) || teams.length === 0) {
            res.status(400).json({ message: 'Invalid teams provided' });
            return;
        }
        if (!initialTime || typeof initialTime !== 'number' || initialTime <= 0) {
            res.status(400).json({ message: 'Invalid initial time provided' });
            return;
        }
        let payload: any;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET as string);
            const user = userHandler.getUserById(payload.userId);
            if (!user) {
                res.status(401).json({ message: 'Invalid token' });
                return;
            }
            const chrono = chronoHandler.createChrono(payload.userId, teams, initialTime, start === true);
            console.log("Created session with ID:", chrono.sessionId, "for user:", user.userId, "alias:", user.alias);
            res.status(200).json({ sessionId: chrono.sessionId });
            return;
        } catch (err) {
            res.status(401).json({ message: 'Invalid token' });
            return;
        }
    }

    public getLog = (req: Request, res: Response): void => {
        const { sessionId } = req.params;
        if (!sessionId) {
            res.status(400).json({ message: 'No sessionId provided' });
            return;
        }
        const chrono = chronoHandler['chronos']?.get(sessionId) || null;
        if (!chrono) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }
        const log = chrono.getLog();
        res.status(200).json({ log });
        return;
    }

}

export const chronoController = new ChronoController();