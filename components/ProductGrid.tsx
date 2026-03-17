"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import ProductCard from "./ProductCard";
import StaffLogin from "./StaffLogin";

function isVideo(url: string) {
  return !!(url?.match(/\.(mp4|webm|ogg|mov)$/i) || url?.includes("video"));
}

function parseCategories(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {}
    return val.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
}

const DB_NAME = "jg_wholesale_cache";
const DB_VERSION = 1;
const STORE_NAME = "products";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = e => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });
}

async function saveProductsToDB(products: any[]) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.clear();
  products.forEach(p => store.put(p));
}

async function getProductsFromDB(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}


function pricePill(bg: string): React.CSSProperties {
  return {
    display: "inline-block",
    background: bg,
    color: "#fff",
    borderRadius: 20,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap" as const,
  };
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
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Fullscreen state
  const [fsProduct, setFsProduct] = useState<any>(null);
  const [fsIndex, setFsIndex] = useState(0);
  const [fsClosing, setFsClosing] = useState(false);
  const [downloading, setDownloading] = useState(false);


  const supabaseRef = useRef<any>(null);

  useEffect(() => {
    // Dynamic import supabase to avoid SSR issues
    import("@/lib/supabase").then(({ supabase }) => {
      supabaseRef.current = supabase;
      loadProducts(supabase);
    });

    const handleOnline = () => { setIsOffline(false); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (!navigator.onLine) setIsOffline(true);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function loadProducts(supabase: any) {
    setLoading(true);
    try {
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from("products")
          .select("id,name,mrp,price,wholesale_price,purchase_price,category,image_url,video_url,keywords,created_at,short_description,long_description,vendors")
          .order("created_at", { ascending: false });

        if (!error && data) {
          setProducts(data);
          await saveProductsToDB(data);
        } else {
          throw new Error("fetch failed");
        }
      } else {
        throw new Error("offline");
      }
    } catch {
      // Load from IndexedDB cache
      try {
        const cached = await getProductsFromDB();
        if (cached.length > 0) {
          setProducts(cached);
          setIsOffline(true);
        }
      } catch {
        setProducts([]);
      }
    }
    setLoading(false);
  }

  // All categories
  const allCategories = ["All", ...Array.from(new Set(
    products.flatMap(p => parseCategories(p.category))
  )).sort()];

  // Filtered products
  const filtered = products.filter(p => {
    const cats = parseCategories(p.category);
    const matchCat = activeCategory === "All" || cats.includes(activeCategory);
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.name?.toLowerCase().includes(q) ||
      (p.keywords || []).some((k: string) => k?.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  // Fullscreen open
  const openFullscreen = (product: any, index: number) => {
    setFsProduct(product);
    setFsIndex(index);
    setFsClosing(false);
    document.body.style.overflow = "hidden";
    // Push history state for back button
    window.history.pushState({ fullscreen: true }, "");
  };

  // Fullscreen close
  const closeFullscreen = useCallback(() => {
    setFsClosing(true);
    setTimeout(() => {
      setFsProduct(null);
      setFsClosing(false);
        document.body.style.overflow = "";
    }, 280);
  }, []);

  // Handle Android back button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (fsProduct) {
        closeFullscreen();
      }
      // If login modal open, close it
      if (showLogin) {
        onHideLogin();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [fsProduct, showLogin, closeFullscreen, onHideLogin]);

  // Download
  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    if (!fsProduct) return;
    const media = [...(fsProduct.image_url || []), ...(fsProduct.video_url ? [fsProduct.video_url] : [])];
    const url = media[fsIndex];
    if (!url) return;
    if (!navigator.onLine) {
      alert("Internet required to download. Please turn on internet and try again.");
      return;
    }
    setDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const ext = isVideo(url) ? "mp4" : "jpg";
      const filename = fsProduct.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() + "_" + (fsIndex + 1) + "." + ext;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
    setDownloading(false);
  }

  // Fullscreen navigation
  const getFsMedia = () => {
    if (!fsProduct) return [];
    return [...(fsProduct.image_url || []), ...(fsProduct.video_url ? [fsProduct.video_url] : [])];
  };

  const fsPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const media = getFsMedia();
    setFsIndex(i => (i - 1 + media.length) % media.length);
  };
  const fsNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const media = getFsMedia();
    setFsIndex(i => (i + 1) % media.length);
  };

  const fsMedia = getFsMedia();
  const fsSrc = fsMedia[fsIndex] || "";

  return (
    <div style={{ minHeight: "100dvh", background: "#fff9f9", fontFamily: "system-ui,sans-serif" }}>

      {/* Offline banner */}
      {isOffline && (
        <div style={{
          background: "#fef3c7", borderBottom: "1px solid #f59e0b",
          padding: "6px 16px", textAlign: "center", fontSize: 12, color: "#92400e",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          📴 Offline — showing cached data. Turn on internet to sync latest prices.
        </div>
      )}

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "linear-gradient(135deg,#ef4444,#b91c1c)",
        padding: "12px 16px 10px", boxShadow: "0 2px 12px rgba(185,28,28,0.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: 0.5 }}>
              🏬 JG Wholesale
            </div>
            {staff && (
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
                👤 {staff.name}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {staff ? (
              <button onClick={onLogout} style={{
                background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)",
                color: "#fff", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>Logout</button>
            ) : (
              <button onClick={onShowLogin} style={{
                background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)",
                color: "#fff", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>🔐 Staff Login</button>
            )}
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
          <input
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "9px 12px 9px 32px",
              borderRadius: 12, border: "none",
              fontSize: 13, outline: "none",
              background: "rgba(255,255,255,0.95)",
            }}
          />
        </div>
      </div>

      {/* Category chips */}
      {allCategories.length > 1 && (
        <div style={{
          display: "flex", gap: 8, overflowX: "auto", padding: "10px 16px",
          scrollbarWidth: "none", background: "#fff",
          borderBottom: "1px solid #fee2e2",
        }}>
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0, padding: "5px 14px", borderRadius: 20,
                border: activeCategory === cat ? "none" : "1.5px solid #fca5a5",
                background: activeCategory === cat ? "linear-gradient(135deg,#ef4444,#b91c1c)" : "#fff",
                color: activeCategory === cat ? "#fff" : "#dc2626",
                fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >{cat}</button>
          ))}
        </div>
      )}

      {/* Product grid */}
      <div style={{ padding: "12px 10px", paddingBottom: 80 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div>Loading products...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div>No products found</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {filtered.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                staff={staff}
                onImageClick={(idx) => openFullscreen(p, idx)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Staff count */}
      {!loading && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#fff", borderTop: "1px solid #fee2e2",
          padding: "8px 16px", textAlign: "center",
          fontSize: 11, color: "#9ca3af",
        }}>
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
          {isOffline ? " (cached)" : ""}
        </div>
      )}

      {/* ── FULLSCREEN VIEWER ── */}
      {fsProduct && (
        <div
          className={fsClosing ? "fs-bg-out" : "fs-bg"}
          style={{
            position: "fixed", inset: 0,
            background: "linear-gradient(160deg,#1a0000,#2d0000,#1a0000)",
            zIndex: 9999, display: "flex", flexDirection: "column",
            overflowY: "auto",
          }}
          onClick={closeFullscreen}
        >
          <style>{`
            @keyframes fsBgIn { from{opacity:0} to{opacity:1} }
            @keyframes fsBgOut { from{opacity:1} to{opacity:0} }
            .fs-bg { animation: fsBgIn 0.25s ease both; }
            .fs-bg-out { animation: fsBgOut 0.25s ease both; }
          `}</style>

          {/* Top bar */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "sticky", top: 0, zIndex: 10,
              background: "linear-gradient(135deg,#ef4444,#b91c1c)",
              padding: "12px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}
          >
            {/* Left: back + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
              <button onClick={closeFullscreen} style={{
                background: "rgba(255,255,255,0.2)", border: "none",
                color: "#fff", borderRadius: 8, width: 32, height: 32,
                fontSize: 18, cursor: "pointer", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>←</button>
              <div style={{
                color: "#fff", fontSize: 13, fontWeight: 700,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{fsProduct.name}</div>
            </div>

            {/* Right: counter + download */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 8 }}>
              {fsMedia.length > 1 && (
                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600 }}>
                  {fsIndex + 1}/{fsMedia.length}
                </span>
              )}
              <button onClick={handleDownload} disabled={downloading} style={{
                background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)",
                color: "#fff", borderRadius: 10, padding: "6px 12px",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                {downloading ? "⏳" : "⬇️"} {downloading ? "..." : "Save"}
              </button>
              <button onClick={closeFullscreen} style={{
                background: "rgba(255,255,255,0.15)", border: "none",
                color: "#fff", borderRadius: 8, width: 32, height: 32,
                fontSize: 18, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>
          </div>

          {/* Media */}
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", background: "#000" }}>
            {isVideo(fsSrc) ? (
              <video src={fsSrc} controls autoPlay
                style={{ width: "100%", maxHeight: "55vh", objectFit: "contain", display: "block" }}
              />
            ) : (
              <img src={fsSrc} alt={fsProduct.name}
                style={{ width: "100%", maxHeight: "55vh", objectFit: "contain", display: "block", padding: 8, boxSizing: "border-box" }}
              />
            )}
          </div>

          {/* Nav arrows + dots */}
          {fsMedia.length > 1 && (
            <div onClick={e => e.stopPropagation()} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "10px 0",
            }}>
              <button onClick={fsPrev} style={{
                background: "rgba(239,68,68,0.85)", border: "none", color: "#fff",
                borderRadius: "50%", width: 38, height: 38, fontSize: 20, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>‹</button>
              <div style={{ display: "flex", gap: 6 }}>
                {fsMedia.map((_, i) => (
                  <div key={i} onClick={() => setFsIndex(i)} style={{
                    width: i === fsIndex ? 18 : 7, height: 7, borderRadius: 4,
                    background: i === fsIndex ? "#ef4444" : "rgba(255,255,255,0.4)",
                    transition: "all 0.3s ease", cursor: "pointer",
                  }} />
                ))}
              </div>
              <button onClick={fsNext} style={{
                background: "rgba(239,68,68,0.85)", border: "none", color: "#fff",
                borderRadius: "50%", width: 38, height: 38, fontSize: 20, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>›</button>
            </div>
          )}

          {/* Description section - always visible */}
          {(fsProduct.short_description || fsProduct.long_description) && (
            <div onClick={e => e.stopPropagation()} style={{
              margin: "0 12px 12px", background: "rgba(255,255,255,0.08)",
              borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)",
              padding: "12px 14px",
            }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, letterSpacing: 0.8, marginBottom: 8 }}>📋 DESCRIPTION</div>
              {fsProduct.short_description && (
                <div style={{
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  marginBottom: fsProduct.long_description ? 8 : 0, lineHeight: 1.5,
                }}>{fsProduct.short_description}</div>
              )}
              {fsProduct.long_description && (
                <div style={{
                  color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}>{fsProduct.long_description}</div>
              )}
            </div>
          )}

          <div style={{ height: 24 }} />
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <StaffLogin
          onSuccess={onStaffChange}
          onClose={onHideLogin}
        />
      )}
    </div>
  );
}