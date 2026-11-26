import { Link } from 'react-router';
import { useCatalog } from '../../context/Catalog';
import FeelingIcon from '../common/FeelingIcon';

export default function FeelingGrid() {
  const { categories } = useCatalog();
  return (
    <div className="feeling-grid">
      {categories.map(category => (
        <Link to={`/categories/${category.slug}`} key={category.slug} className={`feeling-card mood-${category.slug}`}>
          <span className="feeling-icon"><FeelingIcon feeling={category.slug} /></span>
          <span>
            <strong>{category.name}</strong>
            <small>{category.prompt}</small>
          </span>
        </Link>
      ))}
    </div>
  );
}
