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
    group: '세계',
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
    group: '세계',
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
    group: '세계',
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
    group: '세계',
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
    group: '세계',
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
    group: '함대',
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
    group: '함대',
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
    group: '함대',
    mediaSlots: [
      { key: 'concept', label: '컨셉아트', type: 'image', sizeHint: '1280×720' },
      { key: 'icon', label: '아이콘', type: 'image', sizeHint: '256×256' },
      { key: 'card', label: '카드UI', type: 'card', sizeHint: '512×768' },
      { key: 'sprite_sheet', label: '스프라이트시트', type: 'spriteSheet', sizeHint: '128×128/프레임' },
    ],
    fields: [
      ...commonTextFields,
      { key: 'weaponFamily', label: '무기 계열', type: 'enum', options: ['laser', 'ion', 'plasma', 'gravity', 'antimatter'] },
      { key: 'tier', label: '단계', type: 'number', min: 1, max: 5 },
      { key: 'nameEn', label: '영문명', type: 'text' },
      { key: 'damage', label: '공격력', type: 'number', min: 0, max: 999 },
      { key: 'range', label: '사거리', type: 'number', min: 0, max: 20 },
      { key: 'apCost', label: 'AP 소모', type: 'number', min: 0, max: 10 },
      { key: 'accuracy', label: '명중률(%)', type: 'slider', min: 0, max: 100 },
      { key: 'shieldPierce', label: '쉴드 관통력(%)', type: 'slider', min: 0, max: 100 },
      { key: 'areaType', label: '범위 유형', type: 'enum', options: ['none', 'line_single', 'dir8_single', 'line_pierce', 'deflect_line', 'deflect_pierce', 'aoe_5x5', 'aoe_3x3', 'scatter_blackhole'] },
      { key: 'cooldown', label: '쿨타임', type: 'number', min: 0, max: 10 },
      { key: 'specialEffect', label: '특수효과', type: 'textarea' },
    ],
  },
  {
    key: 'research',
    name: '연구',
    group: '개발/능력',
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
    group: '개발/능력',
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
    group: '개발/능력',
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
    group: '경제',
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
    group: '경제',
    fields: [
      ...commonTextFields,
      { key: 'sourceAssetId', label: '대상 ID', type: 'text' },
      { key: 'entriesJson', label: '보상 목록 JSON', type: 'textarea' },
    ],
  },
  {
    key: 'mission',
    name: '미션/전투',
    group: '콘텐츠',
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
    group: '콘텐츠',
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
    group: '콘텐츠',
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
    group: '콘텐츠',
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

  // === Laser ===
  starterAsset('wpn_laser_line', '선형 레이저', 'weapon', {
    textKey: 'wpn_laser_line', weaponFamily: 'laser', tier: 1, nameEn: 'Line Laser',
    damage: 90, range: 10, apCost: 2, accuracy: 95, shieldPierce: 10,
    areaType: 'line_single', cooldown: 0,
    specialEffect: '상하좌우 직선 조준. 처음 닿은 적 1기만 피해.',
  }),
  starterAsset('wpn_laser_vector', '벡터 레이저', 'weapon', {
    textKey: 'wpn_laser_vector', weaponFamily: 'laser', tier: 2, nameEn: 'Vector Laser',
    damage: 95, range: 10, apCost: 2, accuracy: 93, shieldPierce: 12,
    areaType: 'dir8_single', cooldown: 0,
    specialEffect: '8방향 조준. 첫 번째 적 1기만 피해.',
  }),
  starterAsset('wpn_laser_pierce', '관통 빔', 'weapon', {
    textKey: 'wpn_laser_pierce', weaponFamily: 'laser', tier: 3, nameEn: 'Piercing Beam',
    damage: 100, range: 11, apCost: 3, accuracy: 90, shieldPierce: 18,
    areaType: 'line_pierce', cooldown: 0,
    specialEffect: '직선/대각선 라인의 두 번째 적까지 관통. 두 번째 적 50% 피해.',
  }, 'rare'),
  starterAsset('wpn_laser_deflection', '굴절 빔', 'weapon', {
    textKey: 'wpn_laser_deflection', weaponFamily: 'laser', tier: 4, nameEn: 'Deflection Beam',
    damage: 105, range: 11, apCost: 3, accuracy: 88, shieldPierce: 22,
    areaType: 'deflect_line', cooldown: 1,
    specialEffect: '장애물·아군·적군을 굴절점으로 1회 꺾임. 아군은 피해 없이 굴절점 역할.',
  }, 'epic'),
  starterAsset('wpn_laser_phase_lance', '위상 랜스', 'weapon', {
    textKey: 'wpn_laser_phase_lance', weaponFamily: 'laser', tier: 5, nameEn: 'Phase Lance',
    damage: 120, range: 12, apCost: 4, accuracy: 87, shieldPierce: 35,
    areaType: 'deflect_pierce', cooldown: 1,
    specialEffect: '직선 또는 굴절 경로에서 최대 3기 타격. 1·2번째 100%, 3번째 50% 피해.',
  }, 'legendary'),

  // === Ion ===
  starterAsset('wpn_ion_jammer', '이온 재머', 'weapon', {
    textKey: 'wpn_ion_jammer', weaponFamily: 'ion', tier: 1, nameEn: 'Ion Jammer',
    damage: 45, range: 7, apCost: 2, accuracy: 90, shieldPierce: 5,
    areaType: 'none', cooldown: 0,
    specialEffect: '명중률/회피율 30% 감소. 1턴 지속.',
  }),
  starterAsset('wpn_ap_disruptor', '행동력 교란기', 'weapon', {
    textKey: 'wpn_ap_disruptor', weaponFamily: 'ion', tier: 2, nameEn: 'AP Disruptor',
    damage: 50, range: 7, apCost: 2, accuracy: 87, shieldPierce: 8,
    areaType: 'none', cooldown: 0,
    specialEffect: '일정 확률 AP -2. 낮은 확률 1턴 스턴. 동시 발생 없음.',
  }),
  starterAsset('wpn_shield_nullifier', '쉴드 무력화기', 'weapon', {
    textKey: 'wpn_shield_nullifier', weaponFamily: 'ion', tier: 3, nameEn: 'Shield Nullifier',
    damage: 55, range: 8, apCost: 3, accuracy: 85, shieldPierce: 15,
    areaType: 'none', cooldown: 1,
    specialEffect: '30% 확률 쉴드 무력화. 성공 시 충전율 0%, 1턴 재충전 불가.',
  }, 'rare'),
  starterAsset('wpn_iff_scrambler', '피아식별 교란기', 'weapon', {
    textKey: 'wpn_iff_scrambler', weaponFamily: 'ion', tier: 4, nameEn: 'IFF Scrambler',
    damage: 40, range: 8, apCost: 3, accuracy: 82, shieldPierce: 10,
    areaType: 'none', cooldown: 2,
    specialEffect: '다음 1턴 동안 같은 편을 적으로 인식해 자기편에게 일반 공격.',
  }, 'epic'),
  starterAsset('wpn_system_collapse', '시스템 붕괴', 'weapon', {
    textKey: 'wpn_system_collapse', weaponFamily: 'ion', tier: 5, nameEn: 'System Collapse',
    damage: 65, range: 9, apCost: 4, accuracy: 80, shieldPierce: 20,
    areaType: 'none', cooldown: 3,
    specialEffect: '명중률/회피율 -70% 확정. 쉴드 무력화 60% 확률. 조건부 행동력 상실 판정.',
  }, 'legendary'),

  // === Plasma ===
  starterAsset('wpn_armor_melter', '아머 멜터', 'weapon', {
    textKey: 'wpn_armor_melter', weaponFamily: 'plasma', tier: 1, nameEn: 'Armor Melter',
    damage: 75, range: 6, apCost: 2, accuracy: 85, shieldPierce: 15,
    areaType: 'none', cooldown: 0,
    specialEffect: '1턴간 방어력 30% 감소. 낮은 확률로 전투 종료까지 방어력 30% 감소.',
  }),
  starterAsset('wpn_core_melter', '코어 멜터', 'weapon', {
    textKey: 'wpn_core_melter', weaponFamily: 'plasma', tier: 2, nameEn: 'Core Melter',
    damage: 80, range: 6, apCost: 2, accuracy: 83, shieldPierce: 18,
    areaType: 'none', cooldown: 0,
    specialEffect: '1턴간 방어력/공격력 30% 감소. 낮은 확률로 전투 종료까지 둘 다 지속.',
  }),
  starterAsset('wpn_plasma_burst', '플라즈마 버스트', 'weapon', {
    textKey: 'wpn_plasma_burst', weaponFamily: 'plasma', tier: 3, nameEn: 'Plasma Burst',
    damage: 90, range: 6, apCost: 3, accuracy: 78, shieldPierce: 20,
    areaType: 'aoe_5x5', cooldown: 1,
    specialEffect: '5×5 광역 폭발. 중심 100%·거리1 80%·거리2 60%. 아군도 피해.',
  }, 'rare'),
  starterAsset('wpn_hellfire_burst', '헬파이어 버스트', 'weapon', {
    textKey: 'wpn_hellfire_burst', weaponFamily: 'plasma', tier: 4, nameEn: 'Hellfire Burst',
    damage: 105, range: 6, apCost: 4, accuracy: 75, shieldPierce: 25,
    areaType: 'aoe_5x5', cooldown: 2,
    specialEffect: '5×5 강화 폭발(중심 120%·거리1 100%·거리2 80%) + 잔열 지대. 잔열 안 대상: 도트 피해 + 장갑 방어력 50% 감소.',
  }, 'epic'),
  starterAsset('wpn_armor_annihilator', '아머 애니힐레이터', 'weapon', {
    textKey: 'wpn_armor_annihilator', weaponFamily: 'plasma', tier: 5, nameEn: 'Armor Annihilator',
    damage: 130, range: 5, apCost: 4, accuracy: 78, shieldPierce: 70,
    areaType: 'none', cooldown: 2,
    specialEffect: '쉴드 무시 직접 피해. 일반 적 아머 무력화. 보스: 방어도 50% 감소 + 최대 HP 손상 판정.',
  }, 'legendary'),

  // === Gravity ===
  starterAsset('wpn_graviton_ram', '그래비톤 램', 'weapon', {
    textKey: 'wpn_graviton_ram', weaponFamily: 'gravity', tier: 1, nameEn: 'Graviton Ram',
    damage: 65, range: 6, apCost: 2, accuracy: 88, shieldPierce: 5,
    areaType: 'none', cooldown: 0,
    specialEffect: '적 1기를 8방향 중 원하는 방향으로 최대 5칸 밀어냄. 충돌 시 양쪽 충격 피해.',
  }),
  starterAsset('wpn_spatial_displacer', '공간 전위기', 'weapon', {
    textKey: 'wpn_spatial_displacer', weaponFamily: 'gravity', tier: 2, nameEn: 'Spatial Displacer',
    damage: 55, range: 10, apCost: 3, accuracy: 82, shieldPierce: 10,
    areaType: 'none', cooldown: 1,
    specialEffect: '시전자 10칸 이내 적 1기를 빈 좌표로 워프. 워프 충격 피해. 낮은 확률 전장 이탈.',
  }),
  starterAsset('wpn_gravity_well', '중력 우물', 'weapon', {
    textKey: 'wpn_gravity_well', weaponFamily: 'gravity', tier: 3, nameEn: 'Gravity Well',
    damage: 30, range: 7, apCost: 3, accuracy: 85, shieldPierce: 0,
    areaType: 'aoe_5x5', cooldown: 2,
    specialEffect: '5×5 지정 좌표에 중력장. AP 소모 2배, 공격력 50%, 받는 피해 2배. 1턴 지속.',
  }, 'rare'),
  starterAsset('wpn_gravity_collapse', '중력 붕괴', 'weapon', {
    textKey: 'wpn_gravity_collapse', weaponFamily: 'gravity', tier: 4, nameEn: 'Gravity Collapse',
    damage: 85, range: 7, apCost: 4, accuracy: 78, shieldPierce: 10,
    areaType: 'aoe_5x5', cooldown: 3,
    specialEffect: '5×5 범위 적을 중심부 집결 후 충돌 피해. 이후 2턴간 중력장 효과 발생.',
  }, 'epic'),
  starterAsset('wpn_event_horizon', '사건의 지평선', 'weapon', {
    textKey: 'wpn_event_horizon', weaponFamily: 'gravity', tier: 5, nameEn: 'Event Horizon',
    damage: 110, range: 7, apCost: 5, accuracy: 75, shieldPierce: 20,
    areaType: 'aoe_5x5', cooldown: 4,
    specialEffect: '5×5 100% 피해. 다음 턴 이동 봉쇄, 다다음 턴 AP 2배. 공격력/방어력 약화 + 도트 피해.',
  }, 'legendary'),

  // === Antimatter ===
  starterAsset('wpn_thruster_eraser', '추진계 절삭탄', 'weapon', {
    textKey: 'wpn_thruster_eraser', weaponFamily: 'antimatter', tier: 1, nameEn: 'Thruster Eraser',
    damage: 70, range: 6, apCost: 2, accuracy: 82, shieldPierce: 25,
    areaType: 'none', cooldown: 0,
    specialEffect: '높은 확률 이동 효율 50% 감소. 낮은 확률 다음 턴 이동 불가. MOVE 태그 행동만 제한.',
  }),
  starterAsset('wpn_defense_eraser', '방어층 소거기', 'weapon', {
    textKey: 'wpn_defense_eraser', weaponFamily: 'antimatter', tier: 2, nameEn: 'Defense Eraser',
    damage: 75, range: 6, apCost: 3, accuracy: 80, shieldPierce: 35,
    areaType: 'none', cooldown: 1,
    specialEffect: '높은 확률 장갑 내구도 50% + 쉴드 50% 소멸. 재피격 시 장갑/쉴드 완전 붕괴.',
  }),
  starterAsset('wpn_antimatter_field', '반물질 에너지장', 'weapon', {
    textKey: 'wpn_antimatter_field', weaponFamily: 'antimatter', tier: 3, nameEn: 'Antimatter Field',
    damage: 85, range: 5, apCost: 4, accuracy: 76, shieldPierce: 50,
    areaType: 'none', cooldown: 2,
    specialEffect: '높은 확률 장갑+쉴드 100% 영구 손실. 이후 2턴간 피아 구분 없이 주변 일반 공격 난사.',
  }, 'rare'),
  starterAsset('wpn_micro_singularity', '미소 특이점', 'weapon', {
    textKey: 'wpn_micro_singularity', weaponFamily: 'antimatter', tier: 4, nameEn: 'Micro Singularity',
    damage: 100, range: 5, apCost: 4, accuracy: 72, shieldPierce: 60,
    areaType: 'scatter_blackhole', cooldown: 3,
    specialEffect: '직접 피격 100% 피해. 좌표 지정 시 3×3 50% 산탄. 중심 주변 8칸 중 랜덤 4칸에 블랙홀 생성. 블랙홀 진입 즉사.',
  }, 'epic'),
  starterAsset('wpn_total_annihilation', '완전 소멸 병기', 'weapon', {
    textKey: 'wpn_total_annihilation', weaponFamily: 'antimatter', tier: 5, nameEn: 'Total Annihilation',
    damage: 150, range: 4, apCost: 5, accuracy: 68, shieldPierce: 90,
    areaType: 'aoe_3x3', cooldown: 5,
    specialEffect: '직접 대상 높은 확률 완전 소멸(처치 판정). 인접 8칸 50% 확률 연쇄 소멸. 실패 시 쉴드 파괴 + 70% 확률 무기/장갑 50% 손상.',
  }, 'legendary'),
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

function starterAsset(id: string, name: string, category: string, data: Record<string, unknown>, rarity: Rarity = 'common'): Asset {
  const now = '2026-01-01T00:00:00.000Z';
  return {
    id,
    name,
    category,
    description: '',
    tags: [],
    rarity,
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
