import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowRightFromLine, CheckCircle, FileSpreadsheet, FileX, Loader2, PlusCircle, Upload, X } from 'lucide-react';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { type Team } from '../Providers/Timer.tsx';
import { useAlert } from '@/Providers/Alerts.tsx';
import { useGlobals } from '@/Providers/Globals.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { BASE_URL } from '@/Providers/Urls.tsx';
const MAXTEAMS = 20;
const Teams: React.FC = () => {
    const [teams, setTeams] = React.useState<Team[]>(Array.from({ length: MAXTEAMS }, () => ({ name: '', baseTime: 0, state: 'ready', timeLeft: 0 })));
    const [numberOfTeams, setNumberOfTeams] = React.useState(5);
    const [timeInput, setTimeInput] = React.useState('00:30:00');
    const { token, invalidateToken } = useGlobals();
    const { showAlert } = useAlert();
    const [fileLoadStage, setFileLoadStage] = React.useState<number>(0);// 0: not loading, 1: uploading, 2: reading file
    const [fileDialogOpen, setFileDialogOpen] = React.useState<boolean>(false);
    const fileStages = ['Not loading', 'Uploading file', 'Reading file', 'Verifying content', 'Done'];
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [showSessionInput, setShowSessionInput] = React.useState(false);
    const [mysessions, setMySessions] = React.useState<string[]>([]);
    const [sessionsFetching, setSessionsFetching] = React.useState<boolean>(false);
    const Navigate = useNavigate();
    // const { setTeams: setGlobalTeams } = useTimer();

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


    const VerifyResult = (result: boolean, fileName: string | null = null, reason: string | null = null) => {
        if (result) {
            showAlert(
                <div>
                    <div className='flex items-center gap-2'><CheckCircle color='#4C6F50' /><span> File verified successfully!</span></div>
                    {fileName && <div className='text-sm text-muted-foreground'>{fileName}</div>}
                </div>,
                <div>
                    <div className='rounded-lg border border-green-500 min-h-[50px] p-2 bg-green-100'>
                        <div className='flex items-center gap-2 text-green-900'>
                            <FileSpreadsheet className='inline mr-2' />
                            The CSV file is corrected.
                        </div>
                    </div>
                </div>,
                () => {
                    setFileLoadStage(0);
                },
                'ok'
            );
        }
        else {
            showAlert(
                <div>
                    <div className='flex items-center gap-2'><X color='#e55353' /><span> File verification failed!</span></div>
                    {fileName && <div className='text-sm text-muted-foreground'>{fileName}</div>}
                </div>,
                <div>
                    <div className='rounded-lg border border-red-500 min-h-[50px] p-2 bg-red-100'>
                        <div className='flex items-center gap-2 text-red-900'>
                            <FileX className='inline mr-2' />
                            The CSV file is not valid.
                        </div>
                        {reason && <div className='mt-2 text-sm'>{reason}</div>}
                    </div>
                </div>,
                () => {
                    setFileLoadStage(0);
                },
                'ok'
            );
        }
    }

    useEffect(() => {
        const handleWindowFocus = () => {
            if (fileDialogOpen) {
                setTimeout(() => {
                    if (!fileInputRef.current?.files?.length) {
                        setFileLoadStage(0);
                    }
                    setFileDialogOpen(false);
                }, 100);
            }
        };

        window.addEventListener('focus', handleWindowFocus);
        return () => window.removeEventListener('focus', handleWindowFocus);
    }, [fileDialogOpen]);

    const btnClass = 'w-43 bg-[#006317] text-white hover:bg-[#3e5c40]  justify-between items-center flex h-12';
    return (
        <div className='h-full flex flex-col items-center justify-start  w-screen p-4 font-inter'>
            <Card className='p-4 mt-4 w-full max-w-4xl items-center'>
                {process.env.NODE_ENV === 'development' && (
                    <Button className=' bg-red-500 text-white hover:bg-red-600'
                        onClick={() => {
                            invalidateToken();
                        }}
                    >
                        delete token
                    </Button>
                )}
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
                                <Button variant="outline" size="sm" onClick={() => {
                                    if (mysessions.length > 0) return;
                                    setSessionsFetching(true);
                                    fetch(BASE_URL + '/api/mysessions', {
                                        method: 'GET',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`
                                        },
                                    }).then(res => res.json()).then(data => {
                                        console.log('My sessions:', data);
                                        setMySessions(data.sessions || []);
                                    }).catch(err => {
                                        console.error('Error fetching my sessions:', err);
                                    }).finally(() => {
                                        setSessionsFetching(false);
                                    });
                                }}>
                                    My sessions
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className='w-48 p-2 gap-2 flex flex-col'>
                                <div> My Session</div>
                                <hr />
                                {sessionsFetching && (<div className='text-sm text-muted-foreground'>Loading <Loader2 className='animate-spin' size={16} /></div>
                                )}
                                {mysessions.length === 0 && (<div className='text-sm text-muted-foreground'>No sessions found</div>
                                )}
                                <div className='flex flex-col gap-1'>
                                    {mysessions.map((sessionId) => (
                                        <Button variant="outline" size="sm" onClick={() => {
                                            Navigate('/session?sessionId=' + sessionId);
                                        }}>
                                            Session <strong><i>{sessionId}</i></strong> <ArrowRightFromLine className='ml-2' />
                                        </Button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Input type="text" placeholder="Enter session ID to join" className='w-1/2 text-center' id='session-id-input' />
                        <Button disabled={!token} className={`${btnClass} w-20 h-9`}
                            onClick={() => {
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
                <div className='flex flex-col items-center'>
                    <Button
                        disabled={fileLoadStage !== 0}
                        className={`${btnClass}`}
                        onClick={() => {
                            setFileLoadStage(1);
                            fileInputRef.current?.click();
                        }}
                    >
                        {
                            fileLoadStage === 0 ? (
                                <>
                                    Verify CSV <Upload className='ml-2' size={40} />
                                </>

                            ) : (
                                <>
                                    {fileStages[fileLoadStage]} <Loader2 className='animate-spin' size={40} />
                                </>
                            )
                        }
                    </Button >
                    <input type="file" id="upload-csv" className="hidden"
                        ref={fileInputRef}
                        accept=".csv,text/csv"
                        onClick={() => {
                            setFileDialogOpen(true);
                            setFileLoadStage(1);
                        }}
                        onChange={(e) => {
                            setFileLoadStage(2);
                            const file = e.target.files?.[0];
                            if (!file) {
                                // user canceled the file selection
                                // handled by onFocus event @useEffect
                                return;
                            };
                            const fileName = file.name;
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                setFileLoadStage(3);
                                if (!e.target?.result) {
                                    VerifyResult(false, fileName, 'File is empty or could not be read.');
                                    return;
                                };
                                const text = e.target.result as string;
                                const lines = text.split('\n');
                                const lastLine = lines[lines.length - 1];
                                if (lastLine.startsWith('checksum:')) {
                                    const checksum = parseInt(lastLine.split(':')[1]);
                                    const content = lines.slice(0, -1).join('\n');
                                    const calculatedChecksum = Array.from(content).reduce((a, b) => a + b.charCodeAt(0), 0) % 1997;
                                    if (checksum !== calculatedChecksum) {
                                        VerifyResult(false, fileName, 'Checksum does not match! File may be corrupted or was tampered.');

                                        return;
                                    }
                                    VerifyResult(true, fileName);
                                }
                                else {
                                    VerifyResult(false, fileName, 'No checksum found! File may be corrupted.');
                                }
                            };
                            reader.onerror = (e) => {
                                console.error('Error reading file:', e);
                                VerifyResult(false, fileName, 'Error reading file.');
                            }
                            reader.readAsText(file);
                            setFileDialogOpen(false);
                        }
                        } />
                    <span className='text-sm text-muted-foreground mt-2'>
                        <i>Verify an exported CSV </i>
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