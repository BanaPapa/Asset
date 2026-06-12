import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileJson,
  ImagePlus,
  Import,
  Moon,
  Plus,
  Redo2,
  Search,
  Settings,
  Sun,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react';
import JSZip from 'jszip';
import { db, initialProjectState } from './db';
import { rarityLabels } from './defaults';
import { useEditorStore } from './store';
import type { Asset, CustomField, ProjectState, Rarity } from './types';
import {
  findIncomingReferences,
  getNested,
  imagePath,
  makeExportPayload,
  readableBytes,
  safeId,
  validateProject,
} from './utils';

const emojiOptions = ['🧙', '⚔️', '🛡️', '💎', '🧪', '🔥', '❄️', '⚡', '👾', '❤️', '⭐', '🎒', '🏹', '🔮', '🗝️', '📜'];
const tabLabels = {
  overview: '전체',
  basic: '기본 정보',
  schema: '전투/속성',
  refs: '참조',
  json: 'JSON',
} as const;
type DetailTab = keyof typeof tabLabels;

export function App() {
  const store = useEditorStore();
  const selectedAsset = store.assets.find((asset) => asset.id === store.selectedIds[0]) ?? store.assets[0];
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [imageTarget, setImageTarget] = useState<Asset | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<Asset[] | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    store.hydrate();
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const onPaste = async (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith('image/'));
      if (files.length && selectedAsset) await store.setAssetImage(selectedAsset.id, files[0]);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [selectedAsset?.id]);

  const requestDelete = () => {
    const refs = store.selectedIds.flatMap((id) => findIncomingReferences(id, store));
    if (refs.length) {
      setDeleteWarning(refs);
      return;
    }
    if (window.confirm('선택한 에셋을 삭제할까요?')) store.deleteAssets(store.selectedIds, true);
  };

  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    if (event.ctrlKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      searchRef.current?.focus();
    }
    if (typing) return;
    if (event.ctrlKey && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      event.shiftKey ? store.redo() : store.undo();
    }
    if (event.ctrlKey && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      store.duplicateAsset();
    }
    if (event.key === 'Delete' && store.selectedIds.length) {
      event.preventDefault();
      requestDelete();
    }
    if (event.key === 'ArrowDown') store.moveSelection(1);
    if (event.key === 'ArrowUp') store.moveSelection(-1);
  };

  if (!store.hydrated) {
    return <div className="grid h-screen place-items-center bg-[#090c11] text-zinc-200">불러오는 중...</div>;
  }

  return (
    <div className="asset-shell flex h-screen flex-col text-slate-100" onKeyDown={handleKey} tabIndex={-1}>
      <TopBar
        searchRef={searchRef}
        onSettings={() => setShowSettings(true)}
        onExport={() => setShowExport(true)}
        onImport={importProjectFile}
      />
      <main className="grid min-h-0 flex-1 grid-cols-[360px_minmax(760px,1fr)]">
        <AssetSidebar onDelete={requestDelete} />
        <AssetDetail asset={selectedAsset} onImageClick={setImageTarget} />
      </main>
      {store.selectedIds.length > 1 && <BatchBar />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {imageTarget && <ImageModal asset={imageTarget} onClose={() => setImageTarget(null)} />}
      {deleteWarning && (
        <ConfirmModal
          title="참조 중인 에셋입니다"
          body={`이 에셋을 참조하는 항목이 ${deleteWarning.length}개 있습니다. 그래도 삭제할까요?`}
          confirmText="강제 삭제"
          onCancel={() => setDeleteWarning(null)}
          onConfirm={() => {
            store.deleteAssets(store.selectedIds, true);
            setDeleteWarning(null);
          }}
        />
      )}
    </div>
  );
}

