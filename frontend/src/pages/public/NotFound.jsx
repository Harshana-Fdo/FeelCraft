import { Link } from 'react-router';
import Button from '../../components/ui/Button';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <section className="shell interior empty-state">
      <p className="eyebrow">404</p>
      <h1>This page is missing.</h1>
      <p>You can return home or choose another letter from the collection.</p>
      <Button asChild><Link to="/">Back to Home</Link></Button>
    </section>
  );
}
