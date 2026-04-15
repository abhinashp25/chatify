import { useState, useEffect, useRef, useCallback } from "react";
import { axiosInstance } from "../lib/axios";
import { Search, X, Film } from "lucide-react";

export default function GifPicker({ onSelect, onClose }) {
  const [query,    setQuery]    = useState("");
  const [gifs,     setGifs]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchGifs = useCallback(async (q) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/messages/gifs?q=${encodeURIComponent(q)}&limit=18`);
      setGifs(res.data);
    } catch (e) {
      if (e.response?.status === 500 && e.response?.data?.message?.includes("Tenor")) {
        setError("GIF search requires a Tenor API key (TENOR_API_KEY in backend .env)");
      } else {
        setError("Could not load GIFs");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load trending on mount
  useEffect(() => {
    fetchGifs("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [fetchGifs]);

  const handleSearch = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGifs(val), 500);
  };

  const handleSelect = (gif) => {
    // Use the medium GIF URL directly — no Cloudinary re-upload
    const url = gif.media_formats?.gif?.url || gif.media_formats?.mediumgif?.url;
    if (url) onSelect(url);
  };

  return (
    <div
      className="absolute bottom-[72px] left-0 right-0 mx-3 rounded-2xl overflow-hidden shadow-2xl z-50 flex flex-col"
      style={{ background: "#0d0d0d", border: "1px solid #1f1f1f", maxHeight: 340 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 flex-shrink-0">
        <Film size={16} className="text-[#a3a3a3] flex-shrink-0" />
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm rounded-xl pl-8 pr-3 py-2 outline-none placeholder:text-[#555]"
          />
          {query && (
            <button onClick={() => handleSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0">
          <X size={16} className="text-[#a3a3a3]" />
        </button>
      </div>

      <p className="text-[10px] text-[#444] px-4 pb-1 flex-shrink-0">
        {query ? `Results for "${query}"` : "Trending GIFs"}
      </p>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 no-scrollbar">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-t-white border-white/20 rounded-full animate-spin" />
          </div>
        )}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-6 text-center px-4">
            <Film size={28} className="text-[#333] mb-2" />
            <p className="text-[#555] text-xs">{error}</p>
          </div>
        )}
        {!loading && !error && gifs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-[#555] text-xs">No GIFs found</p>
          </div>
        )}
        {!loading && !error && gifs.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {gifs.map(gif => (
              <button
                key={gif.id}
                onClick={() => handleSelect(gif)}
                className="relative overflow-hidden rounded-lg aspect-square hover:opacity-90 active:scale-95 transition-transform"
                style={{ background: "#1a1a1a" }}
              >
                <img
                  src={gif.media_formats?.tinygif?.url || gif.media_formats?.gif?.url}
                  alt={gif.content_description || "GIF"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-[9px] text-[#333] text-center pb-2 flex-shrink-0">Powered by Tenor</p>
    </div>
  );
}
