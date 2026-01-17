'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User, Team } from './api';

interface UserContextType {
  currentUser: User | null;
  currentTeam: Team | null;
  userTeams: Team[];
  setCurrentUser: (user: User | null) => void;
  setCurrentTeam: (team: Team | null) => void;
  refreshUserTeams: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUserId = localStorage.getItem('currentUserId');
        const storedTeamId = localStorage.getItem('currentTeamId');

        if (storedUserId) {
          const user = await api.getUser(storedUserId);
          setCurrentUser(user);

          // Load user's teams
          const teams = await api.getUserTeams(storedUserId);
          setUserTeams(teams);

          // Set current team
          if (storedTeamId && teams.find(t => t.id === storedTeamId)) {
            const team = await api.getTeam(storedTeamId);
            setCurrentTeam(team);
          } else if (teams.length > 0) {
            setCurrentTeam(teams[0]);
            localStorage.setItem('currentTeamId', teams[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUserId', currentUser.id);
    } else {
      localStorage.removeItem('currentUserId');
    }
  }, [currentUser]);

  // Save team to localStorage when it changes
  useEffect(() => {
    if (currentTeam) {
      localStorage.setItem('currentTeamId', currentTeam.id);
    } else {
      localStorage.removeItem('currentTeamId');
    }
  }, [currentTeam]);

  const refreshUserTeams = async () => {
    if (currentUser) {
      const teams = await api.getUserTeams(currentUser.id);
      setUserTeams(teams);
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        currentTeam,
        userTeams,
        setCurrentUser,
        setCurrentTeam,
        refreshUserTeams,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
