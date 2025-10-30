'use client';

import React, { useEffect, useState } from "react";
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
  const filteredTournaments = tournaments.filter((t) => {
    const sport = getSport(t.sportId);
    const status = getStatus(t);

    // Apply "My Tournaments" filter for captains
    if (showMyTournaments && userProfile && userProfile.role === "CAPTAIN") {
      if (t.createdById !== userProfile.userId) {
        return false;
      }
    }

    return (
      (selectedSport === "All" || sport?.name === selectedSport) &&
      (selectedStatus === "All" || status === selectedStatus)
    );
  });

  // Add this function to handle the create team navigation
  const handleCreateTeam = (tournamentId: number) => {
    router.push(`/player/create-teams/${tournamentId}`);
  };

  return (
    <div className="tournaments-bg">
      <Topbar />

      <div className="tournaments-content">
        <h1 className="tournaments-title">Tournaments</h1>

        {/* --- Filter Section --- */}
        <div className="filter-bar">
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
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
          >
            <option value="All">All Status</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Ended">Ended</option>
            <option value="Upcoming">Upcoming</option>
          </select>

          {/* Captain-specific filter */}
          {userProfile?.role === "CAPTAIN" && (
            <div className="captain-filter">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showMyTournaments}
                  onChange={(e) => setShowMyTournaments(e.target.checked)}
                />
                <span className="checkmark"></span>
                My Tournaments Only
              </label>
            </div>
          )}
        </div>

        {/* --- Display Section --- */}
        {loading ? (
          <div className="loading-message">Loading tournaments...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredTournaments.length === 0 ? (
          <div className="no-tournaments-message">No tournaments found.</div>
        ) : (
          <div className="tournaments-list">
            {filteredTournaments.map((tournament) => {
              const sport = getSport(tournament.sportId);
              const status = getStatus(tournament);
              return (
                <div className="tournament-card" key={tournament.tournamentId}>
                  <div className="tournament-header">
                    <div className="tournament-name">{tournament.name}</div>
                    <div className="tournament-header-right">
                      {status === "Ended" && (
                        <span className="tournament-status ended">Ended</span>
                      )}
                      {status === "Ongoing" && (
                        <span className="tournament-status ongoing">Ongoing</span>
                      )}
                      {status === "Upcoming" && (
                        <span className="tournament-status upcoming">Upcoming</span>
                      )}
                      
                      {/* View Fixture button */}
                      <button
                        className="view-fixture-btn"
                        onClick={() => {
                          if (userProfile?.role === "CAPTAIN" && tournament.createdById === userProfile.userId) {
                            router.push(`/captain/fixture?tournamentId=${tournament.tournamentId}`);
                          } else {
                            router.push(`/fixture/${tournament.tournamentId}`);
                          }
                        }}
                        title="View Fixture"
                      >
                        📅
                      </button>
                      
                      {/* Admin: Send Certificates for ended tournaments */}
                      {userProfile?.role === "ADMIN" && status === "Ended" && (
                        <button
                          className="edit-tournament-btn"
                          onClick={() => sendCertificates(tournament.tournamentId)}
                          title="Send Certificates"
                        >
                          🏅
                        </button>
                      )}

                      {/* Edit button for tournaments created by current captain */}
                      {userProfile?.role === "CAPTAIN" && 
                       tournament.createdById === userProfile.userId && (
                        <button
                          className="edit-tournament-btn"
                          onClick={() => router.push(`/tournaments/edit/${tournament.tournamentId}`)}
                          title="Edit Tournament"
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="tournament-details">
                    <div className="tournament-row">
                      <span className="label">Duration:</span>
                      <span className="value">
                        {formatDate(tournament.startDate)} -{" "}
                        {tournament.endDate ? formatDate(tournament.endDate) : "Present"}
                      </span>
                    </div>
                    <div className="tournament-row">
                      <span className="label">Champion:</span>
                      <span className="value">
                        {tournament.championName || "Not Decided Yet"}
                      </span>
                    </div>
                    <div className="tournament-row">
                      <span className="label">Runners Up:</span>
                      <span className="value">
                        {tournament.runnerUpName || "Not Decided Yet"}
                      </span>
                    </div>
                    <div className="tournament-tags">
                      <span className="tag sport-tag">
                        <img
                          src={sport ? getSportLogo(sport.name) : "/Photos/logo1.png"}
                          alt={sport ? sport.name : "Sport"}
                          className="sport-logo"
                        />
                        {sport ? sport.name : "Unknown Sport"}
                      </span>

                    </div>
                  </div>

                  <div className="tournament-actions">
                    {/* Create Team button, visible only for team games */}
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
