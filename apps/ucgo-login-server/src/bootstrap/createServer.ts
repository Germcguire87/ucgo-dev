import { resolve } from "node:path";
import { loadXorTable } from "ucgo-core";
import type { LoginServerConfig } from "../config/config.js";
import type { LoginServices } from "../types/LoginHandlerContext.js";
import { InMemoryAccountRepository } from "../repositories/InMemoryAccountRepository.js";
import { InMemoryCharacterRepository } from "../repositories/InMemoryCharacterRepository.js";
import { AuthService } from "../services/AuthService.js";
import { CharacterService } from "../services/CharacterService.js";
import { SessionService } from "../services/SessionService.js";
import { LoginTcpServer } from "../net/LoginTcpServer.js";
import { createDispatcher } from "./createDispatcher.js";

export async function createServer(xorTablePath: string): Promise<LoginTcpServer> {
  const xorTable = await loadXorTable(resolve(xorTablePath));

  const config: LoginServerConfig = {
    host:                  "127.0.0.1",
    port:                  24018,
    xorTable,
    transportKey:          "QQzXzQnpzTpnXz", // UCGOhost modified client transport key
    acceptedClientVersion: 0x000010a9,        // Only known observed client version
    gameServerIp:          "127.0.0.1",
    gameServerPort:        24010,
    maintenanceMode:       false,
  };

  const sessions   = new SessionService();
  const accounts   = new InMemoryAccountRepository();
  const characters = new InMemoryCharacterRepository();

  const services: LoginServices = {
    auth:      new AuthService(accounts, sessions),
    character: new CharacterService(characters),
    session:   sessions,
  };

  const dispatcher = createDispatcher();

  return new LoginTcpServer(dispatcher, services, config);
}
