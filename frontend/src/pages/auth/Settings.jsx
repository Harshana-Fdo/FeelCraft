import { useState } from 'react';
import { Link } from 'react-router';
import PageIntro from '../../components/common/PageIntro';
import Button from '../../components/ui/Button';
import { useAuth } from '../../store/auth';
import { requestError } from '../../services/api';
import { usePageTitle } from '../../hooks/usePageTitle';

function ProfileForm({ user }) {
  const updateProfile = useAuth(state => state.updateProfile);
  const [name, setName] = useState(user.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaved(false);
    if (!name.trim()) {
      setError('Enter your name.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await updateProfile(name.trim());
      setName(name.trim());
      setSaved(true);
    } catch (error) {
      setError(requestError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="account-form" onSubmit={submit} aria-busy={busy}>
      <label>Display name<input value={name} maxLength={80} required onChange={event => { setName(event.target.value); setSaved(false); }} /></label>
      <label>Email<input type="email" value={user.email} readOnly /></label>
      {error && <p className="studio-error" role="alert">{error}</p>}
      <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Profile'}</Button>
      {saved && <p role="status">Profile saved.</p>}
    </form>
  );
}

export default function Settings() {
  const { user, status } = useAuth();
  usePageTitle('Account Settings');
  return (
    <section className="shell interior account-page">
      <PageIntro title="Account Settings">Manage the name displayed on your FeelCraft profile.</PageIntro>
      {status === 'checking' ? <p role="status">Checking your session…</p> :
        user ? <ProfileForm key={user.id} user={user} /> : <Button asChild><Link to="/login">Sign In</Link></Button>}
    </section>
  );
}
