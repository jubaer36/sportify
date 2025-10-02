'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/Component/topbar";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./my-tournaments.css";

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

export default function MyTournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filters ---
  const [selectedSport, setSelectedSport] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // Fetch user profile first
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await makeAuthenticatedRequest<UserProfile>("/api/users/profile");
        if (response.error) {
          setError(response.error);
          return;
        }
        
        const profile = response.data!;
        setUserProfile(profile);
        
        // Check if user is a captain
        if (profile.role !== "CAPTAIN") {
          setError("Access denied. This page is only for captains.");
          return;
        }
      } catch (err) {
        setError("Failed to fetch user profile");
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch tournaments created by this captain and sports assigned to this captain
  useEffect(() => {
    if (!userProfile) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch tournaments created by this captain
        const tRes = await makeAuthenticatedRequest<Tournament[]>(`/api/tournaments/user/${userProfile.userId}`);
        // Fetch only sports assigned to this captain for filter dropdown
        const sRes = await makeAuthenticatedRequest<Sport[]>(`/api/sports/captain/${userProfile.userId}`);

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

  // --- Apply Filters ---
  const filteredTournaments = tournaments.filter((t) => {
    const sport = getSport(t.sportId);
    const status = getStatus(t);

    return (
      (selectedSport === "All" || sport?.name === selectedSport) &&
      (selectedStatus === "All" || status === selectedStatus)
    );
  });

  const handleEditTournament = (tournamentId: number) => {
    router.push(`/tournaments/edit/${tournamentId}`);
  };

  const handleCreateNew = () => {
    router.push("/captain/create-tournaments");
  };

  return (
    <div className="my-tournaments-bg">
      <Topbar />

      <div className="my-tournaments-content">
        <div className="page-header">
          <h1 className="my-tournaments-title">My Tournaments</h1>
          <p className="my-tournaments-subtitle">Tournaments created by you</p>
          <button onClick={handleCreateNew} className="create-new-btn">
            + Create New Tournament
          </button>
        </div>

        {/* --- Filter Section --- */}
        {sports.length > 0 && (
          <div className="filter-bar">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
            >
              <option value="All">All My Sports</option>
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
          </div>
        )}
        
        {/* Show message if captain has no assigned sports */}
        {!loading && !error && sports.length === 0 && tournaments.length === 0 && (
          <div className="no-sports-message">
            <p>You are not currently assigned as captain for any sports.</p>
            <p>Contact an administrator to be assigned to sports before creating tournaments.</p>
          </div>
        )}

        {/* --- Display Section --- */}
        {loading ? (
          <div className="loading-message">Loading tournaments...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredTournaments.length === 0 ? (
          <div className="no-tournaments-section">
            <div className="no-tournaments-message">
              {tournaments.length === 0 
                ? "You haven't created any tournaments yet." 
                : "No tournaments match your filters."
              }
            </div>
            {tournaments.length === 0 && (
              <button onClick={handleCreateNew} className="create-first-btn">
                Create Your First Tournament
              </button>
            )}
          </div>
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
                        onClick={() => router.push(`/captain/fixture?tournamentId=${tournament.tournamentId}`)}
                        title="View Fixture"
                      >
                        📅
                      </button>
                      
                      <button
                        className="edit-tournament-btn"
                        onClick={() => handleEditTournament(tournament.tournamentId)}
                        title="Edit Tournament"
                      >
                        ✏️
                      </button>
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
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Statistics */}
        {!loading && !error && tournaments.length > 0 && (
          <div className="tournament-summary">
            <div className="summary-card">
              <div className="summary-number">{tournaments.length}</div>
              <div className="summary-label">Total Tournaments</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">
                {tournaments.filter(t => getStatus(t) === "Ongoing").length}
              </div>
              <div className="summary-label">Ongoing</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">
                {tournaments.filter(t => getStatus(t) === "Upcoming").length}
              </div>
              <div className="summary-label">Upcoming</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">
                {tournaments.filter(t => getStatus(t) === "Ended").length}
              </div>
              <div className="summary-label">Completed</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}