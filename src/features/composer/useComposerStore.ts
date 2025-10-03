import { useCallback, useEffect, useMemo, useState } from 'react';

export type GenreLeaf = {
  id: string;
  label: string;
  bpm: string;
  time: string;
  must_instruments: string[];
  tags: string[];
  avoid: string[];
  desc: string;
};
export type GenreGroup = { id: string; label: string; leaves: GenreLeaf[] };
export type GenreTaxonomy = {
  version: string;
  groups: GenreGroup[];
  hybrid: { max: number; rule: string; blend_fields: string[]; conflict_policy: string };
};

export type ComposerSelection = {
  primary: { groupId: string; leafId: string } | null;
  hybrid: { groupId: string; leafId: string } | null; // second slot
  tags: string[];
};

export function useGenreData() {
  const [data, setData] = useState<GenreTaxonomy | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    import('../../data/genres/genre-taxonomy.json')
      .then(m => {
        if (active) setData(m as unknown as GenreTaxonomy);
      })
      .catch(e => setError(e.message || 'Failed to load genre taxonomy'));
    return () => {
      active = false;
    };
  }, []);
  return { data, error };
}

export interface ComposerStateApi {
  search: string;
  setSearch: (v: string) => void;
  hybridEnabled: boolean;
  toggleHybrid: () => void;
  primary: { groupId: string; leafId: string } | null;
  hybrid: { groupId: string; leafId: string } | null;
  activeLeaf: GenreLeaf | null;
  activeGroup: GenreGroup | null;
  pickLeaf: (groupId: string, leafId: string) => void;
  pickHybrid: (groupId: string, leafId: string) => void;
  clearHybrid: () => void;
  toSelection: () => ComposerSelection;
  warning: string | null;
  clearWarning: () => void;
  filteredGroups: GenreGroup[];
}

export function filterGroupsForQuery(groups: GenreGroup[], search: string): GenreGroup[] {
  if (!search.trim()) return groups;
  const q = search.toLowerCase();
  return groups
    .map(g => ({
      ...g,
      leaves: g.leaves.filter(l => [l.label, l.desc, ...l.tags].some(f => f.toLowerCase().includes(q)))
    }))
    .filter(g => g.leaves.length > 0);
}

export function useComposerStore(taxonomy: GenreTaxonomy | null): ComposerStateApi {
  const [search, setSearch] = useState('');
  const [hybridEnabled, setHybridEnabled] = useState(false);
  const [primary, setPrimary] = useState<{ groupId: string; leafId: string } | null>(null);
  const [hybrid, setHybrid] = useState<{ groupId: string; leafId: string } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const groups = taxonomy?.groups || [];

  const filteredGroups = useMemo(() => {
    return filterGroupsForQuery(groups, search);
  }, [groups, search]);

  const findLeaf = useCallback(
    (pair: { groupId: string; leafId: string } | null): GenreLeaf | null => {
      if (!pair) return null;
      const g = groups.find(g => g.id === pair.groupId);
      if (!g) return null;
      return g.leaves.find(l => l.id === pair.leafId) || null;
    },
    [groups]
  );

  const activeLeaf = findLeaf(hybrid || primary) || null;
  const activeGroup = groups.find(g => g.id === (hybrid?.groupId || primary?.groupId || '')) || null;

  const pickLeaf = useCallback(
    (groupId: string, leafId: string) => {
      setPrimary({ groupId, leafId });
      if (!hybridEnabled) setHybrid(null);
    },
    [hybridEnabled]
  );

  const pickHybrid = useCallback(
    (groupId: string, leafId: string) => {
      if (!hybridEnabled) return;
      if (primary && primary.groupId === groupId) {
        setWarning('Hybrid requires a different top group.');
        return;
      }
      setHybrid({ groupId, leafId });
    },
    [hybridEnabled, primary]
  );

  const clearHybrid = useCallback(() => setHybrid(null), []);

  const toggleHybrid = useCallback(() => {
    setHybridEnabled(h => {
      if (h) setHybrid(null);
      return !h;
    });
  }, []);

  const toSelection = useCallback<() => ComposerSelection>(() => ({
    primary,
    hybrid,
    tags: Array.from(new Set([...(findLeaf(primary)?.tags || []), ...(findLeaf(hybrid)?.tags || [])])).slice(0, 6)
  }), [primary, hybrid, findLeaf]);

  const clearWarning = useCallback(() => setWarning(null), []);

  return {
    search,
    setSearch,
    hybridEnabled,
    toggleHybrid,
    primary,
    hybrid,
    activeLeaf,
    activeGroup,
    pickLeaf,
    pickHybrid,
    clearHybrid,
    toSelection,
    warning,
    clearWarning,
    filteredGroups
  };
}
