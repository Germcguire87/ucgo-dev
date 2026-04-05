# CLIENT_LOGIN_REQUEST (0x00030000)

## Status

🟢 PARTIAL (HIGH CONFIDENCE CORE STRUCTURE)

## Direction

Client → Login Server

## Summary

First packet sent by the client during login. Contains a UTF-16LE username and a deterministic encrypted payload influenced by both username and password. Packet size varies based on username length and password block size.

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
[HEADER][PADDING][TAIL][BODY]
```

---

## Header

| Offset    | Size | Description                                        |
| --------- | ---- | -------------------------------------------------- |
| 0x00      | 4    | "head" marker                                      |
| 0x04      | 4    | Dynamic session/seed field (varies per connection) |
| 0x08      | 4    | SysMessage                                         |
| 0x0C      | 4    | Sequence                                           |
| 0x10      | 4    | XORSize                                            |
| 0x14      | 4    | BlowfishSize                                       |
| 0x18      | 4    | Opcode (0x00030000)                                |
| 0x1C–0x3B | ~32  | Padding (all zeros observed)                       |
| 0x3C      | 4    | "tail" marker                                      |

---

## Body Structure (Post-Tail)

| Offset | Size | Type     | Description                                         |
| ------ | ---- | -------- | --------------------------------------------------- |
| 0x40   | 1    | byte     | Username length field (0x80 | length)               |
| 0x41   | var  | UTF-16LE | Username (null-terminated)                          |
| var    | var  | bytes    | Encrypted payload (deterministic, Blowfish-aligned) |

---

## Username Encoding

* Encoding: UTF-16LE
* Null-terminated (`00 00`)
* Starts at offset **0x41**

### Examples

| Raw Bytes               | Decoded   |
| ----------------------- | --------- |
| `61 00`                 | a         |
| `61 00 61 00`           | aa        |
| `61 00 61 00 61 00`     | aaa       |
| `74 00 65 00 73 00 ...` | testuser  |
| `6A 00 69 00 6D 00 ...` | jimbotodo |

---

## Username Length Field

| Offset | Description            |
| ------ | ---------------------- |
| 0x40   | 0x80 | username_length |

### Verified Examples

| Username    | Length | Byte @ 0x40 |
| ----------- | ------ | ----------- |
| a           | 1      | 0x81        |
| aa          | 2      | 0x82        |
| aaa         | 3      | 0x83        |
| testuser    | 8      | 0x88        |
| jimbotodo   | 9      | 0x89        |
| vargas06123 | 11     | 0x8B        |

### Interpretation

* High bit (0x80) likely acts as a flag
* Lower bits encode username length

---

## Encrypted Payload

* Begins immediately after username null terminator
* Deterministic function of username and password
* Appears Blowfish-encrypted
* Block-aligned (8-byte multiples)

### Observations

* Identical username/password → identical encrypted payload
* Password changes → encrypted payload changes
* Header seed (0x04–0x07) does NOT affect payload
* Repeated ciphertext blocks observed in some cases

---

## Encryption Properties

* Blowfish block size: **8 bytes**
* Deterministic: no IV or nonce observed
* Payload size changes at block boundaries
* Likely ECB mode (identical plaintext blocks → identical ciphertext blocks observed)
* Short passwords may produce identical ciphertext due to padding

---

## Size Behavior

* Packet size scales with username length
* Packet size also scales with password length (via block thresholds)

### Observed Behavior

| Password Length | Behavior                            |
| --------------- | ----------------------------------- |
| ≤ 7 chars       | Fits within smaller block size      |
| ≥ 8 chars       | Expands to next Blowfish block      |
| 8 vs 9 chars    | Same packet size (same block count) |

* `XORSize` increases with total payload size
* `BlowfishSize` is padded to 8-byte boundaries

---

## Verified Observations

* Username always begins at offset **0x41**
* Username is UTF-16LE and null-terminated
* Byte at **0x40 = 0x80 | username_length**
* Encrypted payload begins immediately after username
* Header contains dynamic session field (0x04–0x07)
* Encrypted payload is deterministic across sessions
* Password influences encrypted payload content and size

---

## Unknowns / Open Questions

* Internal structure of encrypted payload (password hash? composite structure?)
* Exact XOR layer behavior (pre/post Blowfish)
* Meaning of header seed field (session ID? crypto seed?)
* Exact formula for XORSize
* Exact Blowfish key usage (likely `chrTCPPassword`)
* Whether encryption mode is definitively ECB

---

## Notes

This packet is now structurally understood and can be reliably parsed for:

* Username extraction
* Payload boundary detection
* Size prediction based on input

Further work should focus on decrypting or modeling the encrypted payload and implementing a working encoder.
