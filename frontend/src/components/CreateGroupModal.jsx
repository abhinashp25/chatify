import { useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore }  from "../store/useChatStore";
import { XIcon, UsersIcon, CameraIcon } from "lucide-react";

export default function CreateGroupModal({ onClose }) {
  const { createGroup }   = useGroupStore();
  const { allContacts, getAllContacts } = useChatStore();
  const [name, setName]         = useState("");
  const [desc, setDesc]         = useState("");
  const [selected, setSelected] = useState([]);
  const [groupPic, setGroupPic] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");

  useState(() => { getAllContacts(); }, []);

  const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handlePic = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setGroupPic(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const g = await createGroup({ name, description: desc, memberIds: selected, groupPic });
    setLoading(false);
    if (g) onClose();
  };

  const filtered = allContacts.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5" style={{ color: '#4fd1c5' }} />
            <p className="font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>New Group</p>
          </div>
          <button onClick={onClose} className="icon-btn"><XIcon className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Group pic + name row */}
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: groupPic ? 'transparent' : 'var(--bg-input)', border: '2px dashed var(--border)' }}>
                {groupPic
                  ? <img src={groupPic} className="w-full h-full object-cover" alt="group" />
                  : <CameraIcon className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />}
              </div>
              <input type="file" accept="image/*" onChange={handlePic} className="hidden" />
            </label>
            <div className="flex-1 space-y-2">
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Group name *"
                className="w-full px-4 py-2.5 rounded-xl text-sm border-none focus:outline-none"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
              />
              <input
                type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-4 py-2.5 rounded-xl text-sm border-none focus:outline-none"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Contact search + selection */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Add Members ({selected.length} selected)
            </p>
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts…"
              className="w-full px-4 py-2 rounded-full text-sm border-none focus:outline-none mb-2"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
            />
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {filtered.map((c) => (
                <div key={c._id}
                  onClick={() => toggle(c._id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: selected.includes(c._id) ? 'rgba(79,209,197,0.1)' : 'transparent',
                    border: selected.includes(c._id) ? '1px solid rgba(79,209,197,0.3)' : '1px solid transparent',
                  }}>
                  <img src={c.profilePic || "/avatar.png"} className="w-9 h-9 rounded-full object-cover" alt="" />
                  <span className="text-[13px] font-medium flex-1" style={{ color: 'var(--text-primary)' }}>
                    {c.fullName}
                  </span>
                  {selected.includes(c._id) && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
                      style={{ background: '#4fd1c5' }}>✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all"
            style={{
              background: name.trim() && !loading
                ? 'linear-gradient(135deg, #4fd1c5 0%, #38b2ac 100%)'
                : 'var(--bg-input)',
              color: name.trim() && !loading ? 'white' : 'var(--text-muted)',
            }}
          >
            {loading ? "Creating…" : `Create Group${selected.length > 0 ? ` (${selected.length + 1} members)` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
