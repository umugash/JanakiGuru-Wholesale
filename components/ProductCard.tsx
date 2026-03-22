"use client";
import { useState } from "react";
import { encodePrice, encodeWholesalePrices, parseWholesalePrices } from "@/lib/cipher";

function isVideo(url: string) {
  return !!(url?.match(/\.(mp4|webm|ogg|mov)$/i) || url?.includes("video"));
}

interface Vendor { name: string; price: number; }

interface Props {
  product: any;
  staff: any;
  cipherKey: string;
  onImageClick: (index: number) => void;
}

function pricePill(bg: string): React.CSSProperties {
  return {
    display: "inline-block", background: bg, color: "#fff",
    borderRadius: 20, padding: "3px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" as const,
  };
}

// Parse slash prices from price_text or price field: "45/420" → [45,420]
function parseStorePrices(product: any): number[] {
  const raw = product.price_text || product.price;
  if (!raw && raw !== 0) return [];
  return String(raw).trim().split("/").map((s: string) => Number(s.trim())).filter((n: number) => !isNaN(n) && n > 0);
}

export default function ProductCard({ product, staff, cipherKey, onImageClick }: Props) {
  const media = [...(product.image_url || []), ...(product.video_url ? [product.video_url] : [])];
  const [current, setCurrent] = useState(0);
  const vendors: Vendor[] = Array.isArray(product.vendors) ? product.vendors : [];

  const isNew = product.created_at &&
    (Date.now() - new Date(product.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;

  const prevMedia = (e: React.MouseEvent) => { e.stopPropagation(); setCurrent(i => (i - 1 + media.length) % media.length); };
  const nextMedia = (e: React.MouseEvent) => { e.stopPropagation(); setCurrent(i => (i + 1) % media.length); };

  const src = media[current] || "";

  const encodedWS = encodeWholesalePrices(product.wholesale_price, cipherKey);
  const encodedPurchase = product.purchase_price ? encodePrice(product.purchase_price, cipherKey) : null;

  const wsPrices = parseWholesalePrices(product.wholesale_price);
  const hasMultipleWS = wsPrices.length > 1;
  const wsLabels = ["Single", "Bundle", "Pack", "Bulk", "Special"];

  // Retail price display — supports slash format "45/420"
  const storePrices = parseStorePrices(product);
  const retailPriceDisplay = storePrices.length > 0 ? storePrices.join("/") : String(product.price || "");

  return (
    <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 10px rgba(220,38,38,0.07)", border: "1.5px solid #fee2e2", display: "flex", flexDirection: "column", position: "relative" }}>
      {isNew && (
        <div style={{ position: "absolute", top: 6, left: 6, zIndex: 20, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontSize: 8, fontWeight: 800, padding: "2px 7px", borderRadius: 20 }}>NEW</div>
      )}

      {/* Image area */}
      <div onClick={() => onImageClick(current)} style={{ width: "100%", paddingBottom: "100%", position: "relative", background: "#fff5f5", cursor: "zoom-in" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {media.length === 0 ? <span style={{ fontSize: 32 }}>📦</span>
            : isVideo(src) ? <video src={src} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            : <img src={src} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
        </div>

        {media.length > 1 && (
          <>
            <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4, zIndex: 10 }}>
              {media.map((_, i) => <div key={i} onClick={e => { e.stopPropagation(); setCurrent(i); }} style={{ width: i === current ? 14 : 5, height: 5, borderRadius: 3, background: i === current ? "#ef4444" : "rgba(255,255,255,0.85)", transition: "width 0.3s ease", cursor: "pointer" }} />)}
            </div>
            <button onClick={prevMedia} style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.9)", border: "1.5px solid #fca5a5", borderRadius: "50%", width: 26, height: 26, fontSize: 15, color: "#dc2626", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>‹</button>
            <button onClick={nextMedia} style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.9)", border: "1.5px solid #fca5a5", borderRadius: "50%", width: 26, height: 26, fontSize: 15, color: "#dc2626", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>›</button>
          </>
        )}

        {isVideo(src) && <div style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(220,38,38,0.85)", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 10, padding: "2px 6px", zIndex: 10 }}>▶ VIDEO</div>}
      </div>

      {/* Card Body */}
      <div style={{ padding: "8px 10px 10px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{product.name}</div>

        {staff ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>

            {/* MRP + Retail (slash format supported: 45/420) */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <span style={pricePill("#6b7280")}>MRP ₹{product.mrp}</span>
              <span style={pricePill("#2563eb")}>Retail ₹{retailPriceDisplay}</span>
            </div>

            {/* W/S — encoded */}
            {hasMultipleWS ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {wsPrices.map((p, i) => (
                  <span key={i} style={{ ...pricePill("#dc2626"), fontSize: i === 0 ? 12 : 11, padding: i === 0 ? "4px 10px" : "3px 8px" }}>
                    {wsLabels[i] || `Option${i + 1}`}: {encodePrice(p, cipherKey)}
                  </span>
                ))}
              </div>
            ) : encodedWS ? (
              <span style={{ ...pricePill("#dc2626"), fontSize: 13, fontWeight: 800, padding: "4px 10px" }}>W/S {encodedWS}</span>
            ) : null}

            {/* Purchase — encoded, only if permitted */}
            {encodedPurchase && staff?.show_purchase_price !== false && (
              <span style={pricePill("#16a34a")}>Purchase {encodedPurchase}</span>
            )}

            {/* Vendors — encoded, only if permitted */}
            {vendors.length > 0 && staff?.show_purchase_price !== false && (
              <div style={{ marginTop: 2, borderTop: "1px dashed #e5e7eb", paddingTop: 4 }}>
                <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, marginBottom: 3, letterSpacing: 0.5 }}>VENDORS</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {vendors.map((v, i) => (
                    <span key={i} style={pricePill("#7c3aed")}>{v.name.split(" ")[0]} {encodePrice(v.price, cipherKey)}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Guest view
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={pricePill("#6b7280")}>MRP ₹{product.mrp}</span>
            <span style={pricePill("#2563eb")}>Retail ₹{retailPriceDisplay}</span>
            {hasMultipleWS ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {wsPrices.map((p, i) => <span key={i} style={{ ...pricePill("#dc2626"), fontSize: i === 0 ? 12 : 11 }}>{wsLabels[i]}: ₹{p}</span>)}
              </div>
            ) : product.wholesale_price ? (
              <span style={{ ...pricePill("#dc2626"), fontSize: 13, fontWeight: 800, padding: "4px 10px" }}>W/S ₹{product.wholesale_price}</span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}