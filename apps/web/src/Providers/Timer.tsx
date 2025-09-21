import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

export type TeamState = 'running' | 'paused' | 'finished' | 'ready';
export type SpeedType = 0.5 | 1 | 2 | 4;
export type Team = {
    name: string;
    baseTime: number; // in seconds
    timeLeft: number; // in seconds
    timePaused?: number; // in seconds
    timeRunning?: number; // in seconds
    state: TeamState;
    startTime?: Date;
    timeAdded?: number; // in seconds
    timeSubtracted?: number; // in seconds
    finishTime?: Date;
    speed?: SpeedType; // speed multiplier (1x, 2x, etc.)
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
    setSpeed: (index: number[], speed: SpeedType) => void;
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider = ({ children }: { children: ReactNode }) => {
    const [teams, _setTeams] = useState<Team[]>([]);
    const lastTick = React.useRef({ tickNum: 0, time: Date.now() });
    const setTeams = (newTeams: Team[]) => {
        console.log('Setting teams:', newTeams);
        const _teams = newTeams.map(team => {
            team.state = 'ready';
            team.timeLeft = team.baseTime;
            team.speed = 1;
            return team;
        });
        _setTeams(_teams);
    }
    const startChrono = (index: number[]) => {
        const t = teams;
        for (const i of index) {
            if (t[i].state === 'paused' && t[i].baseTime > 0) {
                t[i].state = 'running';
            }
            else if (t[i].state === 'ready' && t[i].baseTime > 0) {
                t[i].startTime = new Date();
                t[i].timeLeft = t[i].baseTime;
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
        _setTeams([...t]);
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
            toast.success(`Team ${t[i].name} has finished!`, {
                duration: 4000,
                position: 'top-center',
            });
        }
        _setTeams([...t]);
    }
    const addTime = (index: number[], seconds: number) => {
        const t = teams;
        for (const i of index) {
            const old = t[i].timeLeft || 0;
            t[i].timeLeft += seconds;
            if (t[i].timeLeft < 0) t[i].timeLeft = 0;
            if (t[i].timeLeft <= 0) {
                finishChrono([i]);
            }
            if (seconds > 0) {
                t[i].timeAdded = t[i].timeLeft - old + (t[i].timeAdded || 0);
            }
            else {
                t[i].timeSubtracted = (t[i].timeSubtracted || 0) - (t[i].timeLeft - old);
            }
        }
        _setTeams([...t]);
    }
    const rearmChrono = (index: number[]) => {
        const t = teams;
        for (const i of index) {
            t[i].state = 'ready';
            t[i].timeLeft = t[i].baseTime;
            t[i].timeRunning = 0;
            t[i].timePaused = 0;
            t[i].startTime = undefined;
            t[i].finishTime = undefined;
            t[i].timeAdded = 0;
            t[i].timeSubtracted = 0;
            t[i].speed = 1;
        }
        _setTeams([...t]);
    }
    const setSpeed = (index: number[], speed: SpeedType) => {
        const t = teams;
        for (const i of index) {
            t[i].speed = speed;
        }
        _setTeams([...t]);
    }

    React.useEffect(() => {
        const interval = setInterval(() => {
            if (Date.now() - lastTick.current.time < 248) {
                return;
            }
            // const delta = Date.now() - lastTick.current.time;
            lastTick.current = { tickNum: (lastTick.current.tickNum + 1) % 7, time: Date.now() };
            const t = teams;
            let updated = false;
            for (let i = 0; i < t.length; i++) {
                const cont = t[i];
                const mod = cont.speed === 0.5 ? 8 : cont.speed === 1 ? 4 : cont.speed === 2 ? 2 : cont.speed === 4 ? 1 : 0;
                if (lastTick.current.tickNum % mod !== 0) {
                    continue;
                }
                if (cont.state === 'running' && cont.timeLeft > 0) {
                    cont.timeLeft -= 1;
                    cont.timeRunning = (cont.timeRunning || 0) + 1 / cont.speed!;
                    updated = true;
                    // console.log('Tick', lastTick.current.tickNum, 'for team', cont.name, 'with speed', cont.speed, 'and mod', mod, delta, 1 / cont.speed!, cont.timeLeft);

                }
                if (cont.state === 'paused' && cont.timeLeft > 0) {
                    cont.timePaused = (cont.timePaused || 0) + 1 / cont.speed!;
                    updated = true;
                }
                if (cont.state === 'running' && cont.timeLeft <= 0) {
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
    }, [teams]);
    return (
        <TimerContext.Provider value={{ teams, rearmChrono, setTeams, startChrono, pauseChrono, finishChrono, addTime, unpauseChrono, setSpeed }}>
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