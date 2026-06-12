import type { Asset, Category, CustomField, Rarity } from './types';

export const rarityLabels: Record<Rarity, string> = {
  common: '일반',
  rare: '희귀',
  epic: '영웅',
  legendary: '전설',
};

export const defaultCategories: Category[] = [
  {
    key: 'character',
    name: '캐릭터',
    fields: [
      { key: 'stats.hp', label: 'HP', type: 'number', min: 0, max: 9999 },
      { key: 'stats.atk', label: '공격력', type: 'number', min: 0, max: 9999 },
      { key: 'stats.def', label: '방어력', type: 'number', min: 0, max: 9999 },
      { key: 'stats.spd', label: '속도', type: 'number', min: 0, max: 9999 },
      { key: 'level', label: '레벨', type: 'number', min: 1, max: 9999 },
      { key: 'maxLevel', label: '최대 레벨', type: 'number', min: 1, max: 9999 },
      { key: 'skillIds', label: '스킬 참조', type: 'assetRef', refCategory: 'skill', multiple: true },
      { key: 'voiceLine', label: '보이스 라인', type: 'text' },
    ],
  },
  {
    key: 'weapon',
    name: '무기',
    fields: [
      { key: 'weaponType', label: '무기 타입', type: 'enum', options: ['근접', '원거리', '마법'] },
      { key: 'damage', label: '피해량', type: 'number', min: 0, max: 9999 },
      { key: 'range', label: '사거리', type: 'number', min: 0, max: 9999 },
      { key: 'cooldown', label: '쿨다운', type: 'number', min: 0, max: 9999 },
      { key: 'effectIds', label: '이펙트 참조', type: 'assetRef', refCategory: 'skill', multiple: true },
    ],
  },
  {
    key: 'item',
    name: '아이템',
    fields: [
      { key: 'itemType', label: '아이템 타입', type: 'enum', options: ['소비', '장비', '재료', '퀘스트'] },
      { key: 'stackable', label: '중첩 가능', type: 'boolean' },
      { key: 'maxStack', label: '최대 중첩', type: 'number', min: 1, max: 9999 },
      { key: 'price', label: '가격', type: 'number', min: 0, max: 999999 },
      { key: 'effect', label: '효과 설명', type: 'textarea' },
    ],
  },
  {
    key: 'monster',
    name: '적(몬스터)',
    fields: [
      { key: 'stats.hp', label: 'HP', type: 'number', min: 0, max: 9999 },
      { key: 'stats.atk', label: '공격력', type: 'number', min: 0, max: 9999 },
      { key: 'stats.def', label: '방어력', type: 'number', min: 0, max: 9999 },
      { key: 'stats.spd', label: '속도', type: 'number', min: 0, max: 9999 },
      { key: 'dropItemIds', label: '드롭 아이템', type: 'assetRef', refCategory: 'item', multiple: true },
      { key: 'dropRate', label: '드롭 확률(%)', type: 'slider', min: 0, max: 100 },
      { key: 'expReward', label: '경험치 보상', type: 'number', min: 0, max: 999999 },
      { key: 'goldReward', label: '골드 보상', type: 'number', min: 0, max: 999999 },
    ],
  },
  {
    key: 'skill',
    name: '스킬/이펙트',
    fields: [
      { key: 'skillType', label: '스킬 타입', type: 'enum', options: ['공격', '버프', '디버프', '회복'] },
      { key: 'power', label: '위력', type: 'number', min: 0, max: 9999 },
      { key: 'cost', label: '소모값', type: 'number', min: 0, max: 9999 },
      { key: 'cooldown', label: '쿨다운', type: 'number', min: 0, max: 9999 },
      { key: 'targetType', label: '대상', type: 'enum', options: ['단일', '전체', '자신'] },
    ],
  },
  { key: 'ui_icon', name: 'UI 아이콘', fields: [] },
];

export function createAsset(category = 'character', order = 0, name = '새 에셋'): Asset {
  const now = new Date().toISOString();
  const id = uniqueSeed(`${category}_${slugify(name)}`);
  return {
    id,
    name,
    category,
    description: '',
    tags: [],
    rarity: 'common',
    sortOrder: order,
    createdAt: now,
    updatedAt: now,
    data: defaultDataForCategory(category),
  };
}

export function defaultDataForCategory(category: string): Record<string, unknown> {
  const fields = defaultCategories.find((item) => item.key === category)?.fields ?? [];
  return fields.reduce<Record<string, unknown>>((data, field) => {
    setNested(data, field.key, defaultValue(field));
    return data;
  }, {});
}

export function defaultValue(field: CustomField): unknown {
  if (field.type === 'number' || field.type === 'slider') return field.min ?? 0;
  if (field.type === 'boolean') return false;
  if (field.type === 'enum') return field.options?.[0] ?? '';
  if (field.type === 'multiselect' || field.multiple) return [];
  if (field.type === 'color') return '#ffffff';
  return '';
}

export function slugify(input: string) {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const ascii = normalized.replace(/[^a-z0-9_]/g, '');
  return ascii || 'asset';
}

function uniqueSeed(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 7)}`;
}

function setNested(target: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.');
  let cursor = target;
  keys.slice(0, -1).forEach((key) => {
    if (!cursor[key] || typeof cursor[key] !== 'object') cursor[key] = {};
    cursor = cursor[key] as Record<string, unknown>;
  });
  cursor[keys[keys.length - 1]] = value;
}
