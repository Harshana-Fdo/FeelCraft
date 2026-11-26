import { useEffect, useState } from 'react';
import { Copy, ExternalLink, QrCode, Share2 } from 'lucide-react';
import Button from '../ui/Button';
import Modal from './Modal';

export default function ShareDialog({ publication, onClose }) {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { url, title } = publication;
  const hostname = new URL(url).hostname;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(hostname);

  useEffect(() => {
    setStatus('');
    setError('');
  }, [url]);

  async function share() {
    try {
      await navigator.share({ title: 'A FeelCraft message', url });
    } catch (error) {
      if (error.name !== 'AbortError') setError('Device sharing failed. Copy the link to share it.');
    }
  }

  async function download() {
    setBusy(true);
    setError('');
    try {
      const { default: QRCode } = await import('qrcode');
      const href = await QRCode.toDataURL(url, { width: 640, margin: 3 });
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = 'feelcraft-message-qr.png';
      anchor.click();
      setStatus('QR code downloaded.');
    } catch {
      setError('The QR code could not be generated. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Share your message" onClose={onClose}>
      <p className="publication-subtitle">{title}</p>
      <label className="studio-field">Message URL
        <input value={url} readOnly onFocus={event => event.target.select()} />
      </label>
      {local && <p className="studio-note">This localhost link opens on this device. Use a deployed public URL to share it with someone else.</p>}
      <div className="publication-action-grid">
        <Button onClick={async () => {
          setError('');
          try { await navigator.clipboard.writeText(url); setStatus('Link copied.'); }
          catch { setError('Clipboard access failed. Select and copy the URL above.'); }
        }}><Copy size={16} aria-hidden="true" /> Copy Link</Button>
        <Button asChild variant="outline"><a href={'https://wa.me/?text=' + encodeURIComponent(url)} target="_blank" rel="noreferrer">Share via WhatsApp</a></Button>
        {typeof navigator.share === 'function' && <Button variant="outline" onClick={share}><Share2 size={16} aria-hidden="true" /> Native Share</Button>}
        <Button variant="outline" onClick={download} disabled={busy}><QrCode size={16} aria-hidden="true" /> {busy ? 'Generating…' : 'Download QR Code'}</Button>
        <Button asChild variant="outline"><a href={url} target="_blank" rel="noreferrer"><ExternalLink size={16} aria-hidden="true" /> Open Published Message</a></Button>
      </div>
      {status && <p className="publication-feedback" role="status">{status}</p>}
      {error && <p className="studio-error" role="alert">{error}</p>}
    </Modal>
  );
}
