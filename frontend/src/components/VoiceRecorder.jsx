import { useState, useRef } from "react";
import { MicIcon, StopCircleIcon, SendIcon, XIcon } from "lucide-react";

export default function VoiceRecorder({ onSend, onCancel }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setBlob]      = useState(null);
  const [audioURL,  setURL]       = useState(null);
  const [seconds,   setSeconds]   = useState(0);
  const mediaRef  = useRef(null);
  const timerRef  = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setBlob(blob);
        setURL(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      alert("Microphone access denied. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const handleSend = () => {
    if (!audioBlob) return;
    const reader = new FileReader();
    reader.onloadend = () => onSend(reader.result);
    reader.readAsDataURL(audioBlob);
  };

  const handleCancel = () => {
    if (recording) stopRecording();
    setBlob(null); setURL(null); setSeconds(0);
    onCancel();
  };

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  if (audioURL) {
    return (
      <div className="flex items-center gap-2 flex-1">
        <audio src={audioURL} controls className="flex-1 h-8" style={{ accentColor: '#4fd1c5' }} />
        <button onClick={handleSend} className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #4fd1c5, #38b2ac)', boxShadow: '0 4px 12px rgba(79,209,197,0.3)' }}>
          <SendIcon className="w-4 h-4" />
        </button>
        <button onClick={handleCancel} className="icon-btn"><XIcon className="w-4 h-4" /></button>
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-3 flex-1">
        <span className="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0"
          style={{ background: '#fc8181' }} />
        <span className="text-sm font-mono flex-1" style={{ color: 'var(--text-primary)' }}>
          {fmt(seconds)}
        </span>
        <button onClick={stopRecording}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(252,129,129,0.15)', color: '#fc8181' }}>
          <StopCircleIcon className="w-5 h-5" />
        </button>
        <button onClick={handleCancel} className="icon-btn"><XIcon className="w-4 h-4" /></button>
      </div>
    );
  }

  return (
    <button onClick={startRecording} className="icon-btn" title="Record voice message">
      <MicIcon className="w-5 h-5" />
    </button>
  );
}
