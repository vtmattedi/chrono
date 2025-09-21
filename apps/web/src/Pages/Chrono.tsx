import React, { useEffect } from 'react';
import {  useTimer } from '../Providers/Timer.tsx';
import { Card } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Plus, Minus, RotateCcw, Settings, PlusCircle } from 'lucide-react';
import { PlayBtn, PauseBtn, StopBtn } from '../components/btns.tsx';

import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { Input } from '@/components/ui/input.tsx';
import { useAlert } from '@/Providers/Alerts.tsx';
const Chrono: React.FC = () => {
    const { teams, startChrono, pauseChrono, finishChrono, addTime, rearmChrono } = useTimer();
    const [values, setValues] = React.useState<string[]>(teams.map(() => '05:00'));
    const { showAlert } = useAlert();
    const navigate = useNavigate();
    useEffect(() => {
        if (teams.length === 0) {
            toast.error("No teams available. Please set up teams first.", {
                position: 'top-center',
            });
            navigate('/');
        }
        const params = new URLSearchParams(window.location.search);
        if (params.get('start') === 'true') {
            startChrono(teams.map((_, i) => i));
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
                    <Button variant="outline" size="sm" onClick={() =>{
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
                {teams.map((team, index) => (
                    <Card key={index} className='m-2 p-4 w-80 gap-2'>
                        <div className='flex justify-between items-center'>
                            <h2 className='font-lato text-xl mb-2'>{maxName(team.name)}</h2>
                            <span
                            // 2f6298ff
                                style={{
                                    color: team.state === 'ready' ? '#2f6298ff': team.state === 'running' ? 'green' : team.state === 'paused' ? 'orange' : 'red',
                                }}
                            >{team.state[0].toLocaleUpperCase() + team.state.slice(1)}</span>
                        </div>
                        <hr />
                        {
                            team.state === 'finished' && team.finishTime ? (
                                <div className='w-full flex flex-col items-center gap-0'>
                                    <div className='text-sm text-gray-500 mb-2'>
                                        Finished at: {team.finishTime.toLocaleTimeString()}
                                    </div>
                                    <div className='flex justify-between items-center w-full px-4'>
                                        <span className='text-muted-foreground text-sm'>Paused Time:</span>
                                        <span className='font-inter text-2xl'>
                                            {new Date((team.timePaused || 0) * 1000).toISOString().slice(14, 19)}
                                        </span>
                                    </div>
                                    <div className='flex justify-between items-center w-full px-4'>
                                        <span className='text-muted-foreground text-sm'>Running Time:</span>
                                        <span className='font-inter text-2xl'>
                                            {new Date((team.timeRunning || 0) * 1000).toISOString().slice(14, 19)}
                                        </span>
                                    </div>
                                    <Button className='bg-blue-500 text-white' onClick={() => rearmChrono([index])}><RotateCcw className='rotate-275' /><span>Reset</span></Button>
                                </div>
                            ) : (<>
                                <div className='flex justify-center items-center text-4xl h-full'>
                                    <p className='font-inter'>{new Date(team.timeLeft * 1000).toISOString().slice(11, 19)}</p>
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
        </div>
    );
};

export default Chrono;