import { CloudRain, Flower2, Heart, Sparkles, Zap } from 'lucide-react';

const symbols = { love: Heart, anger: Zap, sadness: CloudRain, apology: Flower2, 'secret-crush': Sparkles };

export default function FeelingIcon({ feeling, size = 21 }) {
  const Icon = symbols[feeling];
  return <Icon size={size} strokeWidth={1.55} aria-hidden="true" />;
}
