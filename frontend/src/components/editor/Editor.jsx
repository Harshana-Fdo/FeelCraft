import { useEffect, useRef, useState } from 'react';
import { Eye, Redo2, Save, Undo2, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useStore } from 'zustand';
import Button from '../ui/Button';
import RecipientDemo from '../landing/RecipientDemo';
import DesignCanvas from './DesignCanvas';
import EditorTools from './EditorTools';
import EditorProperties from './EditorProperties';
import { createEditor } from '../../store/editor';
import { useDraftSaver } from '../../hooks/useDraftSaver';
import { useElementWidth } from '../../hooks/useElementWidth';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuth } from '../../store/auth';
import { useCatalog } from '../../context/Catalog';
import PublishDialog from '../publications/PublishDialog';
import ShareDialog from '../publications/ShareDialog';
import { publications } from '../../services/publications';
import { requestError } from '../../services/api';

const saveLabels = { saved: 'Saved', dirty: 'Unsaved changes', saving: 'Saving…', error: 'Save failed' };

function PreviewCanvas({ design, animate }) {
  const frame = useRef(null);
  const width = useElementWidth(frame);
  return (
    <div ref={frame} className="studio-preview-paper">
      {width > 0 && <DesignCanvas document={design} scale={width / design.canvas.width} animate={animate} />}
    </div>
  );
}

function Preview({ design, title, onClose }) {
  const dialog = useRef(null);
  const [mobile, setMobile] = useState(false);
  const [recipient, setRecipient] = useState(false);
  useEffect(() => {
    const node = dialog.current;
    node.showModal();
    return () => node.close();
  }, []);
  return (
    <dialog ref={dialog} className="studio-preview" aria-label="Design preview" onCancel={event => {
      event.preventDefault();
      onClose();
    }}>
      <div className="studio-preview-bar">
        <h2>{title || 'Untitled design'}</h2>
        <div className="studio-tabs">
          <button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>Desktop</button>
          <button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>Mobile</button>
          <button type="button" aria-pressed={recipient} onClick={() => setRecipient(value => !value)}>{recipient ? 'Show Design' : 'Play Animation'}</button>
          <button type="button" aria-label="Close preview" onClick={onClose}><X size={18} /></button>
        </div>
      </div>
      <div className={mobile ? 'studio-preview-frame studio-preview-phone' : 'studio-preview-frame'}>
        {recipient
          ? <RecipientDemo template={{ category: 'love', document: design }} renderDocument={animate => <PreviewCanvas design={design} animate={animate} />} />
          : <PreviewCanvas design={design} />}
      </div>
    </dialog>
  );
}

