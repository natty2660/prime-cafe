import React, { useState, useEffect } from 'react';
import { MenuItem } from '../types/index.ts';
import { formatBirr } from '../lib/storage.ts';
import { getAlternativeImageUrl } from '../lib/imageFallback.ts';
import { Flame, Clock, Coffee, UtensilsCrossed, Camera, Sparkles } from 'lucide-react';

interface ItemCardProps {
  item: MenuItem;
  onClick?: () => void;
  isOutsideServingHours?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onClick,
  isOutsideServingHours = false,
}) => {
  const [currentSrc, setCurrentSrc] = useState(item.image_url);
  const [triedFallback, setTriedFallback] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(item.image_url);
    setTriedFallback(false);
    setImageFailed(false);
  }, [item.image_url]);

  const handleImageError = () => {
    if (!triedFallback) {
      setTriedFallback(true);
      const alt = getAlternativeImageUrl(currentSrc);
      if (alt && alt !== currentSrc) {
        setCurrentSrc(alt);
        return;
      }
    }
    setImageFailed(true);
  };

  const hasValidPhoto = Boolean(currentSrc && currentSrc.trim() !== '' && !imageFailed);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group relative flex flex-row items-center gap-3.5 p-2.5 sm:p-3 rounded-2xl transition-all duration-200 cursor-pointer border ${
        item.is_available
          ? 'bg-gradient-to-r from-[#2F1F17]/90 via-[#261811]/95 to-[#21140E] hover:from-[#3D261C] hover:via-[#331F16] hover:to-[#2A1810] border-[#5D4037]/70 hover:border-[#D4A94E]/80 shadow-xs hover:shadow-lg hover:-translate-y-0.5'
          : 'bg-[#2B1A12]/40 border-[#3E2723] opacity-65 cursor-default'
      }`}
    >
      {/* 
        Image Presentation (High-Fidelity Visual Slot):
        Standard items have verified precise photography.
        Local specialty items display a subtle branded kitchen badge.
      */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-[#1B0F0A] border border-[#5D4037]/80 group-hover:border-[#D4A94E]/90 shadow-sm transition-all duration-200">
        {hasValidPhoto ? (
          <img
            src={currentSrc}
            alt={item.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={handleImageError}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
              !item.is_available ? 'grayscale contrast-75' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-1.5 text-center bg-gradient-to-b from-[#2B1A12] to-[#1B0F0A]">
            {item.category_id === 'cat_ice_cream' ? (
              <Sparkles className="w-5 h-5 text-[#D4A94E]/80" />
            ) : item.category_id.includes('coffee') || item.category_id.includes('tea') ? (
              <Coffee className="w-5 h-5 text-[#D4A94E]/80" />
            ) : (
              <UtensilsCrossed className="w-5 h-5 text-[#D4A94E]/80" />
            )}
            <span className="text-[9px] text-[#D4A94E]/80 font-bold tracking-wider uppercase mt-1">
              Prime
            </span>
          </div>
        )}

        {/* Popular Indicator */}
        {item.is_popular && item.is_available && (
          <div className="absolute top-1 left-1 bg-[#D4A94E] text-[#1B0F0A] text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm leading-tight flex items-center gap-0.5">
            ★ Top
          </div>
        )}

        {/* Spicy Indicator */}
        {item.is_spicy && (
          <div
            className="absolute bottom-1 right-1 bg-[#1B0F0A]/90 backdrop-blur-xs text-[#EFEBE9] p-0.5 rounded border border-[#5D4037]"
            title="Spiced / Seasoned"
          >
            <Flame className="w-3 h-3 text-amber-500" />
          </div>
        )}
      </div>

      {/* Item Information */}
      <div className="flex-1 flex flex-col justify-center min-w-0 py-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-bold text-sm sm:text-base text-[#EFEBE9] group-hover:text-[#F3DC9B] transition-colors truncate">
            {item.name}
          </h3>

          {/* Price in Ethiopian Birr ONLY */}
          <div className="text-right shrink-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#D4A94E]/10 border border-[#D4A94E]/30 text-sm sm:text-base font-bold text-[#E2B859] tabular-nums whitespace-nowrap tracking-tight group-hover:bg-[#D4A94E]/20 transition-colors">
              {formatBirr(item.price)}
            </span>
          </div>
        </div>

        <p className="text-[11px] sm:text-xs text-[#D7CCC8] line-clamp-1 leading-normal my-0.5">
          {item.description}
        </p>

        {/* Portion / Sizes pill or serving hours */}
        <div className="flex items-center gap-2 text-[10px] text-[#A1887F]">
          {item.sizes && item.sizes.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-[#8D6E63] uppercase font-semibold">Sizes:</span>
              {item.sizes.map((s, idx) => (
                <span key={s.name} className="text-[#EFEBE9] text-[9px] font-medium bg-[#1B0F0A] px-1.5 py-0.5 rounded border border-[#3E2723]">
                  {s.name[0]}: <span className="text-[#D4A94E] font-bold">{s.price}B</span>
                </span>
              ))}
            </div>
          ) : !item.is_available ? (
            <span className="text-[9px] font-semibold text-amber-300/80 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-800/40">
              Not available
            </span>
          ) : isOutsideServingHours ? (
            <span className="flex items-center gap-1 text-[9px] text-[#A1887F]">
              <Clock className="w-2.5 h-2.5 text-[#D4A94E]" />
              <span>Served {item.available_from}–{item.available_until}</span>
            </span>
          ) : item.is_local_specialty ? (
            <span className="text-[9px] text-[#D4A94E] font-medium">
              Local Specialty
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
