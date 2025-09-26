import React from 'react';
import { useTimer } from '../Providers/Timer.tsx';
import { Card } from '@/components/ui/card.tsx';
import { useNavigate, useLocation } from 'react-router';
import { useSocket } from '@/Providers/Socket.tsx';
import { useGlobals } from '@/Providers/Globals.tsx';
import TeamCards from '@/components/TeamCards.tsx';
import { useAlert } from '@/Providers/Alerts.tsx';
import { ArrowLeftToLine, Copy, Download, RotateCcw, ShieldClose, Squircle } from 'lucide-react';
import { toast } from 'sonner';
import { AllButtons } from '@/components/btns.tsx';
import { Button } from '@/components/ui/button.tsx';
import { BASE_URL } from '@/Providers/Urls.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';


const ChronoSession: React.FC = () => {
    const { teams, exportCSV } = useTimer();
    const { token, onMobile } = useGlobals();
    const { useToast, showAlert } = useAlert();
    const [sessionId, setSessionId] = React.useState<string>('');
    const navigate = useNavigate();
    const location = useLocation();
    // const stage = 0; // 1: joining, 2: joined, 3: loading teams, 4: in session
    const { joinSession, leaveSession, state, sendAction, stage, userCount, adminRole, latency } = useSocket();

    React.useEffect(() => {
        // Joining the session from the URL
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('sessionId');
        console.log(params)
        if (!sessionId) {
            navigate('/');
            return;
        }
        joinSession(sessionId, (message) => {
            useToast('error', 'Failed to join session ' + sessionId + ": " + message);
        });
        setSessionId(sessionId);
        return () => {
            leaveSession();
        };
    }, [location, token]);
    // useEffect(() => {
    //     console.log(teams)
    // }, [teams]);




    const stages = ['Connecting to server...', 'Verifying Identity...', 'Joining session...', 'Loading teams...', 'In session'];
    const failedStages = ['Session Ended', 'Joining session failed', 'Connection Failed'];
    return (
        <div className='h-full flex flex-col items-center justify-start  w-screen p-2 font-inter overflow-x-hidden'>
            <Card className={`w-full flex  p-4 ${onMobile ? 'max-w-[95%]' : 'max-w-[41rem]'}`}>
                <div className='flex justify-between items-start'>
                    <div className='flex  flex-row items-center gap-x-4'
                        style={{ flexDirection: onMobile ? 'column' : 'row' }}>
                        <span className='text-4xl font-audiowide'>Session ID:</span>
                        <div className='flex items-center gap-x-2'>
                            <div className='flex items-center gap-2 text-xl font-inter  bg-gray-100 dark:bg-gray-800 rounded-md px-2 py-1 justify-center'>
                                <span className='font-inter ml-2'>{sessionId} </span>
                                <Copy className='ml-2 cursor-pointer hover:text-gray-500'
                                    onClick={() => {
                                        navigator.clipboard.writeText(sessionId);
                                        toast.message('Session ID copied to clipboard', {
                                            position: 'top-center',
                                        });
                                    }}
                                />
                            </div>
                            <Button variant={'outline'} className='' onClick={() => { exportCSV() }}>Export <Download /></Button>
                        </div>
                    </div>
                    <div
                        className='flex flex-col items-end text-sm '
                    ><Squircle
                            className={state ? 'animate-pulse' : ''}
                            color={state ? 'green' : 'red'}
                            fill={state ? 'green' : 'red'}
                        />
                        {state && <span>{(latency || 0).toFixed(0)}ms</span>}
                    </div>

                </div>
                {
                    stage === 4 && (
                        <>
                            <div className='flex justify-between items-center'>
                                <div className='flex items-center gap-2'
                                    style={{
                                        flexDirection: onMobile ? 'column' : 'row',
                                        gap: onMobile ? '0' : '0.5rem',
                                        alignItems: onMobile ? 'flex-start' : 'center',
                                    }}>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={'outline'}>{adminRole ? 'Admin' : 'Viewing'}</Button>
                                        </PopoverTrigger>
                                        <PopoverContent className='w-48 p-2 gap-4 '>
                                            <div className='text-sm flex flex-col gap-2'>
                                                <span className='font-lato text-lg'>Actions</span>

                                                <hr />
                                                <Button className=' bg-red-700 hover:bg-red-400 text-white ' onClick={() => {
                                                    leaveSession();
                                                    navigate('/');
                                                }}><ArrowLeftToLine /> Leave Session</Button>
                                                {
                                                    adminRole && <Button
                                                        className=' bg-red-700 hover:bg-red-400 text-white '
                                                        onClick={() => {
                                                            showAlert(
                                                                <div className='flex items-center gap-2'><Squircle color='red' fill='red' /><span> <i>Kill session {sessionId} ?</i></span></div>,
                                                                <span>This will disconnect all users, stop all timers and <strong>cannot</strong> be undone. Are you sure?</span>,
                                                                (result: boolean) => {
                                                                    if (result) {
                                                                        fetch(`${BASE_URL}/api/killsession`, {
                                                                            method: 'POST',
                                                                            headers: {
                                                                                'Content-Type': 'application/json',
                                                                                'Authorization': `Bearer ${token}`
                                                                            },
                                                                            body: JSON.stringify({ sessionId })
                                                                        }).then(res => res.json()).then(data => {
                                                                            if (data.result) {
                                                                                useToast('success', `Session ${sessionId} killed successfully`);
                                                                                navigate('/');
                                                                            }
                                                                            if (!data.result) {
                                                                                useToast('error', 'Failed to kill session ' + sessionId + ': ' + data.message);
                                                                            }
                                                                        }).catch(err => {
                                                                            console.error(err);
                                                                            useToast('error', 'Failed to kill session ' + sessionId);
                                                                        });
                                                                    }
                                                                }
                                                            );
                                                        }}
                                                    ><ShieldClose /> Kill Session</Button>
                                                }
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <div className='text-sm text-gray-500'><i> you are {adminRole ? '' : 'not'} allowed to control the chronos</i></div>
                                </div>
                                <div className='flex items-center gap-2  border rounded-[50%] w-8 h-8 justify-center border-green-500/50'>
                                    <div className='text-sm font-inter'>{userCount}</div>
                                </div>
                            </div>

                        </>
                    )
                }
                <div className='flex'>
                    {/* <Button>Start All</Button>
                    <Button className='ml-2'>Pause All</Button>
                    <Button className='ml-2'>Finish All</Button>
                    <Button className='ml-2'>Restart All</Button> */}
                    <AllButtons className='flex gap-2 flex-wrap justify-center' onAction={(action) => {
                        if (action === 'rearm') {
                            showAlert(
                                <div className='flex items-center gap-2'><RotateCcw className='rotate-275' /><span> Reset all chronos?</span></div>,
                                <span>This will reset all chronos to their base time and it <strong>cannot</strong> be undone. Are you sure?</span>,
                                (result: boolean) => {
                                    if (result) {
                                        sendAction(action, teams.map((_, i) => i));
                                    }
                                }
                            );
                            return;

                        }
                        sendAction(action, teams.map((_, i) => i));
                    }}
                        states={[...teams.map(t => t.state)]}
                    />
                </div>
            </Card>
            {
                stage < 0 && (
                    <Card className='m-4 p-4 flex flex-col items-center gap-2 w-full max-w-[41rem]'>
                        <div className='text-2xl font-lato'>{failedStages[3 + stage]}</div>
                        {stage === -2 && <div className='text-gray-500'><i>session <strong>{sessionId}</strong> does not exist</i></div>}
                        <div className='flex gap-2'> <Button className='bg-red-500 text-white' onClick={() => {
                            navigate('/');
                        }}>Leave Session</Button>
                            {stage === -1 && <Button className='bg-blue-500 text-white' onClick={() => {
                                joinSession(sessionId, (error) => {
                                    useToast('error', 'Failed to join session: ' + error);
                                });
                            }}>Retry Joining Session</Button>}
                        </div>
                    </Card>
                )
            }
            {
                (stage !== 4 && stage >= 0) && (
                    <Card className='m-4 p-4 flex flex-col items-center gap-4 w-full max-w-[41rem]'>
                        <div className='text-2xl font-lato'>{stages[stage]}</div>
                        <div className='w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin' />
                    </Card>
                )
            }
            {

                stage === 4 && (
                    <TeamCards onAction={(action, index) => {
                        sendAction(action, index);
                    }} className='mt-4' />
                )
            }

        </div>
    );
};

export default ChronoSession;