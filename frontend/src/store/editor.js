import { createStore } from 'zustand/vanilla';

export function createEditor(draft) {
  return createStore((set, get) => ({
    current: { title: draft.title, document: draft.document },
    selected: null,
    past: [],
    future: [],
    select: selected => set({ selected }),
    commit(change) {
      const { current, past } = get();
      const next = change(current);
      if (current === next) return;
      set({ current: next, past: [...past.slice(-39), current], future: [] });
    },
    edit(change) {
      get().commit(current => ({ ...current, document: change(current.document) }));
    },
    updateLayer(id, properties) {
      get().edit(document => ({
        ...document, elements: document.elements.map(layer => layer.id === id ? { ...layer, ...properties } : layer),
      }));
    },
    insert(layer) {
      if (get().current.document.elements.length >= 80) return false;
      get().edit(document => ({ ...document, elements: [...document.elements, layer] }));
      set({ selected: layer.id });
      return true;
    },
    remove(id) {
      get().edit(document => ({ ...document, elements: document.elements.filter(layer => layer.id !== id) }));
      set({ selected: null });
    },
    move(id, delta) {
      const elements = [...get().current.document.elements];
      const source = elements.findIndex(layer => layer.id === id);
      const destination = source + delta;
      if (source < 0 || destination < 0 || destination >= elements.length) return;
      [elements[source], elements[destination]] = [elements[destination], elements[source]];
      get().edit(document => ({ ...document, elements }));
    },
    undo() {
      const { current, past, future } = get();
      if (past.length) set({ current: past.at(-1), past: past.slice(0, -1), future: [current, ...future] });
    },
    redo() {
      const { current, past, future } = get();
      if (future.length) set({ current: future[0], past: [...past, current], future: future.slice(1) });
    },
  }));
}
