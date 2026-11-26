import { Heart, Layers3, Send } from 'lucide-react';

const steps = [
  { icon: Heart, title: 'Start with a feeling', text: 'Choose the emotion you want to express and find a design that feels right for it.' },
  { icon: Layers3, title: 'Make it personal', text: 'Write your own words, adjust the design and choose how your letter opens.' },
  { icon: Send, title: 'Share it privately', text: 'When publishing is available, send a private link. The recipient will be able to open it without an account.' },
];

export default function Process() {
  return (
    <ol className="process-list">
      {steps.map(({ icon: Icon, title, text }) => (
        <li key={title}>
          <span className="process-icon"><Icon size={24} strokeWidth={1.5} aria-hidden="true" /></span>
          <h3>{title}</h3>
          <p>{text}</p>
        </li>
      ))}
    </ol>
  );
}
