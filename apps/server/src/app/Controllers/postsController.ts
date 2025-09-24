
import { Request, Response } from 'express';
import { getUserById } from '../Model/user';
import * as Posts from '../Model/posts';
import { parse } from 'path';


/**
 * Interface representing a deleted post.
 * @property {Number} id - The unique identifier of the deleted post.
 * @property {Date} when - The date and time when the post was deleted.
 */
interface deletedPost {
    id: Number,
    when: Date
}
// Keep track of the id of deleted posts
const deletedPostsId: Array<deletedPost> = []

// Clean up the deleted posts older than 10 minutes every 10 minutes
const cleanDeletedPostIds = setInterval(() => {
    const now = new Date();
    for (const post of deletedPostsId) {
        if (now.getTime() - post.when.getTime() > 10 * 60 * 1000) {
            const index = deletedPostsId.indexOf(post);
            deletedPostsId.splice(index, 1);           
        }        
    }
}, 10 * 60 * 1000);

/**
 * The PostController class handles various operations related to posts, including creating, editing, deleting, and retrieving posts.
 * 
 * @class
 * 
 * @remarks
 * This class includes methods to:
 * - Edit a post (`handleEditPost`)
 * - Create a new post (`handleCreatePost`)
 * - Delete a post (`handleDeletePost`)
 * - Retrieve posts by user ID (`getPostsByUserId`)
 * - Retrieve all posts (`getAllPosts`)
 * - Retrieve new posts (`getNewPosts`)
 * 
 * Each method validates the request, performs the necessary operations, and sends appropriate HTTP responses.
 * 
 * @example
 * // Example usage:
 * const postController = new PostController();
 * 
 * // Express route handlers
 * app.post('/editPost', postController.handleEditPost);
 * app.post('/createPost', postController.handleCreatePost);
 * app.delete('/deletePost', postController.handleDeletePost);
 * app.get('/posts/:id', postController.getPostsByUserId);
 * app.get('/allPosts', postController.getAllPosts);
 * app.get('/newPosts', postController.getNewPosts);
 */

class PostController {

    /**
    * Handles the request to edit a post.
    * 
    * @param req - The request object containing the post details and user ID.
    * @param res - The response object used to send back the desired HTTP response.
    * 
    * @remarks
    * - Validates the presence of `postId`, `title`, and `content` in the request body.
    * - Checks if the post exists and if the user is authorized to edit it.
    * - Updates the post with the new title and content.
    * - Sends appropriate HTTP responses based on the validation and update results.
    * 
    * @returns A JSON response indicating the success or failure of the post update operation.
    */
    handleEditPost = async (req: Request, res: Response) => {
        const { uid } = req.body;
        const { postId, title, content } = req.body;
        console.log('edit post:', postId, title, content);
        if (!postId || postId < 0) {
            res.status(400).send({ message: 'Post id is required' });
            return;
        }

        const post = await Posts.getPostById(parseInt(postId as string));
        if (!post.found) {
            res.status(404).send({ message: 'Post not found' });
            return;
        }

        if (post.post?.user_id !== uid) {
            res.status(403).send({ message: 'Unauthorized' });
            return;
        }
        if (!title || !content) {
            res.status(400).send({ message: 'Title and content are required' });
            return;
        }
        const updated = await Posts.editpost(parseInt(postId as string), title, content);
        if (!updated) {
            res.status(500).send({ message: 'Internal Server Error' });
            return;
        }
        res.status(200).send({ message: 'Post updated' });

    }

    /**
    * Handles the request to create a new post.
    * 
    * @param req - The request object containing the post details and user ID.
    * @param res - The response object used to send back the desired HTTP response.
    * 
    * @remarks
    * - Validates the presence of `title` and `content` in the request body.
    * - Checks if the user exists and is authorized to create a post.
    * - Creates a new post with the provided title and content.
    * - Sends appropriate HTTP responses based on the validation and creation results.
    * 
    * @returns A JSON response indicating the success or failure of the post creation operation, including the new post ID if successful.
    */
    handleCreatePost = async (req: Request, res: Response) => {
        const userId = req.body.uid;
        const user = (await getUserById(userId));
        if (!user.found) {
            res.status(404).send({ message: 'User not found' });
            return;
        }

        const { title, content } = req.body;
        if (!title || !content) {
            res.status(400).send({ message: 'Title and content are required' });
            return;
        }
        const postId = await Posts.createPost(title, content, userId);
        if (!postId) {
            res.status(500).send({ message: 'Internal Server Error' });
            return;
        }
        res.status(200).send({ message: 'Post created', id: postId });

    }

