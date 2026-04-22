# REQUEST_ITEM_INFO (0x00000016)

## Status

🟢 HIGH CONFIDENCE (STRUCTURE + BEHAVIOR CONFIRMED VIA MULTIPLE SERVER IMPLEMENTATIONS)

## Direction

Client → Game Server

## Summary

Client request for **container/item state data**, used heavily during initial world load.

This packet is sent in bursts to retrieve:
- inventory contents
- equipped items
- nested containers
- world-linked item entities

This is a **core world bootstrap opcode**, not a heartbeat.

---

## Capture Metadata (Representative)

| Field        | Value             |
|--------------|------------------|
| Opcode       | `0x00000016`     |
| Sequence     | `4–20` observed  |
| Direction    | Client → Game    |
| XORSize      | `37`             |
| BlowfishSize | `40`             |

---

## Confirmed Structure (from server implementations)

### Layout (Big Endian)

| Field | Type | Description |
|------|------|------------|
| unk0 | u32  | Unknown / mode field (ignored by servers) |
| characterId | u32 | Player character ID |
| primaryUniqueId | u32 | Target container/item unique ID |
| primaryTail | u32 | Container/item tail value |
| secondaryUniqueId | u32 | Parent container unique ID |
| secondaryTail | u32 | Parent container tail |
| primaryStaticId | u32 | Static item/container ID |
| secondaryStaticId | u32 | Parent static ID |
| ... | bytes | Remaining data ignored by implementations |

### Key Insight

👉 **Both Titans and UCGOHost parse the exact same structure**

- UCGOHost reads all fields and validates container existence :contentReference[oaicite:0]{index=0}  
- Titans uses them to determine container relationships and response type :contentReference[oaicite:1]{index=1}  

---

## Behavior

### Server-side logic

This request can trigger **three distinct behaviors**:

1. **Initialize Container**
   - Full container data returned

2. **Initialize Child Container**
   - Nested object/container relationship

3. **Modify Container**
   - Updates or attachment changes

These are determined by:
- presence of `secondaryUniqueId`
- container types (capsule, vehicle, etc.)

:contentReference[oaicite:2]{index=2}

---

## Interpretation

This opcode is responsible for:

- inventory loading
- equipment loading
- container hierarchy resolution
- vehicle/container embedding
- dynamic object state initialization

---

## Flow Position

```text
Login → Game Server Handoff
↓
0x41  RequestLoginGame
0x38  RequestRegisterPlayer
0x13  RequestServerTime
↓
0x16  REQUEST_ITEM_INFO (burst begins)
↓
0x8016 responses stream in