import { useState } from 'react';
import Button from '../ui/Button';
import { EffectSelect } from '../editor/EditorTools';
import { effects, identities, moods, openings, previewSnapshot } from '../../editor/publishing';
import { requestError } from '../../services/api';
import { publications } from '../../services/publications';
import Modal from './Modal';
import RecipientExperience from './RecipientExperience';

export default function PublishDialog({ draft, design, title, user, category, flush, onClose, onPublish }) {
  const [form, setForm] = useState(() => ({
    title: title.trim() || 'Untitled design', recipient: '', sender: '', signature: '', identity: 'named',
    category: category || 'love', music: '', password: '', expiry: '',
    openingAnimation: design.experience.openingAnimation,
    backgroundEffect: design.experience.backgroundEffect,
  }));
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const update = (key, value) => setForm(state => ({ ...state, [key]: value }));
  const field = (key, label, options) => (
    <label className="studio-field">{label}<input value={form[key]} onChange={event => update(key, event.target.value)} {...options} /></label>
  );

  async function publish(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (!(await flush())) {
        setError('Save the draft successfully before publishing.');
        return;
      }
      const { expiry, ...input } = form;
      const entry = await publications.create({
        ...input, designId: draft.id, music: input.music || null,
        expiresAt: expiry ? new Date(expiry).toISOString() : null,
      });
      onPublish(entry);
    } catch (error) {
      setError(requestError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={preview ? 'Publication preview' : 'Publish your message'} onClose={onClose} wide={preview} busy={busy}>
      {preview ? (
        <>
          <Button variant="outline" onClick={() => setPreview(false)}>Back to publishing</Button>
          <div className="publication-preview"><RecipientExperience message={previewSnapshot(design, form, user.name)} /></div>
        </>
      ) : (
        <form className="publication-form" onSubmit={publish} aria-busy={busy}>
          <p className="studio-note">Publish a saved copy of this design. Later edits stay in your draft until you publish a new link.</p>
          <fieldset disabled={busy}>
            {field('title', 'Message title', { maxLength: 100, required: true })}
            <div className="publication-fields">
              {field('recipient', 'Recipient name (optional)', { maxLength: 80 })}
              <EffectSelect label="Sender identity" value={form.identity} options={identities} onChange={value => update('identity', value)} />
            </div>
            {form.identity === 'named' && field('sender', 'Sender name (optional)', { maxLength: 80, placeholder: user.name })}
            {form.identity === 'signature' && field('signature', 'Custom signature', { maxLength: 120, required: true })}
            {form.identity === 'anonymous' && <p className="studio-note">Your account name is hidden. Check the text and images in your design for details that identify you.</p>}
            <div className="publication-fields">
              <EffectSelect label="Experience style" value={form.category} options={moods} onChange={value => {
                const presets = { love: ['envelope', 'hearts'], anger: ['unfold', 'embers'], sadness: ['fade', 'rain'],
                  apology: ['unfold', 'petals'], 'secret-crush': ['envelope', 'stars'] };
                const [openingAnimation, backgroundEffect] = presets[value];
                setForm(state => ({ ...state, category: value, openingAnimation, backgroundEffect }));
              }} />
              <EffectSelect label="Opening animation" value={form.openingAnimation} options={openings} onChange={value => update('openingAnimation', value)} />
              <EffectSelect label="Background animation" value={form.backgroundEffect} options={effects} onChange={value => update('backgroundEffect', value)} />
              <EffectSelect label="Optional music" value={form.music} options={{ '': 'No music', ambient: 'Soft ambient tones' }} onChange={value => update('music', value)} />
              {field('password', 'Password (optional)', { type: 'password', maxLength: 72, minLength: 4, autoComplete: 'new-password' })}
              {field('expiry', 'Expires on (optional)', { type: 'datetime-local' })}
            </div>
          </fieldset>
          {error && <p className="studio-error" role="alert">{error}</p>}
          <div className="button-row">
            <Button variant="outline" disabled={busy} onClick={() => setPreview(true)}>Preview Experience</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Publishing…' : 'Publish Message'}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
