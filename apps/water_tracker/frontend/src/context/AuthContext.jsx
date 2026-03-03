import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hydrate from localStorage on initial load
        const storedUser = localStorage.getItem('user');
        const authAuth = localStorage.getItem('auth');

        if (storedUser && authAuth) {
            try {
                setUser(JSON.parse(storedUser));
                setIsAuthenticated(true);
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
                logout(); // Clear invalid data
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('login', { username, password });
            if (response.data.user) {
                const authString = btoa(`${username}:${password}`);
                localStorage.setItem('auth', authString);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setUser(response.data.user);
                setIsAuthenticated(true);
                return { success: true };
            }
            return { success: false, error: 'Login failed: No user data returned' };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Login failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('auth');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };

    const isAdmin = () => {
        return user?.role === 'Admin';
    };


    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>; // Or a better spinner
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
