import { PROG_CATEGORIES, ProgressiveSelections } from './progressiveCategories';

export interface AbstractHintResult {
  unmetMinimum: string[];          // categories below min
  overMax: string[];               // categories exceeding max
  diversityWarnings: string[];     // categories with repeated semantic group words
  nextCategoryPriority: string[];  // recommended next categories (ids)
  tokenSuggestions: string[];      // textual suggestions for new tokens
}

export function analyzeAbstract(sel: ProgressiveSelections, currentId: string): AbstractHintResult {
  const unmetMinimum: string[] = [];
  const overMax: string[] = [];
  const diversityWarnings: string[] = [];
  const nextCategoryPriority: string[] = [];
  const tokenSuggestions: string[] = [];

  for (const cat of PROG_CATEGORIES) {
    const picked = sel[cat.id] || [];
    if (cat.min && picked.length < cat.min && cat.id !== currentId) unmetMinimum.push(cat.id);
    if (cat.max && picked.length > cat.max) overMax.push(cat.id);
    if (picked.length > 1) {
      const roots = picked.map(p=> p.split('-')[0]);
      const uniqueRoots = new Set(roots);
      if (uniqueRoots.size / roots.length < 0.6) diversityWarnings.push(cat.id);
    }
  }

  // Next category priority: first unmet min after current step
  const currentIndex = PROG_CATEGORIES.findIndex(c=> c.id===currentId);
  for (let i=currentIndex+1;i<PROG_CATEGORIES.length;i++) {
    const cat = PROG_CATEGORIES[i];
    const picked = sel[cat.id]||[];
    if (cat.min && picked.length < cat.min) { nextCategoryPriority.push(cat.id); break; }
  }
  // Fallback: suggest final mood if everything else satisfied
  if (!nextCategoryPriority.length && !sel.mood) nextCategoryPriority.push('mood');

  // Token suggestions: look at categories missing min and propose first 2 not yet picked
  for (const id of unmetMinimum.slice(0,3)) {
    const cat = PROG_CATEGORIES.find(c=> c.id===id);
    if (!cat) continue;
    const remaining = cat.tokens.map(t=> t.id).filter(id2=> !(sel[id]||[]).includes(id2)).slice(0,2);
    remaining.forEach(r=> tokenSuggestions.push(`${id}:${r}`));
  }

  return { unmetMinimum, overMax, diversityWarnings, nextCategoryPriority, tokenSuggestions };
}
