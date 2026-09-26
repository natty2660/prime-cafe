import { Restaurant, Category, MenuItem, MenuResponse, MealTime } from '../types/index.ts';
import { PRIME_CAFE_RESTAURANT, SEED_CATEGORIES, SEED_MENU_ITEMS } from '../data/seedData.ts';

const STORAGE_KEY = 'prime_cafe_store_v15';

export interface DatabaseState {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
  last_updated: string;
  admin_password?: string;
}

export function getInitialState(): DatabaseState {
  return {
    restaurant: { ...PRIME_CAFE_RESTAURANT },
    categories: [...SEED_CATEGORIES],
    items: [...SEED_MENU_ITEMS],
    last_updated: new Date().toISOString(),
  };
}

/**
 * Robust reconciliation engine that guarantees categories (including Casariyo)
 * and items (Keks, Sambuus, Mulawah, Cambaabur, Chips) are properly mapped,
 * while preserving any user-modified prices from admin edits.
 */
export function reconcileDatabaseState(state: DatabaseState): DatabaseState {
  const fresh = getInitialState();
  const seedItemMap = new Map(SEED_MENU_ITEMS.map((item) => [item.id, item]));

  // Ensure categories always match the definitive sequence including Casariyo
  const categories = [...SEED_CATEGORIES];

  const existingItems = Array.isArray(state?.items) ? state.items : [];
  const existingMap = new Map(existingItems.map((item) => [item.id, item]));

  const items = SEED_MENU_ITEMS.map((seedItem) => {
    const existing = existingMap.get(seedItem.id);
    if (existing) {
      return {
        ...seedItem,
        price: typeof existing.price === 'number' && existing.price > 0 ? existing.price : seedItem.price,
        is_available: existing.is_available !== undefined ? existing.is_available : seedItem.is_available,
        is_popular: existing.is_popular !== undefined ? existing.is_popular : seedItem.is_popular,
        image_url: seedItem.image_url || existing.image_url,
      };
    }
    return { ...seedItem };
  });

  return {
    restaurant: {
      ...fresh.restaurant,
      ...(state?.restaurant || {}),
      address: 'Jijiga, Ethiopia',
      opening_hours: '8:30 AM – 10:00 PM Daily',
      wifi_available: false,
    },
    categories,
    items,
    last_updated: state?.last_updated || new Date().toISOString(),
    admin_password: state?.admin_password,
  };
}

export function loadClientState(): DatabaseState {
  if (typeof window === 'undefined') {
    return getInitialState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialState();
      saveClientState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as DatabaseState;
    const reconciled = reconcileDatabaseState(parsed);
    saveClientState(reconciled);
    return reconciled;
  } catch (e) {
    console.warn('Failed reading client state, using fallback:', e);
    return getInitialState();
  }
}

export function saveClientState(state: DatabaseState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed saving client state to localStorage:', e);
  }
}

// Format prices strictly in Ethiopian Birr whole integers
export function formatBirr(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 Birr';
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString('en-US')} Birr`;
}

// Validate price inputs: integer Birr only, > 0, <= 100000
export function validateBirrPrice(value: string | number): { valid: boolean; value: number; error?: string } {
  const num = typeof value === 'string' ? Number(value.trim()) : value;
  if (isNaN(num)) {
    return { valid: false, value: 0, error: 'Price must be a valid number in Ethiopian Birr.' };
  }
  if (!Number.isInteger(num)) {
    return { valid: false, value: Math.round(num), error: 'Price must be a whole integer in Birr (no decimals).' };
  }
  if (num <= 0) {
    return { valid: false, value: num, error: 'Price must be greater than zero Birr.' };
  }
  if (num > 100000) {
    return { valid: false, value: num, error: 'Price cannot exceed 100,000 Birr.' };
  }
  return { valid: true, value: num };
}

// Meal time detector: defaults to 'all' (Full Menu) as requested
export function getSuggestedMealTime(_date = new Date()): MealTime {
  return 'all';
}

// Generate menu response for a given slug
export function buildMenuResponse(state: DatabaseState, slug = 'prime-cafe'): MenuResponse | null {
  const reconciled = reconcileDatabaseState(state);
  if (reconciled.restaurant.slug !== slug) {
    return null;
  }

  // Sort categories by display_order
  const sortedCategories = [...reconciled.categories].sort((a, b) => a.display_order - b.display_order);

  // Sort items by display_order
  const sortedItems = [...reconciled.items].sort((a, b) => a.display_order - b.display_order);

  return {
    restaurant: reconciled.restaurant,
    categories: sortedCategories,
    items: sortedItems,
    generated_at: new Date().toISOString(),
  };
}
