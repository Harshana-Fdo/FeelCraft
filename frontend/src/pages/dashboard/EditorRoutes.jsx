import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useCatalog } from '../../context/Catalog';
import { draftStorage, draftUrl } from '../../services/drafts';
import { requestError } from '../../services/api';
import { useAuth } from '../../store/auth';
import { newDraft } from '../../editor/document';
import Editor from '../../components/editor/Editor';

function EditorStatus({ error, children }) {
  return (
    <main className="shell interior studio-status">
      {error ? <p className="studio-error" role="alert">{error}</p> : <p role="status">Opening your workspace…</p>}
      {children}
      <Link className="text-link" to="/dashboard">My Drafts</Link>
    </main>
  );
}

export function CreateDraft() {
  const [params] = useSearchParams();
  const { templates, source } = useCatalog();
  const { user, status } = useAuth();
  const navigate = useNavigate();
  const pending = useRef(null);
  const [failure, setFailure] = useState(null);
  const slug = params.get('template');
  const template = templates.find(item => item.slug === slug);
  const local = !user || params.get('storage') === 'local';
  const key = (local ? 'local' : user.id) + ':' + slug;
  const ready = status !== 'checking' && (!slug || source !== 'loading');

  useEffect(() => {
    if (!ready || (slug && !template)) return;
    if (pending.current?.key !== key) {
      pending.current = { key, request: draftStorage(local).create(newDraft(template)) };
    }
    let active = true;
    pending.current.request
      .then(draft => { if (active) navigate(draftUrl(draft.id, local), { replace: true }); })
      .catch(error => { if (active) setFailure({ key, message: requestError(error) }); });
    return () => { active = false; };
  }, [key, local, navigate, ready, slug, template]);

  const error = ready && slug && !template ? 'Template not found.' : failure?.key === key ? failure.message : '';
  const localParams = new URLSearchParams(params);
  localParams.set('storage', 'local');
  return <EditorStatus error={error}>{error && !local && <Link className="text-link" to={'/editor/new?' + localParams}>Create a local draft instead</Link>}</EditorStatus>;
}

function LoadDraft({ id, local, openPreview, openPublish }) {
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    draftStorage(local).get(id)
      .then(draft => { if (active) setDraft(draft); })
      .catch(error => { if (active) setError(requestError(error)); });
    return () => { active = false; };
  }, [id, local]);
  return draft ? <Editor draft={draft} local={local} openPreview={openPreview} openPublish={openPublish} /> : <EditorStatus error={error} />;
}

export function OpenEditor({ local = false }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user, status } = useAuth();
  if (!local && status === 'checking') return <EditorStatus />;
  if (!local && !user) return <EditorStatus error="Sign in to open this account draft."><Link className="text-link" to="/login">Sign in</Link></EditorStatus>;
  return <LoadDraft key={id} id={id} local={local} openPreview={params.has('preview')} openPublish={!local && params.has('publish')} />;
}
