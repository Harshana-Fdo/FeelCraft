import { Eye } from 'lucide-react';
import { Link } from 'react-router';
import { useCatalog } from '../../context/Catalog';
import Ornament from './Ornament';
import Button from '../ui/Button';

export function TemplateArt({ template }) {
  return (
    <div className={`template-art mood-${template.category}`} aria-hidden="true">
      <div className="template-paper">
        <Ornament name={template.decoration} className="template-ornament" />
        <Ornament name={template.decoration} className="template-ornament ornament-flipped" />
        <span>{template.label}</span>
        <strong>{template.cover}</strong>
        <i />
      </div>
    </div>
  );
}

export default function TemplateCard({ template }) {
  const { categories } = useCatalog();
  return (
    <article className="template-card">
      <Link to={`/templates/${template.slug}`} className="template-link" aria-label={`Preview ${template.name}`}>
        <TemplateArt template={template} />
        <div className="template-caption">
          <div>
            <h3>{template.name}</h3>
            <p>{categories.find(category => category.slug === template.category)?.name} <span aria-hidden="true">·</span> {template.style}</p>
          </div>
          <span className="round-link"><Eye size={17} aria-hidden="true" /></span>
        </div>
      </Link>
      <div className="template-actions">
        <Button asChild variant="outline"><Link to={`/demo/${template.slug}`}>Preview</Link></Button>
        <Button asChild><Link to={`/editor/new?template=${template.slug}`}>Customize Template</Link></Button>
      </div>
    </article>
  );
}
