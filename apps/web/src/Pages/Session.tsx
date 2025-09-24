import React, { use, useEffect } from 'react';
import { useTimer, type SpeedType, type Team } from '../Providers/Timer.tsx';
import { Card } from '@/components/ui/card.tsx';
import { useNavigate, useLocation } from 'react-router';
import { useSocket } from '@/Providers/Socket.tsx';
import { useGlobals } from '@/Providers/Globals.tsx';
import TeamCards from '@/components/TeamCards.tsx';
import { useAlert } from '@/Providers/Alerts.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Copy, RotateCcw, Share2, Share2Icon, Squircle } from 'lucide-react';
import { toast } from 'sonner';
import { AllButtons } from '@/components/btns.tsx';


const ChronoSession: React.FC = () => {
    const { teams } = useTimer();
    const { token } = useGlobals();
    const { useToast, showAlert } = useAlert();
    const [sessionId, setSessionId] = React.useState<string>('');
    const navigate = useNavigate();
    const location = useLocation();
    const { joinSession, leaveSession, state, sendAction, userCount, adminRole, stage } = useSocket();

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
    return (
        <div className='h-full flex flex-col items-center justify-start  w-screen p-4 font-inter'>
            <Card className='w-full max-w-[41rem] p-4 '>
                <div className='flex justify-between items-start'>
                    <div className='flex flex-row items-center gap-4'>
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
                        className='flex flex-col items-start text-sm'
                        style={{
                            color: state ? 'green' : 'red',
                        }}
                    ><Squircle
                            className={state ? 'animate-pulse' : ''}
                            fill={state ? 'green' : 'red'}
                        /></div>

                </div>
                <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-2'>
                        <div>{adminRole ? 'Admin' : 'Viewing'}</div>
                        <div className='text-sm text-gray-500'><i> you are {adminRole ? '' : 'not'} allowed to control the chronos</i></div>
                    </div>
                    <div className='flex items-center gap-2  border rounded-[50%] w-8 h-8 justify-center border-green-500/50'>
                        <div className='text-sm font-inter'>{userCount}</div>
                    </div>
                </div>
                <div className='flex'>
                    {/* <Button>Start All</Button>
                    <Button className='ml-2'>Pause All</Button>
                    <Button className='ml-2'>Finish All</Button>
                    <Button className='ml-2'>Restart All</Button> */}
                    <AllButtons className='flex gap-2' onAction={(action) => {
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
                    }} />
                </div>
            </Card>
            {
                stage === 1 && (
                    <Card className='w-full max-w-4xl p-4 space-y-4 text-center mt-4'>
                        <h2 className='text-2xl font-bold'>Loading...</h2>
                    </Card>
                )
            }
            {

                stage === 2 && (
                    <TeamCards onAction={(action, index) => {
                        sendAction(action, index);
                    }} className='mt-4' />
                )
            }

        </div>
    );
};

export default ChronoSession;