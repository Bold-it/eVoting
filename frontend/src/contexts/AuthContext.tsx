import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { jwtDecode } from 'jwt-decode';

interface User {
  sub: string;
  role: 'super_admin' | 'election_officer' | 'voter';
  email?: string;
  studentId?: string;
  electionId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (googleToken: string, adminToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode<User>(token);
        setUser(decoded);
      } catch (error) {
        localStorage.removeItem('access_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (googleToken: string, adminToken: string) => {
    try {
      const res = await api.post('/auth/admin/login', { googleToken, token: adminToken });
      const { accessToken } = res.data;
      localStorage.setItem('access_token', accessToken);
      
      const decoded = jwtDecode<User>(accessToken);
      setUser(decoded);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
