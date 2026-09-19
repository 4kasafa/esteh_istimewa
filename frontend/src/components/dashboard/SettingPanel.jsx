import {
  ArrowLeft,
  ChevronRight,
  Download,
  Info,
  Mail,
  MessageSquareWarning,
  RefreshCw,
  Send,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

const DEV_CONTACT = import.meta.env.VITE_DEV_CONTACT || "6285156704029";

export default function SettingPanel({
  user,
}) {
  const [activeSub, setActiveSub] = useState("main"); // main, account, download, report, about
  const [reportMessage, setReportMessage] = useState("");
  const [isPWA, setIsPWA] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = typeof window !== "undefined" && typeof window.matchMedia === "function" 
        ? window.matchMedia("(display-mode: standalone)").matches 
        : false;
      setIsPWA(isStandalone);
    };
    checkPWA();

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => {
      setIsPWA(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback jika prompt tidak tersedia (misal di iOS atau sudah terinstal tapi belum terdeteksi)
      alert("Gunakan menu 'Tambahkan ke Layar Utama' pada browser kamu jika tombol tidak muncul.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const menuItems = [
    {
      key: "account",
      label: "Akun",
      icon: UserRound,
      description: "Informasi detail profil kamu",
    },
    {
      key: "refresh",
      label: "Muat Ulang",
      icon: RefreshCw,
      description: "Refresh data aplikasi terbaru",
      action: () => window.location.reload(),
    },
    ...(!isPWA
      ? [
          {
            key: "download",
            label: "Download Aplikasi",
            icon: Download,
            description: "Install di layar utama (Chrome)",
          },
        ]
      : []),
    {
      key: "report",
      label: "Lapor Masalah",
      icon: MessageSquareWarning,
      description: "Hubungi developer via WhatsApp",
    },
    {
      key: "about",
      label: "Tentang",
      icon: Info,
      description: "Versi dan info aplikasi",
    },
  ];

  const handleSendReport = () => {
    if (!reportMessage.trim()) return;
    const encoded = encodeURIComponent(
      `*LAPOR ERROR - Es Teh Istimewa App*\n\nUser: ${user?.nama} (${user?.email})\n\nPesan:\n${reportMessage}`
    );
    window.open(`https://wa.me/${DEV_CONTACT}?text=${encoded}`, "_blank");
  };

  if (activeSub === "account") {
    return (
      <SubPageLayout title="Info Akun" onBack={() => setActiveSub("main")}>
        <div className="space-y-6">
          <div className="flex flex-col items-center py-6">
            <div className="h-24 w-24 rounded-3xl bg-emerald-50 flex items-center justify-center text-brand-green mb-4 border-2 border-emerald-200">
              <UserRound size={48} />
            </div>
            <h4 className="text-xl font-black text-brand-green-dark">{user?.nama || "User"}</h4>
            <span className="px-3 py-1 bg-brand-green/10 text-brand-green text-xs font-black rounded-full uppercase tracking-widest mt-2 border border-brand-green/20">
              {user?.role || "Staff"}
            </span>
          </div>

          <div className="grid gap-4">
            <div className="p-4 rounded-2xl bg-brand-bg/50 border border-brand-green/5">
              <p className="text-[10px] font-black uppercase text-brand-muted opacity-60 mb-1">Email Aktif</p>
              <p className="font-bold text-brand-green-dark flex items-center gap-2">
                <Mail size={14} className="text-brand-green" />
                {user?.email || "-"}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-brand-bg/50 border border-brand-green/5">
              <p className="text-[10px] font-black uppercase text-brand-muted opacity-60 mb-1">ID Pengguna</p>
              <p className="font-mono text-sm text-brand-green-dark">{user?.id || "N/A"}</p>
            </div>
          </div>
        </div>
      </SubPageLayout>
    );
  }

  if (activeSub === "download") {
    return (
      <SubPageLayout title="Instal Aplikasi" onBack={() => setActiveSub("main")}>
        <div className="space-y-6 text-brand-green-dark">
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex gap-3">
            <Download className="text-emerald-600 shrink-0" size={20} />
            <p className="text-sm font-bold leading-relaxed text-brand-green-dark">
              Tekan tombol download di bawah untuk menginstal aplikasi Es Teh Istimewa langsung ke HP kamu.
            </p>
          </div>

          <div className="space-y-8 py-4">
            <Step num="1" title="Gunakan Google Chrome" desc="Pastikan kamu membuka link ini menggunakan browser Chrome di Android agar fitur download berfungsi." />
            <Step num="2" title="Tekan Tombol Download" desc="Klik tombol 'DOWNLOAD SEKARANG' yang ada di bagian bawah halaman ini." />
            <Step num="3" title="Konfirmasi Instalasi" desc="Pilih 'Instal' atau 'Tambahkan' pada jendela konfirmasi yang muncul dari browser." />
            <Step num="4" title="Selesai" desc="Aplikasi akan muncul di layar utama HP kamu dan siap digunakan kapan saja." />
          </div>

          <div className="pt-4">
            <button
              onClick={handleInstall}
              className="w-full bg-brand-green text-white py-4 rounded-2xl font-black shadow-lg shadow-brand-green/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Download size={20} />
              DOWNLOAD SEKARANG
            </button>
            <p className="text-[10px] text-center mt-4 text-brand-muted font-bold opacity-50 uppercase tracking-widest">
              Hanya tersedia untuk browser Google Chrome
            </p>
          </div>
        </div>
      </SubPageLayout>
    );
  }

  if (activeSub === "report") {
    return (
      <SubPageLayout title="Lapor Masalah" onBack={() => setActiveSub("main")}>
        <div className="space-y-4">
          <p className="text-sm text-brand-muted font-bold px-1">
            Jelaskan masalah atau saran yang ingin kamu sampaikan kepada tim pengembang.
          </p>
          <textarea
            value={reportMessage}
            onChange={(e) => setReportMessage(e.target.value)}
            placeholder="Ketik pesan kamu di sini..."
            className="w-full min-h-40 bg-brand-bg border border-brand-green/10 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-green/20 placeholder:opacity-30"
          />
          <button
            onClick={handleSendReport}
            disabled={!reportMessage.trim()}
            className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black shadow-lg shadow-green-500/20 flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-[#20bd5a] transition-all"
          >
            <Send size={20} />
            KIRIM KE WHATSAPP
          </button>
        </div>
      </SubPageLayout>
    );
  }

  if (activeSub === "about") {
    return (
      <SubPageLayout title="Tentang Aplikasi" onBack={() => setActiveSub("main")}>
        <div className="space-y-6 text-center">
          <div className="flex justify-center py-4">
            <div className="h-20 w-20 rounded-3xl bg-brand-green-dark overflow-hidden shadow-xl flex items-center justify-center transition-transform hover:rotate-6 duration-300 p-2 border border-emerald-500/20">
              <img src="/Appic.svg" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-2xl font-black text-brand-green-dark">Es Teh Istimewa App</h4>
            <p className="text-xs font-black tracking-[0.2em] text-brand-muted opacity-50 uppercase">Versi 1.0.0 Stable</p>
          </div>
          
          <div className="bg-brand-bg/50 p-6 rounded-3xl border border-brand-green/5 text-sm leading-relaxed text-brand-muted font-bold text-left">
            Dashboard operasional <span className="text-brand-green">Es Teh Istimewa</span> dirancang untuk memudahkan input dan monitoring transaksi harian outlet secara real-time.
          </div>

          <div className="pt-4 text-[10px] font-black text-brand-muted/40 uppercase tracking-widest">
            Developed with ❤️ by Kasafa Dev
          </div>
        </div>
      </SubPageLayout>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={item.action ? item.action : () => setActiveSub(item.key)}
              className="w-full bg-white p-4 rounded-3xl border border-brand-green/5 flex items-center gap-4 text-left hover:bg-brand-green/5 transition-all group active:scale-[0.98]"
            >
              <div className="h-12 w-12 rounded-2xl bg-brand-bg group-hover:bg-white flex items-center justify-center text-brand-green transition-colors">
                <Icon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-black text-brand-green-dark text-base">{item.label}</h5>
                <p className="text-xs text-brand-muted font-bold opacity-60 truncate">{item.description}</p>
              </div>
              <ChevronRight size={20} className="text-brand-muted opacity-30" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SubPageLayout({ title, onBack, children }) {
  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="h-10 w-10 rounded-xl bg-white border border-brand-green/10 flex items-center justify-center text-brand-green-dark hover:bg-brand-green hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <h3 className="text-2xl font-black text-brand-green-dark">{title}</h3>
      </div>
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 border border-brand-green/5 card-shadow">
        {children}
      </div>
    </div>
  );
}

function Step({ num, title, desc }) {
  return (
    <div className="flex gap-4">
      <div className="h-8 w-8 rounded-full bg-brand-green text-white shrink-0 flex items-center justify-center font-black text-sm shadow-md shadow-brand-green/20">
        {num}
      </div>
      <div className="space-y-1">
        <h5 className="font-black text-brand-green-dark">{title}</h5>
        <p className="text-xs text-brand-muted font-bold leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
