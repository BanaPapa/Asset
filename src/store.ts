import { create } from 'zustand';
import { db, initialProjectState, loadSnapshot, saveImportBackup, saveSnapshot } from './db';
import { createAsset, defaultDataForCategory, slugify } from './defaults';
import type { Asset, Category, CustomField, MediaSlot, ProjectState, Rarity, SpriteSheetMeta } from './types';
import { findIncomingReferences, moveArrayItem, safeId, setNested } from './utils';

interface EditorStore extends ProjectState {
  hydrated: boolean;
  saving: boolean;
  lastSavedAt?: string;
  undoStack: ProjectState[];
  redoStack: ProjectState[];
  hydrate: () => Promise<void>;
  setProjectName: (name: string) => void;
  setTheme: (theme: ProjectState['theme']) => void;
  setSearch: (search: string) => void;
  setViewMode: (viewMode: ProjectState['viewMode']) => void;
  selectAsset: (id: string, mode?: 'single' | 'toggle' | 'range') => void;
  moveSelection: (delta: number) => void;
  addAsset: (category: string, name?: string) => string;
  addAssetsFromFiles: (files: File[], category: string) => Promise<void>;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  updateAssetData: (id: string, path: string, value: unknown) => void;
  updateMany: (ids: string[], patch: Partial<Pick<Asset, 'category' | 'rarity' | 'tags'>>) => void;
  duplicateAsset: (id?: string) => void;
  deleteAssets: (ids?: string[], force?: boolean) => { blocked: boolean; references: Asset[] };
  reorderAsset: (id: string, direction: -1 | 1) => void;
  toggleCategory: (key: string) => void;
  addCategory: (name: string) => void;
  renameCategory: (key: string, name: string) => void;
  deleteCategory: (key: string) => void;
  reorderCategory: (fromIndex: number, toIndex: number) => void;
  addField: (categoryKey: string, field: CustomField) => void;
  deleteField: (categoryKey: string, fieldKey: string) => void;
  reorderField: (categoryKey: string, fromIndex: number, toIndex: number) => void;
  addMediaSlot: (categoryKey: string, slot: MediaSlot) => void;
  deleteMediaSlot: (categoryKey: string, slotKey: string) => void;
  reorderMediaSlot: (categoryKey: string, fromIndex: number, toIndex: number) => void;
  setAssetImage: (assetId: string, file: File) => Promise<void>;
  setAssetMedia: (assetId: string, slot: MediaSlot, file: File) => Promise<void>;
  updateAssetMediaSprite: (assetId: string, slotKey: string, sprite: SpriteSheetMeta) => void;
  deleteAssetMedia: (assetId: string, slotKey: string) => void;
  importProject: (state: ProjectState, mode: 'replace' | 'merge') => Promise<void>;
  undo: () => void;
  redo: () => void;
}

let saveTimer: number | undefined;

const selectState = (state: ProjectState): ProjectState => ({
  projectName: state.projectName,
  categories: state.categories,
  assets: state.assets,
  selectedIds: state.selectedIds,
  theme: state.theme,
  viewMode: state.viewMode,
  search: state.search,
});

function commit(set: (fn: (state: EditorStore) => Partial<EditorStore>) => void, recipe: (draft: EditorStore) => Partial<EditorStore>) {
  set((state) => {
    const before = selectState(state);
    const patch = recipe(state);
    const next = { ...state, ...patch };
    scheduleSave(selectState(next));
    return {
      ...patch,
      saving: true,
      undoStack: [...state.undoStack.slice(-49), before],
      redoStack: [],
    };
  });
}

