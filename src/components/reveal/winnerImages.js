// Pre-loaded mappings for the 20 refined gala award winner portraits
export const REFINED_PORTRAITS = [
  { name: 'Alao Miracle Olaoluwa', file: 'Alao Miracle Olaoluwa.png' },
  { name: 'Dr Abigail Iyilade', file: 'Iyilade.jpg' },
  { name: 'Iyilade', file: 'Iyilade.jpg' },
  { name: 'Ajayi Rhoda Ohunene', file: 'Ajayi Rhoda Ohunene.jpg' },
  { name: 'Luqman Agboola', file: 'Luqman-Agboola.jpg' },
  { name: 'Dr Olufemi Ajayi Oladunni', file: 'Dr Olufemi Ajayi Oladunni.jpg' },
  { name: 'Peter Popoola', file: 'Peter Popoola.jpg' },
  { name: 'Daniel Dickson', file: 'Daniel Dickson.jpg' },
  { name: 'Adara Christopher', file: 'Adara Christopher.jpg' },
  { name: 'Akilapa Oluwasegun', file: 'Akilapa Oluwasegun.jpg' },
  { name: 'Baba-Yusuf', file: 'Baba-Yusuf.jpg' },
  { name: 'Alao Bashir', file: 'Alao Bashir.jpg' },
  { name: 'Adekeye Mojisola', file: 'Adekeye Mojisola.jpg' },
  { name: 'Farayola Charles', file: 'Farayola Charles.jpg' },
  { name: 'Ibrahim Femi', file: 'Ibrahim femi.jpg' },
  { name: 'Isiaka Muhideen Ajadi', file: 'Isiaka Muhideen Ajadi.jpg' },
  { name: 'Mr Alakoso Abdulkareem', file: 'Mr Alakoso Abdulkareem.jpg' },
  { name: 'Odesola Oluwaseun', file: 'Odesola Oluwaseun.jpg' },
  { name: 'Olurinde Kingsley', file: 'Olurinde Kingsley.jpg' },
  { name: 'Olusegun Oni', file: 'Olusegun Oni.jpg' },
  { name: 'Temidayo Ogunrinde', file: 'Temidayo Ogunrinde.jpg' },
  { name: 'Dr Olasore', file: 'Dr Olasore.jpg' },
  { name: 'Olasore', file: 'Dr Olasore.jpg' }
];

function normalize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Resolves the refined gala portrait for a nominee or winner by name.
 * Uses exact matching, substring matching, and significant token matching.
 * Returns public URL path or null if no matching photo exists.
 */
export function getWinnerPhoto(name) {
  if (!name) return null;
  const target = normalize(name);

  // 1. Direct match on full normalized name
  for (const item of REFINED_PORTRAITS) {
    const candidate = normalize(item.name);
    if (candidate === target || candidate.includes(target) || target.includes(candidate)) {
      return `/winners/refined/${encodeURIComponent(item.file)}`;
    }
  }

  // 2. Token overlap matching (distinct words > 3 chars like "Iyilade", "Rhoda", "Dickson", "Miracle", "Popoola")
  const targetTokens = name.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
  for (const item of REFINED_PORTRAITS) {
    const itemTokens = item.name.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
    const hasOverlap = itemTokens.some((t) => targetTokens.includes(t));
    if (hasOverlap) {
      return `/winners/refined/${encodeURIComponent(item.file)}`;
    }
  }

  return null;
}

/**
 * Extracts clean 2-letter initials for luxury monogram fallback.
 */
export function getInitials(name) {
  if (!name) return '★';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
