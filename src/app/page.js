"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [shops, setShops] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("shops").select("*").eq("status", "active")
      .then(({ data }) => setShops(data || []));
  }, []);

  const filtered = shops.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ minHeight: "100vh", background: "#FBF6EE", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 500, margin: "0 auto", padding: "24px 18px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#E2553B" }} />
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#1F1A15", letterSpacing: -0.5 }}>Местный</h1>
        </div>
        <p style={{ color: "#8A7F70", marginTop: 4, fontSize: 14 }}>Магазины и кухни Ахалкалаки</p>

        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #EBE2D4", borderRadius: 16, padding: "12px 14px", boxShadow: "0 12px 30px -12px rgba(50,35,20,.15)" }}>
          <span style={{ color: "#8A7F70" }}>🔍</span>
          <input placeholder="Найти магазин..." value={q} onChange={(e) => setQ(e.target.value)}
            style={{ border: 0, outline: "none", flex: 1, fontSize: 15, background: "transparent", color: "#1F1A15" }} />
        </div>

        <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#8A7F70", margin: "24px 2px 14px", fontWeight: 700 }}>
          Магазины рядом · {filtered.length}
        </div>

        {filtered.length === 0 && <p style={{ color: "#8A7F70" }}>Ничего не найдено</p>}
        {filtered.map((s) => (
          <Link key={s.id} href={"/shop/" + s.slug} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ background: "#fff", border: "1px solid #EBE2D4", borderRadius: 20, padding: 16, marginBottom: 14, boxShadow: "0 12px 30px -12px rgba(50,35,20,.15)", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "#FBF6EE", border: "1px solid #EBE2D4", display: "grid", placeItems: "center", fontSize: 26 }}>🍔</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#1F1A15" }}>{s.name}</div>
                <div style={{ fontSize: 13, color: "#8A7F70", marginTop: 2 }}>{s.description}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
