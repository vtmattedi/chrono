import { Server } from "./app"
import { assertDotEnv } from "./app/Asserter";
import jwt from "jsonwebtoken";
import { userHandler } from "./users";
import { chronoHandler } from "./chrono";
// Load the .env file
if (!assertDotEnv()) {
    console.log('failed to load .env.')
    throw new Error('Failed to load .env')
}


const app = new Server();

const startServer = (port: number) => {
    try {
        app.httpServer.listen(port);
    } catch (error) {
        if ((error as any).code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use, trying port ${port + 1}`);
            startServer(port + 1);
        }
        else {
            console.error('Failed to start server:', error);
            throw error;
        }
    }
}




startServer(Number(process.env.PORT ?? 4500));
chronoHandler.onChronoCreated = (chrono) => {
    chrono.onUpdate = (data, full) => {
        if (full) {
            app.io.to(chrono.sessionId).emit('fulltick', data);
        }
        else {
            app.io.to(chrono.sessionId).emit('tick', data);
        }
    }
    chronoHandler.onChronoDeleted = (sessionId) => {
        console.log("Session", sessionId, "ended, notifying clients");
        app.io.to(sessionId).emit('session-ended', { message: 'Session ended by owner' });
        app.io.socketsLeave(sessionId); // remove all sockets from the room
    }
}
chronoHandler.startAfkCheck((Number(process.env.AFK_CHECK_MINS) || 48 * 60)); // minutes

app.io.on("connection", (socket) => {
    socket.on("disconnect", () => {
        const userId = userHandler.getUserId(socket.id);
        userHandler.removeSocket(socket.id);
        chronoHandler.removeListener(userId).forEach(sessionId => {
            const room = sessionId;
            const count = chronoHandler.listenersCount(room);
            socket.to(room).emit("user-count", `${count}`); // update user count in the room
            socket.leave(room);
        });
    });

    socket.on("message", (msg) => {
        const data = JSON.parse(msg);
        if (data.type === "identify") {
            if (!data.message) {
                socket.send(JSON.stringify({ type: "error", message: "No token provided, disconnecting" }));
                socket.disconnect();
                return;
            }
            let payload: any;
            try {
                payload = jwt.verify(data.message, process.env.JWT_SECRET as string);
                userHandler.addSocket(payload.userId, socket.id, socket.handshake.address);
                socket.send(JSON.stringify({ type: "identify_result", message: {
                    success: true,
                    userId: payload.userId,
                    alias: payload.alias
                } }));
            } catch (err) {
                socket.send(JSON.stringify({ type: "error", message: "Invalid token, disconnecting" }));
                socket.disconnect();
                return;
            }
        } else if (data.type === "echo") {
            socket.send(JSON.stringify({ type: "echoresponse", message: data.message }));
        }
        else if (data.type === "join") {
            const sessionId = data.message;
            // console.log(data,data.message);
            const userId = userHandler.getUserId(socket.id);
            const result = chronoHandler.addListener(sessionId, userId);
            const adminRole = chronoHandler['chronos'].get(sessionId)?.isAuthorized(userId);
            const response = { type: "join_result", message: { success: false, errorMessage: "", userCount: result, role: adminRole ? "admin" : "user", config: "", state: "" } };
            // console.log(`User`, userId, `joining session`, sessionId, `from`, socket.id, `result:`, result, `role:`, response.message.role);
            if (result > 0) {
                const teamsConfig = chronoHandler['chronos'].get(sessionId)?.TeamsConfig() || "{}";
                response.message.config = teamsConfig;
                response.message.success = true;
                response.message.state = JSON.stringify(chronoHandler['chronos'].get(sessionId)?.getState(true) || {});
                socket.to(sessionId).emit("user-count", `${result}`); // update user count in the room
                socket.join(sessionId);
            }
            else {
                response.message.success = false;
                response.message.errorMessage = "Failed to join session";
            }
            socket.send(JSON.stringify(response));
        }
        else if (data.type === "action") {
            // const sessionId = 
            const { sessionId, action } = data.message;
            const userId = userHandler.getUserId(socket.id);
            // socket.send(JSON.stringify({ type: "info", message: `User ${userId} performing action ${action.type} on session ${sessionId} from ${socket.id}` }));
            const { result, message } = chronoHandler.dispatchAction(sessionId, userId, action);
            if (result)
                socket.to(sessionId).emit('action', action);
            else {
                socket.send(JSON.stringify({ type: "error", message: message }));
            }
        }
    });

    socket.on("ping",
        () => {
            socket.emit("pong");
        }
    )

});

console.log(`Server started on port ${process.env.PORT ?? 4500}`);


