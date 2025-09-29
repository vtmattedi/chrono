import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowRightFromLine, PlusCircle} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router';
import { useGlobals } from '@/Providers/Globals.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
// import { BASE_URL } from '@/Providers/Urls.tsx';

const Teams: React.FC = () => {


    const { token, mysessions } = useGlobals();

    const [showSessionInput, setShowSessionInput] = React.useState(false);
    const Navigate = useNavigate();





    const btnClass = 'w-43 bg-[#006317] text-white hover:bg-[#3e5c40]  justify-between items-center flex h-12';
    return (
        <div className='h-full flex flex-col items-center justify-start  w-screen p-4 font-inter'>
            <Card className='p-4 mt-4 w-full max-w-4xl items-center'>
                <img className='w-32' src="/logo-nobg.png" alt="Team" />
                <div className='text-2xl font-audiowide mb-2 text-center'>
                    <i>
                        Multiple Timers for multiple teams. Create, pause and manage all your team timers in one place.
                    </i>
                </div>
                <div className='flex flex-col items-center'>
                    <Button className={`${btnClass}`}
                        onClick={() => {
                            Navigate('/createchrono?local=true');
                        }}
                    >
                        Start
                        <ArrowRight className='ml-2' />
                    </Button>
                    <span className='text-sm text-muted-foreground mt-2'>
                        <i>Create a local run (Works offline)</i>
                    </span>
                </div>
                <div className='flex flex-col items-center'>
                    <Button disabled={!token} className={`${btnClass}`}
                        onClick={() => {
                            Navigate('/createchrono?session=true');
                        }}>
                        Create Session
                        <PlusCircle className='ml-2' size={120} />
                    </Button>
                    <span className='text-sm text-muted-foreground mt-2'>
                        <i>Share a session link with your team! (only you can control it)</i>
                    </span>
                </div>
                <div className='flex flex-col items-center'
                    style={{
                        display: showSessionInput ? 'none' : 'flex',
                    }}
                >
                    <Button disabled={!token} className={`${btnClass}`} onClick={() => setShowSessionInput(!showSessionInput)}>
                        Join Session
                        <ArrowRight size={40} />
                    </Button >
                    <span className='text-sm text-muted-foreground mt-2'>
                        <i>Join an existing session </i>
                    </span>
                </div>
                <div
                    style={{
                        display: showSessionInput ? 'flex' : 'none',
                    }}
                    className='flex flex-col items-center'
                >
                    <div className='flex flex-row items-center gap-2 justify-center'>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" >
                                    My sessions
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className='w-48 p-2 gap-2 flex flex-col'>
                                <div> My Session</div>
                                <hr />
                                {mysessions.length === 0 && (<div className='text-sm text-muted-foreground'>No sessions found</div>
                                )}
                                <div className='flex flex-col gap-1'>
                                    {mysessions.map((record) => (
                                        <Button variant="outline" size="sm" onClick={() => {
                                            Navigate('/session?sessionId=' + record.id);
                                        }}
                                            className='justify-between'
                                        >
                                            <strong><i>{record.alias}</i></strong> <ArrowRightFromLine className='ml-2' />
                                        </Button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Input type="text" placeholder="Enter session ID to join" className='w-1/2 text-center' id='session-id-input' />
                        <Button disabled={!token} className={`${btnClass} w-20 h-9`}
                            onClick={() => {
                                if (!(document.getElementById('session-id-input') as HTMLInputElement).value) {
                                    setShowSessionInput(false);
                                    return;
                                }
                                Navigate('/session?sessionId=' + (document.getElementById('session-id-input') as HTMLInputElement).value);
                            }}
                        >
                            Join
                            <ArrowRight size={40} />
                        </Button>
                    </div>
                    <span className='text-sm text-muted-foreground mt-2'>
                        <i>Enter the session ID provided by the session host</i>
                    </span>
                </div>

            </Card >
            {/* <Button className='mt-4 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-black dark:text-white'
                disabled={!token}
                onClick={() => {
                    const t = configureAndSetTeams();
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
                        }),
                    }).then(res => res.json()).then(data => {
                        console.log('Created session:', data);
                        Navigate('/session?sessionId=' + data.sessionId);
                    }).catch(err => {
                        console.error('Error creating session:', err);
                        toast.error('Error creating session: ' + err.message);
                    });
                }}>
                create session
                <ArrowRight className='ml-2' />

            </Button> */}
        </div >

    );
};

export default Teams;