import { sql } from './db';
import { UsernameLookup } from './UsernameLookup';
/* User Related Model */

/*Class representing a user from the db*/
class User {
    id: Number;
    username: String;
    password: String;
    email: String;
    created_at: Date;

    constructor(id: Number, username: String, password: String, email: String, created_at: Date) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.email = email;
        this.created_at = created_at;
    }


    //Converts the user to a web safe object (same user but without the password)
    toWebSafe()
    {
        return {id: this.id, username: this.username, email: this.email, created_at: this.created_at};
    }
}

//Gets all users
const getUsers =  async () => {
    const users = await sql('SELECT * FROM users') as Array<any>;
    return users;
}

//Searches for a user by username
const searchUser = async (username: String) => {
    const user = await sql("SELECT * FROM users WHERE username LIKE '%' || $1 || '%'", [username]) as Array<any>;
    return user.map((user:any) => new User(user.id, user.username, user.password, user.email, user.created_at));
}

//Creates a user
const createUser = async (username: String, password: String, email:String) => {
    const [result] = await sql('INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *', [username, password, email]) as any;
    UsernameLookup.addUsername(result.id, username);
    return (result.id);
}

//Gets a user by email
const getUsersByEmail = async (email: String) => {
    const user = await sql('SELECT * FROM users WHERE email = $1', [email]) as Array<any>;
    return {found: user.length > 0, user: user};
}

//Gets a user by id
const getUserById = async (id: Number) => {
    const user = await sql('SELECT * FROM users WHERE id = $1', [id]) as Array<any>;
    return {found: user.length > 0, user: user[0]}; 
    
}

//Modifies a user
const modifyUser = async (id: Number, username: String, email: String) => {
    const result = await sql('UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING *', [username, email, id]) as any;
    UsernameLookup.editUsername(id,username);
    return result.length > 0;
}

const deleteUser = async (id: Number) => {
    const result = await sql('DELETE FROM users WHERE id = $1 RETURNING *', [id]) as any;
    UsernameLookup.deleteUsername(id);
    return result.length > 0;
}




export { getUsers, createUser, getUsersByEmail, getUserById, User, modifyUser,searchUser ,deleteUser};