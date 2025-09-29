
import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import * as Crypto from 'crypto';
import { Asserter, assertDotEnv } from '../Util/Asserter';
import { chronoHandler } from '../../ChronoBasics/chronoHandler';
import { Team } from '../../ChronoBasics/teams';
import { UserHandler, userHandler } from "../Model/users";
import { logger_e, logger_s } from "../Util/Logger";

/**
 * AuthController class handles user authentication operations such as sign-up, login, token refresh, and logout.
 */
class ChronoController {

    public startSession = (req: Request, res: Response): void => {
        const { userId, teams, initialTime, start, isPublic, alias } = req.body;

        if (!teams || !Array.isArray(teams) || teams.length === 0) {
            logger_e('Invalid teams provided', 'ChronoController.startSession');
            res.status(400).json({ message: 'Invalid teams provided' });
            return;
        }
        if (!initialTime || typeof initialTime !== 'number' || initialTime <= 0) {
            logger_e('Invalid initial time provided', 'ChronoController.startSession');
            res.status(400).json({ message: 'Invalid initial time provided' });
            return;
        }
        const chrono = chronoHandler.createChrono(userId, teams, initialTime, start === true, isPublic === true);
        if (alias && typeof alias === 'string' && alias.trim().length > 0) {
            chrono.alias = alias;
        }
        logger_s('Created session', 'ChronoController.startSession', chrono.sessionId, userId, start, alias);
        res.status(200).json({ sessionId: chrono.sessionId });
        return;
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
        if (!token) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }
        jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
            if (err) {
                res.status(401).json({ message: 'Invalid token' });
                return;
            }
            const user = userHandler.getUserById(decoded.userId);
            if (!user) {
                res.status(401).json({ message: 'Invalid token' });
                return;
            }
            const sessions = chronoHandler.listChronos().filter(s => s.owner === decoded.userId);
            res.status(200).json({ sessions });

        });

    }

    public getLog = (req: Request, res: Response): void => {
        const { sessionId } = req.params;
        if (!sessionId) {
            res.status(400).json({ message: 'No sessionId provided' });
            return;
        }
        const chrono = chronoHandler.getChronoById(sessionId);
        if (!chrono) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }
        res.status(200).json({ log: chrono.getLog() });
    }

    public setOwner = (req: Request, res: Response): void => {
        const token = req.headers['authorization']?.split(' ')[1];
        const admpwd = req.headers['x-adm-passwd'] as string || '';
        if (!token) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }
        const { sessionId } = req.body;
        if (!sessionId) {
            res.status(400).json({ message: 'No sessionId provided' });
            return;
        }
        if (admpwd !== process.env.ADM_PASSWD) {
            res.status(403).json({ message: 'Not authorized' });
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

    public updateRoles = (req: Request, res: Response): void => {
        const { userId, sessionId, targetUser, demote } = req.body;
        if (!userId || !sessionId || !targetUser) {
            res.status(400).json({ message: 'userId, sessionId and targetUser are required' });
            return;
        }
        const chrono = chronoHandler.getChronoById(sessionId);
        if (!chrono) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }
        if (chrono.owner !== userId) {
            res.status(403).json({ message: 'Not authorized' });
            return;
        }
        logger_s('Updating user role', 'ChronoController.updateRoles', sessionId, userId, targetUser, demote);
        chrono.modifyPrivileges(targetUser, demote === true);
        res.status(200).json({ message: 'User role updated successfully' });
        return;
    }

}

export const chronoController = new ChronoController();