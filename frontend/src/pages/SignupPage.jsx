import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { UserIcon, MailIcon, LockIcon, LoaderIcon, EyeIcon, EyeOffIcon, CheckIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function SignupPage() {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const { signup, isSigningUp } = useAuthStore();
  const handleSubmit = (e) => { e.preventDefault(); signup(formData); };
  const set = (k) => (e) => setFormData((p) => ({ ...p, [k]: e.target.value }));

  const pwStrength = (() => {
    const p = formData.password;
    if (!p) return null;
    if (p.length < 6) return { label: "Too short", color: '#fc8181', w: '25%' };
    if (p.length < 8) return { label: "Weak",      color: '#f6ad55', w: '50%' };
    if (!/[A-Z]/.test(p) && !/[0-9]/.test(p)) return { label: "Fair",   color: '#f6e05e', w: '65%' };
    return { label: "Strong", color: '#68d391', w: '100%' };
  })();

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center relative overflow-hidden py-6">
      {/* Background */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, #0a0f1a 0%, #0f1621 40%, #0a1628 70%, #0d1520 100%)',
      }} />
      <div className="absolute top-[-80px] right-[-60px] w-[350px] h-[350px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #667eea 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float 9s ease-in-out infinite' }} />
      <div className="absolute bottom-[-80px] left-[-60px] w-[300px] h-[300px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #4fd1c5 0%, transparent 70%)', filter: 'blur(50px)', animation: 'float 7s ease-in-out infinite reverse' }} />

      {/* Feature list decoration */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-5 opacity-30">
        {[
          ["💬", "Real-time messaging"],
          ["🤖", "AI chatbot assistant"],
          ["👥", "Group chats"],
          ["🎤", "Voice messages"],
          ["📁", "Archive conversations"],
          ["🔒", "End-to-end encrypted"],
        ].map(([icon, text]) => (
          <div key={text} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span className="text-lg">{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[420px] mx-4">

        {/* Logo + Title */}
        <div className="text-center mb-7">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 rounded-full opacity-40 blur-xl"
              style={{ background: 'linear-gradient(135deg, #667eea, #4fd1c5)', transform: 'scale(1.4)' }} />
            <div className="relative w-18 h-18 w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #4fd1c5 100%)' }}>
              <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9l-1 2H8l1-2-1-2h4l1 2zm4 0l-1 2h-2l1-2-1-2h2l1 2z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-[26px] font-bold" style={{ color: 'var(--text-primary)' }}>Create your account</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>Join millions of people on Chatify</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7 shadow-2xl relative overflow-hidden"
          style={{
            background: 'rgba(22, 29, 43, 0.85)',
            border: '1px solid rgba(102,126,234,0.15)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          }}>
          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: 'linear-gradient(90deg, transparent, #667eea, #4fd1c5, transparent)' }} />

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: "fullName", label: "Full Name", type: "text", placeholder: "Your full name", Icon: UserIcon },
              { key: "email",    label: "Email",     type: "email", placeholder: "you@example.com", Icon: MailIcon },
            ].map(({ key, label, type, placeholder, Icon }) => (
              <div key={key}>
                <label className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text-muted)' }}>{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type={type} value={formData[key]} onChange={set(key)}
                    placeholder={placeholder} required
                    className="w-full py-3 pl-10 pr-4 rounded-xl text-sm border-none focus:outline-none transition-all"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(102,126,234,0.4)'}
                    onBlur={(e)  => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
                  />
                  {formData[key].length > 0 && (
                    <CheckIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#68d391' }} />
                  )}
                </div>
              </div>
            ))}

            {/* Password with strength indicator */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: 'var(--text-muted)' }}>Password</label>
              <div className="relative">
                <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPw ? "text" : "password"} value={formData.password} onChange={set("password")}
                  placeholder="At least 6 characters" required minLength={6}
                  className="w-full py-3 pl-10 pr-11 rounded-xl text-sm border-none focus:outline-none transition-all"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(102,126,234,0.4)'}
                  onBlur={(e)  => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength bar */}
              {pwStrength && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px]" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: 'var(--bg-input)' }}>
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: pwStrength.w, background: pwStrength.color }} />
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={isSigningUp}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 mt-3 flex items-center justify-center gap-2"
              style={{
                background: isSigningUp ? 'var(--bg-input)' : 'linear-gradient(135deg, #667eea 0%, #4fd1c5 100%)',
                boxShadow: isSigningUp ? 'none' : '0 8px 24px rgba(102,126,234,0.25)',
              }}
              onMouseEnter={(e) => { if (!isSigningUp) e.target.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; }}
            >
              {isSigningUp ? <><LoaderIcon className="w-4 h-4 animate-spin" /> Creating account…</> : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{" "}
            <Link to="/login" className="font-bold" style={{ color: '#4fd1c5' }}>Sign in</Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
          {["🔒 Encrypted", "✨ Free forever", "🚀 Instant setup"].map((f) => (
            <span key={f} className="text-[11px] font-medium px-3 py-1 rounded-full"
              style={{ background: 'rgba(102,126,234,0.08)', color: '#667eea', border: '1px solid rgba(102,126,234,0.15)' }}>
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
