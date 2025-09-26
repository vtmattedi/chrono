
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
        const { teams, initialTime, start, isPublic } = req.body;
        // console.log("Starting session with token:", req.body);
        // console.log("Starting session with teams:", teams, "initialTime:", initialTime, "start:", start);
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
                console.log("User not found for token:", payload);
                res.status(401).json({ message: 'Invalid token' });
                return;
            }
            const owner = isPublic === true ? 'all' : payload.userId;
            const chrono = chronoHandler.createChrono(owner, teams, initialTime, start === true, isPublic === true);
            console.log("Created session with ID:", chrono.sessionId, "with owner:", owner, "start: ", start);
            res.status(200).json({ sessionId: chrono.sessionId });
            return;
        } catch (err) {
            res.status(401).json({ message: 'Invalid token' });
            return;
        }
    }

    public killSession = (req: Request, res: Response): void => {
        const token = req.headers['authorization']?.split(' ')[1];
        const { sessionId } = req.body;
        if (!token) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }
        if (!sessionId || typeof sessionId !== 'string') {
            res.status(400).json({ message: 'Invalid sessionId provided' });
            return;
        }
        let payload: any;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET as string);
            const user = userHandler.getUserById(payload.userId);
            if (!user) {
                res.status(401).json({ result: false, message: 'Invalid token' });
                return;
            }
            const chrono = chronoHandler['chronos'].get(sessionId) || null;
            if (!chrono) {
                res.status(200).json({ result: false, message: 'Session not found' });
                return;
            }
            if (!chrono.isCreatedBy(payload.userId)) {
                res.status(200).json({ result: false, message: 'user not authorized' });
                return;
            }
            chronoHandler.killChrono(sessionId);
            res.status(200).json({ result: true, message: 'Session killed' });
            console.log("Killed session with ID:", sessionId);
            return;
        } catch (err) {
            res.status(401).json({ result: false, message: 'Invalid token' });
            return;
        }
    }

    public getSessionsWithId = (req: Request, res: Response): void => {
        const token = req.headers['authorization']?.split(' ')[1];
        // console.log("Starting session with token:", req.body);
        // console.log("Starting session with teams:", teams, "initialTime:", initialTime, "start:", start);
        if (!token) {
            res.status(401).json({ message: 'No token provided' });
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
            const sessions = chronoHandler.listChronos().filter(s => s.owner === payload.userId || s.owner === 'all');
            res.status(200).json({ sessions: [...sessions.map(s => (s.sessionId))] });
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
        res.status(200).json({ sessionId: chrono.sessionId });
    }

    public setOwner = (req: Request, res: Response): void => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }
        const { sessionId } = req.body;
        if (!sessionId) {
            res.status(400).json({ message: 'No sessionId provided' });
            return;
        }

        let payload: any;
        try {
            const chrono = chronoHandler['chronos']?.get(sessionId) || null;
            if (!chrono) {
                res.status(404).json({ message: 'Session not found' });
                return;
            }
            payload = jwt.verify(token, process.env.JWT_SECRET as string);
            chrono['owner'] = (payload.userId);
        } catch (err) {
            res.status(401).json({ message: 'Invalid token' });
            return;
        }
        res.status(200).json({ message: 'Owner updated successfully' });

    }
}

export const chronoController = new ChronoController();