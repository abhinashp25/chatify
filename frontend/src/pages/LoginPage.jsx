import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { MailIcon, LockIcon, LoaderIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const { login, isLoggingIn } = useAuthStore();
  const handleSubmit = (e) => { e.preventDefault(); login(formData); };
  const set = (k) => (e) => setFormData((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, #0a0f1a 0%, #0f1621 40%, #0a1628 70%, #0d1520 100%)',
      }} />

      {/* Floating orbs */}
      <div className="absolute top-[-120px] left-[-80px] w-[400px] h-[400px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #4fd1c5 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float 8s ease-in-out infinite' }} />
      <div className="absolute bottom-[-100px] right-[-60px] w-[350px] h-[350px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #667eea 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float 10s ease-in-out infinite reverse' }} />
      <div className="absolute top-[40%] right-[15%] w-[200px] h-[200px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #4fd1c5 0%, transparent 70%)', filter: 'blur(40px)', animation: 'float 6s ease-in-out infinite' }} />

      {/* Floating chat bubbles decorations */}
      <div className="absolute top-12 left-12 hidden lg:flex flex-col gap-3 opacity-20">
        <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm text-xs text-white max-w-[160px]"
          style={{ background: '#1a4a3d' }}>Hey, how are you? 👋</div>
        <div className="px-4 py-2.5 rounded-2xl rounded-br-sm text-xs ml-8 max-w-[160px]"
          style={{ background: '#1e2a3a', color: '#8fa3b8' }}>I'm great, just got here!</div>
        <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm text-xs text-white max-w-[180px]"
          style={{ background: '#1a4a3d' }}>Chatify is amazing 🔥</div>
      </div>

      <div className="absolute bottom-16 right-12 hidden lg:flex flex-col gap-3 items-end opacity-20">
        <div className="px-4 py-2.5 rounded-2xl rounded-br-sm text-xs max-w-[160px]"
          style={{ background: '#1e2a3a', color: '#8fa3b8' }}>Real-time messaging ⚡</div>
        <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm text-xs text-white max-w-[160px]"
          style={{ background: '#1a4a3d' }}>End-to-end encrypted 🔒</div>
      </div>

      {/* Main form card */}
      <div className="relative z-10 w-full max-w-[420px] mx-4">

        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 rounded-full opacity-40 blur-xl"
              style={{ background: 'linear-gradient(135deg, #4fd1c5, #667eea)', transform: 'scale(1.4)' }} />
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #4fd1c5 0%, #38b2ac 50%, #667eea 100%)' }}>
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9l-1 2H8l1-2-1-2h4l1 2zm4 0l-1 2h-2l1-2-1-2h2l1 2z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-[28px] font-bold" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--text-muted)' }}>Sign in to your Chatify account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7 shadow-2xl relative overflow-hidden"
          style={{
            background: 'rgba(22, 29, 43, 0.85)',
            border: '1px solid rgba(79,209,197,0.15)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          }}>
          {/* Card top glow */}
          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: 'linear-gradient(90deg, transparent, #4fd1c5, #667eea, transparent)' }} />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: 'var(--text-muted)' }}>Email</label>
              <div className="relative">
                <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email" value={formData.email} onChange={set("email")}
                  placeholder="you@example.com" required
                  className="w-full py-3 pl-10 pr-4 rounded-xl text-sm border-none focus:outline-none transition-all"
                  style={{
                    background: 'var(--bg-input)', color: 'var(--text-primary)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(79,209,197,0.4)'}
                  onBlur={(e)  => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: 'var(--text-muted)' }}>Password</label>
              <div className="relative">
                <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPw ? "text" : "password"} value={formData.password} onChange={set("password")}
                  placeholder="Enter your password" required
                  className="w-full py-3 pl-10 pr-11 rounded-xl text-sm border-none focus:outline-none transition-all"
                  style={{
                    background: 'var(--bg-input)', color: 'var(--text-primary)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(79,209,197,0.4)'}
                  onBlur={(e)  => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 mt-2 flex items-center justify-center gap-2"
              style={{
                background: isLoggingIn ? 'var(--bg-input)' : 'linear-gradient(135deg, #4fd1c5 0%, #38b2ac 50%, #3182ce 100%)',
                boxShadow: isLoggingIn ? 'none' : '0 8px 24px rgba(79,209,197,0.25)',
              }}
              onMouseEnter={(e) => { if (!isLoggingIn) e.target.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; }}
            >
              {isLoggingIn ? <><LoaderIcon className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{" "}
            <Link to="/signup" className="font-bold transition-colors" style={{ color: '#4fd1c5' }}>
              Create one
            </Link>
          </p>
        </div>

        {/* Feature badges */}
        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
          {["🔒 Encrypted", "⚡ Real-time", "🤖 AI Powered"].map((f) => (
            <span key={f} className="text-[11px] font-medium px-3 py-1 rounded-full"
              style={{ background: 'rgba(79,209,197,0.08)', color: '#4fd1c5', border: '1px solid rgba(79,209,197,0.15)' }}>
              {f}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(-10px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
}
