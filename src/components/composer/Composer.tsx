import React, { useCallback } from 'react';
import { useGenreData, useComposerStore, ComposerSelection, GenreLeaf, GenreGroup } from '../../features/composer/useComposerStore';

export function Composer({ onChange }: { onChange: (s: ComposerSelection) => void }) {
  const { data, error } = useGenreData();
  const store = useComposerStore(data);

  const handleConfirm = useCallback(() => {
    onChange(store.toSelection());
  }, [store, onChange]);

  if (error) {
    return <div className="p-4 text-red-500">장르 데이터 로드 실패: {error}</div>;
  }
  if (!data) {
    return <div className="p-4 text-sm opacity-70">Loading genres...</div>;
  }

  return (
    <div className="flex flex-col gap-4 h-full" aria-label="Composer">
      <ComposerHeader search={store.search} onSearch={store.setSearch} hybrid={store.hybridEnabled} onToggleHybrid={store.toggleHybrid} />
      <div className="flex flex-1 gap-6 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <GroupGrid
            groups={store.filteredGroups}
            primary={store.primary}
            hybrid={store.hybrid}
            hybridEnabled={store.hybridEnabled}
            onPickPrimary={store.pickLeaf}
            onPickHybrid={store.pickHybrid}
          />
        </div>
        <div className="w-80 flex-shrink-0 border-l border-neutral-800 pl-4">
          <SummaryPanel
            leaf={store.activeLeaf}
            group={store.activeGroup}
            hybridLeaf={store.hybrid ? store.activeLeaf : null}
            hybridEnabled={store.hybridEnabled}
            primaryLeafId={store.primary?.leafId}
            onConfirm={handleConfirm}
          />
          {store.warning && (
            <div className="mt-2 text-xs text-yellow-400" role="alert">
              {store.warning}
              <button className="ml-2 underline" onClick={store.clearWarning}>닫기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComposerHeader({ search, onSearch, hybrid, onToggleHybrid }: { search: string; onSearch: (v: string) => void; hybrid: boolean; onToggleHybrid: () => void }) {
  return (
    <div className="flex items-center gap-4">
      <input
        aria-label="Search genres"
        placeholder="Search (label / tags / desc)"
        className="flex-1 bg-neutral-900 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-teal-500"
        value={search}
        onChange={e => onSearch(e.target.value)}
      />
      <label className="flex items-center gap-2 text-xs select-none">
        <input type="checkbox" checked={hybrid} onChange={onToggleHybrid} /> Hybrid
      </label>
    </div>
  );
}

function GroupGrid({
  groups,
  primary,
  hybrid,
  onPickPrimary,
  onPickHybrid,
  hybridEnabled
}: {
  groups: GenreGroup[];
  primary: { groupId: string; leafId: string } | null;
  hybrid: { groupId: string; leafId: string } | null;
  onPickPrimary: (g: string, l: string) => void;
  onPickHybrid: (g: string, l: string) => void;
  hybridEnabled: boolean;
}) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))' }}>
      {groups.map(g => (
        <div key={g.id} className="border border-neutral-800 rounded p-2 flex flex-col gap-2 bg-neutral-950/40">
          <div className="text-xs font-semibold opacity-80 uppercase tracking-wide">{g.label}</div>
          <div className="flex flex-wrap gap-2">
            {g.leaves.map(l => {
              const isPrimary = primary?.leafId === l.id;
              const isHybrid = hybrid?.leafId === l.id;
              return (
                <LeafButton
                  key={l.id}
                  leaf={l}
                  isPrimary={!!isPrimary}
                  isHybrid={!!isHybrid}
                  hybridEnabled={hybridEnabled}
                  onPickPrimary={() => onPickPrimary(g.id, l.id)}
                  onPickHybrid={() => onPickHybrid(g.id, l.id)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function LeafButton({
  leaf,
  isPrimary,
  isHybrid,
  hybridEnabled,
  onPickPrimary,
  onPickHybrid
}: {
  leaf: GenreLeaf;
  isPrimary: boolean;
  isHybrid: boolean;
  hybridEnabled: boolean;
  onPickPrimary: () => void;
  onPickHybrid: () => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    if (hybridEnabled && (e.metaKey || e.altKey)) {
      onPickHybrid();
    } else if (hybridEnabled && isPrimary) {
      onPickHybrid();
    } else {
      onPickPrimary();
    }
  };
  return (
    <button
      type="button"
      aria-pressed={isPrimary || isHybrid}
      onClick={handleClick}
      title={leaf.desc}
      className={
        'px-2 py-1 rounded text-xs border transition-colors ' +
        (isPrimary
          ? 'border-teal-500 bg-teal-600/20'
          : isHybrid
          ? 'border-purple-500 bg-purple-600/20'
          : 'border-neutral-700 hover:border-neutral-500')
      }
    >
      {leaf.label}
    </button>
  );
}

function SummaryPanel({
  leaf,
  hybridLeaf,
  group,
  hybridEnabled,
  primaryLeafId,
  onConfirm
}: {
  leaf: GenreLeaf | null;
  hybridLeaf: GenreLeaf | null;
  group: GenreGroup | null;
  hybridEnabled: boolean;
  primaryLeafId?: string;
  onConfirm: () => void;
}) {
  if (!leaf) return <div className="text-xs opacity-60">장르를 선택하세요.</div>;

  const preview = buildPreview(leaf, hybridEnabled ? hybridLeaf : null, group?.label || '');

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="font-semibold text-sm">Summary</div>
      <div className="space-y-1">
        <div className="opacity-80">{leaf.desc}</div>
        {hybridLeaf && hybridLeaf.id !== leaf.id && <div className="opacity-70">+ {hybridLeaf.desc}</div>}
      </div>
      <pre className="bg-neutral-900/60 p-2 rounded whitespace-pre-wrap text-[11px] leading-snug max-h-56 overflow-auto">{preview}</pre>
      <button
        onClick={onConfirm}
        className="mt-2 bg-teal-600 hover:bg-teal-500 text-white rounded px-3 py-1 text-xs font-medium"
        disabled={!primaryLeafId}
      >
        Confirm
      </button>
    </div>
  );
}

function parseBpmRange(bpm: string): [number, number] | null {
  if (bpm.includes('-')) {
    const [a, b] = bpm.split('-').map(s => parseInt(s.replace(/[^0-9]/g, ''), 10));
    if (!isNaN(a) && !isNaN(b)) return [a, b];
  }
  if (bpm.match(/^[0-9]+$/)) {
    const v = parseInt(bpm, 10); return [v, v];
  }
  return null;
}

function intersectBpm(a: string, b: string): string {
  const ra = parseBpmRange(a);
  const rb = parseBpmRange(b);
  if (!ra || !rb) return a + ' / ' + b;
  const lo = Math.max(ra[0], rb[0]);
  const hi = Math.min(ra[1], rb[1]);
  if (lo <= hi) return `${lo}-${hi}`;
  // snap widen 10%
  const range = [Math.min(ra[0], rb[0]), Math.max(ra[1], rb[1])];
  const width = range[1] - range[0];
  const pad = Math.round(width * 0.1);
  return `${range[0] + pad}-${range[1] - pad}`;
}

function buildPreview(a: GenreLeaf, b: GenreLeaf | null, groupLabel: string): string {
  if (!b) {
    return [
      `Style: ${groupLabel}/${a.label} ${a.tags.slice(0, 3).join(', ')}`,
      `Tempo: ${a.bpm} | Time: ${a.time}`,
      `Instruments (Must): ${a.must_instruments.slice(0, 4).join(', ')}`,
      `Do not: ${a.avoid.slice(0, 3).join(', ')}`,
      `Notes: keep arrangement simple; prioritize ${a.tags[0]} feel.`
    ].join('\n');
  }
  const bpm = intersectBpm(a.bpm, b.bpm);
  const instruments = Array.from(new Set([...a.must_instruments, ...b.must_instruments])).slice(0, 6);
  const avoid = Array.from(new Set([...a.avoid, ...b.avoid])).slice(0, 6);
  const tags = Array.from(new Set([...a.tags, ...b.tags])).slice(0, 5);
  return [
    `Style: HYBRID ${a.label} + ${b.label} ${tags.slice(0, 3).join(', ')}`,
    `Tempo: ${bpm} | Time: ${a.time} / ${b.time}`,
    `Instruments (Must): ${instruments.join(', ')}`,
    `Do not: ${avoid.join(', ')}`,
    `Notes: blend ${a.tags[0]} and ${b.tags[0]} texture.`
  ].join('\n');
}
