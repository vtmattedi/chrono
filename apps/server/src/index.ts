import { Server } from "./app"
import { assertDotEnv } from "./app/Util/Asserter";
import jwt from "jsonwebtoken";
import { userHandler } from "./app/Model/users";
import { chronoHandler } from "./ChronoBasics/chronoHandler";
import { configureWebsockets } from "./websockets";
import { logger_e, logger_in } from "./app/Util/Logger";
// Load the .env file
if (!assertDotEnv()) {
    logger_e('failed to load .env.')
    throw new Error('Failed to load .env')
}

const app = new Server();

const startServer = (port: number) => {
    try {
        app.httpServer.listen(port);
    } catch (error) {
        if ((error as any).code === 'EADDRINUSE') {
            logger_e(`Port ${port} is already in use, trying port ${port + 1}`);
            startServer(port + 1);
        }
        else  {
            logger_e('Failed to start server:', null, error);
            throw error;
        }
    }
}

startServer(Number(process.env.PORT ?? 4500));

chronoHandler.startAfkCheck((Number(process.env.AFK_CHECK_MINS) || 48 * 60)); // minutes
configureWebsockets(app);


logger_in(`Server started on port ${process.env.PORT ?? 4500}`);


