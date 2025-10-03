import { DraftStructure, RoleToken } from './sectionDsl';

export interface ExpertHintResult {
  missingRoles: RoleToken[];          // roles never used across sections
  underusedHighEnergy: string[];      // section ids with high energy but few role descriptors
  energyImbalance: string;            // summary string about energy curve shape
  descriptorRepetition: { token: string; count: number }[]; // top repeating adjectives
  suggestions: string[];              // human-readable suggestions
}

const ALL_ROLES: RoleToken[] = ['kick','bass','hats','snare','perc','pad','lead','atmos','fx'];

export function analyzeDraftForExpert(draft: DraftStructure): ExpertHintResult {
  const rolePresence = new Map<RoleToken, number>();
  ALL_ROLES.forEach(r=> rolePresence.set(r,0));
  const highEnergySparse: string[] = [];
  const energySeq = draft.sections.map(s=> s.energy);
  const words: string[] = [];

  draft.sections.forEach(sec => {
    const roleCount = Object.keys(sec.roles).length;
    if (sec.energy >=4 && roleCount <=4) highEnergySparse.push(sec.id);
    (Object.entries(sec.roles) as [RoleToken,string][]).forEach(([role, desc]) => {
      rolePresence.set(role, (rolePresence.get(role)||0)+1);
      desc.split(/[^a-zA-Z]+/).map(w=> w.toLowerCase()).filter(w=> w.length>3).forEach(w=> words.push(w));
    });
  });

  const missingRoles = ALL_ROLES.filter(r=> (rolePresence.get(r)||0)===0);
  // Energy imbalance heuristic: compute variance vs monotonic expectation (intro->build->drop...)
  const diffs = energySeq.slice(1).map((e,i)=> e - energySeq[i]);
  const volatility = diffs.reduce((a,b)=> a+Math.abs(b),0) / Math.max(1,diffs.length);
  const energyImbalance = volatility > 1.8 ? 'Highly volatile energy curve' : volatility < 0.6 ? 'Very flat energy progression' : 'Balanced energy transitions';

  const freq = new Map<string, number>();
  words.forEach(w=> freq.set(w,(freq.get(w)||0)+1));
  const repetition = [...freq.entries()].filter(([,c])=> c>2).sort((a,b)=> b[1]-a[1]).slice(0,6).map(([token,count])=> ({ token, count }));

  const suggestions: string[] = [];
  if (missingRoles.length) suggestions.push(`Consider adding descriptors for: ${missingRoles.join(', ')}`);
  if (highEnergySparse.length) suggestions.push(`High-energy sections with sparse layering: ${highEnergySparse.join(', ')} (add lead/perc/fx variations)`);
  if (repetition.length) suggestions.push('Reduce adjective repetition: ' + repetition.map(r=> `${r.token}(${r.count})`).join(', '));
  if (energyImbalance.includes('flat')) suggestions.push('Raise contrast: increase build/drop energy or reduce break energy');
  if (energyImbalance.includes('volatile')) suggestions.push('Smooth transitions: adjust adjacent section energy by +/-1');

  return { missingRoles, underusedHighEnergy: highEnergySparse, energyImbalance, descriptorRepetition: repetition, suggestions };
}