function scheduleSave(state: ProjectState) {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    await saveSnapshot(state);
    useEditorStore.setState({ saving: false, lastSavedAt: new Date().toISOString() });
  }, 250);
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialProjectState,
  hydrated: false,
  saving: false,
  undoStack: [],
  redoStack: [],
  hydrate: async () => {
    const state = await loadSnapshot();
    set({ ...state, hydrated: true, saving: false });
  },
  setProjectName: (projectName) => commit(set, () => ({ projectName })),
  setTheme: (theme) => commit(set, () => ({ theme })),
  setSearch: (search) => set({ search }),
  setViewMode: (viewMode) => commit(set, () => ({ viewMode })),
  selectAsset: (id, mode = 'single') => {
    const { selectedIds, assets } = get();
    if (mode === 'toggle') {
      set({ selectedIds: selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id] });
      return;
    }
    if (mode === 'range' && selectedIds.length) {
      const sorted = [...assets].sort((a, b) => a.sortOrder - b.sortOrder);
      const first = sorted.findIndex((asset) => asset.id === selectedIds[0]);
      const last = sorted.findIndex((asset) => asset.id === id);
      const [start, end] = [Math.min(first, last), Math.max(first, last)];
      set({ selectedIds: sorted.slice(start, end + 1).map((asset) => asset.id) });
      return;
    }
    set({ selectedIds: [id] });
  },
  moveSelection: (delta) => {
    const sorted = [...get().assets].sort((a, b) => a.sortOrder - b.sortOrder);
    const current = sorted.findIndex((asset) => asset.id === get().selectedIds[0]);
    const next = sorted[Math.max(0, Math.min(sorted.length - 1, current + delta))];
    if (next) set({ selectedIds: [next.id] });
  },
  addAsset: (category, name) => {
    const order = get().assets.length ? Math.max(...get().assets.map((asset) => asset.sortOrder)) + 1 : 0;
    const asset = createAsset(category, order, name);
    commit(set, (state) => ({ assets: [...state.assets, asset], selectedIds: [asset.id] }));
    return asset.id;
  },
  addAssetsFromFiles: async (files, category) => {
    for (const file of files) {
      const id = get().addAsset(category, file.name.replace(/\.[^.]+$/, ''));
      await get().setAssetImage(id, file);
    }
  },
  updateAsset: (id, patch) =>
    commit(set, (state) => ({
      assets: state.assets.map((asset) => {
        if (asset.id !== id) return asset;
        const nextName = patch.name ?? asset.name;
        const nextId = patch.id ?? asset.id;
        return {
          ...asset,
          ...patch,
          id: safeId(nextId) || slugify(nextName),
          updatedAt: new Date().toISOString(),
        };
      }),
      selectedIds: state.selectedIds.map((selected) => (selected === id ? patch.id ?? selected : selected)),
    })),
  updateAssetData: (id, path, value) =>
    commit(set, (state) => ({
      assets: state.assets.map((asset) =>
        asset.id === id ? { ...asset, data: setNested(asset.data, path, value), updatedAt: new Date().toISOString() } : asset,
      ),
    })),
  updateMany: (ids, patch) =>
    commit(set, (state) => ({
      assets: state.assets.map((asset) =>
        ids.includes(asset.id)
          ? {
              ...asset,
              ...patch,
              data: patch.category && patch.category !== asset.category ? defaultDataForCategory(patch.category) : asset.data,
              updatedAt: new Date().toISOString(),
            }
          : asset,
      ),
    })),
  duplicateAsset: (id) => {
    const source = get().assets.find((asset) => asset.id === (id ?? get().selectedIds[0]));
    if (!source) return;
    const copyId = nextCopyId(source.id, get().assets);
    const now = new Date().toISOString();
    const copy: Asset = {
      ...structuredClone(source),
      id: copyId,
      name: `${source.name} 복사본`,
      sortOrder: Math.max(...get().assets.map((asset) => asset.sortOrder), 0) + 1,
      createdAt: now,
      updatedAt: now,
    };
    commit(set, (state) => ({ assets: [...state.assets, copy], selectedIds: [copy.id] }));
    db.mediaImages.where('assetId').equals(source.id).toArray().then((records) => {
      records.forEach((record) => db.mediaImages.put({ ...record, id: mediaRecordId(copy.id, record.slotKey), assetId: copy.id }));
    });
  },
  deleteAssets: (ids = get().selectedIds, force = false) => {
    const references = ids.flatMap((id) => findIncomingReferences(id, get()));
    if (references.length && !force) return { blocked: true, references };
    commit(set, (state) => ({
      assets: state.assets.filter((asset) => !ids.includes(asset.id)),
      selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
    }));
    ids.forEach((id) => db.mediaImages.where('assetId').equals(id).delete());
    return { blocked: false, references: [] };
  },
  reorderAsset: (id, direction) =>
    commit(set, (state) => {
      const sorted = [...state.assets].sort((a, b) => a.sortOrder - b.sortOrder);
      const index = sorted.findIndex((asset) => asset.id === id);
      const swap = index + direction;
      if (index < 0 || swap < 0 || swap >= sorted.length) return {};
      [sorted[index].sortOrder, sorted[swap].sortOrder] = [sorted[swap].sortOrder, sorted[index].sortOrder];
      return { assets: state.assets.map((asset) => sorted.find((item) => item.id === asset.id) ?? asset) };
    }),
  toggleCategory: (key) =>
    commit(set, (state) => ({
      categories: state.categories.map((category) =>
        category.key === key ? { ...category, collapsed: !category.collapsed } : category,
      ),
    })),
  addCategory: (name) =>
    commit(set, (state) => ({
      categories: [...state.categories, { key: uniqueCategoryKey(name, state.categories), name, fields: [] }],
    })),
  renameCategory: (key, name) =>
    commit(set, (state) => ({
      categories: state.categories.map((category) => (category.key === key ? { ...category, name } : category)),
    })),
  deleteCategory: (key) =>
    commit(set, (state) => ({
      categories: state.categories.filter((category) => category.key !== key),
      assets: state.assets.filter((asset) => asset.category !== key),
    })),
  reorderCategory: (fromIndex, toIndex) =>
    commit(set, (state) => ({
      categories: moveArrayItem(state.categories, fromIndex, toIndex),
    })),
  addField: (categoryKey, field) =>
    commit(set, (state) => ({
      categories: state.categories.map((category) =>
        category.key === categoryKey ? { ...category, fields: [...category.fields, field] } : category,
      ),
    })),
  deleteField: (categoryKey, fieldKey) =>
    commit(set, (state) => ({
      categories: state.categories.map((category) =>
        category.key === categoryKey
          ? { ...category, fields: category.fields.filter((field) => field.key !== fieldKey) }
          : category,
      ),
    })),
  reorderField: (categoryKey, fromIndex, toIndex) =>
    commit(set, (state) => ({
      categories: state.categories.map((category) =>
        category.key === categoryKey ? { ...category, fields: moveArrayItem(category.fields, fromIndex, toIndex) } : category,
      ),
    })),
  addMediaSlot: (categoryKey, slot) =>
    commit(set, (state) => ({
      categories: state.categories.map((category) =>
        category.key === categoryKey ? { ...category, mediaSlots: [...(category.mediaSlots ?? []), slot] } : category,
      ),
    })),
  deleteMediaSlot: (categoryKey, slotKey) =>
    commit(set, (state) => ({
      categories: state.categories.map((category) =>
        category.key === categoryKey
          ? { ...category, mediaSlots: (category.mediaSlots ?? []).filter((slot) => slot.key !== slotKey) }
          : category,
      ),
      assets: state.assets.map((asset) => {
        if (asset.category !== categoryKey || !asset.media?.[slotKey]) return asset;
        const { [slotKey]: _removed, ...media } = asset.media;
        return { ...asset, media, updatedAt: new Date().toISOString() };
      }),
    })),
  reorderMediaSlot: (categoryKey, fromIndex, toIndex) =>
    commit(set, (state) => ({
      categories: state.categories.map((category) =>
        category.key === categoryKey ? { ...category, mediaSlots: moveArrayItem(category.mediaSlots ?? [], fromIndex, toIndex) } : category,
      ),
    })),
  setAssetImage: async (assetId, file) => {
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) return;
    const meta = await readImageMeta(file);
    const thumbnail = await makeThumbnail(file);
    const slot = { key: 'main', label: '대표 이미지', type: 'image' as const };
    await db.mediaImages.put({ id: mediaRecordId(assetId, slot.key), assetId, slotKey: slot.key, fileName: file.name, mimeType: file.type, blob: file, thumbnail });
    get().updateAsset(assetId, { image: meta, media: { ...(get().assets.find((asset) => asset.id === assetId)?.media ?? {}), [slot.key]: { ...meta, slotKey: slot.key, slotType: slot.type } } });
  },
  setAssetMedia: async (assetId, slot, file) => {
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) return;
    const meta = await readImageMeta(file);
    const thumbnail = await makeThumbnail(file);
    await db.mediaImages.put({ id: mediaRecordId(assetId, slot.key), assetId, slotKey: slot.key, fileName: file.name, mimeType: file.type, blob: file, thumbnail });
    commit(set, (state) => ({
      assets: state.assets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              image: asset.image ?? meta,
              media: {
                ...(asset.media ?? {}),
                [slot.key]: { ...meta, slotKey: slot.key, slotType: slot.type },
              },
              updatedAt: new Date().toISOString(),
            }
          : asset,
      ),
    }));
  },
  updateAssetMediaSprite: (assetId, slotKey, sprite) =>
    commit(set, (state) => ({
      assets: state.assets.map((asset) =>
        asset.id === assetId && asset.media?.[slotKey]
          ? {
              ...asset,
              media: { ...asset.media, [slotKey]: { ...asset.media[slotKey], sprite } },
              updatedAt: new Date().toISOString(),
            }
          : asset,
      ),
    })),
  deleteAssetMedia: (assetId, slotKey) => {
    const asset = get().assets.find((item) => item.id === assetId);
    if (!asset?.media?.[slotKey]) return;
    const { [slotKey]: _removed, ...media } = asset.media;
    const nextImage = slotKey === 'main' ? Object.values(media)[0] : asset.image;
    commit(set, (state) => ({
      assets: state.assets.map((item) =>
        item.id === assetId ? { ...item, image: nextImage, media, updatedAt: new Date().toISOString() } : item,
      ),
    }));
    db.mediaImages.delete(mediaRecordId(assetId, slotKey));
  },
  importProject: async (incoming, mode) => {
    await saveImportBackup(selectState(get()));
    commit(set, (state) => {
      if (mode === 'replace') return incoming;
      const existingIds = new Set(state.assets.map((asset) => asset.id));
      const mergedAssets = incoming.assets.map((asset) =>
        existingIds.has(asset.id) ? { ...asset, id: nextCopyId(asset.id, state.assets) } : asset,
      );
      return {
        ...state,
        categories: mergeCategories(state.categories, incoming.categories),
        assets: [...state.assets, ...mergedAssets],
      };
    });
  },
  undo: () => {
    const { undoStack } = get();
    const previous = undoStack[undoStack.length - 1];
    if (!previous) return;
    set((state) => ({
      ...previous,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack.slice(-49), selectState(state)],
      saving: true,
    }));
    scheduleSave(previous);
  },
  redo: () => {
    const { redoStack } = get();
    const next = redoStack[redoStack.length - 1];
    if (!next) return;
    set((state) => ({
      ...next,
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack.slice(-49), selectState(state)],
      saving: true,
    }));
    scheduleSave(next);
  },
}));

