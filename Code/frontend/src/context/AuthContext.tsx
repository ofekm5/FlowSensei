import { FC, createContext, useState, ReactNode } from 'react';
import axiosInstance, { setAuthorizationToken } from '../api/axiosInstance';
import axios from 'axios';

export interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const login = (username: string, password: string): boolean => {
    const isLoggedIn = username === 'admin' && password === '123456789';
    setIsAuthenticated(isLoggedIn);
    return isLoggedIn

  }

  const logout = () => setIsAuthenticated(false);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};








  // const login = async (username: string, password: string): Promise<boolean> => {
  //   try {
  //     const response = await axiosInstance.post('/login', {
  //       username,
  //       password,
  //     });
      
  //     const token = response.data.token;
      
  //     setAuthorizationToken(token);

  //     setIsAuthenticated(true);
      
  //     return true;
  //   } catch (error) {
  //     console.error('Failed to fetch the token:', error);

  //     return false;
  //   }
  // };

