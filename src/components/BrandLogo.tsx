import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  customLogoUrl?: string;
  className?: string;
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  customLogoUrl,
  className = '',
  showSubtitle = true,
}) => {
  if (customLogoUrl && customLogoUrl.trim() !== '') {
    return (
      <div className={`relative flex items-center gap-3 ${className}`}>
        <img
          src={customLogoUrl}
          alt="Prime Cafe Logo"
          className={`rounded-full object-cover border-2 border-[#D4A94E] ${
            size === 'sm'
              ? 'w-9 h-9'
              : size === 'md'
              ? 'w-12 h-12'
              : size === 'lg'
              ? 'w-16 h-16'
              : 'w-24 h-24'
          }`}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        {showSubtitle && (
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-[#EFEBE9] uppercase text-sm sm:text-base font-sans">
              Prime Cafe
            </span>
            <span className="text-[11px] text-[#D4A94E] tracking-widest uppercase font-semibold">
              Coffee & Kitchen · Gelateria
            </span>
          </div>
        )}
      </div>
    );
  }

  const dimensionMap = {
    sm: { box: 'w-9 h-9', prime: 'text-[10px]', cafe: 'text-[8px]' },
    md: { box: 'w-12 h-12', prime: 'text-xs', cafe: 'text-[10px]' },
    lg: { box: 'w-16 h-16', prime: 'text-sm font-black', cafe: 'text-xs' },
    xl: { box: 'w-24 h-24', prime: 'text-xl font-black', cafe: 'text-base' },
  };

  const dim = dimensionMap[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* 
        Faithful recreation of the physical Prime Cafe sign from the photo:
        Circular matte-black badge with crisp 3D white slab lettering
      */}
      <div
        className={`relative ${dim.box} rounded-full bg-[#110D0B] border border-[#3E2723] flex flex-col items-center justify-center shadow-2xl shrink-0 select-none overflow-hidden transition-transform duration-200 hover:scale-105`}
        style={{
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Subtle rim highlight */}
        <div className="absolute inset-0.5 rounded-full border border-white/10" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-1">
          <span
            className={`font-black text-[#FFFFFF] tracking-wider leading-none ${dim.prime}`}
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            }}
          >
            PRIME
          </span>
          <span
            className={`font-black text-[#FFFFFF] tracking-widest leading-none ${dim.cafe} mt-0.5`}
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            }}
          >
            CAFE
          </span>
        </div>
      </div>

      {showSubtitle && (
        <div className="flex flex-col text-left">
          <span className="font-extrabold text-[#EFEBE9] tracking-tight uppercase text-sm sm:text-base leading-tight">
            Prime Cafe
          </span>
          <span className="text-[10px] sm:text-[11px] text-[#D4A94E] tracking-widest uppercase font-semibold">
            Coffee · Kitchen · Gelateria
          </span>
        </div>
      )}
    </div>
  );
};
