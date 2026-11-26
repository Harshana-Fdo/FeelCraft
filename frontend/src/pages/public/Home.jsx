import { Eye, Feather, Heart, Layers3, LockKeyhole, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import hero from '../../assets/hero-letter.svg';
import { useCatalog } from '../../context/Catalog';
import FeelingGrid from '../../components/landing/FeelingGrid';
import Process from '../../components/landing/Process';
import RecipientDemo from '../../components/landing/RecipientDemo';
import TemplateCard, { TemplateArt } from '../../components/templates/TemplateCard';
import Button from '../../components/ui/Button';

export default function Home() {
  const { templates } = useCatalog();
  const love = templates.find(template => template.slug === 'eternal-love') ?? templates[0];
  const featured = ['eternal-love', 'silent-tears', 'secret-admirer']
    .map(slug => templates.find(template => template.slug === slug)).filter(Boolean);
  return (
    <>
      <section className="shell hero">
        <div className="hero-content">
          <span className="eyebrow"><Sparkles size={15} aria-hidden="true" /> The digital letter studio</span>
          <h1>Some feelings deserve more than <em>just words.</em></h1>
          <p>Turn love, apologies, and the things left unsaid into beautiful, animated letters for someone special.</p>
          <div className="button-row">
            <Button asChild><Link to="/create">Create Your Message</Link></Button>
            <Button asChild variant="outline"><Link to="/templates">Explore Templates</Link></Button>
          </div>
        </div>
        <div className="hero-board">
          <img src={hero} alt="A hand-illustrated rose envelope holding a letter that reads, You make the ordinary beautiful." fetchPriority="high" width="640" height="520" />
          {love && <Link className="hero-art-caption" to={`/demo/${love.slug}`}><Heart size={16} aria-hidden="true" /> Open a sample letter</Link>}
        </div>
      </section>

      <section className="feeling-band">
        <div className="shell">
          <div className="section-heading">
            <div><h2>Browse by Feeling</h2><p>Find a starting point for whatever’s on your mind.</p></div>
            <Link className="text-link" to="/categories">All feelings</Link>
          </div>
          <FeelingGrid />
        </div>
      </section>

      <section className="shell section-block">
        <div className="section-heading">
          <div><h2>Featured Templates</h2><p>Original designs for the feelings that stay with you.</p></div>
          <Link className="text-link" to="/templates">View all templates</Link>
        </div>
        <div className="template-grid">{featured.map(template => <TemplateCard key={template.id} template={template} />)}</div>
      </section>

      {love && <section className="demo-band">
        <div className="shell split-section">
          <div className="section-copy">
            <span className="eyebrow"><Eye size={16} aria-hidden="true" /> Interactive demo</span>
            <h2>See what they’ll open.</h2>
            <p>Try a sample letter the way a recipient would. Open the envelope to reveal the note inside.</p>
            <Button variant="outline" asChild><Link to={`/demo/${love.slug}`}>Try the full-screen demo</Link></Button>
          </div>
          <RecipientDemo template={love} />
        </div>
      </section>}

      <section className="shell section-block process-section">
        <div className="section-heading"><div><h2>How It Works</h2><p>From the feeling you start with to the letter they open.</p></div></div>
        <Process />
      </section>

      <section className="editor-band">
        <div className="shell split-section">
          {love && <div className="editor-visual">
            <div className="editor-art-title"><Layers3 size={19} aria-hidden="true" /> {love.name}</div>
            <TemplateArt template={love} />
            <div className="editor-art-controls" aria-hidden="true"><span /> <span /> <span /> <span /></div>
          </div>}
          <div className="section-copy">
            <span className="eyebrow"><Feather size={16} aria-hidden="true" /> Visual editor</span>
            <h2>Make the design your own.</h2>
            <p>Start from a template or blank canvas, adjust each layer, and preview how your message will open.</p>
            <ul className="feature-list">
              <li><Layers3 size={19} aria-hidden="true" /> Editable text, backgrounds and decorations</li>
              <li><Sparkles size={19} aria-hidden="true" /> Opening animations for different moods</li>
              <li><Eye size={19} aria-hidden="true" /> A live preview for desktop and mobile</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="shell privacy-row">
        <span className="process-icon"><LockKeyhole size={26} strokeWidth={1.5} aria-hidden="true" /></span>
        <div><h2>For the person you choose.</h2><p>When publishing is available, you’ll share an unlisted link yourself and choose how to sign your letter.</p></div>
        <Link className="text-link" to="/privacy">About sharing & privacy</Link>
      </section>

      <section className="final-band">
        <h2>What would you like to say?</h2>
        <p>Find a design that feels right and see how it opens.</p>
        <Button asChild><Link to="/create">Create Your Message</Link></Button>
      </section>
    </>
  );
}
