
type User = {
    userId: string;
    ip: string;
    alias: string;
    socketId: string[];
}

class UserHandler {
    public static users: Map<string, User> = new Map();
    public static usersBySocket: Map<string, string> = new Map(); // socketId -> userId

    public createUser(ip: string, alias: string): User {
        const userId = this.issueNewUserId();
        const user: User = { userId, ip, alias, socketId: [] };
        UserHandler.users.set(userId, user);
        return user;
    }

    public addSocket(userId: string, ip: string, alias: string, socketId: string) {
        if (!UserHandler.users.has(userId)) {
            const user: User = { userId, ip, alias, socketId: [socketId] };
            UserHandler.users.set(userId, user);
        }
        else {
            const user = UserHandler.users.get(userId) as User;
            if (!user.socketId.includes(socketId)) {
                user.socketId.push(socketId);
            }
            UserHandler.usersBySocket.set(socketId, userId);
        }
    }
    
    public issueNewUserId(): string {
        const newUserId = Math.random().toString(36).slice(2,12);
        return newUserId;
    }

    public removeSocket(socketId: string) {
        if (UserHandler.usersBySocket.has(socketId)) {
            const userId = UserHandler.usersBySocket.get(socketId) as string;
            UserHandler.usersBySocket.delete(socketId);
            const user = UserHandler.users.get(userId);
            if (user) {
                user.socketId = user.socketId.filter(id => id !== socketId);
                if (user.socketId.length === 0) {
                    UserHandler.users.delete(userId);
                }
            }
        }
    
    }

    // Get userId by socketId, if not found issue a new one
    public getUserId = (socketId: string): string => {
        if (UserHandler.usersBySocket.has(socketId)) {
            return UserHandler.usersBySocket.get(socketId) as string;
        }
        return this.issueNewUserId();
    }

    public listUsers(): User[] {
        return Array.from(UserHandler.users.values());
    }
}

export const userHandler = new UserHandler();