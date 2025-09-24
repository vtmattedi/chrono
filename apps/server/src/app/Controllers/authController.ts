
import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { createUser, getUsersByEmail } from "../Model/user";
import * as Crypto from 'crypto';
import { createToken, deleteToken, isTokenValid, deleteTokenByUserId } from '../Model/refreshtokens';
import { Asserter, assertDotEnv } from '../Asserter';
import { getUserById, deleteUser } from "../Model/user";

// Issue a new access token to a user with 15 seconds expiration
const issueAcesstoken = (uid: string) => {
    return jwt.sign({ uid: uid }, process.env.JWT_SECRET as string, { expiresIn: '15s' });
}

// Issue a new refresh token to a user with 72 hours expiration
const issueRefreshToken = async (uid: number) => {
    const refreshToken = jwt.sign({ uid: uid }, process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: '72h' });
    const res = await createToken(refreshToken, uid);
    return { result: res, token: refreshToken };

}



/**
 * AuthController class handles user authentication operations such as sign-up, login, token refresh, and logout.
 */
class AuthController {

    /**
    * Handles user sign-up by validating input, checking for existing users, hashing the password, and issuing tokens.
    * 
    * @param req - Express request object containing username, password, and email in the body.
    * @param res - Express response object used to send responses to the client.
    */
    public signUp = async (req: Request, res: Response) => {

        if (!assertDotEnv()) {
            res.status(500).send({ message: 'Internal Server Error 065' });
            throw new Error('dot env failed to load');
        }

        //console.log(process.env);
        const { username, password, email } = req.body;

        if (!username || !password || !email) {
            res.status(400).json({ message: 'email:Username and password and email are required' });
            res.send();
            return;
        }

        const _email = (email as string).toLowerCase();


        try {
            const users = await getUsersByEmail(_email);
            // Check if email is already registered
            if (users.found) {
                res.status(409).json({ message: 'email:Email already registered.' });
                return;
            }

            // Check if email, password and username are valid
            const emailCheck = Asserter.email(_email);
            const passwordCheck = Asserter.password(password);
            const usernameCheck = Asserter.username(username);

            if (!emailCheck.result || !passwordCheck.result || !usernameCheck.result) {
                let message = '';
                if (!emailCheck.result) {
                    message += "email:" + emailCheck.message;
                }
                if (!passwordCheck.result) {
                    message += ";password:" + passwordCheck.message;
                }
                if (!usernameCheck.result) {
                    message += ";user:" + usernameCheck.message;
                }
                res.status(400).json({ message: message });
                return;
            }

            // Hash the password opted for native crypto instead of bcrypt
            Crypto.scrypt(password, process.env.SCRYPT_SALT as string, 64, async (err, derivedKey) => {
                if (err) {
                    console.log(err);
                    res.status(500).json({ message: 'Internal server error' });
                    return;
                };
                const hashpwd = derivedKey.toString('base64');
                const userId = await createUser(username, hashpwd, email);
                const refTokenresult = await issueRefreshToken(userId);
                if (!refTokenresult.result) {
                    res.status(500).json({ message: 'Internal server error' });
                    return;
                }
                // Respond with the token
                res.cookie('refreshToken', refTokenresult.token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 72 * 60 * 60 * 1000 });
                res.status(201).json({ accessToken: issueAcesstoken(userId), uid: userId });
            });


        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal server error' });
            res.send();
        }

