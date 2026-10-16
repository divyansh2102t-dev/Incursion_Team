'use client';

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWARegistration: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker active, scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }

    // Capture PWA installation prompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] Incursion successfully installed as desktop/mobile app.');
      setShowInstallBanner(false);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setInstallPrompt(null);
  };

  if (!showInstallBanner || isDismissed || !installPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up font-mono">
      <div className="bg-zinc-950/95 border border-cyan-500/60 p-3.5 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-xl flex items-center gap-3 text-xs text-zinc-200">
        <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
          <Download className="w-4 h-4 animate-bounce" />
        </div>
        <div>
          <span className="font-bold text-zinc-100 block">Install Incursion App</span>
          <span className="text-[10px] text-zinc-400">Offline-ready PWA for desktop & mobile</span>
        </div>
        <div className="flex items-center gap-1.5 ml-1">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-[11px] rounded-lg transition-all cursor-pointer shadow-xs"
          >
            Install
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
