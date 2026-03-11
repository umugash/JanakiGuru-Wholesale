"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StaffLogin from "./StaffLogin";
import ProductCard from "./ProductCard";

const DECODE_MAP: Record<string, string> = {
  "1":"R","2":"O","3":"Y","4":"A","5":"L","6":"T","7":"I","8":"M","9":"E","0":"S"
};

export function encodePrice(price: number): string {
  return String(price).split("").map(d => DECODE_MAP[d] || d).join("");
}

export function parseCategories(cat: any): string[] {
  if (!cat) return [];
  if (Array.isArray(cat)) return cat.map((c: string) => String(c).trim()).filter(Boolean);
  if (typeof cat === "string") {
    // Remove escaped quotes and try JSON parse
    const cleaned = cat.replace(/\\"/g, '"').replace(/\\'/g, "'");
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return parsed.map((c: string) => String(c).trim()).filter(Boolean);
    } catch {}
    // Strip leading/trailing brackets and split
    const stripped = cat.replace(/^\[|\]$/g, "").replace(/['"]/g, "").replace(/\\/g, "");
    return stripped.split(",").map((c: string) => c.trim()).filter(Boolean);
  }
  return [];
}

interface Props {
  staff: any;
  showLogin: boolean;
  onShowLogin: () => void;
  onHideLogin: () => void;
  onStaffChange: (s: any) => void;
  onLogout: () => void;
}

export default function ProductGrid({ staff, showLogin, onShowLogin, onHideLogin, onStaffChange, onLogout }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [fullscreen, setFullscreen] = useState<{ product: any; index: number } | null>(null);

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("name");
    if (data) {
      setProducts(data);
      const cats = new Set<string>();
      data.forEach((p: any) => { parseCategories(p.category).forEach(cat => cats.add(cat)); });
      setCategories(["All", ...Array.from(cats).sort()]);
    }
    setLoading(false);
  }

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      (Array.isArray(p.keywords) ? p.keywords : []).some((k: string) => k.toLowerCase().includes(search.toLowerCase()));
    const pCats = parseCategories(p.category);
    const matchCat = activeCategory === "All" || pCats.some(c => c === activeCategory);
    return matchSearch && matchCat;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui,sans-serif" }}>
      <style>{`
        @keyframes fsIn { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)", padding: "14px 16px 16px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 12px rgba(220,38,38,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Janaki Guru Enterprises</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", fontWeight: 600, letterSpacing: "1px" }}>WHOLESALE PRICE LIST</div>
          </div>
          <div>
            {staff ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>Staff</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{staff.name}</div>
                </div>
                <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 10, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Logout</button>
              </div>
            ) : (
              <button onClick={onShowLogin} style={{ background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: 12, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🔐 Staff Login</button>
            )}
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            style={{ width: "100%", background: "#fff", borderRadius: 12, border: "none", padding: "10px 12px 10px 34px", fontSize: 14, outline: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
        </div>
      </div>



      <div className="scrollbar-hide" style={{ display: "flex", gap: 8, padding: "10px 12px", overflowX: "auto", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            flexShrink: 0, padding: "5px 12px", borderRadius: 20,
            border: activeCategory === cat ? "none" : "1.5px solid #fca5a5",
            background: activeCategory === cat ? "linear-gradient(135deg,#ef4444,#b91c1c)" : "#fff5f5",
            color: activeCategory === cat ? "#fff" : "#dc2626",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>{cat}</button>
        ))}
      </div>

      <div style={{ padding: "12px 10px 80px" }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 10 }}>
          {activeCategory === "All" ? "All Products" : activeCategory} ({filtered.length} items)
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Loading products...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>No products found</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} staff={staff}
                onImageClick={(idx: number) => setFullscreen({ product: p, index: idx })} />
            ))}
          </div>
        )}
      </div>

      {fullscreen && <FullscreenViewer product={fullscreen.product} startIndex={fullscreen.index} onClose={() => setFullscreen(null)} />}
      {showLogin && <StaffLogin onClose={onHideLogin} onSuccess={onStaffChange} />}
    </div>
  );
}

function FullscreenViewer({ product, startIndex, onClose }: any) {
  const media = [...(product.image_url || []), ...(product.video_url ? [product.video_url] : [])];
  const [idx, setIdx] = useState(startIndex);
  const [downloading, setDownloading] = useState(false);
  function isVideo(url: string) { return !!(url?.match(/\.(mp4|webm|ogg|mov)$/i)); }
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  async function handleDownload() {
    const url = media[idx];
    if (!url) return;
    setDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const ext = isVideo(url) ? "mp4" : "jpg";
      const filename = product.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() + "_" + (idx + 1) + "." + ext;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
    setDownloading(false);
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "linear-gradient(160deg,#1a0000,#2d0000,#1a0000)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "fsIn 0.25s ease both" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(135deg,#ef4444,#b91c1c)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }} onClick={e => e.stopPropagation()}>
        <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {media.length > 1 && <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{idx + 1}/{media.length}</span>}
          <button onClick={e => { e.stopPropagation(); handleDownload(); }} disabled={downloading} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: 10, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            {downloading ? "⏳" : "⬇️"} {downloading ? "..." : "Save"}
          </button>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "50%", width: 34, height: 34, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
      </div>
      <div onClick={e => e.stopPropagation()} style={{ width: "90vw", maxWidth: 420, background: "#fff", borderRadius: 20, overflow: "hidden", border: "2px solid rgba(239,68,68,0.4)", boxShadow: "0 20px 60px rgba(239,68,68,0.3)", marginTop: 56, marginBottom: 70 }}>
        {isVideo(media[idx]) ? (
          <video src={media[idx]} controls autoPlay style={{ width: "100%", maxHeight: "60vh", objectFit: "contain", background: "#000", display: "block" }} />
        ) : (
          <img src={media[idx]} alt={product.name} style={{ width: "100%", maxHeight: "60vh", objectFit: "contain", padding: 12, display: "block" }} />
        )}
      </div>
      {media.length > 1 && (
        <div onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setIdx((i: number) => (i - 1 + media.length) % media.length)} style={{ background: "rgba(239,68,68,0.85)", border: "none", color: "#fff", borderRadius: "50%", width: 40, height: 40, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <div style={{ display: "flex", gap: 6 }}>
            {media.map((_: any, i: number) => (
              <div key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 18 : 7, height: 7, borderRadius: 4, background: i === idx ? "#ef4444" : "rgba(255,255,255,0.4)", transition: "all 0.3s", cursor: "pointer" }} />
            ))}
          </div>
          <button onClick={() => setIdx((i: number) => (i + 1) % media.length)} style={{ background: "rgba(239,68,68,0.85)", border: "none", color: "#fff", borderRadius: "50%", width: 40, height: 40, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        </div>
      )}
    </div>
  );
}