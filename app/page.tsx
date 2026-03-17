"use client";
import { useEffect, useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import StaffLogin from "@/components/StaffLogin";

export default function HomePage() {
  const [staff, setStaff] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [revokedMsg, setRevokedMsg] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    checkStaff();
  }, []);

  async function checkStaff() {
    const saved = localStorage.getItem("jg_staff");
    if (!saved) {
      setChecking(false);
      setShowLogin(true); // Direct to login — no guest access
      return;
    }

    const parsed = JSON.parse(saved);

    // If offline, trust cached staff
    if (!navigator.onLine) {
      setStaff(parsed);
      setChecking(false);
      return;
    }

    // Online: verify with DB
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase
        .from("staff_users")
        .select("*")
        .eq("id", parsed.id)
        .single();

      if (data && data.status === "active") {
        setStaff(data);
        localStorage.setItem("jg_staff", JSON.stringify(data));
      } else {
        localStorage.removeItem("jg_staff");
        setStaff(null);
        if (data?.status === "revoked") {
          setRevokedMsg(true);
        }
        setShowLogin(true);
      }
    } catch {
      // Network error — trust cached
      setStaff(parsed);
    }
    setChecking(false);
  }

  if (!isMounted || checking) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg,#fff9f9,#fff)",
        fontFamily: "system-ui,sans-serif",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏬</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#b91c1c", marginBottom: 6 }}>JG Wholesale</div>
        <div style={{ color: "#9ca3af", fontSize: 13 }}>Janaki Guru Enterprises</div>
        <div style={{ marginTop: 24, color: "#dc2626", fontSize: 13 }}>⏳ Loading...</div>
      </div>
    );
  }

  // If not logged in, show login screen (not guest access)
  if (!staff) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg,#fff9f9,#fff)",
        fontFamily: "system-ui,sans-serif", padding: 24,
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🏬</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#b91c1c", marginBottom: 4 }}>JG Wholesale</div>
        <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 32 }}>Janaki Guru Enterprises, Thoothukudi</div>

        {revokedMsg && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fca5a5",
            borderRadius: 12, padding: "12px 16px", marginBottom: 20,
            fontSize: 13, color: "#dc2626", textAlign: "center", maxWidth: 320,
          }}>
            ⚠️ Your access has been revoked. Please contact admin.
          </div>
        )}

        <button
          onClick={() => setShowLogin(true)}
          style={{
            background: "linear-gradient(135deg,#ef4444,#b91c1c)",
            color: "#fff", border: "none", borderRadius: 14,
            padding: "16px 48px", fontSize: 16, fontWeight: 800,
            cursor: "pointer", boxShadow: "0 4px 15px rgba(185,28,28,0.3)",
          }}
        >
          🔐 Staff Login
        </button>

        <div style={{ marginTop: 16, fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
          Access restricted to authorised staff only
        </div>

        {showLogin && (
          <StaffLogin
            onSuccess={(s) => {
              setStaff(s);
              setShowLogin(false);
              setRevokedMsg(false);
            }}
            onClose={() => setShowLogin(false)}
          />
        )}
      </div>
    );
  }

  return (
    <ProductGrid
      staff={staff}
      showLogin={showLogin}
      onShowLogin={() => setShowLogin(true)}
      onHideLogin={() => setShowLogin(false)}
      onStaffChange={(s: any) => { setStaff(s); setShowLogin(false); }}
      onLogout={() => {
        localStorage.removeItem("jg_staff");
        setStaff(null);
        setShowLogin(true);
      }}
    />
  );
}