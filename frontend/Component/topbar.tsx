"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import CaptainSidebar from "./captain_sidebar";
import PlayerSidebar from "./player_sidebar";

import "../Style/topbar.css";

export default function Topbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8090/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        console.log("Fetched profile:", data);
      } else {
        console.error("Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      await fetch("http://localhost:8090/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      window.location.href = "/"; // redirect to home/login
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <>
      {profile?.role === "ADMIN" && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      {profile?.role === "CAPTAIN" && <CaptainSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      {profile?.role === "PLAYER" && <PlayerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

      <nav className={`topbar${sidebarOpen ? " sidebar-open" : ""}`}>
        {/* Sidebar toggle with background shade */}
        <button
          className="sidebar-toggle shaded-toggle"
          aria-label="Open sidebar"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="hamburger"></span>
        </button>

        <div className="nav-left">
          <Link href="/admin/dashboard" className="nav-btn">Home</Link>
          <Link href="/admin/dashboard" className="nav-btn">Ongoing events</Link>
          <Link href="/admin/dashboard?tab=upcoming" className="nav-btn">Upcoming events</Link>
          <Link href="/admin/dashboard?tab=history" className="nav-btn">History</Link>
          <Link href="/admin/dashboard?tab=tournaments" className="nav-btn">Tournaments</Link>
        </div>

        <div className="nav-right">
          {/* Profile button */}
          <Link href="/admin/profile">
            <Image
              src="/Photos/profile.png"
              alt="Profile"
              width={38}
              height={38}
              className="profile-logo"
            />
          </Link>

          {/* Logout button */}
          <button onClick={handleLogout} className="logout-btn">
            <Image
              src="/Photos/logout.png"
              alt="Logout"
              width={34}
              height={34}
              className="logout-logo"
            />
          </button>
        </div>
      </nav>
    </>
  );
}
