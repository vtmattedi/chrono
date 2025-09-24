import { sql } from './db';

export class UsernameLookup {
    /**
    * A map to store usernames with their corresponding user IDs.
    */
    static usernameMap = new Map<Number, String>();
    /**
    * Loads usernames from the database and populates the usernameMap.
    * 
    * @async
    * @returns {Promise<void>} A promise that resolves when the usernames are loaded.
    */
    static async loadUsernames() {
        try {
            const users = await sql('SELECT * FROM users') as Array<any>;
            for (const user of users) {
                UsernameLookup.addUsername(user.id, user.username);
            }
            console.log("Loaded usernames from database");
        }
        catch (err: any) {
            console.log("Error Loading usernames from database" ,err.message);
        }
    }

    /**
    * Adds a username to the usernameMap.
    * 
    * @param {Number} uid - The user ID.
    * @param {String} username - The username.
    */
    static addUsername(uid: Number, username: String) {
        UsernameLookup.usernameMap.set(uid, username);
    }
    
    /**
     * Deletes a username from the usernameMap.
     * 
     * @param {Number} uid - The user ID.
     */
    static deleteUsername(uid: Number) {
        UsernameLookup.usernameMap.delete(uid);
    }

    /**
    * Retrieves a username from the usernameMap.
    * 
    * @param {Number} uid - The user ID.
    * @returns {String | undefined} The username or "User deleted" if the user ID does not exist.
    */
    static getUsername(uid: Number) {
        if (!UsernameLookup.usernameMap.has(uid)) {
            return "User deleted";
        }
        return UsernameLookup.usernameMap.get(uid);

    }

    /**
     * Edits a username in the usernameMap.
     * 
     * @param {Number} uid - The user ID.
     * @param {String} username - The new username.
     */
    static editUsername(uid: Number, username: String) {
        UsernameLookup.usernameMap.set(uid, username);
    }
}