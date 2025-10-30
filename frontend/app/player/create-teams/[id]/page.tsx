'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Topbar from "@/Component/topbar";
import './create-teams.css';
import { makeAuthenticatedRequest } from '../../../../utils/api';

interface User {
  userId: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: string;
  profilePhoto: string | null;
}

interface Tournament {
  id: number;
  name: string;
  sportId: number;
  startDate: string;
  endDate: string;
  status: string;
}

interface TeamRequest {
  teamName: string;
  sportId: number;
  createdById: number;
  logo: string;
  tournamentId: number;
}

interface TeamLogo {
  id: string;
  name: string;
  path: string;
}

interface TeamMemberRequest {
  teamId: number;
  userId: number;
  roleInTeam: string;
}

interface SelectedPlayer {
  userId: number;
  name: string;
  email: string;
  role: string;
  roleInTeam: string;
}

const CreateTeamPage = () => {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [teamName, setTeamName] = useState('');
  const [selectedLogo, setSelectedLogo] = useState('/Photos/team-logos/logo1.png');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Player search and selection states
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Available team logos
  const availableLogos: TeamLogo[] = [
    { id: 'logo1', name: 'Classic Shield', path: '/Photos/team-logos/logo1.png' },
    { id: 'logo2', name: 'Modern Emblem', path: '/Photos/team-logos/logo2.png' },
    { id: 'logo3', name: 'Athletic Badge', path: '/Photos/team-logos/logo3.png' },
    { id: 'logo4', name: 'Champion Crest', path: '/Photos/team-logos/logo4.png' },
    { id: 'logo5', name: 'Victory Wing', path: '/Photos/team-logos/logo5.png' },
    { id: 'logo6', name: 'Power Symbol', path: '/Photos/team-logos/logo6.png' },
    { id: 'logo7', name: 'Elite Mark', path: '/Photos/team-logos/logo7.png' },
    { id: 'logo8', name: 'Thunder Bolt', path: '/Photos/team-logos/logo8.png' },
  ];

  // Handle logo error fallback
  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    // Hide the broken image and show default logo instead
    target.style.display = 'none';
    const parent = target.parentElement;
    if (parent) {
      parent.innerHTML = `<div class="default-logo" style="width: 60px; height: 60px; border-radius: 8px; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">?</div>`;
    }
  };

  // Helper function to validate logo paths
  const isValidLogoPath = (logoPath: string): boolean => {
    return Boolean(logoPath && logoPath.trim() && (logoPath.startsWith('/') || logoPath.startsWith('http')));
  };

  // Fetch user profile and tournament info on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setInitialLoading(true);

        // Fetch user profile
        const userResponse = await makeAuthenticatedRequest<User>('/api/users/profile');
        if (userResponse.error) {
          setError('Failed to fetch user profile: ' + userResponse.error);
          return;
        }
        setUser(userResponse.data!);

        // Fetch tournament info
        const tournamentResponse = await makeAuthenticatedRequest<Tournament>(`/api/tournaments/${tournamentId}`);
        if (tournamentResponse.error) {
          setError('Failed to fetch tournament info: ' + tournamentResponse.error);
          return;
        }
        setTournament(tournamentResponse.data!);

      } catch (err) {
        setError('An error occurred while fetching data');
        console.error('Error fetching initial data:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [tournamentId]);

  // Fetch all users for player search
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const usersResponse = await makeAuthenticatedRequest<User[]>('/api/users');
        if (usersResponse.error) {
          console.error('Failed to fetch users:', usersResponse.error);
        } else {
          setAllUsers(usersResponse.data || []);
          setFilteredUsers(usersResponse.data || []);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setFilteredUsers([]);
    } else {
      const filtered = allUsers.filter(user =>
        (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, allUsers]);

  // Handle player selection
  const handlePlayerSelect = (user: User, isSelected: boolean) => {
    if (isSelected) {
      const newPlayer: SelectedPlayer = {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        roleInTeam: 'Player' // Default role
      };
      setSelectedPlayers(prev => [...prev, newPlayer]);
    } else {
      setSelectedPlayers(prev => prev.filter(player => player.userId !== user.userId));
    }
  };

  // Handle role assignment for selected players
  const handleRoleChange = (userId: number, newRole: string) => {
    setSelectedPlayers(prev =>
      prev.map(player =>
        player.userId === userId ? { ...player, roleInTeam: newRole } : player
      )
    );
  };

  // Handle removing a selected player
  const handleRemovePlayer = (userId: number) => {
    setSelectedPlayers(prev => prev.filter(player => player.userId !== userId));
  };

  // Check if all necessary fields are filled
  const isFormValid = teamName.trim() && selectedLogo && user && tournament;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    if (!user || !tournament) {
      setError('Required data not loaded');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Step 1: Create the team
      const teamRequest: TeamRequest = {
        teamName: teamName.trim(),
        sportId: tournament.sportId,
        createdById: user.userId,
        logo: selectedLogo,
        tournamentId: parseInt(tournamentId)
      };
      const teamResponse = await makeAuthenticatedRequest<{
        team: {
          teamId: number;
          teamName: string;
          sportId: number;
          sportName: string;
          createdById: number;
          createdByName: string;
          logo: string;
          tournamentId: number;
          dummy: boolean;
        };
        message: string;
      }>('/api/teams', {
        method: 'POST',
        body: JSON.stringify(teamRequest)
      });

      if (teamResponse.error) {
        setError('Failed to create team: ' + teamResponse.error);
        return;
      }

      const teamId = teamResponse.data?.team?.teamId;
      if (!teamId) {
        setError('Team created but no team ID returned');
        return;
      }

      // Step 2: Add team creator as Captain
      const creatorMemberRequest: TeamMemberRequest = {
        teamId: teamId,
        userId: user.userId,
        roleInTeam: 'Captain'
      };

      const creatorMemberResponse = await makeAuthenticatedRequest('/api/team-members', {
        method: 'POST',
        body: JSON.stringify(creatorMemberRequest)
      });

      if (creatorMemberResponse.error) {
        console.warn('Failed to add creator as captain:', creatorMemberResponse.error);
      }

      // Step 3: Add selected players as team members
      const memberAdditionErrors: string[] = [];
      for (const player of selectedPlayers) {
        const memberRequest: TeamMemberRequest = {
          teamId: teamId,
          userId: player.userId,
          roleInTeam: player.roleInTeam
        };

        const memberResponse = await makeAuthenticatedRequest('/api/team-members', {
          method: 'POST',
          body: JSON.stringify(memberRequest)
        });

        if (memberResponse.error) {
          memberAdditionErrors.push(`Failed to add ${player.name}: ${memberResponse.error}`);
        }
      }

      if (memberAdditionErrors.length > 0) {
        setError(`${teamResponse.data?.message || 'Team created successfully'}, but some members couldn't be added: ${memberAdditionErrors.join(', ')}`);
      } else {
        const successMessage = teamResponse.data?.message || 'Team created successfully';
        setSuccess(`${successMessage}! ${selectedPlayers.length > 0 ? 'All members added successfully!' : ''}`);
        setTeamName('');
        setSelectedLogo('/Photos/team-logos/logo1.png');
        setSelectedPlayers([]);
        setSearchQuery('');

        // Redirect to teams list or dashboard after a short delay
        setTimeout(() => {
          router.push('/player/my-teams');
        }, 2000);
      }
    } catch (err) {
      setError('An error occurred while creating the team');
      console.error('Error creating team:', err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="create-team-container">
        <Topbar />
        <div className="loading-message">Loading tournament information...</div>
      </div>
    );
  }

  if (!user || !tournament) {
    return (
      <div className="create-team-container">
        <Topbar />
        <div className="error-message">
          Failed to load required data. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="create-team-container">
      <Topbar />
      <div className="create-team-card">
        <h1 className="page-title">Create Team</h1>

        <div className="tournament-info">
          <h3>Tournament: {tournament.name}</h3>
        </div>

        {/* Debug info */}
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '20px' }}>
          <p>Selected Logo: {selectedLogo}</p>
          <p>Available Logos: {availableLogos.length}</p>
        </div>

        <form onSubmit={handleSubmit} className="create-team-form">
          <div className="form-group">
            <label htmlFor="teamName" className="form-label">
              Team Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="form-input"
              placeholder="Enter your team name"
              disabled={loading}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Team Logo <span className="required">*</span>
            </label>
            <div className="logo-selection">
              <div className="current-logo">
                <Image
                  src={selectedLogo}
                  alt="Selected Team Logo"
                  className="logo-preview"
                  width={80}
                  height={80}
                  onError={handleLogoError}
                />
                <p className="logo-text">Selected Logo</p>
              </div>

              <div className="logo-options">
                <h4>Choose a Logo:</h4>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                  Click on any logo below to select it for your team
                </p>
                <div className="logo-grid">
                  {availableLogos.map((logo) => (
                    <div
                      key={logo.id}
                      className={`logo-option ${selectedLogo === logo.path ? 'selected' : ''}`}
                      onClick={() => {
                        console.log('Logo selected:', logo.path);
                        setSelectedLogo(logo.path);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {isValidLogoPath(logo.path) ? (
                        <Image
                          src={logo.path}
                          alt={logo.name}
                          className="logo-thumbnail"
                          width={60}
                          height={60}
                          onError={handleLogoError}
                        />
                      ) : (
                        <div className="default-logo-thumbnail" style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          ?
                        </div>
                      )}
                      <span className="logo-name">{logo.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Player Search Section */}
          <div className="form-group">
            <label className="form-label">Search and Add Players</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              placeholder="Search players by name or email..."
              disabled={loading || usersLoading}
            />

            {usersLoading && <div className="loading-message">Loading players...</div>}

            {/* Search Instructions */}
            {!usersLoading && searchQuery.length === 0 && (
              <div className="search-instructions">
                <p>Start typing to search for players...</p>
              </div>
            )}

            {/* Search too short message */}
            {!usersLoading && searchQuery.length > 0 && searchQuery.length < 2 && (
              <div className="search-instructions">
                <p>Type at least 2 characters to search...</p>
              </div>
            )}

            {/* No results message */}
            {!usersLoading && searchQuery.length >= 2 && filteredUsers.length === 0 && (
              <div className="no-results">
                <p>No players found matching &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}

            {/* Available Players List */}
            {!usersLoading && searchQuery.length >= 2 && filteredUsers.length > 0 && (
              <div className="players-list">
                <h4>Available Players ({filteredUsers.filter(u => u.userId !== user?.userId).length} found):</h4>
                <div className="players-grid">
                  {filteredUsers
                    .filter(u => u.userId !== user?.userId) // Exclude team creator
                    .slice(0, 8) // Limit to 8 results for performance
                    .map((availableUser) => {
                      const isSelected = selectedPlayers.some(p => p.userId === availableUser.userId);
                      return (
                        <div key={availableUser.userId} className="player-item">
                          <input
                            type="checkbox"
                            id={`player-${availableUser.userId}`}
                            checked={isSelected}
                            onChange={(e) => handlePlayerSelect(availableUser, e.target.checked)}
                            disabled={loading}
                          />
                          <label htmlFor={`player-${availableUser.userId}`} className="player-label">
                            <div className="player-info">
                              <span className="player-name">{availableUser.name || 'Unknown User'}</span>
                              <span className="player-email">{availableUser.email || 'No email'}</span>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                </div>
                {filteredUsers.filter(u => u.userId !== user?.userId).length > 8 && (
                  <div className="more-results">
                    <p>Showing first 8 results. Refine your search to see more specific results.</p>
                  </div>
                )}
              </div>
            )}

            {/* Selected Players with Role Assignment */}
            {selectedPlayers.length > 0 && (
              <div className="selected-players">
                <h4>Selected Players ({selectedPlayers.length}):</h4>
                <div className="selected-players-list">
                  {selectedPlayers.map((player) => (
                    <div key={player.userId} className="selected-player-item">
                      <div className="player-info">
                        <span className="player-name">{player.name}</span>
                        <span className="player-email">{player.email}</span>
                      </div>
                      <div className="role-assignment">
                        <label htmlFor={`role-${player.userId}`}>Role:</label>
                        <select
                          id={`role-${player.userId}`}
                          value={player.roleInTeam}
                          onChange={(e) => handleRoleChange(player.userId, e.target.value)}
                          className="role-select"
                          disabled={loading}
                        >
                          <option value="Player">Player</option>
                          <option value="Vice Captain">Vice Captain</option>
                          <option value="Wicket Keeper">Wicket Keeper</option>
                          <option value="All Rounder">All Rounder</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(player.userId)}
                        className="remove-player-btn"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${!isFormValid ? 'btn-disabled' : ''}`}
              disabled={!isFormValid}
            >
              Create Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamPage;
