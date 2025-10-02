// Simple duplicate id validator.
// NOTE: Source files are TypeScript; use dynamic import via transpile on-the-fly.
require('esbuild-register');
const { universalPack } = require('../src/data/multigenre/universal.ts');
const { GENRE_PACKS } = require('../src/data/multigenre/genres/index.ts');
const { OPTIONS: LEGACY_OPTIONS } = require('../src/data/taxonomy.ts');

function main(){
  const ids = new Set();
  const dup = [];
  function add(id, src){ if(ids.has(id)) dup.push(id+' <- '+src); else ids.add(id); }
  LEGACY_OPTIONS.forEach(o=> add(o.id,'legacy'));
  universalPack.options.forEach(o=> add(o.id,'universal'));
  GENRE_PACKS.forEach(p=> p.options.forEach(o=> add(o.id,p.id)));
  if(dup.length){
    console.error('[validate-taxonomy] Duplicates:', dup.join(', '));
    process.exit(1);
  } else {
    console.log('[validate-taxonomy] OK total', ids.size);
  }
}
main();