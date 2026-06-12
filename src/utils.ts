import type { Asset, Category, CustomField, ExportPayload, ProjectState, ValidationIssue } from './types';

export function getNested(source: Record<string, unknown>, path: string) {
  return path.split('.').reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

export function setNested(source: Record<string, unknown>, path: string, value: unknown) {
  const clone = structuredClone(source);
  const keys = path.split('.');
  let cursor = clone;
  keys.slice(0, -1).forEach((key) => {
    if (!cursor[key] || typeof cursor[key] !== 'object') cursor[key] = {};
    cursor = cursor[key] as Record<string, unknown>;
  });
  cursor[keys[keys.length - 1]] = value;
  return clone;
}

export function readableBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function fileBaseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '');
}

export function safeId(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

export function imagePath(asset: Asset) {
  const ext = extensionForMime(asset.image?.mimeType, asset.image?.fileName);
  return asset.image ? `images/${asset.id}${ext}` : null;
}

export function extensionForMime(mimeType?: string, fileName?: string) {
  const fromName = fileName?.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase();
  if (fromName) return fromName;
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'image/gif') return '.gif';
  return '.png';
}

export function makeExportPayload(state: ProjectState): ExportPayload {
  return {
    meta: {
      projectName: state.projectName,
      exportedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    categories: state.categories,
    assets: [...state.assets]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((asset) => ({
        id: asset.id,
        category: asset.category,
        name: asset.name,
        rarity: asset.rarity,
        tags: asset.tags,
        description: asset.description,
        image: imagePath(asset),
        data: asset.data,
      })),
  };
}

export function validateProject(state: ProjectState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Map<string, number>();
  state.assets.forEach((asset) => ids.set(asset.id, (ids.get(asset.id) ?? 0) + 1));
  state.assets.forEach((asset) => {
    if (!/^[a-z0-9_]+$/.test(asset.id)) {
      issues.push({ level: 'error', assetId: asset.id, message: `ID "${asset.id}"는 영문 소문자, 숫자, 언더스코어만 사용할 수 있습니다.` });
    }
    if ((ids.get(asset.id) ?? 0) > 1) {
      issues.push({ level: 'error', assetId: asset.id, message: `ID "${asset.id}"가 중복되었습니다.` });
    }
    if (!asset.name.trim()) {
      issues.push({ level: 'error', assetId: asset.id, message: '이름은 필수입니다.' });
    }
    if (!asset.image) {
      issues.push({ level: 'warning', assetId: asset.id, message: `"${asset.name}"에 이미지가 없습니다.` });
    }
    const fields = state.categories.find((category) => category.key === asset.category)?.fields ?? [];
    fields.forEach((field) => validateField(asset, field, state, issues));
  });
  return issues;
}

export function findIncomingReferences(assetId: string, state: ProjectState) {
  return state.assets.filter((asset) => {
    const fields = state.categories.find((category) => category.key === asset.category)?.fields ?? [];
    return fields.some((field) => {
      if (field.type !== 'assetRef') return false;
      const value = getNested(asset.data, field.key);
      return Array.isArray(value) ? value.includes(assetId) : value === assetId;
    });
  });
}

export function categoryName(categories: Category[], key: string) {
  return categories.find((category) => category.key === key)?.name ?? key;
}

function validateField(asset: Asset, field: CustomField, state: ProjectState, issues: ValidationIssue[]) {
  const value = getNested(asset.data, field.key);
  if (field.required && (value === undefined || value === null || value === '')) {
    issues.push({ level: 'error', assetId: asset.id, message: `${field.label} 필드는 필수입니다.` });
  }
  if ((field.type === 'number' || field.type === 'slider') && typeof value === 'number') {
    if (field.min !== undefined && value < field.min) {
      issues.push({ level: 'error', assetId: asset.id, message: `${field.label} 값이 최소값 ${field.min}보다 작습니다.` });
    }
    if (field.max !== undefined && value > field.max) {
      issues.push({ level: 'error', assetId: asset.id, message: `${field.label} 값이 최대값 ${field.max}보다 큽니다.` });
    }
  }
  if (field.type === 'assetRef') {
    const refs = Array.isArray(value) ? value : value ? [value] : [];
    refs.forEach((ref) => {
      if (!state.assets.some((candidate) => candidate.id === ref)) {
        issues.push({ level: 'error', assetId: asset.id, message: `${field.label}에 존재하지 않는 참조 "${String(ref)}"가 있습니다.` });
      }
    });
  }
}
