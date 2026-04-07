# UCGO Crypto Reference

## Overview

UCGO uses a two-layer encryption system for all packet communication. Every packet on the wire is encrypted by an outer transport layer. The login credential packet (`0x00030000`) additionally encrypts its payload with a second inner layer.

---

## UCGOblowfish

UCGO uses a non-standard Blowfish implementation (`UCGOblowfish.java`) that deviates from the Blowfish reference specification in two ways.

### Deviation 1: Non-standard key schedule

In the reference Blowfish key schedule, the `data` accumulator is reset to `0` for each of the 18 P-box entries. UCGOblowfish does NOT reset `data` — it accumulates continuously across all 18 entries.

```python
# Standard Blowfish:
for i in range(18):
    data = 0                          # ← reset each iteration
    for k in range(4):
        data = (data << 8) | key[j % keylen]
    P[i] ^= data

# UCGOblowfish:
data = 0                              # ← only reset once, before the loop
for i in range(18):
    for k in range(4):
        data = (data << 8) | key[j % keylen]
    P[i] ^= data
```

### Deviation 2: Little-endian block I/O

Standard Blowfish processes 8-byte blocks as two big-endian 32-bit words. UCGOblowfish reads and writes blocks as two little-endian 32-bit words.

```python
# UCGOblowfish block read:
xl = (data[3] << 24) | (data[2] << 16) | (data[1] << 8) | data[0]
xr = (data[7] << 24) | (data[6] << 16) | (data[5] << 8) | data[4]

# UCGOblowfish block write:
output[0] = xl & 0xFF;  output[1] = (xl >> 8) & 0xFF
output[2] = (xl >> 16) & 0xFF;  output[3] = (xl >> 24) & 0xFF
output[4] = xr & 0xFF;  output[5] = (xr >> 8) & 0xFF
output[6] = (xr >> 16) & 0xFF;  output[7] = (xr >> 24) & 0xFF
```

The F function and Feistel structure are otherwise identical to the reference implementation.

---

## Outer Transport Encryption

Every UCGO packet is encrypted before transmission using:

1. **XOR layer** using a 4-byte key derived from `xortable.dat`
2. **UCGOblowfish ECB** with a fixed key

### Transport Keys

| Client variant       | Blowfish key       |
| -------------------- | ------------------ |
| Original client      | `chrTCPPassword`   |
| UCGOhost modified    | `QQzXzQnpzTpnXz`   |

### XOR Table

`xortable.dat` is a 131,072-byte file (65,536 × 2-byte entries). The XOR key for a packet is derived from a 16-bit index stored in the packet header at bytes [4:6]:

```python
index = header[4] | (header[5] << 8)   # little-endian 16-bit

xor_key[0] = xortable[index * 2]
xor_key[1] = xortable[index * 2 + 1]
xor_key[2] = index & 0xFF
xor_key[3] = (index >> 8) & 0xFF
```

The XOR key is then applied as a repeating 4-byte XOR mask over the data:

```python
for i in range(floor(length / 4) * 4):
    data[i] ^= xor_key[i % 4]

# Handle remainder (1–3 bytes):
remainder = length % 4
if remainder >= 3: data[block_end] ^= xor_key[2]
if remainder >= 2: data[block_end] ^= xor_key[1]
if remainder >= 1: data[block_end] ^= xor_key[0]
```

### Decrypt Order (incoming packet)

```
1. UCGOblowfish.Decrypt(entire_packet)
2. Read XOR index from decrypted header bytes [4:5]
3. Derive 4-byte XOR key from xortable.dat
4. XOR decrypt: header (64 bytes) + body (XORSize bytes)
```

### Encrypt Order (outgoing packet)

```
1. Generate random XOR index (0–65535)
2. Derive 4-byte XOR key from xortable.dat
3. XOR encrypt: header + body
4. Write XOR index into header bytes [4:5]
5. UCGOblowfish.Encrypt(entire_packet)
```

### XORSize vs BlowfishSize

- `XORSize` = actual data size (bytes covered by XOR)
- `BlowfishSize` = XORSize rounded up to next 8-byte boundary (required for Blowfish block alignment)

---

## Inner Login Payload Encryption

The password in `0x00030000` is encrypted with a separate UCGOblowfish context using the username as the key.

### Key Derivation

```python
bf_key = username.encode('UTF-16LE') + b'\x00\x00'
```

### Plaintext

```python
plaintext = password.encode('UTF-16LE')
# Pad to next 8-byte boundary:
plaintext += b'\x00' * ((-len(plaintext)) % 8)
```

### Encryption

UCGOblowfish ECB mode. No IV.

### Verified Test Vectors

All tested against the UCGOhost server (modified client with `QQzXzQnpzTpnXz` outer key, `chrTCPPassword` inner Blowfish is same as original).

| Username    | Password  | Ciphertext (first 8 bytes) |
| ----------- | --------- | -------------------------- |
| testuser    | a         | `F1723D76FDC33C4A`         |
| testuser    | password  | `137798C41D8ED6E0`         |
| testuser    | ZZZZZZZZ  | `4F1FBE629A9D91C0`         |
| testuser    | 1234567   | `163F7955B1422AB5`         |
| anewaccount | abc123    | `9D72FD8A71D48A44`         |

---

## Packet Header Structure

All UCGO packets share a common 64-byte header format. The header is encrypted as part of the outer transport layer.

```
Offset  Size  Description
0x00    4     Magic: "head" (0x68656164)
0x04    2     XOR table index (LE uint16)
0x06    2     Always 0x0000
0x08    4     SysMessage (always 0x00000000 observed)
0x0C    4     Sequence number (LE uint32, 1-indexed per session)
0x10    4     XORSize (LE uint32)
0x14    4     BlowfishSize (LE uint32)
0x18    4     Opcode (LE uint32)
0x1C    32    Padding (all zeros)
0x3C    4     Magic: "tail" (0x7461696C)
```

Body follows immediately at offset 0x40.

---

## Notes

The UCGOblowfish non-standard key schedule was documented in the Norwegian server source with this comment:

> `// data = 0x00000000; THIS SHOULD BE OUTSIDE THE LOOP. UCGO HAS CHANGED THIS.`

This means the original Dimps developers intentionally modified the standard Blowfish key schedule, likely as a simple obfuscation measure.
