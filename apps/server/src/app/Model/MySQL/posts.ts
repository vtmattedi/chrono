import { sql } from "./db";
import { UsernameLookup } from '../Model/UsernameLookup';

// Class representing a post from the db
class Post {
    id: Number;
    title: String;
    content: String;
    user_id: Number;
    created_at: Date;

    constructor(id: Number, title: String, content: String, user_id: Number, created_at: Date) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.user_id = user_id;
        this.created_at = created_at;
    }

    static createPostWithUsername({ id, title, content, user_id, created_at }: any) {
        return { id, title, content, user_id, created_at, username: UsernameLookup.getUsername(user_id) }; 
    }

}

// Create a post
const createPost = async (title: String, content: String, user_id: Number) => {
    const [result] = await sql('INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)', [title, content, user_id]) as any;
    return (result.insertId);
};

// Delete a post
const deletePostById = async (id: Number) => {
    try {
        const [res] = await sql('DELETE FROM posts WHERE id = ?', [id]) as Array<any>;
        {
      
            if (res.length === 0) {
                return false;
            }
            else return true;
        }
    }
    catch (err) {
        console.log(err);
        return false;
    }
}

// Get all posts by a user
const getPostsByUserId = async (user_id: Number, size: number) => {
    const [posts] = await sql('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [user_id, size]) as Array<any>;
    return posts.map((post: any) => ({ ...post, username: UsernameLookup.getUsername(post.user_id) }));
}

// Get a post by its post id
const getPostById = async (id: Number) => {
    try {
        const [post] = await sql('SELECT * FROM posts WHERE id = ?', [id]) as Array<any>;
        return { found: post.length > 0, post: Post.createPostWithUsername(post[0]) };
    }
    catch (err) {
        console.log(err);
        return { found: false, post: null };
    }
}

// Get all posts
const getAllPosts = async (size?: Number) => {
    {
        const [posts] = await sql('SELECT * from posts ORDER BY created_at DESC LIMIT ?', [size]) as Array<any>;
        return posts.map((post: any) => ({ ...post, username: UsernameLookup.getUsername(post.user_id) }));
    }
}

// Get new posts
const getNewPosts = async (lastId?: Number) => {
    {
        const [posts] = await sql('SELECT * from posts WHERE id > ? ORDER BY created_at DESC', [lastId]) as Array<any>;
        return posts.map((post: any) => ({ ...post, username: UsernameLookup.getUsername(post.user_id) }));
    }
}

// Get new posts by a user
const getNewPostsByUserId = async (user_id: Number, lastId?: Number) => {
    {
        const [posts] = await sql('SELECT * from posts WHERE id > ? AND user_id = ? ORDER BY created_at DESC', [lastId, user_id]) as Array<any>;
        return posts.map((post: any) => ({ ...post, username: UsernameLookup.getUsername(post.user_id) }));
    }
}

// Edit a post
const editpost = async (id: Number, title: String, content: String) => {
    const [result] = await sql('UPDATE posts SET title = ?, content = ? WHERE id = ?', [title, content, id]) as any;
    return (result.affectedRows > 0);
}

export { createPost, deletePostById, getPostsByUserId, Post, getPostById, getAllPosts, getNewPosts, getNewPostsByUserId, editpost};