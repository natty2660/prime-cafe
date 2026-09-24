import React, { useState, useEffect } from 'react';
import { generateQRCodeDataUrl, getMenuUrl, downloadQRPNG } from '../lib/qr.ts';
import { BrandLogo } from './BrandLogo.tsx';
import { PrintableQRCard } from './PrintableQRCard.tsx';
import { X, Download, Copy, Check, ExternalLink, Printer } from 'lucide-react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug?: string;
  cafeName?: string;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  onClose,
  slug = 'prime-cafe',
  cafeName = 'Prime Cafe',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [theme, setTheme] = useState<'buna_on_cream' | 'cream_on_buna' | 'classic'>('buna_on_cream');
  const [copied, setCopied] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [loading, setLoading] = useState(true);

  const menuUrl = getMenuUrl(slug);

  useEffect(() => {
    if (!isOpen) return;

    let darkColor = '#2B1A12';
    let lightColor = '#EFEBE9';

    if (theme === 'cream_on_buna') {
      darkColor = '#EFEBE9';
      lightColor = '#2B1A12';
    } else if (theme === 'classic') {
      darkColor = '#000000';
      lightColor = '#FFFFFF';
    }

    setLoading(true);
    generateQRCodeDataUrl({
      url: menuUrl,
      size: 1024,
      darkColor,
      lightColor,
    })
      .then((url) => {
        setQrDataUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed generating QR code:', err);
        setLoading(false);
      });
  }, [isOpen, theme, menuUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Could not copy link:', e);
    }
  };

  const handleDownloadPNG = async () => {
    let darkColor = '#2B1A12';
    let lightColor = '#EFEBE9';

    if (theme === 'cream_on_buna') {
      darkColor = '#EFEBE9';
      lightColor = '#2B1A12';
    } else if (theme === 'classic') {
      darkColor = '#000000';
      lightColor = '#FFFFFF';
    }

    await downloadQRPNG(slug, cafeName, darkColor, lightColor);
  };

  if (showPrintView) {
    return (
      <PrintableQRCard
        qrDataUrl={qrDataUrl}
        menuUrl={menuUrl}
        cafeName={cafeName}
        onBack={() => setShowPrintView(false)}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#2B1A12] border border-[#5D4037] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-[#EFEBE9]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#5D4037] bg-[#3E2723]">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="sm" showSubtitle={false} />
            <div>
              <h2 className="text-base font-bold text-[#EFEBE9]">Table QR Code</h2>
              <p className="text-[11px] text-[#D4A94E]">Permanent Live Digital Menu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#D7CCC8] hover:text-[#EFEBE9] hover:bg-[#2B1A12] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* Permanent URL banner */}
          <div className="w-full bg-[#1B0F0A] border border-[#5D4037]/80 rounded-lg p-2.5 mb-5 text-left">
            <span className="text-[10px] text-[#A1887F] uppercase tracking-wider block font-semibold">
              Permanent QR Destination
            </span>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <span className="text-xs text-[#D4A94E] font-mono truncate select-all">
                {menuUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded hover:bg-[#3E2723] text-[#D7CCC8] hover:text-[#EFEBE9] transition-colors shrink-0"
                title="Copy link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="relative p-4 rounded-xl bg-[#EFEBE9] border-4 border-[#D4A94E] shadow-xl mb-4 flex items-center justify-center w-64 h-64">
            {loading ? (
              <div className="text-xs text-[#2B1A12] font-semibold animate-pulse">
                Generating 1200px High-Res QR...
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Prime Cafe QR Code"
                className="w-full h-full object-contain"
              />
            ) : null}
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs text-[#A1887F]">Style:</span>
            <button
              onClick={() => setTheme('buna_on_cream')}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                theme === 'buna_on_cream'
                  ? 'bg-[#D4A94E] text-[#1B0F0A] font-bold border-[#D4A94E]'
                  : 'bg-[#3E2723] text-[#D7CCC8] border-[#5D4037]'
              }`}
            >
              Espresso on Cream
            </button>
            <button
              onClick={() => setTheme('cream_on_buna')}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                theme === 'cream_on_buna'
                  ? 'bg-[#D4A94E] text-[#1B0F0A] font-bold border-[#D4A94E]'
                  : 'bg-[#3E2723] text-[#D7CCC8] border-[#5D4037]'
              }`}
            >
              Cream on Espresso
            </button>
            <button
              onClick={() => setTheme('classic')}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                theme === 'classic'
                  ? 'bg-[#D4A94E] text-[#1B0F0A] font-bold border-[#D4A94E]'
                  : 'bg-[#3E2723] text-[#D7CCC8] border-[#5D4037]'
              }`}
            >
              High Contrast
            </button>
          </div>

          {/* Core Rule Guarantee */}
          <p className="text-xs text-[#D7CCC8] leading-relaxed mb-6 bg-[#3E2723]/60 p-3 rounded-lg border border-[#5D4037]/60">
            <strong>QR Never Changes:</strong> You can print this once for all cafe tables. When you change Fuul from 250 to 300 Birr in the Admin Dashboard, this SAME QR code will display the updated price instantly.
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
            <button
              onClick={handleDownloadPNG}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4A94E] text-[#1B0F0A] text-xs font-bold hover:bg-[#F3DC9B] shadow-md transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PNG (1200px)
            </button>

            <button
              onClick={() => setShowPrintView(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#3E2723] text-[#EFEBE9] hover:bg-[#4E342E] text-xs font-semibold border border-[#5D4037] transition-colors"
            >
              <Printer className="w-4 h-4 text-[#D4A94E]" />
              Printable Stand Card
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-[#5D4037]/50 w-full flex items-center justify-between text-[11px] text-[#A1887F]">
            <span>Error Correction: Level M</span>
            <a
              href={menuUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#D4A94E] hover:underline"
            >
              Test Scan View <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
