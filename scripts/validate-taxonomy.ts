import { universalPack } from '../src/data/multigenre/universal';
import { GENRE_PACKS } from '../src/data/multigenre/genres';
import { OPTIONS as LEGACY_OPTIONS } from '../src/data/taxonomy';

function main(){
  const ids = new Set<string>();
  const dup: string[] = [];
  function add(id:string, src:string){ if(ids.has(id)) dup.push(`${id} <- ${src}`); else ids.add(id); }
  for(const o of LEGACY_OPTIONS) add(o.id,'legacy');
  for(const o of universalPack.options) add(o.id,'universal');
  for(const p of GENRE_PACKS) for(const o of p.options) add(o.id,p.id);
  if(dup.length){ console.error('[validate-taxonomy] Duplicates:', dup.join(', ')); process.exit(1);} else { console.log('[validate-taxonomy] OK total', ids.size); }
}
main();