import React, { useEffect } from 'react';
import { useTimer, type SpeedType, type Team } from '../Providers/Timer.tsx';
import { Card } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Plus, Minus, RotateCcw, Settings, PlusCircle, Download } from 'lucide-react';
import { PlayBtn, PauseBtn, StopBtn, SpeedControl } from '../components/btns.tsx';


import { useNavigate } from 'react-router';
import { Input } from '@/components/ui/input.tsx';
import { useAlert } from '@/Providers/Alerts.tsx';
import TeamCards from '@/components/TeamCards.tsx';

const Chrono: React.FC = () => {
    const { teams, startChrono, pauseChrono, finishChrono, addTime, rearmChrono, setTeams, setSpeed } = useTimer();
    const [values, setValues] = React.useState<string[]>(teams.map(() => '05:00'));
    const { showAlert, useToast } = useAlert();
    const navigate = useNavigate();
    const { startTicker, stopTicker } = useTimer();
    useEffect(() => {
        if (teams.length === 0) {
            const savedConfig = localStorage.getItem('savedConfig');
            if (!savedConfig) {
                useToast('error', 'No teams configured. Redirecting to setup page.');
                navigate('/');
            }
            else {
                const config = JSON.parse(savedConfig) as { team: Team[]; numberOfTeams: number; time: string };
                console.log('Loaded saved config:', config);
                const t = config.team;
                for (let i = 0; i < t.length; i++) {
                    if (!t[i].name || t[i].name.trim() === '') {
                        t[i].name = `Equipe ${i + 1}`;
                    }
                    t[i].baseTime = config.time.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
                }
                const _teams = t.slice(0, config.numberOfTeams)
                console.log('Setting teams from saved config:', _teams, t, config.numberOfTeams);
                setTeams(_teams);
                
                setValues(_teams.map(() => "05:00"));
            }
        }
        const params = new URLSearchParams(window.location.search);
        startTicker();
        if (params.get('start') === 'true') {
            startChrono(teams.map((_, i) => i));
        }

        return () => {
            stopTicker();
        }
    }, []);
    const maxName = (name: string) => {
        if (name.length > 18) {
            return name.slice(0, 15) + '...';
        }
        return name;
    }

    return (
        <div className='h-full flex flex-col items-center justify-start  w-screen p-4 font-inter'>
            <Card className='items-center gap-1 p-2'>
                <div className='flex w-full justify-between items-end text-2xl px-2 gap-2'>
                    {/* <img src="/logo-nobg.png" alt="Logo" className="h-8 " /> */}
                    <span className='text-2xl font-audiowide'>Global Controls</span>
                    <div className='flex gap-2 items-center'>
                        <Button variant="outline" size="sm" onClick={() => {
                            showAlert(
                                <div className='flex items-center gap-2'><Settings color='#908101ff' /><span> Configure new teams?</span></div>,
                                <span>This will erase current teams and their progress. Are you sure?</span>,
                                (result: boolean) => {
                                    if (result) {
                                        navigate('/');
                                    }
                                }
                            );
                        }} className='mb-1'><PlusCircle /> New Teams</Button>
                        <Button variant="outline" size="sm" onClick={() => {
                            const csvContent = "data:text/csv;charset=utf-8," +
                                ['Team Name,State,Base Time,Time Left,Time Running,Time Paused,Total Time,Time Added,Time Subtracted,Speed']
                                    .concat(teams.map(team => {
                                        return [
                                            `"${team.name.replace(/"/g, '""')}"`,
                                            team.state,
                                            new Date(team.baseTime * 1000).toISOString().slice(11, 19),
                                            new Date(team.timeLeft * 1000).toISOString().slice(11, 19),
                                            new Date((team.timeRunning || 0) * 1000).toISOString().slice(11, 19),
                                            new Date((team.timePaused || 0) * 1000).toISOString().slice(11, 19),
                                            new Date(((team.timeRunning || 0) + (team.timePaused || 0)) * 1000).toISOString().slice(11, 19),
                                            new Date((team.timeAdded || 0) * 1000).toISOString().slice(11, 19),
                                            new Date((team.timeSubtracted || 0) * 1000).toISOString().slice(11, 19),
                                            team.speed || 1
                                        ].join(',');
                                    })).join('\n');
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", `mw_chrono_${new Date().toISOString().slice(0, 10)}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}>
                            <Download /> Export csv
                        </Button>
                    </div>
                </div>
                <div className=' flex flex-row'>
                    <Button onClick={() => startChrono(teams.map((_, i) => i))} className='m-2 p-2 bg-green-500 text-white rounded'>Start All</Button>
                    <Button onClick={() => pauseChrono(teams.map((_, i) => i))} className='m-2 p-2 bg-yellow-500 text-white rounded'>Pause All</Button>
                    <Button onClick={() => finishChrono(teams.map((_, i) => i))} className='m-2 p-2 bg-red-500 text-white rounded'>Finish All</Button>
                    <Button onClick={() => {
                        showAlert(
                            <div className='flex items-center gap-2'><RotateCcw color='#00458D' /><span> Reset all timers?</span></div>,
                            <span>This action cannot be undone. All timers will be reset to their initial values.</span>,
                            (result: boolean) => {
                                if (result) {
                                    rearmChrono(teams.map((_, i) => i));
                                }
                            }
                        );
                    }} className='m-2 p-2 bg-blue-500 text-white rounded'><RotateCcw /> Restart All</Button>
                </div>
            </Card>
            <div className='flex flex-row flex-wrap justify-center'>
                <TeamCards onAction={(action, index) => {
                    if (action === 'start') startChrono(index);
                    else if (action === 'pause') pauseChrono(index);
                    else if (action === 'finish') finishChrono(index);
                    else if (action === 'rearm') rearmChrono(index);
                    else if (action.startsWith('add:')) {
                        const seconds = parseInt(action.split(':')[1]);
                        if (!seconds) return;
                        addTime(index, seconds);
                    }
                    else if (action.startsWith('speed:')) {
                        const speed = parseFloat(action.split(':')[1]);
                        setSpeed(index, speed as SpeedType);
                    }
                }} />
            </div>
        </div>
    );
};

export default Chrono;