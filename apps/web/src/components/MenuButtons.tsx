import React from 'react';

interface MenuButtonsProps extends React.HTMLAttributes<HTMLDivElement> {
    onlyIcon?: boolean;
}

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import InfoTooltip from './Info';
import { CheckCircle, ChevronDown, FileSpreadsheet, FileX, History, Loader2, Navigation, PlusCircle, Settings, Upload, X, ArrowRight, Edit, Save } from 'lucide-react';
import { useGlobals } from '@/Providers/Globals';
import { useAlert } from '@/Providers/Alerts';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import StateBadge from './StateBadge';
import ThemeSelector from './ThemeSelector';
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className='mb-1 text-xs font-inter uppercase tracking-wide text-muted-foreground'>{children}</div>
);

const MenuButtons: React.FC<MenuButtonsProps> = ({ onlyIcon, ...rest }) => {
    const { showAlert } = useAlert();
    const { invalidateToken, sessionsHistory, user, alias, mysessions, setAlias, usersettings, setUsersettings } = useGlobals();
    const Navigate = useNavigate();
    const [settingsOpen, setSettingsOpen] = React.useState(false);
    const [quickActionsOpen, setQuickActionsOpen] = React.useState(false);
    const [sessionId, setSessionId] = React.useState<string | null>(null);
    const [fileLoadStage, setFileLoadStage] = React.useState<number>(0);// 0: not loading, 1: uploading, 2: reading file
    const [fileDialogOpen, setFileDialogOpen] = React.useState<boolean>(false);
    const fileStages = ['Not loading', 'Uploading file', 'Reading file', 'Verifying content', 'Done'];
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [editingAlias, setEditingAlias] = React.useState(false);
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
    const location = useLocation();
    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get('sessionId');
        setSessionId(id);
    }, [location]);
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

    const popoverContentClassName = 'w-72 bg-[#bbb] dark:bg-[#222] z-10000 font-lato'
    const popoverTriggerClassName = 'cursor-pointer hover:opacity-70 items-center flex flex-row gap-2 font-lato'
    const saveAlias = () => {
        const newAlias = (document.getElementById('alias-input') as HTMLInputElement).value;
        if (newAlias.length > 20) {
            showAlert('Alias too long', 'Alias must be 20 characters or less.', () => { }, 'ok');
            return;
        }
        setAlias(newAlias);
    }
    return (
        <div {...rest}>
            <Popover open={settingsOpen} onOpenChange={setSettingsOpen} >
                <PopoverTrigger asChild >
                    <div className={popoverTriggerClassName}>
                        <Settings />
                        {onlyIcon ? null : 'Settings'}
                        <ChevronDown className={`transition-transform duration-300 ${settingsOpen ? 'rotate-180' : ''}`} />
                    </div>
                </PopoverTrigger>

                <PopoverContent className={popoverContentClassName} align='end'>
                    {
                        !user.id && (
                            <div className='text-red-500 font-inter text-sm'>You are not connected to the backend. Some features may be unavailable.</div>
                        )
                    }
                    {
                        user.id && (
                            <div className='flex flex-row items-center gap-3'>
                                <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#ff9849] bg-background text-2xl font-audiowide'>
                                    {(alias || 'A').trim().charAt(0).toUpperCase()}
                                </div>
                                <div className='flex min-w-0 flex-1 flex-col gap-1'>
                                    <div className='flex items-center justify-between gap-1'>
                                        {!editingAlias ? (
                                            <>
                                                <span className='truncate text-lg'>{alias || 'Anonymous'}</span>
                                                <Edit className='shrink-0 hover:opacity-70 hover:cursor-pointer' size={16}
                                                    onClick={() => { setEditingAlias(true) }}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <Input className='h-8' onBlur={() => { setEditingAlias(false); saveAlias(); }} defaultValue={alias || 'Anonymous'} placeholder='Enter alias' id='alias-input' autoFocus />
                                                <Save className='shrink-0 hover:opacity-70 hover:cursor-pointer' size={20}
                                                    onClick={() => { setEditingAlias(false); saveAlias(); }}
                                                />
                                            </>
                                        )}
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        {
                                            user.role === 'admin' ? (
                                                <Badge className='bg-orange-400 text-black font-inter' >Admin</Badge>
                                            ) : (
                                                <Badge className='bg-blue-400 text-black font-inter' variant='secondary'>{user.role || 'No Role'}</Badge>
                                            )}
                                        <InfoTooltip iconSize={18}>
                                            <div className='flex flex-col gap-2 z-100001 min-w-md flex-wrap break-words max-w-md'>
                                                <span>Your alias is used by others to identify you in sessions.</span>
                                                <div className='flex flex-row gap-1 items-center'>
                                                    <span className='text-sm text-muted-foreground'>User ID:</span>
                                                    <span className='text-lato break-all'>{user.id}</span>
                                                </div>
                                                <span className='inline-block break-words'>Your user ID is how you are identified by the server</span>
                                            </div>
                                        </InfoTooltip>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    <hr className='my-3' />
                    <SectionTitle>My Sessions</SectionTitle>
                    <div className='max-h-40 overflow-y-auto'>
                        {
                            mysessions?.length > 0 ? mysessions.map((s, index) => (
                                <div key={index} className={`flex flex-row gap-2 justify-between items-center p-1 rounded-md cursor-pointer ${sessionId === s.sessionId ? 'font-bold' : 'hover:bg-[var(--header-bg)]'}`}
                                    onClick={() => {
                                        if (sessionId === s.sessionId) return;
                                        Navigate('/session?sessionId=' + s.sessionId);
                                    }} aria-disabled={sessionId === s.sessionId}
                                    style={{
                                        opacity: sessionId === s.sessionId ? 0.5 : 1,
                                        fontWeight: sessionId === s.sessionId ? 'bold' : 'normal',
                                    }}
                                >
                                    <span className='truncate'>{s.alias}</span>
                                    <div className='flex shrink-0 flex-row gap-1 items-center'>
                                        <StateBadge state={s.state} />
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            )) : (
                                <i className='text-sm text-muted-foreground'>No sessions found</i>
                            )
                        }
                    </div>

                    <hr className='my-3' />
                    <SectionTitle>Preferences</SectionTitle>
                    <div className='flex flex-col gap-3'>
                        <div className='flex flex-row gap-2 justify-between items-center'>
                            <span>Theme</span> <ThemeSelector />
                        </div>
                        <label className='flex flex-row gap-2 justify-between items-center cursor-pointer'>
                            <div className='flex flex-col'>
                                <span>Action notifications</span>
                                <span className='text-xs text-muted-foreground'>Start, pause, time changes, role changes</span>
                            </div>
                            <Switch checked={usersettings.actions_alerts}
                                onCheckedChange={(checked) => setUsersettings({ actions_alerts: checked })} />
                        </label>
                        <label className='flex flex-row gap-2 justify-between items-center cursor-pointer'>
                            <div className='flex flex-col'>
                                <span>Token notifications</span>
                                <span className='text-xs text-muted-foreground'>When your token is set or replaced</span>
                            </div>
                            <Switch checked={usersettings.token_alerts}
                                onCheckedChange={(checked) => setUsersettings({ token_alerts: checked })} />
                        </label>
                    </div>
                    {process.env.NODE_ENV === 'development' && (
                        <Button className='mt-3 w-full bg-red-500 text-white hover:bg-red-600'
                            onClick={() => {
                                invalidateToken();
                            }}>
                            delete token
                        </Button>
                    )}
                    <hr className='my-3' />
                    <div className='flex justify-center text-sm text-muted-foreground italic gap-1'>
                        <strong>Version:</strong> 1.2
                    </div>
                </PopoverContent>
            </Popover>
            <Popover open={quickActionsOpen} onOpenChange={setQuickActionsOpen}>
                <PopoverTrigger asChild>
                    <div className={popoverTriggerClassName}>
                        <Navigation />
                        {onlyIcon ? null : 'Quick Actions'}
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
                                            }}>
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
                }} />
        </div>
    );
};

export default MenuButtons;