export default function Editor({ draft, local, openPreview, openPublish }) {
  const navigate = useNavigate();
  const user = useAuth(state => state.user);
  const { templates } = useCatalog();
  const category = templates.find(item => item.slug === draft.templateSlug)?.category;
  const [store] = useState(() => createEditor(draft));
  const editor = useStore(store);
  const { status, flush } = useDraftSaver(store, draft, local);
  const [preview, setPreview] = useState(openPreview);
  const [publish, setPublish] = useState(openPublish);
  const [share, setShare] = useState(null);
  const [findingLink, setFindingLink] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState('');
  const board = useRef(null);
  const width = useElementWidth(board);
  const { title, document: design } = editor.current;
  const fit = Math.min(width / design.canvas.width, 640 / design.canvas.height, 1);
  usePageTitle(title || 'Untitled design');

  useEffect(() => {
    function shortcut(event) {
      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (modifier && key === 's') {
        event.preventDefault();
        flush();
      }
      if (preview || publish || share || event.target.closest?.('input, textarea, select, [contenteditable]')) return;
      if (modifier && (key === 'z' || key === 'y')) {
        event.preventDefault();
        if (event.shiftKey || key === 'y') store.getState().redo();
        else store.getState().undo();
      }
      if (key === 'delete' || key === 'backspace') {
        const { selected, remove } = store.getState();
        if (selected) { event.preventDefault(); remove(selected); }
      }
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [flush, preview, publish, share, store]);

  function insert(layer) {
    setError(editor.insert(layer) ? '' : 'This design already has the maximum of 80 layers.');
  }

  async function findLink() {
    setFindingLink(true);
    setError('');
    try {
      const entries = await publications.list(draft.id);
      const entry = entries.find(item => item.status === 'active' && (!item.expiresAt || new Date(item.expiresAt) > new Date()));
      if (entry) setShare(entry);
      else setPublish(true);
    } catch (error) {
      setError(requestError(error));
    } finally {
      setFindingLink(false);
    }
  }

  return (
    <main className="studio">
      <header className="studio-toolbar">
        <div className="studio-title">
          <Button variant="outline" onClick={async () => { if (await flush()) navigate(local ? '/dashboard?storage=local' : '/dashboard'); }}>My Drafts</Button>
          <label className="sr-only" htmlFor="draft-title">Design name</label>
          <input id="draft-title" value={title} maxLength={100} placeholder="Untitled design"
            onChange={event => editor.commit(current => ({ ...current, title: event.target.value }))} />
        </div>
        <div className="studio-toolbar-actions">
          <div className="studio-icon-row">
            <button type="button" aria-label="Undo" title="Undo" disabled={!editor.past.length} onClick={editor.undo}><Undo2 size={18} /></button>
            <button type="button" aria-label="Redo" title="Redo" disabled={!editor.future.length} onClick={editor.redo}><Redo2 size={18} /></button>
          </div>
          <span role="status" aria-label="Save status" className="studio-save-status">{local ? 'Local draft' : 'Account draft'} · {saveLabels[status.phase]}</span>
          {local && <Button variant="outline" onClick={async () => {
            if (await flush()) navigate((user ? '/dashboard' : '/login') + '?' + new URLSearchParams({ draft: draft.id }));
          }}>Save to Account</Button>}
          <Button variant="outline" onClick={() => setPreview(true)}><Eye size={17} aria-hidden="true" /> Preview</Button>
          <Button onClick={flush} disabled={status.phase === 'saving'}><Save size={17} aria-hidden="true" /> Save</Button>
          {!local && <Button variant="outline" onClick={findLink} disabled={findingLink}>{findingLink ? 'Finding link…' : 'Share'}</Button>}
          {!local && <Button onClick={() => setPublish(true)}>Publish</Button>}
        </div>
      </header>
      {(status.message || error) && <p className="studio-error studio-banner" role="alert">{status.message || error}</p>}
      <div className="studio-grid">
        <EditorTools editor={editor} design={design} onInsert={insert} />
        <section className="studio-board" aria-label="Workspace">
          <div className="studio-board-toolbar">
            <span>{design.canvas.width} × {design.canvas.height}</span>
            <label>Zoom <input type="range" min="40" max="180" step="5" value={zoom} onChange={event => setZoom(Number(event.target.value))} /></label>
            <button className="text-link" type="button" onClick={() => setZoom(100)}>Fit</button>
            <output aria-label="Zoom level">{zoom}%</output>
          </div>
          <div className="studio-board-scroll">
            <div className="studio-board-inner" ref={board}>
              {fit > 0 && <div className="studio-canvas"><DesignCanvas document={design} scale={fit * zoom / 100}
                selected={editor.selected} onSelect={editor.select} onUpdate={editor.updateLayer} /></div>}
            </div>
          </div>
        </section>
        <EditorProperties editor={editor} document={design} selected={editor.selected} insert={insert} />
      </div>
      {preview && <Preview design={design} title={title} onClose={() => setPreview(false)} />}
      {publish && user && <PublishDialog draft={draft} design={design} title={title} user={user} category={category}
        flush={flush} onClose={() => setPublish(false)} onPublish={entry => { setPublish(false); setShare(entry); }} />}
      {share && <ShareDialog publication={share} onClose={() => setShare(null)} />}
    </main>
  );
}
