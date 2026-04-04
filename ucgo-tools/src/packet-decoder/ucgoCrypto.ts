import { UcgoBlowfish } from "./ucgoBlowfish";

const DEFAULT_MAX_PACKET_SIZE = 65535;

export interface UcgoCryptoOptions {
  xorTable: Buffer;
  blowfishKey: Buffer;
  maxPacketSize?: number;
}

export interface DecryptedPacketResult {
  header: Buffer;
  body: Buffer;
  xorSize: number;
  blowfishSize: number;
}

export class UcgoCrypto {
  private xorTable: Buffer;
  private blowfish: UcgoBlowfish;
  private maxPacketSize: number;

  constructor(options: UcgoCryptoOptions) {
    this.xorTable = options.xorTable;
    this.blowfish = new UcgoBlowfish(options.blowfishKey);
    this.maxPacketSize = options.maxPacketSize ?? DEFAULT_MAX_PACKET_SIZE;
  }

  decryptPacketAtOffset(buffer: Buffer, offset: number): DecryptedPacketResult | null {
    if (offset + 64 > buffer.length) {
      return null;
    }

    const headerEncrypted = buffer.subarray(offset, offset + 64);
    const headerBlowfish = this.blowfish.decrypt(headerEncrypted);

    const xorIndex = headerBlowfish[4]! | (headerBlowfish[5]! << 8);
    const xorKey = this.buildXorKey(xorIndex);
    if (!xorKey) {
      return null;
    }

    const header = this.xorCrypt(headerBlowfish, xorKey, 64);

    const xorSize = header.readUInt32LE(16);
    const blowfishSize = header.readUInt32LE(20);

    if (
      xorSize < 0 ||
      xorSize > this.maxPacketSize ||
      blowfishSize < 0 ||
      blowfishSize > this.maxPacketSize
    ) {
      return null;
    }

    if (xorSize > blowfishSize) {
      return null;
    }

    if (blowfishSize % 8 !== 0) {
      return null;
    }

    if (offset + 64 + blowfishSize > buffer.length) {
      return null;
    }

    const bodyEncrypted = buffer.subarray(offset + 64, offset + 64 + blowfishSize);
    const bodyBlowfish = this.blowfish.decrypt(bodyEncrypted);
    const bodyXor = this.xorCrypt(bodyBlowfish, xorKey, xorSize).subarray(0, xorSize);

    return {
      header,
      body: bodyXor,
      xorSize,
      blowfishSize,
    };
  }

  private buildXorKey(index: number): Buffer | null {
    const base = index * 2;
    if (base < 0 || base + 1 >= this.xorTable.length) {
      return null;
    }

    return Buffer.from([
      this.xorTable[base]!,
      this.xorTable[base + 1]!,
      index & 0xff,
      (index >> 8) & 0xff,
    ]);
  }

  private xorCrypt(data: Buffer, key: Buffer, length: number): Buffer {
    const result = Buffer.from(data);
    const blockSize = Math.floor(length / 4) * 4;

    for (let i = 0; i < blockSize; i++) {
      result[i] = result[i]! ^ key[i % 4]!;
    }

    switch (length % 4) {
      case 3:
        result[blockSize] = result[blockSize]! ^ key[2]!;
      case 2:
        result[blockSize] = result[blockSize]! ^ key[1]!;
      case 1:
        result[blockSize] = result[blockSize]! ^ key[0]!;
    }

    return result;
  }
}
