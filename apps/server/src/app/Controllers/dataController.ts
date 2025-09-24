

import { Request, Response } from 'express';
import { getUserById, getUsers, getUsersByEmail, User, modifyUser, searchUser, deleteUser } from '../Model/user';
import { Asserter } from '../Asserter';

class DataController {

    /**
    * Handles requests to get user information by user ID.
    * 
    * @param req - The request object containing the user ID in the body.
    * @param res - The response object used to send the response.
    */
    handleUserById = async (req: Request, res: Response) => {
        const userId = req.body.uid;
        const user = (await getUserById(userId));
        if (!user.found) {
            res.status(404).send({ message: 'User not found' });
            return;
        }
        else
            res.status(200).send({ user: user.user.username, email: user.user.email, id: user.user.id, created_at: user.user.created_at });
    };

    /**
     * Handles requests to get information about other users.
     * 
     * @param req - The request object containing the user ID in the body.
     * @param res - The response object used to send the response.
     * @returns A response with information about other users.
     */
    handleGetOthers = async (req: Request, res: Response) => {

        const users = await getUsers() as Array<User>;
        const others = users.filter((user) => user.id !== req.body.uid);
        const otherUsers = others.map((user) => {
            return { user: user.username, email: user.email, id: user.id, created_at: user.created_at };
        });
        res.status(200).send({ users: otherUsers });
    }

    /**
    * Handles requests to get user information by user ID from the URL.
    * 
    * @param req - The request object containing the user ID in the URL.
    * @param res - The response object used to send the response.
    * @returns A response with user information or an error message.
    */
    handleUserInfoById = async (req: Request, res: Response) => {
        const user_search = req.url.substring(req.url.lastIndexOf('/') + 1);
        if (!user_search) {
            res.status(400).send({ message: 'No user provided' });
            return;
        }
        const userId = parseInt(user_search);
        if (!userId) {
            res.status(400).send({ message: 'Invalid user id' });
            return;
        }
        const user = (await getUserById(userId));
        if (!user.found) {
            res.status(404).send({ message: 'User not found' });
            return;
        }
        else
            res.status(200).send({ user: user.user.username, email: user.user.email, id: user.user.id, created_at: user.user.created_at });
    }

    /**
    * Handles requests to edit user information.
    * 
    * @param req - The request object containing the user ID and new user information in the body.
    * @param res - The response object used to send the response.
    * @returns A response indicating the result of the update operation.
    */
    handleEditUser = async (req: Request, res: Response) => {
        const userId = req.body.uid;
        const user = (await getUserById(userId));
        if (!user.found) {
            res.status(404).send({ message: 'User not found' });
            return;
        }
        const { username, email } = req.body;
       
        const _email = email ? (email as string).toLowerCase(): undefined;
        if (!username && !_email) {
            res.status(400).send({ message: 'Username or email are required' });
            return;
        }
        if (_email) {
            const find_res = await getUsersByEmail(_email);
            const emailValidation = Asserter.email(_email);
            if (find_res.found && find_res.user[0].id !== userId) {
                res.status(400).send({ message: 'Email already registered' });
                return;
            }
            else if (!emailValidation.result) {
                res.status(400).send({ message: emailValidation.message });
                return;
            }
        }
        const userNameValidation = Asserter.username(username);
        if (!userNameValidation.result) {
            res.status(400).send({ message: userNameValidation.message });
            return;
        }
        if (username === user.user.username && _email === user.user.email) {
            res.status(400).send({ message: 'No changes detected' });
            return;
        }
        /// if using test user reverse the changes after 1 hour
        if (user.user.email === 'test@tes.com') {
            setTimeout(() => {
                modifyUser(userId, "Testuser", user.user.email);
            }, 60*60*1000);
        }
        const result = await modifyUser(userId, username || user.user.username, email || user.user.email);
        if (result) {
            res.status(200).send({ message: 'User updated' });
        }
        else {
            res.status(500).send({ message: 'Internal Server Error' });
        }
    }

    /**
    * Handles requests to search for users by a search term in the URL.
    * 
    * @param req - The request object containing the search term in the URL.
    * @param res - The response object used to send the response.
    */
    getUser = async (req: Request, res: Response) => {
        const user_search = req.query.searchTerm as string;
        if (!user_search || user_search.length < 2) {
            res.status(200).send({ users: [] });
            return;
        }
        const users = await searchUser(user_search) as Array<User>;
        res.status(200).send({
            users: users.map((user) => { return user.toWebSafe(); })
        });
    }



}

export const dataController = new DataController();