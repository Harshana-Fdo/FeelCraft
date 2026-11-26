const number = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const text = (value, max) => typeof value === 'string' && value.length <= max;
const color = value => typeof value === 'string' && /^#[a-f0-9]{6}$/i.test(value);
export const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function image(value) {
  if (!text(value, 650_000)) return false;
  const matches = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!matches) return false;
  const [, type, body] = matches;
  if (body.length % 4 !== 0) return false;
  const bytes = Buffer.from(body, 'base64');
  if (type === 'png') return bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
  if (type === 'jpeg') return bytes.subarray(0, 3).toString('hex') === 'ffd8ff';
  return bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
}

function element(layer) {
  if (!layer || !text(layer.id, 60) || !/^[\w-]+$/.test(layer.id) ||
    !number(layer.x, -4000, 4000) || !number(layer.y, -4000, 4000) ||
    !number(layer.width, 12, 4000) || !number(layer.rotation, -360, 360) ||
    !number(layer.opacity, 0, 1) || typeof layer.visible !== 'boolean' || typeof layer.locked !== 'boolean') return false;
  if (layer.animation != null && (!['fade-in', 'rise', 'none'].includes(layer.animation.type) ||
    !number(layer.animation.duration, 0, 4000) || !number(layer.animation.delay, 0, 3000))) return false;
  if (layer.type === 'text') {
    return text(layer.content, 3000) && number(layer.fontSize, 8, 360) && color(layer.fill) &&
      ['Inter', 'Playfair Display', 'Noto Sans Sinhala'].includes(layer.fontFamily) &&
      ['left', 'center', 'right'].includes(layer.align);
  }
  if (!number(layer.height, 12, 4000)) return false;
  if (layer.type === 'image') return image(layer.src);
  if (layer.type === 'shape') return ['rect', 'ellipse', 'star', 'heart'].includes(layer.shape) && color(layer.fill);
  return layer.type === 'decoration' && ['botanical', 'sage', 'butterfly', 'moon', 'lines', 'flower'].includes(layer.asset);
}

export function validateDraft(body, updating = false) {
  if (!body || !text(body.title, 100) || !body.title.trim() ||
    (updating && (!Number.isSafeInteger(body.revision) || body.revision < 1)) ||
    (!updating && body.templateSlug != null && (typeof body.templateSlug !== 'string' || !/^[a-z0-9-]{1,64}$/.test(body.templateSlug)))) return false;
  const document = body.document;
  if (!document || document.schemaVersion !== 1) return false;
  const { canvas, elements, experience } = document;
  if (!canvas || !Number.isInteger(canvas.width) || !Number.isInteger(canvas.height) ||
    !number(canvas.width, 240, 2400) || !number(canvas.height, 240, 2400) || !canvas.background) return false;
  const background = canvas.background;
  if (!(background.type === 'color' && color(background.value)) &&
    !(background.type === 'image' && image(background.value))) return false;
  return Array.isArray(elements) && elements.length <= 80 &&
    elements.every(element) && new Set(elements.map(layer => layer.id)).size === elements.length &&
    experience && ['envelope', 'unfold', 'fade'].includes(experience.openingAnimation) &&
    ['none', 'hearts', 'embers', 'rain', 'petals', 'stars'].includes(experience.backgroundEffect) &&
    experience.music === null;
}
