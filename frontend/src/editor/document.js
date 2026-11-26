export const fonts = ['Inter', 'Playfair Display', 'Noto Sans Sinhala'];
export const openingEffects = { envelope: 'Envelope', unfold: 'Unfold', fade: 'Fade' };
export const backgroundEffects = { none: 'None', hearts: 'Floating hearts', embers: 'Embers', rain: 'Rain', petals: 'Petals', stars: 'Stars' };

export const fontCss = {
  Inter: '"Inter Variable", "Noto Sans Sinhala", sans-serif',
  'Playfair Display': '"Playfair Display Variable", "Noto Sans Sinhala", Georgia, serif',
  'Noto Sans Sinhala': '"Noto Sans Sinhala", sans-serif',
};

export function newDraft(template) {
  if (template) return { title: template.name, templateSlug: template.slug, document: structuredClone(template.document) };
  return {
    title: 'Untitled design', templateSlug: null,
    document: {
      schemaVersion: 1,
      canvas: { width: 1080, height: 1350, background: { type: 'color', value: '#fffdf8' } },
      elements: [],
      experience: { openingAnimation: 'envelope', backgroundEffect: 'none', music: null },
    },
  };
}

export function newLayer(type, canvas, props = {}) {
  const width = props.width ?? (type === 'text' ? Math.min(canvas.width - 24, 580) : 220);
  const height = props.height ?? 220;
  return {
    id: crypto.randomUUID(), type, width,
    x: Math.round((canvas.width - width) / 2), y: Math.round(canvas.height * .38),
    rotation: 0, opacity: 1, locked: false, visible: true,
    ...(type === 'text'
      ? { content: 'Your text here', fontSize: 64, fontFamily: 'Inter', align: 'center', fill: '#35242e' }
      : { height }),
    ...props,
  };
}

export function layerName(layer) {
  if (layer.type === 'text') return layer.content.trim().slice(0, 45) || 'Empty text';
  if (layer.type === 'image') return 'Photo';
  return { botanical: 'Botanical', sage: 'Sage', moon: 'Moon', lines: 'Lines', rect: 'Rectangle' }[layer.asset || layer.shape] ||
    (layer.asset || layer.shape || layer.type).replace(/^./, letter => letter.toUpperCase());
}

export async function importPhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) {
    throw new Error('Choose a PNG, JPEG or WebP file under 12 MB.');
  }
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 32_000_000) throw new Error('Choose a photo under 32 megapixels.');
    const canvas = document.createElement('canvas');
    const factor = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * factor));
    canvas.height = Math.max(1, Math.round(bitmap.height * factor));
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let src = canvas.toDataURL('image/webp', .84);
    if (src.length > 650_000) src = canvas.toDataURL('image/webp', .55);
    if (src.length > 650_000) throw new Error('This photo could not be compressed enough. Choose a smaller file.');
    return { src, width: canvas.width, height: canvas.height };
  } finally {
    bitmap.close();
  }
}
