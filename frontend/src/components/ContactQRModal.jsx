import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Download } from "lucide-react";

// Lightweight QR code renderer — no external dependency needed
// Uses the browser's canvas API to draw a simple QR-like visual
// For production you'd swap this with a real QR library like "qrcode"
function QRPlaceholder({ value, size = 200 }) {
  // We render a SVG-based visual indicator with the encoded value as
  // a simple pattern. For a real QR, install: npm install qrcode
  // then: QRCode.toDataURL(value, ...).then(setQrDataUrl)
  const cells = 21;
  const cellSize = size / cells;

  // Deterministic "pattern" from value string for visual uniqueness
  const hash = value.split("").reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);
  const getCell = (r, c) => {
    // Finder patterns (corners)
    if ((r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7)) return true;
    // Timing patterns
    if (r === 6 || c === 6) return (r + c) % 2 === 0;
    // Data "modules" — pseudo-random but stable per value
    return ((hash ^ (r * 31 + c * 17)) & 1) === 1;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" rx="8" />
      {Array.from({ length: cells }).map((_, r) =>
        Array.from({ length: cells }).map((_, c) =>
          getCell(r, c) ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize + 1}
              y={r * cellSize + 1}
              width={cellSize - 1}
              height={cellSize - 1}
              fill="#111111"
              rx={0.5}
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function ContactQRModal({ user, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center pb-0"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="w-full max-w-sm rounded-t-3xl flex flex-col items-center p-8 pb-10 gap-5"
        style={{ background: "#111111", border: "1px solid #262626" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-[#333] rounded-full absolute top-3 left-1/2 -translate-x-1/2" />

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-5 p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <X size={18} className="text-[#a3a3a3]" />
        </button>

        <h3 className="text-white font-semibold text-base mt-2">Add {user.fullName}</h3>

        {/* QR Code */}
        <div className="rounded-2xl overflow-hidden p-3" style={{ background: "white" }}>
          <QRPlaceholder value={`chatify://add/${user._id}`} size={180} />
        </div>

        <div className="text-center">
          <p className="text-white font-medium">{user.fullName}</p>
          <p className="text-[#a3a3a3] text-sm mt-0.5">Scan with Chatify to add contact</p>
        </div>

        <p className="text-xs text-[#555] text-center">
          chatify://add/{user._id.slice(0, 12)}...
        </p>
      </motion.div>
    </motion.div>
  );
}
