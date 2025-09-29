"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import Sidebar from "./Sidebar";
import "../Style/topbar.css";

export default function Topbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <nav className={`topbar${sidebarOpen ? " sidebar-open" : ""}`}>
        <button
          className="sidebar-toggle"
          aria-label="Open sidebar"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="hamburger"></span>
        </button>
        <div className="nav-left">
          <Link href="/admin/dashboard" className="nav-btn">Ongoing events</Link>
          <Link href="/admin/dashboard?tab=upcoming" className="nav-btn">Upcoming events</Link>
          <Link href="/admin/dashboard?tab=history" className="nav-btn">History</Link>
          <Link href="/admin/dashboard?tab=tournaments" className="nav-btn">Tournaments</Link>
        </div>
        <div className="nav-right">
          <Link href="/admin/profile">
            <Image
              src="/Photos/logo3.png"
              alt="Profile"
              width={38}
              height={38}
              className="profile-logo"
            />
          </Link>
        </div>
      </nav>
    </>
  );
}