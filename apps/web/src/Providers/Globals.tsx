import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useAlert } from '@/Providers/Alerts.tsx';
import { BASE_URL } from '@/Providers/Urls.tsx';

type GlobalState = {
    theme: 'light' | 'dark';
    setDarkMode: (darkMode: boolean) => void;
    onMobile: boolean;
    token: string | null;
    alias: string | null;
    setAlias: (alias: string | null) => void;
    usersettings: any;
    setUsersettings: (settings: any) => void;
    invalidateToken: () => void;
    addToSessionHistory: (session: SessionRecord) => void;
    clearHistory: (sessionId: string) => void;
    sessionsHistory: SessionRecord[];
    mysessions: SessionRecord[];
    user : {
        id: string | null,
        role: string | null,
    };
};

const GlobalContext = createContext<GlobalState | undefined>(undefined);

export const useGlobals = () => {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error('useGlobals must be used within a GlobalProvider');
    }
    return context;
};

type GlobalProviderProps = {
    children: ReactNode;
};

const MAX_WIDTH_PX = 768;

export type SessionRecord = {
    id: string;
    alias: string;
};



export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [onMobile, setOnMobile] = useState<boolean>(window.innerWidth < MAX_WIDTH_PX);
    const [alias, _setAlias] = useState<string | null>('webclient');
    const [token, setToken] = useState<string | null>(null);
    const [mysessions, setMysessions] = useState<SessionRecord[]>([]);
    const [usersettings, setUsersettings] = useState<any>({});
    const [sessionsHistory, setSessionsHistory] = useState<SessionRecord[]>([]);
    const [user, setUser] = useState<{
        id: string | null,
        role: string | null,
    }>({
        id: null,
        role: null,

    });
    const { useToast } = useAlert();

    const setDarkMode = (enabled: boolean) => {
        if (enabled) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        setTheme(enabled ? 'dark' : 'light');
        localStorage.setItem('theme', enabled ? 'dark' : 'light');
    }
    const setAlias = (newAlias: string | null) => {
        _setAlias(newAlias);
        if (newAlias) {
            localStorage.setItem('alias', newAlias);
        }
        else {
            localStorage.removeItem('alias');
        }
        requestNewToken(newAlias || 'webclient');
    }

    const verifyToken = async (token: string) => {
        console.log('Verifying token:', token);
        fetch(BASE_URL + '/api/validatetoken', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            method: 'POST',
            body: '{}',
        }).then((data) => {
            console.log('Token verification response:', data);
            if (data.ok) {
                return data.json();
            }
        }).then((data) => {
            if (data.valid) {
                setUser({
                    id: data.userId,
                    role: data.role,
                });
            }
            else {
                console.warn('Token is invalid, requesting new token');
                invalidateToken();
                // return false;
            }
        }).catch(err => {
            console.error('Error verifying token:', err);
            // return false;
        });
    };
    const requestNewToken = async (alias: string) => {
        console.log('Requesting new token for alias:', alias);
        fetch(BASE_URL + '/api/token', {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: JSON.stringify({ alias: alias }),
        }).then(res => res.json()).then(data => {
            console.log('Received new token:', data);
            if (data.token) {
                setToken(data.token);
                localStorage.setItem('token', data.token);
            }
        }).catch(err => {
            console.error('Error fetching token:', err);
        });

    }
    const invalidateToken = () => {
        setToken(null);
        localStorage.removeItem('token');
        requestNewToken(alias || 'webclient');
    }
    const clearHistory = (sessionId: string) => {
        console.log('Clearing session from history:', sessionId);
        if (sessionId === 'all') {
            setSessionsHistory([]);
            localStorage.removeItem('sessionsHistory');
            return;
        }
        setSessionsHistory(prev => prev.filter(s => s.id !== sessionId));
    }

    const addToSessionHistory = (session: SessionRecord) => {
        console.log('Adding to session history:', session);

        setSessionsHistory(prev => {
            const exists = prev.find(s => s.id === session.id);
            if (!exists) {
                return [...prev, session];
            }
            return [...prev.filter(s => s.id !== session.id), session];
        });
    }
    React.useEffect(() => {
        if (sessionsHistory.length > 0) {
            console.log('Saving sessions history to localStorage:', sessionsHistory);
            localStorage.setItem('sessionsHistory', JSON.stringify(sessionsHistory));
        }
    }, [sessionsHistory]);
    React.useEffect(() => {
        console.log('Token changed:', token);
        useToast('info', token ? 'Token set' : 'No token available');
        if (!token) return;
        if (token) {
            verifyToken(token);
        }

        fetch(BASE_URL + '/api/mysessions', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }).then(res => {
            if (!res.ok) {
                console.error('Failed to fetch sessions:', res.statusText);
                return;
            }
            return res.json();
        }).then(data => {
            console.log('Fetched sessions:', data);
            setMysessions(data.sessions || []);
        }).catch(err => {
            console.error('Error fetching sessions:', err);
        });
    }, [token]);

    React.useEffect(() => {
        // On mount, check the preferred theme in local storage or system preference
        // and apply to the document.
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || !savedTheme) {
            setDarkMode(true);
        } else {
            setDarkMode(false);
        }
        // add event listener to track window resize and set onMobile accordingly
        const handleResize = () => {
            setOnMobile(window.innerWidth < MAX_WIDTH_PX);
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check
        const savedAlias = localStorage.getItem('alias');
        if (savedAlias) {
            _setAlias(savedAlias);
        }
        const savedToken = localStorage.getItem('token');
        console.log('Saved token from localStorage:', savedToken);
        if (savedToken) {
            console.log('Found saved token:', savedToken);
            setToken(savedToken);
        } else {
            console.log('No saved token found, requesting new token');
            requestNewToken(savedAlias || 'webclient');
        }
        const savedSessions = localStorage.getItem('sessionsHistory');
        if (savedSessions) {
            try {
                const parsed = JSON.parse(savedSessions);
                if (Array.isArray(parsed)) {
                    setSessionsHistory(parsed.map(s => ({ id: s.id, alias: s.alias })));
                }
            } catch (e) {
                console.error('Error parsing saved sessions history:', e);
            }
        }


        return () => {
            window.removeEventListener('resize', handleResize);
        };

    }, []);

    return (
        <GlobalContext.Provider value={{ theme, setDarkMode, onMobile, token, alias, setAlias, invalidateToken, usersettings, setUsersettings, sessionsHistory, addToSessionHistory, clearHistory, mysessions, user }}>
            {children}
        </GlobalContext.Provider>
    );
};