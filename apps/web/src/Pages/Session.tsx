import React from 'react';
import { useTimer } from '../Providers/Timer.tsx';
import { Card } from '@/components/ui/card.tsx';
import { useNavigate, useLocation } from 'react-router';
import { useSocket } from '@/Providers/Socket.tsx';
import { useGlobals } from '@/Providers/Globals.tsx';
import TeamCards from '@/components/TeamCards.tsx';
import { useAlert } from '@/Providers/Alerts.tsx';
import { Copy, Download, RotateCcw, Squircle } from 'lucide-react';
import { toast } from 'sonner';
import { AllButtons } from '@/components/btns.tsx';
import { Button } from '@/components/ui/button.tsx';


const ChronoSession: React.FC = () => {
    const { teams } = useTimer();
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
        if (!sessionId) {
            navigate('/');
            return;
        }
        joinSession(sessionId, (message) => {
            useToast('error', 'Failed to join session ' + sessionId + ": " + message);
            navigate('/');
        });
        setSessionId(sessionId);

        return () => {
            leaveSession();
        };
    }, [location, token]);
    // useEffect(() => {
    //     console.log(teams)
    // }, [teams]);


    const msToString = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    React.useEffect(() => {

    }, []);
    const stages = ['Connecting to server...', 'Verifying Identity...', 'Joining session...', 'Loading teams...', 'In session'];
    return (
        <div className='h-full flex flex-col items-center justify-start  w-screen p-2 font-inter'>
            <Card className={`w-full flex  p-4 ${onMobile ? '' : 'max-w-[41rem]'}`}>
                <div className='flex justify-between items-start'>
                    <div className='flex  flex-row items-center gap-x-4'
                        style={{
                            flexDirection: onMobile ? 'column' : 'row',

                        }}

                    >
                        <span className='text-4xl font-audiowide'>Session ID:</span>
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
                    </div>
                    <div
                        className='flex flex-col items-end text-sm '
                    ><Squircle
                            className={state ? 'animate-pulse' : ''}
                            color={state ? 'green' : 'red'}
                            fill={state ? 'green' : 'red'}
                        />
                        {stage === 4 && <span>{(latency || 0).toFixed(0)}ms</span>}
                    </div>

                </div>
                <div>
                    <Button className='ml-4 bg-red-500 text-white hover:bg-red-600' onClick={() => {
                        leaveSession();
                        navigate('/');
                    }}>Leave Session</Button>
                    <Button className='ml-4 bg-blue-500 text-white hover:bg-blue-600' onClick={() => {
                        const csvContent = "data:text/csv;charset=utf-8," +
                            ['Team Name,State,Base Time,Time Left,Time Running,Time Paused,Total Time,Drift(ms),Time Added,Time Subtracted,Speed']
                                .concat(teams.map(team => {
                                    return [
                                        `"${team.name.replace(/"/g, '""')}"`,
                                        team.state, // current state
                                        msToString(team.baseTime), // base time
                                        msToString(team.timeLeft),// time left
                                        msToString(team.timeRunning || 0), // time running
                                        msToString(team.timePaused || 0),// time paused
                                        msToString(((team.timeRunning || 0) + (team.timePaused || 0))), // total time
                                        (team.finalDrift || 0), // in ms, positive or negative
                                        msToString((team.timeAdded || 0) ), // time added
                                        msToString((team.timeSubtracted || 0)), // time subtracted
                                        team.speed || 1
                                    ].join(',');
                                })).join('\n');
                        const checkSum = Array.from(csvContent.slice(28)).reduce((a, b) => a + b.charCodeAt(0), 0) % 1997;
                        const csvContentWithChecksum = csvContent + `\nchecksum:${checkSum}`;
                        const encodedUri = encodeURI(csvContentWithChecksum);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `mw_chrono_${new Date().toISOString().slice(0, 10)}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}>Export <Download /></Button>
                </div>
                {
                    stage === 4 && (
                        <div className='flex justify-between items-center'>
                            <div className='flex items-center gap-2'
                                style={{
                                    flexDirection: onMobile ? 'column' : 'row',
                                    gap: onMobile ? '0' : '0.5rem',
                                    alignItems: onMobile ? 'flex-start' : 'center',
                                }}
                            >
                                <div>{adminRole ? 'Admin' : 'Viewing'}</div>
                                <div className='text-sm text-gray-500'><i> you are {adminRole ? '' : 'not'} allowed to control the chronos</i></div>
                            </div>
                            <div className='flex items-center gap-2  border rounded-[50%] w-8 h-8 justify-center border-green-500/50'>
                                <div className='text-sm font-inter'>{userCount}</div>
                            </div>
                        </div>
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
                stage !== 4 && (
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