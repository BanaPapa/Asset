import { describe, expect, test } from 'vitest';
import { defaultCategories, projectStarStarterAssets } from './defaults';
import { mediaPath, moveArrayItem, safeId, validateProject } from './utils';
import type { AssetMediaMeta, ProjectState } from './types';

function projectWithAssetId(id: string): ProjectState {
  const now = new Date().toISOString();
  return {
    projectName: 'test',
    categories: [],
    assets: [
      {
        id,
        name: 'Test Asset',
        category: 'weapon',
        description: '',
        tags: [],
        rarity: 'common',
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
        data: {},
      },
    ],
    selectedIds: [id],
    theme: 'system',
    viewMode: 'list',
    search: '',
    weaponSettings: { tierMax: 5, rangeMax: 20, apCostMax: 10, rarityOptions: ['common', 'rare', 'epic', 'legendary'] },
  };
}

describe('ID normalization and validation', () => {
  test('keeps underscores and hyphens in English asset IDs', () => {
    expect(safeId('weapon_1')).toBe('weapon_1');
    expect(safeId('weapon-1')).toBe('weapon-1');
  });

  test('accepts IDs with underscores and hyphens', () => {
    const issues = validateProject(projectWithAssetId('weapon-1'));
    expect(issues.filter((issue) => issue.level === 'error')).toEqual([]);
  });
});

describe('moveArrayItem', () => {
  test('moves an item from one index to another without mutating the original array', () => {
    const categories = ['character', 'weapon', 'item'];

    expect(moveArrayItem(categories, 0, 2)).toEqual(['weapon', 'item', 'character']);
    expect(categories).toEqual(['character', 'weapon', 'item']);
  });

  test('returns the original order for out of range indexes', () => {
    expect(moveArrayItem(['character', 'weapon'], -1, 1)).toEqual(['character', 'weapon']);
    expect(moveArrayItem(['character', 'weapon'], 0, 4)).toEqual(['character', 'weapon']);
  });
});

describe('mediaPath', () => {
  test('exports media into asset folders by slot key', () => {
    const media: AssetMediaMeta = {
      slotKey: 'sprite_sheet',
      slotType: 'spriteSheet',
      fileName: 'ship.png',
      mimeType: 'image/png',
      width: 256,
      height: 128,
      size: 2048,
      sprite: {
        frameWidth: 64,
        frameHeight: 64,
        columns: 4,
        rows: 2,
        fps: 12,
      },
    };

    expect(mediaPath('ship_destroyer_01', media)).toBe('images/ship_destroyer_01/sprite_sheet.png');
  });
});

describe('Project Star default schema', () => {
  test('includes strategic data categories for the MVP loop', () => {
    const keys = defaultCategories.map((category) => category.key);

    expect(keys).toEqual(
      expect.arrayContaining([
        'star_system',
        'planet',
        'faction',
        'faction_relation',
        'ship_hull',
        'ship',
        'weapon',
        'research',
        'skill_tree',
        'production_recipe',
        'drop_table',
        'mission',
        'story_chapter',
        'string_table',
      ]),
    );
  });

  test('ships have sprite sheet and card media slots', () => {
    const ship = defaultCategories.find((category) => category.key === 'ship');

    expect(ship?.mediaSlots?.map((slot) => slot.key)).toEqual(expect.arrayContaining(['sprite_sheet', 'card', 'icon']));
  });

  test('starter assets include the five core systems, five factions, and six player hull tiers', () => {
    const ids = projectStarStarterAssets.map((asset) => asset.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        'system_daedalus',
        'system_arcadia',
        'system_orpheus',
        'system_chronos',
        'system_nihil',
        'faction_daedalus',
        'faction_arcadia',
        'faction_orpheus',
        'faction_chronos',
        'faction_nihil',
        'hull_gunship',
        'hull_frigate',
        'hull_destroyer',
        'hull_cruiser',
        'hull_battlecruiser',
        'hull_battleship',
      ]),
    );
  });
});
