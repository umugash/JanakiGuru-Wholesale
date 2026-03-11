"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  onClose: () => void;
  onSuccess: (staff: any) => void;
}

export default function StaffLogin({ onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!name.trim() || !password.trim()) {
      setError("Please enter your name and password");
      return;
    }
    setLoading(true);
    setError("");

    // Find staff by name
    const { data } = await supabase
      .from("staff_users")
      .select("*")
      .eq("name", name.trim())
      .single();

    if (!data) {
      setError("❌ Name not found. Contact the owner.");
      setLoading(false);
      return;
    }

    if (data.status === "revoked") {
      setError("❌ Your access has been revoked. Contact the owner.");
      setLoading(false);
      return;
    }

    if (data.password !== password.trim()) {
      setError("❌ Wrong password. Try again.");
      setLoading(false);
      return;
    }

    // Success
    localStorage.setItem("jg_staff", JSON.stringify(data));
    onSuccess(data);
    setLoading(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9998, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 -8px 40px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>

        <div style={{ width: 40, height: 4, background: "#e2e8f0", borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>🔐 Staff Login</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Enter your name and password given by the owner.</div>

        {error && (
          <div style={{ background: "#fff5f5", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#dc2626", fontWeight: 600, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Your Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password" onKeyDown={e => e.key === "Enter" && handleLogin()} style={inputStyle} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleLogin} disabled={loading} style={{
            flex: 1, background: loading ? "#f87171" : "linear-gradient(135deg,#ef4444,#b91c1c)",
            color: "#fff", border: "none", borderRadius: 14, padding: 14,
            fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
          }}>{loading ? "Checking..." : "Login"}</button>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 14, padding: "14px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#475569" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" };
const inputStyle: React.CSSProperties = { width: "100%", border: "2px solid #e2e8f0", borderRadius: 12, padding: "11px 14px", fontSize: 14, color: "#1e293b", background: "#f8fafc", outline: "none", fontFamily: "system-ui,sans-serif" };