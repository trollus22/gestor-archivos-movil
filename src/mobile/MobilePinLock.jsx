import React, { useState } from 'react';
import { Lock, Delete, ShieldCheck, Fingerprint } from 'lucide-react';
import { triggerHaptic } from './native-bridge.js';

export default function MobilePinLock({
  correctPin,
  onUnlock,
  title = 'Gestor de Archivos',
  subtitle = 'Introduce tu código PIN de 4 dígitos',
}) {
  const [pin, setPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);

  const handleDigit = (digit) => {
    if (pin.length >= 4) return;
    triggerHaptic('light');
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      if (newPin === correctPin) {
        triggerHaptic('medium');
        onUnlock();
      } else {
        triggerHaptic('medium');
        setErrorShake(true);
        setTimeout(() => {
          setPin('');
          setErrorShake(false);
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    triggerHaptic('light');
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111318] flex flex-col items-center justify-between p-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] text-white select-none">
      {/* Top Header */}
      <div className="flex flex-col items-center text-center mt-6">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 shadow-lg shadow-blue-900/20">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>

        {/* PIN Dots */}
        <div className={`flex items-center gap-4 mt-8 transition-transform ${errorShake ? 'animate-bounce text-rose-500' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  isFilled
                    ? errorShake
                      ? 'bg-rose-500 border-rose-500 scale-110'
                      : 'bg-blue-500 border-blue-500 scale-110'
                    : 'border-white/30 bg-transparent'
                }`}
              />
            );
          })}
        </div>
        {errorShake && <p className="text-xs text-rose-400 mt-3">PIN incorrecto. Inténtalo de nuevo.</p>}
      </div>

      {/* Numeric Keypad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-4 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(String(digit))}
            className="w-18 h-18 rounded-full bg-white/5 active:bg-white/20 text-2xl font-medium touch-target flex items-center justify-center border border-white/5 shadow-sm transition-transform active:scale-95"
          >
            {digit}
          </button>
        ))}

        <div className="flex items-center justify-center" />

        <button
          onClick={() => handleDigit('0')}
          className="w-18 h-18 rounded-full bg-white/5 active:bg-white/20 text-2xl font-medium touch-target flex items-center justify-center border border-white/5 shadow-sm transition-transform active:scale-95"
        >
          0
        </button>

        <button
          onClick={handleDelete}
          disabled={pin.length === 0}
          className="w-18 h-18 rounded-full bg-white/5 active:bg-white/20 text-gray-300 touch-target flex items-center justify-center border border-white/5 shadow-sm transition-transform active:scale-95 disabled:opacity-30"
          aria-label="Borrar dígito"
        >
          <Delete size={22} />
        </button>
      </div>
    </div>
  );
}
