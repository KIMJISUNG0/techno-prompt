import { GenrePack, UniversalPack, MergedSchema, MergeOptions } from './schema';

const DEFAULT_OPTS: MergeOptions = { onDuplicateOption: 'warn', onDuplicateGroup: 'warn' };

export function mergePacks(universal: UniversalPack, genre: GenrePack, opts: MergeOptions = {}): MergedSchema {
  const cfg = { ...DEFAULT_OPTS, ...opts };
  const groupMap = new Map<string, any>();
  const optionMap = new Map<string, any>();
  const subopts: Record<string, any[]> = {};
  const order: string[] = [];

  function addGroup(g: any, source: 'universal' | 'genre') {
    if (groupMap.has(g.id)) {
      if (cfg.onDuplicateGroup === 'error') throw new Error('Duplicate group '+g.id);
      if (cfg.onDuplicateGroup === 'warn') console.warn('[merge] duplicate group', g.id,'from',source,'overriding');
    }
    groupMap.set(g.id, { ...g, universal: source==='universal' });
  }
  function addOption(o: any, source:'universal'|'genre') {
    if (optionMap.has(o.id)) {
      if (cfg.onDuplicateOption === 'error') throw new Error('Duplicate option '+o.id);
      if (cfg.onDuplicateOption === 'warn') console.warn('[merge] duplicate option', o.id,'from',source,'overriding');
    }
    optionMap.set(o.id, o);
  }

  // universal first
  for (const g of universal.groups) addGroup(g,'universal');
  for (const o of universal.options) addOption(o,'universal');
  Object.assign(subopts, universal.subopts);

  // genre
  if (genre.inheritsUniversal !== false) {
    for (const g of genre.groups) addGroup(g,'genre');
    for (const o of genre.options) addOption(o,'genre');
    if (genre.subopts) {
      for (const k of Object.keys(genre.subopts)) {
        subopts[k] = genre.subopts[k];
      }
    }
  }

  // build order: universal order first (in given array order), then insert / override
  const universalOrder = universal.groups.map(g=>g.id);
  const genreExtras = genre.groups.map(g=>g.id).filter(id=> !universalOrder.includes(id));
  const combined = [...universalOrder, ...genreExtras];

  // apply insertAfter / insertBefore
  function placeWithMeta(list: string[]): string[] {
    let arr = [...list];
    for (const g of groupMap.values()) {
      if (g.insertAfter || g.insertBefore) {
        arr = arr.filter(x=> x!==g.id);
        if (g.insertAfter) {
          const idx = arr.indexOf(g.insertAfter);
          if (idx >=0) arr.splice(idx+1,0,g.id); else arr.push(g.id);
        } else if (g.insertBefore) {
          const idx = arr.indexOf(g.insertBefore);
          if (idx >=0) arr.splice(idx,0,g.id); else arr.unshift(g.id);
        }
      }
    }
    return arr;
  }
  const finalOrder = placeWithMeta(combined).filter(id=> groupMap.has(id));
  for (const id of finalOrder) order.push(id);

  return {
    groups: [...groupMap.values()],
    options: [...optionMap.values()],
    subopts,
    order,
  };
}

// Merge multiple genre packs (hybrid). Order of packs influences overriding priority.
export function mergeMultiple(universal: UniversalPack, genres: GenrePack[], opts: MergeOptions = {}): MergedSchema {
  if (genres.length===0) throw new Error('mergeMultiple requires at least one genre pack');
  // Start with universal baseline
  const base = mergePacks(universal, genres[0], opts);
  // Mutation-friendly structures from base
  const groupMap = new Map(base.groups.map(g=> [g.id,g]));
  const optionMap = new Map(base.options.map(o=> [o.id,o]));
  const subopts: Record<string, any[]> = { ...base.subopts };
  const universalOrder = base.groups.filter(g=> g.universal).map(g=> g.id);
  const extraOrder: string[] = base.groups.filter(g=> !g.universal).map(g=> g.id).filter(id=> !universalOrder.includes(id));

  for (let i=1;i<genres.length;i++) {
    const pack = genres[i];
    for (const g of pack.groups) {
      if (!groupMap.has(g.id)) extraOrder.push(g.id);
      groupMap.set(g.id, { ...g, universal:false });
    }
    for (const o of pack.options) optionMap.set(o.id, o);
    if (pack.subopts) Object.assign(subopts, pack.subopts);
  }

  const order = [...universalOrder, ...extraOrder.filter((v,i,a)=> a.indexOf(v)===i)];
  return {
    groups: [...groupMap.values()],
    options: [...optionMap.values()],
    subopts,
    order,
  };
}
