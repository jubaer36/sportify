"use client";

import "./login.css"
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8090/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      // Redirect based on role
      const role = data.user.role?.toLowerCase();
      if (role === "admin") router.push("/admin/dashboard");
      else if (role === "captain") router.push("/captain/dashboard");
      else router.push("/player/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <form className="auth-form" onSubmit={handleLogin}>
        <Image src="/Photos/logo3.png" alt="Logo" width={250} height={150} className="logo" />
        <div className="switch-tabs">
          <span className="active">Login</span>
          <Link href="/register" className="inactive">Register</Link>
        </div>
        <h2 className="form-title">Login</h2>
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          value={form.password}
          onChange={handleChange}
        />
        {error && <div className="error">{error}</div>}
        <div className="form-actions">
          <button type="submit" className="btn active" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          <button type="button" className="btn inactive" disabled>
            Register
          </button>
        </div>
        <div className="bottom-text">
          New to Sportify?{" "}
          <Link href="/register" className="link">Register now</Link>
        </div>
      </form>
    </div>
  );
}