import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import Button from '../../components/ui/Button';
import PageIntro from '../../components/common/PageIntro';
import { draftStorage, draftUrl } from '../../services/drafts';
import { requestError } from '../../services/api';
import { useAuth } from '../../store/auth';
import PublishedSection from '../../components/publications/PublishedSection';

function LocalDraftCopy({ id, user }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function copy() {
    setBusy(true);
    setError('');
    try {
      const { title, templateSlug, document } = await draftStorage(true).get(id);
      const draft = await draftStorage(false).create({ title, templateSlug, document });
      navigate(draftUrl(draft.id, false));
    } catch (error) {
      setError(requestError(error));
      setBusy(false);
    }
  }

  return (
    <section className="draft-row account-copy" aria-label="Save local draft">
      <div><h2>Save a copy to your account</h2>
        <p>Your original draft will stay in this browser.</p>
        {error && <p className="studio-error" role="alert">{error}</p>}
      </div>
      {user ? <Button disabled={busy} onClick={copy}>{busy ? 'Saving…' : 'Save Draft to Account'}</Button> :
        <Button asChild><Link to={'/login?' + new URLSearchParams({ draft: id })}>Sign In to Save</Link></Button>}
    </section>
  );
}

function DraftList({ local }) {
  const storage = draftStorage(local);
  const [drafts, setDrafts] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    storage.list().then(rows => { if (active) setDrafts(rows); })
      .catch(error => { if (active) setError(requestError(error)); });
    return () => { active = false; };
  }, [storage]);

  async function update(action) {
    setBusy(true);
    setError('');
    try {
      await action();
      setDrafts(await storage.list());
    } catch (error) {
      setError(requestError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error && <p className="studio-error" role="alert">{error}</p>}
      {!drafts && !error && <p>Loading drafts…</p>}
      {drafts?.length === 0 && <div className="empty-state"><h2>No drafts yet</h2><p>Choose a template or create a blank design to get started.</p></div>}
      <ul className="draft-list">
        {drafts?.map(draft => (
          <li key={draft.id} className="draft-row">
            <div><h2>{draft.title}</h2><p>Updated {new Date(draft.updatedAt).toLocaleString()}</p></div>
            <div className="button-row">
              <Button asChild><Link to={draftUrl(draft.id, local)}>Edit</Link></Button>
              <Button asChild variant="outline"><Link to={draftUrl(draft.id, local) + '?preview=1'}>Preview</Link></Button>
              {local && <Button asChild variant="outline"><Link to={'/dashboard?' + new URLSearchParams({ draft: draft.id })}>Save to Account</Link></Button>}
              <Button variant="outline" disabled={busy} onClick={() => update(() => storage.duplicate(draft.id))}>Duplicate</Button>
              <Button variant="outline" disabled={busy} onClick={() => {
                if (window.confirm('Delete “' + draft.title + '”?')) update(() => storage.remove(draft.id));
              }}>Delete</Button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function Dashboard() {
  const [params] = useSearchParams();
  const { status, user, signOut } = useAuth();
  const [error, setError] = useState('');
  const local = !user || params.get('storage') === 'local';
  const published = user && params.get('tab') === 'published';
  const pendingDraft = params.get('draft');
  return (
    <section className="shell interior">
      <PageIntro title={published ? 'Published Messages' : 'My Drafts'}>{published ? 'Manage and share the letters you have published.' : local ? 'Local drafts are saved in this browser on this device.' : 'Your account drafts are saved to FeelCraft.'}</PageIntro>
      <div className="catalog-actions">
        <Button asChild><Link to={'/editor/new' + (local ? '?storage=local' : '')}>Start From Scratch</Link></Button>
        <Button asChild variant="outline"><Link to="/create">Choose a Template</Link></Button>
        {user && <Link className="text-link" to={local ? '/dashboard' : '/dashboard?storage=local'}>{local ? 'Account drafts' : 'Local drafts'}</Link>}
        {user && <Link className="text-link" to={published ? '/dashboard' : '/dashboard?tab=published'}>{published ? 'Back to My Drafts' : 'Published Messages'}</Link>}
        {user
          ? <button type="button" className="text-link" onClick={() => signOut().catch(error => setError(requestError(error)))}>Sign out</button>
          : <Link className="text-link" to="/login">Sign in</Link>}
      </div>
      {error && <p className="studio-error" role="alert">{error}</p>}
      {pendingDraft && status === 'ready' && <LocalDraftCopy key={pendingDraft} id={pendingDraft} user={user} />}
      {status === 'checking' ? <p>Checking your session…</p> : published ? <PublishedSection /> : <DraftList key={local ? 'local' : user.id} local={local} />}
    </section>
  );
}
