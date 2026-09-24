import React, { useState, useMemo } from 'react';
import { Restaurant, Category, MenuItem, MealTime } from '../types/index.ts';
import { BrandLogo } from './BrandLogo.tsx';
import { ItemCard } from './ItemCard.tsx';
import { formatBirr, getSuggestedMealTime } from '../lib/storage.ts';
import {
  Search,
  Clock,
  MapPin,
  Phone,
  Wifi,
  QrCode,
  Lock,
  X,
  Flame,
  CheckCircle2,
  Sparkles,
  IceCream,
  Coffee,
  Camera,
} from 'lucide-react';

interface PublicMenuProps {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
  onOpenAdmin: () => void;
  onOpenQR: () => void;
}

export const PublicMenu: React.FC<PublicMenuProps> = ({
  restaurant,
  categories,
  items,
  onOpenAdmin,
  onOpenQR,
}) => {
  const suggestedMeal = useMemo(() => getSuggestedMealTime(), []);
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime | 'all'>(suggestedMeal);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Inactive state check
  if (!restaurant.is_active) {
    return (
      <div className="min-h-screen bg-[#1A120E] text-[#EFEBE9] flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-[#2B1A12] p-8 rounded-2xl border border-[#5D4037] shadow-2xl">
          <BrandLogo size="lg" className="justify-center mb-4" showSubtitle={false} />
          <h1 className="text-2xl font-bold text-[#EFEBE9] mb-2 font-display">
            {restaurant.name}
          </h1>
          <p className="text-[#D7CCC8] text-sm mb-6">
            This digital menu is temporarily updating. Please ask your server or check back shortly.
          </p>
          <button
            onClick={onOpenAdmin}
            className="text-xs text-[#D4A94E] hover:underline inline-flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" /> Staff Management Access
          </button>
        </div>
      </div>
    );
  }

  // Filter categories by meal time tab
  const filteredCategories = useMemo(() => {
    let list = categories;
    if (selectedMealTime !== 'all') {
      if (selectedMealTime === 'ice_cream') {
        list = categories.filter((c) => c.meal_time === 'ice_cream');
      } else if (selectedMealTime === 'all_day') {
        list = categories.filter((c) => c.meal_time === 'all_day');
      } else {
        list = categories.filter(
          (c) => c.meal_time === selectedMealTime || (selectedMealTime === 'lunch' && c.id === 'cat_pasta')
        );
      }
    }
    return [...list].sort((a, b) => a.display_order - b.display_order);
  }, [categories, selectedMealTime]);

  // Filter items based on active categories and search query
  const itemsByCategory = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const map = new Map<string, MenuItem[]>();

    for (const cat of filteredCategories) {
      const catItems = items
        .filter((i) => i.category_id === cat.id)
        .filter((i) => {
          if (!q) return true;
          return (
            i.name.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q) ||
            i.price.toString().includes(q)
          );
        })
        .sort((a, b) => a.display_order - b.display_order);

      if (catItems.length > 0 || !q) {
        map.set(cat.id, catItems);
      }
    }

    return map;
  }, [filteredCategories, items, searchQuery]);

  // Meal time tabs including explicit Ice Cream tab alongside breakfast, lunch, dinner
  const mealTimeTabs = [
    { id: 'breakfast', label: 'Breakfast', sub: '6:30 AM – 12 PM', icon: Coffee },
    { id: 'lunch', label: 'Lunch', sub: '11:30 AM – 5 PM', icon: null },
    { id: 'dinner', label: 'Dinner', sub: '5 PM – 11 PM', icon: null },
    { id: 'ice_cream', label: 'Ice Cream', sub: 'Artisan Gelato', icon: IceCream },
    { id: 'all_day', label: 'Coffee & Drinks', sub: 'All Day', icon: null },
    { id: 'all', label: 'Full Menu', sub: 'Everything', icon: null },
  ] as const;

  const currentDisplayPrice = useMemo(() => {
    if (!selectedItem) return 0;
    if (selectedItem.sizes && selectedSize) {
      const found = selectedItem.sizes.find((s) => s.name === selectedSize);
      if (found) return found.price;
    }
    return selectedItem.price;
  }, [selectedItem, selectedSize]);

  return (
    <div className="min-h-screen bg-[#1A120E] text-[#EFEBE9] pb-20 selection:bg-[#D4A94E] selection:text-[#1A120E]">
      {/* Top International Header Bar */}
      <header className="sticky top-0 z-30 bg-[#1A120E]/95 backdrop-blur-md border-b border-[#3E2723] px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" customLogoUrl={restaurant.logo_url} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenQR}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#2B1A12] hover:bg-[#3E2723] text-[#D4A94E] border border-[#5D4037]/80 transition-colors shadow-sm"
              title="View & share permanent QR code"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Table QR</span>
            </button>
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-[#D7CCC8] hover:text-[#EFEBE9] hover:bg-[#2B1A12] transition-colors"
              title="Staff admin login"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Staff Access</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero / Enhanced Wood Slat Architectural Banner */}
      <div className="relative bg-[#110D0B] border-b border-[#3E2723] overflow-hidden">
        <div className="relative h-48 sm:h-64 w-full">
          {/* Enhanced luxury acoustic wood slat backdrop */}
          <img
            src="/assets/images/prime_cafe_luxury_bg_1790216722377.jpg"
            alt="Prime Cafe Luxury Interior"
            className="w-full h-full object-cover opacity-60"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/images/prime_cafe_hero_1790215822508.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A120E] via-[#1A120E]/50 to-transparent" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 sm:-mt-24 relative z-10 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <BrandLogo size="lg" customLogoUrl={restaurant.logo_url} showSubtitle={false} />
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#EFEBE9] font-sans tracking-tight">
                    {restaurant.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-700/60 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Open Now
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#D4A94E] font-medium tracking-wide mt-0.5">
                  Specialty Coffee · Modern Kitchen · Artisan Ice Cream
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#D7CCC8] mt-3.5 leading-relaxed max-w-2xl">
            {restaurant.description}
          </p>

          {/* Quick Info Bar */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-5 mt-4 pt-3.5 border-t border-[#3E2723] text-xs text-[#A1887F]">
            {restaurant.opening_hours && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#D4A94E]" />
                <span>{restaurant.opening_hours}</span>
              </div>
            )}
            {restaurant.address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D4A94E]" />
                <span>{restaurant.address}</span>
              </div>
            )}
            {restaurant.phone && (
              <a
                href={`tel:${restaurant.phone}`}
                className="flex items-center gap-1.5 hover:text-[#EFEBE9] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#D4A94E]" />
                <span>{restaurant.phone}</span>
              </a>
            )}
            {restaurant.wifi_available && (
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-[#D4A94E]" />
                <span>High-Speed Wi-Fi</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Section Tabs & Search */}
      <div className="sticky top-[57px] z-20 bg-[#1A120E]/95 backdrop-blur-md border-b border-[#3E2723] px-4 sm:px-6 py-2.5 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
          {/* Meal Time & Ice Cream Segmented Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {mealTimeTabs.map((tab) => {
              const isActive = selectedMealTime === tab.id;
              const isIceCream = tab.id === 'ice_cream';

              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedMealTime(tab.id)}
                  className={`relative shrink-0 px-3.5 py-2 rounded-xl text-xs transition-all duration-150 flex flex-col items-center justify-center min-w-[82px] border ${
                    isActive
                      ? isIceCream
                        ? 'bg-gradient-to-r from-[#D4A94E] to-[#E5C178] text-[#110D0B] font-bold border-[#D4A94E] shadow-md'
                        : 'bg-[#D4A94E] text-[#110D0B] font-bold border-[#D4A94E] shadow-md'
                      : isIceCream
                      ? 'bg-[#2B1A12] text-[#F3DC9B] hover:bg-[#3E2723] border-[#D4A94E]/40 font-semibold'
                      : 'bg-[#241712] text-[#D7CCC8] hover:bg-[#3E2723] hover:text-[#EFEBE9] border-[#3E2723]'
                  }`}
                >
                  <span className="leading-tight flex items-center gap-1">
                    {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                    {tab.label}
                  </span>
                  <span
                    className={`text-[9px] mt-0.5 font-normal ${
                      isActive ? 'text-[#110D0B]/80 font-medium' : 'text-[#8D6E63]'
                    }`}
                  >
                    {tab.sub}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#A1887F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search food, ice cream, coffees, mojitos..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-[#110D0B] border border-[#3E2723] rounded-lg text-[#EFEBE9] placeholder-[#8D6E63] focus:outline-hidden focus:border-[#D4A94E] focus:ring-1 focus:ring-[#D4A94E] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8D6E63] hover:text-[#EFEBE9]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Menu Body */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {/* Active Section Banner */}
        {selectedMealTime === 'ice_cream' && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#3E2723] to-[#2B1A12] border border-[#D4A94E]/50 flex items-center justify-between text-xs text-[#EFEBE9] shadow-md">
            <div className="flex items-center gap-3">
              <IceCream className="w-5 h-5 text-[#D4A94E] shrink-0" />
              <div>
                <strong className="text-sm font-bold text-[#F3DC9B] block">
                  Artisan Gelato & Ice Cream Selection
                </strong>
                <span className="text-[#D7CCC8] text-xs">
                  Available in Small (150 Birr), Medium (300 Birr), and Large (500 Birr) portions.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Empty States */}
        {categories.length === 0 ? (
          <div className="text-center py-16 text-[#A1887F]">
            <p className="text-base">Menu coming soon.</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16 text-[#A1887F]">
            <p className="text-base">No items available in this section.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredCategories.map((category) => {
              const catItems = itemsByCategory.get(category.id) || [];
              if (catItems.length === 0 && searchQuery) {
                return null;
              }

              return (
                <section key={category.id} id={category.id} className="scroll-mt-36">
                  {/* Category Header */}
                  <div className="flex items-baseline justify-between border-b border-[#3E2723] pb-2 mb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-[#EFEBE9] font-sans">
                        {category.name}
                      </h2>
                      <span className="text-xs text-[#D4A94E] font-medium">
                        ({catItems.length})
                      </span>
                    </div>

                    <span className="text-[11px] text-[#A1887F] uppercase tracking-wider font-semibold">
                      {category.meal_time === 'ice_cream'
                        ? 'Gelateria'
                        : category.meal_time === 'all_day'
                        ? 'All Day'
                        : category.meal_time}
                    </span>
                  </div>

                  {/* Items List */}
                  {catItems.length === 0 ? (
                    <p className="text-xs text-[#8D6E63] italic py-2">
                      No items currently listed in this section.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {catItems.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          onClick={() => {
                            setSelectedItem(item);
                            if (item.sizes && item.sizes.length > 0) {
                              setSelectedSize(item.sizes[0].name);
                            } else {
                              setSelectedSize(null);
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-[#2B1A12] border border-[#5D4037] w-full max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image or Clean International Placeholder */}
            {selectedItem.image_url ? (
              <div className="relative h-60 w-full bg-[#110D0B]">
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-[#110D0B]/80 text-[#EFEBE9] hover:bg-[#110D0B] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="p-6 bg-gradient-to-b from-[#3E2723] to-[#2B1A12] border-b border-[#5D4037] flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs text-[#D4A94E]">
                  <Camera className="w-4 h-4" />
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    Local Kitchen Specialty · Photo Added by Staff
                  </span>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 rounded-full bg-[#1B0F0A] text-[#EFEBE9] hover:bg-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Modal Details */}
            <div className="p-6 overflow-y-auto">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-xl sm:text-2xl font-bold text-[#EFEBE9]">
                  {selectedItem.name}
                </h3>
                <span className="text-2xl font-black text-[#D4A94E] tabular-nums whitespace-nowrap">
                  {formatBirr(currentDisplayPrice)}
                </span>
              </div>

              {/* Size Selector for Items with Multiple Sizes (e.g. Ice Cream) */}
              {selectedItem.sizes && selectedItem.sizes.length > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-[#1B0F0A] border border-[#5D4037]">
                  <span className="text-xs text-[#A1887F] font-semibold uppercase tracking-wider block mb-2">
                    Select Portion Size:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedItem.sizes.map((s) => {
                      const isChosen = selectedSize === s.name;
                      return (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => setSelectedSize(s.name)}
                          className={`py-2 px-3 rounded-lg text-xs flex flex-col items-center justify-center border transition-all ${
                            isChosen
                              ? 'bg-[#D4A94E] text-[#110D0B] font-bold border-[#D4A94E] shadow-sm'
                              : 'bg-[#2B1A12] text-[#D7CCC8] border-[#5D4037] hover:border-[#D4A94E]/60'
                          }`}
                        >
                          <span className="font-semibold">{s.name}</span>
                          <span className={`text-[11px] ${isChosen ? 'text-[#110D0B]' : 'text-[#D4A94E]'}`}>
                            {formatBirr(s.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-4">
                {selectedItem.is_available ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Available today
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-full">
                    Not available today
                  </span>
                )}

                {selectedItem.is_spicy && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2.5 py-0.5 rounded-full">
                    <Flame className="w-3.5 h-3.5 text-amber-500" /> Seasoned Dish
                  </span>
                )}

                {selectedItem.available_from && selectedItem.available_until && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#D7CCC8] bg-[#3E2723] px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                    <Clock className="w-3.5 h-3.5 text-[#D4A94E]" />
                    Served {selectedItem.available_from} – {selectedItem.available_until}
                  </span>
                )}
              </div>

              <p className="text-sm text-[#D7CCC8] leading-relaxed mb-6">
                {selectedItem.description}
              </p>

              {selectedItem.transcription_note && (
                <div className="p-3 bg-[#1B0F0A] rounded-lg border border-[#5D4037]/60 mb-4 text-xs text-[#A1887F]">
                  <span className="font-semibold text-[#D4A94E] block mb-0.5">
                    Menu Board Note:
                  </span>
                  {selectedItem.transcription_note}
                </div>
              )}

              <div className="pt-4 border-t border-[#5D4037] flex items-center justify-between">
                <span className="text-xs text-[#8D6E63]">
                  Ask your server for pairings or dietary inquiries.
                </span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-5 py-2.5 bg-[#D4A94E] text-[#110D0B] text-xs font-bold rounded-lg hover:bg-[#F3DC9B] transition-colors shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern International Footer */}
      <footer className="mt-16 border-t border-[#3E2723] bg-[#110D0B] py-10 px-4 text-center text-xs text-[#8D6E63]">
        <div className="max-w-md mx-auto space-y-3">
          <BrandLogo size="md" className="justify-center" />
          <p className="text-[#A1887F] font-medium leading-relaxed">
            Contemporary Coffee Lounge · Gourmet Kitchen · Artisan Ice Cream
          </p>
          <div className="flex items-center justify-center gap-3 pt-2 text-[11px] text-[#A1887F]">
            <span>Addis Ababa</span>
            <span>·</span>
            <span>Ethiopian Birr Only</span>
            <span>·</span>
            <button
              onClick={onOpenAdmin}
              className="text-[#D4A94E] hover:underline cursor-pointer font-medium"
            >
              Staff Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
