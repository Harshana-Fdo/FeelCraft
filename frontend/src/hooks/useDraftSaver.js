import { useCallback, useEffect, useRef, useState } from 'react';
import { draftStorage } from '../services/drafts';
import { requestError } from '../services/api';

export function useDraftSaver(editor, draft, local) {
  const revision = useRef(draft.revision);
  const saved = useRef(editor.getState().current);
  const inFlight = useRef(null);
  const [status, setStatus] = useState({ phase: 'saved', message: '' });

  const save = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    const current = editor.getState().current;
    if (current === saved.current) return Promise.resolve(true);
    setStatus({ phase: 'saving', message: '' });
    inFlight.current = draftStorage(local).save(draft.id, {
      ...current, title: current.title.trim() || 'Untitled design', revision: revision.current,
    }).then(result => {
      revision.current = result.revision;
      saved.current = current;
      setStatus({ phase: editor.getState().current === saved.current ? 'saved' : 'dirty', message: '' });
      return true;
    }).catch(error => {
      setStatus({ phase: 'error', message: requestError(error) });
      return false;
    }).finally(() => { inFlight.current = null; });
    return inFlight.current;
  }, [draft.id, editor, local]);

  const flush = useCallback(async () => {
    do {
      if (!(await save())) return false;
    } while (editor.getState().current !== saved.current);
    return true;
  }, [editor, save]);

  const current = useRef(editor.getState().current);
  useEffect(() => editor.subscribe(state => {
    if (state.current === current.current) return;
    current.current = state.current;
    if (!inFlight.current) setStatus({ phase: current.current === saved.current ? 'saved' : 'dirty', message: '' });
  }), [editor]);

  useEffect(() => {
    if (status.phase !== 'dirty') return;
    let timer = setTimeout(save, 650);
    const unsubscribe = editor.subscribe((next, previous) => {
      if (next.current === previous.current) return;
      clearTimeout(timer);
      timer = setTimeout(save, 650);
    });
    return () => { unsubscribe(); clearTimeout(timer); };
  }, [editor, save, status.phase]);

  useEffect(() => {
    function warn(event) {
      if (editor.getState().current === saved.current) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [editor]);

  return { status, flush };
}
