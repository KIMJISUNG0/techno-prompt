// Multi-genre schema definitions
export type GenreId = 'techno' | 'house' | 'trance' | 'dnb' | 'hiphop' | 'ambient' | string;

export interface GroupMeta {
  id: string;
  label: string;
  multi: boolean;
  insertAfter?: string;
  insertBefore?: string;
  universal?: boolean; // true if from universal pack
}

export interface SubOpt { id: string; label: string; prompt: string }

export interface Opt {
  id: string;
  label: string;
  prompt: string;
  group: string;             // group id reference
  family?: string;
  primary?: boolean;
  genres?: GenreId[];        // restrict universal option to specific genres
  weight?: number;           // sorting weight
  tags?: string[];           // arbitrary descriptors
}

export interface UniversalPack {
  groups: GroupMeta[];
  options: Opt[];
  subopts: Record<string, SubOpt[]>;
}

export interface GenrePack {
  id: GenreId;
  label: string;
  description?: string;
  orderWeight: number;
  groups: GroupMeta[]; // genre specific groups (not universal)
  options: Opt[];      // genre specific options
  subopts?: Record<string, SubOpt[]>;
  tags?: string[];
  inheritsUniversal?: boolean;
}

export interface MergedSchema {
  groups: GroupMeta[];
  options: Opt[];
  subopts: Record<string, SubOpt[]>;
  order: string[]; // final order of group ids
}

export interface MergeOptions {
  onDuplicateOption?: 'warn' | 'override' | 'error';
  onDuplicateGroup?: 'warn' | 'override' | 'error';
}
