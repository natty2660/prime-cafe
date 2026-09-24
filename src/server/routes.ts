import { Router, Request, Response, NextFunction } from 'express';
import {
  getDatabase,
  saveDatabase,
  generateAdminToken,
  verifyAdminToken,
  checkAdminPassword,
} from './db.ts';
import { buildMenuResponse, validateBirrPrice } from '../lib/storage.ts';
import { generateQRCodeDataUrl } from '../lib/qr.ts';
import { MenuItem, Category } from '../types/index.ts';

export const apiRouter = Router();

// Middleware: Require Admin Authentication
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!verifyAdminToken(authHeader)) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
    return;
  }
  next();
};

// 1. Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Prime Cafe QR Menu API', timestamp: new Date().toISOString() });
});

// 2. Public Menu Fetch by Slug (Single-query fast fetch)
apiRouter.get('/menu/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const db = getDatabase();
  const menu = buildMenuResponse(db, slug);

  if (!menu) {
    res.status(404).json({ error: `Menu not found for restaurant slug "${slug}".` });
    return;
  }

  res.json(menu);
});

// 3. Admin Login
apiRouter.post('/admin/login', (req: Request, res: Response) => {
  const { password } = req.body || {};
  if (!password || !checkAdminPassword(password)) {
    res.status(401).json({ message: 'Invalid admin credentials.' });
    return;
  }

  const token = generateAdminToken();
  res.json({
    token,
    role: 'admin',
    message: 'Welcome to Prime Cafe staff portal',
  });
});

// 4. Admin Verify
apiRouter.get('/admin/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (verifyAdminToken(authHeader)) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

// 5. Get Restaurant Profile
apiRouter.get('/restaurants', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.restaurant);
});

// 6. Update Restaurant Profile (Auth)
apiRouter.put('/restaurants', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const updated = {
    ...db.restaurant,
    ...req.body,
    slug: db.restaurant.slug, // Slug is immutable to preserve QR codes!
    updated_at: new Date().toISOString(),
  };

  db.restaurant = updated;
  saveDatabase(db);
  res.json(db.restaurant);
});

// 7. Update Item Price (Auth & Birr Validation)
apiRouter.put('/items/:id/price', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { price } = req.body;

  const validation = validateBirrPrice(price);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const db = getDatabase();
  const itemIndex = db.items.findIndex((i) => i.id === id);
  if (itemIndex === -1) {
    res.status(404).json({ error: 'Item not found.' });
    return;
  }

  db.items[itemIndex].price = validation.value;
  db.items[itemIndex].updated_at = new Date().toISOString();
  saveDatabase(db);

  res.json(db.items[itemIndex]);
});

// 8. Update Item (Auth)
apiRouter.put('/items/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const itemIndex = db.items.findIndex((i) => i.id === id);

  if (itemIndex === -1) {
    res.status(404).json({ error: 'Item not found.' });
    return;
  }

  if (req.body.price !== undefined) {
    const validation = validateBirrPrice(req.body.price);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }
    req.body.price = validation.value;
  }

  db.items[itemIndex] = {
    ...db.items[itemIndex],
    ...req.body,
    id,
    updated_at: new Date().toISOString(),
  };

  saveDatabase(db);
  res.json(db.items[itemIndex]);
});

// 9. Add or Upsert Item (Auth)
apiRouter.post('/items', requireAdmin, (req: Request, res: Response) => {
  const itemData: MenuItem = req.body;

  if (!itemData.name || itemData.name.trim() === '') {
    res.status(400).json({ error: 'Dish name is required.' });
    return;
  }

  const validation = validateBirrPrice(itemData.price);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const db = getDatabase();
  const existingIdx = db.items.findIndex((i) => i.id === itemData.id);

  if (existingIdx !== -1) {
    db.items[existingIdx] = {
      ...itemData,
      price: validation.value,
      updated_at: new Date().toISOString(),
    };
  } else {
    const newItem: MenuItem = {
      ...itemData,
      id: itemData.id || `item_${Date.now()}`,
      restaurant_id: db.restaurant.id,
      price: validation.value,
      display_order: itemData.display_order || db.items.length + 1,
      is_available: itemData.is_available !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.items.push(newItem);
  }

  saveDatabase(db);
  res.status(201).json({ success: true, items: db.items });
});

// 10. Delete Item (Auth)
apiRouter.delete('/items/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  db.items = db.items.filter((i) => i.id !== id);
  saveDatabase(db);
  res.json({ success: true, remaining: db.items.length });
});

// 11. Sync Entire Item List (Auth)
apiRouter.post('/items/sync', requireAdmin, (req: Request, res: Response) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    res.status(400).json({ error: 'Items must be an array.' });
    return;
  }

  const db = getDatabase();
  db.items = items;
  saveDatabase(db);
  res.json({ success: true, count: db.items.length });
});

// 12. Add Category (Auth)
apiRouter.post('/categories', requireAdmin, (req: Request, res: Response) => {
  const catData: Category = req.body;
  if (!catData.name) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }

  const db = getDatabase();
  const newCat: Category = {
    ...catData,
    id: catData.id || `cat_${Date.now()}`,
    restaurant_id: db.restaurant.id,
    display_order: catData.display_order || db.categories.length + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.categories.push(newCat);
  saveDatabase(db);
  res.status(201).json(newCat);
});

// 13. Sync Categories (Auth)
apiRouter.post('/categories/sync', requireAdmin, (req: Request, res: Response) => {
  const { categories } = req.body;
  if (!Array.isArray(categories)) {
    res.status(400).json({ error: 'Categories must be an array.' });
    return;
  }

  const db = getDatabase();
  db.categories = categories;
  saveDatabase(db);
  res.json({ success: true, count: db.categories.length });
});

// 14. Delete Category (Auth)
apiRouter.delete('/categories/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const hasItems = db.items.some((i) => i.category_id === id);

  if (hasItems) {
    res.status(400).json({ error: 'Cannot delete category that still contains dishes.' });
    return;
  }

  db.categories = db.categories.filter((c) => c.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// 15. Server-side QR Generator
apiRouter.get('/qr/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const menuUrl = process.env.PUBLIC_BASE_URL
    ? `${process.env.PUBLIC_BASE_URL}/menu/${slug}`
    : `${protocol}://${host}/menu/${slug}`;

  try {
    const dataUrl = await generateQRCodeDataUrl({
      url: menuUrl,
      size: 1024,
      darkColor: '#2B1A12',
      lightColor: '#EFEBE9',
    });

    res.json({
      slug,
      url: menuUrl,
      dataUrl,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed generating QR code.' });
  }
});
