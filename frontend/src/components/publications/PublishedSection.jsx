import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Button from '../ui/Button';
import { EffectSelect } from '../editor/EditorTools';
import { toLocalDate } from '../../editor/publishing';
import { publications } from '../../services/publications';
import { requestError } from '../../services/api';
import Modal from './Modal';
import ShareDialog from './ShareDialog';

function PrivacyDialog({ entry, onClose, onSaved }) {
  const [expiry, setExpiry] = useState(toLocalDate(entry.expiresAt));
  const [mode, setMode] = useState('keep');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <Modal title="Edit link privacy" onClose={onClose} busy={busy}>
      <form className="publication-form" onSubmit={async event => {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
          const input = { expiresAt: expiry ? new Date(expiry).toISOString() : null };
          if (mode !== 'keep') input.password = mode === 'remove' ? '' : password;
          onSaved(await publications.privacy(entry.id, input));
        } catch (error) {
          setError(requestError(error));
          setBusy(false);
        }
      }}>
        <p className="studio-note">{entry.protected ? 'A password currently protects this link.' : 'Anyone with this link can open the message.'}</p>
        <label className="studio-field">Expires on (optional)<input type="datetime-local" value={expiry} onChange={event => setExpiry(event.target.value)} /></label>
        <EffectSelect label="Password handling" options={{ keep: 'Keep current setting', replace: 'Set a new password', remove: 'Remove password' }}
          value={mode} onChange={setMode} />
        {mode === 'replace' && <label className="studio-field">New password
          <input type="password" minLength={4} maxLength={72} required value={password} onChange={event => setPassword(event.target.value)} />
        </label>}
        {error && <p className="studio-error" role="alert">{error}</p>}
        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Privacy'}</Button>
      </form>
    </Modal>
  );
}

const confirmation = {
  revoke: ['Revoke link', 'Anyone with this URL will lose access.'],
  unpublish: ['Unpublish message', 'This version will be removed from public access.'],
  delete: ['Delete publication', 'This removes the published copy and its link. Your draft stays in My Drafts.'],
};

export default function PublishedSection() {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    publications.list().then(list => { if (active) setEntries(list); })
      .catch(error => { if (active) setError(requestError(error)); });
    return () => { active = false; };
  }, []);

  function replace(entry) {
    setEntries(list => list.map(item => item.id === entry.id ? entry : item));
    setDialog(null);
    setNotice('Publication settings saved.');
  }

  async function confirm() {
    const { entry, action } = dialog;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (action === 'delete') {
        await publications.remove(entry.id);
        setEntries(list => list.filter(item => item.id !== entry.id));
        setDialog(null);
        setNotice('Publication deleted.');
      } else {
        replace(await publications.close(entry.id, action));
        setNotice(action === 'revoke' ? 'Link revoked.' : 'Message unpublished.');
      }
    } catch (error) {
      setError(requestError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="published-section">
      {notice && <p className="publication-feedback" role="status">{notice}</p>}
      {error && !dialog && <p className="studio-error" role="alert">{error}</p>}
      {!entries && !error && <p role="status">Loading publications…</p>}
      {entries?.length === 0 && <div className="empty-state"><h2>No published messages</h2><p>Open an account draft to publish your first letter.</p></div>}
      <ul className="draft-list">
        {entries?.map(entry => {
          const expired = entry.expiresAt && new Date(entry.expiresAt) <= new Date();
          const live = entry.status === 'active' && !expired;
          const stage = entry.status === 'active' ? expired ? 'Expired' : 'Published' : entry.status === 'revoked' ? 'Revoked' : 'Unpublished';
          return (
            <li className="draft-row publication-row" key={entry.id}>
              <div>
                <h2>{entry.title}</h2>
                <p>{stage} · {entry.views} {entry.views === 1 ? 'open' : 'opens'}{entry.protected ? ' · Password protected' : ''}</p>
                {entry.expiresAt && <p>Expiration {new Date(entry.expiresAt).toLocaleString()}</p>}
              </div>
              <div className="button-row">
                <Button asChild variant="outline"><Link to={'/published-preview/' + entry.id}>Preview</Link></Button>
                {live && <Button onClick={() => setDialog({ action: 'share', entry })}>Share</Button>}
                {entry.status === 'active' && <>
                  <Button variant="outline" onClick={() => setDialog({ action: 'privacy', entry })}>Privacy</Button>
                  <Button variant="outline" onClick={() => { setError(''); setDialog({ action: 'revoke', entry }); }}>Revoke</Button>
                  <Button variant="outline" onClick={() => { setError(''); setDialog({ action: 'unpublish', entry }); }}>Unpublish</Button>
                </>}
                {entry.designId && <Button asChild variant="outline"><Link to={'/editor/' + entry.designId + '?publish=1'}>Publish New Version</Link></Button>}
                <Button variant="outline" onClick={() => { setError(''); setDialog({ action: 'delete', entry }); }}>Delete</Button>
              </div>
            </li>
          );
        })}
      </ul>
      {dialog?.action === 'share' && <ShareDialog publication={dialog.entry} onClose={() => setDialog(null)} />}
      {dialog?.action === 'privacy' && <PrivacyDialog entry={dialog.entry} onSaved={replace} onClose={() => setDialog(null)} />}
      {dialog && confirmation[dialog.action] && <Modal title={confirmation[dialog.action][0]} busy={busy} onClose={() => setDialog(null)}>
        <p>{confirmation[dialog.action][1]}</p>
        {error && <p className="studio-error" role="alert">{error}</p>}
        <div className="button-row publication-confirm">
          <Button variant="outline" disabled={busy} onClick={() => setDialog(null)}>Cancel</Button>
          <Button disabled={busy} onClick={confirm}>{busy ? 'Working…' : confirmation[dialog.action][0]}</Button>
        </div>
      </Modal>}
    </div>
  );
}
