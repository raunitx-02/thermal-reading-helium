import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Check if already running standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isStandalone) {
      return; // Already installed
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt if on mobile/tablet viewport
      if (window.innerWidth <= 768) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS detection, show prompt after a delay if not dismissed before
    if (ios && window.innerWidth <= 768) {
      const shownBefore = localStorage.getItem('ios-pwa-prompt-shown');
      if (!shownBefore) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    if (isIOS) {
      localStorage.setItem('ios-pwa-prompt-shown', 'true');
    }
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-5 z-[200] flex flex-col gap-4 animate-ios-spring max-w-sm mx-auto">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3.5 pr-6">
        <div className="w-12 h-12 bg-blue-650 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
          <span className="text-2xl">🚂</span>
        </div>
        <div>
          <h4 className="font-extrabold text-sm text-slate-900 leading-tight">Add Thermal Portal to Home Screen</h4>
          <p className="text-[11px] text-slate-500 font-medium mt-1 leading-normal">
            Install the diagnostics app to launch instantly, work offline, and get real-time alarms.
          </p>
        </div>
      </div>

      {isIOS ? (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-600 space-y-1.5 font-semibold leading-relaxed">
          <p className="font-bold text-slate-700">How to Install on Safari (iOS):</p>
          <div className="flex items-center gap-1.5">
            <span className="bg-slate-200 text-slate-800 font-bold px-1.5 py-0.5 rounded">1</span>
            <span>Tap the <strong>Share</strong> button <span className="inline-block text-blue-500">⎙</span> in Safari menu bar.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-slate-200 text-slate-800 font-bold px-1.5 py-0.5 rounded">2</span>
            <span>Scroll down and select <strong>Add to Home Screen</strong>.</span>
          </div>
        </div>
      ) : (
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-md shadow-blue-500/10 active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          <span>Add to Home Screen</span>
        </button>
      )}
    </div>
  );
}
