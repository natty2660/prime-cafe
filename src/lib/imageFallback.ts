// Helper for robust cross-environment image delivery between Vercel static CDN and local assets

const SPECIAL_CANONICAL_MAP: Record<string, string> = {
  // Timestamp -> Clean
  'gourmet_burger_fries_1790216748392.jpg': 'primecafe_burger.jpg',
  'prime_cafe_dibs_1790215853921.jpg': 'primecafe_dibs.jpg',
  'prime_cafe_macchiato_1790215844194.jpg': 'primecafe_macchiato.jpg',
  'artisan_cappuccino_1790235086488.jpg': 'primecafe_cappuccino.jpg',
  'prime_cafe_fuul_1790215834088.jpg': 'primecafe_fuul.jpg',
  'iced_latte_glass_1790235076500.jpg': 'primecafe_iced_latte.jpg',
  'iced_spanish_latte_1790235097521.jpg': 'primecafe_iced_spanish_latte.jpg',
  'fresh_fruit_juice_1790235112270.jpg': 'primecafe_orange_juice.jpg',
  'gourmet_milkshake_1790235124208.jpg': 'primecafe_vanilla_milkshake.jpg',
  'artisan_ice_cream_1790216736113.jpg': 'primecafe_vanilla_ice_cream.jpg',
  'prime_cafe_wall_logo_1790230397113.jpg': 'prime_cafe_luxury_bg_1790216722377.jpg',
  'primecafe_keks_1790388963236.jpg': 'primecafe_bankeke_1790236996406.jpg',
};

// Build reverse map for clean -> timestamp
const SPECIAL_REVERSE_MAP: Record<string, string> = {};
for (const [ts, clean] of Object.entries(SPECIAL_CANONICAL_MAP)) {
  SPECIAL_REVERSE_MAP[clean] = ts;
}

/**
 * Returns an alternative valid URL for an image asset.
 * If the current URL has a timestamp, returns the clean canonical slug URL.
 * If the current URL is clean, returns the timestamped URL counterpart.
 */
export function getAlternativeImageUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;

  const prefix = '/assets/images/';
  if (!url.startsWith(prefix)) return null;

  const filename = url.replace(prefix, '');

  // 1. Check special custom mappings
  if (SPECIAL_CANONICAL_MAP[filename]) {
    return `${prefix}${SPECIAL_CANONICAL_MAP[filename]}`;
  }
  if (SPECIAL_REVERSE_MAP[filename]) {
    return `${prefix}${SPECIAL_REVERSE_MAP[filename]}`;
  }

  // 2. Generic timestamp remover: any prefix like primecafe_xxx_123.jpg or artisan_xxx_123.jpg -> xxx.jpg
  const timestampRegex = /^([a-z0-9_]+)_\d{10,15}\.(jpg|png)$/i;
  const matchTimestamp = filename.match(timestampRegex);
  if (matchTimestamp) {
    const cleanName = `${matchTimestamp[1]}.${matchTimestamp[2]}`;
    if (cleanName !== filename) {
      return `${prefix}${cleanName}`;
    }
  }

  return null;
}
