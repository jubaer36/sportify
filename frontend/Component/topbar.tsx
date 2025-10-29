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
        {/* Sidebar toggle with image instead of CSS hamburger */}
        <button
          className="sidebar-toggle shaded-toggle"
          aria-label="Open sidebar"
          onClick={() => setSidebarOpen(true)}
        >
          <Image
            src="/Photos/menu.png"
            alt="Menu"
            width={34}
            height={34}
            className="menu-icon"
          />
        </button>

        <div className="nav-left">
          <Link href="/admin/dashboard" className="nav-btn">Home</Link>
          <Link href="/ongoing-events" className="nav-btn">Ongoing events</Link>
          <Link href="/upcoming-events" className="nav-btn">Upcoming events</Link>
          <Link href="/admin/hall-of-fame" className="nav-btn">Hall Of Fame</Link>
          <Link href="/tournaments" className="nav-btn">Tournaments</Link>
        </div>

        <div className="nav-right">
          {/* Notification Button */}
        <Link href="/notifications" className="notification-btn" title="Notifications">
          <img
            src="/Photos/notification_logo.png"
            alt="Notifications"
            className="notification-logo"
          />
        </Link>
          {/* Profile button */}
          <Link href="/profile">
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
