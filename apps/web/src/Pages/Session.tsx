import React from 'react';
import { useTimer } from '../Providers/Timer.tsx';
import { Card } from '@/components/ui/card.tsx';
import { useNavigate, useLocation } from 'react-router';
import { useSocket } from '@/Providers/Socket.tsx';
import { useGlobals } from '@/Providers/Globals.tsx';
import TeamCards from '@/components/TeamCards.tsx';
import { useAlert } from '@/Providers/Alerts.tsx';
import { ArrowLeftToLine, ChevronDown, ChevronUp, Copy, Download, RotateCcw, Scroll, Share2, ShieldClose, ShieldUser, Squircle, UserStar } from 'lucide-react';
import { toast } from 'sonner';
import { AllButtons } from '@/components/btns.tsx';
import { Button } from '@/components/ui/button.tsx';
import { BASE_URL } from '@/Providers/Urls.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { Badge } from '@/components/ui/badge.tsx';

const ChronoSession: React.FC = () => {
    const { teams, exportCSV } = useTimer();
    const { token, onMobile } = useGlobals();
    const { useToast, showAlert } = useAlert();
    const navigate = useNavigate();
    const location = useLocation();
    // const stage = 0; // 1: joining, 2: joined, 3: loading teams, 4: in session
    const { joinSession, leaveSession, state, sendAction, stage, sessionUsers, myRole, latency, sessionRecord } = useSocket();
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
        return () => {
            leaveSession();
        };
    }, [location, token]);
    // useEffect(() => {
    //     console.log(teams)
    // }, [teams]);



    const getRoleName = (role: 'viewer' | 'admin' | 'owner') => {
        switch (role) {
            case 'owner':
                return 'Owner';
            case 'admin':
                return 'Admin';
            case 'viewer':
                return 'Viewing';
            default:
                return 'Viewing';
        }

    }

    const stages = ['Connecting to server...', 'Verifying Identity...', 'Joining session...', 'Loading teams...', 'In session'];
    const failedStages = ['Session Ended', 'Joining session failed', 'Connection Failed'];

    const userSort = (a: { userId: string; alias: string; role: string }, b: { userId: string; alias: string; role: string }) => {
        if (a.role === b.role) {
            return a.alias.localeCompare(b.alias);
        }
        if (a.role === 'owner') return -1;
        if (b.role === 'owner') return 1;
        if (a.role === 'admin') return -1;
        if (b.role === 'admin') return 1;
        return 0;
    }

    const modifyUser = (userId: string, alias: string, demote: boolean) => {
        const sessionId = sessionRecord?.id;
        if (!sessionId) return;
        showAlert(
            <div>{demote ? <span>Demote {alias} to viewer?</span> : <span>Promote {alias} to admin?</span>}</div>,
            <div>{demote ? <span>This will demote {alias} ({userId}) to viewer. They will no longer be able to control the session.</span> : <span>This will promote {alias} ({userId}) to admin. They will be able to control the session.</span>}</div>,
            (result: boolean) => {
                if (!result) return;
                fetch(`${BASE_URL}/api/updateroles`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        sessionId,
                        targetUser: userId,
                        demote
                    })
                }).then(res => {
                    if (res.ok) {
                        useToast('success', `Role for ${alias} (${userId}) updated successfully`);
                    }
                    else {
                        res.json().then(data => {
                            useToast('error', `Failed to update role for ${alias} (${userId}): ${data.message}`);
                        });
                    }

                });
            }
        );
    }
    return (
        <div className='h-full flex flex-col items-center justify-start  w-screen p-2 font-inter overflow-x-hidden'>
            <Card className={`w-full flex  p-4 ${onMobile ? 'max-w-[95%]' : 'max-w-[41rem]'}`}>
                <div className='flex justify-between items-start'>
                    <div className='flex  flex-row items-center gap-x-4'
                        style={{ flexDirection: onMobile ? 'column' : 'row' }}>
                        <span className='text-4xl font-audiowide'>Session ID:</span>
                        <div className='flex items-center gap-x-2'>
                            <div className='flex items-center gap-2 text-xl font-inter  bg-gray-100 dark:bg-gray-800 rounded-md px-2 py-1 justify-center'>
                                <span className='font-inter ml-2'>{sessionRecord.id} </span>
                                <Copy className='ml-2 cursor-pointer hover:text-gray-500'
                                    onClick={() => {
                                        navigator.clipboard.writeText(sessionRecord.id);
                                        toast.message('Session ID copied to clipboard', {
                                            position: 'top-center',
                                        });
                                    }}
                                />
                                <Share2 onClick={() => {
                                    navigator.share({
                                        title: 'My Awesome App',
                                        text: 'Check out this amazing content!',
                                        url: window.location.href, // Or a specific URL
                                    });
                                }}
                                    className='ml-1 cursor-pointer hover:text-gray-500'
                                >
                                </Share2>
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
                {sessionRecord.alias != sessionRecord.id && (
                    <div className='font-lato italic text-lg'>{sessionRecord.alias}</div>
                )}

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
                                            <Button variant={'outline'}>{getRoleName(myRole)}</Button>
                                        </PopoverTrigger>
                                        <PopoverContent className='w-48 p-2 gap-4 '>
                                            <div className='text-sm flex flex-col gap-2'>
                                                <span className='font-lato text-lg'>Actions</span>

                                                <hr />
                                                <Button className=' bg-blue-700 hover:bg-blue-400 text-white ' onClick={() => {
                                                    navigator.clipboard.writeText(window.location.href);
                                                    toast.message('Session link copied to clipboard', {
                                                        position: 'top-center',
                                                    });
                                                }}><Copy /> Copy Link</Button>
                                                <Button className=' bg-blue-700 hover:bg-blue-400 text-white ' onClick={() => {
                                                    fetch(`${BASE_URL}/api/sessionlog/${sessionRecord.id}`, {
                                                        method: 'GET', headers: {
                                                            'Authorization': `Bearer ${token}`
                                                        }
                                                    }).then(res => {
                                                        if (res.ok) {
                                                            return res.json();
                                                        }
                                                    }).then(data => {
                                                        if (!data?.log) {
                                                            useToast('error', 'No log available for this session');
                                                            return;
                                                        }
                                                        const blob = new Blob([data.log], { type: 'text/plain' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `session_log_${sessionRecord.id}.txt`;
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                        document.body.removeChild(a);
                                                    });
                                                }}><Scroll /> Download Log</Button>
                                                <Button className=' bg-red-700 hover:bg-red-400 text-white ' onClick={() => {
                                                    leaveSession();
                                                    navigate('/');
                                                }}><ArrowLeftToLine /> Leave Session</Button>
                                                {
                                                    myRole === 'owner' && <Button
                                                        className=' bg-red-700 hover:bg-red-400 text-white '
                                                        onClick={() => {
                                                            showAlert(
                                                                <div className='flex items-center gap-2'><Squircle color='red' fill='red' /><span> <i>Kill session {sessionRecord?.alias} ?</i></span></div>,
                                                                <span>This will disconnect all users, stop all timers and <strong>cannot</strong> be undone. Are you sure?</span>,
                                                                (result: boolean) => {
                                                                    if (result) {
                                                                        fetch(`${BASE_URL}/api/killsession`, {
                                                                            method: 'POST',
                                                                            headers: {
                                                                                'Content-Type': 'application/json',
                                                                                'Authorization': `Bearer ${token}`
                                                                            },
                                                                            body: JSON.stringify({ sessionId: sessionRecord.id }),
                                                                        }).then(res => res.json()).then(data => {
                                                                            if (data.result) {
                                                                                useToast('success', `Session ${sessionRecord?.alias} killed successfully`);
                                                                                navigate('/');
                                                                            }
                                                                            if (!data.result) {
                                                                                useToast('error', 'Failed to kill session ' + sessionRecord?.alias + ': ' + data.message);
                                                                            }
                                                                        }).catch(err => {
                                                                            console.error(err);
                                                                            useToast('error', 'Failed to kill session ' + sessionRecord?.alias);
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
                                    <div className='text-sm text-gray-500'><i> you are {myRole === 'viewer' ? 'not' : ''} allowed to control the chronos</i></div>
                                </div>
                                <div className='flex items-center gap-2  border rounded-[50%] w-8 h-8 justify-center border-green-500/50'>
                                    <Tooltip >
                                        <TooltipTrigger disabled={sessionUsers.length === 0} >
                                            <div className='text-sm font-inter'>{sessionUsers.length}</div>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={4} className=' z-100001 text-(--foreground) font-inter flex flex-col gap-2'>
                                            {sessionUsers.sort(userSort).slice(0, 10).map(user => (
                                                <div key={user.userId} className='gap-6 flex flex-row justify-between items-center '>{user.alias}
                                                    <div className='flex items-center gap-[1px]'>

                                                        {user.role === 'owner' && <Badge className='text-(--foreground)'><ShieldUser />Owner</Badge>}
                                                        {user.role === 'admin' && (
                                                            <>
                                                                <Badge className='text-(--foreground) bg-orange-400'><UserStar />Admin</Badge>
                                                                {myRole === 'owner' && <Button variant='destructive' onClick={() => { modifyUser(user.userId, user.alias, true) }} className='w-2 p-0 text-[0.6rem] h-6'> <ChevronDown /></Button>}
                                                            </>
                                                        )}
                                                        {(myRole === 'owner' && user.role === 'viewer') && <Button variant='outline' onClick={() => { modifyUser(user.userId, user.alias, false) }} className='w-2 p-0 text-[0.6rem] h-6'> <ChevronUp /></Button>}
                                                    </div>
                                                </div>
                                            ))}
                                            {sessionUsers.length > 10 && <div className='text-sm text-gray-500'>and {sessionUsers.length - 10} more...</div>}
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </>
                    )
                }
                <div className='flex'>
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
                        {stage === -2 && <div className='text-gray-500'><i>session <strong>{sessionRecord?.id}</strong> does not exist</i></div>}
                        <div className='flex gap-2'> <Button className='bg-red-500 text-white' onClick={() => {
                            navigate('/');
                        }}>Leave Session</Button>
                            {stage === -1 && <Button className='bg-blue-500 text-white' onClick={() => {
                                console.log('Retrying to join session', sessionRecord?.id);
                                joinSession(sessionRecord?.id, (error) => {
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