import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Lock, Trash2, Unlock } from 'lucide-react';
import { useState } from 'react';
import { fonts, layerName } from '../../editor/document';
import { EffectSelect, PhotoButton } from './EditorTools';

function Numeric({ label, value, min, max, step = 1, update }) {
  const [input, setInput] = useState(null);
  return (
    <label className="studio-field">{label}
      <input type="number" min={min} max={max} step={step} value={input ?? value}
        onChange={event => setInput(event.target.value)}
        onKeyDown={event => { if (event.key === 'Enter') event.target.blur(); }}
        onBlur={event => {
          const number = event.target.valueAsNumber;
          if (input !== null && Number.isFinite(number)) update(Math.min(max, Math.max(min, number)));
          setInput(null);
        }} />
    </label>
  );
}

export default function EditorProperties({ editor, document, selected, insert }) {
  const { elements } = document;
  const index = elements.findIndex(layer => layer.id === selected);
  const layer = elements[index];
  const update = properties => editor.updateLayer(layer.id, properties);
  const numeric = (label, key, min, max, step) => (
    <Numeric label={label} value={layer[key]} min={min} max={max} step={step} update={value => update({ [key]: value })} />
  );

  return (
    <aside className="studio-panel studio-properties" aria-label="Layer properties">
      <h2>Properties</h2>
      {!layer && <p className="studio-note">Select a layer to change its appearance.</p>}
      {layer && (
        <>
          <fieldset className="studio-fields" disabled={layer.locked}>
            {layer.type === 'text' && <>
              <label className="studio-field">Text<textarea value={layer.content} maxLength={3000} rows={4} dir="auto" onChange={event => update({ content: event.target.value })} /></label>
              <EffectSelect label="Font" value={layer.fontFamily} options={Object.fromEntries(fonts.map(font => [font, font]))} onChange={fontFamily => update({ fontFamily })} />
              <div className="studio-field-grid">
                {numeric('Font size', 'fontSize', 8, 360)}
                <EffectSelect label="Alignment" value={layer.align} options={{ left: 'Left', center: 'Center', right: 'Right' }} onChange={align => update({ align })} />
              </div>
            </>}
            {layer.type === 'image' && <PhotoButton onPhoto={({ src }) => update({ src })}>Replace Photo</PhotoButton>}
            {layer.fill && <label className="studio-field studio-color">{layer.type === 'text' ? 'Text color' : 'Fill color'}
              <input type="color" value={layer.fill} onChange={event => update({ fill: event.target.value })} />
            </label>}
            <div className="studio-field-grid">
              {numeric('X position', 'x', -4000, 4000)}
              {numeric('Y position', 'y', -4000, 4000)}
              {numeric('Width', 'width', 12, 4000)}
              {layer.type !== 'text' && numeric('Height', 'height', 12, 4000)}
              {numeric('Rotation', 'rotation', -360, 360)}
              {numeric('Opacity', 'opacity', 0, 1, .05)}
            </div>
            <EffectSelect label="Layer animation" value={layer.animation?.type || 'none'}
              options={{ none: 'None', 'fade-in': 'Fade in', rise: 'Rise' }}
              onChange={type => update({ animation: { type, duration: 520, delay: 100 } })} />
          </fieldset>
          <div className="studio-icon-row">
            <button type="button" title="Bring forward" aria-label="Bring forward" disabled={index === elements.length - 1} onClick={() => editor.move(layer.id, 1)}><ArrowUp size={16} /></button>
            <button type="button" title="Send backward" aria-label="Send backward" disabled={index === 0} onClick={() => editor.move(layer.id, -1)}><ArrowDown size={16} /></button>
            <button type="button" title="Duplicate layer" aria-label="Duplicate layer" onClick={() => insert({ ...layer, id: crypto.randomUUID(), x: Math.min(4000, layer.x + 24), y: Math.min(4000, layer.y + 24) })}><Copy size={16} /></button>
            <button type="button" title="Delete layer" aria-label="Delete layer" onClick={() => editor.remove(layer.id)}><Trash2 size={16} /></button>
          </div>
        </>
      )}
      <div className="layers-panel">
        <h2>Layers</h2>
        {!elements.length && <p className="studio-note">Added elements will appear here.</p>}
        <ul>
          {[...elements].reverse().map(item => (
            <li key={item.id} className={item.id === selected ? 'selected-layer' : ''}>
              <button type="button" className="layer-select" aria-pressed={item.id === selected} onClick={() => editor.select(item.id)}>{layerName(item)}</button>
              <button type="button" aria-label={(item.visible ? 'Hide ' : 'Show ') + layerName(item)}
                onClick={() => editor.updateLayer(item.id, { visible: !item.visible })}>{item.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button>
              <button type="button" aria-label={(item.locked ? 'Unlock ' : 'Lock ') + layerName(item)}
                onClick={() => editor.updateLayer(item.id, { locked: !item.locked })}>{item.locked ? <Lock size={15} /> : <Unlock size={15} />}</button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
