export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'multiselect'
  | 'color'
  | 'assetRef'
  | 'slider';

export interface CustomField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  min?: number;
  max?: number;
  options?: string[];
  refCategory?: string;
  multiple?: boolean;
}

export type MediaSlotType = 'image' | 'spriteSheet' | 'card';

export interface MediaSlot {
  key: string;
  label: string;
  type: MediaSlotType;
  sizeHint?: string;
}

export interface Category {
  key: string;
  name: string;
  fields: CustomField[];
  mediaSlots?: MediaSlot[];
  collapsed?: boolean;
  group?: string;
}

export interface AssetImageMeta {
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
}

export interface SpriteSheetMeta {
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  fps: number;
}

export interface AssetMediaMeta extends AssetImageMeta {
  slotKey: string;
  slotType: MediaSlotType;
  sprite?: SpriteSheetMeta;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  rarity: Rarity;
  image?: AssetImageMeta;
  media?: Record<string, AssetMediaMeta>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  data: Record<string, unknown>;
}

export interface AssetImageRecord {
  id: string;
  assetId: string;
  slotKey: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  thumbnail: Blob;
}

export interface WeaponSettings {
  tierMax: number;
  rangeMax: number;
  apCostMax: number;
  rarityOptions: Rarity[];
}

export interface ProjectState {
  projectName: string;
  categories: Category[];
  assets: Asset[];
  selectedIds: string[];
  theme: 'system' | 'light' | 'dark';
  viewMode: 'list' | 'grid';
  search: string;
  weaponSettings: WeaponSettings;
}

export interface ExportPayload {
  meta: {
    projectName: string;
    exportedAt: string;
    schemaVersion: number;
  };
  categories: Category[];
  assets: Array<{
    id: string;
    category: string;
    name: string;
    rarity: Rarity;
    tags: string[];
    description: string;
    image: string | null;
    media: Record<string, string>;
    data: Record<string, unknown>;
  }>;
}

export interface ValidationIssue {
  level: 'error' | 'warning';
  assetId?: string;
  message: string;
}
