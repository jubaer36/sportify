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

interface User {
  userId: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: string;
  profilePhoto: string | null;
}

interface AddMemberRequest {
  teamId: number;
  userId: number;
  roleInTeam: string;
}

interface UpdateStatusRequest {
  teamId: number;
  userId: number;
  status: string;
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
  const [currentUser, setCurrentUser] = useState<{ userId: number; role: string } | null>(null);
  const [removingMember, setRemovingMember] = useState<number | null>(null);
  
  // Add member modal states
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('Player');
  const [addingMember, setAddingMember] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [leavingTeam, setLeavingTeam] = useState<number | null>(null);

  // Fetch current user profile
  const fetchCurrentUser = async () => {
    try {
      const response = await makeAuthenticatedRequest<{ userId: number; role: string }>('/api/users/profile');
      
      if (response.data) {
        setCurrentUser(response.data);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      // Don't set error here as this is optional functionality
    }
  };

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

  // Remove team member (captain only)
  const removeMember = async (memberId: number) => {
    if (!currentUser || !team) return;
    
    // Check if current user is captain of this team
    const isCaptain = members.some(member => 
      member.userId === currentUser.userId && 
      member.roleInTeam?.toLowerCase().includes('captain')
    );
    
    if (!isCaptain) {
      alert('Only team captains can remove members.');
      return;
    }

    if (!window.confirm('Are you sure you want to remove this member from the team?')) {
      return;
    }

    try {
      setRemovingMember(memberId);
      
      const response = await makeAuthenticatedRequest(
        `/api/team-members/team/${teamId}/user/${memberId}`,
        { method: 'DELETE' }
      );

      if (response.error) {
        alert('Failed to remove member: ' + response.error);
        return;
      }

      // Refresh the members list
      await fetchTeamMembers();
      alert('Member removed successfully!');
      
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Failed to remove member. Please try again.');
    } finally {
      setRemovingMember(null);
    }
  };

  // Check if current user is captain of this team
  const isCurrentUserCaptain = () => {
    if (!currentUser || !members.length) return false;
    
    return members.some(member => 
      member.userId === currentUser.userId && 
      member.roleInTeam?.toLowerCase().includes('captain')
    );
  };

  // Fetch all users for adding members
  const fetchAllUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await makeAuthenticatedRequest<User[]>('/api/users');
      
      if (response.error) {
        console.error('Failed to fetch users:', response.error);
        return;
      }

      if (response.data) {
        // Filter out users who are already members of this team
        const currentMemberIds = members.map(member => member.userId);
        const availableUsers = response.data.filter(user => 
          !currentMemberIds.includes(user.userId)
        );
        setAllUsers(availableUsers);
        setFilteredUsers(availableUsers);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Handle search input for users
  const handleSearchUsers = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredUsers(allUsers);
      return;
    }

    const filtered = allUsers.filter(user =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  // Open add member modal
  const openAddMemberModal = () => {
    setShowAddMemberModal(true);
    setSearchQuery('');
    setSelectedUser(null);
    setSelectedRole('Player');
    fetchAllUsers();
  };

  // Close add member modal
  const closeAddMemberModal = () => {
    setShowAddMemberModal(false);
    setSearchQuery('');
    setSelectedUser(null);
    setSelectedRole('Player');
    setAllUsers([]);
    setFilteredUsers([]);
  };

  // Add new member to team
  const addMember = async () => {
    if (!selectedUser || !currentUser || !team) return;

    // Check if current user is captain
    if (!isCurrentUserCaptain()) {
      alert('Only team captains can add members.');
      return;
    }

    try {
      setAddingMember(true);

      const addMemberRequest: AddMemberRequest = {
        teamId: team.teamId,
        userId: selectedUser.userId,
        roleInTeam: selectedRole
      };

      const response = await makeAuthenticatedRequest(
        '/api/team-members',
        {
          method: 'POST',
          body: JSON.stringify(addMemberRequest)
        }
      );

      if (response.error) {
        alert('Failed to add member: ' + response.error);
        return;
      }

      // Refresh the members list
      await fetchTeamMembers();
      closeAddMemberModal();
      alert('Member added successfully!');

    } catch (err) {
      console.error('Error adding member:', err);
      alert('Failed to add member. Please try again.');
    } finally {
      setAddingMember(false);
    }
  };

  // Accept membership (change status from PENDING to ACCEPTED)
  const acceptMembership = async (memberId: number) => {
    if (!currentUser || !team) return;

    // Only allow the user to accept their own membership
    if (memberId !== currentUser.userId) {
      alert('You can only accept your own membership.');
      return;
    }

    if (!window.confirm('Do you want to accept your membership in this team?')) {
      return;
    }

    try {
      setUpdatingStatus(memberId);

      const updateStatusRequest: UpdateStatusRequest = {
        teamId: team.teamId,
        userId: memberId,
        status: 'ACCEPTED'
      };

      const response = await makeAuthenticatedRequest(
        '/api/team-members/status',
        {
          method: 'PUT',
          body: JSON.stringify(updateStatusRequest)
        }
      );

      if (response.error) {
        alert('Failed to accept membership: ' + response.error);
        return;
      }

      // Refresh the members list
      await fetchTeamMembers();
      alert('Membership accepted successfully!');

    } catch (err) {
      console.error('Error accepting membership:', err);
      alert('Failed to accept membership. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Leave team (remove self from team)
  const leaveTeam = async (memberId: number) => {
    if (!currentUser || !team) return;

    // Only allow the user to leave themselves
    if (memberId !== currentUser.userId) {
      alert('You can only remove yourself from the team.');
      return;
    }

    // Check if user is captain - captains shouldn't be able to leave easily
    const userMember = members.find(member => member.userId === currentUser.userId);
    if (userMember?.roleInTeam?.toLowerCase().includes('captain')) {
      if (!window.confirm('As a captain, leaving the team may affect team management. Are you sure you want to leave?')) {
        return;
      }
    } else {
      if (!window.confirm('Are you sure you want to leave this team?')) {
        return;
      }
    }

    try {
      setLeavingTeam(memberId);

      const response = await makeAuthenticatedRequest(
        `/api/team-members/team/${teamId}/user/${memberId}`,
        { method: 'DELETE' }
      );

      if (response.error) {
        alert('Failed to leave team: ' + response.error);
        return;
      }

      // Show success message and redirect
      alert('You have successfully left the team!');
      // Redirect to my teams page or back
      router.push('/player/my-teams');

    } catch (err) {
      console.error('Error leaving team:', err);
      alert('Failed to leave team. Please try again.');
    } finally {
      setLeavingTeam(null);
    }
  };

  // Check if current user is a member of this team (not captain)
  const isCurrentUserMember = () => {
    if (!currentUser || !members.length) return null;
    
    return members.find(member => member.userId === currentUser.userId);
  };

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCurrentUser(),
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
            <div className="members-title-section">
              <h2>Team Members</h2>
              {!membersLoading && (
                <span className="members-count">
                  {members.length} member{members.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {isCurrentUserCaptain() && (
              <button
                className="add-member-btn"
                onClick={openAddMemberModal}
                disabled={membersLoading}
              >
                + Add Member
              </button>
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
                  
                  <div className="member-actions">
                    {/* Remove button - only show for captains and not for the captain themselves */}
                    {isCurrentUserCaptain() && member.userId !== currentUser?.userId && (
                      <button
                        className="remove-member-btn"
                        onClick={() => removeMember(member.userId)}
                        disabled={removingMember === member.userId}
                        title="Remove member from team"
                      >
                        {removingMember === member.userId ? '...' : '×'}
                      </button>
                    )}
                    
                    {/* Accept membership button - only show for current user if they have pending status */}
                    {member.userId === currentUser?.userId && member.status === 'PENDING' && (
                      <button
                        className="accept-member-btn"
                        onClick={() => acceptMembership(member.userId)}
                        disabled={updatingStatus === member.userId}
                        title="Accept your membership in this team"
                      >
                        {updatingStatus === member.userId ? 'Accepting...' : 'Accept'}
                      </button>
                    )}
                    
                    {/* Leave team button - only show for current user (but not if they're the only captain) */}
                    {member.userId === currentUser?.userId && (
                      <button
                        className="leave-team-btn"
                        onClick={() => leaveTeam(member.userId)}
                        disabled={leavingTeam === member.userId}
                        title="Leave this team"
                      >
                        {leavingTeam === member.userId ? 'Leaving...' : 'Leave Team'}
                      </button>
                    )}
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

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="modal-overlay" onClick={closeAddMemberModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Team Member</h3>
              <button className="modal-close-btn" onClick={closeAddMemberModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Search Users */}
              <div className="search-section">
                <label className="form-label">Search Users</label>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                />
              </div>

              {/* Users List */}
              <div className="users-list-section">
                {usersLoading ? (
                  <div className="users-loading">
                    <div className="loading-spinner-small"></div>
                    <p>Loading users...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="no-users">
                    {searchQuery.trim() ? 'No users found matching your search.' : 'No available users to add.'}
                  </div>
                ) : (
                  <div className="users-list">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.userId}
                        className={`user-option ${selectedUser?.userId === user.userId ? 'selected' : ''}`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="user-avatar">
                          <Image
                            src={user.profilePhoto || '/Photos/profile.png'}
                            alt={user.name}
                            width={40}
                            height={40}
                            className="user-photo"
                          />
                        </div>
                        <div className="user-details">
                          <h4 className="user-name">{user.name}</h4>
                          <p className="user-email">{user.email}</p>
                          <span className={`user-role ${user.role.toLowerCase()}`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Role Selection */}
              {selectedUser && (
                <div className="role-section">
                  <label className="form-label">Role in Team</label>
                  <select
                    className="role-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="Player">Player</option>
                    <option value="Captain">Captain</option>
                    <option value="Goalkeeper">Goalkeeper</option>
                    <option value="Vice Captain">Vice Captain</option>
                  </select>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={closeAddMemberModal}
                disabled={addingMember}
              >
                Cancel
              </button>
              <button
                className="add-btn"
                onClick={addMember}
                disabled={!selectedUser || addingMember}
              >
                {addingMember ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetailsPage;
