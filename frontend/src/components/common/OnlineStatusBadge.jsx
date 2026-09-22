import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(callback) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

export default function OnlineStatusBadge() {
  const online = useSyncExternalStore(subscribe, getSnapshot);

  if (online) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[200] animate-fade-in">
      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-300 shadow-lg shadow-amber-500/10">
        <WifiOff size={14} className="text-amber-600 shrink-0" />
        <span className="text-xs font-black text-amber-800 tracking-tight">
          Offline — data mungkin tidak tersedia
        </span>
      </div>
    </div>
  );
}
