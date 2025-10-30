'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Topbar from "@/Component/topbar";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./team-details.css";

// Interfaces
interface Team {
  teamId: number;
  teamName?: string;
  sportId: number;
  sportName?: string;
  createdById: number;
  createdByName?: string;
  logo?: string;
  tournamentId?: number;
}

interface TeamMember {
  teamId: number;
  teamName?: string;
  userId: number;
  userName?: string;
  userEmail?: string;
  roleInTeam?: string;
  status?: 'PENDING' | 'ACCEPTED';
}

interface Tournament {
  tournamentId: number;
  name: string;
  sportId: number;
  sportName: string;
  type?: 'ROUND_ROBIN' | 'KNOCKOUT';
  startDate: string;
  endDate: string;
  createdById: number;
  createdByName: string;
  championId?: number;
  championName?: string;
  runnerUpId?: number;
  runnerUpName?: string;
}

interface TeamMembersResponse {
  message: string;
  teamMembers: TeamMember[];
  totalMembers: number;
}

const TeamDetailsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  // State management
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);

  // Fetch team information
  const fetchTeamInfo = async () => {
    try {
      const response = await makeAuthenticatedRequest<Team>(`/api/teams/${teamId}`);
      
      if (response.error) {
        setError('Failed to fetch team information: ' + response.error);
        return;
      }

      if (response.data) {
        setTeam(response.data);
        
        // If team has a tournament, fetch tournament details
        if (response.data.tournamentId) {
          await fetchTournamentInfo(response.data.tournamentId);
        }
      }
    } catch (err) {
      console.error('Error fetching team info:', err);
      setError('Failed to load team information');
    }
  };

  // Fetch tournament information
  const fetchTournamentInfo = async (tournamentId: number) => {
    try {
      const response = await makeAuthenticatedRequest<Tournament>(`/api/tournaments/${tournamentId}`);
      
      if (response.data) {
        setTournament(response.data);
      }
    } catch (err) {
      console.error('Error fetching tournament info:', err);
      // Don't set error here as tournament info is optional
    }
  };

  // Fetch team members
  const fetchTeamMembers = async () => {
    try {
      setMembersLoading(true);
      const response = await makeAuthenticatedRequest<TeamMembersResponse>(`/api/team-members/team/${teamId}`);
      
      if (response.error) {
        console.error('Failed to fetch team members:', response.error);
        setMembers([]); // Set empty array instead of error to allow partial loading
        return;
      }

      if (response.data && response.data.teamMembers) {
        setMembers(response.data.teamMembers);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchTeamInfo(),
        fetchTeamMembers()
      ]);
      setLoading(false);
    };

    if (teamId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get status badge class
  const getStatusBadge = (status: string | undefined | null) => {
    if (!status) return 'status-pending';
    return status === 'ACCEPTED' ? 'status-accepted' : 'status-pending';
  };

  // Get role badge class
  const getRoleBadge = (role: string | undefined | null) => {
    if (!role) return 'role-member';
    const roleClass = role.toLowerCase().replace(/\s+/g, '-');
    return `role-${roleClass}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="team-details-bg">
        <Topbar />
        <div className="team-details-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading team details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="team-details-bg">
        <Topbar />
        <div className="team-details-content">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>Error Loading Team</h2>
            <p>{error}</p>
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
            <button 
              className="back-button"
              onClick={() => router.back()}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No team found
  if (!team) {
    return (
      <div className="team-details-bg">
        <Topbar />
        <div className="team-details-content">
          <div className="error-container">
            <div className="error-icon">🔍</div>
            <h2>Team Not Found</h2>
            <p>The team you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
            <button 
              className="back-button"
              onClick={() => router.back()}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="team-details-bg">
      <Topbar />
      <div className="team-details-content">
        {/* Header Section */}
        <div className="team-header">
          <button 
            className="back-nav-button"
            onClick={() => router.back()}
          >
            ← Back
          </button>
          
          <div className="team-main-info">
            <div className="team-logo-section">
              <Image
                src={team.logo || '/Photos/logo1.png'}
                alt={`${team.teamName || 'Team'} logo`}
                width={80}
                height={80}
                className="team-logo-large"
              />
            </div>
            
            <div className="team-title-section">
              <h1 className="team-name">{team.teamName || 'Unknown Team'}</h1>
              <div className="team-meta">
                <span className="sport-badge">{team.sportName || 'Unknown Sport'}</span>
                <span className="team-id">Team ID: {team.teamId}</span>
              </div>
              <div className="created-by">
                Created by: <strong>{team.createdByName || 'Unknown'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Tournament Info Section */}
        {tournament && (
          <div className="tournament-section">
            <h2>Tournament Information</h2>
            <div className="tournament-card">
              <div className="tournament-header">
                <h3>{tournament.name}</h3>
                <span className={`tournament-type ${tournament.type?.toLowerCase() || 'unknown'}`}>
                  {tournament.type?.replace('_', ' ') || 'Unknown'}
                </span>
              </div>
              <div className="tournament-details">
                <div className="tournament-detail">
                  <span className="detail-label">Start Date:</span>
                  <span className="detail-value">{formatDate(tournament.startDate)}</span>
                </div>
                <div className="tournament-detail">
                  <span className="detail-label">End Date:</span>
                  <span className="detail-value">{formatDate(tournament.endDate)}</span>
                </div>
                <div className="tournament-detail">
                  <span className="detail-label">Organized by:</span>
                  <span className="detail-value">{tournament.createdByName}</span>
                </div>
                {tournament.championName && (
                  <div className="tournament-detail">
                    <span className="detail-label">Champion:</span>
                    <span className="detail-value champion">{tournament.championName} 🏆</span>
                  </div>
                )}
                {tournament.runnerUpName && (
                  <div className="tournament-detail">
                    <span className="detail-label">Runner-up:</span>
                    <span className="detail-value runner-up">{tournament.runnerUpName} 🥈</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Team Members Section */}
        <div className="members-section">
          <div className="members-header">
            <h2>Team Members</h2>
            {!membersLoading && (
              <span className="members-count">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {membersLoading ? (
            <div className="members-loading">
              <div className="loading-spinner-small"></div>
              <p>Loading team members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="no-members">
              <div className="no-members-icon">👥</div>
              <h3>No Members Found</h3>
              <p>This team doesn&apos;t have any members yet.</p>
            </div>
          ) : (
            <div className="members-grid">
              {members.map((member) => (
                <div key={`${member.teamId}-${member.userId}`} className="member-card">
                  <div className="member-avatar">
                    <Image
                      src="/Photos/profile.png"
                      alt={member.userName || 'Team Member'}
                      width={50}
                      height={50}
                      className="member-photo"
                    />
                  </div>
                  
                  <div className="member-info">
                    <h4 className="member-name">{member.userName || 'Unknown Member'}</h4>
                    <p className="member-email">{member.userEmail || 'No email provided'}</p>
                    
                    <div className="member-badges">
                      <span className={`role-badge ${getRoleBadge(member.roleInTeam)}`}>
                        {member.roleInTeam || 'Member'}
                      </span>
                      <span className={`status-badge ${getStatusBadge(member.status)}`}>
                        {member.status || 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Stats Section */}
        <div className="team-stats">
          <h2>Team Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{members.filter(m => m.status === 'ACCEPTED').length}</div>
              <div className="stat-label">Active Members</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{members.filter(m => m.status === 'PENDING').length}</div>
              <div className="stat-label">Pending Members</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{members.length}</div>
              <div className="stat-label">Total Members</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{tournament ? '1' : '0'}</div>
              <div className="stat-label">Tournaments</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetailsPage;
