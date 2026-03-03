import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile } from '../services/api';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await getProfile();
            setUser(data);
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            // Some error responses use statusCode, others status
            const status = error.statusCode || error.status;
            if (status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('welcomeToastShown');
        setUser(null);
        window.location.href = '/login';
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, refreshUser: fetchUser, logout }}>
            {children}
        </UserContext.Provider>
    );
};
