"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const RU = { searching_courier: "Ищет курьера", courier_assigned: "Еду в магазин", in_delivery: "В пути", delivered: "Доставлен" };

export default function Courier() {
  const [status, setStatus] = useState("offline");
  const [orders, setOrders] = useState([]);
  const [active, setActive] = useState(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg("Войдите в аккаунт (/login)"); return; }
    const { data: me } = await supabase.from("couriers").select("*").eq("id", user.id).single();
    if (!me) { setMsg("Вы не курьер"); return; }
    setStatus(me.status);
    const { data: act } = await supabase.from("orders").select("*, order_items(*)")
      .eq("courier_id", user.id).in("status", ["courier_assigned", "in_delivery"]);
    setActive(act && act[0] ? act[0] : null);
    const { data: pool } = await supabase.from("orders").select("*, order_items(*)")
      .eq("status", "searching_courier").is("courier_id", null);
    setOrders(pool || []);
  }

  useEffect(() => { load(); }, []);

  async function setOnline(s) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("couriers").update({ status: s }).eq("id", user.id);
    setStatus(s); load();
  }
  async function take(id) { const { error } = await supabase.rpc("accept_order", { p_order_id: id }); if (error) setMsg("Заказ уже занят"); load(); }
  async function picked(id) { await supabase.rpc("mark_picked_up", { p_order_id: id }); load(); }
  async function delivered(id) { await supabase.rpc("mark_delivered", { p_order_id: id }); load(); }

  const wrap = { minHeight: "100vh", background: "#FBF6EE", fontFamily: "system-ui, sans-serif" };
  return (
    <div style={wrap}>
      <div style={{ maxWidth: 500, margin: "0 auto", padding: "24px 18px 60px" }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1F1A15" }}>Курьер</h1>
        {msg && <p style={{ color: "#E2553B", fontWeight: 600 }}>{msg}</p>}

        <div style={{ display: "flex", gap: 8, background: "#fff", border: "1px solid #EBE2D4", borderRadius: 14, padding: 4, marginTop: 14 }}>
          {["offline", "available"].map((s) => (
            <button key={s} onClick={() => setOnline(s)}
              style={{ flex: 1, padding: 11, borderRadius: 11, border: 0, fontWeight: 700, cursor: "pointer", background: status === s ? "#1F1A15" : "transparent", color: status === s ? "#fff" : "#8A7F70" }}>
              {s === "offline" ? "Оффлайн" : "Свободен"}
            </button>
          ))}
        </div>

        {active ? (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#8A7F70", fontWeight: 700, marginBottom: 10 }}>Текущий заказ</div>
            <div style={{ background: "#fff", border: "1px solid #EBE2D4", borderRadius: 18, padding: 16 }}>
              <b>Заказ #{active.id.slice(0, 8)}</b>
              <div style={{ color: "#8A7F70", fontSize: 14, margin: "6px 0" }}>{RU[active.status]}</div>
              <div style={{ fontSize: 14 }}>{active.order_items?.map((it) => <div key={it.id}>{it.quantity} × {it.product_name}</div>)}</div>
              <div style={{ marginTop: 6 }}>Доставка: <b>{active.delivery_fee} ₾</b> · {active.delivery_distance_km} км</div>
              {active.status === "courier_assigned" && <button onClick={() => picked(active.id)} style={{ width: "100%", marginTop: 12, padding: 14, borderRadius: 12, border: 0, background: "#E2553B", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Я забрал заказ</button>}
              {active.status === "in_delivery" && <button onClick={() => delivered(active.id)} style={{ width: "100%", marginTop: 12, padding: 14, borderRadius: 12, border: 0, background: "#1F1A15", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Доставлено</button>}
            </div>
          </div>
        ) : status === "available" ? (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#8A7F70", fontWeight: 700, marginBottom: 10 }}>Заказы рядом · {orders.length}</div>
            {orders.length === 0 && <p style={{ color: "#8A7F70" }}>Пока заказов нет</p>}
            {orders.map((o) => (
              <div key={o.id} style={{ background: "#fff", border: "1px solid #EBE2D4", borderRadius: 18, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <b>Заказ #{o.id.slice(0, 8)}</b>
                  <span style={{ color: "#2F6B4F", fontWeight: 800 }}>+{o.delivery_fee} ₾</span>
                </div>
                <div style={{ fontSize: 13, color: "#8A7F70", margin: "6px 0" }}>{o.delivery_distance_km} км</div>
                <button onClick={() => take(o.id)} style={{ width: "100%", marginTop: 8, padding: 14, borderRadius: 12, border: 0, background: "#2F6B4F", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Взять заказ</button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ marginTop: 24, color: "#8A7F70" }}>Включите «Свободен», чтобы видеть заказы.</p>
        )}
      </div>
    </div>
  );
}
