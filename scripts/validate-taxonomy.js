// Simple duplicate id validator (ESM compatible). TS sources are compiled by ts-node during build, but for runtime here we rely on native ESM import of .ts via Node's loader resolution in the workspace context (Vite env). If that fails in some environments, consider emitting a JS build of data first.
async function main(){
  const { universalPack } = await import('../src/data/multigenre/universal.ts');
  const { GENRE_PACKS } = await import('../src/data/multigenre/genres/index.ts');
  const { OPTIONS: LEGACY_OPTIONS, GROUPS: LEGACY_GROUPS } = await import('../src/data/taxonomy.ts');
  const ids = new Set();
  const dup = [];
  const groupSet = new Set();
  const problems = [];

  function add(id, src){ if(ids.has(id)) dup.push(id+' <- '+src); else ids.add(id); }
  function collectGroups(pack, label){ (pack.groups||[]).forEach(g=> groupSet.add(g.id)); }

  collectGroups(universalPack,'universal');
  // legacy group meta 추가
  (LEGACY_GROUPS||[]).forEach(g=> groupSet.add(g.id));
  LEGACY_OPTIONS.forEach(o=> add(o.id,'legacy'));
  universalPack.options.forEach(o=> add(o.id,'universal'));
  GENRE_PACKS.forEach(p=> { collectGroups(p,p.id); p.options.forEach(o=> add(o.id,p.id)); });

  // Group 존재 검사 (universal + 각 pack group 에 포함되지 않은 option.group 찾기)
  function checkOptionGroup(o, src){ if(o.group && !groupSet.has(o.group)) problems.push(`missing-group:${o.group} (option ${o.id} from ${src})`); }
  LEGACY_OPTIONS.forEach(o=> checkOptionGroup(o,'legacy'));
  universalPack.options.forEach(o=> checkOptionGroup(o,'universal'));
  GENRE_PACKS.forEach(p=> p.options.forEach(o=> checkOptionGroup(o,p.id)));

  // Subopts orphan 검사
  const allSubMaps = [universalPack.subopts, ...GENRE_PACKS.map(p=> p.subopts||{})];
  allSubMaps.forEach(map=> {
    if(!map) return;
    Object.keys(map).forEach(parent=> { if(!ids.has(parent)) problems.push(`orphan-subopts:${parent}`); });
  });

  // Prefix 규칙 (선택): universal 은 'univ-' 로 시작해야 함
  universalPack.options.forEach(o=> { if(!o.id.startsWith('univ-')) problems.push(`prefix:universal ${o.id}`); });

  if(dup.length) problems.unshift('duplicates:'+dup.join('|'));

  if(problems.length){
    console.error('[validate-taxonomy] FAIL');
    problems.forEach(p=> console.error(' -',p));
    process.exit(1);
  } else {
    console.log('[validate-taxonomy] OK total', ids.size, 'groups', groupSet.size);
  }
}
main().catch(e=> { console.error('[validate-taxonomy] exception', e); process.exit(1); });