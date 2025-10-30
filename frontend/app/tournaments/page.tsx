'use client';

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/Component/topbar";
import { makeAuthenticatedRequest, API_BASE_URL } from "@/utils/api";
import "./tournaments.css";

// --- DTOs matching backend ---
interface Tournament {
  tournamentId: number;
  name: string;
  startDate: string;
  endDate?: string;
  championId?: number;
  championName?: string;
  runnerUpId?: number;
  runnerUpName?: string;
  sportId: number;
  sportName?: string;
  createdById?: number;
  createdByName?: string;
}

interface Sport {
  sportId: number;
  name: string;
  isTeamGame: boolean;
}

interface UserProfile {
  userId: number;
  name: string;
  email: string;
  role: string;
}

// --- Sport logos mapping ---
const sportLogos: { [key: string]: string } = {
  Football: "/Photos/football_logo.png",
  Basketball: "/Photos/basketball_logo.png",
  Tennis: "/Photos/tennis_logo.png",
  Volleyball: "/Photos/volleyball_logo.png",
  "Table Tennis": "/Photos/tabletennis_logo.png",
  Carrom: "/Photos/carrom_logo.png",
  Scrabble: "/Photos/scrabble_logo.png",
  Chess: "/Photos/chess_logo.png",
  Cricket: "/Photos/cricket_logo.png",
  Badminton: "/Photos/badminton_logo.png",
};

function getSportLogo(sportName: string): string {
  if (sportLogos[sportName]) return sportLogos[sportName];
  const lower = sportName.toLowerCase();
  for (const key of Object.keys(sportLogos)) {
    if (key.toLowerCase() === lower) return sportLogos[key];
  }
  return "/Photos/logo1.png";
}

