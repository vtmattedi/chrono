
import { Request, Response } from "express";
import { chronoHandler } from '../../ChronoBasics/chronoHandler';
import { userHandler } from "../Model/users";


/**
 * AuthController class handles user authentication operations such as sign-up, login, token refresh, and logout.
 */
class ChronoAdminController {

    public listUsers = (req: Request, res: Response): void => {
        const users = userHandler.listUsers().map(u => ({ userId: u.userId, alias: u.alias, sockets: u.socketId.length, role: u.isAdmin() ? 'admin' : 'user' }));
        res.status(200).json({ users });
    }

    public listSessions = (req: Request, res: Response): void => {
        const sessions = chronoHandler.listChronos();
        res.status(200).json({ sessions });
    }

    public killChrono = (req: Request, res: Response): void => {
        const { sessionId } = req.body;
        if (!sessionId || typeof sessionId !== 'string') {
            res.status(400).json({ message: 'Invalid sessionId provided' });
            return;
        }
        const success = chronoHandler.killChrono(sessionId);
        if (success) {
            res.status(200).json({ message: 'Chrono killed successfully' });
        } else {
            res.status(404).json({ message: 'Chrono not found' });
        }
    }

    public changeOwner = (req: Request, res: Response): void => {
        const { sessionId, newOwnerId } = req.body;
        if (!sessionId || typeof sessionId !== 'string' || !newOwnerId || typeof newOwnerId !== 'string') {
            res.status(400).json({ message: 'Invalid sessionId or newOwnerId provided' });
            return;
        }
        const user = userHandler.getUserById(newOwnerId);
        if (!user) {
            res.status(404).json({ message: 'New owner user not found' });
            return;
        }
        const chrono = chronoHandler.getChronoById(sessionId);
        if (!chrono) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }
        chrono.owner = newOwnerId;
        res.status(200).json({ message: 'Owner changed successfully' });
    }
 
}

export const chronoAdminController = new ChronoAdminController();
