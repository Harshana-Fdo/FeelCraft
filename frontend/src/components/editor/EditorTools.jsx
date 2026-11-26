import { useState } from 'react';
import { Circle, Flower, Heart, ImagePlus, Sparkles, Square, Star, Type } from 'lucide-react';
import { backgroundEffects, importPhoto, newLayer, openingEffects } from '../../editor/document';

const decorations = [
  ['Heart', Heart, { type: 'shape', shape: 'heart' }],
  ['Flower', Flower, { type: 'decoration', asset: 'flower' }],
  ['Butterfly', Sparkles, { type: 'decoration', asset: 'butterfly' }],
  ['Star', Star, { type: 'shape', shape: 'star' }],
  ['Rectangle', Square, { type: 'shape', shape: 'rect' }],
  ['Ellipse', Circle, { type: 'shape', shape: 'ellipse' }],
];

const photoTypes = 'image/png,image/jpeg,image/webp';
export function PhotoButton({ children, onPhoto }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function choose(event) {
    const [file] = event.target.files;
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onPhoto(await importPhoto(file));
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="photo-control">
      <label className="tool-button"><ImagePlus size={17} aria-hidden="true" /> {busy ? 'Preparing photo…' : children}
        <input type="file" accept={photoTypes} disabled={busy} onChange={choose} aria-label={children} />
      </label>
      {error && <p className="studio-error" role="alert">{error}</p>}
    </div>
  );
}

export function EffectSelect({ label, options, value, onChange }) {
  return (
    <label className="studio-field">{label}
      <select value={value} onChange={event => onChange(event.target.value)}>
        {Object.entries(options).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
  );
}

export default function EditorTools({ editor, design, onInsert }) {
  const [tab, setTab] = useState('Elements');
  const { canvas, experience } = design;
  const bg = value => editor.edit(document => ({ ...document, canvas: { ...document.canvas, background: value } }));
  const effect = patch => editor.edit(document => ({ ...document, experience: { ...document.experience, ...patch } }));

  return (
    <aside className="studio-panel studio-tools" aria-label="Design tools">
      <h2>Design tools</h2>
      <div className="studio-tabs" aria-label="Tool panels">
        {['Elements', 'Background', 'Animation'].map(name => (
          <button type="button" key={name} aria-pressed={tab === name} onClick={() => setTab(name)}>{name}</button>
        ))}
      </div>
      {tab === 'Elements' && (
        <>
          <button type="button" className="tool-button" onClick={() => onInsert(newLayer('text', canvas))}><Type size={17} aria-hidden="true" /> Add Text</button>
          <PhotoButton onPhoto={({ src, width, height }) => {
            const scale = Math.min(480 / width, 460 / height);
            onInsert(newLayer('image', canvas, {
              src, width: Math.max(12, Math.round(width * scale)), height: Math.max(12, Math.round(height * scale)),
            }));
          }}>Upload Photo</PhotoButton>
          <div className="studio-element-grid">
            {decorations.map(([name, Icon, { type, ...variant }]) => (
              <button type="button" className="tool-button" key={name} onClick={() => onInsert(newLayer(type, canvas, {
                ...variant, ...(type === 'shape' && { fill: '#d66a91' }),
              }))}><Icon size={18} aria-hidden="true" /> {name}</button>
            ))}
          </div>
        </>
      )}
      {tab === 'Background' && (
        <>
          <label className="studio-field studio-color">Background color
            <input type="color" value={canvas.background.type === 'color' ? canvas.background.value : '#fffdf8'}
              onChange={event => bg({ type: 'color', value: event.target.value })} />
          </label>
          <PhotoButton onPhoto={({ src }) => bg({ type: 'image', value: src })}>Upload Background</PhotoButton>
          {canvas.background.type === 'image' && <button type="button" className="tool-button" onClick={() => bg({ type: 'color', value: '#fffdf8' })}>Remove Background Image</button>}
        </>
      )}
      {tab === 'Animation' && (
        <>
          <EffectSelect label="Opening animation" options={openingEffects} value={experience.openingAnimation} onChange={openingAnimation => effect({ openingAnimation })} />
          <EffectSelect label="Background effect" options={backgroundEffects} value={experience.backgroundEffect} onChange={backgroundEffect => effect({ backgroundEffect })} />
        </>
      )}
    </aside>
  );
}
