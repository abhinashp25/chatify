import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore, THEMES } from '../store/useSettingsStore';
import { useChatStore } from '../store/useChatStore';
import toast from 'react-hot-toast';
import { 
  X, UserCircle, Palette, Bell, Shield, 
  Wifi, HelpCircle, LogOut, ChevronRight, ArrowLeft, Camera, CheckIcon
} from 'lucide-react';

const DRAWER_SECTIONS = [
  { id: 'profile', icon: <UserCircle size={20} />, label: 'Profile' },
  { id: 'customization', icon: <Palette size={20} />, label: 'Appearance' },
  { id: 'notifications', icon: <Bell size={20} />, label: 'Notifications' },
  { id: 'privacy', icon: <Shield size={20} />, label: 'Privacy' },
  { id: 'datasaver', icon: <Wifi size={20} />, label: 'Data & Storage' },
  { id: 'help', icon: <HelpCircle size={20} />, label: 'Help' },
];

export default function DrawerPanel({ isOpen, onClose }) {
  const [activeView, setActiveView] = useState('main'); 
  const { authUser, logout, updateProfile, isUpdatingProfile } = useAuthStore();
  const { theme, setTheme } = useSettingsStore();
  const { isSoundEnabled, toggleSound } = useChatStore();

  const fileInputRef = useRef(null);
  const [editName, setEditName] = useState(authUser?.fullName || "");
  const [editBio, setEditBio] = useState(authUser?.bio || "");
  const [saveLoading, setSaveLoading] = useState(false);

  // Stubs for toggles
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeen, setLastSeen] = useState('everyone');
  const [autoDwnMedia, setAutoDwnMedia] = useState(true);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const currentSection = DRAWER_SECTIONS.find(s => s.id === activeView);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      await updateProfile({ profilePic: reader.result });
      toast.success("Profile photo updated");
    };
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return toast.error("Name is required");
    setSaveLoading(true);
    await updateProfile({ fullName: editName, bio: editBio });
    setSaveLoading(false);
    toast.success("Profile saved");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
            onClick={onClose}
          />

          {/* Drawer Body */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full sm:w-[380px] h-full flex flex-col border-l"
            style={{ background: 'var(--bg-panel)', borderLeftColor: 'var(--border)' }}
          >
            {/* Header */}
            <div className="flex items-center px-4 py-6 border-b" style={{ borderBottomColor: 'var(--border)' }}>
              {activeView !== 'main' ? (
                <button 
                  onClick={() => setActiveView('main')}
                  className="p-2 mr-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft size={20} className="text-white" />
                </button>
              ) : null}
              
              <h2 className="text-lg font-semibold brand-font flex-1 text-white">
                {activeView === 'main' ? 'Settings' : currentSection?.label}
              </h2>

              <button 
                onClick={onClose}
                className="p-2 rounded-xl transition-colors hover:bg-white/10"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative">
              <AnimatePresence mode="wait">
                
                {/* HEAD VIEW */}
                {activeView === 'main' && (
                  <motion.div 
                    key="main"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col"
                  >
                    {/* User Mini Profile Header */}
                    <div 
                      className="p-6 flex items-center gap-4 border-b cursor-pointer hover:bg-white/5 transition-colors" 
                      style={{ borderBottomColor: 'var(--border)' }}
                      onClick={() => setActiveView('profile')}
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-[#141414] border border-[#262626] flex-shrink-0">
                        <img 
                          src={authUser?.profilePic || "/avatar.png"} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl font-bold brand-font tracking-wide text-white truncate">{authUser?.fullName}</h3>
                        <p className="text-sm text-white/50 truncate">{authUser?.status || authUser?.bio || "Available"}</p>
                      </div>
                    </div>

                    {/* Nav Items */}
                    <div className="p-4 space-y-2 mt-2">
                      {DRAWER_SECTIONS.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => setActiveView(section.id)}
                          className="w-full flex items-center justify-between p-4 rounded-xl transition-all group hover:bg-white/5"
                        >
                          <div className="flex items-center gap-4 transition-colors">
                            <div className="p-2 rounded-lg group-hover:bg-white/10 transition-colors" style={{ color: "var(--text-secondary)" }}>
                              {section.icon}
                            </div>
                            <span className="font-medium text-[15px] text-white">{section.label}</span>
                          </div>
                          <ChevronRight size={18} className="text-[#a3a3a3] group-hover:text-white transition-colors" />
                        </button>
                      ))}

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-4 mt-6 rounded-xl hover:bg-rose-500/10 transition-all group"
                      >
                        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20 transition-colors">
                          <LogOut size={20} />
                        </div>
                        <span className="font-medium text-[15px] text-rose-500/80 group-hover:text-rose-500">Log out</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* PROFILE VIEW */}
                {activeView === 'profile' && (
                  <motion.div 
                    key="profile" initial={{ x: 20, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                    className="p-6 flex flex-col items-center"
                  >
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-[#141414] border border-[#262626] mb-6 relative group cursor-pointer"
                         onClick={() => fileInputRef.current?.click()}
                    >
                      <img 
                        src={authUser?.profilePic || "/avatar.png"} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                        <Camera size={24} className="mb-1" />
                        <span className="text-[10px] uppercase font-bold text-center leading-tight">Change<br/>Photo</span>
                      </div>
                      {isUpdatingProfile && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                          <div className="w-6 h-6 border-2 border-t-[#ffffff] border-white/20 rounded-full animate-spin" />
                        </div>
                      )}
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                    </div>
                    
                    <div className="w-full space-y-6">
                      <div>
                        <label className="text-xs text-[#ffffff] uppercase tracking-widest font-semibold mb-2 block">Your Name</label>
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-[#111111] border-b-2 border-[#262626] focus:border-[#ffffff] p-2 text-white outline-none transition-colors" 
                        />
                        <p className="text-[11px] text-[#a3a3a3] mt-2">This is not your username or pin. This name will be visible to your contacts.</p>
                      </div>
                      <div>
                        <label className="text-xs text-[#ffffff] uppercase tracking-widest font-semibold mb-2 block">About</label>
                        <input 
                          type="text" 
                          value={editBio} 
                          onChange={(e) => setEditBio(e.target.value)}
                          className="w-full bg-[#111111] border-b-2 border-[#262626] focus:border-[#ffffff] p-2 text-white outline-none transition-colors" 
                        />
                      </div>
                      <button 
                        onClick={handleSaveProfile}
                        disabled={saveLoading}
                        className="w-full py-3 bg-[#ffffff] text-black font-bold rounded-xl hover:bg-[#00c298] transition-colors mt-4 flex items-center justify-center"
                      >
                        {saveLoading ? "Saving..." : "Save Profile"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* CUSTOMIZATION VIEW */}
                {activeView === 'customization' && (
                  <motion.div 
                    key="customization" initial={{ x: 20, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                    className="p-6"
                  >
                     <div className="space-y-8">
                        <div>
                          <h4 className="text-sm font-semibold text-[#a3a3a3] mb-4 uppercase tracking-wider">Themes</h4>
                          <div className="grid grid-cols-2 gap-3">
                              {THEMES.map((t) => (
                                <button 
                                  key={t} 
                                  onClick={() => setTheme(t)}
                                  className={`p-3 rounded-xl border transition-all capitalize flex items-center justify-between
                                    ${theme === t ? 'bg-[#ffffff]/20 border-[#ffffff] text-[#ffffff]' : 'bg-[#141414] border-[#262626] text-white hover:border-[#555]'}`}
                                >
                                  {t}
                                  {theme === t && <CheckIcon size={16} />}
                                </button>
                              ))}
                          </div>
                        </div>
                     </div>
                  </motion.div>
                )}

                {/* NOTIFICATIONS VIEW */}
                {activeView === 'notifications' && (
                  <motion.div 
                    key="notifications" initial={{ x: 20, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                    className="p-6"
                  >
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Message Sounds</p>
                          <p className="text-xs text-[#a3a3a3]">Play sounds for incoming messages</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={isSoundEnabled} onChange={toggleSound} />
                          <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffffff]"></div>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PRIVACY VIEW */}
                {activeView === 'privacy' && (
                  <motion.div 
                    key="privacy" initial={{ x: 20, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                    className="p-6"
                  >
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Read Receipts</p>
                          <p className="text-xs text-[#a3a3a3]">If turned off, you won't send or receive Read Receipts.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={readReceipts} onChange={() => setReadReceipts(!readReceipts)} />
                          <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffffff]"></div>
                        </label>
                      </div>
                      <div className="pt-4 border-t border-[#262626]">
                        <p className="text-[#a3a3a3] text-sm font-semibold mb-3">Last Seen</p>
                        <select 
                          className="w-full bg-[#141414] text-white p-3 rounded-xl border border-[#262626] outline-none"
                          value={lastSeen}
                          onChange={(e) => setLastSeen(e.target.value)}
                        >
                          <option value="everyone">Everyone</option>
                          <option value="contacts">My Contacts</option>
                          <option value="nobody">Nobody</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* DATASAVER VIEW */}
                {activeView === 'datasaver' && (
                  <motion.div 
                    key="datasaver" initial={{ x: 20, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                    className="p-6"
                  >
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Auto-Download Media</p>
                          <p className="text-xs text-[#a3a3a3]">Automatically download photos/videos</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={autoDwnMedia} onChange={() => setAutoDwnMedia(!autoDwnMedia)} />
                          <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffffff]"></div>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* HELP VIEW */}
                {activeView === 'help' && (
                  <motion.div 
                    key="help" initial={{ x: 20, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                    className="p-6 flex flex-col items-center justify-center pt-20"
                  >
                    <div className="w-20 h-20 bg-[#ffffff] rounded-full flex items-center justify-center mb-4">
                      <HelpCircle size={40} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Chatify Web</h3>
                    <p className="text-[#a3a3a3] text-sm mb-6">Version 2.7.1</p>
                    
                    <button className="w-full py-3 bg-[#141414] hover:bg-[#262626] border border-[#262626] text-white font-medium rounded-xl transition-colors mb-3">
                      Contact Us
                    </button>
                    <button className="w-full py-3 bg-[#141414] hover:bg-[#262626] border border-[#262626] text-white font-medium rounded-xl transition-colors">
                      Terms and Privacy Policy
                    </button>
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
