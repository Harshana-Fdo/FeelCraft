import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CloudRain, Flame, Flower2, Heart, MoonStar, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';
import DesignCanvas from '../editor/DesignCanvas';
import Ornament from '../templates/Ornament';
import Button from '../ui/Button';
import { useElementWidth } from '../../hooks/useElementWidth';

const ornaments = { love: 'botanical', anger: 'lines', sadness: 'moon', apology: 'sage', 'secret-crush': 'butterfly' };
const symbols = { love: Heart, anger: Flame, sadness: MoonStar, apology: Flower2, 'secret-crush': Sparkles };
const particleIcons = { hearts: Heart, embers: Flame, rain: CloudRain, petals: Flower2, stars: Sparkles };
const particles = Array.from({ length: 18 }, (_, index) => ({
  x: 4 + (index * 37 % 92), y: 5 + (index * 29 % 90), delay: index * -0.6, size: 12 + (index % 4) * 4,
}));
const melody = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66];

function SoundControl() {
  const audio = useRef(null);
  const timer = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => {
    clearInterval(timer.current);
    audio.current?.close().catch(() => {});
  }, []);

  async function toggle() {
    if (playing) {
      clearInterval(timer.current);
      await audio.current.suspend();
      setPlaying(false);
      return;
    }
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      audio.current ||= new Audio();
      await audio.current.resume();
      let index = 0;
      function note() {
        const now = audio.current.currentTime;
        const oscillator = audio.current.createOscillator();
        const gain = audio.current.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = melody[index++ % melody.length];
        gain.gain.setValueAtTime(.0001, now);
        gain.gain.exponentialRampToValueAtTime(.033, now + .24);
        gain.gain.exponentialRampToValueAtTime(.0001, now + 1.55);
        oscillator.connect(gain).connect(audio.current.destination);
        oscillator.start(now);
        oscillator.stop(now + 1.6);
      }
      note();
      timer.current = setInterval(note, 1700);
      setPlaying(true);
      setError('');
    } catch {
      setError('Audio is unavailable in this browser.');
    }
  }

  return (
    <div className="recipient-sound">
      <Button variant="outline" onClick={toggle} aria-pressed={playing}>
        {playing ? <Volume2 size={17} aria-hidden="true" /> : <VolumeX size={17} aria-hidden="true" />}
        {playing ? 'Mute music' : 'Play music'}
      </Button>
      {error && <p role="alert" className="studio-error">{error}</p>}
    </div>
  );
}

function Atmosphere({ effect, category }) {
  const Icon = particleIcons[effect];
  if (!Icon && effect !== 'butterflies') return null;
  return (
    <div className={'recipient-particles particles-' + effect} aria-hidden="true">
      {particles.map(({ x, y, delay, size }, index) => (
        <span key={x} style={{ left: x + '%', top: y + '%', animationDelay: delay + 's', width: size }}>
          {effect === 'butterflies' ? <Ornament name="butterfly" /> :
            effect === 'stars' && category === 'secret-crush' && index % 3 === 0 ? <Ornament name="butterfly" /> :
              effect === 'hearts' && index % 4 === 0 ? <Flower2 size={size} /> :
                effect === 'rain' ? <i /> : <Icon size={size} />}
        </span>
      ))}
    </div>
  );
}

function OpeningArt({ category, kind, opening, reduced }) {
  const Icon = symbols[category] || Heart;
  const unfold = kind === 'unfold';
  return (
    <div className={'recipient-opening-art' + (unfold ? ' opening-paper' : '')} aria-hidden="true">
      <Ornament className="recipient-ornament ornament-left" name={ornaments[category]} />
      <Ornament className="recipient-ornament ornament-right" name={ornaments[category]} />
      <div className="recipient-art-orbit" />
      <motion.div className="recipient-letter" animate={opening && !reduced ? { y: -60, rotate: -4 } : { y: 0, rotate: 0 }}
        transition={{ duration: .68, ease: 'easeInOut' }}><Icon size={33} strokeWidth={1.1} /></motion.div>
      <div className="recipient-envelope">
        <motion.div className="recipient-flap" animate={opening && !reduced ? (unfold ? { scaleY: .2 } : { rotateX: 170 }) : { rotateX: 0, scaleY: 1 }}
          transition={{ duration: .55 }} />
        <div className="recipient-seal"><Icon size={22} strokeWidth={1.4} /></div>
      </div>
    </div>
  );
}

function Artwork({ design, animate }) {
  const frame = useRef(null);
  const width = useElementWidth(frame);
  const text = design.elements.filter(layer => layer.visible && layer.type === 'text');
  return (
    <div className="recipient-artwork" ref={frame}>
      <div className="sr-only">{text.map(layer => <p key={layer.id}>{layer.content}</p>)}</div>
      <div aria-hidden="true">
        {width > 0 && <DesignCanvas document={design} scale={width / design.canvas.width} animate={animate} />}
      </div>
    </div>
  );
}

export default function RecipientExperience({ message, onReveal }) {
  const [state, setState] = useState('closed');
  const reduced = useReducedMotion();
  const openButton = useRef(null);
  const heading = useRef(null);
  const revealed = state === 'opened' || state === 'skipped';
  const { openingAnimation, backgroundEffect } = message.document.experience;

  useEffect(() => {
    if (revealed) heading.current?.focus();
    if (state !== 'opening') return;
    const timeout = setTimeout(() => setState('opened'), 720);
    return () => clearTimeout(timeout);
  }, [state, revealed]);

  function open(skip) {
    setState(skip ? 'skipped' : reduced || openingAnimation === 'fade' ? 'opened' : 'opening');
    onReveal?.();
  }

  return (
    <section className={'recipient-experience mood-' + message.category}>
      {!reduced && state !== 'skipped' && <Atmosphere effect={backgroundEffect} category={message.category} />}
      {message.music === 'ambient' && <SoundControl />}
      {revealed ? (
        <motion.div className="recipient-reveal" role="region" aria-label="Opened message"
          initial={reduced || state === 'skipped' ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .42 }}>
          <h1 ref={heading} tabIndex={-1}>{message.title}</h1>
          {message.recipient && <p className="recipient-dedication">For {message.recipient}</p>}
          <Artwork design={message.document} animate={!reduced && state !== 'skipped'} />
          {message.signature && <p className="recipient-signature">{message.signature}</p>}
          <Button variant="quiet" onClick={() => { setState('closed'); requestAnimationFrame(() => openButton.current?.focus()); }}>
            <RotateCcw size={16} aria-hidden="true" /> Replay animation
          </Button>
        </motion.div>
      ) : (
        <div className="recipient-welcome">
          <OpeningArt category={message.category} kind={openingAnimation} opening={state === 'opening'} reduced={reduced} />
          <h1>{message.title}</h1>
          <p>{message.recipient ? 'A letter for ' + message.recipient + '.' : 'A letter for you.'}</p>
          <Button ref={openButton} disabled={state === 'opening'} onClick={() => open(false)}>
            {state === 'opening' ? 'Opening…' : 'Open Message'}
          </Button>
          <button type="button" className="text-link" onClick={() => open(true)}>Skip animation</button>
        </div>
      )}
    </section>
  );
}
