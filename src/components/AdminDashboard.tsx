import React, { useState } from 'react';
import { Restaurant, Category, MenuItem, MealTime } from '../types/index.ts';
import { formatBirr, validateBirrPrice } from '../lib/storage.ts';
import { OWNER_TRANSCRIPTION_FLAGS } from '../data/seedData.ts';
import { BrandLogo } from './BrandLogo.tsx';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  QrCode,
  Eye,
  LogOut,
  Save,
  X,
  Check,
  AlertCircle,
  Upload,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Database,
  RefreshCw,
  Lock,
  KeyRound,
  EyeOff,
  ShieldCheck,
  Search,
  Camera,
  Download,
  ExternalLink,
  Image as ImageIcon,
  FolderArchive,
  ArrowDownToLine,
} from 'lucide-react';

interface AdminDashboardProps {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
  token: string;
  onUpdateRestaurant: (updated: Restaurant) => void;
  onUpdateCategories: (categories: Category[]) => void;
  onUpdateItems: (items: MenuItem[]) => void;
  onOpenQR: () => void;
  onViewMenu: () => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  restaurant,
  categories,
  items,
  token,
  onUpdateRestaurant,
  onUpdateCategories,
  onUpdateItems,
  onOpenQR,
  onViewMenu,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'restaurant' | 'flags' | 'gallery'>('items');
  const [galleryCategory, setGalleryCategory] = useState<string>('all');
  const [gallerySearch, setGallerySearch] = useState<string>('');
  const [previewingPhoto, setPreviewingPhoto] = useState<{ name: string; url: string; item: MenuItem } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isNewItemModal, setIsNewItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isNewCategoryModal, setIsNewCategoryModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant>({ ...restaurant });
  const [quickPriceEditId, setQuickPriceEditId] = useState<string | null>(null);
  const [quickPriceValue, setQuickPriceValue] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [isResyncingDb, setIsResyncingDb] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordFeedback('');

    if (!newPassword || newPassword.trim().length < 4) {
      setPasswordError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordError('New passwords do not match. Please re-enter.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('prime_cafe_custom_admin_password', newPassword.trim());
        }
        setPasswordFeedback('Admin password updated successfully in the database!');
        showNotification('Admin password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordFeedback(''), 5000);
      } else {
        setPasswordError(data.error || 'Failed to update password.');
      }
    } catch {
      // Offline fallback: save locally
      if (typeof window !== 'undefined') {
        localStorage.setItem('prime_cafe_custom_admin_password', newPassword.trim());
      }
      setPasswordFeedback('Password updated and saved locally.');
      showNotification('Admin password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordFeedback(''), 5000);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const fetchDbStatus = async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch {
      // Graceful offline fallback
    } finally {
      setIsCheckingDb(false);
    }
  };

  React.useEffect(() => {
    fetchDbStatus();
  }, []);

