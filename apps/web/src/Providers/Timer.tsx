import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

export type TeamState = 'running' | 'paused' | 'finished';

export type Team = {
    name: string;
    baseTime: number; // in seconds
    timeLeft: number; // in seconds
    timePaused?: number; // in seconds
    timeRunning?: number; // in seconds
    state: TeamState;
    startTime?: Date;
    finishTime?: Date;
}

type TimerContextType = {
    teams: Team[];
    setTeams: (newTeams: Team[], store?: boolean) => void;
    startChrono: (index: number[]) => void;
    pauseChrono: (index: number[]) => void;
    unpauseChrono: (index: number[]) => void;
    finishChrono: (index: number[]) => void;
    rearmChrono: (index: number[]) => void;
    addTime: (index: number[], seconds: number) => void;
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider = ({ children }: { children: ReactNode }) => {
    const [teams, _setTeams] = useState<Team[]>([]);
    const [avg, setAvg] = useState<any>({ sum: 0, count: 0 });
    const lastTick = React.useRef(0);
    const setTeams = (newTeams: Team[], store: boolean = false) => {
        _setTeams(newTeams);
        console.log('Setting teams', newTeams);
        if (store) {
            localStorage.setItem('teams', JSON.stringify(newTeams));
        }
    }
    const startChrono = (index: number[]) => {
        const t = teams;
        for (const i of index) {
            if (t[i].state === 'paused' && t[i].baseTime > 0) {
                t[i].startTime = new Date();
                t[i].timeLeft = t[i].timeLeft || t[i].baseTime;
                t[i].state = 'running';
            }
        }
        _setTeams([...t]);
    }
    const unpauseChrono = (index: number[]) => {
        const t = teams;
        for (const i of index) {
            if (t[i].state === 'paused' && t[i].baseTime > 0) {
                t[i].state = 'running';
            }
        }
    }
    const pauseChrono = (index: number[]) => {
        const t = teams;
        for (const i of index) {
            if (t[i].state === 'running') {
                t[i].state = 'paused';
            }
        }
        _setTeams([...t]);
    }
    const finishChrono = (index: number[]) => {
        const t = teams;
        for (const i of index) {
            if (t[i].state !== 'finished') {
                t[i].state = 'finished';
                t[i].finishTime = new Date();
            }
        }
        _setTeams([...t]);
    }
    const addTime = (index: number[], seconds: number) => {
        const t = teams;
        for (const i of index) {
            t[i].timeLeft += seconds;
            if (t[i].timeLeft < 0) t[i].timeLeft = 0;
        }
        _setTeams([...t]);
    }
    const rearmChrono = (index: number[]) => {
        const t = teams;
        for (const i of index) {
            if (t[i].state === 'finished') {
                t[i].state = 'paused';
                t[i].timeLeft = t[i].baseTime;
                t[i].timeRunning = 0;
                t[i].timePaused = 0;
                t[i].startTime = undefined;
                t[i].finishTime = undefined;
            }
        }
    }
    React.useEffect(() => {
        const interval = setInterval(() => {
            if (Date.now() - lastTick.current < 998) {
                return;
            }
            if (lastTick.current === 0) {
                lastTick.current = Date.now();
                return;
            }
            lastTick.current = Date.now();
            const t = teams;
            let updated = false;
            for (let i = 0; i < t.length; i++) {
                const cont = t[i];
                if (cont.state === 'running' && cont.timeLeft > 0) {
                    cont.timeLeft -= 1;
                    cont.timeRunning = (cont.timeRunning || 0) + 1;
                    updated = true;
                }
                if (cont.state === 'paused' && cont.timeLeft > 0) {
                    cont.timePaused = (cont.timePaused || 0) + 1;
                    updated = true;
                }
                if (cont.state === 'running' && cont.timeLeft === 0) {
                    cont.state = 'finished';
                    cont.finishTime = new Date();
                    updated = true;
                    toast.success(`Team ${cont.name} has finished!`, {
                        duration: 4000,
                        position: 'top-center',
                    });
                }
            }
            if (updated) {
                _setTeams([...t]);
            }
        }, 5);
        return () => clearInterval(interval);
    }, [teams, avg]);
    return (
        <TimerContext.Provider value={{ teams, rearmChrono, setTeams, startChrono, pauseChrono, finishChrono, addTime, unpauseChrono }}>
            {children}
        </TimerContext.Provider>
    );
};

export const useTimer = () => {
    const context = useContext(TimerContext);

    if (!context) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
};