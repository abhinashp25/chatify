import { useEffect, useRef, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore }  from "../store/useAuthStore";
import {
  ArrowLeftIcon, UsersIcon, MoreVerticalIcon,
  SendIcon, ImageIcon, SmileIcon, XIcon, LogOutIcon, MicIcon,
} from "lucide-react";
import toast from "react-hot-toast";

const QUICK_EMOJIS = ["😊","😂","❤️","👍","🔥","😢","😮","🙏","😍","🎉"];

export default function GroupChatWindow({ group, onClose }) {
  const { authUser } = useAuthStore();
  const {
    groupMessages, fetchGroupMessages, sendGroupMessage,
    leaveGroup, groupTypingUsers, emitGroupTyping, emitGroupStopTyping,
  } = useGroupStore();

  const [text, setText]           = useState("");
  const [imgPreview, setImg]      = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [membersOpen, setMembers] = useState(false);
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);
  const timerRef  = useRef(null);
  const typingRef = useRef(false);

  const msgs     = groupMessages[group._id] || [];
  const typers   = groupTypingUsers[group._id] || {};
  const typingNames = Object.values(typers)
    .filter((n) => n !== authUser.fullName)
    .join(", ");

  useEffect(() => { fetchGroupMessages(group._id); }, [group._id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const handleTyping = (val) => {
    if (val.length > 0 && !typingRef.current) { typingRef.current = true; emitGroupTyping(group._id); }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { typingRef.current = false; emitGroupStopTyping(group._id); }, 1500);
    if (val.length === 0) { clearTimeout(timerRef.current); typingRef.current = false; emitGroupStopTyping(group._id); }
  };

  const handleSend = async () => {
    if (!text.trim() && !imgPreview) return;
    clearTimeout(timerRef.current); typingRef.current = false; emitGroupStopTyping(group._id);
    await sendGroupMessage(group._id, { text: text.trim(), image: imgPreview });
    setText(""); setImg(null); setEmojiOpen(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImg(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 h-[64px] flex-shrink-0"
        style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
        <button onClick={onClose} className="icon-btn sm:hidden"><ArrowLeftIcon className="w-5 h-5" /></button>

        {group.groupPic ? (
          <img src={group.groupPic} alt={group.name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: 'linear-gradient(135deg, #667eea, #4fd1c5)' }}>
            {group.name[0].toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setMembers(true)}>
          <p className="text-[15px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {group.name}
          </p>
          {typingNames ? (
            <p className="text-[12px]" style={{ color: '#4fd1c5' }}>{typingNames} typing…</p>
          ) : (
            <p className="text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>
              {group.members.length} members
            </p>
          )}
        </div>

        <div className="flex items-center gap-0.5 relative">
          <button className="icon-btn" onClick={() => setMembers(true)} title="Members">
            <UsersIcon className="w-[17px] h-[17px]" />
          </button>
          <button className={`icon-btn ${menuOpen ? "active" : ""}`}
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}>
            <MoreVerticalIcon className="w-[17px] h-[17px]" />
          </button>
          {menuOpen && (
            <div className="dropdown-menu animate-dropdown" style={{ top: 44, right: 0 }}
              onClick={(e) => e.stopPropagation()}>
              <button className="dropdown-item" onClick={() => { setMembers(true); setMenuOpen(false); }}>
                <UsersIcon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                View members
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" style={{ color: '#fc8181' }} onClick={() => {
                leaveGroup(group._id); setMenuOpen(false); onClose();
              }}>
                <LogOutIcon className="w-4 h-4" /> Leave group
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Members panel */}
      {membersOpen && (
        <div className="absolute inset-0 z-40 flex items-start justify-end"
          onClick={() => setMembers(false)}>
          <div className="w-72 h-full overflow-y-auto"
            style={{ background: 'var(--bg-panel)', borderLeft: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Members ({group.members.length})</p>
              <button className="icon-btn" onClick={() => setMembers(false)}><XIcon className="w-4 h-4" /></button>
            </div>
            {group.members.map((m) => (
              <div key={m._id || m} className="flex items-center gap-3 px-4 py-3">
                <img src={m.profilePic || "/avatar.png"} alt={m.fullName}
                  className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{m.fullName}</p>
                  {group.admins?.some((a) => (a._id || a) === (m._id || m)) && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(79,209,197,0.15)', color: '#4fd1c5' }}>Admin</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 chat-bg">
        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ background: 'rgba(79,209,197,0.1)', border: '1px solid rgba(79,209,197,0.2)' }}>
              👋
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Say hello to the group!
            </p>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-1">
          {msgs.map((msg, i) => {
            const isMine = (msg.senderId?._id || msg.senderId) === authUser._id;
            const sender = msg.senderId;
            const showAvatar = !isMine && (i === 0 || (msgs[i-1]?.senderId?._id || msgs[i-1]?.senderId) !== (sender?._id || sender));

            return (
              <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2`}>
                {!isMine && (
                  <div className="w-7 flex-shrink-0 mt-auto">
                    {showAvatar && (
                      <img src={sender?.profilePic || "/avatar.png"} alt=""
                        className="w-7 h-7 rounded-full object-cover" />
                    )}
                  </div>
                )}
                <div style={{ maxWidth: "min(75%, 480px)" }}>
                  {!isMine && showAvatar && (
                    <p className="text-[11px] font-semibold mb-0.5 px-1"
                      style={{ color: '#4fd1c5' }}>
                      {sender?.fullName || "Member"}
                    </p>
                  )}
                  <div className={isMine ? "bubble-mine" : "bubble-theirs"}>
                    {msg.isDeletedForAll ? (
                      <p className="text-[13px] italic opacity-40">This message was unsent.</p>
                    ) : (
                      <>
                        {msg.image && (
                          <img src={msg.image} alt="Shared"
                            className="rounded-xl max-h-[220px] w-full object-cover mb-1.5" />
                        )}
                        {msg.audio && <AudioPlayer src={msg.audio} />}
                        {msg.text && (
                          <p className="text-[14px] leading-[1.5] break-words">{msg.text}</p>
                        )}
                      </>
                    )}
                    <p className="text-[10px] text-right mt-1 opacity-50">
                      {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      {imgPreview && (
        <div className="px-3 pt-2" style={{ background: 'var(--bg-header)' }}>
          <div className="relative w-fit">
            <img src={imgPreview} className="w-16 h-16 object-cover rounded-xl" alt="Preview" />
            <button onClick={() => setImg(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
              <XIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
      {emojiOpen && (
        <div className="mx-3 mb-2 flex gap-1 flex-wrap rounded-2xl p-2.5 border"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
          {QUICK_EMOJIS.map((em) => (
            <button key={em} onClick={() => { setText(t => t + em); setEmojiOpen(false); }}
              className="text-xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-white/5">{em}</button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
        style={{ background: 'var(--bg-header)', borderTop: '1px solid var(--border)' }}>
        <button className={`icon-btn ${emojiOpen ? "active" : ""}`} onClick={() => setEmojiOpen(v => !v)}>
          <SmileIcon className="w-5 h-5" />
        </button>
        <input
          type="text" value={text}
          onChange={(e) => { setText(e.target.value); handleTyping(e.target.value); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          placeholder="Type a message…"
          className="msg-input"
        />
        <button className="icon-btn" onClick={() => fileRef.current?.click()}>
          <ImageIcon className="w-5 h-5" />
        </button>
        <input type="file" accept="image/*" ref={fileRef} onChange={handleImage} className="hidden" />
        <button onClick={handleSend} disabled={!text.trim() && !imgPreview}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0"
          style={{
            background: (text.trim() || imgPreview) ? 'linear-gradient(135deg, #4fd1c5, #38b2ac)' : 'var(--bg-input)',
            color: (text.trim() || imgPreview) ? 'white' : 'var(--text-muted)',
          }}>
          <SendIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AudioPlayer({ src }) {
  return (
    <audio controls className="w-full max-w-[220px] h-8 mt-1 mb-1" style={{ accentColor: '#4fd1c5' }}>
      <source src={src} />
    </audio>
  );
}
