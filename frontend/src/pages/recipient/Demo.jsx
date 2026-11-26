import { Link, useParams } from 'react-router';
import { useCatalog } from '../../context/Catalog';
import Brand from '../../components/common/Brand';
import RecipientDemo from '../../components/landing/RecipientDemo';
import { usePageTitle } from '../../hooks/usePageTitle';
import NotFound from '../public/NotFound';

export default function Demo() {
  const { slug } = useParams();
  const template = useCatalog().templates.find(item => item.slug === slug);
  usePageTitle(template ? `${template.name} demo` : 'Page not found');
  return (
    <div className="recipient-page">
      <header className="shell recipient-header"><Brand /><Link className="text-link" to={template ? `/templates/${slug}` : '/templates'}>Back to templates</Link></header>
      <main id="main">
        {template ? (
          <section className="recipient-content">
            <h1 className="recipient-title">Sample Letter</h1>
            <RecipientDemo key={template.id} template={template} />
          </section>
        ) : <NotFound />}
      </main>
    </div>
  );
}
