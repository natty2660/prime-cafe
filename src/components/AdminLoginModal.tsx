import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo.tsx';
import { Lock, X, AlertCircle, KeyRound } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        onSuccess(data.token);
        onClose();
        setPassword('');
      } else {
        setError(data.message || 'Invalid admin password. Please try again.');
      }
    } catch {
      // Offline fallback: if backend isn't responding or client is offline, check standard default password
      if (password.trim() === 'primecafe2026') {
        const mockToken = 'client_token_prime_cafe_2026';
        onSuccess(mockToken);
        onClose();
        setPassword('');
      } else {
        setError('Incorrect password. Default for Prime Cafe is primecafe2026.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#2B1A12] border border-[#5D4037] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden text-[#EFEBE9]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#5D4037] bg-[#3E2723]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#D4A94E]" />
            <h2 className="text-sm font-bold text-[#EFEBE9] uppercase tracking-wide">
              Prime Cafe Admin Access
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#D7CCC8] hover:text-[#EFEBE9] hover:bg-[#2B1A12] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-center mb-4">
            <BrandLogo size="md" showSubtitle={false} />
          </div>

          <p className="text-xs text-[#D7CCC8] text-center mb-5 leading-relaxed">
            Enter the cafe owner password to update prices, menu items, serving hours, and categories.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#A1887F] mb-1.5">
                Staff Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#8D6E63] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoFocus
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#1B0F0A] border border-[#5D4037] rounded-lg text-[#EFEBE9] focus:outline-hidden focus:border-[#D4A94E] focus:ring-1 focus:ring-[#D4A94E]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-[#D4A94E] text-[#1B0F0A] font-bold text-xs hover:bg-[#F3DC9B] shadow-md transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Sign In to Dashboard'}
            </button>
          </div>

          <div className="mt-5 pt-3 border-t border-[#5D4037]/50 text-center">
            <span className="text-[11px] text-[#A1887F]">
              Default cafe password: <code className="text-[#D4A94E] font-mono">primecafe2026</code>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
