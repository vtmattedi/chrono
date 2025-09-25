type User = {
    userId: string;
    ip: string;
    alias: string;
    socketId: string[];
}

class UserHandler {
    public static users: Map<string, User> = new Map(); // userId -> User
    public static usersBySocket: Map<string, string> = new Map(); // socketId -> userId

    public createUser(ip: string, alias: string): User {
        const userId = this.issueNewUserId();
        const user: User = { userId, ip, alias, socketId: [] };
        UserHandler.users.set(userId, user);
        return user;
    }

    public addSocket(userId: string, socketId: string, ip: string | null = null) {
        const user = UserHandler.users.get(userId);
        if (!user) {
            console.log("User ID not found, creating new user with ID:", userId);
            const newuser: User = this.createUser(ip || 'unknown', 'anonymous');
            newuser.socketId.push(socketId);
            UserHandler.users.set(userId, newuser);
            console.log("Created new user:", newuser);
            UserHandler.usersBySocket.set(socketId, userId);
            console.log("Added socket:", socketId, "to user:", userId);
            return;
        }
        if (!user?.socketId.includes(socketId)) {
            user?.socketId.push(socketId);
        }
        UserHandler.usersBySocket.set(socketId, userId);
        console.log("Added socket:", socketId, "to user:", userId);
    }

    public issueNewUserId(): string {
        const newUserId = Math.random().toString(36).slice(2, 12);
        return newUserId;
    }

    public removeSocket(socketId: string) {
        if (UserHandler.usersBySocket.has(socketId)) {
            const userId = UserHandler.usersBySocket.get(socketId) as string;
            UserHandler.usersBySocket.delete(socketId);
            const user = UserHandler.users.get(userId);
            if (user) {
                user.socketId = user.socketId.filter(id => id !== socketId);
            }
        }

    }

    public getUserById(userId: string): User | null {
        return UserHandler.users.get(userId) || null;
    }

    // Get userId by socketId, if not found issue a new one
    public getUserId = (socketId: string): string => {
        if (UserHandler.usersBySocket.has(socketId)) {
            return UserHandler.usersBySocket.get(socketId) as string;
        }
        else {
            const newUserId = this.issueNewUserId();
            UserHandler.usersBySocket.set(socketId, newUserId);
            return newUserId;
        }
    }

    public listUsers(): User[] {
        return Array.from(UserHandler.users.values());
    }
}

export const userHandler = new UserHandler();