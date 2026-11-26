import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CloudRain, Flame, Flower, Heart, Sparkles, RotateCcw } from 'lucide-react';
import DesignPreview from '../templates/DesignPreview';
import Button from '../ui/Button';

const effects = { hearts: Heart, embers: Flame, rain: CloudRain, petals: Flower, stars: Sparkles };
const particles = Array.from({ length: 12 }, (_, index) => ({
  x: (index * 37 + 5) % 100,
  y: (index * 23 + 12) % 100,
  delay: index * -0.55,
  size: 12 + (index % 4) * 3,
}));

function Envelope({ opening }) {
  return (
    <svg viewBox="0 0 240 180" className={opening ? 'demo-envelope opening' : 'demo-envelope'} aria-hidden="true">
      <ellipse cx="120" cy="154" rx="93" ry="10" fill="currentColor" opacity=".10" />
      <rect x="22" y="49" width="196" height="109" rx="8" fill="currentColor" opacity=".28" />
      <path className="demo-envelope-front" d="m24 151 96-65 96 65q-2 7-9 7H33q-7 0-9-7Z" fill="currentColor" opacity=".24" />
      <g className="demo-flap">
        <path d="M22 55q0-6 8-6h180q8 0 8 6l-87 65q-11 8-22 0Z" fill="currentColor" opacity=".52" />
        <circle cx="120" cy="112" r="16" fill="currentColor" />
        <path d="M120 120c-17-11-6-18 0-11 6-7 18 0 0 11Z" fill="none" stroke="#fff9f5" strokeWidth="1.2" />
      </g>
      <path d="M39 30v14m-7-7h14m145-18v16m-8-8h16m23 98v12m-6-6h12" fill="none" stroke="currentColor" opacity=".55" strokeLinecap="round" />
    </svg>
  );
}

export default function RecipientDemo({ template, renderDocument }) {
  const [state, setState] = useState('closed');
  const reduced = useReducedMotion();
  const revealRef = useRef(null);
  const openRef = useRef(null);
  const { openingAnimation, backgroundEffect } = template.document.experience;
  const Effect = effects[backgroundEffect];
  const revealed = state === 'revealed' || state === 'skipped';
  const animate = state === 'revealed' && !reduced;

  useEffect(() => {
    if (revealed) revealRef.current?.focus();
    if (state !== 'opening') return;
    const timer = window.setTimeout(() => setState('revealed'), 480);
    return () => window.clearTimeout(timer);
  }, [state, revealed]);

  function handleOpen() {
    setState(reduced || openingAnimation === 'fade' ? 'revealed' : 'opening');
  }

  function replay() {
    setState('closed');
    requestAnimationFrame(() => openRef.current?.focus());
  }

  return (
    <div className={`experience mood-${template.category || 'love'} experience-${openingAnimation}`}>
      {animate && Effect && (
        <div className={`experience-effects effect-${backgroundEffect}`} aria-hidden="true">
          {particles.map(({ x, y, delay, size }) => (
            <Effect key={x} size={size} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s` }} />
          ))}
        </div>
      )}
      {revealed ? (
        <motion.div className="experience-reveal" ref={revealRef} role="region" tabIndex={-1} aria-label="Opened message"
          initial={animate ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }} transition={{ duration: animate ? 0.3 : 0 }}>
          {renderDocument ? renderDocument(animate) : <DesignPreview document={template.document} animate={animate} />}
          <Button variant="quiet" onClick={replay}><RotateCcw size={15} aria-hidden="true" /> Replay</Button>
        </motion.div>
      ) : (
        <div className="experience-closed">
          <Envelope opening={state === 'opening'} />
          <h3>A note for you.</h3>
          <p>Someone has something to tell you.</p>
          <Button ref={openRef} onClick={handleOpen} disabled={state === 'opening'}>
            {state === 'opening' ? 'Opening…' : 'Open Your Message'}
          </Button>
          <button type="button" className="text-link skip-animation" onClick={() => setState('skipped')}>Skip animation</button>
        </div>
      )}
    </div>
  );
}
