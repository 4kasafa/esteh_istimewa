import { useCallback, useEffect, useState } from "react";

// ponytail: listener di level App (mount saat page load) agar beforeinstallprompt
// yang fire awal tidak terlewat seperti saat listener di SettingPanel.
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const checkPWA = () => {
      const standalone =
        typeof window !== "undefined" && typeof window.matchMedia === "function"
          ? window.matchMedia("(display-mode: standalone)").matches
          : false;
      // ponytail: iOS tidak punya display-mode, cek navigator.standalone.
      const iosStandalone =
        typeof window !== "undefined" && typeof window.navigator === "object"
          ? window.navigator.standalone === true
          : false;
      setIsPWA(standalone || iosStandalone);
    };
    checkPWA();

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setIsPWA(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return "unavailable";
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
    return outcome;
  }, [deferredPrompt]);

  return { deferredPrompt, isPWA, canInstall: Boolean(deferredPrompt), promptInstall };
}
