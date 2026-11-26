import { Link } from 'react-router';

export default function Brand() {
  return (
    <Link to="/" className="brand" aria-label="FeelCraft home">
      <img src="/feelcraft.svg" width="37" height="37" alt="" />
      <span>FeelCraft</span>
    </Link>
  );
}
