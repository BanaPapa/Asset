import type { Asset, Category, CustomField, Rarity } from './types';

export const rarityLabels: Record<Rarity, string> = {
  common: '일반',
  rare: '희귀',
  epic: '영웅',
  legendary: '전설',
};

const commonTextFields: CustomField[] = [
  { key: 'textKey', label: '문자열 키', type: 'text' },
  { key: 'lore', label: '설정 메모', type: 'textarea' },
];

export const defaultCategories: Category[] = [
  {
    key: 'star_system',
    name: '성계',
    mediaSlots: [
      { key: 'map', label: '성계 지도', type: 'image' },
      { key: 'backdrop', label: '배경 이미지', type: 'image' },
    ],
    fields: [
      ...commonTextFields,
      { key: 'chapterId', label: '등장 장', type: 'assetRef', refCategory: 'story_chapter' },
      { key: 'factionId', label: '주요 세력', type: 'assetRef', refCategory: 'faction' },
      { key: 'threatLevel', label: '위험도', type: 'number', min: 1, max: 10 },
      { key: 'unlockAfterMissionId', label: '해금 미션', type: 'assetRef', refCategory: 'mission' },
    ],
  },
  {
    key: 'planet',
    name: '행성/거점',
    mediaSlots: [
      { key: 'portrait', label: '행성 이미지', type: 'image' },
      { key: 'icon', label: '아이콘', type: 'image' },
    ],
    fields: [
      ...commonTextFields,
      { key: 'systemId', label: '소속 성계', type: 'assetRef', refCategory: 'star_system' },
      { key: 'ownerFactionId', label: '초기 소유 세력', type: 'assetRef', refCategory: 'faction' },
      { key: 'resourceIds', label: '생산 자원', type: 'assetRef', refCategory: 'resource', multiple: true },
      { key: 'productionValue', label: '생산력', type: 'number', min: 0, max: 9999 },
      { key: 'researchValue', label: '연구력', type: 'number', min: 0, max: 9999 },
      { key: 'defenseValue', label: '방어력', type: 'number', min: 0, max: 9999 },
    ],
  },
  {
    key: 'faction',
    name: '세력',
    mediaSlots: [
      { key: 'emblem', label: '문장', type: 'image' },
      { key: 'banner', label: '배너', type: 'image' },
    ],
    fields: [
      ...commonTextFields,
      { key: 'role', label: '역할', type: 'enum', options: ['player', 'ally', 'neutral', 'enemy', 'final_enemy'] },
      { key: 'homeSystemId', label: '본거지 성계', type: 'assetRef', refCategory: 'star_system' },
      { key: 'color', label: '대표 색상', type: 'color' },
      { key: 'economyBias', label: '경제 성향', type: 'number', min: 0, max: 10 },
      { key: 'researchBias', label: '연구 성향', type: 'number', min: 0, max: 10 },
      { key: 'militaryBias', label: '군사 성향', type: 'number', min: 0, max: 10 },
    ],
  },
  {
    key: 'faction_relation',
    name: '세력 관계',
    fields: [
      { key: 'sourceFactionId', label: '세력 A', type: 'assetRef', refCategory: 'faction', required: true },
      { key: 'targetFactionId', label: '세력 B', type: 'assetRef', refCategory: 'faction', required: true },
      { key: 'stance', label: '관계', type: 'enum', options: ['allied', 'friendly', 'neutral', 'hostile', 'locked_hostile'] },
      { key: 'score', label: '관계 점수', type: 'number', min: -100, max: 100 },
      { key: 'notes', label: '관계 설명', type: 'textarea' },
    ],
  },
  {
    key: 'resource',
    name: '자원',
    mediaSlots: [{ key: 'icon', label: '아이콘', type: 'image' }],
    fields: [
      ...commonTextFields,
      { key: 'resourceType', label: '자원 유형', type: 'enum', options: ['material', 'energy', 'research', 'currency', 'special'] },
      { key: 'baseValue', label: '기본 가치', type: 'number', min: 0, max: 999999 },
    ],
  },
  {
    key: 'ship_hull',
    name: '함급',
    mediaSlots: [{ key: 'icon', label: '아이콘', type: 'image' }],
    fields: [
      ...commonTextFields,
      { key: 'tier', label: '티어', type: 'number', min: 1, max: 6 },
      { key: 'commandCost', label: '지휘 비용', type: 'number', min: 0, max: 9999 },
      { key: 'baseHp', label: '기본 HP', type: 'number', min: 0, max: 999999 },
      { key: 'baseArmor', label: '기본 장갑', type: 'number', min: 0, max: 999999 },
      { key: 'baseSpeed', label: '기본 속도', type: 'number', min: 0, max: 9999 },
    ],
  },
  {
    key: 'ship',
    name: '함선',
    mediaSlots: [
      { key: 'sprite_sheet', label: '스프라이트 시트', type: 'spriteSheet' },
      { key: 'card', label: '함선 카드', type: 'card' },
      { key: 'icon', label: '아이콘', type: 'image' },
    ],
    fields: [
      ...commonTextFields,
      { key: 'factionId', label: '소속 세력', type: 'assetRef', refCategory: 'faction' },
      { key: 'hullId', label: '함급', type: 'assetRef', refCategory: 'ship_hull' },
      { key: 'weaponIds', label: '무장', type: 'assetRef', refCategory: 'weapon', multiple: true },
      { key: 'unlockResearchId', label: '해금 연구', type: 'assetRef', refCategory: 'research' },
      { key: 'productionCost', label: '생산 비용', type: 'number', min: 0, max: 999999 },
      { key: 'supplyCost', label: '보급 비용', type: 'number', min: 0, max: 9999 },
    ],
  },
  {
    key: 'weapon',
    name: '무기',
    mediaSlots: [
      { key: 'icon', label: '아이콘', type: 'image' },
      { key: 'effect_preview', label: '이펙트 미리보기', type: 'image' },
    ],
    fields: [
      ...commonTextFields,
      { key: 'weaponType', label: '무기 유형', type: 'enum', options: ['beam', 'missile', 'kinetic', 'drone', 'ancient'] },
      { key: 'damage', label: '피해량', type: 'number', min: 0, max: 999999 },
      { key: 'range', label: '사거리', type: 'number', min: 0, max: 9999 },
      { key: 'cooldown', label: '쿨다운', type: 'number', min: 0, max: 9999 },
      { key: 'requiredHullIds', label: '장착 가능 함급', type: 'assetRef', refCategory: 'ship_hull', multiple: true },
    ],
  },
  {
    key: 'research',
    name: '연구',
    mediaSlots: [{ key: 'icon', label: '아이콘', type: 'image' }],
    fields: [
      ...commonTextFields,
      { key: 'researchType', label: '연구 분야', type: 'enum', options: ['exploration', 'production', 'combat', 'ancient', 'story'] },
      { key: 'cost', label: '연구 비용', type: 'number', min: 0, max: 999999 },
      { key: 'prerequisiteIds', label: '선행 연구', type: 'assetRef', refCategory: 'research', multiple: true },
      { key: 'unlockShipIds', label: '해금 함선', type: 'assetRef', refCategory: 'ship', multiple: true },
      { key: 'unlockMissionIds', label: '해금 미션', type: 'assetRef', refCategory: 'mission', multiple: true },
    ],
  },
  {
    key: 'skill',
    name: '스킬/능력',
    mediaSlots: [
      { key: 'icon', label: '아이콘', type: 'image' },
      { key: 'effect_preview', label: '이펙트 미리보기', type: 'image' },
    ],
    fields: [
      ...commonTextFields,
      { key: 'skillType', label: '스킬 유형', type: 'enum', options: ['passive', 'active', 'upgrade', 'fleet_bonus'] },
      { key: 'effectJson', label: '효과 JSON', type: 'textarea' },
      { key: 'requiredResearchId', label: '필요 연구', type: 'assetRef', refCategory: 'research' },
    ],
  },
  {
    key: 'skill_tree',
    name: '스킬 트리',
    fields: [
      ...commonTextFields,
      { key: 'ownerType', label: '대상 유형', type: 'enum', options: ['faction', 'ship_hull', 'commander', 'global'] },
      { key: 'ownerId', label: '대상 ID', type: 'text' },
      { key: 'nodeIds', label: '노드 스킬', type: 'assetRef', refCategory: 'skill', multiple: true },
      { key: 'edgesJson', label: '연결 JSON', type: 'textarea' },
    ],
  },
  {
    key: 'production_recipe',
    name: '생산/제작식',
    fields: [
      { key: 'outputAssetId', label: '생산 대상 ID', type: 'text', required: true },
      { key: 'facilityType', label: '시설 유형', type: 'enum', options: ['shipyard', 'planet', 'station', 'research_lab'] },
      { key: 'costJson', label: '비용 JSON', type: 'textarea' },
      { key: 'turns', label: '소요 턴', type: 'number', min: 1, max: 999 },
      { key: 'requiredResearchId', label: '필요 연구', type: 'assetRef', refCategory: 'research' },
    ],
  },
  {
    key: 'drop_table',
    name: '보상/드롭 테이블',
    fields: [
      ...commonTextFields,
      { key: 'sourceAssetId', label: '대상 ID', type: 'text' },
      { key: 'entriesJson', label: '보상 목록 JSON', type: 'textarea' },
    ],
  },
  {
    key: 'mission',
    name: '미션/전투',
    fields: [
      ...commonTextFields,
      { key: 'chapterId', label: '소속 장', type: 'assetRef', refCategory: 'story_chapter' },
      { key: 'systemId', label: '성계', type: 'assetRef', refCategory: 'star_system' },
      { key: 'missionType', label: '미션 유형', type: 'enum', options: ['exploration', 'conquest', 'battle', 'research_unlock', 'finale'] },
      { key: 'enemyFactionId', label: '적 세력', type: 'assetRef', refCategory: 'faction' },
      { key: 'objectiveJson', label: '목표 JSON', type: 'textarea' },
      { key: 'rewardJson', label: '보상 JSON', type: 'textarea' },
      { key: 'unlockMissionIds', label: '후속 미션', type: 'assetRef', refCategory: 'mission', multiple: true },
    ],
  },
  {
    key: 'story_chapter',
    name: '스토리 장',
    fields: [
      ...commonTextFields,
      { key: 'chapterNumber', label: '장 번호', type: 'number', min: 0, max: 99 },
      { key: 'primarySystemId', label: '주요 성계', type: 'assetRef', refCategory: 'star_system' },
      { key: 'summary', label: '요약', type: 'textarea' },
    ],
  },
  {
    key: 'string_table',
    name: '문자열/i18n',
    fields: [
      { key: 'namespace', label: '네임스페이스', type: 'enum', options: ['system', 'faction', 'ship', 'research', 'mission', 'ui', 'story'] },
      { key: 'ko', label: '한국어', type: 'textarea' },
      { key: 'en', label: '영어', type: 'textarea' },
      { key: 'ja', label: '일본어', type: 'textarea' },
      { key: 'zhHans', label: '중국어 간체', type: 'textarea' },
      { key: 'zhHant', label: '중국어 번체', type: 'textarea' },
    ],
  },
  {
    key: 'ui_icon',
    name: 'UI 아이콘',
    mediaSlots: [{ key: 'icon', label: '아이콘', type: 'image' }],
    fields: [{ key: 'usage', label: '사용처', type: 'text' }],
  },
];

