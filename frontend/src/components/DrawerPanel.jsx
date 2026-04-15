import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { useSettingsStore, THEMES } from "../store/useSettingsStore";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import {
  X, UserCircle, Palette, Bell, Shield,
  Wifi, HelpCircle, LogOut, ChevronRight, ArrowLeft, Camera, Check,
  Lock, Eye, EyeOff,
} from "lucide-react";

const DRAWER_SECTIONS = [
  { id: "profile",       icon: <UserCircle size={20} />,  label: "Profile" },
  { id: "customization", icon: <Palette size={20} />,     label: "Appearance" },
  { id: "notifications", icon: <Bell size={20} />,        label: "Notifications" },
  { id: "privacy",       icon: <Shield size={20} />,      label: "Privacy & Security" },
  { id: "datasaver",     icon: <Wifi size={20} />,        label: "Data & Storage" },
  { id: "help",          icon: <HelpCircle size={20} />,  label: "Help" },
];

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 bg-[#333] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white" />
    </label>
  );
}

export default function DrawerPanel({ isOpen, onClose }) {
  const [activeView, setActiveView] = useState("main");
  const { authUser, logout, updateProfile, updatePrivacy, isUpdatingProfile, toggle2FA } = useAuthStore();
  const { activeTheme, setTheme } = useSettingsStore();
  const { isSoundEnabled, toggleSound } = useChatStore();

  const fileInputRef  = useRef(null);
  const [editName, setEditName]     = useState(authUser?.fullName || "");
  const [editBio,  setEditBio]      = useState(authUser?.bio      || "");
  const [saveLoading, setSaveLoading] = useState(false);

  // Privacy state — mirrors the backend field on authUser
  const privacy = authUser?.privacySettings || { readReceipts: true, lastSeenFor: "everyone", profilePhotoFor: "everyone" };

  // 2FA
  const [twoFAPassword, setTwoFAPassword]   = useState("");
  const [showTwoFAForm, setShowTwoFAForm]   = useState(false);
  const [showPwd, setShowPwd]               = useState(false);
  const [twoFALoading, setTwoFALoading]     = useState(false);

  const currentSection = DRAWER_SECTIONS.find(s => s.id === activeView);

  const handleLogout = () => { logout(); onClose(); };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      await updateProfile({ profilePic: reader.result });
    };
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return toast.error("Name is required");
    setSaveLoading(true);
    await updateProfile({ fullName: editName, bio: editBio });
    setSaveLoading(false);
  };

  const handlePrivacyChange = async (field, value) => {
    try {
      await updatePrivacy({ [field]: value });
    } catch {
      // error toast is shown inside updatePrivacy
    }
  };

  const handleToggle2FA = async () => {
    if (!twoFAPassword.trim()) return toast.error("Enter your password to confirm");
    setTwoFALoading(true);
    const ok = await toggle2FA(twoFAPassword);
    setTwoFALoading(false);
    if (ok) { setShowTwoFAForm(false); setTwoFAPassword(""); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full sm:w-[380px] h-full flex flex-col border-l"
            style={{ background: "var(--bg-panel)", borderLeftColor: "var(--border)" }}
          >
            {/* Header */}
            <div className="flex items-center px-4 py-6 border-b" style={{ borderBottomColor: "var(--border)" }}>
              {activeView !== "main" && (
                <button onClick={() => setActiveView("main")}
                  className="p-2 mr-2 rounded-full hover:bg-white/10 transition-colors">
                  <ArrowLeft size={20} className="text-white" />
                </button>
              )}
              <h2 className="text-lg font-semibold brand-font flex-1 text-white">
                {activeView === "main" ? "Settings" : currentSection?.label}
              </h2>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              <AnimatePresence mode="wait">

                {/* MAIN VIEW */}
                {activeView === "main" && (
                  <motion.div key="main"
                    initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }} className="flex flex-col">

                    {/* Mini profile */}
                    <div
                      className="p-6 flex items-center gap-4 border-b cursor-pointer hover:bg-white/5 transition-colors"
                      style={{ borderBottomColor: "var(--border)" }}
                      onClick={() => setActiveView("profile")}
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-[#141414] border border-[#262626] flex-shrink-0">
                        <img src={authUser?.profilePic || "/avatar.png"} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl font-bold brand-font text-white truncate">{authUser?.fullName}</h3>
                        <p className="text-sm text-white/50 truncate">{authUser?.status || authUser?.bio || "Available"}</p>
                      </div>
                    </div>

                    {/* Nav items */}
                    <div className="p-4 space-y-1 mt-2">
                      {DRAWER_SECTIONS.map(section => (
                        <button key={section.id} onClick={() => setActiveView(section.id)}
                          className="w-full flex items-center justify-between p-4 rounded-xl transition-all group hover:bg-white/5">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg group-hover:bg-white/10 transition-colors"
                              style={{ color: "var(--text-secondary)" }}>
                              {section.icon}
                            </div>
                            <span className="font-medium text-[15px] text-white">{section.label}</span>
                          </div>
                          <ChevronRight size={18} className="text-[#a3a3a3] group-hover:text-white transition-colors" />
                        </button>
                      ))}

                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-4 mt-4 rounded-xl hover:bg-rose-500/10 transition-all group">
                        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20 transition-colors">
                          <LogOut size={20} />
                        </div>
                        <span className="font-medium text-[15px] text-rose-500/80 group-hover:text-rose-500">Log out</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* PROFILE VIEW */}
                {activeView === "profile" && (
                  <motion.div key="profile"
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                    className="p-6 flex flex-col items-center">

                    <div className="w-32 h-32 rounded-full overflow-hidden bg-[#141414] border border-[#262626] mb-6 relative group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}>
                      <img src={authUser?.profilePic || "/avatar.png"} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                        <Camera size={24} className="mb-1" />
                        <span className="text-[10px] uppercase font-bold text-center leading-tight">Change<br />Photo</span>
                      </div>
                      {isUpdatingProfile && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                          <div className="w-6 h-6 border-2 border-t-white border-white/20 rounded-full animate-spin" />
                        </div>
                      )}
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                    </div>

                    <div className="w-full space-y-6">
                      <div>
                        <label className="text-xs text-white uppercase tracking-widest font-semibold mb-2 block">Your Name</label>
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                          className="w-full bg-[#111111] border-b-2 border-[#262626] focus:border-white p-2 text-white outline-none transition-colors" />
                        <p className="text-[11px] text-[#a3a3a3] mt-2">Visible to your Chatify contacts.</p>
                      </div>
                      <div>
                        <label className="text-xs text-white uppercase tracking-widest font-semibold mb-2 block">About</label>
                        <input type="text" value={editBio} onChange={e => setEditBio(e.target.value)}
                          className="w-full bg-[#111111] border-b-2 border-[#262626] focus:border-white p-2 text-white outline-none transition-colors" />
                      </div>
                      <div className="text-xs text-[#a3a3a3] flex flex-col gap-1">
                        <span>Email: {authUser?.email}</span>
                        <span>Member since: {authUser?.createdAt ? new Date(authUser.createdAt).toLocaleDateString() : "—"}</span>
                      </div>
                      <button onClick={handleSaveProfile} disabled={saveLoading}
                        className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-[#e0e0e0] transition-colors flex items-center justify-center">
                        {saveLoading ? "Saving..." : "Save Profile"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* APPEARANCE VIEW */}
                {activeView === "customization" && (
                  <motion.div key="customization"
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                    className="p-6">
                    <div>
                      <h4 className="text-sm font-semibold text-[#a3a3a3] mb-4 uppercase tracking-wider">Themes</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(THEMES).map(([key, themeObj]) => (
                          <button key={key} onClick={() => setTheme(key)}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between
                              ${activeTheme === key
                                ? "bg-white/20 border-white text-white"
                                : "bg-[#141414] border-[#262626] text-white hover:border-[#555]"}`}>
                            <span className="flex items-center gap-2 text-sm">
                              <span>{themeObj.emoji}</span>
                              <span>{themeObj.name}</span>
                            </span>
                            {activeTheme === key && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* NOTIFICATIONS VIEW */}
                {activeView === "notifications" && (
                  <motion.div key="notifications"
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                    className="p-6">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-white font-medium">Message Sounds</p>
                        <p className="text-xs text-[#a3a3a3] mt-0.5">Play sounds for incoming messages</p>
                      </div>
                      <Toggle checked={isSoundEnabled} onChange={toggleSound} />
                    </div>
                  </motion.div>
                )}

                {/* PRIVACY VIEW */}
                {activeView === "privacy" && (
                  <motion.div key="privacy"
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                    className="p-6">
                    <div className="space-y-6">

                      <div className="flex items-center justify-between py-2 border-b border-[#1f1f1f]">
                        <div>
                          <p className="text-white font-medium">Read Receipts</p>
                          <p className="text-xs text-[#a3a3a3] mt-0.5">Let others know you've read their messages</p>
                        </div>
                        <Toggle
                          checked={privacy.readReceipts}
                          onChange={e => handlePrivacyChange("readReceipts", e.target.checked)}
                        />
                      </div>

                      <div className="py-2 border-b border-[#1f1f1f]">
                        <p className="text-white font-medium mb-1">Last Seen</p>
                        <p className="text-xs text-[#a3a3a3] mb-3">Who can see when you were last online</p>
                        <select
                          value={privacy.lastSeenFor}
                          onChange={e => handlePrivacyChange("lastSeenFor", e.target.value)}
                          className="w-full bg-[#141414] text-white p-3 rounded-xl border border-[#262626] outline-none">
                          <option value="everyone">Everyone</option>
                          <option value="contacts">My Contacts Only</option>
                          <option value="nobody">Nobody</option>
                        </select>
                      </div>

                      <div className="py-2 border-b border-[#1f1f1f]">
                        <p className="text-white font-medium mb-1">Profile Photo</p>
                        <p className="text-xs text-[#a3a3a3] mb-3">Who can see your profile picture</p>
                        <select
                          value={privacy.profilePhotoFor}
                          onChange={e => handlePrivacyChange("profilePhotoFor", e.target.value)}
                          className="w-full bg-[#141414] text-white p-3 rounded-xl border border-[#262626] outline-none">
                          <option value="everyone">Everyone</option>
                          <option value="contacts">My Contacts Only</option>
                          <option value="nobody">Nobody</option>
                        </select>
                      </div>

                      {/* Two-Factor Auth */}
                      <div className="py-2">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-white font-medium flex items-center gap-2">
                              <Lock size={15} className="text-[#a3a3a3]" />
                              Two-Factor Authentication
                            </p>
                            <p className="text-xs text-[#a3a3a3] mt-0.5">
                              {authUser?.twoFA?.enabled ? "2FA is active on your account" : "Add extra security with a one-time code"}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${authUser?.twoFA?.enabled ? "bg-emerald-500/15 text-emerald-400" : "bg-white/10 text-[#a3a3a3]"}`}>
                            {authUser?.twoFA?.enabled ? "On" : "Off"}
                          </span>
                        </div>
                        {!showTwoFAForm ? (
                          <button onClick={() => setShowTwoFAForm(true)}
                            className="w-full py-2.5 rounded-xl border border-[#262626] text-sm text-white hover:bg-white/5 transition-colors">
                            {authUser?.twoFA?.enabled ? "Disable 2FA" : "Enable 2FA"}
                          </button>
                        ) : (
                          <div className="space-y-3 mt-2">
                            <p className="text-xs text-[#a3a3a3]">Confirm your password to {authUser?.twoFA?.enabled ? "disable" : "enable"} 2FA</p>
                            <div className="relative">
                              <input
                                type={showPwd ? "text" : "password"}
                                value={twoFAPassword}
                                onChange={e => setTwoFAPassword(e.target.value)}
                                placeholder="Current password"
                                className="w-full bg-[#141414] border border-[#262626] text-white p-3 pr-10 rounded-xl outline-none text-sm"
                              />
                              <button type="button" onClick={() => setShowPwd(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373]">
                                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => { setShowTwoFAForm(false); setTwoFAPassword(""); }}
                                className="flex-1 py-2.5 rounded-xl border border-[#262626] text-sm text-[#a3a3a3] hover:bg-white/5 transition-colors">
                                Cancel
                              </button>
                              <button onClick={handleToggle2FA} disabled={twoFALoading}
                                className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-[#e0e0e0] transition-colors disabled:opacity-50">
                                {twoFALoading ? "Confirming..." : "Confirm"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* DATA SAVER VIEW */}
                {activeView === "datasaver" && (
                  <motion.div key="datasaver"
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                    className="p-6">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-white font-medium">Auto-Download Media</p>
                        <p className="text-xs text-[#a3a3a3] mt-0.5">Automatically download photos and videos</p>
                      </div>
                      <Toggle checked={true} onChange={() => {}} />
                    </div>
                  </motion.div>
                )}

                {/* HELP VIEW */}
                {activeView === "help" && (
                  <motion.div key="help"
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                    className="p-6 flex flex-col items-center pt-16">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4">
                      <HelpCircle size={40} className="text-black" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Chatify Web</h3>
                    <p className="text-[#a3a3a3] text-sm mb-8">Version 3.0.0</p>
                    <div className="w-full space-y-3">
                      <button className="w-full py-3 bg-[#141414] hover:bg-[#1f1f1f] border border-[#262626] text-white font-medium rounded-xl transition-colors">
                        Contact Support
                      </button>
                      <button className="w-full py-3 bg-[#141414] hover:bg-[#1f1f1f] border border-[#262626] text-white font-medium rounded-xl transition-colors">
                        Privacy Policy
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
