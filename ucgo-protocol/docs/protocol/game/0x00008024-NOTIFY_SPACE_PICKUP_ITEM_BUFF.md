# NOTIFY_SPACE_PICKUP_ITEM_BUFF (0x00008024)

## Status

🟢 HIGH CONFIDENCE (CONFIRMED VIA UCGOHOST IMPLEMENTATION)

## Direction

Game Server → Client

## Summary

Server response to `0x00000024` request.

Applies and confirms **item/container state changes**, including:

- item pickup
- stack updates
- money transfer
- wreckage loot
- vehicle entry

This packet contains the **authoritative result of the action**.

---

## Capture Metadata (Representative)

| Field        | Value              |
|--------------|-------------------|
| Opcode       | `0x00008024`      |
| Direction    | Game → Client     |
| Occurrence   | Per request       |
| XORSize      | Variable          |
| BlowfishSize | Variable          |

---

## Header

Standard 64-byte UCGO packet header.

---

## Confirmed Structure (from UCGOHost)

### Layout (Big Endian)

| Field | Type | Description |
|------|------|------------|
| resultCode | u32 | Operation type/result |
| characterId | u32 | Player ID |
| sourceContainerId | u32 | Source container |
| sourceTail | u32 | Source tail |
| targetContainerId | u32 | Target container |
| targetTail | u32 | Target tail |
| unk1 | u64 | Unknown |
| unk2 | u64 | Unknown |
| optionalSource | u32/u64 | Optional reference (stacking cases) |
| amount | u64 | Quantity moved |
| itemId | u32 | Item ID |
| targetStaticId | u32 | Target container static ID |
| flag | u32 | Operation flag |
| endByte | u8 | Echoed from request |
| containerId | u32 | Result container |
| containerTail | u32 | Result tail |
| amount2 | u64 | Final quantity |
| itemId2 | u32 | Item ID (repeat) |
| createTime | u32 | Creation timestamp |
| modifyTime | u32 | Modification timestamp |
| itemData | bytes | Raw item data |

---

## resultCode Values

| Value        | Meaning |
|--------------|--------|
| `0x00010002` | New item / non-stackable pickup |
| `0x02010002` | Stack updated (existing item) |
| `0x00030002` | Vehicle entry |
| `0x02020002` | Money pickup |
| `0x01040002` | Wreckage (new container) |
| `0x02040002` | Wreckage (stack update) |

---

## Behavior

### Primary responsibilities

- confirms action success
- applies inventory/container changes
- delivers updated item data
- transfers ownership of items/vehicles

---

### Vehicle Entry Case

When `resultCode == 0x00030002`:

- vehicle removed from world
- placed into player's equipped container
- player enters pilot state

---

### Stack Handling

- Existing item → quantity updated
- New item → new container created
- Partial pickup → source container updated

---

## Relationship to Other Packets

After this packet:

- `0x00008035` → broadcast world update
- `0x00008003` → entity sync
- `0x00008016` → container sync (if needed)

---

## Interpretation

This packet represents:

> 🔥 **authoritative state mutation for item/container interactions**

It is the **core response for all pickup-style gameplay actions**.

---

## Flow Context

```text
Client → 0x00000024   RequestSpacePickupItemBuff
Server → 0x00008024   NotifySpacePickupItemBuff
↓
Server → 0x00008035   Broadcast update
↓
Server → 0x00008003   World sync
↓
Server → 0x00008016   Container sync