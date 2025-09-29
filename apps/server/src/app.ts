import express from "express";
import { allRouter } from "./app/Routers/allInOneRouter";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as path from "path";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { logger_i, logger_w } from "./app/Util/Logger";

/*Here I created a basic server because I could have 3 separated server, front, api, and auth*/
/*But for constrains in the hosting plataform, I have decided to make only one server*/
/*The big advantage of having 3 servers is that you could scale them separately */

class BasicServer {
  public server: express.Application;
  constructor() {
    this.server = express();
  }
  protected middleware() {
    this.server.use(express.json());
  }

  protected withcors(origns: string) {
    this.server.use(cors({
      origin: origns, // allow to server to accept request from different origin
      credentials: true // allow session cookie from browser to pass through
    }))
    logger_i('cors enabled for:', origns);
  }

  protected withCookies() {
    logger_i('cookies enabled');
    this.server.use(cookieParser());
  }

  protected router(_router: express.Router) {
    this.server.use(_router);
  }
}

class Server extends BasicServer {
  public httpServer: http.Server;
  public io: SocketIOServer;

  constructor() {
    super();
    const corsOrigin = process.env.NODE_ENV === 'production' ? 'https://mwchrono.vercel.app' : 'http://localhost:5173';
    this.middleware();
    this.withCookies();
    this.withcors(corsOrigin);
    this.router(allRouter); /*Router for Apis + Auth*/

    /*Serves the React Page*/
    if (process.env.SERVER_ONLY === 'false') {
      logger_i("Serving frontend from folder:", process.env.FRONTEND_FOLDER ?? './front/dist');
      const frontendFolder = process.env.FRONTEND_FOLDER ?? './front/dist';
      this.server.use(express.static(path.resolve(frontendFolder)));
      this.server.use('*', (req, res) => {
        res.sendFile(path.resolve(frontendFolder + '/index.html'))
      });
    }
    else {
      logger_w("Server only mode, not serving frontend");
      this.server.use('*', (req, res) => {
        res.redirect(301, corsOrigin);
      });
    }

    // Create HTTP server and attach Socket.IO
    this.httpServer = http.createServer(this.server);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: corsOrigin,
        credentials: true,
      }
    });

  }


}

export { Server };
