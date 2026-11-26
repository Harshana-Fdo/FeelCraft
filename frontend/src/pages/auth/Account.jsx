import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import Button from '../../components/ui/Button';
import { requestError } from '../../services/api';
import { useAuth } from '../../store/auth';
import { usePageTitle } from '../../hooks/usePageTitle';

function PasswordField({ name, label, autoComplete, error }) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <div className="auth-field">
      <label htmlFor={name}>{label}</label>
      <div className="auth-password">
        <input id={name} name={name} type={visible ? 'text' : 'password'} autoComplete={autoComplete}
          aria-invalid={Boolean(error)} aria-describedby={error ? name + '-error' : undefined} required />
        <button type="button" onClick={() => setVisible(!visible)} aria-label={(visible ? 'Hide ' : 'Show ') + label.toLowerCase()}>
          <Icon size={19} aria-hidden="true" />
        </button>
      </div>
      {error && <span id={name + '-error'} className="studio-error">{error}</span>}
    </div>
  );
}

export default function Account({ registering = false }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, status, signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const label = registering ? 'Sign Up' : 'Sign In';
  const draft = params.get('draft');
  const destination = draft ? '/dashboard?' + new URLSearchParams({ draft }) : '/dashboard';
  const switchMode = (registering ? '/login' : '/register') + (draft ? '?' + new URLSearchParams({ draft }) : '');
  usePageTitle(label);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const { name, email, password, confirm } = Object.fromEntries(new FormData(form));
    const invalid = {};
    if (registering && !name.trim()) invalid.name = 'Enter your name.';
    if (!email.trim() || form.elements.email.validity.typeMismatch) invalid.email = 'Enter a valid email address.';
    if (!password) invalid.password = 'Enter your password.';
    else if (registering && password.length < 8) invalid.password = 'Use at least 8 characters.';
    else if (new TextEncoder().encode(password).length > 72) invalid.password = 'Use a password under 73 UTF-8 bytes.';
    if (registering && (!confirm || password !== confirm)) invalid.confirm = 'Passwords must match.';
    setFields(invalid);
    setError('');
    const first = Object.keys(invalid)[0];
    if (first) {
      form.elements[first].focus();
      return;
    }

    setBusy(true);
    try {
      await signIn(registering ? 'register' : 'login', { name, email, password });
      navigate(destination, { replace: true });
    } catch (error) {
      setError(requestError(error));
    } finally {
      setBusy(false);
    }
  }

  if (user && !busy) return <Navigate to={destination} replace />;
  return (
    <section className="shell interior account-page auth-page">
      <div className="auth-card">
        <header>
          <h1>{label}</h1>
          <p>{draft ? 'Access your account to save a copy of your local draft.' :
            registering ? 'Create an account to keep your designs together.' : 'Open your saved designs and pick up where you left off.'}</p>
        </header>
        <form className="account-form" onSubmit={submit} noValidate aria-busy={busy}>
          {registering && <div className="auth-field">
            <label htmlFor="auth-name">Name</label>
            <input id="auth-name" name="name" autoComplete="name" maxLength={80} required
              aria-invalid={Boolean(fields.name)} aria-describedby={fields.name ? 'name-error' : undefined} />
            {fields.name && <span id="name-error" className="studio-error">{fields.name}</span>}
          </div>}
          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" name="email" type="email" autoComplete={registering ? 'email' : 'username'} maxLength={254} required
              aria-invalid={Boolean(fields.email)} aria-describedby={fields.email ? 'email-error' : undefined} />
            {fields.email && <span id="email-error" className="studio-error">{fields.email}</span>}
          </div>
          <PasswordField name="password" label="Password" autoComplete={registering ? 'new-password' : 'current-password'} error={fields.password} />
          {registering && <PasswordField name="confirm" label="Confirm password" autoComplete="new-password" error={fields.confirm} />}
          {error && <p className="studio-error" role="alert">{error}</p>}
          <Button type="submit" disabled={busy || status === 'checking'}>{busy ? (registering ? 'Creating account…' : 'Signing in…') : label}</Button>
        </form>
        <div className="auth-links">
          <p>{registering ? 'Already have an account?' : 'New to FeelCraft?'} <Link className="text-link" to={switchMode}>{registering ? 'Sign In' : 'Sign Up'}</Link></p>
          <Link className="text-link" to={draft ? '/editor/local/' + encodeURIComponent(draft) : '/dashboard?storage=local'}>{draft ? 'Return to local draft' : 'Continue with local drafts'}</Link>
        </div>
      </div>
    </section>
  );
}
