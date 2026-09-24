import React, { useState } from 'react';
import { MenuItem } from '../types/index.ts';
import { formatBirr } from '../lib/storage.ts';
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
  const [imageFailed, setImageFailed] = useState(false);
  const hasValidPhoto = Boolean(item.image_url && item.image_url.trim() !== '' && !imageFailed);

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
      className={`group relative flex flex-col sm:flex-row gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer border ${
        item.is_available
          ? 'bg-[#3E2723]/60 hover:bg-[#3E2723] border-[#5D4037]/80 hover:border-[#D4A94E]/60 shadow-md hover:shadow-xl'
          : 'bg-[#2B1A12]/40 border-[#3E2723] opacity-65 cursor-default'
      }`}
    >
      {/* 
        Image Presentation:
        Standard international items have verified food photography.
        Local specialty items are intentionally left blank (no guessing) per cafe owner instruction.
      */}
      <div className="relative w-full sm:w-28 sm:h-28 h-40 shrink-0 rounded-lg overflow-hidden bg-[#1B0F0A] border border-[#5D4037]/60">
        {hasValidPhoto ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              !item.is_available ? 'grayscale contrast-75' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-[#2B1A12] to-[#1B0F0A] border border-dashed border-[#5D4037]/50">
            {item.category_id === 'cat_ice_cream' ? (
              <Sparkles className="w-7 h-7 text-[#D4A94E]/60 mb-1" />
            ) : item.category_id.includes('coffee') || item.category_id.includes('tea') ? (
              <Coffee className="w-7 h-7 text-[#D4A94E]/60 mb-1" />
            ) : (
              <UtensilsCrossed className="w-7 h-7 text-[#D4A94E]/60 mb-1" />
            )}
            <span className="text-[10px] text-[#A1887F] font-semibold tracking-wider uppercase">
              Prime Kitchen
            </span>
            <span className="text-[9px] text-[#8D6E63] mt-0.5 flex items-center gap-1">
              <Camera className="w-2.5 h-2.5" /> Photo pending
            </span>
          </div>
        )}

        {/* Popular Indicator */}
        {item.is_popular && item.is_available && (
          <div className="absolute top-2 left-2 bg-[#D4A94E] text-[#1B0F0A] text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
            Popular
          </div>
        )}

        {/* Spicy Indicator */}
        {item.is_spicy && (
          <div
            className="absolute bottom-2 right-2 bg-[#1B0F0A]/90 backdrop-blur-xs text-[#EFEBE9] p-1 rounded-md border border-[#5D4037]"
            title="Spiced / Seasoned"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
        )}
      </div>

      {/* Item Information */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="font-bold text-base sm:text-lg text-[#EFEBE9] group-hover:text-[#F3DC9B] transition-colors leading-snug">
              {item.name}
            </h3>

            {/* Price in Ethiopian Birr ONLY */}
            <div className="text-right shrink-0">
              <span className="text-base sm:text-lg font-bold text-[#D4A94E] tabular-nums whitespace-nowrap tracking-tight">
                {formatBirr(item.price)}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#D7CCC8] line-clamp-2 sm:line-clamp-3 leading-relaxed mb-2">
            {item.description}
          </p>

          {/* Portion / Sizes pill if item has multiple sizes (e.g. Ice Cream) */}
          {item.sizes && item.sizes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {item.sizes.map((s) => (
                <span
                  key={s.name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1B0F0A] border border-[#5D4037]/70 text-[10px] text-[#EFEBE9]"
                >
                  <span className="text-[#A1887F]">{s.name}:</span>
                  <strong className="text-[#D4A94E] font-semibold">{formatBirr(s.price)}</strong>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Status / Serving Time Notes */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#5D4037]/30 text-xs">
          {!item.is_available ? (
            <span className="text-xs font-semibold text-amber-300/80 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
              Not available today
            </span>
          ) : isOutsideServingHours ? (
            <span className="flex items-center gap-1 text-[11px] text-[#A1887F]">
              <Clock className="w-3 h-3 text-[#D4A94E]" />
              <span>
                Served {item.available_from ? `from ${item.available_from}` : ''}
                {item.available_until ? ` until ${item.available_until}` : ''}
              </span>
            </span>
          ) : item.available_from && item.available_until ? (
            <span className="flex items-center gap-1 text-[11px] text-[#8D6E63]">
              <Clock className="w-3 h-3 text-[#8D6E63]" />
              <span>{item.available_from} – {item.available_until}</span>
            </span>
          ) : null}

          {item.is_local_specialty && (
            <span className="text-[10px] text-[#D4A94E] font-medium ml-auto">
              Local Specialty
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
