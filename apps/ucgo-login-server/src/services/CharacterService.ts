import {
  encodeSkillValue,
  type CharacterSlotRecord,
  type ServerCharacterData38002,
} from "ucgo-core";
import type { CharacterRecord, CharacterRepository } from "../repositories/CharacterRepository.js";

export class CharacterService {
  constructor(private readonly characters: CharacterRepository) {}

  getCharactersForAccount(accountId: number): CharacterRecord[] {
    return this.characters.findByAccountId(accountId);
  }

  getCharacterById(characterId: number): CharacterRecord | undefined {
    return this.characters.findById(characterId);
  }

  isOwnedByAccount(characterId: number, accountId: number): boolean {
    const char = this.characters.findById(characterId);
    return char !== undefined && char.accountId === accountId;
  }

  /**
   * Build the slot records for 0x00038001.
   * Max 2 slots per account; unknown1/unknown2 are always 0xFFFFFFFF.
   */
  buildSlotRecords(chars: CharacterRecord[], accountId: number): CharacterSlotRecord[] {
    return chars.map(char => ({
      accountId,
      characterId: char.characterId,
      unknown1:    0xffffffff,
      unknown2:    0xffffffff,
    }));
  }

  /**
   * Map a CharacterRecord to the wire model for 0x00038002.
   * strength/spirit/luck are encoded from raw levels using encodeSkillValue.
   */
  buildCharacterData(char: CharacterRecord, accountId: number): ServerCharacterData38002 {
    return {
      accountId,
      characterId:     char.characterId,
      gender:          char.gender,
      faction:         char.faction,
      rank:            char.rank,
      name:            char.name,
      createdAt:       char.createdAt,
      score:           char.score,
      losses:          char.losses,
      combatSkills:    char.combatSkills,
      craftingSkills1: char.craftingSkills1,
      craftingSkills2: char.craftingSkills2,
      strength:        encodeSkillValue(char.strength),
      spirit:          encodeSkillValue(char.spirit),
      luck:            encodeSkillValue(char.luck),
      faceIndex:       char.faceIndex,
      hairStyle:       char.hairStyle,
      hairColor:       char.hairColor,
      position: {
        zoneId:    char.zoneId,
        x:         char.x,
        y:         char.y,
        z:         char.z,
        tilt:      0,
        roll:      0,
        direction: char.direction,
      },
    };
  }
}
