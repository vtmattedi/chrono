import React, { useEffect } from 'react';
import { useTimer, type Team } from '../Providers/Timer.tsx';
import { Card } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { RotateCcw, Settings, PlusCircle, Download } from 'lucide-react';


import { useNavigate } from 'react-router';
import { useAlert } from '@/Providers/Alerts.tsx';
import TeamCards from '@/components/TeamCards.tsx';
import { AllButtons } from '@/components/btns.tsx';
import { useGlobals } from '@/Providers/Globals.tsx';
const Chrono: React.FC = () => {
    const { teams, setTeams, exportCSV, applyAction } = useTimer();

    const { showAlert, useToast } = useAlert();
    const navigate = useNavigate();
    const { startTicker, stopTicker } = useTimer();
    const { onMobile } = useGlobals();
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

                // setValues(_teams.map(() => "05:00"));
            }
        }
        const params = new URLSearchParams(window.location.search);
        startTicker();
        if (params.get('start') === 'true') {
            action('start', teams.map((_, i) => i));
        }

        return () => {
            stopTicker();
        }
    }, []);
    const action = (act: string, index: number[]) => {
        applyAction(act, index);
    }
    return (
        <div className='h-full flex flex-col items-center justify-start  w-screen p-4 font-inter'>
            <Card className='items-center gap-1 p-2'>
                <div className='flex w-full justify-between items-end text-2xl px-2 gap-2'
                style={{
                    flexDirection:onMobile ? 'column' : 'row',
                    alignItems: onMobile ? 'center' : 'flex-end',
                }}>

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
                        }} className=''><PlusCircle /> New Teams</Button>
                        <Button variant="outline" size="sm" onClick={() => {
                            exportCSV();
                        }}>
                            <Download /> Export csv
                        </Button>
                    </div>
                </div>
                    <AllButtons onAction={(name) => {
                        if (name === 'rearm') {
                            showAlert(
                                <div className='flex items-center gap-2'><RotateCcw color='#00458D' /><span> Reset all timers?</span></div>,
                                <span>This action cannot be undone. All timers will be reset to their initial values.</span>,
                                (result: boolean) => {
                                    if (result) {
                                        action(name, teams.map((_, i) => i))
                                    }
                                }
                            );
                            return;
                        }
                        action(name, teams.map((_, i) => i))
                    }} states={[...teams.map((team) => team.state)]}
                        className=' flex flex-row gap-2 flex-wrap justify-center mt-1'
                    />

            </Card>
            <div className='flex flex-row flex-wrap justify-center'>
                <TeamCards onAction={(name, index) => {
                    action(name, index);
                }} />
            </div>
        </div>
    );
};

export default Chrono;