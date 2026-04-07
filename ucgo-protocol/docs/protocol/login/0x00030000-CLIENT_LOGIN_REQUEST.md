# CLIENT_LOGIN_REQUEST (0x00030000)

## Status

🟢 COMPLETE

## Direction

Client → Login Server

## Summary

First packet sent by the client during login. Contains the username encoded as UTF-16LE and the password encrypted using UCGOblowfish with the username (UTF-16LE + null terminator) as the key. Packet size varies based on username length and password block count.

---

## Capture Metadata (Representative)

| Field      | Value               |
| ---------- | ------------------- |
| Opcode     | 0x00030000          |
| Sequence   | 1                   |
| SysMessage | 0x00000000          |
| Direction  | clientToLoginServer |

---

## High-Level Structure

```
[HEADER][BODY]
```

The header contains the `head` and `tail` markers as fixed fields within it, not as separate sections.

---

## Header (64 bytes, offsets 0x00–0x3F)

| Offset    | Size | Type   | Description                                                      |
| --------- | ---- | ------ | ---------------------------------------------------------------- |
| 0x00      | 4    | ASCII  | Magic marker: `head`                                             |
| 0x04      | 2    | uint16 | XOR table index (LE). Selects the 4-byte XOR key from xortable.dat |
| 0x06      | 2    | bytes  | Always `00 00`                                                   |
| 0x08      | 4    | uint32 | SysMessage (always `0x00000000` observed)                        |
| 0x0C      | 4    | uint32 | Sequence number (1-indexed, increments per packet in session)    |
| 0x10      | 4    | uint32 | XORSize: number of bytes covered by XOR encryption (LE)         |
| 0x14      | 4    | uint32 | BlowfishSize: body size padded to 8-byte boundary (LE)          |
| 0x18      | 4    | uint32 | Opcode: `0x00030000` (LE)                                       |
| 0x1C–0x3B | 32   | bytes  | Padding (all zeros)                                              |
| 0x3C      | 4    | ASCII  | Magic marker: `tail`                                             |

---

## Body Structure (offsets 0x40+)

| Offset | Size                | Type     | Description                                     |
| ------ | ------------------- | -------- | ----------------------------------------------- |
| 0x40   | 1                   | byte     | `0x80 \| username_length`                       |
| 0x41   | `username_len * 2`  | UTF-16LE | Username (no null terminator in this field)     |
| var    | 2                   | bytes    | Null terminator: `00 00`                        |
| var    | 4                   | uint32   | Client version: `0x000010A9` (observed, BE)     |
| var    | 1                   | byte     | `0x80 \| encrypted_payload_size`                |
| var    | `payload_size`      | bytes    | UCGOblowfish-encrypted password (see below)     |

---

## Username Length Field

The byte at 0x40 encodes the username character count (not byte count) in its lower 7 bits, with the high bit always set.

| Username    | Char count | Byte @ 0x40 |
| ----------- | ---------- | ----------- |
| a           | 1          | 0x81        |
| aa          | 2          | 0x82        |
| testuser    | 8          | 0x88        |
| jimbotodo   | 9          | 0x89        |
| anewaccount | 11         | 0x8B        |

---

## Client Version Field

The 4 bytes immediately following the username null terminator represent the client version in big-endian format. All observed captures show `0x000010A9`. This value is validated server-side — a mismatch returns result code `0x0C`.

---

## Encrypted Payload

### Key Derivation

```
bf_key = username.encode('UTF-16LE') + b'\x00\x00'
```

The Blowfish key is the username encoded as UTF-16LE with a 2-byte null terminator appended.

### Plaintext

```
plaintext = password.encode('UTF-16LE')
plaintext = pad to next 8-byte boundary with null bytes
```

The password is encoded as UTF-16LE and null-padded to the next 8-byte block boundary.

### Encryption

UCGOblowfish (see Crypto Notes below) in ECB mode. No IV.

### Payload Size Field

