import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081';

    // Check for existing token on app start
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            setToken(savedToken);
            // Verify token with backend
            fetchCurrentUser(savedToken);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchCurrentUser = async (authToken) => {
        try {
            const response = await fetch(`${API_BASE}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                console.log("User data from /me endpoint:", userData); // Debug log
                setUser(userData);
            } else {
                // Token is invalid
                logout();
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Login response data:", data); // Debug log
                // Backend returns LoginResponse directly, not nested user object
                const { token: newToken, ...userData } = data;

                setToken(newToken);
                setUser(userData);
                localStorage.setItem('token', newToken);
                localStorage.setItem('userEmail', userData.email);
                localStorage.setItem('isLoggedIn', 'true');

                return { success: true };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error' };
        }
    };

    const register = async (email, password, firstName, lastName) => {
        try {
            const response = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    firstName: firstName || email.split('@')[0],
                    lastName: lastName || ""
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Register response data:", data); // Debug log
                // Backend returns LoginResponse directly, not nested user object
                const { token: newToken, ...userData } = data;

                setToken(newToken);
                setUser(userData);
                localStorage.setItem('token', newToken);
                localStorage.setItem('userEmail', userData.email);
                localStorage.setItem('isLoggedIn', 'true');

                return { success: true };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Network error' };
        }
    };

    // ✨ NEW: Password reset functions
    const forgotPassword = async (email) => {
        try {
            const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, message: data.message };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message || 'Failed to send reset email' };
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            return { success: false, error: 'Network error' };
        }
    };

    const resetPassword = async (token, newPassword) => {
        try {
            const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, newPassword })
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, message: data.message };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message || 'Failed to reset password' };
            }
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: 'Network error' };
        }
    };

    const validateResetToken = async (token) => {
        try {
            const response = await fetch(`${API_BASE}/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return { success: data.success, message: data.message };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message || 'Invalid token' };
            }
        } catch (error) {
            console.error('Validate token error:', error);
            return { success: false, error: 'Network error' };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isLoggedIn');
    };

    // Helper function to make authenticated API calls
    const authenticatedFetch = async (url, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return fetch(url, {
            ...options,
            headers
        });
    };

    const value = {
        token,
        user,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        validateResetToken,
        authenticatedFetch,
        isAuthenticated: !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};