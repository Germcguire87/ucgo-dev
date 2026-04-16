import { PacketRegistry, PacketDispatcher } from "ucgo-core";
import type { LoginHandlerContext } from "../types/LoginHandlerContext.js";
import { infoRequestHandler } from "../handlers/handle00000InfoRequest.js";
import { loginHandler } from "../handlers/handle30000Login.js";
import { accountEchoHandler } from "../handlers/handle30001AccountEcho.js";
import { characterDataRequestHandler } from "../handlers/handle30002CharacterDataRequest.js";
import { gameServerRequestHandler } from "../handlers/handle30005GameServerRequest.js";

export function createDispatcher(): PacketDispatcher<LoginHandlerContext> {
  const registry = new PacketRegistry<LoginHandlerContext>();
  registry.register(infoRequestHandler);
  registry.register(loginHandler);
  registry.register(accountEchoHandler);
  registry.register(characterDataRequestHandler);
  registry.register(gameServerRequestHandler);
  return new PacketDispatcher(registry);
}