export default function TournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filters ---
  const [selectedSport, setSelectedSport] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [showMyTournaments, setShowMyTournaments] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");

  // Fetch user profile first
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await makeAuthenticatedRequest<UserProfile>("/api/users/profile");
        if (response.error) {
          setError(response.error);
          return;
        }
        setUserProfile(response.data!);
      } catch (err) {
        setError("Failed to fetch user profile");
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch tournaments and sports with authorization
  useEffect(() => {
    if (!userProfile) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Authenticated request for tournaments
        const tRes = await makeAuthenticatedRequest<Tournament[]>("/api/tournaments");
        // Authenticated request for sports
        const sRes = await makeAuthenticatedRequest<Sport[]>("/api/sports");

        if (tRes.status === 401 || sRes.status === 401) {
          setError("Authentication failed. Please login again.");
          setTournaments([]);
          setSports([]);
        } else if (tRes.error || sRes.error) {
          setError(tRes.error || sRes.error || "Failed to load tournaments or sports.");
          setTournaments([]);
          setSports([]);
        } else {
          setTournaments(Array.isArray(tRes.data) ? tRes.data : []);
          setSports(Array.isArray(sRes.data) ? sRes.data : []);
        }
      } catch (err) {
        setError("Failed to load tournaments or sports.");
        setTournaments([]);
        setSports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  // Helper: get sport info by id
  const getSport = (id: number) => sports.find((s) => s.sportId === id);

  // Helper: format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  // Helper: tournament status
  const getStatus = (t: Tournament) => {
    const today = new Date();
    const start = new Date(t.startDate);
    const end = t.endDate ? new Date(t.endDate) : undefined;
    if (end && end < today) return "Ended";
    if (start <= today && (!end || end >= today)) return "Ongoing";
    return "Upcoming";
  };

  const sendCertificates = async (tournamentId: number) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        alert('You are not logged in. Please login and try again.');
        return;
      }
      const resp = await fetch(`${API_BASE_URL}/api/certificates/generate/${tournamentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!resp.ok) {
        const text = await resp.text();
        alert(`Failed to send certificates: ${text || resp.status}`);
        return;
      }
      alert('Certificates are being generated for this tournament.');
    } catch (e: any) {
      alert('Failed to send certificates');
    }
  };

  // --- Apply Filters ---
  const filteredTournaments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tournaments.filter((t) => {
      const sport = getSport(t.sportId);
      const status = getStatus(t);

      if (showMyTournaments && userProfile && userProfile.role === "CAPTAIN") {
        if (t.createdById !== userProfile.userId) return false;
      }

      const matchesSport = selectedSport === "All" || sport?.name === selectedSport;
      const matchesStatus = selectedStatus === "All" || status === selectedStatus;
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (sport?.name?.toLowerCase().includes(q) ?? false) ||
        (t.championName?.toLowerCase().includes(q) ?? false);

      return matchesSport && matchesStatus && matchesQuery;
    });
  }, [tournaments, selectedSport, selectedStatus, showMyTournaments, userProfile, query, sports]);

  // Add this function to handle the create team navigation
  const handleCreateTeam = (tournamentId: number) => {
    router.push(`/player/create-teams/${tournamentId}`);
  };

  const retryLoad = () => {
    // force re-run by clearing profile then setting back
    const current = userProfile;
    setUserProfile(null);
    setTimeout(() => setUserProfile(current), 0);
  };

  return (
    <div className="tournaments-bg">
      <Topbar />

      <section className="tournaments-hero">
        <div className="hero-content">
          <h1 className="tournaments-title">Tournaments</h1>
          <p className="tournaments-subtitle">Browse all sports tournaments, filter by status or sport, and jump into fixtures.</p>
          <div className="search-and-filters">
            <div className="search-input">
              <span className="search-icon">🔎</span>
              <input
                type="text"
                placeholder="Search by name, sport, or champion..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search tournaments"
              />
            </div>
            <div className="filters-inline">
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                aria-label="Filter by sport"
              >
                <option value="All">All Sports</option>
                {sports.map((sport) => (
                  <option key={sport.sportId} value={sport.name}>
                    {sport.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="All">All Status</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Ended">Ended</option>
                <option value="Upcoming">Upcoming</option>
              </select>
              {userProfile?.role === "CAPTAIN" && (
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={showMyTournaments}
                    onChange={(e) => setShowMyTournaments(e.target.checked)}
                  />
                  My tournaments
                </label>
              )}
              {(selectedSport !== "All" || selectedStatus !== "All" || showMyTournaments || query) && (
                <button className="btn-clear" onClick={() => { setSelectedSport("All"); setSelectedStatus("All"); setShowMyTournaments(false); setQuery(""); }}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="tournaments-content">
        {/* --- Display Section --- */}
        {loading ? (
          <div className="tournaments-grid" aria-live="polite" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="tournament-card skeleton" key={i}>
                <div className="skeleton-header" />
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
                <div className="skeleton-footer" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-message">{error}</div>
            <button className="btn-retry" onClick={retryLoad}>Try again</button>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="empty-state">
            <div className="no-tournaments-message">No tournaments match your filters.</div>
            <button className="btn-retry" onClick={() => { setSelectedSport("All"); setSelectedStatus("All"); setShowMyTournaments(false); setQuery(""); }}>Reset filters</button>
          </div>
        ) : (
          <div className="tournaments-grid">
            {filteredTournaments.map((tournament) => {
              const sport = getSport(tournament.sportId);
              const status = getStatus(tournament);
              return (
                <div className="tournament-card" key={tournament.tournamentId}>
                  <div className="tournament-card-header">
                    <div className="card-left">
                      <img
                        src={sport ? getSportLogo(sport.name) : "/Photos/logo1.png"}
                        alt={sport ? sport.name : "Sport"}
                        className="sport-logo-lg"
                      />
                      <div className="title-and-meta">
                        <h3 className="tournament-name">{tournament.name}</h3>
                        <div className="tournament-meta">{sport ? sport.name : "Unknown Sport"}</div>
                      </div>
                    </div>
                    <div className="card-right">
                      <span className={`tournament-status ${status.toLowerCase()}`}>{status}</span>
                      <button
                        className="icon-btn view-fixture-btn"
                        onClick={() => {
                          if (userProfile?.role === "CAPTAIN" && tournament.createdById === userProfile.userId) {
                            router.push(`/captain/fixture?tournamentId=${tournament.tournamentId}`);
                          } else {
                            router.push(`/fixture/${tournament.tournamentId}`);
                          }
                        }}
                        title="View Fixture"
                        aria-label="View fixture"
                      >
                        📅
                      </button>
                      {userProfile?.role === "ADMIN" && status === "Ended" && (
                        <button
                          className="icon-btn edit-tournament-btn"
                          onClick={() => sendCertificates(tournament.tournamentId)}
                          title="Send Certificates"
                          aria-label="Send certificates"
                        >
                          🏅
                        </button>
                      )}
                      {userProfile?.role === "CAPTAIN" && tournament.createdById === userProfile.userId && (
                        <button
                          className="icon-btn edit-tournament-btn"
                          onClick={() => router.push(`/tournaments/edit/${tournament.tournamentId}`)}
                          title="Edit Tournament"
                          aria-label="Edit tournament"
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="tournament-details">
                    <div className="tournament-row">
                      <span className="label">Duration</span>
                      <span className="value">
                        {formatDate(tournament.startDate)} – {tournament.endDate ? formatDate(tournament.endDate) : "Present"}
                      </span>
                    </div>
                    <div className="tournament-row">
                      <span className="label">Champion</span>
                      <span className="value">{tournament.championName || "Not decided yet"}</span>
                    </div>
                    <div className="tournament-row">
                      <span className="label">Runner-up</span>
                      <span className="value">{tournament.runnerUpName || "Not decided yet"}</span>
                    </div>
                  </div>

                  <div className="tournament-actions">
                    {sport?.isTeamGame && (
                      <button
                        onClick={() => handleCreateTeam(tournament.tournamentId)}
                        className="btn btn-create-team"
                        title="Create Team for this Tournament"
                      >
                        <span className="btn-icon">⚡</span>
                        Create Team
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