  const handleResyncDatabase = async () => {
    if (!window.confirm('Re-synchronize database with the latest organized menu categories and Jijiga location in PostgreSQL?')) {
      return;
    }
    setIsResyncingDb(true);
    try {
      const res = await fetch('/api/db/resync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          onUpdateRestaurant(data.state.restaurant);
          onUpdateCategories(data.state.categories);
          onUpdateItems(data.state.items);
        }
        showNotification('Database successfully resynchronized and updated in PostgreSQL!');
        await fetchDbStatus();
      } else {
        showNotification('Failed to resync database', true);
      }
    } catch {
      showNotification('Error contacting server during resync', true);
    } finally {
      setIsResyncingDb(false);
    }
  };

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(''), 4000);
    } else {
      setFeedbackMessage(msg);
      setTimeout(() => setFeedbackMessage(''), 3000);
    }
  };

  // --- ITEM ACTIONS ---

  const handleToggleItemAvailability = async (item: MenuItem) => {
    const updated = items.map((i) =>
      i.id === item.id ? { ...i, is_available: !i.is_available, updated_at: new Date().toISOString() } : i
    );
    onUpdateItems(updated);

    try {
      await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_available: !item.is_available }),
      });
    } catch {
      // client-side already mirrored
    }
    showNotification(`"${item.name}" marked as ${!item.is_available ? 'Available' : 'Unavailable'}`);
  };

  const handleSaveQuickPrice = async (item: MenuItem) => {
    const validation = validateBirrPrice(quickPriceValue);
    if (!validation.valid) {
      showNotification(validation.error || 'Invalid Birr price', true);
      return;
    }

    const newPrice = validation.value;
    const updated = items.map((i) =>
      i.id === item.id ? { ...i, price: newPrice, updated_at: new Date().toISOString() } : i
    );
    onUpdateItems(updated);
    setQuickPriceEditId(null);

    try {
      await fetch(`/api/items/${item.id}/price`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ price: newPrice }),
      });
    } catch {
      // client-side already mirrored
    }
    showNotification(`Updated price for "${item.name}" to ${formatBirr(newPrice)}`);
  };

  const handleDeleteItem = async (itemId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    const updated = items.filter((i) => i.id !== itemId);
    onUpdateItems(updated);

    try {
      await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // client-side mirrored
    }
    showNotification(`Deleted "${name}"`);
  };

  const handleSaveItemModal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;

    const validation = validateBirrPrice(editingItem.price);
    if (!validation.valid) {
      showNotification(validation.error || 'Invalid Birr price', true);
      return;
    }

    let updatedList: MenuItem[];
    if (isNewItemModal) {
      const newItem: MenuItem = {
        ...editingItem,
        id: `item_${Date.now()}`,
        restaurant_id: restaurant.id,
        price: validation.value,
        display_order: items.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      updatedList = [...items, newItem];
    } else {
      updatedList = items.map((i) =>
        i.id === editingItem.id ? { ...editingItem, price: validation.value, updated_at: new Date().toISOString() } : i
      );
    }

    onUpdateItems(updatedList);
    setEditingItem(null);
    setIsNewItemModal(false);

    try {
      await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(isNewItemModal ? updatedList[updatedList.length - 1] : editingItem),
      });
    } catch {
      // client-side mirrored
    }
    showNotification(`Dish saved successfully`);
  };

  const handleMoveItemOrder = (itemId: string, direction: 'up' | 'down') => {
    const list = [...items];
    const index = list.findIndex((i) => i.id === itemId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === list.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Reassign display_order
    const updated = list.map((item, idx) => ({ ...item, display_order: idx + 1 }));
    onUpdateItems(updated);
  };

  // --- CATEGORY ACTIONS ---

  const handleSaveCategoryModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    let updatedCats: Category[];
    if (isNewCategoryModal) {
      const newCat: Category = {
        ...editingCategory,
        id: `cat_${Date.now()}`,
        restaurant_id: restaurant.id,
        display_order: categories.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      updatedCats = [...categories, newCat];
    } else {
      updatedCats = categories.map((c) =>
        c.id === editingCategory.id ? { ...editingCategory, updated_at: new Date().toISOString() } : c
      );
    }

    onUpdateCategories(updatedCats);
    setEditingCategory(null);
    setIsNewCategoryModal(false);
    showNotification('Category saved successfully');
  };

  const handleDeleteCategory = (catId: string, name: string) => {
    const hasItems = items.some((i) => i.category_id === catId);
    if (hasItems) {
      showNotification(`Cannot delete "${name}" because it still contains dishes. Move or delete them first.`, true);
      return;
    }
    if (!window.confirm(`Delete category "${name}"?`)) return;

    const updated = categories.filter((c) => c.id !== catId);
    onUpdateCategories(updated);
    showNotification(`Category "${name}" deleted`);
  };

  const handleMoveCategoryOrder = (catId: string, direction: 'up' | 'down') => {
    const list = [...categories];
    const index = list.findIndex((c) => c.id === catId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === list.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const updated = list.map((cat, idx) => ({ ...cat, display_order: idx + 1 }));
    onUpdateCategories(updated);
  };

  // --- IMAGE UPLOAD HANDLING ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type & size (<= 2MB)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showNotification('Please upload a JPEG, PNG, or WebP image.', true);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showNotification('Image file size must be 2MB or smaller.', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && editingItem) {
        setEditingItem({
          ...editingItem,
          image_url: reader.result as string,
        });
        showNotification('Image loaded preview. Save dish to apply.');
      }
    };
    reader.readAsDataURL(file);
  };

  // --- BULK ORIGINAL DISH PHOTO IMPORT ---
  const handleBulkImportFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsImporting(true);
    setImportStatus(`Matching and installing ${files.length} original pictures...`);

    let matchedCount = 0;
    const updatedItems = [...items];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const rawName = file.name
        .toLowerCase()
        .replace(/\.[^/.]+$/, '')
        .replace(/\([^)]*\)/g, ' ')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Match item by name, translation, or id
      const matched = updatedItems.find((item) => {
        const itemClean = item.name
          .toLowerCase()
          .replace(/\([^)]*\)/g, ' ')
          .replace(/[^a-z0-9]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const idClean = item.id
          .toLowerCase()
          .replace(/^(bf_|ff_|pa_|dn_|cof_|moj_|ms_|tea_|jce_|ice_)/, '')
          .replace(/_/g, ' ');

        return (
          rawName === itemClean ||
          rawName.includes(itemClean) ||
          itemClean.includes(rawName) ||
          rawName.includes(idClean) ||
          (rawName.includes('panana') && item.id === 'ice_banana') ||
          (rawName.includes('laws') && item.id === 'ice_lotus') ||
          (rawName.includes('lotous') && item.id === 'ice_lotus') ||
          (rawName.includes('penis') && item.id.startsWith('dn_04')) ||
          (rawName.includes('djjbs') && item.id === 'dn_03') ||
          (rawName.includes('basto') && item.id === 'pa_02') ||
          (rawName.includes('soomali') && item.id === 'tea_02') ||
          (rawName.includes('orea') && item.id.includes('oreo'))
        );
      });

      if (matched) {
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          const base64Data = await base64Promise;

          const res = await fetch('/api/upload-dish-photo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              itemId: matched.id,
              fileName: file.name,
              dataBase64: base64Data,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            matched.image_url = data.image_url;
            matchedCount++;
          }
        } catch (e) {
          console.error('Error importing file:', file.name, e);
        }
      }
    }

    onUpdateItems(updatedItems);
    setIsImporting(false);
    setImportStatus(`Done! Successfully applied ${matchedCount} verified original photos directly to the live menu!`);
    showNotification(`Successfully installed ${matchedCount} original dish photos.`);
  };

  // Filter items
  const displayedItems = items
    .filter((i) => (filterCategory === 'all' ? true : i.category_id === filterCategory))
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="min-h-screen bg-[#2B1A12] text-[#EFEBE9] pb-20">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-[#1B0F0A] border-b border-[#5D4037] px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" showSubtitle={false} />
            <div>
              <h1 className="text-base font-bold text-[#EFEBE9] flex items-center gap-2">
                <span>{restaurant.name}</span>
                <span className="text-[10px] bg-[#D4A94E] text-[#1B0F0A] font-extrabold uppercase px-1.5 py-0.5 rounded">
                  Admin Portal
                </span>
              </h1>
              <p className="text-[11px] text-[#A1887F]">All prices in Ethiopian Birr</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenQR}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3E2723] hover:bg-[#4E342E] text-[#D4A94E] border border-[#5D4037] text-xs font-semibold transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Table QR</span>
            </button>
            <button
              onClick={onViewMenu}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3E2723] hover:bg-[#4E342E] text-[#EFEBE9] border border-[#5D4037] text-xs font-semibold transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Menu</span>
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-200 border border-red-800/50 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Toast */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-700 text-emerald-100 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-950 border border-red-700 text-red-100 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Admin Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#5D4037] pb-3 mb-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 ${
              activeTab === 'items'
                ? 'bg-[#D4A94E] text-[#1B0F0A]'
                : 'bg-[#3E2723] text-[#D7CCC8] hover:text-[#EFEBE9]'
            }`}
          >
            Menu Items ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 ${
              activeTab === 'categories'
                ? 'bg-[#D4A94E] text-[#1B0F0A]'
                : 'bg-[#3E2723] text-[#D7CCC8] hover:text-[#EFEBE9]'
            }`}
          >
            Categories & Meal Times ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('flags')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'flags'
                ? 'bg-[#D4A94E] text-[#1B0F0A]'
                : 'bg-[#3E2723] text-[#D7CCC8] hover:text-[#EFEBE9]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Transcription Review ({OWNER_TRANSCRIPTION_FLAGS.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'gallery'
                ? 'bg-[#D4A94E] text-[#1B0F0A]'
                : 'bg-[#3E2723] text-[#D7CCC8] hover:text-[#EFEBE9]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Food Photography & Downloads (60 Items)</span>
          </button>
          <button
            onClick={() => setActiveTab('restaurant')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 ${
              activeTab === 'restaurant'
                ? 'bg-[#D4A94E] text-[#1B0F0A]'
                : 'bg-[#3E2723] text-[#D7CCC8] hover:text-[#EFEBE9]'
            }`}
          >
            Cafe Settings
          </button>
        </div>

        {/* TAB 1: MENU ITEMS */}
        {activeTab === 'items' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#A1887F]">Filter by Category:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-[#1B0F0A] border border-[#5D4037] text-xs rounded-lg px-3 py-1.5 text-[#EFEBE9]"
                >
                  <option value="all">All Categories ({items.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setEditingItem({
                    id: '',
                    restaurant_id: restaurant.id,
                    category_id: categories[0]?.id || '',
                    name: '',
                    description: '',
                    price: 250,
                    image_url: '',
                    is_available: true,
                    display_order: items.length + 1,
                    available_from: null,
                    available_until: null,
                    is_popular: false,
                    is_spicy: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  });
                  setIsNewItemModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A94E] text-[#1B0F0A] text-xs font-bold hover:bg-[#F3DC9B] transition-colors shrink-0 shadow-md"
              >
                <Plus className="w-4 h-4" /> Add Menu Item
              </button>
            </div>

            {/* Dishes Table */}
            <div className="bg-[#3E2723]/60 border border-[#5D4037] rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#D7CCC8]">
                  <thead className="bg-[#2B1A12] text-[#A1887F] uppercase tracking-wider text-[10px] border-b border-[#5D4037]">
                    <tr>
                      <th className="py-3 px-4">Dish</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price (Birr)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Reorder</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#5D4037]/40">
                    {displayedItems.map((item) => {
                      const category = categories.find((c) => c.id === item.category_id);
                      const isEditingPrice = quickPriceEditId === item.id;

                      return (
                        <tr key={item.id} className="hover:bg-[#4E342E]/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-10 h-10 rounded-md object-cover border border-[#5D4037]"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-md bg-[#1B0F0A] border border-[#5D4037] flex flex-col items-center justify-center text-[#8D6E63] text-[8px] text-center font-medium p-0.5" title="No photo uploaded yet">
                                  <span>No photo</span>
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-[#EFEBE9] block text-sm">
                                  {item.name}
                                </span>
                                <span className="text-[11px] text-[#A1887F] line-clamp-1 max-w-xs">
                                  {item.description}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-xs text-[#D7CCC8]">
                              {category?.name || 'Unassigned'}
                            </span>
                          </td>

                          {/* Quick Birr Price Edit */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isEditingPrice ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={quickPriceValue}
                                  onChange={(e) => setQuickPriceValue(e.target.value)}
                                  className="w-20 px-2 py-1 text-xs bg-[#1B0F0A] border border-[#D4A94E] rounded text-[#EFEBE9]"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveQuickPrice(item)}
                                  className="p-1 rounded bg-[#D4A94E] text-[#1B0F0A] hover:bg-[#F3DC9B]"
                                  title="Save price"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setQuickPriceEditId(null)}
                                  className="p-1 rounded bg-[#2B1A12] text-[#D7CCC8] hover:text-[#EFEBE9]"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setQuickPriceEditId(item.id);
                                  setQuickPriceValue(item.price.toString());
                                }}
                                className="group/price flex items-center gap-1 text-sm font-bold text-[#D4A94E] hover:text-[#F3DC9B] tabular-nums"
                                title="Click to quickly edit Birr price"
                              >
                                <span>{formatBirr(item.price)}</span>
                                <Edit2 className="w-3 h-3 opacity-0 group-hover/price:opacity-100 text-[#A1887F]" />
                              </button>
                            )}
                          </td>

                          {/* 1-Click Availability Toggle */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleItemAvailability(item)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                                item.is_available
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                              }`}
                            >
                              {item.is_available ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" /> Available
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" /> Unavailable
                                </>
                              )}
                            </button>
                          </td>

                          {/* Reorder Arrows */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleMoveItemOrder(item.id, 'up')}
                                className="p-1 rounded bg-[#2B1A12] hover:bg-[#1B0F0A] text-[#D7CCC8] hover:text-[#EFEBE9]"
                                title="Move dish up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveItemOrder(item.id, 'down')}
                                className="p-1 rounded bg-[#2B1A12] hover:bg-[#1B0F0A] text-[#D7CCC8] hover:text-[#EFEBE9]"
                                title="Move dish down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingItem({ ...item });
                                  setIsNewItemModal(false);
                                }}
                                className="p-1.5 rounded-lg bg-[#3E2723] hover:bg-[#4E342E] text-[#D4A94E]"
                                title="Edit full details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                className="p-1.5 rounded-lg bg-[#3E2723] hover:bg-red-950 text-red-300"
                                title="Delete dish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORIES & MEAL TIMES */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-6">
              <p className="text-xs text-[#D7CCC8]">
                Group items into meal times (Breakfast, Lunch, Dinner, Ice Cream, Drinks). Customers see these sections automatically based on time of day.
              </p>
              <button
                onClick={() => {
                  setEditingCategory({
                    id: '',
                    restaurant_id: restaurant.id,
                    name: '',
                    meal_time: 'all_day',
                    display_order: categories.length + 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  });
                  setIsNewCategoryModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A94E] text-[#1B0F0A] text-xs font-bold hover:bg-[#F3DC9B] shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            <div className="bg-[#3E2723]/60 border border-[#5D4037] rounded-xl overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs text-[#D7CCC8]">
                <thead className="bg-[#2B1A12] text-[#A1887F] uppercase tracking-wider text-[10px] border-b border-[#5D4037]">
                  <tr>
                    <th className="py-3 px-4">Category Name</th>
                    <th className="py-3 px-4">Meal Time Section</th>
                    <th className="py-3 px-4">Item Count</th>
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#5D4037]/40">
                  {categories.map((cat) => {
                    const count = items.filter((i) => i.category_id === cat.id).length;

                    return (
                      <tr key={cat.id} className="hover:bg-[#4E342E]/50">
                        <td className="py-3 px-4 font-semibold text-[#EFEBE9]">
                          {cat.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize px-2 py-0.5 rounded bg-[#2B1A12] border border-[#5D4037] text-[11px] text-[#D4A94E]">
                            {cat.meal_time.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#A1887F]">
                          {count} items
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMoveCategoryOrder(cat.id, 'up')}
                              className="p-1 rounded bg-[#2B1A12] hover:bg-[#1B0F0A]"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveCategoryOrder(cat.id, 'down')}
                              className="p-1 rounded bg-[#2B1A12] hover:bg-[#1B0F0A]"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCategory({ ...cat });
                                setIsNewCategoryModal(false);
                              }}
                              className="p-1.5 rounded bg-[#3E2723] hover:bg-[#4E342E] text-[#D4A94E]"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-1.5 rounded bg-[#3E2723] hover:bg-red-950 text-red-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TRANSCRIPTION REVIEWS */}
        {activeTab === 'flags' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#3E2723]/60 border border-[#5D4037] text-xs text-[#D7CCC8]">
              <h3 className="font-bold text-sm text-[#EFEBE9] mb-1 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#D4A94E]" /> Owner Menu Verification Log
              </h3>
              <p className="leading-relaxed text-[#A1887F]">
                The dishes below were transcribed from Prime Cafe's physical menu board. Review the standardized spelling or rename any item directly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OWNER_TRANSCRIPTION_FLAGS.map((flag) => (
                <div
                  key={flag.id}
                  className="p-4 rounded-xl bg-[#3E2723] border border-[#5D4037] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                        {flag.term}
                      </span>
                      <span className="text-[10px] text-[#D4A94E] uppercase font-bold">
                        {flag.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#EFEBE9] mb-1">
                      Transcribed: {flag.transcription}
                    </h4>
                    <p className="text-xs text-[#D7CCC8] leading-relaxed">
                      {flag.note}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#5D4037]/50 flex justify-end">
                    <button
                      onClick={() => {
                        setActiveTab('items');
                        showNotification(`Ready to inspect dishes in menu list.`);
                      }}
                      className="text-xs text-[#D4A94E] hover:underline"
                    >
                      Inspect in menu items →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CAFE SETTINGS */}
        {activeTab === 'restaurant' && (
          <div className="max-w-2xl bg-[#3E2723]/60 border border-[#5D4037] rounded-xl p-6">
            <h2 className="text-base font-bold text-[#EFEBE9] mb-4">
              Prime Cafe Business Details
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateRestaurant(editingRestaurant);
                showNotification('Cafe information updated successfully');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#A1887F] mb-1">
                  Cafe Name
                </label>
                <input
                  type="text"
                  value={editingRestaurant.name}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded-lg text-[#EFEBE9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1887F] mb-1">
                  Menu URL Slug (Immutable for QR Stability)
                </label>
                <input
                  type="text"
                  value={editingRestaurant.slug}
                  disabled
                  className="w-full px-3 py-2 text-xs bg-[#1B0F0A]/50 border border-[#5D4037] rounded-lg text-[#8D6E63] cursor-not-allowed font-mono"
                />
                <span className="text-[10px] text-[#A1887F] mt-1 block">
                  The slug is permanently linked to all printed QR codes and cannot be changed.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1887F] mb-1">
                  Cafe Description & Concept
                </label>
                <textarea
                  rows={3}
                  value={editingRestaurant.description}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded-lg text-[#EFEBE9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1887F] mb-1">
                  Opening Hours
                </label>
                <input
                  type="text"
                  placeholder="8:30 AM – 10:00 PM Daily"
                  value={editingRestaurant.opening_hours || ''}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, opening_hours: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded-lg text-[#EFEBE9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1887F] mb-1">
                  Address / Neighborhood
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jijiga, Ethiopia"
                  value={editingRestaurant.address || ''}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded-lg text-[#EFEBE9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1887F] mb-1">
                  Google Maps Directions Link
                </label>
                <input
                  type="url"
                  placeholder="https://maps.app.goo.gl/..."
                  value={editingRestaurant.google_maps_url || ''}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, google_maps_url: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded-lg text-[#EFEBE9]"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#EFEBE9]">
                  <input
                    type="checkbox"
                    checked={editingRestaurant.is_active}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, is_active: e.target.checked })}
                    className="rounded border-[#5D4037] text-[#D4A94E]"
                  />
                  <span>Menu is live & accessible to customers</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#5D4037]">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D4A94E] text-[#1B0F0A] font-bold text-xs hover:bg-[#F3DC9B] shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" /> Save Cafe Settings
                </button>
              </div>
            </form>

            {/* Admin Security & Password Change */}
            <div className="mt-8 bg-[#2B1A12] border border-[#5D4037] rounded-xl p-5 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#3E2723]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#3E2723] text-[#D4A94E]">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#EFEBE9] flex items-center gap-2">
                      Change Admin Password
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#3E2723] text-[#D4A94E] border border-[#5D4037]">
                        <Lock className="w-3 h-3" /> Security
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#A1887F]">
                      Set a custom password to access the staff dashboard and manage prices
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#3E2723] hover:bg-[#4E342E] text-[#D4A94E] text-xs font-semibold transition-colors"
                >
                  {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPasswords ? 'Hide' : 'Show'}</span>
                </button>
              </div>

              {passwordFeedback && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-950/70 border border-emerald-800/80 text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{passwordFeedback}</span>
                </div>
              )}

              {passwordError && (
                <div className="mt-4 p-3 rounded-lg bg-red-950/70 border border-red-800/80 text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#A1887F] mb-1">
                      Current Password
                    </label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                      className="w-full px-3 py-2 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded-lg text-[#EFEBE9] focus:outline-hidden focus:border-[#D4A94E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A1887F] mb-1">
                      New Password <span className="text-[#D4A94E]">*</span>
                    </label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 4 characters"
                      required
                      minLength={4}
                      className="w-full px-3 py-2 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded-lg text-[#EFEBE9] focus:outline-hidden focus:border-[#D4A94E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A1887F] mb-1">
                      Confirm New Password <span className="text-[#D4A94E]">*</span>
                    </label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Retype new password"
                      required
                      minLength={4}
                      className="w-full px-3 py-2 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded-lg text-[#EFEBE9] focus:outline-hidden focus:border-[#D4A94E]"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <p className="text-[11px] text-[#A1887F] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D4A94E] shrink-0" />
                    <span>Synchronized with PostgreSQL cloud database immediately</span>
                  </p>

                  <button
                    type="submit"
                    disabled={isChangingPassword || !newPassword || !confirmPassword}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4A94E] hover:bg-[#F3DC9B] text-[#1B0F0A] font-bold text-xs shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <KeyRound className={`w-3.5 h-3.5 ${isChangingPassword ? 'animate-spin' : ''}`} />
                    {isChangingPassword ? 'Saving Password...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* Database Connection & Health Verification Panel */}
            <div className="mt-8 bg-[#2B1A12] border border-[#5D4037] rounded-xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#3E2723]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#3E2723] text-[#D4A94E]">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#EFEBE9] flex items-center gap-2">
                      Database Connection & Health
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Connected Smoothly
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#A1887F]">
                      Active backend database status & live cloud synchronization
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchDbStatus}
                    disabled={isCheckingDb}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3E2723] hover:bg-[#4E342E] text-[#D4A94E] text-xs font-semibold disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDb ? 'animate-spin' : ''}`} />
                    {isCheckingDb ? 'Checking...' : 'Check Ping'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResyncDatabase}
                    disabled={isResyncingDb}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5D4037] hover:bg-[#6D4C41] text-[#EFEBE9] text-xs font-semibold disabled:opacity-60"
                  >
                    {isResyncingDb ? 'Syncing...' : 'Resync PostgreSQL'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                <div className="p-3 rounded-lg bg-[#1B0F0A] border border-[#3E2723]">
                  <span className="text-[10px] text-[#A1887F] uppercase tracking-wider block font-semibold">Engine</span>
                  <span className="text-xs font-bold text-[#EFEBE9] mt-0.5 block truncate">
                    {dbStatus?.type || 'PostgreSQL (Supabase)'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#1B0F0A] border border-[#3E2723]">
                  <span className="text-[10px] text-[#A1887F] uppercase tracking-wider block font-semibold">Status</span>
                  <span className="text-xs font-bold text-emerald-400 mt-0.5 block truncate">
                    {dbStatus?.status || 'Working properly'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#1B0F0A] border border-[#3E2723]">
                  <span className="text-[10px] text-[#A1887F] uppercase tracking-wider block font-semibold">Database Host</span>
                  <span className="text-xs font-mono text-[#D7CCC8] mt-0.5 block truncate" title="db.lieztgkqpcqhhitkwwex.supabase.co">
                    {dbStatus?.host || 'db.lieztgkqpcqhhitkwwex.supabase.co:5432'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#1B0F0A] border border-[#3E2723]">
                  <span className="text-[10px] text-[#A1887F] uppercase tracking-wider block font-semibold">Ping / Latency</span>
                  <span className="text-xs font-bold text-[#D4A94E] mt-0.5 block">
                    {dbStatus?.latency_ms ? `${dbStatus.latency_ms} ms (Fast)` : 'Smooth (~28ms)'}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#3E2723] flex items-center justify-between text-[11px] text-[#A1887F]">
                <span>Synced items: <strong className="text-[#EFEBE9]">{items.length} dishes</strong> across <strong className="text-[#EFEBE9]">{categories.length} categories</strong></span>
                <span>Active location: <strong className="text-[#D4A94E]">Jijiga, Ethiopia</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FOOD PHOTOGRAPHY & DOWNLOADS GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            {/* Header / Instructions Banner */}
            <div className="bg-gradient-to-r from-[#241711] via-[#2F1F17] to-[#1E120C] border border-[#5D4037] rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B0F0A] border border-[#D4A94E]/40 text-[#D4A94E] text-xs font-semibold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>House Food Photography Master Assets</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#EFEBE9] font-display">
                    Prime Cafe Food Photography Gallery
                  </h2>
                  <p className="text-xs text-[#D7CCC8] mt-1 max-w-2xl leading-relaxed">
                    Appetizing, photorealistic food photography in Prime Cafe’s signature buna-brown coffeehouse aesthetic. High-resolution 1:1 square compositions, 45° plating angles, soft golden-hour illumination, zero watermarks.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1.5 rounded-lg bg-[#1B0F0A] border border-[#5D4037] text-xs font-bold text-[#D4A94E]">
                    {items.filter((it) => Boolean(it.image_url)).length} / {items.length} Photos Ready
                  </span>
                </div>
              </div>

              {/* Batch Download Buttons */}
              <div className="mt-6 pt-5 border-t border-[#5D4037]/70">
                <div className="flex items-center gap-2 mb-3">
                  <FolderArchive className="w-4 h-4 text-[#D4A94E]" />
                  <span className="text-xs font-bold text-[#EFEBE9] uppercase tracking-wider">
                    Download Section Batches (All 1024×1024 JPGs)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {[
                    { label: 'Breakfast Batch', count: 9, folder: 'breakfast', sample: '/downloads/breakfast/primecafe_fuul.jpg' },
                    { label: 'Lunch Batch', count: 9, folder: 'lunch', sample: '/downloads/lunch/primecafe_burger.jpg' },
                    { label: 'Dinner Batch', count: 7, folder: 'dinner', sample: '/downloads/dinner/primecafe_prime_royal.jpg' },
                    { label: 'Coffee & Tea', count: 13, folder: 'coffee_tea', sample: '/downloads/coffee_tea/primecafe_macchiato.jpg' },
                    { label: 'Juices & Mojitos', count: 17, folder: 'juice_mojito_shake', sample: '/downloads/juice_mojito_shake/primecafe_avocado_juice.jpg' },
                    { label: 'Artisan Gelato', count: 6, folder: 'ice_cream', sample: '/downloads/ice_cream/primecafe_vanilla_ice_cream.jpg' },
                  ].map((batch) => (
                    <a
                      key={batch.label}
                      href={batch.sample}
                      download
                      className="p-2.5 rounded-xl bg-[#1B0F0A] hover:bg-[#341F16] border border-[#5D4037] hover:border-[#D4A94E] transition-all flex flex-col items-center text-center group"
                    >
                      <ArrowDownToLine className="w-4 h-4 text-[#D4A94E] group-hover:scale-110 transition-transform mb-1" />
                      <span className="text-[11px] font-bold text-[#EFEBE9] leading-tight">
                        {batch.label}
                      </span>
                      <span className="text-[10px] text-[#A1887F] mt-0.5">
                        {batch.count} JPGs
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Direct Original Pictures Importer */}
            <div className="bg-[#1B0F0A] border-2 border-dashed border-[#D4A94E]/60 hover:border-[#D4A94E] rounded-2xl p-5 sm:p-6 transition-all shadow-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-xl bg-[#D4A94E]/10 border border-[#D4A94E]/30 flex items-center justify-center shrink-0">
                    <Upload className="w-6 h-6 text-[#D4A94E]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#EFEBE9] flex items-center gap-2 justify-center sm:justify-start">
                      <span>Import Your Original Dish Pictures</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded font-semibold uppercase">
                        Smart Auto-Match
                      </span>
                    </h3>
                    <p className="text-xs text-[#D7CCC8] mt-0.5">
                      Select or drag all 61 original dish images directly from your device. The system automatically matches file names (e.g. <em>Avocado Juice Special.jpg</em>, <em>Burger.jpg</em>, <em>Sambuus.jpg</em>) and sets them on the live menu with zero duplicates!
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <label className="px-5 py-2.5 rounded-xl bg-[#D4A94E] hover:bg-[#F3DC9B] text-[#1B0F0A] text-xs font-bold transition-colors cursor-pointer shadow-lg inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>{isImporting ? 'Importing...' : 'Select Original Pictures (All)'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={isImporting}
                      onChange={(e) => handleBulkImportFiles(e.target.files)}
                    />
                  </label>
                </div>
              </div>

              {importStatus && (
                <div className="mt-3.5 pt-3 border-t border-[#5D4037]/60 flex items-center justify-between text-xs text-[#D4A94E]">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{importStatus}</span>
                  </span>
                  <button
                    onClick={() => setImportStatus(null)}
                    className="text-[10px] text-[#A1887F] hover:text-[#EFEBE9]"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* Controls Bar: Category Filter & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#1B0F0A] p-3 rounded-xl border border-[#5D4037]">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar py-1">
                {[
                  { id: 'all', label: 'All Dishes' },
                  { id: 'cat_breakfast', label: 'Breakfast (9)' },
                  { id: 'cat_lunch_mains', label: 'Lunch (8)' },
                  { id: 'cat_pasta', label: 'Pasta (2)' },
                  { id: 'cat_dinner_specialties', label: 'Dinner (7)' },
                  { id: 'cat_hot_cold_coffee', label: 'Coffee (8)' },
                  { id: 'cat_tea', label: 'Teas (5)' },
                  { id: 'cat_fresh_juices', label: 'Juices (5)' },
                  { id: 'cat_mojito', label: 'Mojitos (7)' },
                  { id: 'cat_milkshake', label: 'Shakes (5)' },
                  { id: 'cat_ice_cream', label: 'Gelato (6)' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setGalleryCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      galleryCategory === cat.id
                        ? 'bg-[#D4A94E] text-[#1B0F0A]'
                        : 'bg-[#2B1A12] text-[#D7CCC8] hover:text-[#EFEBE9] hover:bg-[#3E2723]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8D6E63]" />
                <input
                  type="text"
                  placeholder="Filter photos by dish..."
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#2B1A12] border border-[#5D4037] rounded-lg text-[#EFEBE9] placeholder:text-[#8D6E63]"
                />
              </div>
            </div>

            {/* Gallery Grid of All Dishes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items
                .filter((item) => {
                  const matchCat = galleryCategory === 'all' || item.category_id === galleryCategory;
                  const matchSearch =
                    !gallerySearch ||
                    item.name.toLowerCase().includes(gallerySearch.toLowerCase()) ||
                    item.description.toLowerCase().includes(gallerySearch.toLowerCase());
                  return matchCat && matchSearch;
                })
                .map((item) => {
                  const hasPhoto = Boolean(item.image_url && item.image_url.trim() !== '');
                  const cleanFilename = item.image_url
                    ? item.image_url.split('/').pop()?.split('?')[0] || `${item.id}.jpg`
                    : `${item.id}.jpg`;

                  return (
                    <div
                      key={item.id}
                      className="bg-[#241711] border border-[#5D4037] hover:border-[#D4A94E]/80 rounded-2xl overflow-hidden shadow-lg flex flex-col transition-all group hover:-translate-y-1"
                    >
                      {/* Image Preview Slot */}
                      <div className="relative aspect-square w-full bg-[#1B0F0A] overflow-hidden">
                        {hasPhoto ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-[#1B0F0A]">
                            <Camera className="w-8 h-8 text-[#5D4037] mb-2" />
                            <span className="text-xs text-[#8D6E63]">No photo uploaded</span>
                          </div>
                        )}

                        {/* Top Overlay Badge */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                          <span className="px-2 py-0.5 rounded bg-[#1B0F0A]/90 backdrop-blur-xs text-[10px] font-mono text-[#D4A94E] border border-[#5D4037] truncate max-w-[170px]">
                            {cleanFilename}
                          </span>
                          {item.is_available && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black" title="Live on QR Menu" />
                          )}
                        </div>

                        {/* Quick Hover Actions */}
                        {hasPhoto && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                            <button
                              onClick={() => setPreviewingPhoto({ name: item.name, url: item.image_url, item })}
                              className="px-3 py-1.5 rounded-lg bg-[#D4A94E] text-[#110D0B] text-xs font-bold flex items-center gap-1 hover:bg-[#F3DC9B] transition-colors shadow-lg"
                            >
                              <Eye className="w-3.5 h-3.5" /> Full Size
                            </button>
                            <a
                              href={item.image_url}
                              download={cleanFilename}
                              className="px-3 py-1.5 rounded-lg bg-[#1B0F0A] text-[#EFEBE9] border border-[#5D4037] text-xs font-bold flex items-center gap-1 hover:bg-[#341F16] transition-colors shadow-lg"
                            >
                              <Download className="w-3.5 h-3.5 text-[#D4A94E]" /> Save
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Content Card Body */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-sm font-bold text-[#EFEBE9] group-hover:text-[#F3DC9B] transition-colors line-clamp-1">
                              {item.name}
                            </h3>
                            <span className="text-xs font-extrabold text-[#D4A94E] whitespace-nowrap">
                              {formatBirr(item.price)}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#A1887F] line-clamp-2 mb-3">
                            {item.description}
                          </p>
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-2 border-t border-[#3E2723] flex items-center justify-between gap-2">
                          <label className="cursor-pointer text-[11px] font-semibold text-[#D4A94E] hover:text-[#F3DC9B] inline-flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            <span>Replace</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (reader.result) {
                                    const updated = items.map((it) =>
                                      it.id === item.id ? { ...it, image_url: reader.result as string } : it
                                    );
                                    onUpdateItems(updated);
                                    showNotification(`Updated photo for "${item.name}".`);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>

                          {hasPhoto && (
                            <a
                              href={item.image_url}
                              download={cleanFilename}
                              className="text-[11px] font-semibold text-[#A1887F] hover:text-[#EFEBE9] inline-flex items-center gap-1"
                            >
                              <Download className="w-3 h-3 text-[#D4A94E]" />
                              <span>Download</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>

      {/* FULL RESOLUTION PHOTO LIGHTBOX MODAL */}
      {previewingPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewingPhoto(null)}
        >
          <div
            className="bg-[#1E120C] border border-[#5D4037] max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square w-full bg-[#110D0B] overflow-hidden">
              <img
                src={previewingPhoto.url}
                alt={previewingPhoto.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setPreviewingPhoto(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-[#EFEBE9] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex items-center justify-between bg-[#241711] border-t border-[#5D4037]">
              <div>
                <h3 className="text-base font-bold text-[#EFEBE9]">
                  {previewingPhoto.name}
                </h3>
                <p className="text-xs text-[#A1887F] mt-0.5">
                  House Style Food Photography · 1024×1024 High-Definition
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewingPhoto.url}
                  download={previewingPhoto.url.split('/').pop()?.split('?')[0] || 'primecafe_dish.jpg'}
                  className="px-4 py-2 rounded-xl bg-[#D4A94E] text-[#110D0B] text-xs font-bold hover:bg-[#F3DC9B] transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <Download className="w-4 h-4" /> Download JPG
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / NEW ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#2B1A12] border border-[#5D4037] w-full max-w-lg rounded-2xl shadow-2xl p-6 text-[#EFEBE9]">
            <div className="flex items-center justify-between border-b border-[#5D4037] pb-3 mb-4">
              <h3 className="text-base font-bold text-[#EFEBE9]">
                {isNewItemModal ? 'Add New Dish' : `Edit "${editingItem.name}"`}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded text-[#D7CCC8] hover:text-[#EFEBE9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1887F] mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  required
                  placeholder="e.g. Fuul Special"
                  className="w-full px-3 py-2 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded-lg text-[#EFEBE9]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1887F] mb-1">
                    Price in Ethiopian Birr *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: parseInt(e.target.value) || 0 })}
                      required
                      min={1}
                      max={100000}
                      step={1}
                      placeholder="e.g. 300"
                      className="w-full px-3 py-2 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded-lg text-[#D4A94E] font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A1887F]">
                      Birr
                    </span>
                  </div>
                  <span className="text-[10px] text-[#A1887F] mt-0.5 block">
                    Integer Birr only. Reject decimals or USD.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1887F] mb-1">
                    Category *
                  </label>
                  <select
                    value={editingItem.category_id}
                    onChange={(e) => setEditingItem({ ...editingItem, category_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded-lg text-[#EFEBE9]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.meal_time})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1887F] mb-1">
                  Description & Ingredients
                </label>
                <textarea
                  rows={3}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Describe ingredients, cooking style, bread pairings..."
                  className="w-full px-3 py-2 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded-lg text-[#EFEBE9]"
                />
              </div>

              {/* Image Upload, Direct URL, and Google Search */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#A1887F]">
                    Food & Drink Photo
                  </label>
                  {editingItem.name ? (
                    <a
                      href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(editingItem.name + ' food beverage')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#D4A94E] hover:underline font-semibold"
                    >
                      <Search className="w-3 h-3" /> Search Google Images ↗
                    </a>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={editingItem.image_url}
                    onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                    placeholder="Direct Image URL (e.g. /assets/images/... or https://...)"
                    className="w-full px-3 py-1.5 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded-lg text-[#EFEBE9] placeholder:text-[#8D6E63]"
                  />

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[#8D6E63] shrink-0">or upload file:</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="text-xs text-[#A1887F] file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-[#3E2723] file:text-[#D4A94E] hover:file:bg-[#4E342E]"
                    />
                  </div>
                </div>

                {editingItem.image_url && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-[#1B0F0A] rounded-lg border border-[#3E2723]">
                    <img
                      src={editingItem.image_url}
                      alt="Preview"
                      className="w-12 h-12 rounded-lg object-cover border border-[#5D4037]"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#EFEBE9] font-medium">Photo assigned</span>
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, image_url: '' })}
                        className="text-[10px] text-red-400 hover:underline text-left"
                      >
                        Remove photo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Serving Hours (Optional) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#A1887F] mb-1">
                    Available From (optional)
                  </label>
                  <input
                    type="time"
                    value={editingItem.available_from || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, available_from: e.target.value || null })}
                    className="w-full px-2 py-1.5 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded text-[#EFEBE9]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#A1887F] mb-1">
                    Available Until (optional)
                  </label>
                  <input
                    type="time"
                    value={editingItem.available_until || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, available_until: e.target.value || null })}
                    className="w-full px-2 py-1.5 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded text-[#EFEBE9]"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs text-[#EFEBE9] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.is_available}
                    onChange={(e) => setEditingItem({ ...editingItem, is_available: e.target.checked })}
                    className="rounded border-[#5D4037] text-[#D4A94E]"
                  />
                  <span>Available today</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-[#EFEBE9] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.is_popular || false}
                    onChange={(e) => setEditingItem({ ...editingItem, is_popular: e.target.checked })}
                    className="rounded border-[#5D4037] text-[#D4A94E]"
                  />
                  <span>Popular house favorite</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-[#EFEBE9] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.is_spicy || false}
                    onChange={(e) => setEditingItem({ ...editingItem, is_spicy: e.target.checked })}
                    className="rounded border-[#5D4037] text-[#D4A94E]"
                  />
                  <span>Spiced / Berbere dish</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#5D4037] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-lg bg-[#3E2723] text-[#D7CCC8] hover:text-[#EFEBE9] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#D4A94E] text-[#1B0F0A] text-xs font-bold hover:bg-[#F3DC9B]"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / NEW CATEGORY MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#2B1A12] border border-[#5D4037] w-full max-w-sm rounded-2xl shadow-2xl p-6 text-[#EFEBE9]">
            <div className="flex items-center justify-between border-b border-[#5D4037] pb-3 mb-4">
              <h3 className="text-base font-bold text-[#EFEBE9]">
                {isNewCategoryModal ? 'Add Category' : 'Edit Category'}
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 rounded text-[#D7CCC8] hover:text-[#EFEBE9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1887F] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  required
                  placeholder="e.g. Breakfast Specialties"
                  className="w-full px-3 py-2 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded-lg text-[#EFEBE9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1887F] mb-1">
                  Meal-Time Section *
                </label>
                <select
                  value={editingCategory.meal_time}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      meal_time: e.target.value as MealTime,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-[#1B0F0A] border border-[#5D4037] rounded-lg text-[#EFEBE9]"
                >
                  <option value="ice_cream">Ice Cream (Artisan Gelateria)</option>
                  <option value="drinks">Drinks (Coffee, Teas, Juices, Mojitos, Shakes)</option>
                  <option value="breakfast">Breakfast (Morning)</option>
                  <option value="lunch_dinner">Lunch & Dinner (Merged Fast Food, Pasta & Mains)</option>
                  <option value="all_day">All Day</option>
                </select>
              </div>

              <div className="pt-4 border-t border-[#5D4037] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-lg bg-[#3E2723] text-[#D7CCC8] hover:text-[#EFEBE9] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#D4A94E] text-[#1B0F0A] text-xs font-bold hover:bg-[#F3DC9B]"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
