// Bundled starter collection for browser-local mode. The API catalog takes precedence when available.
export const categories = [
  { slug: 'love', name: 'Love', prompt: 'For the ones who feel like home.', description: 'Celebrate the little things, say what you admire, or put a lifetime of affection into a single note.', styles: 'Soft rose, hand-drawn botanicals and an envelope reveal.' },
  { slug: 'anger', name: 'Anger', prompt: 'Say the hard things with care.', description: 'Make room for frustration and hurt. Use this space to say what happened, how it felt, and what you need going forward.', styles: 'Burgundy ink, graphic lines and a deliberate paper reveal.' },
  { slug: 'sadness', name: 'Sadness', prompt: 'A little space for heavy days.', description: 'Reach across the quiet with a gentle message about what you miss, what hurts, or how much someone means to you.', styles: 'Moonlight, rain and a soft blue palette.' },
  { slug: 'apology', name: 'Apology', prompt: 'Find the words to begin again.', description: 'Own the hurt, offer a sincere apology and give the other person room to respond in their own time.', styles: 'Warm paper, sage leaves and a gentle unfolding motion.' },
  { slug: 'secret-crush', name: 'Secret Crush', prompt: 'For what’s still unsaid.', description: 'Give a quiet admiration a little room to flutter, with something light, kind and unexpected.', styles: 'Lilac, hand-drawn butterflies and little points of starlight.' },
];

const starters = [
  { slug: 'eternal-love', category: 'love', name: 'Eternal Love', style: 'Romantic', tier: 'free', ink: '#743b4c', paper: '#f7e7e5', decoration: 'botanical', openingAnimation: 'envelope', backgroundEffect: 'hearts', label: 'A LITTLE LOVE LETTER', cover: 'Eternal Love', heading: 'The little things', message: 'The way you laugh before the joke is over. The tea you leave at my desk. The way a whole day feels softer when you’re in it. I love all of it, and I love you.', signature: 'With all my love' },
  { slug: 'unspoken-words', category: 'anger', name: 'Unspoken Words', style: 'Editorial', tier: 'free', ink: '#fff1e8', paper: '#623046', decoration: 'lines', openingAnimation: 'unfold', backgroundEffect: 'embers', label: 'WORDS I’VE HELD ON TO', cover: 'Unspoken Words', heading: 'Can we talk?', message: 'I felt hurt when our plans changed and I only found out later. I’d like us to talk about what happened, and I need a little more notice next time.', signature: 'When you’re ready to talk' },
  { slug: 'silent-tears', category: 'sadness', name: 'Silent Tears', style: 'Atmospheric', tier: 'free', ink: '#334d63', paper: '#dce9f3', decoration: 'moon', openingAnimation: 'fade', backgroundEffect: 'rain', label: 'UNDER THE SAME SKY', cover: 'Silent Tears', heading: 'I miss you today', message: 'Some days it’s the smallest things that remind me of you. The rain against the windows did it this morning. I wanted you to know I was thinking of you.', signature: 'From across the miles' },
  { slug: 'truly-sorry', category: 'apology', name: 'I’m Truly Sorry', style: 'Botanical', tier: 'premium', ink: '#385042', paper: '#e5eadb', decoration: 'sage', openingAnimation: 'unfold', backgroundEffect: 'petals', label: 'AN OFFERING OF PEACE', cover: 'I’m Truly Sorry', heading: 'I owe you an apology', message: 'I spoke before I listened, and what I said hurt you. I’m sorry. I’ll give you the space you need, and when you’re ready, I’d like to hear how this felt for you.', signature: 'With love and care' },
  { slug: 'secret-admirer', category: 'secret-crush', name: 'Secret Admirer', style: 'Whimsical', tier: 'premium', ink: '#5b4373', paper: '#eae0f4', decoration: 'butterfly', openingAnimation: 'envelope', backgroundEffect: 'stars', label: 'A SMALL CONFESSION', cover: 'Secret Admirer', heading: 'You make me smile', message: 'You have a way of making an ordinary room a little brighter. I thought you should know someone notices. I hope today gives you as many reasons to smile as you give me.', signature: '' },
];

function designDocument(template) {
  const text = (id, content, y, fontSize, fontFamily = 'Playfair Display') => ({
    id, type: 'text', content, x: 110, y, width: 860, fontSize, fontFamily,
    fill: template.ink, rotation: 0, opacity: 1, locked: false, visible: true, align: 'center',
    animation: { type: 'fade-in', duration: 520, delay: id === 'signature' ? 180 : 0 },
  });

  return {
    schemaVersion: 1,
    canvas: { width: 1080, height: 1350, background: { type: 'color', value: template.paper } },
    elements: [
      { id: 'ornament', type: 'decoration', asset: template.decoration, x: 405, y: 116, width: 270, height: 270, rotation: 0, opacity: 1, locked: false, visible: true },
      text('heading', template.heading, 408, 104),
      text('message', template.message, 713, 45, 'Inter'),
      ...(template.signature ? [text('signature', template.signature, 1110, 60)] : []),
    ],
    experience: { openingAnimation: template.openingAnimation, backgroundEffect: template.backgroundEffect, music: null },
  };
}

export const templates = starters.map(template => ({
  ...template, id: template.slug, version: 1, status: 'published',
  tags: [template.category, template.style.toLowerCase()],
  document: designDocument(template),
}));

export function getCategory(slug) {
  return categories.find(category => category.slug === slug);
}

export function getTemplate(slug) {
  return templates.find(template => template.slug === slug);
}
