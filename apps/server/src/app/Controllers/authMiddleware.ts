
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { assertDotEnv } from '../Asserter';

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
    
    if (!assertDotEnv())
    {
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
            // Attach the uid to the request body
            const {uid} = decoded;
            req.body.uid = uid;
            if (next)
                next();
        }
        );
       
    } catch (err) {
        console.log("error on AuthMiddleWare:", err);
        res.status(500).send({ error: 'Something went wrong' });
    }
};

export default authMiddleware;