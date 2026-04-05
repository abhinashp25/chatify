import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { MailIcon, LockIcon, LoaderIcon, ArrowRightIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  const set = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row bg-[#030303] overflow-hidden text-white selection:bg-[#4fd1c5]/30">
      
      {/* Left Hemisphere: Branding & Immersive Graphic (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-[#ffffff0a]">
        {/* Dynamic mesh gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] blur-[120px] opacity-40 pointer-events-none"
             style={{ background: 'radial-gradient(circle at 30% 30%, #153634 0%, transparent 40%), radial-gradient(circle at 70% 60%, #1a2035 0%, transparent 50%)' }} />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.04] mix-blend-overlay pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4fd1c5] to-[#667eea] flex items-center justify-center shadow-[0_0_20px_rgba(79,209,197,0.3)]">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain drop-shadow-md" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Chatify</span>
        </div>

        <div className="relative z-10 max-w-md">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-[40px] leading-[1.1] font-medium tracking-tight mb-6"
          >
            Connect with the world,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4fd1c5] to-[#667eea]">beautifully.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[#888] text-lg leading-relaxed"
          >
            Experience secure, ultra-fast real-time messaging designed for the modern era. Join millions of users on the world's most elegant communication platform.
          </motion.p>
          
          <div className="mt-12 flex items-center">
            {/* Mock avatars */}
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-[#030303] overflow-hidden relative z-[4-i]" style={{ marginLeft: i !== 0 ? '-12px' : 0 }}>
                <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
              </div>
            ))}
            <div className="text-sm font-medium text-[#777] ml-4">Over 2m+ users</div>
          </div>
        </div>
      </div>

      {/* Right Hemisphere: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        {/* Mobile background elements */}
        <div className="lg:hidden absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#4fd1c5] opacity-10 blur-[80px] rounded-full pointer-events-none" />
        <div className="lg:hidden absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-[#667eea] opacity-10 blur-[80px] rounded-full pointer-events-none" />

        <div className="w-full max-w-[380px] relative z-10">
          
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4fd1c5] to-[#667eea] flex items-center justify-center shadow-[0_0_20px_rgba(79,209,197,0.3)]">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain drop-shadow-md" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Chatify</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">Sign in</h2>
            <p className="text-[#888] text-sm mb-8">Enter your credentials to access your account.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MailIcon className="h-[18px] w-[18px] text-[#555] group-focus-within:text-[#4fd1c5] transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={set("email")}
                    placeholder="name@company.com"
                    className="block w-full pl-10 pr-4 py-3 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#4fd1c5]/50 focus:ring-1 focus:ring-[#4fd1c5] transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider">Password</label>
                  <Link to="#" className="text-xs text-[#4fd1c5] hover:text-[#38b2ac] font-medium transition-colors">Forgot password?</Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <LockIcon className="h-[18px] w-[18px] text-[#555] group-focus-within:text-[#4fd1c5] transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={set("password")}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-4 py-3 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#4fd1c5]/50 focus:ring-1 focus:ring-[#4fd1c5] transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full relative flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-[#030303] bg-white hover:bg-[#e6e6e6] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#030303] focus:ring-white disabled:opacity-50 transition-all mt-4"
              >
                {isLoggingIn ? (
                  <LoaderIcon className="w-5 h-5 animate-spin text-[#030303]" />
                ) : (
                  <span className="flex items-center gap-2">Sign in <ArrowRightIcon className="w-4 h-4" /></span>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#222] text-center">
              <p className="text-sm text-[#888]">
                Don't have an account?{" "}
                <Link to="/signup" className="text-white font-medium hover:text-[#4fd1c5] transition-colors">
                  Create one now
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
