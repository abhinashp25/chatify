import { useState } from "react";

export default function LinkPreviewCard({ preview, isMine }) {
  const [imgError, setImgError] = useState(false);

  if (!preview?.url) return null;
  if (!preview.title && !preview.description && !preview.image) return null;

  const domain = (() => {
    try { return new URL(preview.url).hostname.replace(/^www\./, ""); }
    catch { return preview.siteName || ""; }
  })();

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 mb-1 rounded-xl overflow-hidden transition-opacity hover:opacity-90"
      style={{
        background: isMine ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.08)",
        textDecoration: "none",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* OG image */}
      {preview.image && !imgError && (
        <img
          src={preview.image}
          alt=""
          className="w-full object-cover"
          style={{ maxHeight: 160 }}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      )}

      <div className="px-3 py-2.5 flex items-start gap-2">
        {/* Favicon */}
        {preview.favicon && (
          <img
            src={preview.favicon}
            alt=""
            className="w-4 h-4 rounded mt-0.5 flex-shrink-0 object-contain"
            onError={(e) => e.currentTarget.style.display = "none"}
            loading="lazy"
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Site name / domain */}
          <p className="text-[10px] font-bold uppercase tracking-wider truncate"
            style={{ color: isMine ? "rgba(255,255,255,0.45)" : "var(--text-muted)" }}>
            {preview.siteName || domain}
          </p>

          {/* Title */}
          {preview.title && (
            <p className="text-[13px] font-semibold mt-0.5 leading-snug"
              style={{
                color: isMine ? "rgba(255,255,255,0.9)" : "var(--text-primary)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
              {preview.title}
            </p>
          )}

          {/* Description */}
          {preview.description && (
            <p className="text-[11px] mt-0.5 leading-relaxed"
              style={{
                color: isMine ? "rgba(255,255,255,0.5)" : "var(--text-muted)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
              {preview.description}
            </p>
          )}
        </div>

        {/* External link icon */}
        <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: isMine ? "rgba(255,255,255,0.3)" : "var(--text-muted)" }}>
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </div>
    </a>
  );
}
