"use client";

import { useState, useEffect } from "react";
import Topbar from "@/Component/topbar";
import Image from "next/image";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./admin_dashboard.css";

interface Announcement {
  announcementId: number;
  title: string;
  content: string;
  postedById: number;
  postedByName: string;
  postedAt: string;
  relatedSportId?: number;
  relatedSportName?: string;
  relatedTournamentId?: number;
  relatedTournamentName?: string;
  startDate?: string;
  endDate?: string;
}

const sportLogos: { [key: string]: string } = {
  Football: "/Photos/football.png",
  Basketball: "/Photos/basketball.png",
  Tennis: "/Photos/tennis_logo.png",
  Volleyball: "/Photos/volleyball_logo.png",
  "Table Tennis": "/Photos/tabletennis_logo.png",
  Carrom: "/Photos/carrom_logo.png",
  Scrabble: "/Photos/scrabble_logo.png",
  Chess: "/Photos/chess_logo.png",
  Cricket: "/Photos/cricket_logo.png",
  Badminton: "/Photos/badminton_logo.png",
};

export default function AdminDashboard() {
  const [searchText, setSearchText] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      setError(null);
      const res = await makeAuthenticatedRequest<Announcement[]>("/api/announcements");
      if (res.error) {
        setError(res.error);
        setAnnouncements([]);
      } else {
        // Sort by postedAt descending
        const sorted = [...(res.data ?? [])].sort(
          (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
        );
        setAnnouncements(sorted);
      }
      setLoading(false);
    };
    fetchAnnouncements();
  }, []);

  // Filtering logic
  const filteredAnnouncements = announcements.filter((a) => {
    const textMatch =
      a.title.toLowerCase().includes(searchText.toLowerCase()) ||
      a.content.toLowerCase().includes(searchText.toLowerCase());
    const tagMatch = selectedSport
      ? a.relatedSportName === selectedSport
      : true;
    return textMatch && tagMatch;
  });

  // Get unique sports for filter dropdown
  const uniqueSports = Array.from(
    new Set(announcements.map((a) => a.relatedSportName).filter(Boolean))
  );

  return (
    <div className="admin-dashboard-bg">
      <Topbar />

      <div className="dashboard-content">
        <h1 className="dashboard-title">WELCOME !</h1>

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
            {uniqueSports.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </div>

        {/* Announcement Cards */}
        <div className="announcement-list">
          {loading ? (
            <div>Loading announcements...</div>
          ) : error ? (
            <div style={{ color: "#dc2626" }}>{error}</div>
          ) : filteredAnnouncements.length === 0 ? (
            <div>No announcements found.</div>
          ) : (
            filteredAnnouncements.map((a) => (
              <div key={a.announcementId} className="announcement-card">
                <div className="announcement-header">
                  <h3 className="announcement-title">{a.title}</h3>
                  <span className="announcement-date">
                    {new Date(a.postedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="announcement-desc">{a.content}</p>
                <div className="announcement-tags">
                  {a.relatedSportName && (
                    <span className="tag">
                      <Image
                        src={
                          sportLogos[a.relatedSportName] ||
                          "/Photos/logo1.png"
                        }
                        alt={a.relatedSportName}
                        width={18}
                        height={18}
                        className="tag-logo"
                      />
                      {a.relatedSportName}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
