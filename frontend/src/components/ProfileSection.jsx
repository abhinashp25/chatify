import { useState, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { CameraIcon, Edit2Icon, CheckIcon, UserIcon, ArrowLeftIcon, InfoIcon } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function ProfileSection({ onClose }) {
  const { authUser, updateProfile, isUpdatingProfile } = useAuthStore();
  const fileInputRef = useRef(null);

  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState(authUser?.fullName || "");
  const [editBio, setEditBio] = useState(false);
  const [bioVal, setBioVal] = useState(authUser?.bio || "");

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      await updateProfile({ profilePic: base64Image });
    };
  };

  const saveName = async () => {
    if (!nameVal.trim()) return toast.error("Name cannot be empty");
    setEditName(false);
    if (nameVal !== authUser.fullName) {
      await updateProfile({ fullName: nameVal });
    }
  };

  const saveBio = async () => {
    setEditBio(false);
    if (bioVal !== authUser.bio) {
      await updateProfile({ bio: bioVal });
    }
  };

  return (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: 0 }}
      exit={{ x: "-100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col h-full absolute inset-0 z-20"
      style={{ background: "#111111" }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-5 h-16 sm:h-[68px] flex-shrink-0" style={{ background: "#111111", color: "white" }}>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeftIcon className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-[19px] font-medium">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ background: "#000000" }}>
        {/* Avatar Section */}
        <div className="flex justify-center py-8">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img
              src={authUser.profilePic || "/avatar.png"}
              alt="Profile"
              className="w-40 h-40 rounded-full object-cover transition-opacity duration-300 group-hover:opacity-60 border-2 border-transparent relative z-10"
            />
            <div className="absolute inset-0 z-20 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
              <CameraIcon className="w-8 h-8 text-white mb-2" />
              <span className="text-white text-xs text-center px-4 uppercase font-medium">
                Change<br/>Profile Photo
              </span>
            </div>
            {isUpdatingProfile && (
              <div className="absolute inset-0 z-30 flex items-center justify-center rounded-full bg-black/60">
                <div className="w-8 h-8 border-4 border-t-[#ffffff] border-white/20 rounded-full animate-spin" />
              </div>
            )}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
          </div>
        </div>

        {/* Name Section */}
        <div className="px-7 py-4" style={{ background: "#0a0a0a", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p className="text-[14px] mb-2 flex items-center gap-2" style={{ color: "#ffffff" }}>
            <UserIcon className="w-4 h-4" />
            Your name
          </p>
          <div className="flex items-center justify-between">
            {editName ? (
              <input
                autoFocus
                type="text"
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                className="w-full bg-transparent text-white focus:outline-none border-b-2 border-[#ffffff] pb-1 text-[17px]"
              />
            ) : (
              <p className="text-white text-[17px] truncate">{authUser.fullName}</p>
            )}
            <button onClick={() => editName ? saveName() : setEditName(true)} className="ml-4 text-[#a3a3a3] hover:text-[#ffffff] p-1 rounded-full transition-colors">
              {editName ? <CheckIcon className="w-5 h-5 text-[#ffffff]" /> : <Edit2Icon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="px-7 py-4 text-[14px]" style={{ color: "#a3a3a3" }}>
          This is not your username or pin. This name will be visible to your Chatify contacts.
        </div>

        {/* About Section */}
        <div className="px-7 py-4 mt-2" style={{ background: "#0a0a0a", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p className="text-[14px] mb-2 flex items-center gap-2" style={{ color: "#ffffff" }}>
            <InfoIcon className="w-4 h-4" />
            About
          </p>
          <div className="flex items-center justify-between">
            {editBio ? (
              <input
                autoFocus
                type="text"
                value={bioVal}
                onChange={(e) => setBioVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveBio()}
                className="w-full bg-transparent text-white focus:outline-none border-b-2 border-[#ffffff] pb-1 text-[17px]"
              />
            ) : (
              <p className="text-white text-[17px] truncate">{authUser.bio || "Available"}</p>
            )}
            <button onClick={() => editBio ? saveBio() : setEditBio(true)} className="ml-4 text-[#a3a3a3] hover:text-[#ffffff] p-1 rounded-full transition-colors">
              {editBio ? <CheckIcon className="w-5 h-5 text-[#ffffff]" /> : <Edit2Icon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Additional Detail - Read-Only */}
        <div className="px-7 py-4 mt-6 text-[14px]" style={{ color: "#a3a3a3" }}>
          Account Information
        </div>
        <div className="px-7 py-4" style={{ background: "#0a0a0a" }}>
          <div>
            <p className="text-[#a3a3a3] text-xs">Email</p>
            <p className="text-white text-[15px]">{authUser.email}</p>
          </div>
          <div className="mt-4">
            <p className="text-[#a3a3a3] text-xs">Member since</p>
            <p className="text-white text-[15px]">{new Date(authUser.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}