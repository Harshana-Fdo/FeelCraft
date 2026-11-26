import { ornaments } from '../../editor/ornaments';

export default function Ornament({ name, className }) {
  return <img className={className} src={ornaments[name] ?? ornaments.lines} alt="" />;
}
