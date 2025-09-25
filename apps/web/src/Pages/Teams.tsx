import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { type Team, useTimer } from '../Providers/Timer.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { useGlobals } from '@/Providers/Globals.tsx';
import { useAlert } from '@/Providers/Alerts.tsx';
import { BASE_URL } from '@/Providers/Urls.tsx';
const MAXTEAMS = 20;
const Teams: React.FC = () => {
    const [teams, setTeams] = React.useState<Team[]>(Array.from({ length: MAXTEAMS }, () => ({ name: '', baseTime: 0, state: 'ready', timeLeft: 0 })));
    const [numberOfTeams, setNumberOfTeams] = React.useState(5);
    const [timeInput, setTimeInput] = React.useState('00:30:00');
    const { token } = useGlobals();
    const Navigate = useNavigate();
    const { setTeams: setGlobalTeams } = useTimer();
    const { useToast } = useAlert();
    const updateSavedConfig = (part: 'time' | 'team' | 'numberOfTeams') => {
        const savedConfig = localStorage.getItem('savedConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            switch (part) {
                case 'time':
                    config.time = timeInput;
                    break;
                case 'team':
                    config.team = teams;
                    break;
                case 'numberOfTeams':
                    config.numberOfTeams = numberOfTeams;
                    break;
            }
            localStorage.setItem('savedConfig', JSON.stringify(config));
        }
        else {
            localStorage.setItem('savedConfig', JSON.stringify({ time: timeInput, team: teams, numberOfTeams: numberOfTeams }));
        }
    }

    useEffect(() => {
        const savedConfig = localStorage.getItem('savedConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            console.log('Loaded saved config:', config);
            if (config.team && Array.isArray(config.team)) {
                setTeams(config.team);
            }
            if (config.time) {
                setTimeInput(config.time);
            }
            if (config.numberOfTeams) {
                setNumberOfTeams(config.numberOfTeams);
            }
        }
    }, []);
    useEffect(() => {
        updateSavedConfig('team');
    }, [teams]);
    useEffect(() => {
        updateSavedConfig('numberOfTeams');
    }, [numberOfTeams]);
    useEffect(() => {
        updateSavedConfig('time');
    }, [timeInput]);


    const configureAndSetTeams = (): Team[] => {
        const t = teams;
        for (let i = 0; i < t.length; i++) {
            if (!t[i].name || t[i].name.trim() === '') {
                t[i].name = `Equipe ${i + 1}`;
            }
            t[i].baseTime = timeInput.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
        }
        const newTeams = teams.slice(0, numberOfTeams);
        console.log('Configured teams:', newTeams);
        setGlobalTeams(newTeams);
        return newTeams;
    }
    return (
        <div className='min-h-screen flex flex-col items-center justify-start  w-screen p-4 font-inter'>
            <Card className='p-4 mt-4 w-full max-w-4xl items-center'>
                <img className='w-32' src="/logo-nobg.png" alt="Team" />
                <div className='flex gap-8  w-full justify-center items-center'>
                    <div className='flex gap-2 items-center text-xl'>
                        <span className='font-lato'> Número de equipes: </span>
                        <Input type="number" value={numberOfTeams}
                            onChange={(e) => setNumberOfTeams(parseInt(e.target.value))}
                            onBlur={(e) => {
                                let val = parseInt(e.target.value);
                                if (isNaN(val) || val < 1) val = 1;
                                if (val > MAXTEAMS) val = MAXTEAMS;
                                setNumberOfTeams(val);
                            }}
                            className='w-20'
                            min={1} max={MAXTEAMS} step={1}
                        />
                    </div>
                    <div className='flex gap-2 items-center text-xl'>
                        <span className='font-lato'> Tempo Inicial: </span>
                        <Input type="time" value={timeInput} step={1}
                            className='w-32 text-xl'
                            onChange={(e) => setTimeInput(e.target.value)}
                        />
                    </div>
                </div>
                <div className='flex flex-row gap-4 justify-center items-center'>
                    <div className='flex flex-row items-center gap-2 bg-gray-400 dark:bg-gray-800 p-2 rounded-md'>
                        <Switch className="" id="countdowntoggle" />
                        <label htmlFor="countdowntoggle" className="ml-2">Start countdown automatically</label>
                    </div>
                    <Button className=' bg-[#4C6F50] text-white hover:bg-[#3e5c40] w-32 text-xl justify-center items-center'
                        onClick={() => {
                            configureAndSetTeams();
                            useToast('success', 'Equipes configuradas!');
                            const start = (document.getElementById('countdowntoggle') as HTMLButtonElement).ariaChecked;
                            Navigate('/chrono' + (start === 'true' ? '?start=true' : ''));
                        }}
                    >Start <ArrowRight /></Button>
                </div>
                <Card className='flex flex-col gap-2 w-[80%] max-h-[60vh] overflow-y-auto p-4' >
                    {
                        Array.from({ length: numberOfTeams }, (_, i) => i + 1).map((teamNumber) => (
                            <Card key={teamNumber} className='p-2'>
                                <div className='flex gap-4 items-center font-lato  text-lg px-2'>
                                    <span className='w-32'>Equipe {teamNumber}:</span>
                                    <Input type="text" placeholder={`Nome da equipe ${teamNumber}`}
                                        value={teams[teamNumber - 1]?.name || ''}
                                        onChange={(e) => {
                                            const newTeams = [...teams];
                                            newTeams[teamNumber - 1] = {
                                                ...newTeams[teamNumber - 1],
                                                name: e.target.value
                                            };
                                            setTeams(newTeams);
                                        }}
                                        className=''
                                    />
                                </div>
                            </Card>
                        ))}
                </Card>

            </Card>
            <Button className='mt-4 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-black dark:text-white'
                disabled={!token}
                onClick={() => {
                    const t = configureAndSetTeams();
                    const baseTime = t[0]?.baseTime || 0;
                    console.log('Creating session with with token:', token);
                    fetch(BASE_URL + '/api/newsession', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            teams: t.map(t => t.name),
                            initialTime: baseTime,
                        }),
                    }).then(res => res.json()).then(data => {
                        console.log('Created session:', data);
                        Navigate('/session?sessionId=' + data.sessionId);
                    }).catch(err => {
                        console.error('Error creating session:', err);
                        useToast('error', 'Error creating session: ' + err.message);
                    });
                }}>
                create session
                <ArrowRight className='ml-2' />

            </Button>
        </div>
    );
};

export default Teams;