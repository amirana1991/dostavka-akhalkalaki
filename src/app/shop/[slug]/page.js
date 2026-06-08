"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ShopPage() {
  const { slug } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [quote, setQuote] = useState(null);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from("shops").select("*").eq("slug", slug).single();
      setShop(s);
      if (s) {
        const { data: p } = await supabase.from("products").select("*").eq("shop_id", s.id).order("price");
        setProducts(p || []);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  function add(p) { setCart((c) => ({ ...c, [p.id]: { ...p, qty: (c[p.id]?.qty || 0) + 1 } })); }
  function remove(id) { setCart((c) => { const n = { ...c }; if (n[id].qty > 1) n[id] = { ...n[id], qty: n[id].qty - 1 }; else delete n[id]; return n; }); }

  const items = Object.values(cart);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  async function calcDelivery() {
    setMsg("Определяю адрес...");
    function done(lat, lng) {
      supabase.rpc("quote_delivery", { p_lat: lat, p_lng: lng, p_order_total: total })
        .then(({ data, error }) => {
          if (error) { setMsg("Ошибка: " + error.message); return; }
          setCoords({ lat, lng }); setQuote(data); setMsg("");
        });
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => done(pos.coords.latitude, pos.coords.longitude),
        () => { setMsg("GPS недоступен, беру центр города"); done(41.40556, 43.48611); }
      );
    } else { done(41.40556, 43.48611); }
  }

  async function checkout() {
    if (!quote || !quote.serviceable) { setMsg("Сначала рассчитайте доставку"); return; }
    setMsg("Оформляю...");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg("Сначала войдите (/login)"); return; }
    const { data: order, error } = await supabase.from("orders").insert({
      shop_id: shop.id, customer_id: user.id, total_amount: total,
      delivery_fee: quote.delivery_fee, delivery_lat: coords.lat, delivery_lng: coords.lng,
      delivery_distance_km: quote.distance_km
    }).select().single();
    if (error) { setMsg("Ошибка: " + error.message); return; }
    const rows = items.map((i) => ({ order_id: order.id, product_id: i.id, product_name: i.name, price_at_purchase: i.price, quantity: i.qty }));
    await supabase.from("order_items").insert(rows);
    setCart({}); setQuote(null);
    setMsg("Заказ оформлен! К оплате: " + quote.customer_pays + " ₾");
  }

  const wrap = { minHeight: "100vh", background: "#FBF6EE", fontFamily: "system-ui, sans-serif" };
  if (loading) return <div style={{ ...wrap, padding: 40, color: "#8A7F70" }}>Загрузка...</div>;
  if (!shop) return <div style={{ ...wrap, padding: 40, color: "#8A7F70" }}>Магазин не найден</div>;

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 500, margin: "0 auto", padding: "24px 18px 200px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "#fff", border: "1px solid #EBE2D4", display: "grid", placeItems: "center", fontSize: 32 }}>🍔</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1F1A15" }}>{shop.name}</h1>
            <div style={{ fontSize: 13, color: "#8A7F70", marginTop: 2 }}>{shop.description}</div>
          </div>
        </div>
        <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#8A7F70", margin: "22px 2px 8px", fontWeight: 700 }}>Меню · {products.length}</div>
        {products.map((p) => (
          <div key={p.id} style={{ background: "#fff", border: "1px solid #EBE2D4", borderRadius: 16, padding: 14, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: "#1F1A15" }}>{p.name}</div>
              <div style={{ fontSize: 13, color: "#8A7F70", marginTop: 2 }}>{p.description}</div>
              <div style={{ fontWeight: 700, marginTop: 6, color: "#1F1A15" }}>{p.price} ₾</div>
            </div>
            {cart[p.id] ? (
              <div style={{ display: "flex", alignItems: "center", background: "#1F1A15", borderRadius: 12, overflow: "hidden" }}>
                <button onClick={() => remove(p.id)} style={{ width: 36, height: 38, border: 0, background: "transparent", color: "#fff", fontSize: 18, cursor: "pointer" }}>−</button>
                <span style={{ color: "#fff", fontWeight: 700, minWidth: 20, textAlign: "center" }}>{cart[p.id].qty}</span>
                <button onClick={() => add(p)} style={{ width: 36, height: 38, border: 0, background: "transparent", color: "#fff", fontSize: 18, cursor: "pointer" }}>+</button>
              </div>
            ) : (
              <button onClick={() => add(p)} style={{ padding: "10px 16px", borderRadius: 12, border: 0, background: "#1F1A15", color: "#fff", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ в корзину</button>
            )}
          </div>
        ))}
        {msg && <p style={{ marginTop: 16, fontWeight: 600, color: "#2F6B4F" }}>{msg}</p>}
      </div>

      {items.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 500, margin: "0 auto", padding: 16, background: "#FBF6EE", borderTop: "1px solid #EBE2D4" }}>
          {!quote ? (
            <button onClick={calcDelivery} style={{ width: "100%", padding: 14, borderRadius: 14, border: "1px solid #1F1A15", background: "#fff", color: "#1F1A15", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Рассчитать доставку · товары {total} ₾
            </button>
          ) : !quote.serviceable ? (
            <div style={{ textAlign: "center", color: "#E2553B", fontWeight: 600, padding: 10 }}>{quote.message}</div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#8A7F70", marginBottom: 4 }}>
                <span>Доставка ({quote.zone === "city" ? "город" : "село"}, {quote.distance_km} км)</span>
                <span style={{ fontWeight: 700, color: "#1F1A15" }}>{quote.delivery_fee} ₾</span>
              </div>
              {quote.below_min && <div style={{ fontSize: 13, color: "#9A6E04", marginBottom: 6 }}>⚠️ Мин. заказ для села 30 ₾</div>}
              <button onClick={checkout} style={{ width: "100%", padding: 16, borderRadius: 16, border: 0, background: "#E2553B", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
                Оформить · {quote.customer_pays} ₾
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
