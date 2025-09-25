import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useAlert } from '@/Providers/Alerts.tsx';
import { BASE_URL } from '@/Providers/Urls.tsx';
type GlobalState = {
    theme: 'light' | 'dark';
    setDarkMode: (darkMode: boolean) => void;
    onMobile: boolean;
    token: string | null;
    setToken: (token: string | null) => void;
    alias: string | null;
    setAlias: (alias: string | null) => void;
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

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [onMobile, setOnMobile] = useState<boolean>(window.innerWidth < 768);
    const [alias, _setAlias] = useState<string | null>('webclient');
    const [token, setToken] = useState<string | null>(null);
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
        return fetch(BASE_URL + '/api/validatetoken', {
            headers: { 'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
             },
            method: 'POST',
            body: '{}',
        }).then(res => res.json()).then(data => {
            console.log('Token verification response:', data);
            return data.valid;
        }).catch(err => {
            console.error('Error verifying token:', err);
            return false;
        });
    };
    const requestNewToken = async (alias: string) => {
        console.log('Requesting new token for alias:', alias);
        fetch(BASE_URL + '/api/token',{
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
    React.useEffect(() => {
        console.log('Token changed:', token);
        useToast('info', token ? 'Token set' : 'No token available');
        if (token) {
            verifyToken(token).then(isValid => {
                if (!isValid) {
                    console.log('Token is invalid, requesting new token');
                    requestNewToken(alias || 'webclient');

                } else {
                    console.log('Token is valid');
                    useToast('success', 'Token is valid');
                }
            });
        }
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
            setOnMobile(window.innerWidth < 1200);// 1200px breakpoint for the filter bar
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
            requestNewToken( savedAlias || 'webclient');
        }
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    return (
        <GlobalContext.Provider value={{ theme, setDarkMode, onMobile, token, alias, setAlias, setToken }}>
            {children}
        </GlobalContext.Provider>
    );
};