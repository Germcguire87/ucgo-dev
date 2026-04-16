import { PacketRegistry, PacketDispatcher } from "ucgo-core";
import type { InfoHandlerContext } from "../types/InfoHandlerContext.js";
import { infoRequestHandler } from "../handlers/handle00000InfoRequest.js";

export function createDispatcher(): PacketDispatcher<InfoHandlerContext> {
  const registry = new PacketRegistry<InfoHandlerContext>();
  registry.register(infoRequestHandler);
  return new PacketDispatcher(registry);
}
