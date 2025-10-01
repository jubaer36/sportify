"use client";

import { useState, useEffect } from "react";
import Topbar from "@/Component/topbar";
import Image from "next/image";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./ongoing-events.css";

interface Announcement {
  announcementId: number;
  title: string;
  content: string;
  postedById: number;
  postedByName: string;
  postedAt: string;
  relatedSportId?: number;
  relatedSportName?: string;
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

export default function OngoingEvents() {
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

  // Filter for ongoing events: startDate < today && endDate is null
  const today = new Date();
  const ongoingAnnouncements = announcements.filter((a) => {
    if (!a.startDate) return false;
    const start = new Date(a.startDate);
    return start < today && (!a.endDate || a.endDate === null);
  });

  return (
    <div className="ongoing-events-bg">
      <Topbar />
      <div className="ongoing-events-content">
        <h1 className="ongoing-events-title">Ongoing Events</h1>
        <div className="ongoing-announcement-list">
          {loading ? (
            <div>Loading ongoing events...</div>
          ) : error ? (
            <div style={{ color: "#dc2626" }}>{error}</div>
          ) : ongoingAnnouncements.length === 0 ? (
            <div>No ongoing events found.</div>
          ) : (
            ongoingAnnouncements.map((a) => (
              <div key={a.announcementId} className="ongoing-announcement-card">
                <div className="ongoing-announcement-header">
                  <h3 className="ongoing-announcement-title">{a.title}</h3>
                  <span className="ongoing-announcement-date">
                    {new Date(a.postedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="ongoing-announcement-desc">{a.content}</p>
                <div className="ongoing-announcement-tags">
                  {a.relatedSportName && (
                    <span className="tag">
                      <Image
                        src={sportLogos[a.relatedSportName] || "/Photos/logo1.png"}
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