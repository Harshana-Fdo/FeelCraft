import { api, payload } from './api';

let database;
function openDrafts() {
  if (!database) {
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open('feelcraft-local-v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }).catch(error => { database = undefined; throw error; });
  }
  return database;
}

async function withDrafts(mode, operation) {
  const db = await openDrafts();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('drafts', mode);
    let result;
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(transaction.error || new Error('Local draft could not be saved.'));
    operation(transaction.objectStore('drafts'), value => { result = value; });
  });
}

function localCreate(draft) {
  const record = { ...draft, id: crypto.randomUUID(), revision: 1, updatedAt: new Date().toISOString() };
  return withDrafts('readwrite', (store, set) => {
    store.add(record);
    set(record);
  });
}

const local = {
  list: async () => (await withDrafts('readonly', (store, set) => {
    const request = store.getAll();
    request.onsuccess = () => set(request.result);
  })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  get: async id => {
    const record = await withDrafts('readonly', (store, set) => {
      const request = store.get(id);
      request.onsuccess = () => set(request.result);
    });
    if (!record) throw new Error('Draft not found.');
    return record;
  },
  create: localCreate,
  async save(id, data) {
    const result = await withDrafts('readwrite', (store, set) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const draft = request.result;
        if (!draft || draft.revision !== data.revision) return;
        const next = { ...draft, ...data, revision: draft.revision + 1, updatedAt: new Date().toISOString() };
        store.put(next);
        set(next);
      };
    });
    if (!result) throw new Error('This draft changed or was deleted in another tab. Reopen it before saving.');
    return result;
  },
  async duplicate(id) {
    const draft = await local.get(id);
    return localCreate({ ...draft, title: draft.title.slice(0, 93) + ' (copy)' });
  },
  remove: id => withDrafts('readwrite', store => store.delete(id)),
};

const account = {
  list: () => api.get('/designs').then(payload),
  get: id => api.get('/designs/' + id).then(payload),
  create: draft => api.post('/designs', draft).then(payload),
  save: (id, draft) => api.put('/designs/' + id, draft).then(payload),
  duplicate: id => api.post('/designs/' + id + '/duplicate').then(payload),
  remove: id => api.delete('/designs/' + id).then(payload),
};

export function draftStorage(isLocal) {
  return isLocal ? local : account;
}

export function draftUrl(id, isLocal) {
  return '/editor/' + (isLocal ? 'local/' : '') + id;
}
