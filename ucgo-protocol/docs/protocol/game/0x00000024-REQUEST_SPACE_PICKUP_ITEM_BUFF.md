# REQUEST_SPACE_PICKUP_ITEM_BUFF (0x00000024)

## Status

🟢 HIGH CONFIDENCE (CONFIRMED VIA UCGOHOST IMPLEMENTATION)

## Direction

Client → Game Server

## Summary

Client request to **pick up, move, or interact with an item/container in the world**.

This opcode handles multiple gameplay actions including:

- picking up items from the ground
- picking up money
- taking items from wreckage containers
- entering vehicles (mobile suits)

This is a **core world interaction opcode**, specifically for **item/container-based interactions**.

---

## Capture Metadata (Representative)

| Field        | Value             |
|--------------|------------------|
| Opcode       | `0x00000024`     |
| Direction    | Client → Game    |
| Occurrence   | Event-driven     |
| XORSize      | Variable         |
| BlowfishSize | Variable         |

---

## Confirmed Structure (from UCGOHost)

### Layout (Big Endian)

| Field | Type | Description |
|------|------|------------|
| moveType | u32 | Action type (see below) |
| unk1 | u32 | Unknown / ignored |
| sourceContainerId | u32 | Container holding the item |
| sourceTail | u32 | Container tail |
| targetContainerId | u32 | Destination container |
| targetTail | u32 | Destination tail |
| unk2 | u64 | Unknown |
| unk3 | u64 | Unknown |
| unk4 | u64 | Unknown |
| amount | u64 | Quantity (items/money) |
| unk5 | u32 | Unknown |
| unk6 | u32 | Unknown |
| unk7 | u32 | Unknown |
| endByte | u8 | Must be echoed in `0x8024` |

---

## moveType Values

| Value        | Meaning                |
|--------------|------------------------|
| `0x00010000` | Pick up item           |
| `0x00020000` | Pick up money          |
| `0x00030000` | Enter vehicle (MS)     |
| `0x00040000` | Loot from wreckage     |

---

## Behavior

### Server-side branching

The server routes behavior based on `moveType`:

- Item pickup → move item container
- Stackable item → merge/split stacks
- Money pickup → update currency container
- Wreckage → extract from nested container
- Vehicle → attach player to vehicle

---

## Vehicle Interaction

When:

```text
moveType == 0x00030000
AND item.type == Vehicle