import React from 'react';

import ThemeSelector from './ThemeSelector';
import confetti from 'canvas-confetti';
import { Timer } from 'lucide-react';
import { useGlobals } from '../Providers/Globals';
const Header: React.FC = () => {

    const { theme } = useGlobals();

    const fireConfetti = () => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        const randomInRange = (min: number, max: number) =>
            Math.random() * (max - min) + min;
        const interval = window.setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                return clearInterval(interval);
            }
            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            });
        }, 250);
    };

    return (
        <div
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 9999,
                backdropFilter: 'saturate(180%) blur(20px)',
            }}
            className="bg-[var(--header-bg)] w-full  flex justify-between items-center position-sticky top-0 z-999 shadow-md w-full h-[48px] px-4" >
            <div className="flex items-center">
                <img
                    src="/logo-nobg.png"
                    alt="Logo"
                    className="h-8 ml-4 cursor-pointer"
                    onClick={fireConfetti}
                />
                <img src="https://simpleicons.org/icons/github.svg" alt="GitHub Logo" className="h-8 ml-4 cursor-pointer hover:opacity-70"
                    style={{
                        filter: theme === 'dark' ? 'invert(1)' : 'none',
                    }}
                    onClick={() => window.open('https://github.com/vtmattedi', '_blank')}
                />
                <img src="https://icons.getbootstrap.com/assets/icons/linkedin.svg" alt="LinkedIn Logo" className="h-8 ml-4 cursor-pointer hover:opacity-70"
                    onClick={() => window.open('https://www.linkedin.com/in/vitor-mattedi-dev/', '_blank')}
                    style={{
                        filter: theme === 'dark' ? 'invert(1)' : 'none',
                    }}
                />
            </div>
            {
                <div className='flex gap-1'
                    style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        alignItems: 'flex-end',
                    }}
                >
                    <span className='font-audiowide text-2xl flex gap-1'> <Timer/> ChronoApp</span>
                    <i className='font-lato text-sm'>by mattediworks &copy;</i>
                </div>
            }
            <ThemeSelector />
        </div>
    );
};

export default Header;