
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { assertDotEnv } from '../Util/Asserter';
import { userHandler } from '../Model/users';
import { logger_w } from '../Util/Logger';
import { verifyAndDecryptJWT } from '../Util/tokens';

/**
 * Middleware to authenticate requests using JWT.
 * 
 * This middleware checks for the presence of a JWT in the `authorization` header of the request.
 * If the token is present, it verifies the token using the secret key specified in the environment variables.
 * If the token is valid, it extracts the `uid` from the token and attaches it to the request body.
 * 
 * If the token is missing or invalid, it sends an appropriate error response.
 * 
 * @param req - The request object from Express.
 * @param res - The response object from Express.
 * @param next - The next middleware function in the stack.
 * 
 * @returns void
 * 
 * @throws Will send a 500 status code if there is an internal server error.
 * @throws Will send a 401 status code if the token is missing or invalid.
 */
const authMiddleware = async (req: Request, res: Response, next?: NextFunction) => {
    // Extract the token from the authorization header
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
    const { userId, alias, role } = payload as { userId: string, alias: string, role: 'admin' | 'user' };
    req.body.userId = userId;
    const user = userHandler.getUserById(userId);
    if (!user) {
        logger_w("Creating user on the fly:", userId, alias);
        userHandler.createUserWithId(userId, alias);
    }
    if (next)
        next();
};



const adminAuthMiddleware = async (req: Request, res: Response, next?: NextFunction) => {

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
    const { userId, alias, role } = payload as { userId: string, alias: string, role: 'admin' | 'user' };
    req.body.userId = userId;
    const user = userHandler.getUserById(userId);
    if (!user) {
       res.status(404).json({ message: 'userID not found', userId, role });
       return;
    }
    if (!user.isAdmin()) {
        res.status(403).send({ error: 'Access denied.' });
        return;
    }
    if (next)
        next();

}
export { authMiddleware, adminAuthMiddleware };