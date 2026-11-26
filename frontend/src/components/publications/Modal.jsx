import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, wide = false, busy = false }) {
  const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current;
    node.showModal();
    return () => node.close();
  }, []);
  return (
    <dialog ref={dialog} aria-label={title} className={wide ? 'publication-modal publication-wide' : 'publication-modal'}
      onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
      <header className="publication-modal-header">
        <h2>{title}</h2>
        <button type="button" aria-label={'Close ' + title} disabled={busy} onClick={onClose}><X size={20} aria-hidden="true" /></button>
      </header>
      <div className="publication-modal-content">{children}</div>
    </dialog>
  );
}
