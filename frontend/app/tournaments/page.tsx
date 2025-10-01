'use client';

import React, { useEffect, useState } from "react";
import Topbar from "@/Component/topbar";
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
  tournamentType: "KNOCKOUT" | "ROUND_ROBIN";
}

interface Sport {
  sportId: number;
  name: string;
  isTeamGame: boolean;
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
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tournaments and sports
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use full backend URL with port 8090
        const tRes = await fetch("http://localhost:8090/api/tournaments");
        const tData = await tRes.json();
        console.log("Tournament API response:", tData);
        const sRes = await fetch("http://localhost:8090/api/sports");
        const sData = await sRes.json();
        setTournaments(Array.isArray(tData) ? tData : tData.data || []);
        setSports(Array.isArray(sData) ? sData : sData.data || []);
      } catch (err) {
        setError("Failed to load tournaments or sports.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
    if (end && end < today) return "ended";
    if (start <= today && (!end || end >= today)) return "ongoing";
    return "";
  };

  return (
    <div className="tournaments-bg">
      <Topbar />
      <div className="tournaments-content">
        <h1 className="tournaments-title">Tournaments</h1>
        {loading ? (
          <div className="loading-message">Loading tournaments...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : tournaments.length === 0 ? (
          <div className="no-tournaments-message">No tournaments found.</div>
        ) : (
          <div className="tournaments-list">
            {tournaments.map((tournament) => {
              const sport = getSport(tournament.sportId);
              const status = getStatus(tournament);
              return (
                <div className="tournament-card" key={tournament.tournamentId}>
                  <div className="tournament-header">
                    <div className="tournament-name">{tournament.name}</div>
                    {status === "ended" && (
                      <span className="tournament-status ended">Ended</span>
                    )}
                    {status === "ongoing" && (
                      <span className="tournament-status ongoing">Ongoing</span>
                    )}
                  </div>
                  <div className="tournament-details">
                    <div className="tournament-row">
                      <span className="label">Duration:</span>
                      <span className="value">
                        {formatDate(tournament.startDate)}
                        {" - "}
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
                      <span className="tag type-tag">
                        {tournament.tournamentType === "KNOCKOUT"
                          ? "Knockout"
                          : "Round Robin"}
                      </span>
                    </div>
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