function TopBar({
  searchRef,
  onSettings,
  onExport,
  onImport,
}: {
  searchRef: React.RefObject<HTMLInputElement | null>;
  onSettings: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}) {
  const store = useEditorStore();
  const importRef = useRef<HTMLInputElement>(null);
  return (
    <header className="asset-topbar flex h-16 shrink-0 items-center gap-3 px-4">
      <input
        className="asset-project-input h-10 w-48 px-3 text-base font-bold"
        value={store.projectName}
        onChange={(event) => store.setProjectName(event.target.value)}
        aria-label="프로젝트명"
      />
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
        <input
          ref={searchRef}
          className="asset-search h-10 w-full pl-9 pr-3 text-sm"
          value={store.search}
          onChange={(event) => store.setSearch(event.target.value)}
          placeholder="이름, ID, 태그 검색"
        />
      </div>
      <SaveIndicator />
      <input ref={importRef} className="hidden" type="file" accept=".json,.zip,application/json,application/zip" onChange={(event) => event.target.files?.[0] && onImport(event.target.files[0])} />
      <IconButton label="가져오기" onClick={() => importRef.current?.click()}><Import /></IconButton>
      <IconButton label="내보내기" onClick={onExport}><Download /></IconButton>
      <IconButton label="실행 취소" onClick={store.undo}><Undo2 /></IconButton>
      <IconButton label="다시 실행" onClick={store.redo}><Redo2 /></IconButton>
      <IconButton label="설정" onClick={onSettings}><Settings /></IconButton>
      <IconButton label="테마 변경" onClick={() => store.setTheme(store.theme === 'dark' ? 'light' : 'dark')}>
        {store.theme === 'dark' ? <Sun /> : <Moon />}
      </IconButton>
    </header>
  );
}

function SaveIndicator() {
  const { saving, lastSavedAt } = useEditorStore();
  return <span className="min-w-24 text-xs text-slate-500">{saving ? '저장 중...' : lastSavedAt ? '저장됨 ✓' : '준비됨'}</span>;
}

