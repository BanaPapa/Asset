import Dexie, { type Table } from 'dexie';
import type { AssetImageRecord, ProjectState } from './types';
import { defaultCategories, projectStarStarterAssets } from './defaults';

export interface SnapshotRecord {
  id: 'current';
  state: ProjectState;
  updatedAt: string;
}

export interface BackupRecord {
  id: 'last-import-backup';
  state: ProjectState;
  createdAt: string;
}

class AssetEditorDb extends Dexie {
  snapshots!: Table<SnapshotRecord, string>;
  images!: Table<AssetImageRecord, string>;
  mediaImages!: Table<AssetImageRecord, string>;
  backups!: Table<BackupRecord, string>;

  constructor() {
    super('gameAssetEditorDb');
    this.version(1).stores({
      snapshots: 'id',
      images: 'assetId',
      backups: 'id',
    });
    this.version(2)
      .stores({
        snapshots: 'id',
        images: 'assetId',
        mediaImages: 'id, assetId, slotKey',
        backups: 'id',
      })
      .upgrade((tx) =>
        tx
          .table('images')
          .toArray()
          .then((records) => {
            const mediaImages = tx.table('mediaImages');
            return Promise.all(
              records.map((record) =>
                mediaImages.put({
                  ...record,
                  id: `${record.assetId}::main`,
                  slotKey: 'main',
                }),
              ),
            );
          }),
      );
  }
}

export const db = new AssetEditorDb();

export const initialProjectState: ProjectState = {
  projectName: 'project-star',
  categories: defaultCategories,
  assets: projectStarStarterAssets,
  selectedIds: projectStarStarterAssets[0] ? [projectStarStarterAssets[0].id] : [],
  theme: 'system',
  viewMode: 'list',
  search: '',
  weaponSettings: {
    tierMax: 5,
    rangeMax: 20,
    apCostMax: 10,
    rarityOptions: ['common', 'rare', 'epic', 'legendary'],
  },
};

export async function loadSnapshot() {
  const snapshot = await db.snapshots.get('current');
  return normalizeProjectState(snapshot?.state ?? initialProjectState);
}

export async function saveSnapshot(state: ProjectState) {
  await db.snapshots.put({ id: 'current', state, updatedAt: new Date().toISOString() });
}

export async function saveImportBackup(state: ProjectState) {
  await db.backups.put({ id: 'last-import-backup', state, createdAt: new Date().toISOString() });
}

function normalizeProjectState(state: ProjectState): ProjectState {
  const defaultCategoryMap = new Map(defaultCategories.map((category) => [category.key, category]));
  const existingCategoryKeys = new Set(state.categories.map((category) => category.key));
  const existingAssetIds = new Set(state.assets.map((asset) => asset.id));
  const starterAssetMap = new Map(projectStarStarterAssets.map((asset) => [asset.id, asset]));
  const starterAssetsToAdd = projectStarStarterAssets.filter((asset) => !existingAssetIds.has(asset.id));
  const assets = [...state.assets, ...starterAssetsToAdd].map((asset, index) => {
    const starterDefault = starterAssetMap.get(asset.id);
    // Merge updated starter defaults into existing assets: new fields get default values, user edits are preserved
    const mergedData = starterDefault ? { ...starterDefault.data, ...asset.data } : asset.data;
    return {
      ...asset,
      data: mergedData,
      sortOrder: asset.sortOrder ?? index,
      media: asset.media ?? (asset.image ? { main: { ...asset.image, slotKey: 'main', slotType: 'image' as const } } : undefined),
    };
  });
  return {
    ...state,
    projectName: state.projectName === 'my-game' ? 'project-star' : state.projectName,
    weaponSettings: state.weaponSettings ?? initialProjectState.weaponSettings,
    categories: [
      ...state.categories.map((category) => {
        const defaults = defaultCategoryMap.get(category.key);
        const defaultSlots = defaults?.mediaSlots ?? [];
        const currentSlots = category.mediaSlots ?? [];
        // Migrate media slots when legacy keys ('main', 'misc') are detected
        const legacyKeys = new Set(['main', 'misc', 'effect_preview']);
        const hasLegacySlot = currentSlots.some((s) => legacyKeys.has(s.key));
        const migratedSlots = !currentSlots.length || hasLegacySlot ? defaultSlots : currentSlots;
        // Merge new default fields into existing category schema (preserves custom fields, adds new defaults)
        const existingFieldKeys = new Set((category.fields ?? []).map((f) => f.key));
        const newDefaultFields = (defaults?.fields ?? []).filter((f) => !existingFieldKeys.has(f.key));
        const mergedFields = [...(category.fields ?? []), ...newDefaultFields];
        return {
          ...category,
          fields: mergedFields.length ? mergedFields : (defaults?.fields ?? []),
          mediaSlots: migratedSlots,
        };
      }),
      ...defaultCategories.filter((category) => !existingCategoryKeys.has(category.key)),
    ],
    assets,
    selectedIds: state.selectedIds.length ? state.selectedIds : assets[0] ? [assets[0].id] : [],
  };
}
