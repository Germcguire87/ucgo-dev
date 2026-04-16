import * as net from "node:net";
import type { PacketDispatcher } from "ucgo-core";
import type { LoginHandlerContext } from "../types/LoginHandlerContext.js";
import type { LoginServices } from "../types/LoginHandlerContext.js";
import type { LoginServerConfig } from "../config/config.js";
import { LoginConnection } from "./LoginConnection.js";

export class LoginTcpServer {
  private readonly server: net.Server;

  constructor(
    private readonly dispatcher: PacketDispatcher<LoginHandlerContext>,
    private readonly services: LoginServices,
    private readonly config: LoginServerConfig,
  ) {
    this.server = net.createServer((socket) => {
      // LoginConnection wires itself to socket events — no reference needed here
      new LoginConnection(socket, dispatcher, services, config);
    });

    this.server.on("error", (err) => {
      console.error(`[LoginTcpServer] Server error: ${err.message}`);
    });
  }

  listen(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`[LoginTcpServer] Listening on ${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err !== undefined) reject(err);
        else resolve();
      });
    });
  }
}
