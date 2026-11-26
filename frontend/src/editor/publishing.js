export const moods = {
  love: 'Love', anger: 'Anger', sadness: 'Sadness', apology: 'Apology', 'secret-crush': 'Secret Crush',
};
export const openings = { envelope: 'Envelope', unfold: 'Unfolding paper', fade: 'Gentle fade' };
export const effects = {
  none: 'None', hearts: 'Floating hearts', embers: 'Embers', rain: 'Rain', petals: 'Rose petals',
  stars: 'Starry night', butterflies: 'Butterflies',
};
export const identities = { named: 'Show my name', signature: 'Custom signature', anonymous: 'Hide my identity' };

export function toLocalDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function previewSnapshot(design, form, name) {
  const signature = form.identity === 'named' ? form.sender.trim() || name :
    form.identity === 'signature' ? form.signature.trim() : '';
  const positioned = design.elements.some(layer => layer.id === 'signature' && layer.visible);
  return {
    ...form, signature: positioned ? '' : signature, music: form.music || null,
    document: {
      ...design,
      elements: design.elements.flatMap(layer => layer.id !== 'signature' ? [layer] :
        signature ? [{ ...layer, content: signature }] : []),
      experience: { ...design.experience, openingAnimation: form.openingAnimation, backgroundEffect: form.backgroundEffect },
    },
  };
}
