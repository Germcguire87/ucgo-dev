import { resolve } from "node:path";
import { loadXorTable } from "ucgo-core";
import type { InfoServerConfig } from "../config/config.js";
import { InfoTcpServer } from "../net/InfoTcpServer.js";
import { createDispatcher } from "./createDispatcher.js";

export async function createServer(xorTablePath: string): Promise<InfoTcpServer> {
  const xorTable = await loadXorTable(resolve(xorTablePath));

  const config: InfoServerConfig = {
    host:         "127.0.0.1",
    port:         24012,
    xorTable,
    transportKey: "QQzXzQnpzTpnXz", // UCGOhost modified client transport key
  };

  const dispatcher = createDispatcher();

  return new InfoTcpServer(dispatcher, config);
}
