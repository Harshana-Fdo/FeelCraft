import { useEffect, useRef, useState } from 'react';
import { ChevronDown, CircleUserRound, LogOut, Settings } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import Button from '../ui/Button';
import { requestError } from '../../services/api';
import { useAuth } from '../../store/auth';

function ProfileNavigation({ user, signOut }) {
  const navigate = useNavigate();
  const menu = useRef(null);
  const trigger = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function closeOutside(event) {
      if (!menu.current?.contains(event.target)) menu.current?.removeAttribute('open');
    }
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      setError(requestError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="profile-navigation" ref={menu} onKeyDown={event => {
      if (event.key === 'Escape' && menu.current.open) {
        event.stopPropagation();
        menu.current.open = false;
        trigger.current.focus();
      }
    }}>
      <summary ref={trigger} aria-label="Profile menu">
        <CircleUserRound size={20} aria-hidden="true" /><span>{user.name}</span><ChevronDown size={15} aria-hidden="true" />
      </summary>
      <div className="profile-links">
        <Link to="/dashboard" onClick={() => { menu.current.open = false; }}><CircleUserRound size={16} aria-hidden="true" /> My Creations</Link>
        <Link to="/account/settings" onClick={() => { menu.current.open = false; }}><Settings size={16} aria-hidden="true" /> Account Settings</Link>
        <button type="button" onClick={logout} disabled={busy}><LogOut size={16} aria-hidden="true" /> {busy ? 'Logging out…' : 'Logout'}</button>
        {error && <p role="alert" className="studio-error">{error}</p>}
      </div>
    </details>
  );
}

export default function AccountNavigation() {
  const { status, user, signOut } = useAuth();
  const { pathname, search } = useLocation();
  const draft = ['/login', '/register'].includes(pathname) && new URLSearchParams(search).get('draft');
  const query = draft ? '?' + new URLSearchParams({ draft }) : '';
  if (status === 'checking') return null;
  if (user) return <ProfileNavigation user={user} signOut={signOut} />;
  return (
    <div className="account-nav-guest">
      <Button asChild variant="outline"><Link to={'/login' + query}>Sign In</Link></Button>
      <Button asChild><Link to={'/register' + query}>Sign Up</Link></Button>
    </div>
  );
}
