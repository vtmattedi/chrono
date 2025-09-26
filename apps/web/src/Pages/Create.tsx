import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight, Info, Loader2, MoveLeft, User, UsersRound } from 'lucide-react';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { type Team, useTimer } from '../Providers/Timer.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { useGlobals } from '@/Providers/Globals.tsx';
import { useAlert } from '@/Providers/Alerts.tsx';
import { BASE_URL } from '@/Providers/Urls.tsx';
import { useLocation } from 'react-router';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ScrollArea } from "@/components/ui/scroll-area"
const MAXTEAMS = 20;
const CreateChrono: React.FC = () => {
    const [teams, setTeams] = React.useState<Team[]>(Array.from({ length: MAXTEAMS }, () => ({ name: '', baseTime: 0, state: 'ready', timeLeft: 0 })));
    const [numberOfTeams, setNumberOfTeams] = React.useState(5);
    const [type, setType] = React.useState<'local' | 'session'>('session');
    const [timeInput, setTimeInput] = React.useState('00:30:00');
    const [starting, setStarting] = React.useState(false);
    const [toggleCountdown, setToggleCountdown] = React.useState(false);
    const [everyoneAdmin, setEveryoneAdmin] = React.useState(false);
    const { onMobile, token, theme, invalidateToken } = useGlobals();
    const Navigate = useNavigate();
    const { setTeams: setGlobalTeams } = useTimer();
    const { useToast } = useAlert();
    const location = useLocation();
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

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        console.log('Location changed:', params);
        const isLocal = params.get('local') !== null;
        if (isLocal) {
            setType('local');
        }
    }, [location]);

    const startEvent = (mode: boolean) => {
        // mode = true means local, false means session
        setStarting(true);
        const t = configureAndSetTeams();
        if (mode) {
            useToast('success', 'Equipes configuradas!');
            Navigate('/chrono' + (toggleCountdown ? '?start=true' : ''));
        } else {
            const baseTime = t[0]?.baseTime || 0;
            fetch(BASE_URL + '/api/newsession', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    teams: t.map(t => t.name),
                    initialTime: baseTime,
                    start: toggleCountdown,
                    isPublic: everyoneAdmin,
                }),
            }).then(res => {
                if (!res.ok) {
                    useToast('error', 'Failed to create session ');
                    if (res.status === 401) {
                       invalidateToken();
                    }
                }
                else {
                    res.json().then(data => {
                        console.log('Created session:', data);
                        Navigate('/session?sessionId=' + data.sessionId);
                    });
                }
            }).catch(err => {
                console.error('Error creating session:', err);
                useToast('error', 'Failed to create session ');

            }).finally(() => { setStarting(false); });
        }
    };
    const infoCardStyle = 'flex flex-col items-start gap-2 text-white dark:text-gray-100 bg-[#252e7a] dark:bg-gray-800 p-2 rounded-md  w-[80%] mt-2'
    return (
        <div className='h-[calc(100vh-48px)] flex flex-col items-center justify-start  w-screen py-4 px-1 font-inter overflow-auto'>
            <Card className='py-4 px-1 mt-2 w-full max-w-4xl items-center h-full overflow-auto gap-0 bg-black'
                style={{
                    background: theme === 'dark' ? undefined :
                        'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(220,220,220,1) 100%)',
                }}
            ><div className='flex w-full justify-center items-center gap-4'>
                <Button variant="outline" size="sm" onClick={() => {
                    Navigate(-1);
                }} className='mb-1'>
                    <MoveLeft className='inline mr-2' />
                </Button>
                <h1 className='text-3xl font-audiowide'>Configure Teams</h1>
            </div>
                <div className='flex gap-4 justify-center items-center w-full mt-2'>
                    Type:
                    <ToggleGroup type="single" className="border bg-gray-300 dark:bg-(--background)" aria-label="Theme Toggle"
                        value={type}
                        onValueChange={(value) => {
                            if (value === 'local' || value === 'session') {
                                setType(value);
                            }
                        }}>
                        <ToggleGroupItem value="local" className='hover:cursor-pointer'
                        ><User />Local</ToggleGroupItem>
                        <ToggleGroupItem value="session" className='hover:cursor-pointer'
                        > Session <UsersRound /> </ToggleGroupItem>
                    </ToggleGroup>
                </div>
                {type === 'local' && (
                    <div className={infoCardStyle}
                        style={{
                            width: onMobile ? '95%' : '80%',
                        }}
                    >
                        <div className='flex items-center gap-2 text-[0.875rem]'><Info className='inline ' />Local Mode</div>
                        <span className='text-sm text-justify'>The timer will be managed locally and no session will be created on the server. This means that the it will keep working even without internet connection and that closing this tab will kill the timer.</span>
                    </div>
                )}
                {(type === 'session' && everyoneAdmin) && (
                    <div className={infoCardStyle}
                        style={{
                            width: onMobile ? '95%' : '80%',
                        }}
                    >
                        <div className='flex items-center gap-2 text-[0.875rem]'><Info className='inline ' />Session mode admins</div>
                        <span className='text-sm text-justify'>If enabled, all participants will be granted admin privileges. Only admins are allowed to start, pause, stop timers and add/subtract time to/from the teams.</span>
                    </div>
                )}
                <div className='flex flex-row gap-4 justify-center  mt-1'
                    style={{
                        flexDirection: onMobile ? 'column' : 'row',
                        alignItems: onMobile ? 'center' : 'end',
                    }}>
                    <div className='flex flex-col items-start gap-1'>
                        <div className='flex flex-row items-center gap-2 bg-gray-400 dark:bg-gray-800 p-2 rounded-md'>
                            <Switch className="" id="countdowntoggle"  checked={toggleCountdown} onCheckedChange={setToggleCountdown} />
                            <label htmlFor="countdowntoggle" className="ml-2">Start countdown automatically</label>
                        </div>
                        {type == 'session' && (<div className='flex flex-row items-center gap-2 bg-gray-400 dark:bg-gray-800 p-2 rounded-md'>
                            <Switch className="" id="everyoneadmin" checked={everyoneAdmin} onCheckedChange={setEveryoneAdmin} />
                            <label htmlFor="everyoneadmin" className="ml-2">Allow everyone as admin</label>
                        </div>)
                        }
                    </div>
                    <Button className=' bg-[#006317] text-white hover:bg-[#3e5c40] w-32 text-xl justify-center items-center h-10'
                        onClick={() => { startEvent(type === 'local'); }}
                        disabled={starting}
                    >{starting ? <>Starting <Loader2 className='inline animate-spin' /></> : <>Start <ArrowRight className='inline' /></>}
                    </Button>
                </div>
                <div className='flex w-full justify-center items-center mt-2 mb-1'
                    style={{
                        flexDirection: onMobile ? 'column' : 'row',
                        gap: onMobile ? '8px' : '32px'
                    }}
                >
                    <div className='flex gap-2 items-center text-xl'
                        style={{
                            justifyContent: onMobile ? 'space-between' : 'center',
                            width: onMobile ? '80%' : 'auto'
                        }}
                    >
                        <span className='font-lato'>Teams: </span>
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
                    <div className='flex  items-center text-xl'
                        style={{
                            justifyContent: onMobile ? 'space-between' : 'center',
                            width: onMobile ? '80%' : 'auto',
                            gap: onMobile ? undefined : '10px'
                        }}
                    >
                        <span className='font-lato'> Base Time: </span>
                        <Input type="time" value={timeInput} step={1}
                            className={'w-32'}
                            onChange={(e) => setTimeInput(e.target.value)}
                        />
                    </div>
                </div>
                <hr className='text-gray-300 w-full mt-0' />
                <ScrollArea className='flex flex-col gap-4  w-full h-full max-h-[50vh] mt-1 '
                    style={{ width: onMobile ? '100%' : '80%' }}
                >
                    <div className='flex flex-col gap-1 w-full h-full'>
                        {
                            Array.from({ length: numberOfTeams }, (_, i) => i + 1).map((teamNumber) => (
                                <Card key={teamNumber} className='p-2'>
                                    <div className='flex gap-4 items-center font-lato  text-lg px-2'>
                                        <span className='w-32'>Team {teamNumber}:</span>
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
                    </div>
                </ScrollArea>
            </Card>
            {/* <Button className='mt-4 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-black dark:text-white'
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

            </Button> */}
        </div>
    );
};

export default CreateChrono;