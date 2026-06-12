import Dexie, { type Table } from 'dexie';
import type { AssetImageRecord, ProjectState } from './types';
import { defaultCategories } from './defaults';

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
  backups!: Table<BackupRecord, string>;

  constructor() {
    super('gameAssetEditorDb');
    this.version(1).stores({
      snapshots: 'id',
      images: 'assetId',
      backups: 'id',
    });
  }
}

export const db = new AssetEditorDb();

export const initialProjectState: ProjectState = {
  projectName: 'my-game',
  categories: defaultCategories,
  assets: [],
  selectedIds: [],
  theme: 'system',
  viewMode: 'list',
  search: '',
};

export async function loadSnapshot() {
  const snapshot = await db.snapshots.get('current');
  return snapshot?.state ?? initialProjectState;
}

export async function saveSnapshot(state: ProjectState) {
  await db.snapshots.put({ id: 'current', state, updatedAt: new Date().toISOString() });
}

export async function saveImportBackup(state: ProjectState) {
  await db.backups.put({ id: 'last-import-backup', state, createdAt: new Date().toISOString() });
}
