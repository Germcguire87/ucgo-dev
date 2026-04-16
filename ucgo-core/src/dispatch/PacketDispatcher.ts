import { UnknownOpcodeError } from "../utils/errors.js";
import type { PacketEnvelope } from "../packet/PacketEnvelope.js";
import type { PacketRegistry } from "./PacketRegistry.js";

export class PacketDispatcher<TContext> {
  constructor(private readonly registry: PacketRegistry<TContext>) {}

  async dispatch(envelope: PacketEnvelope, context: TContext): Promise<void> {
    const handler = this.registry.get(envelope.header.opcode);
    if (handler === undefined) {
      throw new UnknownOpcodeError(envelope.header.opcode);
    }
    const packet = handler.decode(envelope.body);
    await handler.handle(packet, envelope, context);
  }
}
