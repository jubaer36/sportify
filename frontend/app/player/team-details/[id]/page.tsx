'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Topbar from "@/Component/topbar";
import { makeAuthenticatedRequest } from '../../../../utils/api';
import './team-details.css';

interface User {
  userId: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: string;
  profilePhoto: string | null;
}

interface TeamMember {
  userId: number;
  name: string;
  email: string;
  roleInTeam: string;
  status: string;
  joinedDate: string;
}

interface Tournament {
  tournamentId: number;
  name: string;
  sportId: number;
  sportName: string;
  startDate: string;
  endDate: string;
  createdById: number;
  createdByName: string;
  championId?: number;
  championName?: string;
  runnerUpId?: number;
  runnerUpName?: string;
}

interface TeamDetails {
  teamId: number;
  teamName: string;
  sportId: number;
  sportName: string;
  createdById: number;
  createdByName: string;
  logo: string;
  tournamentId?: number;
  tournament?: Tournament | null;
  members: TeamMember[];
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

const TeamDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Add member states
  const [showAddMember, setShowAddMember] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('Player');

  // Check if current user is captain
  const isCaptain = teamDetails?.members.some(
    member => member.userId === user?.userId && member.roleInTeam === 'Captain'
  );

  // Get current user's membership status
  const currentMemberStatus = teamDetails?.members.find(
    member => member.userId === user?.userId
  );

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userResponse = await makeAuthenticatedRequest<User>('/api/users/profile');
        if (userResponse.error) {
          setError('Failed to fetch user profile: ' + userResponse.error);
          return;
        }
        setUser(userResponse.data!);
      } catch (err) {
        setError('An error occurred while fetching user profile');
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch team details and members
  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch team basic info
        const teamResponse = await makeAuthenticatedRequest<Omit<TeamDetails, 'members'>>(`/api/teams/${teamId}`);
        if (teamResponse.error) {
          setError('Failed to fetch team details: ' + teamResponse.error);
          return;
        }

        // Fetch team members
        const membersResponse = await makeAuthenticatedRequest<TeamMember[]>(`/api/team-members/team/${teamId}`);
        if (membersResponse.error) {
          setError('Failed to fetch team members: ' + membersResponse.error);
          return;
        }

        // Combine team info with members
        const team = teamResponse.data;
        const members = membersResponse.data || [];
        
        if (team) {
          setTeamDetails({
            ...team,
            members
          });
        }

      } catch (err) {
        setError('An error occurred while fetching team details');
        console.error('Error fetching team details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      fetchTeamDetails();
    }
  }, [teamId]);

  // Fetch all users when add member modal is opened
  useEffect(() => {
    const fetchUsers = async () => {
      if (!showAddMember) return;
      
      try {
        const usersResponse = await makeAuthenticatedRequest<User[]>('/api/users');
        if (usersResponse.error) {
          console.error('Failed to fetch users:', usersResponse.error);
        } else {
          setAllUsers(usersResponse.data || []);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
  }, [showAddMember]);

  // Filter users for add member search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setFilteredUsers([]);
    } else {
      const existingMemberIds = teamDetails?.members.map(m => m.userId) || [];
      const filtered = allUsers.filter(user =>
        !existingMemberIds.includes(user.userId) &&
        ((user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
         (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())))
      );
      setFilteredUsers(filtered.slice(0, 8)); // Limit to 8 results
    }
  }, [searchQuery, allUsers, teamDetails?.members]);

  // Handle removing a member (Captain only)
  const handleRemoveMember = async (userId: number, memberName: string) => {
    if (!isCaptain) return;
    
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await makeAuthenticatedRequest(
        `/api/team-members/team/${teamId}/user/${userId}`,
        { method: 'DELETE' }
      );

      if (response.error) {
        setError('Failed to remove member: ' + response.error);
      } else {
        setSuccess(`${memberName} has been removed from the team.`);
        // Refresh team details
        window.location.reload();
      }
    } catch (err) {
      setError('An error occurred while removing member');
      console.error('Error removing member:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle adding a new member (Captain only)
  const handleAddMember = async () => {
    if (!isCaptain || !selectedUser) return;

    try {
      setActionLoading(true);
      const addRequest: AddMemberRequest = {
        teamId: parseInt(teamId),
        userId: selectedUser.userId,
        roleInTeam: selectedRole
      };

      const response = await makeAuthenticatedRequest('/api/team-members', {
        method: 'POST',
        body: JSON.stringify(addRequest)
      });

      if (response.error) {
        setError('Failed to add member: ' + response.error);
      } else {
        setSuccess(`${selectedUser.name} has been added to the team.`);
        setShowAddMember(false);
        setSelectedUser(null);
        setSearchQuery('');
        // Refresh team details
        window.location.reload();
      }
    } catch (err) {
      setError('An error occurred while adding member');
      console.error('Error adding member:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle status change from PENDING to ACCEPTED (Non-captain members)
  const handleAcceptInvitation = async () => {
    if (!currentMemberStatus || currentMemberStatus.status !== 'PENDING') return;

    try {
      setActionLoading(true);
      const updateRequest: UpdateStatusRequest = {
        teamId: parseInt(teamId),
        userId: user!.userId,
        status: 'ACCEPTED'
      };

      const response = await makeAuthenticatedRequest('/api/team-members', {
        method: 'PUT',
        body: JSON.stringify(updateRequest)
      });

      if (response.error) {
        setError('Failed to accept invitation: ' + response.error);
      } else {
        setSuccess('You have successfully accepted the team invitation!');
        // Refresh team details
        window.location.reload();
      }
    } catch (err) {
      setError('An error occurred while accepting invitation');
      console.error('Error accepting invitation:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle leaving team (Non-captain members)
  const handleLeaveTeam = async () => {
    if (isCaptain) {
      setError('Captains cannot leave their own team. Transfer captaincy first.');
      return;
    }

    if (!confirm('Are you sure you want to leave this team?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await makeAuthenticatedRequest(
        `/api/team-members/team/${teamId}/user/${user!.userId}`,
        { method: 'DELETE' }
      );

      if (response.error) {
        setError('Failed to leave team: ' + response.error);
      } else {
        setSuccess('You have successfully left the team.');
        // Redirect to my teams page after a delay
        setTimeout(() => {
          router.push('/player/my-teams');
        }, 2000);
      }
    } catch (err) {
      setError('An error occurred while leaving team');
      console.error('Error leaving team:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="team-details-bg">
        <Topbar />
        <div className="team-details-content">
          <div className="loading-message">Loading team details...</div>
        </div>
      </div>
    );
  }

  if (error && !teamDetails) {
    return (
      <div className="team-details-bg">
        <Topbar />
        <div className="team-details-content">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (!teamDetails) {
    return (
      <div className="team-details-bg">
        <Topbar />
        <div className="team-details-content">
          <div className="error-message">Team not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="team-details-bg">
      <Topbar />
      <div className="team-details-content">
        {/* Team Header */}
        <div className="team-header">
          <button 
            className="back-button"
            onClick={() => router.back()}
          >
            ← Back to My Teams
          </button>
          
          <div className="team-header-info">
            <div className="team-logo-large">
              {teamDetails.logo ? (
                <Image 
                  src={teamDetails.logo} 
                  alt={teamDetails.teamName}
                  width={80}
                  height={80}
                  className="logo-image-large"
                />
              ) : (
                <div className="default-logo-large">
                  {teamDetails.teamName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="team-info">
              <h1 className="team-title">{teamDetails.teamName}</h1>
              <div className="team-meta">
                <span className="sport-badge-large">⚽ {teamDetails.sportName}</span>
                <span className="created-by">Created by {teamDetails.createdByName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Action Buttons */}
        <div className="action-buttons">
          {isCaptain && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddMember(true)}
              disabled={actionLoading}
            >
              Add Member
            </button>
          )}
          
          {currentMemberStatus?.status === 'PENDING' && !isCaptain && (
            <button 
              className="btn btn-success"
              onClick={handleAcceptInvitation}
              disabled={actionLoading}
            >
              Accept Invitation
            </button>
          )}
          
          {!isCaptain && currentMemberStatus && (
            <button 
              className="btn btn-danger"
              onClick={handleLeaveTeam}
              disabled={actionLoading}
            >
              Leave Team
            </button>
          )}
        </div>

        {/* Team Members */}
        <div className="members-section">
          <h2 className="section-title">
            Team Members ({teamDetails.members.length})
          </h2>
          
          <div className="members-grid">
            {teamDetails.members.map((member) => (
              <div key={member.userId} className="member-card">
                <div className="member-info">
                  <div className="member-avatar">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="member-details">
                    <h3 className="member-name">{member.name}</h3>
                    <p className="member-email">{member.email}</p>
                    <div className="member-badges">
                      <span className={`role-badge ${member.roleInTeam.toLowerCase()}`}>
                        {member.roleInTeam}
                      </span>
                      <span className={`status-badge ${member.status.toLowerCase()}`}>
                        {member.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                {isCaptain && member.userId !== user?.userId && (
                  <button 
                    className="remove-member-btn"
                    onClick={() => handleRemoveMember(member.userId, member.name)}
                    disabled={actionLoading}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add Member Modal */}
        {showAddMember && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Add New Member</h3>
                <button 
                  className="close-button"
                  onClick={() => {
                    setShowAddMember(false);
                    setSelectedUser(null);
                    setSearchQuery('');
                  }}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-content">
                <div className="search-section">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                    placeholder="Search users by name or email..."
                  />
                  
                  {searchQuery.length >= 2 && filteredUsers.length > 0 && (
                    <div className="users-list">
                      {filteredUsers.map((user) => (
                        <div 
                          key={user.userId} 
                          className={`user-item ${selectedUser?.userId === user.userId ? 'selected' : ''}`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <span>{user.name}</span>
                          <span>{user.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedUser && (
                  <div className="selected-user-section">
                    <h4>Selected User: {selectedUser.name}</h4>
                    <div className="role-selection">
                      <label>Role in Team:</label>
                      <select 
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                      >
                        <option value="Player">Player</option>
                        <option value="Vice Captain">Vice Captain</option>
                        <option value="Wicket Keeper">Wicket Keeper</option>
                        <option value="All Rounder">All Rounder</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddMember(false);
                    setSelectedUser(null);
                    setSearchQuery('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleAddMember}
                  disabled={!selectedUser || actionLoading}
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetailsPage;
