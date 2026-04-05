import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { UserIcon, MailIcon, LockIcon, LoaderIcon, ArrowRightIcon, CheckCircle2Icon } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function SignupPage() {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const { signup, isSigningUp } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    signup(formData);
  };

  const set = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  // Dynamic Password Validation
  const pwdLength = formData.password.length >= 6;
  const pwdUpper = /[A-Z]/.test(formData.password);
  const pwdNumber = /[0-9]/.test(formData.password);
  
  const score = (pwdLength ? 1 : 0) + (pwdUpper ? 1 : 0) + (pwdNumber ? 1 : 0);
  const getStrengthBarColor = () => {
    if (score === 0) return "bg-[#222]";
    if (score === 1) return "bg-[#f56565]";
    if (score === 2) return "bg-[#ecc94b]";
    return "bg-[#48bb78]";
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row-reverse bg-[#030303] overflow-hidden text-white selection:bg-[#667eea]/30">
      
      {/* Right Hemisphere: Branding & Features (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden border-l border-[#ffffff0a]">
        {/* Dynamic mesh gradients */}
        <div className="absolute top-[-20%] right-[-20%] w-[140%] h-[140%] blur-[120px] opacity-40 pointer-events-none"
             style={{ background: 'radial-gradient(circle at 70% 30%, #17203a 0%, transparent 40%), radial-gradient(circle at 30% 60%, #153634 0%, transparent 50%)' }} />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.04] mix-blend-overlay pointer-events-none" />

        <div className="relative z-10 flex items-center justify-end gap-3">
          <span className="text-xl font-bold tracking-tight text-white">Chatify</span>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#667eea] to-[#4fd1c5] flex items-center justify-center shadow-[0_0_20px_rgba(102,126,234,0.3)]">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain drop-shadow-md" />
          </div>
        </div>

        <div className="relative z-10 max-w-md mx-auto xl:mx-0 xl:ml-auto text-right">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-[40px] leading-[1.1] font-medium tracking-tight mb-6"
          >
            Start your journey,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#4fd1c5] to-[#667eea]">securely.</span>
          </motion.h1>
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-5 text-left bg-[#0d0d0d]/80 backdrop-blur-xl border border-[#222] p-6 rounded-2xl">
            {[
              { icon: '🔒', title: 'End-to-End Encryption', desc: 'Your messages are strictly private.' },
              { icon: '⚡', title: 'Ultra-Low Latency', desc: 'Real-time sync globally in milliseconds.' },
              { icon: '🤖', title: 'AI Automation', desc: 'Smart replies and assistant features.' }
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-lg">{feature.icon}</div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{feature.title}</h4>
                  <p className="text-xs text-[#777] mt-1">{feature.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Left Hemisphere: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-[380px] relative z-10">
          
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#667eea] to-[#4fd1c5] flex items-center justify-center shadow-[0_0_20px_rgba(102,126,234,0.3)]">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain drop-shadow-md" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Chatify</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">Create an account</h2>
            <p className="text-[#888] text-sm mb-8">Enter your details below to get started immediately.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserIcon className="h-[18px] w-[18px] text-[#555] group-focus-within:text-[#667eea] transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={set("fullName")}
                    placeholder="John Doe"
                    className="block w-full pl-10 pr-4 py-3 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#667eea]/50 focus:ring-1 focus:ring-[#667eea] transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MailIcon className="h-[18px] w-[18px] text-[#555] group-focus-within:text-[#667eea] transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={set("email")}
                    placeholder="name@company.com"
                    className="block w-full pl-10 pr-4 py-3 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#667eea]/50 focus:ring-1 focus:ring-[#667eea] transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <LockIcon className="h-[18px] w-[18px] text-[#555] group-focus-within:text-[#667eea] transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={set("password")}
                    placeholder="Create a strong password"
                    className="block w-full pl-10 pr-4 py-3 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#667eea]/50 focus:ring-1 focus:ring-[#667eea] transition-all"
                    required
                  />
                </div>
                
                {formData.password.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 overflow-hidden">
                    <div className="flex gap-1 h-1.5 rounded-full overflow-hidden w-full bg-[#111]">
                      <div className={`h-full w-1/3 transition-colors duration-300 ${score >= 1 ? getStrengthBarColor() : 'bg-[#222]'}`} />
                      <div className={`h-full w-1/3 transition-colors duration-300 ${score >= 2 ? getStrengthBarColor() : 'bg-[#222]'}`} />
                      <div className={`h-full w-1/3 transition-colors duration-300 ${score >= 3 ? getStrengthBarColor() : 'bg-[#222]'}`} />
                    </div>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-[#777]">
                      <span className="flex items-center gap-1"><CheckCircle2Icon className={`w-3 h-3 ${pwdLength ? 'text-emerald-500' : ''}`} /> 6+ chars</span>
                      <span className="flex items-center gap-1"><CheckCircle2Icon className={`w-3 h-3 ${pwdUpper ? 'text-emerald-500' : ''}`} /> Uppercase</span>
                      <span className="flex items-center gap-1"><CheckCircle2Icon className={`w-3 h-3 ${pwdNumber ? 'text-emerald-500' : ''}`} /> Number</span>
                    </div>
                  </motion.div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSigningUp || score === 0}
                className="w-full relative flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#667eea] to-[#4fd1c5] hover:opacity-90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#030303] focus:ring-[#667eea] disabled:opacity-50 disabled:grayscale transition-all mt-6 shadow-[0_0_20px_rgba(102,126,234,0.15)]"
              >
                {isSigningUp ? (
                  <LoaderIcon className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <span className="flex items-center gap-2">Create Account <ArrowRightIcon className="w-4 h-4" /></span>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#222] text-center">
              <p className="text-sm text-[#888]">
                Already have an account?{" "}
                <Link to="/login" className="text-white font-medium hover:text-[#667eea] transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
