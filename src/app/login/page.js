"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleLogin() {
    setMsg("Вхожу...");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMsg("Ошибка: " + error.message); return; }
    const { data: profile } = await supabase
      .from("users").select("role").eq("id", data.user.id).single();
    setMsg("Вход выполнен! Ваша роль: " + (profile?.role || "неизвестно"));
  }

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", fontFamily: "sans-serif", padding: 20 }}>
      <h1>Вход</h1>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", width: "100%", padding: 10, marginTop: 10 }} />
      <input placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", width: "100%", padding: 10, marginTop: 10 }} />
      <button onClick={handleLogin}
        style={{ width: "100%", padding: 12, marginTop: 15, background: "#1F1A15", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer" }}>
        Войти
      </button>
      <p>{msg}</p>
    </div>
  );
}
