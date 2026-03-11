"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProductGrid from "@/components/ProductGrid";

export default function HomePage() {
  const [staff, setStaff] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    checkStaff();
  }, []);

  async function checkStaff() {
    const saved = localStorage.getItem("jg_staff");
    if (!saved) return;
    const parsed = JSON.parse(saved);

    // Verify still active in DB
    const { data } = await supabase
      .from("staff_users")
      .select("*")
      .eq("id", parsed.id)
      .single();

    if (data && data.status === "active") {
      setStaff(data);
    } else {
      // Revoked or deleted — clear and show login
      localStorage.removeItem("jg_staff");
      setStaff(null);
      if (data && data.status === "revoked") {
        setShowLogin(true); // Auto-open login so they see they need to login again
      }
    }
  }

  if (!isMounted) return null;

  return (
    <ProductGrid
      staff={staff}
      showLogin={showLogin}
      onShowLogin={() => setShowLogin(true)}
      onHideLogin={() => setShowLogin(false)}
      onStaffChange={(s: any) => { setStaff(s); setShowLogin(false); }}
      onLogout={() => { localStorage.removeItem("jg_staff"); setStaff(null); }}
    />
  );
}