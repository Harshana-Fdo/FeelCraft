export default function PageIntro({ label, title, children }) {
  return (
    <header className="page-intro">
      {label && <span className="eyebrow">{label}</span>}
      <h1>{title}</h1>
      <p>{children}</p>
    </header>
  );
}
