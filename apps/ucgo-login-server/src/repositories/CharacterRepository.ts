export interface CharacterRecord {
  characterId: number;
  accountId: number;
  name: string;
  /** 0x01 = Female, 0x02 = Male */
  gender: number;
  /** 0x01 = Zeon, 0x02 = Earth Federation */
  faction: number;
  faceIndex: number;
  hairStyle: number;
  hairColor: number;
  rank: number;
  /** Unix epoch seconds */
  createdAt: number;
  score: number;
  losses: number;
  /** Raw stat level (not yet encoded). CharacterService applies encodeSkillValue. */
  strength: number;
  spirit: number;
  luck: number;
  /** 21 pre-encoded combat skill values (pass through to ServerCharacterData38002). */
  combatSkills: number[];
  /** 7 pre-encoded crafting skill values (group 1). */
  craftingSkills1: number[];
  /** 10 pre-encoded crafting skill values (group 2). */
  craftingSkills2: number[];
  zoneId: number;
  x: number;
  y: number;
  z: number;
  direction: number;
}

export interface CharacterRepository {
  findByAccountId(accountId: number): CharacterRecord[];
  findById(characterId: number): CharacterRecord | undefined;
}