function nextCopyId(id: string, assets: Asset[]) {
  let candidate = `${id}_copy`;
  let count = 2;
  while (assets.some((asset) => asset.id === candidate)) {
    candidate = `${id}_copy_${count}`;
    count += 1;
  }
  return candidate;
}

function uniqueCategoryKey(name: string, categories: Category[]) {
  const base = safeId(name) || `category_${categories.length + 1}`;
  let key = base;
  let count = 2;
  while (categories.some((category) => category.key === key)) {
    key = `${base}_${count}`;
    count += 1;
  }
  return key;
}

function mergeCategories(existing: Category[], incoming: Category[]) {
  const keys = new Set(existing.map((category) => category.key));
  return [...existing, ...incoming.filter((category) => !keys.has(category.key))];
}

export function mediaRecordId(assetId: string, slotKey: string) {
  return `${assetId}::${slotKey}`;
}

async function readImageMeta(file: File) {
  const bitmap = await createImageBitmap(file);
  return {
    fileName: file.name,
    mimeType: file.type,
    width: bitmap.width,
    height: bitmap.height,
    size: file.size,
  };
}

async function makeThumbnail(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(128 / bitmap.width, 128 / bitmap.height, 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d')!;
  context.imageSmoothingEnabled = false;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), 'image/png'));
}
