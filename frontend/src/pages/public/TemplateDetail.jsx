import { Link, useParams } from 'react-router';
import { useCatalog } from '../../context/Catalog';
import { TemplateArt } from '../../components/templates/TemplateCard';
import Button from '../../components/ui/Button';
import { usePageTitle } from '../../hooks/usePageTitle';
import NotFound from './NotFound';

export default function TemplateDetail() {
  const { slug } = useParams();
  const { categories, templates } = useCatalog();
  const template = templates.find(item => item.slug === slug);
  usePageTitle(template?.name ?? 'Page not found');
  if (!template) return <NotFound />;
  const category = categories.find(item => item.slug === template.category);

  return (
    <section className="shell interior">
      <Link to="/templates" className="text-link back-link">All templates</Link>
      <div className="template-detail">
        <TemplateArt template={template} />
        <div className="section-copy">
          <span className="eyebrow">{category.name} · {template.tier === 'free' ? 'Free' : 'Premium preview'}</span>
          <h1>{template.name}</h1>
          <p>{category.prompt} {category.styles}</p>
          <div className="button-row">
            <Button asChild><Link to={`/editor/new?template=${slug}`}>Customize Template</Link></Button>
            <Button variant="outline" asChild><Link to={`/demo/${slug}`}>Open Sample Letter</Link></Button>
          </div>
          <p className="fine-print"><Link className="text-link" to={`/categories/${category.slug}`}>Explore {category.name}</Link></p>
        </div>
      </div>
    </section>
  );
}
