# UCGO Login Flow Overview

## Servers Involved

| Server      | Port  | Description                                      |
| ----------- | ----- | ------------------------------------------------ |
| Info server | 24012 | Pre-login status ping (optional, pre-UI)         |
| Login server| 24018 | Authentication and character management          |
| Game server | 24010 | Gameplay (connected to after login completes)    |

---

## Complete Login Sequence

### Phase 0: Info Server Ping (optional)

Before presenting the login UI, the client pings the info server to check server status.

```
Client → Info Server   0x00000000   Status request (4-byte zero body)
Info Server → Client   0x00008000   Status response (8-byte zero body)
```

This appears to populate the server status indicator in the login screen.

---

### Phase 1: Authentication Burst

The client sends three packets in a single TCP burst without waiting for responses:

```
Client → Login Server   0x00030000   Login request (username + encrypted password)
Client → Login Server   0x00030001   Account ID echo
```

In some captures (warmuro, dante), two additional packets precede the server response:

```
Client → Login Server   0x00030002   Unknown (×2, sent with sequence 3 and 4)
Client → Login Server   0x00030005   Game server request (sequence 5)
```

The timing of these varies — some clients send only `0x00030000` + `0x00030001`, others send the full burst including `0x00030002` × 2 and `0x00030005`.

---

### Phase 2: Server Authentication Response

```
Login Server → Client   0x00038000   Login response
```

**Branch on result code:**

| Code   | Meaning           | Next step                    |
| ------ | ----------------- | ---------------------------- |
| `0x01` | Success           | Continue to Phase 3          |
| `0x09` | Bad credentials   | Flow ends, show error        |
| `0x0B` | Server closed     | Flow ends, show maintenance  |
| `0x0C` | Wrong client ver  | Flow ends, show error        |
| `0x15` | Already logged in | Flow ends, show error        |

---

### Phase 3: Character Data Delivery (success only)

```
Login Server → Client   0x00038001   Character slot list
Login Server → Client   0x00038002   Character data (one per character, may be 0–2 packets)
```

At this point the client displays the character selection screen. The player can:
- Select an existing character → skip to Phase 4
- Create a new character → Phase 3a
- Delete a character → Phase 3b

---

### Phase 3a: Character Creation (optional)

```
Client → Login Server   0x00030003   Create character request
Login Server → Client   0x00038003   Create character response
```

On success the server sends an updated `0x00038001` + `0x00038002` to refresh the character list.

---

### Phase 3b: Character Deletion (optional)

```
Client → Login Server   0x00030004   Delete character request
Login Server → Client   0x00038004   Delete character response
```

On success the server sends an updated `0x00038001` to refresh the character list.

---

### Phase 4: Game Server Handoff

Once the player selects a character:

```
Client → Login Server   0x00030005   Game server request (account ID + character ID)
Login Server → Client   0x00038005   Game server info (IP address + port)
```

The client then opens a **new TCP connection** to the game server at the provided IP and port (`24010`).

---

## Account ID Lifecycle

The account ID is the primary session identifier throughout the entire flow:

1. Server assigns it and sends it in `0x00038000` Field B
2. Client echoes it in `0x00030001` for validation
3. Server includes it in `0x00038001` and `0x00038002` headers
4. Client sends it in `0x00030003`, `0x00030004`, `0x00030005`
5. Game server receives it as part of the handoff
6. Game server packets reference it throughout gameplay

---

## Opcode Reference

| Opcode       | Direction          | Name                         | Status   |
| ------------ | ------------------ | ---------------------------- | -------- |
| `0x00000000` | Client → Info      | Info status request          | 🟢 Complete |
| `0x00008000` | Info → Client      | Info status response         | 🟢 Complete |
| `0x00030000` | Client → Login     | Login request                | 🟢 Complete |
| `0x00030001` | Client → Login     | Account ID echo              | 🟢 Complete |
| `0x00030002` | Client → Login     | Request Character data                 | 🟢 Complete |
| `0x00030003` | Client → Login     | Create character             | 🟡 Partial |
| `0x00030004` | Client → Login     | Delete character             | 🟢 Complete |
| `0x00030005` | Client → Login     | Game server request          | 🟢 Complete |
| `0x00038000` | Login → Client     | Login response               | 🟢 Complete |
| `0x00038001` | Login → Client     | Character slot list          | 🟢 Complete |
| `0x00038002` | Login → Client     | Character data               | 🟢 Complete |
| `0x00038003` | Login → Client     | Create character response    | 🟡 Partial |
| `0x00038004` | Login → Client     | Delete character response    | 🟢 Complete |
| `0x00038005` | Login → Client     | Game server info             | 🟡 Partial |

---

## Next Steps

The `0x00030002` unknown packets are the primary remaining gap in login flow documentation. All character management and authentication opcodes are now documented.

The `0x00030003` (create character) and `0x00038005` (game server info) packets are partially documented — additional captures would help confirm the remaining unknown fields.

The game server flow begins at opcode `0x00000016` (`clientToGameServer`) which is visible in the warmuro/dante captures and represents a separate documentation effort.
