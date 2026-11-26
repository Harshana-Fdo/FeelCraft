import { createContext, useContext, useEffect, useState } from 'react';
import { categories, templates } from '../constants/catalog';
import { api, payload } from '../services/api';

const offline = { categories, templates, source: 'fallback' };
const Catalog = createContext(offline);

export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState({ ...offline, source: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    Promise.all([api.get('/categories', options), api.get('/templates', options)])
      .then(([categoryResult, templateResult]) => setCatalog({
        categories: payload(categoryResult), templates: payload(templateResult), source: 'database',
      }))
      .catch(() => { if (!controller.signal.aborted) setCatalog(offline); });
    return () => controller.abort();
  }, []);
  return <Catalog.Provider value={catalog}>{children}</Catalog.Provider>;
}

export function useCatalog() {
  return useContext(Catalog);
}
