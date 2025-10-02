// Duplicate & integrity validator (CommonJS to avoid ESM loader issues)
require('esbuild-register');
const { universalPack } = require('../src/data/multigenre/universal.ts');
const { GENRE_PACKS } = require('../src/data/multigenre/genres/index.ts');
const { OPTIONS: LEGACY_OPTIONS, GROUPS: LEGACY_GROUPS } = require('../src/data/taxonomy.ts');

function main(){
  const ids = new Set();
  const dup = [];
  const groupSet = new Set();
  const problems = [];

  function add(id, src){ if(ids.has(id)) dup.push(id+' <- '+src); else ids.add(id); }
  function collectGroups(pack){ (pack.groups||[]).forEach(g=> groupSet.add(g.id)); }

  collectGroups(universalPack);
  (LEGACY_GROUPS||[]).forEach(g=> groupSet.add(g.id));
  LEGACY_OPTIONS.forEach(o=> add(o.id,'legacy'));
  universalPack.options.forEach(o=> add(o.id,'universal'));
  GENRE_PACKS.forEach(p=> { collectGroups(p); p.options.forEach(o=> add(o.id,p.id)); });

  function checkOptionGroup(o, src){ if(o.group && !groupSet.has(o.group)) problems.push(`missing-group:${o.group} (option ${o.id} from ${src})`); }
  LEGACY_OPTIONS.forEach(o=> checkOptionGroup(o,'legacy'));
  universalPack.options.forEach(o=> checkOptionGroup(o,'universal'));
  GENRE_PACKS.forEach(p=> p.options.forEach(o=> checkOptionGroup(o,p.id)));

  const allSubMaps = [universalPack.subopts, ...GENRE_PACKS.map(p=> p.subopts||{})];
  allSubMaps.forEach(map=> { if(!map) return; Object.keys(map).forEach(parent=> { if(!ids.has(parent)) problems.push(`orphan-subopts:${parent}`); }); });

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
main();
