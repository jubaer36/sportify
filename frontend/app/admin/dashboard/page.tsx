"use client";

import { useState } from "react";
import Topbar from "@/Component/topbar";
import Image from "next/image";
import "./admin_dashboard.css";

export default function AdminDashboard() {
  const [searchText, setSearchText] = useState("");
  const [selectedSport, setSelectedSport] = useState("");

  const announcements = [
    {
      id: 1,
      title: "Football Tournament 2025",
      date: "2025-10-05",
      description: "The registration for the Football Tournament 2025 opens next week. Teams should prepare early!",
      tags: [{ name: "Football", logo: "/Photos/football.png" }],
    },
    {
      id: 2,
      title: "Basketball Semi-Finals",
      date: "2025-10-10",
      description: "Basketball tournament semi-finals are scheduled for October 10th. Get ready to cheer for your teams!",
      tags: [{ name: "Basketball", logo: "/Photos/basketball.png" }],
    },
  ];

  // Filtering logic
  const filteredAnnouncements = announcements.filter((a) => {
    const textMatch = a.title.toLowerCase().includes(searchText.toLowerCase());
    const tagMatch = selectedSport ? a.tags.some((t) => t.name === selectedSport) : true;
    return textMatch && tagMatch;
  });

  return (
    <div className="admin-dashboard-bg">
      <Topbar />

      <div className="dashboard-content">
        <h1 className="dashboard-title">Welcome, Admin!</h1>

        {/* Search bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="search-select"
          >
            <option value="">All Sports</option>
            <option value="Football">Football</option>
            <option value="Basketball">Basketball</option>
          </select>
        </div>


        {/* Announcement Cards */}
        <div className="announcement-list">
          {filteredAnnouncements.map((a) => (
            <div key={a.id} className="announcement-card">
              <div className="announcement-header">
                <h3 className="announcement-title">{a.title}</h3>
                <span className="announcement-date">{a.date}</span>
              </div>
              <p className="announcement-desc">{a.description}</p>
              <div className="announcement-tags">
                {a.tags.map((tag, idx) => (
                  <span key={idx} className="tag">
                    <Image src={tag.logo} alt={tag.name} width={18} height={18} className="tag-logo" />
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
