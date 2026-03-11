"use client";

function isVideo(url: string) {
  return !!(url?.match(/\.(mp4|webm|ogg|mov)$/i));
}

interface Props {
  product: any;
  staff: any;
  onImageClick: (index: number) => void;
}

export default function ProductCard({ product, staff, onImageClick }: Props) {
  const media = [...(product.image_url || []), ...(product.video_url ? [product.video_url] : [])];
  const firstMedia = media[0] || "";

  return (
    <div style={{
      background: "#fff", borderRadius: 14, overflow: "hidden",
      boxShadow: "0 2px 10px rgba(220,38,38,0.07)", border: "1.5px solid #fee2e2",
      display: "flex", flexDirection: "column",
    }}>
      {/* Square image */}
      <div onClick={() => onImageClick(0)} style={{ width: "100%", paddingBottom: "100%", position: "relative", background: "#fff5f5", cursor: "zoom-in" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {media.length === 0 ? (
            <span style={{ fontSize: 32 }}>📦</span>
          ) : isVideo(firstMedia) ? (
            <video src={firstMedia} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <img src={firstMedia} alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
        </div>
        {media.length > 1 && (
          <div style={{ position: "absolute", bottom: 5, right: 5, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 6, padding: "2px 5px" }}>
            +{media.length - 1}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "8px 8px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Name */}
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", lineHeight: 1.3, marginBottom: 2,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {product.name}
        </div>

        {/* MRP — always visible */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>MRP</span>
          <span style={{ fontSize: 11, color: "#94a3b8", textDecoration: "line-through" }}>₹{product.mrp}</span>
        </div>

        {/* Wholesale price — always visible */}
        {product.wholesale_price && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff1f1", borderRadius: 8, padding: "4px 7px", border: "1px solid #fca5a5" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626" }}>W/S</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#dc2626" }}>₹{product.wholesale_price}</span>
          </div>
        )}

        {/* Staff only prices */}
        {staff && (
          <>
            {/* Retail/selling price */}
            {product.price && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#eff6ff", borderRadius: 8, padding: "4px 7px", border: "1px solid #bfdbfe" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#2563eb" }}>RETAIL</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#2563eb" }}>₹{product.price}</span>
              </div>
            )}

            {/* Purchase price */}
            {product.purchase_price && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", borderRadius: 8, padding: "4px 7px", border: "1px solid #86efac" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a" }}>PURCHASE</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#16a34a" }}>₹{product.purchase_price}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}