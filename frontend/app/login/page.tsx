"use client";

import "./login.css";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
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

      if(data.token) {
        localStorage.setItem("token", data.token);
      }
      if(data.refreshToken){
        localStorage.setItem("refreshToken", data.refreshToken);
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
    <div className="login-page">
    <div className="auth-bg">
      <form className="auth-form" onSubmit={handleLogin}>
        {/* Logo at very top */}
        <Image
          src="/Photos/logo3.png"
          alt="Logo"
          width={500}
          height={220}
          className="logo"
        />

        {/* Only title, no switch-tabs */}
        <h2 className="form-title">Login</h2>

        {/* Input section */}
        <div className="form-fields">
          <input
            type="text"
            name="username"
            placeholder="Username"
            required
            value={form.username}
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
        </div>

        {error && <div className="error">{error}</div>}

        {/* Buttons */}
        <div className="form-actions">
          <button type="submit" className="btn active" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

        {/* Bottom link */}
        <div className="bottom-text">
          New to Sportify?{" "}
          <Link href="/register" className="link">
            Register
          </Link>{" "}
          now
        </div>
      </form>
    </div>
    </div>
  );
}
