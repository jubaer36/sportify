"use client";

import "./register.css"
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "PLAYER",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("http://localhost:8090/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }
      setSuccess("Registration successful! Please login.");
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <form className="auth-form" onSubmit={handleRegister}>
        <Image src="/Photos/logo3.png" alt="Logo" width={250} height={150} className="logo" />
        <div className="switch-tabs">
          <Link href="/login" className="inactive">Login</Link>
          <span className="active">Register</span>
        </div>
        <h2 className="form-title">Register</h2>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          required
          value={form.name}
          onChange={handleChange}
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          required
          value={form.username}
          onChange={handleChange}
        />
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
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="role-select"
        >
          <option value="PLAYER">Player</option>
          <option value="CAPTAIN">Captain</option>
          <option value="ADMIN">Admin</option>
        </select>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        <div className="form-actions">
          <button type="button" className="btn inactive" disabled>
            Login
          </button>
          <button type="submit" className="btn active" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </div>
        <div className="bottom-text">
          Already have an account?{" "}
          <Link href="/login" className="link">Login</Link>
        </div>
      </form>
    </div>
  );
}