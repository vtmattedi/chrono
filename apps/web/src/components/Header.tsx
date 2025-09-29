import React from 'react';

import ThemeSelector from './ThemeSelector';
import confetti from 'canvas-confetti';
import { ArrowRight, CheckCircle, ChevronDown, FileSpreadsheet, FileX, History, Loader2, MenuIcon, Navigation, PlusCircle, Settings, Timer, Upload, X } from 'lucide-react';
import { useGlobals } from '../Providers/Globals';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import InfoTooltip from './Info';
import { useLocation } from 'react-router-dom';
import { useAlert } from '@/Providers/Alerts';
const Header: React.FC = () => {
    const { showAlert } = useAlert();
    const { theme, onMobile, invalidateToken, sessionsHistory, user, alias } = useGlobals();
    const fireConfetti = () => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        const randomInRange = (min: number, max: number) =>
            Math.random() * (max - min) + min;
        const interval = window.setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                return clearInterval(interval);
            }
            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            });
        }, 250);
    };
    const location = useLocation();
    const Navigate = useNavigate();
    const [menuOpen, setMenuOpen] = React.useState(false);
    const desc = ['click me', '/vtmattedi', '/vitor-mattedi-dev'];
    const images = () => {
        return [
            <img
                src="/logo-nobg.png"
                alt="Logo"
                className="h-8 ml-4 cursor-pointer"
                onClick={fireConfetti}
                style={{
                    filter: theme === 'dark' ? 'invert(1)' : 'none',
                }}
            />,
            <img src="https://simpleicons.org/icons/github.svg" alt="GitHub Logo" className="h-8 ml-4 cursor-pointer hover:opacity-70"
                style={{
                    filter: theme === 'dark' ? 'invert(1)' : 'none',
                }}
                onClick={() => window.open('https://github.com/vtmattedi', '_blank')}
            />,
            <img src="https://icons.getbootstrap.com/assets/icons/linkedin.svg" alt="LinkedIn Logo" className="h-8 ml-4 cursor-pointer hover:opacity-70"
                onClick={() => window.open('https://www.linkedin.com/in/vitor-mattedi-dev/', '_blank')}
                style={{
                    filter: theme === 'dark' ? 'invert(1)' : 'none',
                }}
            />
        ]
    }
    const popoverContentClassName = 'w-64 bg-[#bbb] dark:bg-[#222] z-10000 font-lato'
    const popoverTriggerClassName = 'ml-4 cursor-pointer hover:opacity-70 items-center flex flex-row gap-2 font-lato'
    const [settingsOpen, setSettingsOpen] = React.useState(false);
    const [quickActionsOpen, setQuickActionsOpen] = React.useState(false);
    const [sessionId, setSessionId] = React.useState<string | null>(null);
    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get('sessionId');
        setSessionId(id);
    }, [location]);
    const [fileLoadStage, setFileLoadStage] = React.useState<number>(0);// 0: not loading, 1: uploading, 2: reading file
    const [fileDialogOpen, setFileDialogOpen] = React.useState<boolean>(false);
    const fileStages = ['Not loading', 'Uploading file', 'Reading file', 'Verifying content', 'Done'];
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

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
    React.useEffect(() => {
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

    return (
        <div
            className="bg-[var(--header-bg)] w-full  flex justify-between items-center position-sticky top-0 z-999 shadow-md w-full h-[48px] px-4"
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 9999,
                backdropFilter: 'saturate(180%) blur(20px)',
            }}>
            {!onMobile && (<div className="flex items-center">
                {/* {images().map((img, index) => (
                    <div key={index} >{img}</div>
                ))} */}
                <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <PopoverTrigger asChild >
                        <div className={popoverTriggerClassName}>
                            <Settings />
                            Settings
                            <ChevronDown className={`transition-transform duration-300 ${settingsOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className={popoverContentClassName} align='start'>
                        <div>
                            <img src={'https://gravatar.com/avatar/d64b224b12d58435f8758b01b028251c?s=400&d=robohash&r=x'} 
                            alt="User Avatar" 
                            className="w-10 h-10 rounded-full border-2 border-green-300" />
                            {alias}
                            {user.id}
                            {user.role}
                        </div>
                        <hr className='my-2' />
                        <span className='font-lato text-lg'>My Sessions</span>:
                        <div>
                            {
                                sessionsHistory?.length > 0 ? sessionsHistory.map((s, index) => (
                                    <div key={index} className='flex flex-row gap-2 justify-between items-center hover:bg-[#088D00] p-1 rounded-md cursor-pointer'
                                        onClick={() => {
                                            if (sessionId === s.id) return;
                                            Navigate('/session?sessionId=' + s.id);
                                        }} aria-disabled={sessionId === s.id}
                                        style={{
                                            opacity: sessionId === s.id ? 0.5 : 1,
                                            backgroundColor: sessionId === s.id ? '#088D00' : undefined,
                                        }}
                                    >
                                        <span>{s.alias}</span> <ArrowRight size={16} />
                                    </div>
                                )) : (
                                    <i>No sessions found</i>
                                )
                            }
                        </div>
                        <hr className='my-2' />
                        <div className='flex flex-row gap-2 items-center text-black dark:text-white font-inter text-lg '>
                            <span>Alias: </span>
                            <span className='text-md'>{localStorage.getItem('alias') || 'webclient'}</span>
                            <InfoTooltip iconSize={16}>
                                <div className='flex flex-col gap-2 z-100001 w-md'>
                                    <span>Your alias is used to identify you in sessions.</span>
                                </div>
                            </InfoTooltip>
                        </div>
                        <Input type='text' placeholder={localStorage.getItem('alias') || 'webclient'} />
                        <div className='flex flex-row gap-2 justify-between font-inter text-sm'>
                            <span >Action Notifications: </span> <Switch />
                        </div>
                        {process.env.NODE_ENV === 'development' && (
                            <Button className=' bg-red-500 text-white hover:bg-red-600'
                                onClick={() => {
                                    invalidateToken();
                                }}>
                                delete token
                            </Button>
                        )}
                    </PopoverContent>
                </Popover>
                <Popover open={quickActionsOpen} onOpenChange={setQuickActionsOpen}>
                    <PopoverTrigger asChild>
                        <div className={popoverTriggerClassName}>
                            <Navigation />
                            Quick Actions
                            <ChevronDown className={`transition-transform duration-300 ${quickActionsOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className={popoverContentClassName} align='start'>
                        <div className='flex flex-col gap-2'>
                            <Button onClick={() => {
                                Navigate('/createchrono');
                                setQuickActionsOpen(false);
                            }}>
                                Create Session <PlusCircle className='ml-2' />
                            </Button>
                            <div className='flex flex-row gap-2 justify-between font-inter text-sm '>
                                <Input type='text' placeholder='Session ID' className='w-full' id='headerSessionIdInput' />
                                <Button onClick={() => {
                                    const _sessionId = (document.getElementById('headerSessionIdInput') as HTMLInputElement).value;
                                    if (!_sessionId) {
                                        return
                                    }
                                    Navigate('/session?sessionId=' + _sessionId);
                                    setQuickActionsOpen(false);
                                }}>
                                    Join <ArrowRight />
                                </Button>
                            </div>
                            {/* <Button onClick={() => {
                                Navigate('/createchrono?local=true');
                                setQuickActionsOpen(false);
                            }}>
                                Local Session
                            </Button> */}
                            <div className='flex items-center justify-between'>
                                <Button
                                    disabled={fileLoadStage !== 0}
                                    variant={'outline'}
                                    className='w-40'
                                    onClick={() => {
                                        setFileLoadStage(1);
                                        fileInputRef.current?.click();
                                    }}
                                >
                                    {
                                        fileLoadStage === 0 ? (
                                            <>
                                                Verify CSV <Upload className='ml-2 ' size={40} />
                                            </>

                                        ) : (
                                            <>
                                                {fileStages[fileLoadStage]} <Loader2 className='animate-spin' size={40} />
                                            </>
                                        )
                                    }

                                </Button >
                                <InfoTooltip legend={'Verifies an exported CSV, ensuring it has not been tempered with.'} iconSize={16} />
                            </div>

                            <hr className='my-2' />
                            <div className='flex flex-row gap-2 justify-center text-sm hover:underline'>
                                <History
                                    size={20}
                                />
                                <span className='font-lato'>Recent Sessions</span>
                            </div>
                            <div>
                                {sessionsHistory?.length === 0 ? <div className='w-full flex justify-center text-sm font-lato text-muted-foreground'><i>No recent sessions</i></div> : (
                                    <div>
                                        {sessionsHistory?.map((conn, index) => (
                                            <div key={index} className='flex flex-row gap-2 justify-between items-center hover:bg-[var(--header-bg)] p-1 rounded-md cursor-pointer'
                                                onClick={() => {
                                                    Navigate('/session?sessionId=' + conn.id);
                                                }}
                                            >
                                                <span className='font-inter text-sm'>{conn.alias}</span>
                                                <ArrowRight size={16} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            )}
            {
                <div className='flex gap-1 hover:cursor-pointer'
                    onClick={() => {
                        Navigate('/');
                    }}
                    style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        alignItems: 'flex-end',

                    }}>
                    <span className='font-audiowide text-2xl flex gap-1'> <Timer /> ChronoApp</span>
                    <i className='font-lato text-sm'>by mattediworks &copy;</i>
                </div>
            }
            {!onMobile && <ThemeSelector />}
            {onMobile && (<div>
                <MenuIcon className='cursor-pointer' onClick={() => {
                    setMenuOpen(!menuOpen);
                }} />
            </div>)}

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetContent className='z-9999 bg-[var(--header-bg)]' side='right'
                    style={{
                        transition: 'transform 0.3s ease-in-out',
                    }}
                >
                    <SheetHeader>
                        <SheetTitle className='text-2xl font-audiowide flex items-center gap-2'>Settings</SheetTitle>
                        <SheetDescription>
                            <div className='flex mb-6  gap-4 px-2 items-center font-audiowide text-2xl  justify-between text-black dark:text-white'>
                                <span>Theme:</span>
                                <ThemeSelector />
                            </div>
                            <div className='flex flex-col gap-2 mb-4 items-center text-black dark:text-white font-inter text-lg '>
                                {
                                    images().map((img, index) => (
                                        <div key={index} className='flex items-center w-full gap-2' title={desc[index]}>{img}{desc[index]}</div>
                                    ))
                                }
                            </div>
                            <hr />
                            <div className='flex w-full justify-end'>Version 1.0</div>
                        </SheetDescription>
                        <SheetFooter>
                            Designed by Mattediworks &copy;

                        </SheetFooter>
                    </SheetHeader>
                </SheetContent>
            </Sheet>
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
        </div >

    );
};

export default Header;