function AssetSidebar({ onDelete }: { onDelete: () => void }) {
  const store = useEditorStore();
  const [newCategory, setNewCategory] = useState(store.categories[0]?.key ?? 'character');
  const filtered = useMemo(() => {
    const term = store.search.trim().toLowerCase();
    return [...store.assets]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((asset) => !term || [asset.name, asset.id, asset.tags.join(' ')].join(' ').toLowerCase().includes(term));
  }, [store.assets, store.search]);

  return (
    <aside className="asset-sidebar flex min-h-0 flex-col">
      <div className="flex h-16 items-center justify-between px-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">Asset Library</div>
          <div className="text-sm text-slate-500">{filtered.length}개 등록됨</div>
        </div>
        <div className="flex gap-1">
          <IconButton label="복제" onClick={() => store.duplicateAsset()}><Copy /></IconButton>
          <IconButton label="삭제" onClick={onDelete}><Trash2 /></IconButton>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
        {store.categories.map((category) => {
          const items = filtered.filter((asset) => asset.category === category.key);
          return (
            <section key={category.key} className="mb-3">
              <button className="asset-category-title" onClick={() => store.toggleCategory(category.key)}>
                {category.collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                <span>{category.name}</span>
                <span className="ml-auto">{items.length}</span>
              </button>
              {!category.collapsed && (
                <div className="space-y-2">
                  {items.map((asset) => <AssetListItem key={asset.id} asset={asset} />)}
                </div>
              )}
            </section>
          );
        })}
      </div>
      <div className="asset-sidebar-footer p-3">
        <select className="asset-input mb-2 h-10" value={newCategory} onChange={(event) => setNewCategory(event.target.value)}>
          {store.categories.map((category) => <option key={category.key} value={category.key}>{category.name}</option>)}
        </select>
        <button className="asset-primary-btn h-11 w-full" onClick={() => store.addAsset(newCategory)}>
          <Plus className="h-4 w-4" /> 새 에셋
        </button>
      </div>
    </aside>
  );
}

function AssetListItem({ asset }: { asset: Asset }) {
  const store = useEditorStore();
  const selected = store.selectedIds.includes(asset.id);
  const category = store.categories.find((item) => item.key === asset.category);
  const [thumb, setThumb] = useState<string>();

  useEffect(() => {
    let url = '';
    setThumb(undefined);
    db.images.get(asset.id).then((record) => {
      if (!record) return;
      url = URL.createObjectURL(record.thumbnail);
      setThumb(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [asset.id, asset.image?.fileName]);

  return (
    <button
      className={`asset-list-item ${selected ? 'is-selected' : ''}`}
      onClick={(event) => store.selectAsset(asset.id, event.shiftKey ? 'range' : event.ctrlKey ? 'toggle' : 'single')}
    >
      <div className="asset-list-thumb checker">
        {thumb ? <img className="h-full w-full object-contain image-pixelated" src={thumb} alt={asset.name} /> : <span>{String(getNested(asset.data, '__emoji') || defaultEmoji(asset.category))}</span>}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm font-bold text-slate-100">{asset.name}</div>
        <div className="truncate text-xs text-slate-500">{asset.id} · {category?.name ?? asset.category}</div>
      </div>
    </button>
  );
}

function AssetDetail({ asset, onImageClick }: { asset?: Asset; onImageClick: (asset: Asset) => void }) {
  const store = useEditorStore();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  if (!asset) {
    return (
      <section className="asset-workspace grid place-items-center p-8">
        <div className="asset-empty">
          <ImagePlus className="mx-auto h-10 w-10 text-rose-300" />
          <h2>아직 에셋이 없습니다</h2>
          <p>왼쪽 아래에서 새 에셋을 추가하면 상세 편집 화면이 열립니다.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="asset-workspace min-h-0 overflow-auto">
      <div className="asset-hero">
        <button className="asset-hero-image checker" onClick={() => onImageClick(asset)} title="이미지 또는 임시 이모지 설정">
          <AssetHeroImage asset={asset} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="asset-kicker">{categoryName(asset.category, store)}</span>
            <span className="asset-pill">{rarityLabels[asset.rarity]}</span>
            <span className="asset-pill muted">{asset.id}</span>
          </div>
          <input
            className="asset-title-input"
            value={asset.name}
            onChange={(event) => store.updateAsset(asset.id, { name: event.target.value })}
            aria-label="에셋 이름"
          />
          <textarea
            className="asset-summary"
            value={asset.description}
            onChange={(event) => store.updateAsset(asset.id, { description: event.target.value })}
            placeholder="에셋 설명, 콘셉트, 사용처를 적어두세요."
          />
          <div className="asset-stat-row">
            <Metric label="이미지" value={asset.image ? `${asset.image.width}x${asset.image.height}` : '임시'} />
            <Metric label="태그" value={asset.tags.length ? `${asset.tags.length}개` : '없음'} />
            <Metric label="참조됨" value={`${findIncomingReferences(asset.id, store).length}개`} />
          </div>
        </div>
      </div>
      <div className="asset-tabs">
        {(Object.keys(tabLabels) as DetailTab[]).map((tab) => (
          <button key={tab} className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)}>
            {tabLabels[tab]}
          </button>
        ))}
      </div>
      <div className="asset-detail-body">
        {activeTab === 'overview' && <OverviewTab asset={asset} />}
        {activeTab === 'basic' && <BasicTab asset={asset} />}
        {activeTab === 'schema' && <SchemaTab asset={asset} />}
        {activeTab === 'refs' && <RefsTab asset={asset} />}
        {activeTab === 'json' && <JsonTab asset={asset} />}
      </div>
    </section>
  );
}

function AssetHeroImage({ asset }: { asset: Asset }) {
  const [imageUrl, setImageUrl] = useState<string>();
  useEffect(() => {
    let url = '';
    setImageUrl(undefined);
    db.images.get(asset.id).then((record) => {
      if (!record) return;
      url = URL.createObjectURL(record.blob);
      setImageUrl(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [asset.id, asset.image?.fileName]);

  if (imageUrl) return <img className="h-full w-full object-contain image-pixelated" src={imageUrl} alt={asset.name} />;
  return <span>{String(getNested(asset.data, '__emoji') || defaultEmoji(asset.category))}</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="asset-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OverviewTab({ asset }: { asset: Asset }) {
  return (
    <div className="space-y-5">
      <SectionTitle title={asset.name} />
      <BasicTab asset={asset} compact />
      <SchemaTab asset={asset} />
      <RefsTab asset={asset} />
    </div>
  );
}

function BasicTab({ asset, compact = false }: { asset: Asset; compact?: boolean }) {
  const store = useEditorStore();
  const issues = validateProject(store).filter((issue) => issue.assetId === asset.id);
  return (
    <Panel title="기본 정보">
      <div className="asset-form-grid">
        <TextField label="ID" value={asset.id} onChange={(value) => store.updateAsset(asset.id, { id: value })} />
        <FieldLabel label="카테고리">
          <select className="asset-input" value={asset.category} onChange={(event) => store.updateAsset(asset.id, { category: event.target.value, data: {} })}>
            {store.categories.map((category) => <option key={category.key} value={category.key}>{category.name}</option>)}
          </select>
        </FieldLabel>
        <FieldLabel label="희귀도">
          <select className="asset-input" value={asset.rarity} onChange={(event) => store.updateAsset(asset.id, { rarity: event.target.value as Rarity })}>
            {(Object.keys(rarityLabels) as Rarity[]).map((rarity) => <option key={rarity} value={rarity}>{rarityLabels[rarity]}</option>)}
          </select>
        </FieldLabel>
        <TextField label="태그" value={asset.tags.join(', ')} onChange={(value) => store.updateAsset(asset.id, { tags: value.split(',').map((tag) => tag.trim()).filter(Boolean) })} />
        {!compact && (
          <div className="asset-field-wide">
            <FieldLabel label="설명">
              <textarea className="asset-input min-h-24 resize-y" value={asset.description} onChange={(event) => store.updateAsset(asset.id, { description: event.target.value })} />
            </FieldLabel>
          </div>
        )}
      </div>
      {issues.length > 0 && (
        <div className="asset-warning mt-4">
          {issues.map((issue, index) => <div key={index}>{issue.message}</div>)}
        </div>
      )}
    </Panel>
  );
}

function SchemaTab({ asset }: { asset: Asset }) {
  const store = useEditorStore();
  const category = store.categories.find((item) => item.key === asset.category);
  if (!category?.fields.length) {
    return <Panel title="전투/속성"><div className="asset-muted-box">이 카테고리에는 추가 속성이 없습니다.</div></Panel>;
  }
  return (
    <Panel title="전투/속성">
      <div className="asset-form-grid">
        {category.fields.map((field) => <SchemaField key={field.key} asset={asset} field={field} />)}
      </div>
    </Panel>
  );
}

function RefsTab({ asset }: { asset: Asset }) {
  const store = useEditorStore();
  const incomingRefs = findIncomingReferences(asset.id, store);
  const imageInfo = asset.image ? `${asset.image.fileName} · ${asset.image.width}x${asset.image.height} · ${readableBytes(asset.image.size)}` : '이미지 없음';
  return (
    <Panel title="참조와 파일">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="asset-muted-box">
          <strong>이미지 정보</strong>
          <p>{imageInfo}</p>
        </div>
        <div className="asset-muted-box">
          <strong>이 에셋을 참조하는 항목</strong>
          <p>{incomingRefs.length ? incomingRefs.map((ref) => `${ref.name} (${ref.id})`).join(', ') : '없음'}</p>
        </div>
      </div>
    </Panel>
  );
}

function JsonTab({ asset }: { asset: Asset }) {
  const store = useEditorStore();
  return (
    <Panel title="JSON 미리보기">
      <pre className="asset-code">{JSON.stringify(makeExportPayload({ ...store, assets: [asset] } as ProjectState).assets[0], null, 2)}</pre>
    </Panel>
  );
}

function SchemaField({ asset, field }: { asset: Asset; field: CustomField }) {
  const store = useEditorStore();
  const value = getNested(asset.data, field.key);
  const setValue = (next: unknown) => store.updateAssetData(asset.id, field.key, next);
  const refs = store.assets.filter((item) => !field.refCategory || item.category === field.refCategory);

  if (field.type === 'boolean') {
    return <FieldLabel label={field.label}><input type="checkbox" checked={Boolean(value)} onChange={(event) => setValue(event.target.checked)} /></FieldLabel>;
  }
  if (field.type === 'textarea') {
    return <div className="asset-field-wide"><FieldLabel label={field.label}><textarea className="asset-input min-h-24" value={String(value ?? '')} onChange={(event) => setValue(event.target.value)} /></FieldLabel></div>;
  }
  if (field.type === 'number' || field.type === 'slider') {
    return (
      <FieldLabel label={field.label}>
        <input className="asset-input" type={field.type === 'slider' ? 'range' : 'number'} min={field.min} max={field.max} value={Number(value ?? field.min ?? 0)} onChange={(event) => setValue(Number(event.target.value))} />
        {field.type === 'slider' && <span className="text-xs text-slate-500">{String(value ?? 0)}</span>}
      </FieldLabel>
    );
  }
  if (field.type === 'enum') {
    return <FieldLabel label={field.label}><select className="asset-input" value={String(value ?? '')} onChange={(event) => setValue(event.target.value)}>{field.options?.map((option) => <option key={option}>{option}</option>)}</select></FieldLabel>;
  }
  if (field.type === 'multiselect') {
    const values = Array.isArray(value) ? value.map(String) : [];
    return <TextField label={field.label} value={values.join(', ')} onChange={(next) => setValue(next.split(',').map((item) => item.trim()).filter(Boolean))} />;
  }
  if (field.type === 'assetRef') {
    const values = Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
    return (
      <FieldLabel label={field.label}>
        <select className="asset-input" multiple={field.multiple} value={values} onChange={(event) => setValue(Array.from(event.target.selectedOptions).map((option) => option.value))}>
          {refs.map((ref) => <option key={ref.id} value={ref.id}>{ref.name} ({ref.id})</option>)}
        </select>
      </FieldLabel>
    );
  }
  if (field.type === 'color') {
    return <FieldLabel label={field.label}><input className="h-10 w-full" type="color" value={String(value ?? '#ffffff')} onChange={(event) => setValue(event.target.value)} /></FieldLabel>;
  }
  return <TextField label={field.label} value={String(value ?? '')} onChange={setValue} />;
}

function ImageModal({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const store = useEditorStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const emoji = String(getNested(asset.data, '__emoji') || defaultEmoji(asset.category));

  useEffect(() => {
    let url = '';
    db.images.get(asset.id).then((record) => {
      if (!record) return;
      url = URL.createObjectURL(record.blob);
      setPreviewUrl(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [asset.id, asset.image?.fileName]);

  const upload = async (files: FileList | File[]) => {
    const file = Array.from(files).find((item) => item.type.startsWith('image/'));
    if (!file) return;
    await store.setAssetImage(asset.id, file);
  };

  return (
    <Modal title="이미지 / 임시 이모지" onClose={onClose}>
      <div className="grid grid-cols-[280px_1fr] gap-5">
        <div
          className="asset-modal-preview checker"
          onDrop={(event) => {
            event.preventDefault();
            upload(event.dataTransfer.files);
          }}
          onDragOver={(event) => event.preventDefault()}
        >
          {previewUrl ? <img className="max-h-full max-w-full object-contain image-pixelated" src={previewUrl} alt={asset.name} /> : <span>{emoji}</span>}
        </div>
        <div className="space-y-5">
          <section>
            <h3 className="text-sm font-bold text-slate-100">이미지 삽입</h3>
            <p className="mt-1 text-sm text-slate-500">파일을 드롭하거나 선택하세요. 개발 중에는 이모지만 사용해도 됩니다.</p>
            <input ref={inputRef} className="hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => event.target.files && upload(event.target.files)} />
            <button className="asset-primary-btn mt-3 h-10 px-4" onClick={() => inputRef.current?.click()}>
              <Upload className="h-4 w-4" /> 파일 선택
            </button>
          </section>
          <section>
            <h3 className="text-sm font-bold text-slate-100">임시 이모지</h3>
            <div className="mt-2 grid grid-cols-8 gap-2">
              {emojiOptions.map((item) => (
                <button
                  key={item}
                  className={`asset-emoji ${emoji === item ? 'is-selected' : ''}`}
                  onClick={() => store.updateAssetData(asset.id, '__emoji', item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>
          {asset.image && <p className="asset-muted-box text-xs">{asset.image.fileName} · {asset.image.width}x{asset.image.height} · {readableBytes(asset.image.size)}</p>}
        </div>
      </div>
    </Modal>
  );
}

function BatchBar() {
  const store = useEditorStore();
  const [tag, setTag] = useState('');
  return (
    <div className="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-md border border-slate-700 bg-[#111820] p-2 shadow-2xl">
      <span className="px-2 text-sm">{store.selectedIds.length}개 선택</span>
      <select className="asset-input h-8 w-28" onChange={(event) => store.updateMany(store.selectedIds, { category: event.target.value })} defaultValue="">
        <option value="" disabled>카테고리</option>
        {store.categories.map((category) => <option key={category.key} value={category.key}>{category.name}</option>)}
      </select>
      <select className="asset-input h-8 w-24" onChange={(event) => store.updateMany(store.selectedIds, { rarity: event.target.value as Rarity })} defaultValue="">
        <option value="" disabled>희귀도</option>
        {(Object.keys(rarityLabels) as Rarity[]).map((rarity) => <option key={rarity} value={rarity}>{rarityLabels[rarity]}</option>)}
      </select>
      <input className="asset-input h-8 w-36" value={tag} placeholder="태그 일괄 추가" onChange={(event) => setTag(event.target.value)} />
      <button className="asset-primary-btn h-8 px-3" onClick={() => {
        const assets = store.assets.filter((item) => store.selectedIds.includes(item.id));
        assets.forEach((item) => store.updateAsset(item.id, { tags: Array.from(new Set([...item.tags, tag].filter(Boolean))) }));
        setTag('');
      }}>적용</button>
    </div>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const store = useEditorStore();
  const [categoryNameValue, setCategoryNameValue] = useState('');
  const [fieldDraft, setFieldDraft] = useState({ category: store.categories[0]?.key ?? '', label: '', type: 'text', options: '' });
  return (
    <Modal title="설정" onClose={onClose}>
      <div className="grid grid-cols-2 gap-5">
        <section>
          <h3 className="mb-2 text-sm font-bold">카테고리</h3>
          <div className="space-y-2">
            {store.categories.map((category) => (
              <div key={category.key} className="flex gap-2">
                <input className="asset-input" value={category.name} onChange={(event) => store.renameCategory(category.key, event.target.value)} />
                <IconButton label="삭제" onClick={() => window.confirm('이 카테고리와 포함 에셋을 삭제할까요?') && store.deleteCategory(category.key)}><Trash2 /></IconButton>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input className="asset-input" value={categoryNameValue} placeholder="새 카테고리" onChange={(event) => setCategoryNameValue(event.target.value)} />
            <button className="asset-primary-btn px-3" onClick={() => { if (categoryNameValue.trim()) store.addCategory(categoryNameValue.trim()); setCategoryNameValue(''); }}>추가</button>
          </div>
        </section>
        <section>
          <h3 className="mb-2 text-sm font-bold">커스텀 필드</h3>
          <div className="space-y-2">
            <select className="asset-input" value={fieldDraft.category} onChange={(event) => setFieldDraft({ ...fieldDraft, category: event.target.value })}>
              {store.categories.map((category) => <option key={category.key} value={category.key}>{category.name}</option>)}
            </select>
            <input className="asset-input" placeholder="필드 이름" value={fieldDraft.label} onChange={(event) => setFieldDraft({ ...fieldDraft, label: event.target.value })} />
            <select className="asset-input" value={fieldDraft.type} onChange={(event) => setFieldDraft({ ...fieldDraft, type: event.target.value })}>
              <option value="text">텍스트</option>
              <option value="textarea">멀티라인</option>
              <option value="number">숫자</option>
              <option value="boolean">불리언</option>
              <option value="enum">선택</option>
              <option value="multiselect">다중선택</option>
              <option value="color">컬러 피커</option>
              <option value="assetRef">에셋 참조</option>
              <option value="slider">슬라이더</option>
            </select>
            <input className="asset-input" placeholder="옵션: 쉼표로 구분" value={fieldDraft.options} onChange={(event) => setFieldDraft({ ...fieldDraft, options: event.target.value })} />
            <button className="asset-primary-btn h-10 px-3" onClick={() => {
              if (!fieldDraft.label.trim()) return;
              store.addField(fieldDraft.category, {
                key: safeId(fieldDraft.label) || `field_${Date.now()}`,
                label: fieldDraft.label,
                type: fieldDraft.type as CustomField['type'],
                options: fieldDraft.options.split(',').map((item) => item.trim()).filter(Boolean),
              });
              setFieldDraft({ ...fieldDraft, label: '', options: '' });
            }}>필드 추가</button>
          </div>
        </section>
      </div>
    </Modal>
  );
}

function ExportModal({ onClose }: { onClose: () => void }) {
  const store = useEditorStore();
  const [mode, setMode] = useState<'zip' | 'json' | 'split'>('zip');
  const [ignoreWarnings, setIgnoreWarnings] = useState(false);
  const issues = validateProject(store);
  const errors = issues.filter((issue) => issue.level === 'error');

  return (
    <Modal title="내보내기" onClose={onClose}>
      <div className="space-y-4">
        <FieldLabel label="형식">
          <select className="asset-input" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
            <option value="zip">JSON + 이미지 ZIP</option>
            <option value="json">JSON only</option>
            <option value="split">카테고리별 분리</option>
          </select>
        </FieldLabel>
        <div className="asset-muted-box max-h-52 overflow-auto text-sm">
          <strong>검증 리포트</strong>
          {issues.length ? issues.map((issue, index) => <div key={index} className={issue.level === 'error' ? 'text-red-300' : 'text-amber-300'}>{issue.message}</div>) : <div className="text-emerald-300">문제 없음</div>}
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ignoreWarnings} onChange={(event) => setIgnoreWarnings(event.target.checked)} /> 경고를 무시하고 내보내기</label>
        <button className="asset-primary-btn h-10 px-4 disabled:opacity-50" disabled={errors.length > 0 || (issues.length > 0 && !ignoreWarnings)} onClick={() => exportProject(mode)}>
          내보내기
        </button>
      </div>
    </Modal>
  );
}

async function exportProject(mode: 'zip' | 'json' | 'split') {
  const state = useEditorStore.getState();
  const payload = makeExportPayload(state);
  if (mode === 'json') {
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), 'assets.json');
    return;
  }
  const zip = new JSZip();
  if (mode === 'split') {
    state.categories.forEach((category) => {
      const categoryPayload = { ...payload, assets: payload.assets.filter((asset) => asset.category === category.key) };
      zip.file(`${category.key}.json`, JSON.stringify(categoryPayload, null, 2));
    });
  } else {
    zip.file('assets.json', JSON.stringify(payload, null, 2));
  }
  for (const asset of state.assets) {
    const record = await db.images.get(asset.id);
    const path = imagePath(asset);
    if (record && path) zip.file(path, record.blob);
  }
  downloadBlob(await zip.generateAsync({ type: 'blob' }), `${state.projectName || 'assets'}.zip`);
}

async function importProjectFile(file: File) {
  const store = useEditorStore.getState();
  if (file.name.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file);
    const jsonFile = zip.file('assets.json') ?? Object.values(zip.files).find((entry) => entry.name.endsWith('.json'));
    if (!jsonFile) return;
    const state = payloadToState(JSON.parse(await jsonFile.async('text')));
    await store.importProject(state, window.confirm('현재 데이터를 가져온 데이터로 교체할까요? 취소하면 병합합니다.') ? 'replace' : 'merge');
    for (const asset of state.assets) {
      const path = imagePath(asset);
      const entry = path ? zip.file(path) : null;
      if (entry && asset.image) {
        const blob = await entry.async('blob');
        await db.images.put({ assetId: asset.id, fileName: asset.image.fileName, mimeType: asset.image.mimeType, blob, thumbnail: blob });
      }
    }
    return;
  }
  const state = payloadToState(JSON.parse(await file.text()));
  await store.importProject(state, window.confirm('현재 데이터를 가져온 데이터로 교체할까요? 취소하면 병합합니다.') ? 'replace' : 'merge');
}

function payloadToState(payload: any): ProjectState {
  const now = new Date().toISOString();
  return {
    ...initialProjectState,
    projectName: payload.meta?.projectName ?? 'imported-game',
    categories: payload.categories ?? initialProjectState.categories,
    assets: (payload.assets ?? []).map((asset: any, index: number) => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      description: asset.description ?? '',
      tags: asset.tags ?? [],
      rarity: asset.rarity ?? 'common',
      sortOrder: index,
      createdAt: now,
      updatedAt: now,
      data: asset.data ?? {},
      image: asset.image ? { fileName: asset.image.split('/').pop(), mimeType: 'image/png', width: 0, height: 0, size: 0 } : undefined,
    })),
  };
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function categoryName(categoryKey: string, state: ProjectState) {
  return state.categories.find((category) => category.key === categoryKey)?.name ?? categoryKey;
}

function defaultEmoji(category: string) {
  const map: Record<string, string> = {
    character: '🧙',
    weapon: '⚔️',
    item: '💎',
    monster: '👾',
    skill: '🔥',
    ui_icon: '⭐',
  };
  return map[category] ?? '🎒';
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="px-1 text-2xl font-black tracking-tight text-slate-100">{title}</h2>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="asset-panel">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function TextField({ label, value, onChange, error, hint }: { label: string; value: string; onChange: (value: string) => void; error?: string; hint?: string }) {
  return (
    <FieldLabel label={label}>
      <input className={`asset-input ${error ? 'border-red-500' : ''}`} value={value} onChange={(event) => onChange(event.target.value)} />
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
      {error && <span className="text-xs text-red-300">{error}</span>}
    </FieldLabel>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1 text-sm"><span className="font-bold text-slate-400">{label}</span>{children}</label>;
}

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return <button title={label} aria-label={label} className="asset-icon-btn" onClick={onClick}>{children}</button>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/70 p-6">
      <div className="asset-modal max-h-[88vh] w-full max-w-3xl overflow-auto">
        <div className="flex h-12 items-center justify-between border-b border-slate-800 px-4">
          <strong>{title}</strong>
          <button className="rounded px-2 py-1 text-sm hover:bg-slate-800" onClick={onClose}>닫기</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, body, confirmText, onCancel, onConfirm }: { title: string; body: string; confirmText: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="mb-4 text-sm text-slate-400">{body}</p>
      <div className="flex justify-end gap-2">
        <button className="rounded border border-slate-700 px-3 py-2 text-sm" onClick={onCancel}>취소</button>
        <button className="rounded bg-red-600 px-3 py-2 text-sm text-white" onClick={onConfirm}>{confirmText}</button>
      </div>
    </Modal>
  );
}
