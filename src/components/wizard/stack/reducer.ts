import { Action, StackState, LayerBase } from './types';
import { nanoid } from './util';

export function initialState(): StackState {
  return {
    stepIndex: 0,
    steps: ['kick','hat','snare','bass','chords','lead','fx','groove','mix','master','review'],
    layers: [],
    meta: { bpm:128, meter:'4/4' }
  };
}

export function reducer(state:StackState, action:Action): StackState {
  switch(action.type){
    case 'next':
      return { ...state, stepIndex: Math.min(state.steps.length-1, state.stepIndex+1) };
    case 'prev':
      return { ...state, stepIndex: Math.max(0, state.stepIndex-1) };
    case 'goto':
      return { ...state, stepIndex: Math.min(state.steps.length-1, Math.max(0, action.index)) };
    case 'setMeta':
      return { ...state, meta: { ...state.meta, ...action.patch } };
    case 'startDraft': {
      const draft: LayerBase = { id: nanoid(), role: action.role, descriptors: [] };
      return { ...state, draft };
    }
    case 'updateDraft':
      if(!state.draft) return state;
      return { ...state, draft: { ...state.draft, ...action.patch } };
    case 'commitDraft':
      if(!state.draft) return state;
      return { ...state, layers:[...state.layers, state.draft], draft: undefined };
    case 'discardDraft':
      return { ...state, draft: undefined };
    case 'updateLayer':
      return { ...state, layers: state.layers.map(l=> l.id===action.id ? { ...l, ...action.patch } : l) };
    default:
      return state;
  }
}
