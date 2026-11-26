import { useEffect, useRef, useState } from 'react';
import { Flag, LockKeyhole } from 'lucide-react';
import { useParams } from 'react-router';
import Button from '../../components/ui/Button';
import Modal from '../../components/publications/Modal';
import RecipientExperience from '../../components/publications/RecipientExperience';
import { messages, publications } from '../../services/publications';
import { requestError } from '../../services/api';

const errors = {
  missing: 'This message is unavailable',
  expired: 'This link has expired',
  revoked: 'This link was revoked',
  unpublished: 'This message was unpublished',
  unavailable: 'This message is temporarily unavailable',
};

function PrivacyMeta() {
  useEffect(() => {
    const tags = Object.entries({ robots: 'noindex, nofollow, noarchive', referrer: 'no-referrer' }).map(([name, content]) => {
      const node = document.createElement('meta');
      node.name = name;
      node.content = content;
      document.head.append(node);
      return node;
    });
    return () => tags.forEach(node => node.remove());
  }, []);
  return null;
}

function Report({ onClose, submit, onReported }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Modal title="Report this message" onClose={onClose} busy={busy}>
      <form onSubmit={async event => {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
          await submit(Object.fromEntries(new FormData(event.currentTarget)));
          onReported();
        } catch (error) {
          setError(requestError(error));
          setBusy(false);
        }
      }}>
        <label className="studio-field">Reason
          <select name="reason" required defaultValue="">
            <option value="" disabled>Choose a reason</option>
            <option value="harassment">Harassment</option>
            <option value="threat">Threats or intimidation</option>
            <option value="impersonation">Impersonation</option>
            <option value="other">Other inappropriate content</option>
          </select>
        </label>
        <label className="studio-field">Additional details (optional)<textarea name="details" rows={3} maxLength={500} /></label>
        {error && <p role="alert" className="studio-error">{error}</p>}
        <Button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send Report'}</Button>
      </form>
    </Modal>
  );
}

function RecipientPage({ token, ownerId }) {
  const [state, setState] = useState({ kind: 'loading' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const viewed = useRef(false);
  const controller = useRef(null);

  // Keep the browser tab and social previews free of private message content.
  useEffect(() => {
    document.title = 'A FeelCraft message';
    const pending = new AbortController();
    controller.current = pending;
    const request = ownerId ? publications.preview(ownerId).then(message => ({ message })) : messages.get(token, pending.signal);
    request.then(result => { if (!pending.signal.aborted) setState({ kind: 'ready', ...result }); })
      .catch(error => {
        if (!pending.signal.aborted) {
          setState({ kind: error.response?.data?.code || (error.response?.status === 404 ? 'missing' : 'unavailable') });
        }
      });
    return () => pending.abort();
  }, [ownerId, token]);

  async function unlock(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const password = new FormData(event.currentTarget).get('password');
    try {
      const result = await messages.unlock(token, password);
      if (!controller.current?.signal.aborted) setState({ kind: 'ready', ...result });
    } catch (error) {
      const code = error.response?.data?.code;
      if (errors[code]) setState({ kind: code });
      else setError(requestError(error));
    } finally {
      setBusy(false);
    }
  }

  function recordView() {
    if (ownerId || viewed.current) return;
    const key = 'feelcraft-view-' + token;
    viewed.current = true;
    try { if (sessionStorage.getItem(key)) return; } catch { /* Storage may be disabled. */ }
    messages.view(token, state.access).then(() => {
      try { sessionStorage.setItem(key, '1'); } catch { /* The current open still counts. */ }
    }).catch(() => { viewed.current = false; });
  }

  return (
    <main className="recipient-page published-recipient">
      <PrivacyMeta />
      <div className="recipient-brand"><img src="/feelcraft.svg" alt="" /> FeelCraft</div>
      {state.kind === 'ready' ? (
        <>
          <RecipientExperience message={state.message} onReveal={recordView} />
          {!ownerId && <footer className="recipient-actions">
            <button type="button" className="text-link" onClick={() => setState({ kind: 'dismissed' })}>Dismiss message</button>
            <button type="button" className="text-link" onClick={() => setReporting(true)}><Flag size={15} aria-hidden="true" /> Report message</button>
          </footer>}
        </>
      ) : state.kind === 'locked' ? (
        <section className="recipient-status">
          <LockKeyhole className="recipient-lock" size={33} aria-hidden="true" />
          <h1>A letter under lock</h1>
          <p>Enter the password the sender shared with you.</p>
          <form onSubmit={unlock} aria-busy={busy}>
            <label className="studio-field">Message password
              <input name="password" type="password" maxLength={72} required autoComplete="off" />
            </label>
            {error && <p role="alert" className="studio-error">{error}</p>}
            <Button type="submit" disabled={busy}>{busy ? 'Unlocking…' : 'Unlock Message'}</Button>
          </form>
          <button type="button" className="text-link" onClick={() => setState({ kind: 'dismissed' })}>Dismiss message</button>
        </section>
      ) : (
        <section className="recipient-status">
          <h1>{state.kind === 'loading' ? 'Opening your letter…' : state.kind === 'dismissed' ? 'Message dismissed' :
            state.kind === 'reported' ? 'Report received' : errors[state.kind] || errors.unavailable}</h1>
          {state.kind === 'loading' && <p role="status">Checking the message link.</p>}
          {state.kind === 'reported' && <p>Your report has been recorded and the message is closed.</p>}
        </section>
      )}
      {reporting && state.kind === 'ready' && <Report onClose={() => setReporting(false)}
        submit={input => messages.report(token, input, state.access)}
        onReported={() => { setReporting(false); setState({ kind: 'reported' }); }} />}
    </main>
  );
}

export default function PublishedMessage({ owner = false }) {
  const { token, id } = useParams();
  return <RecipientPage key={owner ? id : token} token={token} ownerId={owner ? id : null} />;
}
