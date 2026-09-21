import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Alert from "../components/common/Alert";

export default function LoginPage({ hasApiUrl, loading, error, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    await onLogin({ username, password });
  }

  return (
    <main className="min-h-screen flex sm:items-center justify-center p-3 sm:p-4 bg-[#F8FAF8] relative overflow-hidden">
      {/* Modern Grid Glow Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[24px_24px]"></div>
      <div className="absolute left-1/4 top-1/4 w-125 h-125 bg-green-100/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-125 h-125 bg-emerald-100/40 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-105 sm:max-w-115 relative z-10">
        <section className="bg-white/80 backdrop-blur-3xl border border-white/60 rounded-4xl sm:rounded-[40px] p-6 sm:p-8 md:p-10 shadow-[0_40px_80px_-20px_rgba(22,163,74,0.12)]">
          
          <header className="flex flex-col items-center text-center mb-8 sm:mb-10">
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-emerald-500 to-green-600 rounded-[22px] sm:rounded-[30px] overflow-hidden flex items-center justify-center shadow-xl shadow-emerald-600/20 mb-5 sm:mb-6 p-1 select-none"
            >
              <img src="/Appic.svg" alt="Logo" className="w-full h-full object-contain pointer-events-none" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#14381C] tracking-tighter mb-1">
              Es Teh Istimewa
            </h1>
            <p className="text-brand-muted/80 font-semibold text-xs sm:text-sm tracking-tight">
              Aplikasi Laporan & Operasional
            </p>
          </header>

          <div className="space-y-4 sm:space-y-5">
            {!hasApiUrl && (
              <Alert type="error">Konfigurasi API (VITE_GAS_API_URL) belum diatur.</Alert>
            )}
            {error && <Alert type="error">{error}</Alert>}
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-[12px] font-black text-[#1B3A1E]/60 ml-1 uppercase tracking-widest">
                  Username
                </label>
                <input 
                  id="username"
                  className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl border border-[#B9CC9F] bg-white text-[#1B3A1E] focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-green/20 focus:border-brand-green transition-all duration-300 text-sm placeholder:text-brand-muted/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]" 
                  type="text" 
                  value={username} 
                  onChange={(event) => setUsername(event.target.value)} 
                  placeholder="Masukkan username"
                  autoComplete="username"
                  required 
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-[12px] font-black text-[#1B3A1E]/60 ml-1 uppercase tracking-widest">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    className="w-full pl-4 sm:pl-5 pr-12 py-3.5 sm:py-4 rounded-2xl border border-[#B9CC9F] bg-white text-[#1B3A1E] focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-green/20 focus:border-brand-green transition-all duration-300 text-sm placeholder:text-brand-muted/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-brand-muted/60 hover:text-brand-green hover:bg-brand-green/5 transition-colors focus:outline-none cursor-pointer"
                    aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                    title={showPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                className="mt-3 sm:mt-4 w-full bg-linear-to-r from-brand-green to-[#38B000] hover:from-[#1F7A39] hover:to-brand-green text-white font-black py-3.5 sm:py-4 rounded-2xl shadow-xl shadow-brand-green/20 transition-all active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 text-sm tracking-wide cursor-pointer"
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>MEMPROSES...</span>
                  </>
                ) : "MASUK"}
              </button>
            </form>
          </div>
        </section>

        <footer className="mt-6 sm:mt-8 text-center">
          <p className="text-[10px] text-brand-muted font-black tracking-[0.2em] uppercase opacity-30">
            &copy; {new Date().getFullYear()} &bull; BY KASAFA
          </p>
        </footer>
      </div>
    </main>
  );
}