let starterSortOrder = 0;

export const projectStarStarterAssets: Asset[] = [
  starterAsset('faction_daedalus', '다이달로스', 'faction', {
    textKey: 'faction_daedalus',
    role: 'player',
    homeSystemId: 'system_daedalus',
    color: '#69d2ff',
    economyBias: 5,
    researchBias: 6,
    militaryBias: 5,
    lore: '고대 관문 정거장을 기반으로 성장하는 플레이어 개척 함대.',
  }),
  starterAsset('faction_arcadia', '아르카디아', 'faction', {
    textKey: 'faction_arcadia',
    role: 'ally',
    homeSystemId: 'system_arcadia',
    color: '#ffd166',
    economyBias: 9,
    researchBias: 4,
    militaryBias: 5,
    lore: '경제력과 생산력이 뛰어난 인류 식민 세력.',
  }),
  starterAsset('faction_orpheus', '오르페우스', 'faction', {
    textKey: 'faction_orpheus',
    role: 'neutral',
    homeSystemId: 'system_orpheus',
    color: '#8bd3ff',
    economyBias: 4,
    researchBias: 10,
    militaryBias: 3,
    lore: '과학자와 연구자들의 연합.',
  }),
  starterAsset('faction_chronos', '크로노스', 'faction', {
    textKey: 'faction_chronos',
    role: 'enemy',
    homeSystemId: 'system_chronos',
    color: '#b8bcc8',
    economyBias: 3,
    researchBias: 7,
    militaryBias: 9,
    lore: '고대 방어 네트워크와 자동화 군사 시스템.',
  }),
  starterAsset('faction_nihil', '니힐', 'faction', {
    textKey: 'faction_nihil',
    role: 'final_enemy',
    homeSystemId: 'system_nihil',
    color: '#7f5af0',
    economyBias: 2,
    researchBias: 10,
    militaryBias: 10,
    lore: '고대 문명 붕괴와 관련된 후반부 적대 세력.',
  }),
  starterAsset('system_daedalus', '다이달로스', 'star_system', { textKey: 'system_daedalus', factionId: 'faction_daedalus', threatLevel: 1, lore: '플레이어 시작 성계이자 관문 정거장.' }),
  starterAsset('system_arcadia', '아르카디아', 'star_system', { textKey: 'system_arcadia', factionId: 'faction_arcadia', threatLevel: 2, lore: '자원과 생산 시설이 풍부한 경제 중심지.' }),
  starterAsset('system_orpheus', '오르페우스', 'star_system', { textKey: 'system_orpheus', factionId: 'faction_orpheus', threatLevel: 4, lore: '연구소와 실험 시설이 모인 성계.' }),
  starterAsset('system_chronos', '크로노스', 'star_system', { textKey: 'system_chronos', factionId: 'faction_chronos', threatLevel: 7, lore: '고대 방어망이 가동 중인 성계.' }),
  starterAsset('system_nihil', '니힐', 'star_system', { textKey: 'system_nihil', factionId: 'faction_nihil', threatLevel: 10, lore: '최종 결전으로 이어지는 미지의 성계.' }),
  starterAsset('hull_gunship', '건십', 'ship_hull', { textKey: 'ship_gunship', tier: 1, commandCost: 1, baseHp: 100, baseArmor: 5, baseSpeed: 8 }),
  starterAsset('hull_frigate', '프리깃', 'ship_hull', { textKey: 'ship_frigate', tier: 2, commandCost: 2, baseHp: 180, baseArmor: 12, baseSpeed: 7 }),
  starterAsset('hull_destroyer', '디스트로이어', 'ship_hull', { textKey: 'ship_destroyer', tier: 3, commandCost: 3, baseHp: 300, baseArmor: 22, baseSpeed: 6 }),
  starterAsset('hull_cruiser', '크루저', 'ship_hull', { textKey: 'ship_cruiser', tier: 4, commandCost: 5, baseHp: 520, baseArmor: 36, baseSpeed: 5 }),
  starterAsset('hull_battlecruiser', '배틀크루저', 'ship_hull', { textKey: 'ship_battlecruiser', tier: 5, commandCost: 7, baseHp: 760, baseArmor: 52, baseSpeed: 4 }),
  starterAsset('hull_battleship', '배틀십', 'ship_hull', { textKey: 'ship_battleship', tier: 6, commandCost: 10, baseHp: 1100, baseArmor: 75, baseSpeed: 3 }),
  starterAsset('chapter_prologue', '프롤로그', 'story_chapter', { textKey: 'chapter_prologue', chapterNumber: 0, primarySystemId: 'system_daedalus', summary: '다이달로스 정거장 발견.' }),
  starterAsset('chapter_arcadia', '1장 - 아르카디아', 'story_chapter', { textKey: 'chapter_arcadia', chapterNumber: 1, primarySystemId: 'system_arcadia', summary: '자원 확보와 첫 점령.' }),
  starterAsset('chapter_orpheus', '2장 - 오르페우스', 'story_chapter', { textKey: 'chapter_orpheus', chapterNumber: 2, primarySystemId: 'system_orpheus', summary: '연구 시스템 해금.' }),
  starterAsset('chapter_chronos', '3장 - 크로노스', 'story_chapter', { textKey: 'chapter_chronos', chapterNumber: 3, primarySystemId: 'system_chronos', summary: '고대 방어망 돌파.' }),
  starterAsset('chapter_nihil', '4장 - 니힐', 'story_chapter', { textKey: 'chapter_nihil', chapterNumber: 4, primarySystemId: 'system_nihil', summary: '최종 결전.' }),
];

export function createAsset(category = 'ship', order = 0, name = '새 에셋'): Asset {
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
    .replace(/[^a-z0-9가-힣_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const ascii = normalized.replace(/[^a-z0-9_-]/g, '');
  return ascii || 'asset';
}

function starterAsset(id: string, name: string, category: string, data: Record<string, unknown>): Asset {
  const now = '2026-01-01T00:00:00.000Z';
  return {
    id,
    name,
    category,
    description: '',
    tags: [],
    rarity: 'common',
    sortOrder: starterSortOrder++,
    createdAt: now,
    updatedAt: now,
    data: { ...defaultDataForCategory(category), ...data },
  };
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
