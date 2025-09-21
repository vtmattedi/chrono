import React, { use, useEffect } from 'react';
import { type Team, useTimer } from '../Providers/Timer.tsx';
import { Card } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { PlayBtn, PauseBtn, StopBtn } from '../components/btns.tsx';

import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { Input } from '@/components/ui/input.tsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog.tsx';

const Chrono: React.FC = () => {
    const { teams, startChrono, pauseChrono, finishChrono, addTime, rearmChrono } = useTimer();
    const [values, setValues] = React.useState<string[]>(teams.map(() => '05:00'));
    const [alertVisible, setAlertVisible] = React.useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        if (teams.length === 0) {
            toast.error("No teams available. Please set up teams first.", {
                position: 'top-center',
            });
            navigate('/');
        }
    }, []);
    const maxName = (name: string) => {
        if (name.length > 18) {
            return name.slice(0, 15) + '...';
        }
        return name;
    }
    return (
        <div className='min-h-screen flex flex-col items-center justify-start  w-screen p-4 font-inter'>
            <Card className='items-center gap-1 p-2'>
                <div className='flex w-full justify-center items-end text-2xl mt-2 gap-2'>
                    <img src="/logo-nobg.png" alt="Logo" className="h-8 " />
                    <span className='text-2xl font-audiowide'>Global Controls</span>
                </div>
                <div className=' flex flex-row'>
                    <Button onClick={() => startChrono(teams.map((_, i) => i))} className='m-2 p-2 bg-green-500 text-white rounded'>Start All</Button>
                    <Button onClick={() => pauseChrono(teams.map((_, i) => i))} className='m-2 p-2 bg-yellow-500 text-white rounded'>Pause All</Button>
                    <Button onClick={() => finishChrono(teams.map((_, i) => i))} className='m-2 p-2 bg-red-500 text-white rounded'>Finish All</Button>
                    <Button onClick={() => setAlertVisible(true)} className='m-2 p-2 bg-blue-500 text-white rounded'><RotateCcw /> Restart All</Button>
                </div>
            </Card>
            <div className='flex flex-row flex-wrap justify-center'>
                {teams.map((team, index) => (
                    <Card key={index} className='m-2 p-4 w-80 gap-2'>
                        <div className='flex justify-between items-center'>
                            <h2 className='font-lato text-xl mb-2'>{maxName(team.name)}</h2>
                            <span
                                style={{
                                    color: team.state === 'running' ? 'green' : team.state === 'paused' ? 'orange' : 'red',
                                }}
                            >{team.state[0].toLocaleUpperCase() + team.state.slice(1)}</span>
                        </div>
                        <hr />
                        {
                            team.state === 'finished' && team.finishTime ? (
                                <div className='w-full flex flex-col items-center gap-2'>
                                    <div className='text-sm text-gray-500 mb-2'>
                                        Finished at: {team.finishTime.toLocaleTimeString()}
                                    </div>
                                    <div>
                                        Paused Time:
                                        <span className='font-inter text-4xl'>
                                            {new Date((team.finishTime.getTime() - (team.finishTime.getTime() - team.timeLeft * 1000))).toISOString().slice(14, 19)}
                                        </span>
                                    </div>
                                    <div>
                                        Total Time:
                                        <span className='font-inter text-4xl'>
                                            {new Date((team.finishTime.getTime() - (team.finishTime.getTime() - team.timeLeft * 1000))).toISOString().slice(14, 19)}
                                        </span>
                                    </div>
                                </div>
                            ) : (<>
                                <div className='flex justify-center items-center text-4xl'>
                                    <p className='font-inter'>{new Date(team.timeLeft * 1000).toISOString().substr(11, 8)}</p>
                                </div>
                                <div className='flex flex-col items-center gap-2 '>
                                    <div className='flex items-center w-full'>
                                        <Button onClick={() => {
                                            const [m, s] = values[index].split(':').map(Number);
                                            const totalSeconds = m * 60 + s;
                                            addTime([index], -totalSeconds);
                                        }} className='m-2 bg-blue-500 text-white'>
                                            <Minus /> Sub
                                        </Button>
                                        <Input type="time" value={values[index]} className='w-24 text-center'
                                            onChange={(e) => {
                                                setValues((prev) => {
                                                    const newValues = [...prev];
                                                    newValues[index] = e.target.value;
                                                    return newValues;
                                                })
                                            }} />
                                        <Button onClick={() => {
                                            const [m, s] = values[index].split(':').map(Number);
                                            const totalSeconds = m * 60 + s;
                                            addTime([index], totalSeconds);
                                        }} className='m-2 bg-blue-500 text-white'>
                                            <Plus /> Add
                                        </Button>

                                    </div>
                                    <div className='flex flex-wrap gap-2 '>
                                        <PlayBtn state={team.state} onClick={() => startChrono([index])} />
                                        <PauseBtn state={team.state} onClick={() => pauseChrono([index])} />
                                        <StopBtn state={team.state} onClick={() => finishChrono([index])} />
                                    </div>

                                </div>
                            </>)
                        }

                    </Card>
                ))}

            </div>

            <AlertDialog open={alertVisible} onOpenChange={setAlertVisible}>
                <AlertDialogContent >
                    <AlertDialogHeader>
                        <AlertDialogTitle className='font-lato'><div className='flex items-center gap-2'><RotateCcw  color='#00458D'/><span> Reset all timers?</span></div></AlertDialogTitle>
                        <AlertDialogDescription  className='font-inter'>
                            This action cannot be undone. All timers will be reset to their initial values.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className={'bg-red-500 dark:bg-[#8D0000] text-white'} onClick={() => {
                        }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            rearmChrono(teams.map((_, i) => i));
                        }} >Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Chrono;