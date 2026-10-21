import { jwtVerify } from "jose";
import { Server } from "./app";
import { userHandler } from "./app/Model/users";
import { logger_s } from "./app/Util/Logger";
import { chronoHandler } from "./ChronoBasics/chronoHandler";
import jwt from "jsonwebtoken";
import { verifyAndDecryptJWT } from "./app/Util/tokens";
export const configureWebsockets = (app: Server) => {

    chronoHandler.onChronoCreated = (chrono) => {
        chrono.onUpdate = (data, full) => {
            if (full) {
                app.io.to(chrono.sessionId).emit('fulltick', data);
            }
            else {
                app.io.to(chrono.sessionId).emit('tick', data);
            }
        }
        chrono.onUsersChanged = (data) => {
            app.io.to(chrono.sessionId).emit('users', data);
        }
    }

    chronoHandler.onChronoDeleted = (sessionId) => {
        app.io.to(sessionId).emit('session-ended', { message: 'Session ended by owner' });
        app.io.socketsLeave(sessionId); // remove all sockets from the room
    }

    app.io.on("connection", (socket) => {
        
        socket.on("disconnect", () => {
            const userId = userHandler.getUserIdBySocket(socket.id) as string;
            userHandler.removeSocket(socket.id);
            chronoHandler.removeListener(userId).forEach(sessionId => {
                const users = chronoHandler.getChronoById(sessionId)?.listUsers() || [];
                socket.leave(sessionId);
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

                verifyAndDecryptJWT(data.message).then(payload => {
                    if (!payload) {
                        socket.send(JSON.stringify({ type: "error", message: "Invalid token, disconnecting" }));
                        socket.disconnect();
                        return;
                    }
                    const result = userHandler.addSocket(payload.userId as string, socket.id);
                    socket.send(JSON.stringify({
                        type: "identify_result", message: {
                            success: result,
                            userId: payload.userId,
                            alias: payload.alias
                        }
                    }));
                });

            }
            else if (data.type === "echo") {
                socket.send(JSON.stringify({ type: "echoresponse", message: data.message }));
            }
            else if (data.type === "join") {
                const sessionId = data.message;
                // console.log(data,data.message);
                const userId = userHandler.getUserIdBySocket(socket.id);
                const chrono = chronoHandler.getChronoById(sessionId);
                const response = { type: "join_result", message: { success: false, errorMessage: "", users: [] as any[], role: "", config: "", state: "", alias: "" } };
                if (!userId) {
                    response.message.errorMessage = "User not identified";
                    socket.send(JSON.stringify(response));
                    return;
                }
                if (!chrono) {
                    response.message.errorMessage = "Session not found";
                    socket.send(JSON.stringify(response));
                    return;
                }
                const result = chronoHandler.addListener(sessionId, userId);
                const role = userId === chrono.owner ? "owner" : chrono.isAuthorized(userId) ? "admin" : "viewer";
                response.message.users = chrono.listUsers();
                if (result > 0) {
                    const teamsConfig = chrono.teamsConfig();
                    response.message.config = teamsConfig;
                    response.message.success = true;
                    response.message.role = role;
                    response.message.state = JSON.stringify(chrono.getState(true));
                    response.message.alias = chrono.alias;
                    socket.join(sessionId);
                }
                else {
                    response.message.success = false;
                    response.message.errorMessage = "Failed to join session";
                }
                socket.send(JSON.stringify(response));
            }
            else if (data.type === "action") {
                const { sessionId, action } = data.message;
                const userId = userHandler.getUserIdBySocket(socket.id) || "";
                const { result, message } = chronoHandler.dispatchAction(sessionId, userId, action);
                // console.log(`Action ${action.type} by user ${userId} in session ${sessionId}: ${message}`);
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

}