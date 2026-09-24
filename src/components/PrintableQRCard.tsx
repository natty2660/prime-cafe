import React from 'react';
import { BrandLogo } from './BrandLogo.tsx';
import { ArrowLeft, Printer } from 'lucide-react';

interface PrintableQRCardProps {
  qrDataUrl: string;
  menuUrl: string;
  cafeName: string;
  onBack: () => void;
}

export const PrintableQRCard: React.FC<PrintableQRCardProps> = ({
  qrDataUrl,
  menuUrl,
  cafeName,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1B0F0A] overflow-y-auto flex flex-col items-center p-4 sm:p-8">
      {/* Control Bar (hidden when printing) */}
      <div className="w-full max-w-md flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3E2723] text-[#D7CCC8] hover:text-[#EFEBE9] text-xs font-semibold border border-[#5D4037] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to QR Studio
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A94E] text-[#1B0F0A] text-xs font-bold hover:bg-[#F3DC9B] shadow-md transition-colors"
        >
          <Printer className="w-4 h-4" /> Print Table Stand (A6)
        </button>
      </div>

      {/* Printable A6 / Table Stand Card */}
      <div
        id="printable-card"
        className="relative w-full max-w-sm aspect-[1/1.414] bg-[#2B1A12] border-4 border-[#D4A94E] rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between text-center shadow-2xl text-[#EFEBE9] overflow-hidden"
        style={{
          boxShadow: '0 20px 40px rgba(0,0,0,0.8), inset 0 0 25px rgba(212,169,78,0.15)',
        }}
      >
        {/* Subtle Decorative Borders */}
        <div className="absolute inset-2 rounded-2xl border border-dashed border-[#D4A94E]/40 pointer-events-none" />

        {/* Top: Cafe Identity */}
        <div className="flex flex-col items-center pt-2">
          <BrandLogo size="lg" showSubtitle={false} />
          <h1 className="text-2xl font-black text-[#EFEBE9] font-display tracking-tight mt-2 uppercase">
            {cafeName}
          </h1>
          <p className="text-[12px] font-bold text-[#D4A94E] tracking-widest uppercase mt-0.5">
            Coffee & Kitchen · Gelateria
          </p>
        </div>

        {/* Center: QR Code Container */}
        <div className="flex flex-col items-center my-3">
          <div className="bg-[#EFEBE9] p-3 rounded-2xl border-4 border-[#D4A94E] shadow-xl w-52 h-52 flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Prime Cafe Menu QR Code"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-xs text-[#2B1A12]">Loading QR...</div>
            )}
          </div>
          <span className="text-[10px] text-[#A1887F] font-mono mt-2 tracking-tight">
            {menuUrl}
          </span>
        </div>

        {/* Bottom: Instructions & Trust Markers */}
        <div className="flex flex-col items-center pb-2">
          <div className="bg-[#3E2723] px-4 py-1.5 rounded-full border border-[#5D4037] mb-2">
            <span className="text-xs font-extrabold text-[#D4A94E] uppercase tracking-wide">
              Scan With Your Phone Camera
            </span>
          </div>

          <p className="text-[11px] text-[#D7CCC8] leading-tight max-w-[260px]">
            No app download or Wi-Fi login required. View our full live menu with real-time Birr prices.
          </p>

          <div className="flex items-center gap-2.5 mt-3 text-[10px] text-[#A1887F]">
            <span>Breakfast</span>
            <span>·</span>
            <span>Lunch</span>
            <span>·</span>
            <span>Dinner</span>
            <span>·</span>
            <span>Ice Cream</span>
            <span>·</span>
            <span>Espresso</span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background-color: transparent !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-card, #printable-card * {
            visibility: visible;
          }
          #printable-card {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            margin: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};