    /**
    * Handles the request to delete a post.
    * 
    * @param req - The request object containing the post ID and user ID.
    * @param res - The response object used to send back the desired HTTP response.
    * 
    * @remarks
    * - Validates the presence of `postId` in the request query.
    * - Checks if the post exists and if the user is authorized to delete it.
    * - Deletes the post if validation passes.
    * - Sends appropriate HTTP responses based on the validation and deletion results.
    * 
    * @returns A JSON response indicating the success or failure of the post deletion operation.
    */
    handleDeletePost = async (req: Request, res: Response) => {
        const { uid } = req.body;
        const { postId } = req.query;
        if (!postId) {
            res.status(400).send({ message: 'Post id is required' });
            return;
        }

        const post = await Posts.getPostById(parseInt(postId as string));
        if (!post.found) {
            res.status(404).send({ message: 'Post not found' });
            return;
        }

        if (post.post?.user_id !== uid) {
            res.status(403).send({ message: 'Unauthorized' });
            return;
        }
        console.log('deleting post:', postId);
        const deleted = await Posts.deletePostById(parseInt(postId as string));

        if (!deleted) {
            res.status(500).send({ message: 'Internal Server Error' });
            return;
        }
        deletedPostsId.push({ id: parseInt(postId as string), when: new Date() });
        console.log('adding post delete:', deletedPostsId.length);
        res.status(200).send({ message: 'Post deleted' });
    }
    
    /**
     * Retrieves posts by user ID.
     *
     * This asynchronous function handles HTTP GET requests to fetch posts associated with a specific user ID.
     * The user ID can be provided either in the request body (`uid`) or as a parameter in the URL path.
     * If the user ID is found in the URL path, it takes precedence over the ID in the request body.
     *
     * @param req - The HTTP request object, containing the user ID in the body or as a URL parameter.
     * @param res - The HTTP response object, used to send back the retrieved posts.
     *
     * @returns A promise that resolves to sending an HTTP response with the retrieved posts.
     */
    getPostsByUserId = async (req: Request, res: Response) => {
        const { uid } = req.body;
        const num = parseInt(req.params.id);
        const size = parseInt(req.query.size as string);
      //  console.log('get posts:',req.params ,req.query);
        const finalSize = (isNaN(size) || size < 1)? 100 : size;
        let targetid = uid;
        if (!isNaN(num) && num > 0) {
            targetid = num;
        }
     //   console.log('get posts:',targetid, finalSize);
        if (targetid) {
            const posts = await Posts.getPostsByUserId(targetid, finalSize);
            res.status(200).send({ posts });
            return;
        }
        try {
            const posts = await Posts.getPostsByUserId(uid, finalSize);
            res.status(200).send({ posts });
        }
        catch (err) {
            res.status(500).send({ message: 'Internal Server Error' });
        }
    }

    /**
     * Retrieves all posts from the database.
     * 
     * @param req - The request object, containing query parameters.
     * @param res - The response object used to send back the desired HTTP response.
     * 
     * @remarks
     * If a `size` query parameter is provided, it will limit the number of posts returned.
     * 
     * @returns A JSON response containing the list of posts.
     */
    getAllPosts = async (req: Request, res: Response) => {
        const { size } = req.query;
        const num = parseInt(size as string);
        try {
            const posts = await Posts.getAllPosts((isNaN(num)||num ===0) ? num:100);
            res.status(200).send({ posts });
        }
        catch (err) {
            res.status(500).send({ message: 'Internal Server Error' });
        }
    }

    /**
    * Retrieves new posts from the database.
    * 
    * @param req - The request object, containing query parameters `targetId` and `lastId`.
    * @param res - The response object used to send back the desired HTTP response.
    * 
    * @remarks
    * - If both `targetId` and `lastId` query parameters are provided, it will return new posts for the specified user since the last post ID.
    * - If only `lastId` is provided, it will return new posts since the last post ID.
    * - If neither parameter is provided, it will return a 400 status with an 'Invalid request' message.
    * 
    * @returns A JSON response containing the list of new posts and the list of deleted post IDs.
    */
    getNewPosts = async (req: Request, res: Response) => {
        const { targetId, lastId } = req.query;

        if (targetId && lastId) {
            const posts = await Posts.getNewPostsByUserId(parseInt(targetId as string), parseInt(lastId as string));
            res.status(200).send({ posts: posts, deleted: deletedPostsId.map((post) => post.id) });
        }
        else if (lastId) {
            const posts = await Posts.getNewPosts(parseInt(lastId as string));
            res.status(200).send({ posts: posts, deleted: deletedPostsId.map((post) => post.id) });
        }
        else {
            res.status(400).send({ message: 'Invalid request' });
        }
    }
}

export const postController = new PostController();