        return;
    }

    /**
    * Handles user login by validating input, checking credentials, and issuing tokens.
    * 
    * @param req - Express request object containing email and password in the body.
    * @param res - Express response object used to send responses to the client.
    */
    public login = async (req: Request, res: Response) => {
        // console.log("cookies", req.cookies);
        // console.log("signed cookies", req.signedCookies);
        if (!assertDotEnv()) {
            res.status(500).send({ message: 'Internal Server Error 065' });
            throw new Error('dot env failed to load');
        }
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).send({ message: 'Email and password are required.' });
            return;
        }

        const users = await getUsersByEmail(email);

        // Change this. class only for testing
        if (!users.found) {
            res.status(404).send({ message: 'creds:User or Password invalid.' });
            return;
        }
        Crypto.scrypt(password, process.env.SCRYPT_SALT as string, 64, async (err, derivedKey) => {
            if (err) {
                console.log(err);
                res.status(500).send({ message: 'Internal server error.' });
                return;
            }

            const pwd = derivedKey.toString('base64');
            if (pwd === users.user[0].password) {
                const uid = users.user[0].id; // id or user.

                // Create a JWT tokens
                const token = issueAcesstoken(uid);
                const refreshTokenResult = await issueRefreshToken(uid);
                if (!refreshTokenResult.result) {
                    res.status(500).send({ message: 'Internal server error.' });
                    return;
                }
                res.cookie('refreshToken', refreshTokenResult.token, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 72 * 60 * 60 * 1000 });
                res.status(200).json({ accessToken: token, uid: uid });
            }
            else {
                res.status(401).json({ message: 'creds:User or Password invalid.' });
            }
        });
    }

    /**
    * Handles token refresh by validating the refresh token and issuing a new access token.
    * 
    * @param req - Express request object containing refresh token in cookies.
    * @param res - Express response object used to send responses to the client.
    */
    public refreshToken = async (req: Request, res: Response) => {
        if (!assertDotEnv()) {
            res.status(500).send({ message: 'Internal Server Error 065' });
            throw new Error('dot env failed to load');
        }
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            res.status(400).send({ message: 'Refresh token is required.' });
            return;
        }
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string, async (err: any, decoded: any) => {
            if (err) {
                console.log(err)
                if (err.name === 'TokenExpiredError') {
                    const delRes = await deleteToken(refreshToken);
                    console.log("token expired:", refreshToken, "deletion:", delRes);
                    res.status(401).send({ message: 'Refresh token expired.' });
                    return ;
                }
                else
                {
                    console.log("Invalid decode for token: ", refreshToken);
                    res.status(401).send({ message: 'Invalid refresh token.' });
                    return;
                }
              
            }
            const { uid } = decoded;
            const tokenValid = await isTokenValid(refreshToken);
            if (!tokenValid) {
                console.log("Invalid token: ", refreshToken);
                res.status(401).send({ message: 'Invalid refresh token.' });
                return;
            }
            let tokens: any = {};
            const accessToken = issueAcesstoken(uid);
            tokens.accessToken = accessToken;
            tokens.uid = uid;
            // const refreshRefreshToken = 15 * 60 * 1000; // 15 minutes
            // if (exp * 1000 - Date.now() < refreshRefreshToken) {
            //     const newRefreshToken = await issueRefreshToken(uid);
            //     if (!newRefreshToken.result) {
            //         console.log("Error on new refresh token", newRefreshToken);
            //         res.status(500).send({ message: 'Internal server error.' });
            //         return;
            //     }
            //     deleteToken(refreshToken);
            //     tokens.refreshToken = newRefreshToken.token;
            // }
            res.status(200).json(tokens);
        });
    }

    /**
   * Handles user logout by invalidating the refresh token and clearing the cookie.
   * 
   * @param req - Express request object containing refresh token in cookies.
   * @param res - Express response object used to send responses to the client.
   */
    public logout = async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            res.status(400).send({ message: 'Refresh token is required.' });
            return;
        }
        if (!isTokenValid(refreshToken)) {
            res.clearCookie('refreshToken');
            res.status(401).send({ message: 'Invalid refresh token.' });
            return;
        }
        deleteToken(refreshToken);
        res.clearCookie('refreshToken');
        res.status(200).send({ message: 'Logout successful.' });
    }


    /**
    * Handles logout from all devices by invalidating all refresh tokens for the user and clearing the cookie.
    * 
    * @param req - Express request object containing refresh token in cookies.
    * @param res - Express response object used to send responses to the client.
    */
    public logoutFromAll = async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            res.status(400).send({ message: 'Refresh token is required.' });
            return;
        }
        if (!await isTokenValid(refreshToken)) {
            res.clearCookie('refreshToken');
            res.status(401).send({ message: 'Invalid refresh token.' });
            return;
        }
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string, async (err: any, decoded: any) => {
            if (err) {
                res.status(401).send({ message: 'Invalid refresh token.' });
                return;

            }
            const { uid } = decoded;
            const del_res = await deleteTokenByUserId(uid);

            res.clearCookie('refreshToken');
            res.status(200).send({ message: 'Logout successful.', terminated: del_res });

        });

    }


    /**
    * Handles requests to delete a user by user ID.
    * 
    * @param req - The request object containing the user ID in the body.
    * @param res - The response object used to send the response.
    * @returns A response indicating the result of the delete operation.
    */
    public deleteAccount = async (req: Request, res: Response) => {
        //Get the token
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            res.status(400).send({ message: 'Refresh token is required.' });
            return;
        }
        //Make sure it is a valid session
        if (!await isTokenValid(refreshToken)) {
            res.clearCookie('refreshToken');
            res.status(401).send({ message: 'Invalid refresh token.' });
            return;
        }
        //Get the user id from the token
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string, async (err: any, decoded: any) => {
            if (err) {
                res.status(401).send({ message: 'Invalid refresh token.' });
                return;

            }
            const { uid } = decoded;

            const user = (await getUserById(uid));
            if (!user.found) {
                //This should never happen
                //Means that a refresh token was issued for a user that does not exist
                //Or a user was deleted while still having a valid refresh token
                res.status(404).send({ message: 'User not found' });
                return;
            }
            
            // Prevent the test account from being deleted
            if (user.user.email === 'test@test.com') {
                res.status(403).send({ message: 'The test account cannot be deleted' });
                return;
            }


            //Delete ALL refresh tokens issued to the user at least 1 token should exist
            //since we verified that this is a valid session
            const deleteTokenByUserIdResult = await deleteTokenByUserId(uid);
            if (!deleteTokenByUserIdResult) {
                //Clear the cookie
                res.clearCookie('refreshToken');
                res.status(500).send({ message: 'Internal Server Error' });
                return;
            }

            //Delete the user
            console.log('deleting user:', uid);
            const result = await deleteUser(uid);
            if (result) {
                //Clear the cookie
                res.clearCookie('refreshToken');
                res.status(200).send({ message: 'User deleted' });
            }
            else {
                res.status(500).send({ message: 'Internal Server Error' });
            }

        });



    }
}

export const authController = new AuthController();