import React, { createContext, useContext, useState, type ReactNode } from 'react';

type GlobalState = {
    theme: 'light' | 'dark';
    setDarkMode: (darkMode: boolean) => void;
    onMobile: boolean;
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
   
    const setDarkMode = (enabled: boolean) => {
        if (enabled) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        setTheme(enabled ? 'dark' : 'light');
        localStorage.setItem('theme', enabled ? 'dark' : 'light');
    }
   
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
      
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    React.useEffect(() => {

    }, []);
    return (
        <GlobalContext.Provider value={{ theme, setDarkMode, onMobile }}>
            {children}
        </GlobalContext.Provider>
    );
};