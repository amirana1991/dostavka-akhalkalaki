"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const FLOW = { pending: "accepted", accepted: "preparing", preparing: "ready" };
const LABEL = { pending: "Принять заказ", accepted: "Начать готовить", preparing: "Заказ готов" };
const RU = { pending: "Новый", accepted: "Принят", preparing: "Готовится", ready: "Готов", done: "Завершён", cancelled: "Отменён" };

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState("Загрузка...");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg("Сначала войдите (/login)"); return; }
    const { data: shop } = await supabase.from("shops").select("id, name").eq("owner_id", user.id).single();
    if (!shop) { setMsg("У вас нет магазина"); return; }
    const { data: ords } = await supabase.from("orders")
      .select("*, order_items(*)").eq("shop_id", shop.id).order("created_at", { ascending: false });
    setOrders(ords || []);
    setMsg(ords && ords.length ? "Магазин: " + shop.name : "Заказов пока нет");
  }

  useEffect(() => { load(); }, []);

  async function nextStatus(order) {
    const next = FLOW[order.status];
    if (!next) return;
    await supabase.from("orders").update({ status: next }).eq("id", order.id);
    load();
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", fontFamily: "sans-serif", padding: 20 }}>
      <h1>Кабинет магазина</h1>
      <p style={{ color: "#888" }}>{msg}</p>
      {orders.map((o) => (
        <div key={o.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>Заказ #{o.id.slice(0, 8)}</b>
            <span style={{ background: "#f0f0f0", padding: "2px 10px", borderRadius: 999, fontSize: 13 }}>{RU[o.status] || o.status}</span>
          </div>
          <div style={{ margin: "8px 0", fontSize: 14 }}>
            {o.order_items?.map((it) => (
              <div key={it.id}>{it.quantity} × {it.product_name} — {it.price_at_purchase} ₾</div>
            ))}
          </div>
          <b>Итого: {o.total_amount} ₾</b>
          {FLOW[o.status] && (
            <button onClick={() => nextStatus(o)}
              style={{ display: "block", width: "100%", marginTop: 12, padding: 12, borderRadius: 8, border: 0, background: "#2F6B4F", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
              {LABEL[o.status]}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
