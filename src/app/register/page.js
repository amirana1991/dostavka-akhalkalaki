"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("customer");
  const [msg, setMsg] = useState("");

  async function handleRegister() {
    setMsg("Регистрирую...");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) setMsg("Ошибка: " + error.message);
    else setMsg("Готово! Проверьте почту для подтверждения.");
  }

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", fontFamily: "sans-serif", padding: 20 }}>
      <h1>Регистрация</h1>
      <input placeholder="Имя" value={fullName} onChange={(e) => setFullName(e.target.value)}
        style={{ display: "block", width: "100%", padding: 10, marginTop: 10 }} />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", width: "100%", padding: 10, marginTop: 10 }} />
      <input placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", width: "100%", padding: 10, marginTop: 10 }} />
      <select value={role} onChange={(e) => setRole(e.target.value)}
        style={{ display: "block", width: "100%", padding: 10, marginTop: 10 }}>
        <option value="customer">Покупатель</option>
        <option value="owner">Продавец</option>
        <option value="courier">Курьер</option>
      </select>
      <button onClick={handleRegister}
        style={{ width: "100%", padding: 12, marginTop: 15, background: "#E2553B", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer" }}>
        Зарегистрироваться
      </button>
      <p>{msg}</p>
    </div>
  );
}