The byte immediately before the ciphertext encodes the ciphertext length in its lower 7 bits, with the high bit always set:

```
payload_size_byte = 0x80 | len(ciphertext)
```

### Size Examples

| Password    | UTF-16LE bytes | Padded to | Ciphertext size | Size byte |
| ----------- | -------------- | --------- | --------------- | --------- |
| a           | 2              | 8         | 8               | 0x88      |
| aa          | 4              | 8         | 8               | 0x88      |
| password    | 16             | 16        | 16              | 0x90      |
| 12345678    | 16             | 16        | 16              | 0x90      |
| abc123      | 12             | 16        | 16              | 0x90      |

### Verified Decryptions

| Username    | Ciphertext (hex, first block)    | Decrypted password |
| ----------- | -------------------------------- | ------------------ |
| testuser    | `F1723D76FDC33C4A`               | `a`                |
| testuser    | `137798C41D8ED6E0...`            | `password`         |
| testuser    | `4F1FBE629A9D91C0...`            | `ZZZZZZZZ`         |
| testuser    | `163F7955B1422AB5...`            | `1234567`          |
| anewaccount | `9D72FD8A71D48A44...`            | `abc123`           |

---

## Crypto Notes

### UCGOblowfish

UCGO uses a non-standard Blowfish implementation with two deviations from the reference:

**1. Non-standard key schedule**

In the standard Blowfish key schedule, the `data` accumulator is reset to `0` for each P-box entry. UCGOblowfish does NOT reset it — `data` carries over from one P-box entry to the next across all 18 entries.

```
// Standard (resets per entry):
for i in 0..18:
    data = 0
    for k in 0..4: data = (data << 8) | key[j % keylen]
    P[i] ^= data

// UCGOblowfish (accumulates):
data = 0
for i in 0..18:
    for k in 0..4: data = (data << 8) | key[j % keylen]
    P[i] ^= data
```

**2. Little-endian block I/O**

Standard Blowfish reads/writes 8-byte blocks as two big-endian 32-bit words. UCGOblowfish reads/writes them as two little-endian 32-bit words.

```
// UCGOblowfish block read (from Java source):
xl = data[3] << 24 | data[2] << 16 | data[1] << 8 | data[0]
xr = data[7] << 24 | data[6] << 16 | data[5] << 8 | data[4]
```

### Transport Encryption (Outer Layer)

The body and header are also wrapped in a transport encryption layer before being sent on the wire. This outer layer is applied by the UCGO packet framing system and is separate from the login payload encryption described above.

Transport encryption uses UCGOblowfish with a fixed key:
- Original client: `chrTCPPassword`
- UCGOhost modified client: `QQzXzQnpzTpnXz`

The XOR layer uses `xortable.dat` (131,072 bytes), indexed by the 2-byte XOR index stored at header offset 0x04.

Decrypt order: Blowfish → XOR  
Encrypt order: XOR → Blowfish

---

## Packet Size Formula

```
header_size      = 64
username_bytes   = username_len * 2 + 2  (UTF-16LE + null terminator)
version_bytes    = 4
size_byte        = 1
payload_bytes    = ceil(password_len * 2 / 8) * 8

XORSize          = 1 + username_bytes + version_bytes + size_byte + payload_bytes
BlowfishSize     = XORSize rounded up to next 8-byte boundary
total_length     = header_size + BlowfishSize
```

---

## Login Flow Position

```
1. Client → Server   0x00030000   ← this packet
2. Client → Server   0x00030001   Account ID echo (sent in same burst)
3. Server → Client   0x00038000   Login response
4. Server → Client   0x00038001   Character slot list (on success)
5. Server → Client   0x00038002   Character data (on success, one per character)
```

Packets 1 and 2 are sent by the client in a single burst before waiting for the server response.

---

## Unknowns / Open Questions

- Exact meaning of the 4-byte client version field beyond the observed value `0x000010A9`
- Whether the client version field changes across different client builds
