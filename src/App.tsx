import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileJson,
  GripVertical,
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
} from 'lucide-react';
import JSZip from 'jszip';
import { db, initialProjectState } from './db';
import { rarityLabels } from './defaults';
import { useEditorStore } from './store';
import type { Asset, AssetMediaMeta, CustomField, MediaSlot, MediaSlotType, ProjectState, Rarity } from './types';
import {
  assetMediaEntries,
  findIncomingReferences,
  getNested,
  imagePath,
  mediaPath,
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
  const [imageTarget, setImageTarget] = useState<string | null>(null);
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

  const requestDelete = (ids = store.selectedIds) => {
    const refs = ids.flatMap((id) => findIncomingReferences(id, store));
    if (refs.length) {
      setDeleteWarning(refs);
      return;
    }
    if (window.confirm('선택한 에셋을 삭제할까요?')) store.deleteAssets(ids, true);
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
        <AssetSidebar onDelete={() => requestDelete()} onDeleteAsset={(id) => requestDelete([id])} />
        <AssetDetail asset={selectedAsset} onImageClick={setImageTarget} />
      </main>
      {store.selectedIds.length > 1 && <BatchBar />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {imageTarget && <ImageModal assetId={imageTarget} onClose={() => setImageTarget(null)} />}
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

const GROUP_ORDER = ['세계', '함대', '개발/능력', '경제', '콘텐츠'];

function AssetSidebar({ onDelete, onDeleteAsset }: { onDelete: () => void; onDeleteAsset: (id: string) => void }) {
  const store = useEditorStore();
  const [newCategory, setNewCategory] = useState(store.categories[0]?.key ?? 'character');
  const [contextMenu, setContextMenu] = useState<{ assetId: string; x: number; y: number } | null>(null);
  const [categoryContextMenu, setCategoryContextMenu] = useState<{ categoryKey: string; x: number; y: number } | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const term = store.search.trim().toLowerCase();
    return [...store.assets]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((asset) => !term || [asset.name, asset.id, asset.tags.join(' ')].join(' ').toLowerCase().includes(term));
  }, [store.assets, store.search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof store.categories>();
    for (const cat of store.categories) {
      const g = cat.group ?? '기타';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(cat);
    }
    const order = [...GROUP_ORDER, '기타'];
    return [...map.entries()].sort(([a], [b]) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [store.categories]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  useEffect(() => {
    if (!contextMenu && !categoryContextMenu) return;
    const close = () => { setContextMenu(null); setCategoryContextMenu(null); };
    window.addEventListener('click', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', close);
    };
  }, [contextMenu, categoryContextMenu]);

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
      <div className="min-h-0 flex-1 overflow-auto px-2 pb-3">
        {grouped.map(([groupName, categories]) => {
          const groupCollapsed = collapsedGroups.has(groupName);
          const groupTotal = categories.reduce((n, cat) => n + filtered.filter((a) => a.category === cat.key).length, 0);
          return (
            <div key={groupName} className="mb-1">
              {/* 그룹 헤더 */}
              <button className="asset-group-header" onClick={() => toggleGroup(groupName)}>
                {groupCollapsed ? <ChevronRight className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
                <span className="flex-1 text-left">{groupName}</span>
                <span className="asset-group-count">{groupTotal}</span>
              </button>
              {/* 그룹 내 카테고리 목록 */}
              {!groupCollapsed && (
                <div className="asset-group-body">
                  {categories.map((category) => {
                    const items = filtered.filter((asset) => asset.category === category.key);
                    return (
                      <section key={category.key} className="mb-1">
                        <button
                          className="asset-category-title"
                          onClick={() => store.toggleCategory(category.key)}
                          onContextMenu={(event) => {
                            event.preventDefault();
                            setContextMenu(null);
                            setCategoryContextMenu({ categoryKey: category.key, x: event.clientX, y: event.clientY });
                          }}
                        >
                          {category.collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          <span>{category.name}</span>
                          <span className="ml-auto">{items.length}</span>
                        </button>
                        {!category.collapsed && (
                          <div className="space-y-1 pl-2">
                            {items.map((asset) => (
                              <AssetListItem
                                key={asset.id}
                                asset={asset}
                                onContextMenu={(event) => {
                                  event.preventDefault();
                                  store.selectAsset(asset.id);
                                  setContextMenu({ assetId: asset.id, x: event.clientX, y: event.clientY });
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {contextMenu && (
        <div className="asset-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(event) => event.stopPropagation()}>
          <button
            onClick={() => {
              onDeleteAsset(contextMenu.assetId);
              setContextMenu(null);
            }}
          >
            <Trash2 className="h-4 w-4" /> 삭제
          </button>
        </div>
      )}
      {categoryContextMenu && (
        <div className="asset-context-menu" style={{ left: categoryContextMenu.x, top: categoryContextMenu.y }} onClick={(event) => event.stopPropagation()}>
          <button
            onClick={() => {
              const key = categoryContextMenu.categoryKey;
              setCategoryContextMenu(null);
              if (window.confirm('이 카테고리와 포함 에셋을 삭제할까요?')) store.deleteCategory(key);
            }}
          >
            <Trash2 className="h-4 w-4" /> 삭제
          </button>
        </div>
      )}
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

function AssetListItem({ asset, onContextMenu }: { asset: Asset; onContextMenu: (event: React.MouseEvent<HTMLButtonElement>) => void }) {
  const store = useEditorStore();
  const selected = store.selectedIds.includes(asset.id);
  const category = store.categories.find((item) => item.key === asset.category);
  const [thumb, setThumb] = useState<string>();

  useEffect(() => {
    let url = '';
    setThumb(undefined);
    const media = assetMediaEntries(asset)[0];
    if (!media) return;
    db.mediaImages.get(`${asset.id}::${media[0]}`).then((record) => {
      if (!record) return;
      url = URL.createObjectURL(record.thumbnail);
      setThumb(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [asset.id, asset.image?.fileName, asset.media]);

  return (
    <button
      className={`asset-list-item ${selected ? 'is-selected' : ''}`}
      onClick={(event) => store.selectAsset(asset.id, event.shiftKey ? 'range' : event.ctrlKey ? 'toggle' : 'single')}
      onContextMenu={onContextMenu}
    >
      <div className="asset-list-thumb checker">
        {thumb ? <img className="h-full w-full object-contain" src={thumb} alt={asset.name} /> : <span>{String(getNested(asset.data, '__emoji') || defaultEmoji(asset.category))}</span>}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm font-bold text-slate-100">{asset.name}</div>
        <div className="truncate text-xs text-slate-500">{asset.id} · {category?.name ?? asset.category}</div>
      </div>
    </button>
  );
}

function AssetDetail({ asset, onImageClick }: { asset?: Asset; onImageClick: (assetId: string) => void }) {
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

  const slots = mediaSlotsForAsset(asset, store);
  const savedPrimaryKey = String(getNested(asset.data, '__primarySlotKey') ?? '');
  const primarySlotKey = slots.find((s) => s.key === savedPrimaryKey)?.key ?? slots[0]?.key ?? 'main';
  const setPrimarySlot = (key: string) => store.updateAssetData(asset.id, '__primarySlotKey', key);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; slotKey: string } | null>(null);

  return (
    <section className="asset-workspace flex min-h-0 flex-1 flex-col" onClick={() => setCtxMenu(null)}>
      {/* Top 30%: image slots in a horizontal row */}
      <div className="asset-top-panel shrink-0">
        {slots.map((slot) => {
          const ratio = parseAspectRatio(slot.sizeHint) ?? 1;
          const hasImage = !!asset.media?.[slot.key];
          return (
            <button
              key={slot.key}
              className={`asset-panel-slot checker ${slot.key === primarySlotKey ? 'is-active' : ''}`}
              style={{ aspectRatio: ratio }}
              onClick={() => (slot.key === primarySlotKey ? onImageClick(asset.id) : setPrimarySlot(slot.key))}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (hasImage) setCtxMenu({ x: e.clientX, y: e.clientY, slotKey: slot.key });
              }}
              title={slot.label}
            >
              <AssetSlotThumb asset={asset} slotKey={slot.key} label={slot.label} useBlob />
            </button>
          );
        })}
      </div>
      {ctxMenu && (
        <div className="asset-ctx-menu" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={(e) => e.stopPropagation()}>
          <button className="asset-ctx-item" onClick={() => { store.deleteAssetMedia(asset.id, ctxMenu.slotKey); setCtxMenu(null); }}>
            이미지 삭제
          </button>
        </div>
      )}
      {/* Bottom 70%: info + tabs + fields */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="asset-info-header shrink-0">
          <div className="mb-1.5 flex items-center gap-2">
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
        </div>
        <div className="asset-tabs shrink-0">
          {(Object.keys(tabLabels) as DetailTab[]).map((tab) => (
            <button key={tab} className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)}>
              {tabLabels[tab]}
            </button>
          ))}
        </div>
        <div className="asset-detail-body min-h-0 flex-1 overflow-y-auto">
          {activeTab === 'overview' && <OverviewTab asset={asset} />}
          {activeTab === 'basic' && <BasicTab asset={asset} />}
          {activeTab === 'schema' && <SchemaTab asset={asset} />}
          {activeTab === 'refs' && <RefsTab asset={asset} />}
          {activeTab === 'json' && <JsonTab asset={asset} />}
        </div>
      </div>
    </section>
  );
}

function AssetSlotThumb({ asset, slotKey, label, useBlob }: { asset: Asset; slotKey: string; label?: string; useBlob?: boolean }) {
  const [imgUrl, setImgUrl] = useState<string>();
  useEffect(() => {
    let url = '';
    setImgUrl(undefined);
    db.mediaImages.get(`${asset.id}::${slotKey}`).then((record) => {
      if (!record) return;
      url = URL.createObjectURL(useBlob ? record.blob : record.thumbnail);
      setImgUrl(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [asset.id, slotKey, useBlob, asset.media?.[slotKey]?.fileName]);

  if (imgUrl) return <img className="h-full w-full object-cover" src={imgUrl} />;
  return <span className="text-xs font-semibold text-slate-600">{label ?? slotKey.slice(0, 3).toUpperCase()}</span>;
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
  const isWeapon = asset.category === 'weapon';
  const availableRarities = (Object.keys(rarityLabels) as Rarity[]).filter(
    (r) => !isWeapon || store.weaponSettings.rarityOptions.includes(r),
  );
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
            {availableRarities.map((rarity) => <option key={rarity} value={rarity}>{rarityLabels[rarity]}</option>)}
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
  const mediaItems = assetMediaEntries(asset);
  return (
    <Panel title="참조와 파일">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="asset-muted-box">
          <strong>미디어 정보</strong>
          {mediaItems.length ? (
            <div className="mt-2 space-y-1">
              {mediaItems.map(([slotKey, media]) => (
                <p key={slotKey}>{slotKey}: {media.fileName} · {media.width}x{media.height} · {readableBytes(media.size)}</p>
              ))}
            </div>
          ) : (
            <p>이미지 없음</p>
          )}
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

  // Weapon-specific field overrides
  if (asset.category === 'weapon') {
    const ws = store.weaponSettings;
    if (field.key === 'tier') {
      return (
        <FieldLabel label={field.label}>
          <select className="asset-input" value={String(Number(value ?? 1))} onChange={(e) => setValue(Number(e.target.value))}>
            {Array.from({ length: ws.tierMax }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}단계</option>
            ))}
          </select>
        </FieldLabel>
      );
    }
    if (field.key === 'range') {
      const max = ws.rangeMax;
      return (
        <FieldLabel label={field.label}>
          <input type="range" className="asset-input" min={0} max={max} value={Number(value ?? 0)} onChange={(e) => setValue(Number(e.target.value))} />
          <span className="text-xs text-slate-500">{String(value ?? 0)} / {max}</span>
        </FieldLabel>
      );
    }
    if (field.key === 'apCost') {
      const max = ws.apCostMax;
      return (
        <FieldLabel label={field.label}>
          <input type="range" className="asset-input" min={0} max={max} value={Number(value ?? 0)} onChange={(e) => setValue(Number(e.target.value))} />
          <span className="text-xs text-slate-500">{String(value ?? 0)} / {max}</span>
        </FieldLabel>
      );
    }
  }

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

function ImageModal({ assetId, onClose }: { assetId: string; onClose: () => void }) {
  const store = useEditorStore();
  const asset = store.assets.find((a) => a.id === assetId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const slots = asset ? mediaSlotsForAsset(asset, store) : [];
  const [activeSlotKey, setActiveSlotKey] = useState(slots[0]?.key ?? 'concept');
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const activeSlot = slots.find((slot) => slot.key === activeSlotKey) ?? slots[0];
  const activeMedia = activeSlot && asset ? asset.media?.[activeSlot.key] : undefined;
  const emoji = String((asset ? getNested(asset.data, '__emoji') : '') || defaultEmoji(asset?.category ?? ''));
  if (!asset) return null;

  useEffect(() => {
    let url = '';
    if (!activeSlot) return undefined;
    setPreviewUrl(undefined);
    db.mediaImages.get(`${asset.id}::${activeSlot.key}`).then((record) => {
      if (!record) return;
      url = URL.createObjectURL(record.blob);
      setPreviewUrl(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [asset.id, activeSlot?.key, activeMedia?.fileName]);

  const upload = async (files: FileList | File[]) => {
    const file = Array.from(files).find((item) => item.type.startsWith('image/'));
    if (!file || !activeSlot) return;
    await store.setAssetMedia(asset.id, activeSlot, file);
  };

  const handleSlotDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragFromIndex(index);
  };
  const handleSlotDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragFromIndex !== null && dragFromIndex !== toIndex) {
      store.reorderMediaSlot(asset.category, dragFromIndex, toIndex);
    }
    setDragFromIndex(null);
  };

  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <Modal title="미디어 / 임시 이모지" onClose={onClose}>
      <div className="flex gap-5" style={{ minHeight: 360 }}>
        {/* Left: image preview — double-click to open file picker */}
        <div
          className="asset-modal-preview checker shrink-0 self-start"
          style={{ width: 480, aspectRatio: parseAspectRatio(activeSlot?.sizeHint) ?? 1, cursor: 'pointer' }}
          onDoubleClick={() => inputRef.current?.click()}
          onDrop={(event) => { event.preventDefault(); upload(event.dataTransfer.files); }}
          onDragOver={(event) => event.preventDefault()}
          title="더블클릭으로 이미지 선택"
        >
          {previewUrl ? <img className="h-full w-full object-contain" src={previewUrl} alt={asset.name} /> : <span>{emoji}</span>}
        </div>
        {/* Right: slot list + controls */}
        <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto">
          {/* Slot list */}
          <div className="space-y-2">
            {slots.map((slot, index) => {
              const media = asset.media?.[slot.key];
              return (
                <div
                  key={slot.key}
                  className={`flex items-center gap-1 transition-opacity ${dragFromIndex === index ? 'opacity-40' : ''}`}
                  draggable
                  onDragStart={(e) => handleSlotDragStart(e, index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleSlotDrop(e, index)}
                  onDragEnd={() => setDragFromIndex(null)}
                >
                  <span className="asset-drag-handle shrink-0 cursor-grab" title="순서 변경"><GripVertical /></span>
                  <button
                    className={`asset-media-slot flex-1 min-w-0 ${activeSlot?.key === slot.key ? 'is-active' : ''}`}
                    onClick={() => setActiveSlotKey(slot.key)}
                  >
                    <strong>{slot.label}{slot.sizeHint && <span className="ml-1.5 text-[11px] font-normal text-slate-500">{slot.sizeHint}</span>}</strong>
                    <span>{media ? media.fileName : '이미지 없음'}</span>
                  </button>
                </div>
              );
            })}
          </div>
          {/* Upload controls */}
          <section>
            <h3 className="text-sm font-bold text-slate-100">
              {activeSlot?.label ?? '미디어'} 삽입
              {activeSlot?.sizeHint && <span className="ml-2 text-xs font-normal text-slate-500">{activeSlot.sizeHint}</span>}
            </h3>
            <p className="mt-1 text-sm text-slate-500">왼쪽 영역을 더블클릭하거나 파일을 드롭하세요.</p>
            <input ref={inputRef} className="hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => event.target.files && upload(event.target.files)} />
            {activeSlot && activeMedia && (
              <button className="mt-3 rounded border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800" onClick={() => store.deleteAssetMedia(asset.id, activeSlot.key)}>
                삭제
              </button>
            )}
          </section>
          {activeSlot?.type === 'spriteSheet' && activeMedia && (
            <section>
              <h3 className="text-sm font-bold text-slate-100">스프라이트 시트</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(['frameWidth', 'frameHeight', 'columns', 'rows', 'fps'] as const).map((key) => (
                  <FieldLabel key={key} label={spriteLabel(key)}>
                    <input
                      className="asset-input"
                      type="number"
                      min={1}
                      value={activeMedia.sprite?.[key] ?? (key === 'fps' ? 12 : 1)}
                      onChange={(event) =>
                        store.updateAssetMediaSprite(asset.id, activeSlot.key, {
                          frameWidth: activeMedia.sprite?.frameWidth ?? 1,
                          frameHeight: activeMedia.sprite?.frameHeight ?? 1,
                          columns: activeMedia.sprite?.columns ?? 1,
                          rows: activeMedia.sprite?.rows ?? 1,
                          fps: activeMedia.sprite?.fps ?? 12,
                          [key]: Number(event.target.value),
                        })
                      }
                    />
                  </FieldLabel>
                ))}
              </div>
            </section>
          )}
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
          {activeMedia && <p className="asset-muted-box text-xs">{activeMedia.fileName} · {activeMedia.width}x{activeMedia.height} · {readableBytes(activeMedia.size)}</p>}
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
  const [settingsTab, setSettingsTab] = useState<'menu' | 'weapon'>('menu');
  return (
    <Modal title="설정" onClose={onClose}>
      <div className="mb-5 flex gap-2 border-b border-slate-800 pb-3">
        <button className={`rounded-md px-4 py-2 text-sm font-bold transition-colors ${settingsTab === 'menu' ? 'bg-rose-900/60 text-white border border-rose-700' : 'text-slate-400 hover:text-slate-200'}`} onClick={() => setSettingsTab('menu')}>메뉴관리</button>
        <button className={`rounded-md px-4 py-2 text-sm font-bold transition-colors ${settingsTab === 'weapon' ? 'bg-rose-900/60 text-white border border-rose-700' : 'text-slate-400 hover:text-slate-200'}`} onClick={() => setSettingsTab('weapon')}>무기</button>
      </div>
      {settingsTab === 'menu' && <MenuManagementTab />}
      {settingsTab === 'weapon' && <WeaponSettingsTab />}
    </Modal>
  );
}

function MenuManagementTab() {
  const store = useEditorStore();
  const [categoryNameValue, setCategoryNameValue] = useState('');
  const [fieldDraft, setFieldDraft] = useState({ category: store.categories[0]?.key ?? '', label: '', type: 'text', options: '' });
  const [mediaSlotDraft, setMediaSlotDraft] = useState({ label: '', type: 'image' as MediaSlotType });
  const selectedFieldCategory = store.categories.find((category) => category.key === fieldDraft.category) ?? store.categories[0];

  useEffect(() => {
    if (!store.categories.some((category) => category.key === fieldDraft.category)) {
      setFieldDraft((draft) => ({ ...draft, category: store.categories[0]?.key ?? '' }));
    }
  }, [fieldDraft.category, store.categories]);

  const startDrag = (event: React.DragEvent, kind: 'category' | 'field' | 'mediaSlot', index: number) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-asset-editor-drag', JSON.stringify({ kind, index }));
  };
  const dropCategory = (event: React.DragEvent, toIndex: number) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (payload?.kind === 'category') store.reorderCategory(payload.index, toIndex);
  };
  const dropField = (event: React.DragEvent, toIndex: number) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (selectedFieldCategory && payload?.kind === 'field') store.reorderField(selectedFieldCategory.key, payload.index, toIndex);
  };
  const dropMediaSlot = (event: React.DragEvent, toIndex: number) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (selectedFieldCategory && payload?.kind === 'mediaSlot') store.reorderMediaSlot(selectedFieldCategory.key, payload.index, toIndex);
  };

  return (
    <div className="grid grid-cols-2 gap-5">
      <section>
        <h3 className="mb-2 text-sm font-bold">카테고리</h3>
        <div className="space-y-2">
          {store.categories.map((category, index) => (
            <div key={category.key} className="asset-draggable-row flex gap-2" draggable onDragStart={(event) => startDrag(event, 'category', index)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropCategory(event, index)}>
              <span className="asset-drag-handle" title="순서 변경"><GripVertical /></span>
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
          <div className="space-y-2">
            {selectedFieldCategory?.fields.length ? (
              selectedFieldCategory.fields.map((field, index) => (
                <div key={field.key} className="asset-draggable-row flex gap-2" draggable onDragStart={(event) => startDrag(event, 'field', index)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropField(event, index)}>
                  <span className="asset-drag-handle" title="순서 변경"><GripVertical /></span>
                  <div className="asset-field-row-summary">
                    <strong>{field.label}</strong>
                    <span>{field.key} · {field.type}</span>
                  </div>
                  <IconButton label="필드 삭제" onClick={() => store.deleteField(selectedFieldCategory.key, field.key)}><Trash2 /></IconButton>
                </div>
              ))
            ) : (
              <div className="asset-muted-box text-sm">이 카테고리에는 커스텀 필드가 없습니다.</div>
            )}
          </div>
          <div className="asset-muted-box space-y-2 text-sm">
            <strong className="block text-slate-200">미디어 슬롯</strong>
            {(selectedFieldCategory?.mediaSlots ?? []).map((slot, index) => (
              <div key={slot.key} className="asset-draggable-row flex gap-2" draggable onDragStart={(event) => startDrag(event, 'mediaSlot', index)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropMediaSlot(event, index)}>
                <span className="asset-drag-handle" title="순서 변경"><GripVertical /></span>
                <div className="asset-field-row-summary">
                  <strong>{slot.label}</strong>
                  <span>{slot.key} · {slot.type}</span>
                </div>
                <IconButton label="미디어 슬롯 삭제" onClick={() => selectedFieldCategory && store.deleteMediaSlot(selectedFieldCategory.key, slot.key)}><Trash2 /></IconButton>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_130px_auto] gap-2">
              <input className="asset-input" placeholder="슬롯 이름" value={mediaSlotDraft.label} onChange={(event) => setMediaSlotDraft({ ...mediaSlotDraft, label: event.target.value })} />
              <select className="asset-input" value={mediaSlotDraft.type} onChange={(event) => setMediaSlotDraft({ ...mediaSlotDraft, type: event.target.value as MediaSlotType })}>
                <option value="image">이미지</option>
                <option value="spriteSheet">스프라이트 시트</option>
                <option value="card">카드</option>
              </select>
              <button className="asset-primary-btn px-3" onClick={() => {
                if (!selectedFieldCategory || !mediaSlotDraft.label.trim()) return;
                store.addMediaSlot(selectedFieldCategory.key, { key: safeId(mediaSlotDraft.label) || `media_${Date.now()}`, label: mediaSlotDraft.label.trim(), type: mediaSlotDraft.type });
                setMediaSlotDraft({ ...mediaSlotDraft, label: '' });
              }}>추가</button>
            </div>
          </div>
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
            store.addField(fieldDraft.category, { key: safeId(fieldDraft.label) || `field_${Date.now()}`, label: fieldDraft.label, type: fieldDraft.type as CustomField['type'], options: fieldDraft.options.split(',').map((item) => item.trim()).filter(Boolean) });
            setFieldDraft({ ...fieldDraft, label: '', options: '' });
          }}>필드 추가</button>
        </div>
      </section>
    </div>
  );
}

function WeaponSettingsTab() {
  const store = useEditorStore();
  const ws = store.weaponSettings;
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-bold text-slate-200">수치 최대치</h3>
        <div className="grid grid-cols-3 gap-4">
          <FieldLabel label="단계 최대치">
            <input type="number" className="asset-input" min={1} max={10} value={ws.tierMax}
              onChange={(e) => store.setWeaponSettings({ ...ws, tierMax: Math.max(1, Math.min(10, Number(e.target.value))) })} />
          </FieldLabel>
          <FieldLabel label="사거리 최대치">
            <input type="number" className="asset-input" min={1} max={50} value={ws.rangeMax}
              onChange={(e) => store.setWeaponSettings({ ...ws, rangeMax: Math.max(1, Math.min(50, Number(e.target.value))) })} />
          </FieldLabel>
          <FieldLabel label="AP 소모 최대치">
            <input type="number" className="asset-input" min={1} max={20} value={ws.apCostMax}
              onChange={(e) => store.setWeaponSettings({ ...ws, apCostMax: Math.max(1, Math.min(20, Number(e.target.value))) })} />
          </FieldLabel>
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-sm font-bold text-slate-200">희귀도 옵션</h3>
        <div className="flex flex-wrap gap-4">
          {(Object.keys(rarityLabels) as Rarity[]).map((rarity) => (
            <label key={rarity} className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={ws.rarityOptions.includes(rarity)}
                onChange={(e) => {
                  const options = e.target.checked
                    ? [...ws.rarityOptions, rarity]
                    : ws.rarityOptions.filter((r) => r !== rarity);
                  if (options.length > 0) store.setWeaponSettings({ ...ws, rarityOptions: options });
                }}
              />
              {rarityLabels[rarity]}
            </label>
          ))}
        </div>
      </section>
    </div>
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
    for (const [slotKey, media] of assetMediaEntries(asset)) {
      const record = await db.mediaImages.get(`${asset.id}::${slotKey}`);
      if (record) zip.file(mediaPath(asset.id, media), record.blob);
    }
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
      for (const [slotKey, media] of assetMediaEntries(asset)) {
        const entry = zip.file(mediaPath(asset.id, media)) ?? (slotKey === 'main' && asset.image ? zip.file(imagePath(asset) ?? '') : null);
        if (!entry) continue;
        const blob = await entry.async('blob');
        await db.mediaImages.put({ id: `${asset.id}::${slotKey}`, assetId: asset.id, slotKey, fileName: media.fileName, mimeType: media.mimeType, blob, thumbnail: blob });
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
    assets: (payload.assets ?? []).map((asset: any, index: number) => {
      const media = mediaFromPayload(asset);
      return {
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
        image: Object.values(media)[0],
        media,
      };
    }),
  };
}

function mediaFromPayload(asset: any): Record<string, AssetMediaMeta> {
  const entries = Object.entries<string>(asset.media ?? (asset.image ? { main: asset.image } : {}));
  return Object.fromEntries(
    entries.map(([slotKey, path]) => [
      slotKey,
      {
        slotKey,
        slotType: slotKey.includes('sprite') ? 'spriteSheet' : slotKey.includes('card') ? 'card' : 'image',
        fileName: path.split('/').pop() ?? `${slotKey}.png`,
        mimeType: 'image/png',
        width: 0,
        height: 0,
        size: 0,
      },
    ]),
  );
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

function mediaSlotsForAsset(asset: Asset, state: ProjectState): MediaSlot[] {
  const category = state.categories.find((item) => item.key === asset.category);
  return category?.mediaSlots?.length ? category.mediaSlots : [{ key: 'main', label: '대표 이미지', type: 'image' }];
}

function parseAspectRatio(sizeHint?: string): number | undefined {
  if (!sizeHint) return undefined;
  const match = sizeHint.match(/(\d+)\s*[×x]\s*(\d+)/i);
  if (!match) return undefined;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!width || !height) return undefined;
  return width / height;
}

function spriteLabel(key: 'frameWidth' | 'frameHeight' | 'columns' | 'rows' | 'fps') {
  const labels = {
    frameWidth: '프레임 너비',
    frameHeight: '프레임 높이',
    columns: '열',
    rows: '행',
    fps: 'FPS',
  };
  return labels[key];
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

function readDragPayload(event: React.DragEvent) {
  try {
    const payload = JSON.parse(event.dataTransfer.getData('application/x-asset-editor-drag')) as { kind?: unknown; index?: unknown };
    if ((payload.kind === 'category' || payload.kind === 'field' || payload.kind === 'mediaSlot') && Number.isInteger(payload.index)) {
      return payload as { kind: 'category' | 'field' | 'mediaSlot'; index: number };
    }
  } catch {
    return null;
  }
  return null;
}

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return <button title={label} aria-label={label} className="asset-icon-btn" onClick={onClick}>{children}</button>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/70 p-6">
      <div className="asset-modal max-h-[88vh] w-full max-w-5xl overflow-auto">
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
