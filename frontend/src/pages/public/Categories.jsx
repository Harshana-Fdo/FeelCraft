import { Link, useParams } from 'react-router';
import { useCatalog } from '../../context/Catalog';
import PageIntro from '../../components/common/PageIntro';
import FeelingGrid from '../../components/landing/FeelingGrid';
import TemplateCard from '../../components/templates/TemplateCard';
import { usePageTitle } from '../../hooks/usePageTitle';
import NotFound from './NotFound';

export function Categories() {
  usePageTitle('Feelings');
  return (
    <section className="shell interior">
      <PageIntro label="Find your feeling" title="What’s on your mind?">Find a design shaped around the emotion you want to express.</PageIntro>
      <FeelingGrid />
    </section>
  );
}

export function CategoryDetail() {
  const { slug } = useParams();
  const { categories, templates } = useCatalog();
  const category = categories.find(item => item.slug === slug);
  usePageTitle(category?.name ?? 'Page not found');
  if (!category) return <NotFound />;

  return (
    <section className="shell interior">
      <Link to="/categories" className="text-link back-link">All feelings</Link>
      <div className={`category-banner mood-${slug}`}>
        <PageIntro label={category.name} title={category.prompt}>{category.description}</PageIntro>
        <p>{category.styles}</p>
      </div>
      <div className="section-heading"><h2>{category.name} Templates</h2></div>
      <div className="template-grid">
        {templates.filter(template => template.category === slug).map(template => <TemplateCard key={template.id} template={template} />)}
      </div>
    </section>
  );
}
