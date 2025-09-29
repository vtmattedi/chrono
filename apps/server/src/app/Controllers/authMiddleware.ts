
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { assertDotEnv } from '../Util/Asserter';
import { userHandler } from '../Model/users';
import { logger_w } from '../Util/Logger';

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
const authMiddleware = (req: Request, res: Response, next?: NextFunction) => {
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
    try {
        jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
            if (err) {
                res.status(401).send({ error: 'Invalid token.' });
                return;
            }
            // Attach the userId to the request body
            const { userId, alias } = decoded;
            req.body.userId = userId;
            const user = userHandler.getUserById(userId);
            if (!user) {
                logger_w("Creating user on the fly:", userId, alias);
                userHandler.createUserWithId(userId, alias);
            }
            if (next)
                next();
        }
        );

    } catch (err) {
        console.log("error on AuthMiddleWare:", err);
        res.status(500).send({ error: 'Something went wrong' });
    }
};



const adminAuthMiddleware = (req: Request, res: Response, next?: NextFunction) => {

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
            const user = userHandler.getUserById(userId);
            if (!user || !user.isAdmin()) {
                res.status(403).send({ error: 'Access denied.' });
                return;
            }
            if (next)
                next();
        }
        );

    } catch (err) {
        console.log("error on AdminAuthMiddleWare:", err);
        res.status(500).send({ error: 'Something went wrong' });
    }

}
export { authMiddleware, adminAuthMiddleware };