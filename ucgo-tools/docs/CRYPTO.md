# UCGO Crypto Pipeline

This project decodes UCGO packets from TCP streams. The key insight is that the
wire payloads are not plaintext `head/tail` packets. The bytes are encrypted
with a two-stage scheme: Blowfish (ECB) plus a custom XOR mask.

If you only scan raw TCP payloads for `head`, you will find nothing.

## Required Inputs

- Blowfish key (default: `chrTCPPassword`)
- XOR table (`data/xortable.dat`)

## Decrypt Order (Header + Body)

The decrypt flow (from original reverse-engineer notes and server code):

1. **Blowfish decrypt the 64-byte header** (ECB, key = Blowfish key).
2. **Derive XOR key index** from the decrypted header:
   - `index = header[4] | (header[5] << 8)`
3. **Build a 4-byte XOR key** using the XOR table:
   - `key[0] = XORTable[index * 2]`
   - `key[1] = XORTable[index * 2 + 1]`
   - `key[2] = index & 0xFF`
   - `key[3] = (index >> 8) & 0xFF`
4. **XOR-decrypt the header** (length 64).
5. **Read sizes** from decrypted header:
   - `XORSize` at offset 16 (LE)
   - `BlowfishSize` at offset 20 (LE)
6. **Blowfish-decrypt body** (`BlowfishSize` bytes after header).
7. **XOR-decrypt body** (first `XORSize` bytes of decrypted body).

After these steps, the packet begins with:

```
68 65 61 64  ...  74 61 69 6c
 h  e  a  d       t  a  i  l
```

## Packet Layout (Decrypted)

```
offset  size  meaning
0x00    4     "head" (ASCII)
0x04    4     KeyOffset / XOR index
0x08    4     SysMessage
0x0C    4     Sequence
0x10    4     XORSize
0x14    4     BlowfishSize
0x18    4     Opcode
0x1C    32    Unknown ints
0x3C    4     "tail" (ASCII)
```

## Code Locations

- `src/packet-decoder/ucgoBlowfish.ts` – Blowfish implementation (UCGO variant)
- `src/packet-decoder/ucgoCrypto.ts` – Full decrypt pipeline
- `src/packet-decoder/extractUcgoPacketsFromTcpStream.ts` – Stream scan + crypto-aware parsing

## Notes

- The XOR table is a 16-bit lookup table of 65,536 entries (131,072 bytes).
- `BlowfishSize` is always divisible by 8.
- Only the first `XORSize` bytes of the body are meaningful; the rest is padding.
