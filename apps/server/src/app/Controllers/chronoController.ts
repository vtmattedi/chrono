
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
        const { userId, teams, initialTime, start, isPublic, alias, privateLogs } = req.body;

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
        if (privateLogs && typeof privateLogs === 'boolean') {
            chrono.publicLogs = !privateLogs;
        }
        logger_s('Created session', chrono.sessionId, userId, start, alias);
        res.status(200).json({ sessionId: chrono.sessionId });
        return;
    }

    public killSession = (req: Request, res: Response): void => {
        const { sessionId, userId } = req.body;

        if (!sessionId || typeof sessionId !== 'string') {
            res.status(400).json({ message: 'Invalid sessionId provided' });
            return;
        }
        const chrono = chronoHandler['chronos'].get(sessionId) || null;
        if (!chrono) {
            res.status(200).json({ result: false, message: 'Session not found' });
            return;
        }
        const user = userHandler.getUserById(userId);
        if (!user) {
            //This should never happens because this is under authMiddleware
            res.status(500).json({ result: false, message: 'User not found' });
            logger_e('User not found in killSession', req.body, req.headers);
            return;
        }
        if (!chrono.isCreatedBy(userId) && !user.isAdmin()) {
            res.status(200).json({ result: false, message: 'user not authorized' });
            return;
        }
        //Admin or owner - can kill
        chronoHandler.killChrono(sessionId);
        res.status(200).json({ result: true, message: 'Session killed' });
        console.log("Killed session with ID:", sessionId);
        return;
    }

    public getSessionsWithId = (req: Request, res: Response): void => {
        const { userId } = req.body;
        const user = userHandler.getUserById(userId);
        if (!user) {
            res.status(401).json({ message: 'Invalid token' });
            return;
        }
        const sessions = chronoHandler.listChronos().filter(s => s.owner === userId);
        res.status(200).json({ sessions });

    }

    public getLog = (req: Request, res: Response): void => {
        const { sessionId } = req.params;
        const { userId } = req.body;
        if (!sessionId) {
            res.status(400).json({ message: 'No sessionId provided' });
            return;
        }
        const chrono = chronoHandler.getChronoById(sessionId);
        if (!chrono) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }
        if (!chrono.publicLogs && !chrono.isAuthorized(userId)) {
            res.status(403).json({ message: 'Logs are private for this session' });
            return;
        }
        res.status(200).json({ log: chrono.getLog() });
    }

    public setOwner = (req: Request, res: Response): void => {
        const { sessionId, userId, newOwnerId } = req.body;
        if (!sessionId) {
            res.status(400).json({ message: 'No sessionId provided' });
            return;
        }
        const chrono = chronoHandler['chronos']?.get(sessionId) || null;
        if (!chrono) {
            res.status(404).json({ message: 'Session not found' });
            return;
        
        }
        const newOwner = userHandler.getUserById(newOwnerId);
        if (!newOwner) {
            res.status(404).json({ message: 'New owner user not found' });
            return;
        }
        if (chrono.owner !== userId && !userHandler.getUserById(userId)?.isAdmin()) {
            res.status(403).json({ message: 'Not authorized' });
            return;
        }
        chrono.owner = newOwnerId;
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