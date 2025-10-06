"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/Component/topbar";
import Image from "next/image";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./upcoming-events.css";

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

export default function UpcomingEvents() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  // Filter for upcoming events: startDate > today
  const today = new Date();
  const upcomingAnnouncements = announcements.filter((a) => {
    if (!a.startDate) return false;
    const start = new Date(a.startDate);
    return start > today;
  });

  return (
    <div className="upcoming-events-bg">
      <Topbar />
      <div className="upcoming-events-content">
        <h1 className="upcoming-events-title">Upcoming Events</h1>
        <div className="upcoming-announcement-list">
          {loading ? (
            <div>Loading upcoming events...</div>
          ) : error ? (
            <div style={{ color: "#dc2626" }}>{error}</div>
          ) : upcomingAnnouncements.length === 0 ? (
            <div>No upcoming events found.</div>
          ) : (
            upcomingAnnouncements.map((a) => (
              <div key={a.announcementId} className="upcoming-announcement-card">
                <div className="upcoming-announcement-header">
                  <h3 className="upcoming-announcement-title">{a.title}</h3>
                  <span className="upcoming-announcement-date">
                    {new Date(a.postedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="upcoming-announcement-desc">{a.content}</p>
                <div className="upcoming-announcement-tags">
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
                  {a.relatedTournamentId && (
                    <button
                      className="view-tournament-btn"
                      onClick={() => router.push(`/player/tournamentInfo/${a.relatedTournamentId}`)}
                    >
                      View Tournament
                    </button>
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