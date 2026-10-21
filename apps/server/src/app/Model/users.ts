import { logger_e } from "../Util/Logger";

type userRole = 'user' | 'admin';

export class User {
    userId: string;
    alias: string;
    socketId: string[];
    role: userRole;

    constructor(userId: string, alias?: string) {
        this.userId = userId;
        this.alias = alias || 'anonymous';
        this.role = 'user';
        this.socketId = [];
    }

    public setRole(role: userRole) {
        this.role = role;
    }

    public isAdmin(): boolean {
        return this.role === 'admin';
    }

    public hasSocket(socketId: string): boolean {
        return this.socketId.includes(socketId);
    }

    public removeSocket(socketId: string) {
        this.socketId = this.socketId.filter(id => id !== socketId);
    }

    public addSocket(socketId: string) {
        if (!this.socketId.includes(socketId)) {
            this.socketId.push(socketId);
        }
    }
}

export class UserHandler {
    public static users: Map<string, User> = new Map(); // userId -> User
    public static usersBySocket: Map<string, string> = new Map(); // socketId -> userId

    public createUser(alias: string): User {
        const userId = this.issueNewUserId();
        const user: User = new User(userId, alias);
        UserHandler.users.set(userId, user);
        return user;
    }
    public createUserWithId(userId: string, alias: string): User {
        let user = UserHandler.users.get(userId);
        if (!user) {
            user = new User(userId, alias);
            UserHandler.users.set(userId, user);
        }
        else {
            //conflict - userId already exists
            console.log("UserId conflict on createUserWithId:", userId);
            user.alias = alias; //update alias
        }
        return user;
    }

    public addSocket(userId: string, socketId: string) {
        const user = UserHandler.users.get(userId);
        if (!user) {
            logger_e("User not found for adding socket:", userId);
            return false;
        }
        user.addSocket(socketId);
        UserHandler.usersBySocket.set(socketId, userId);
        return true;
        // console.log("Added socket:", socketId, "to user:", userId);
    }

    public issueNewUserId(): string {
        const newUserId = Math.random().toString(36).slice(4, 12);
        return newUserId;
    }

    public removeSocket(socketId: string) {
        if (UserHandler.usersBySocket.has(socketId)) {
            const userId = UserHandler.usersBySocket.get(socketId) as string;
            UserHandler.usersBySocket.delete(socketId);
            const user = UserHandler.users.get(userId);
            if (user) {
                user.removeSocket(socketId);
            }
        }

    }

    public getUserById(userId: string): User | null {
        return UserHandler.users.get(userId) || null;
    }

    // Get userId by socketId, if not found issue a new one
    public getUserIdBySocket = (socketId: string): string | null => {
        if (UserHandler.usersBySocket.has(socketId)) {
            return UserHandler.usersBySocket.get(socketId) as string;
        }
        return null;
    }

    public listUsers(): User[] {
        return Array.from(UserHandler.users.values());
    }
}

export const userHandler = new UserHandler();