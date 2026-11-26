import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import Brand from '../components/common/Brand';
import Button from '../components/ui/Button';
import AccountNavigation from '../components/common/AccountNavigation';

const links = [['/templates', 'Templates'], ['/categories', 'Feelings'], ['/how-it-works', 'How It Works'], ['/pricing', 'Pricing'], ['/dashboard', 'My Drafts']];

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header" onKeyDown={event => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        document.getElementById('nav-toggle')?.focus();
      }
    }}>
      <div className="shell nav-inner">
        <Brand />
        <button id="nav-toggle" className="menu-toggle" type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="primary-nav">
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <nav id="primary-nav" aria-label="Primary" className={open ? 'primary-nav nav-open' : 'primary-nav'}>
          {links.map(([path, label]) => <NavLink key={path} to={path} onClick={() => setOpen(false)}>{label}</NavLink>)}
          <NavLink className="mobile-create" to="/create" onClick={() => setOpen(false)}>Create a Message</NavLink>
        </nav>
        <div className="nav-actions">
          <AccountNavigation />
          <Button asChild className="desktop-create"><Link to="/create">Create a Message</Link></Button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div>
          <Brand />
          <p>Every feeling deserves a beautiful expression.</p>
        </div>
        <nav aria-label="Footer">
          <Link to="/templates">Explore Templates</Link>
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/about">About FeelCraft</Link>
          <Link to="/privacy">Sharing & Privacy</Link>
        </nav>
      </div>
      <div className="shell footer-bottom">© {new Date().getFullYear()} FeelCraft</div>
    </footer>
  );
}

export default function PublicLayout() {
  const { pathname } = useLocation();
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header key={pathname} />
      <main id="main" tabIndex={-1}><Outlet /></main>
      <Footer />
    </>
  );
}
