import { ChevronDown, Search, SearchX } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { useCatalog } from '../../context/Catalog';
import Button from '../../components/ui/Button';
import PageIntro from '../../components/common/PageIntro';
import TemplateCard from '../../components/templates/TemplateCard';
import { usePageTitle } from '../../hooks/usePageTitle';

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <span className="select-wrap">
        <select value={value} onChange={event => onChange(event.target.value)}>{children}</select>
        <ChevronDown size={17} aria-hidden="true" />
      </span>
    </label>
  );
}

export default function Gallery({ creating = false }) {
  const { categories, templates, source } = useCatalog();
  const styles = [...new Set(templates.map(template => template.style))].sort();
  const [params, setParams] = useSearchParams();
  const search = params.get('q') || '';
  const category = params.get('feeling') || '';
  const style = params.get('style') || '';
  const tier = params.get('tier') || '';
  const matched = templates.filter(template =>
    (!category || template.category === category) &&
    (!style || template.style === style) &&
    (!tier || template.tier === tier) &&
    [template.name, ...template.tags].join(' ').toLowerCase().includes(search.trim().toLowerCase())
  );
  usePageTitle(creating ? 'Create a Message' : 'Explore Templates');

  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true, preventScrollReset: true });
  }

  return (
    <section className="shell interior">
      <PageIntro label="The template collection" title={creating ? 'Choose a starting point.' : 'Explore Templates'}>
        {creating
          ? 'Make a template your own or build your letter on a blank canvas.'
          : 'Find a design for the feeling you want to express. Preview it or personalize every layer.'}
      </PageIntro>
      <div className="catalog-actions">
        <Button asChild><Link to="/editor/new">Start From Scratch</Link></Button>
        <Button asChild variant="outline"><Link to="/dashboard">My Drafts</Link></Button>
      </div>
      {source === 'fallback' && <p className="studio-note">Showing the bundled starter collection while the database catalog is unavailable.</p>}
      <div className="gallery-filters">
        <label className="filter-field">
          <span>Search</span>
          <span className="search-wrap"><Search size={18} aria-hidden="true" />
            <input type="search" placeholder="Find a template" value={search} onChange={event => setFilter('q', event.target.value)} />
          </span>
        </label>
        <FilterSelect label="Feeling" value={category} onChange={value => setFilter('feeling', value)}>
          <option value="">All feelings</option>
          {categories.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </FilterSelect>
        <FilterSelect label="Style" value={style} onChange={value => setFilter('style', value)}>
          <option value="">All styles</option>
          {styles.map(item => <option key={item}>{item}</option>)}
        </FilterSelect>
        <FilterSelect label="Collection" value={tier} onChange={value => setFilter('tier', value)}>
          <option value="">All collections</option><option value="free">Free</option><option value="premium">Premium preview</option>
        </FilterSelect>
      </div>
      <div className="gallery-summary">
        <p role="status">{matched.length} {matched.length === 1 ? 'template' : 'templates'}</p>
        {params.size > 0 && <button type="button" className="text-link" onClick={() => setParams({}, { replace: true, preventScrollReset: true })}>Clear filters</button>}
      </div>
      {matched.length > 0 ? (
        <div className="template-grid">{matched.map(template => <TemplateCard key={template.id} template={template} />)}</div>
      ) : (
        <div className="empty-state"><SearchX aria-hidden="true" /><h2>No matching templates</h2><p>Try another search or clear the filters.</p></div>
      )}
    </section>
  );
}
