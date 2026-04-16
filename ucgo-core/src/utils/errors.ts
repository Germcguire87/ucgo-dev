export class UcgoDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UcgoDecodeError";
  }
}

export class UcgoCryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UcgoCryptoError";
  }
}

export class UnknownOpcodeError extends Error {
  readonly opcode: number;
  constructor(opcode: number) {
    super(`Unknown opcode: 0x${opcode.toString(16).padStart(8, "0").toUpperCase()}`);
    this.name = "UnknownOpcodeError";
    this.opcode = opcode;
  }
}
