'use client';

import React, { useEffect, useState } from 'react';
import Topbar from "@/Component/topbar";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./manage-captains.css";

// --- Interfaces matching backend DTOs ---
interface Sport {
  sportId: number;
  name: string;
  isTeamGame: boolean;
  rules?: string;
  captainId?: number;
  captainName?: string;
  recentChampionId?: number;
  recentChampionName?: string;
  recentRunnerUpId?: number;
  recentRunnerUpName?: string;
}

interface User {
  userId: number;
  name: string;
  username: string;
  email: string;
  role: string;
}

// --- Constants for API endpoints ---
const SPORTS_API = "/api/sports";
const USERS_API = "/api/users";

// --- Sport logos mapping ---
const sportLogos: { [key: string]: string } = {
  Football: '/Photos/football_logo.png',
  Basketball: '/Photos/basketball_logo.png',
  Tennis: '/Photos/tennis_logo.png',
  Volleyball: '/Photos/volleyball_logo.png',
  'Table Tennis': '/Photos/tabletennis_logo.png',
  Carrom: '/Photos/carrom_logo.png',
  Scrabble: '/Photos/scrabble_logo.png',
  Chess: '/Photos/chess_logo.png',
  Cricket: '/Photos/cricket_logo.png',
  Badminton: '/Photos/badminton_logo.png',
};

function getDefaultLogo(sportName: string): string {
  const normalized = sportName.trim();
  if (sportLogos[normalized]) return sportLogos[normalized];
  const lower = normalized.toLowerCase();
  for (const [key, value] of Object.entries(sportLogos)) {
    if (key.toLowerCase() === lower) return value;
  }
  return '/Photos/logo1.png';
}

export default function ManageCaptains() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loadingSports, setLoadingSports] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorSports, setErrorSports] = useState<string | null>(null);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- Fetch sports list ---
  const fetchSports = async () => {
    setLoadingSports(true);
    setErrorSports(null);
    try {
      const result = await makeAuthenticatedRequest<Sport[]>(SPORTS_API);
      if (result.data && Array.isArray(result.data)) {
        setSports(result.data);
      } else {
        setSports([]);
      }
    } catch {
      setErrorSports("Failed to load sports. Please check backend.");
      setSports([]);
    } finally {
      setLoadingSports(false);
    }
  };

  useEffect(() => {
    fetchSports();
  }, []);

  // --- Fetch users list ---
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      setErrorUsers(null);
      try {
        const result = await makeAuthenticatedRequest<User[]>(USERS_API);
        if (result.data && Array.isArray(result.data)) {
          setUsers(result.data);
        } else {
          setUsers([]);
        }
      } catch {
        setErrorUsers("Failed to load users. Please check backend.");
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // --- Assign captain API call ---
  const handleAssignCaptain = async () => {
    if (!selectedSport || !selectedUserId) return;
    setAssigning(true);
    setSuccessMsg(null);

    try {
      // Construct SportDTO for backend
      const updatedSportDTO = {
        sportId: selectedSport.sportId,
        name: selectedSport.name,
        isTeamGame: selectedSport.isTeamGame,
        rules: selectedSport.rules ?? "",
        captainId: selectedUserId,
        recentChampionId: selectedSport.recentChampionId ?? null,
        recentChampionName: selectedSport.recentChampionName ?? null,
        recentRunnerUpId: selectedSport.recentRunnerUpId ?? null,
        recentRunnerUpName: selectedSport.recentRunnerUpName ?? null,
      };

      const response = await makeAuthenticatedRequest<Sport>(
        `${SPORTS_API}/${selectedSport.sportId}`,
        {
          method: "PUT",
          body: JSON.stringify(updatedSportDTO),
        }
      );

      if (response.error) {
        throw new Error(response.error);
      }

      setSuccessMsg("Captain assigned successfully!");
      await fetchSports();

      // update selected sport
      const updated = response.data;
      if (updated) {
        setSelectedSport(updated);
      }
    } catch (err) {
      console.error(err);
      setSuccessMsg(null);
      alert("Error assigning captain. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="manage-captains-page">
      <Topbar />
      <div className="main-container">
        {/* Sports Section */}
        <div className="sports-section">
          <h2>Sports</h2>
          {loadingSports ? (
            <div className="loading-message">Loading sports...</div>
          ) : errorSports ? (
            <div className="error-message">{errorSports}</div>
          ) : (
            <div className="sports-grid">
              {sports.map((sport) => (
                <div
                  key={sport.sportId}
                  className={`sport-card ${selectedSport?.sportId === sport.sportId ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedSport(sport);
                    setSuccessMsg(null);
                    setSelectedUserId(null);
                  }}
                >
                  <img
                    src={getDefaultLogo(sport.name)}
                    alt={`${sport.name}_logo`}
                    className="sport-logo"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/Photos/logo1.png';
                    }}
                  />
                  <h3>{sport.name}</h3>
                  <p>
                    <span style={{ fontWeight: 500 }}>Captain:</span>{' '}
                    {sport.captainName ?? 'Not Assigned'}
                  </p>
                  <p>
                    <span style={{ fontWeight: 500 }}>Recent Champion:</span>{' '}
                    {sport.recentChampionName ?? 'Pending'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assign Captain Section */}
        <div className="assign-section">
          <h2>Assign Captain</h2>
          {selectedSport ? (
            <>
              <p>
                Selected Sport: <strong>{selectedSport.name}</strong>
              </p>

              {loadingUsers ? (
                <div className="loading-message">Loading users...</div>
              ) : errorUsers ? (
                <div className="error-message">{errorUsers}</div>
              ) : (
                <>
                  <select
                    className="user-dropdown"
                    onChange={(e) => setSelectedUserId(Number(e.target.value))}
                    value={selectedUserId ?? ''}
                  >
                    <option value="">-- Select User --</option>
                    {users.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.name} ({user.username}) - {user.email}
                      </option>
                    ))}
                  </select>
                  <button
                    className="assign-btn"
                    onClick={handleAssignCaptain}
                    disabled={!selectedUserId || assigning}
                  >
                    {assigning ? "Assigning..." : "Assign Captain"}
                  </button>
                  {successMsg && <div className="success-message">{successMsg}</div>}
                </>
              )}
            </>
          ) : (
            <p className="no-sport-msg">Select a sport to assign captain</p>
          )}
        </div>
      </div>
    </div>
  );
}
