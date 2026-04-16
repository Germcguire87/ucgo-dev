import type { PacketHandler } from "./PacketHandler.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler<TContext> = PacketHandler<any, TContext>;

export class PacketRegistry<TContext> {
  private readonly handlers = new Map<number, AnyHandler<TContext>>();

  register<TPacket>(handler: PacketHandler<TPacket, TContext>): void {
    if (this.handlers.has(handler.opcode)) {
      throw new Error(
        `PacketRegistry: opcode 0x${handler.opcode.toString(16).padStart(8, "0").toUpperCase()} is already registered`,
      );
    }
    this.handlers.set(handler.opcode, handler);
  }

  has(opcode: number): boolean {
    return this.handlers.has(opcode);
  }

  get(opcode: number): AnyHandler<TContext> | undefined {
    return this.handlers.get(opcode);
  }
}
