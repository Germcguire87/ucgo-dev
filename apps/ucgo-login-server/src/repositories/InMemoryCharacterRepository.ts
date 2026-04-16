import type { CharacterRecord, CharacterRepository } from "./CharacterRepository.js";

/**
 * Seed characters for local development and testing.
 *
 * Skill arrays are pre-encoded values (0 = skill at level 0).
 * Strength/spirit/luck are raw levels; CharacterService encodes them.
 */
const SEED_CHARACTERS: CharacterRecord[] = [
  // ── Account 2 (onechar) — female Zeon pilot ───────────────────────────────
  {
    characterId:     0x00001001,
    accountId:       0x00000002,
    name:            "Solo Pilot",
    gender:          0x01,  // Female
    faction:         0x01,  // Zeon
    faceIndex:       0,
    hairStyle:       1,
    hairColor:       0,
    rank:            1,
    createdAt:       1_700_000_000,
    score:           0,
    losses:          0,
    strength:        3,
    spirit:          3,
    luck:            3,
    combatSkills:    new Array<number>(21).fill(0),
    craftingSkills1: new Array<number>(7).fill(0),
    craftingSkills2: new Array<number>(10).fill(0),
    zoneId:          1,
    x:               0,
    y:               0,
    z:               0,
    direction:       0,
  },

  // ── Account 3 (twochars) — first character: male Earth Federation ─────────
  {
    characterId:     0x00002001,
    accountId:       0x00000003,
    name:            "Alpha",
    gender:          0x02,  // Male
    faction:         0x02,  // Earth Federation
    faceIndex:       1,
    hairStyle:       2,
    hairColor:       1,
    rank:            1,
    createdAt:       1_700_000_000,
    score:           100,
    losses:          5,
    strength:        4,
    spirit:          3,
    luck:            2,
    combatSkills:    new Array<number>(21).fill(0),
    craftingSkills1: new Array<number>(7).fill(0),
    craftingSkills2: new Array<number>(10).fill(0),
    zoneId:          1,
    x:               1000,
    y:               500,
    z:               200,
    direction:       90,
  },

  // ── Account 3 (twochars) — second character: female Zeon ─────────────────
  {
    characterId:     0x00002002,
    accountId:       0x00000003,
    name:            "Beta",
    gender:          0x01,  // Female
    faction:         0x01,  // Zeon
    faceIndex:       2,
    hairStyle:       0,
    hairColor:       2,
    rank:            2,
    createdAt:       1_700_000_000,
    score:           250,
    losses:          10,
    strength:        3,
    spirit:          5,
    luck:            3,
    combatSkills:    new Array<number>(21).fill(0),
    craftingSkills1: new Array<number>(7).fill(0),
    craftingSkills2: new Array<number>(10).fill(0),
    zoneId:          1,
    x:               -500,
    y:               300,
    z:               100,
    direction:       180,
  },
];

export class InMemoryCharacterRepository implements CharacterRepository {
  private readonly byAccount = new Map<number, CharacterRecord[]>();
  private readonly byId      = new Map<number, CharacterRecord>();

  constructor() {
    for (const char of SEED_CHARACTERS) {
      const list = this.byAccount.get(char.accountId) ?? [];
      list.push(char);
      this.byAccount.set(char.accountId, list);
      this.byId.set(char.characterId, char);
    }
  }

  findByAccountId(accountId: number): CharacterRecord[] {
    return this.byAccount.get(accountId) ?? [];
  }

  findById(characterId: number): CharacterRecord | undefined {
    return this.byId.get(characterId);
  }
}
