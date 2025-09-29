import { io, Socket } from 'socket.io-client';
import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useGlobals, type SessionRecord } from './Globals';
import { useAlert } from '../Providers/Alerts';
import { useTimer } from './Timer';
import { BASE_URL } from '@/Providers/Urls.tsx';
// "undefined" means the URL will be computed from the `window.location` object
type Role = 'owner' | 'admin' | 'viewer';
type SocketState = {
    joinSession: (sessionId: string, onFailed: (error: string) => void) => boolean;
    leaveSession: () => void;
    sendAction: (action: string, index: number[]) => void;
    sessionUsers: sessionUsers[];
    state: boolean;
    myRole: Role;
    stage: number;
    latency?: number;
    sessionRecord: SessionRecord;
};

const SocketContext = createContext<SocketState | undefined>(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

type SocketProviderProps = {
    children: ReactNode;

};
type sessionUsers = {
    userId: string;
    alias: string;
    role: Role;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    //Contexts
    const { token, usersettings, addToSessionHistory, clearHistory, invalidateToken } = useGlobals();
    const { useToast } = useAlert();
    const { updateTeamsState, setTeamsFromConfig, teams, applyAction } = useTimer();
    //States
    const [myRole, setMyRole] = useState<'viewer' | 'admin' | 'owner'>('viewer');
    const [state, setState] = useState<boolean>(false);
    const [sessionUsers, _setSessionUsers] = useState<sessionUsers[]>([]);
    const [stage, setStage] = useState<number>(0);
    const [latency, setLatency] = useState<number | undefined>(undefined);
    const [sessionRecord, _setSessionRecord] = useState<SessionRecord>({ id: '', alias: '' });
    // Refs
    const sessionUsersRef = React.useRef<sessionUsers[]>([]);
    const pingRef = React.useRef<number | null>(null);
    const pingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
    const sessionRecordRef = React.useRef<SessionRecord>({ id: '', alias: '' });
    const myUserIdRef = React.useRef<string>('');
    const socket = React.useRef<Socket>(io(BASE_URL, {
        autoConnect: false,
    }));

    const setMyUserId = (id: string) => {
        myUserIdRef.current = id;
    }
    const setSessionRecord = (session: SessionRecord) => {
        console.log('Session record updated:', session.alias, session.id);
        _setSessionRecord(session);
        sessionRecordRef.current = session;
    }
    const sendData = (data: any) => {
        if (socket.current?.connected) {
            socket.current.send(JSON.stringify(data));
        }
    }

    const sendAction = (action: string, index: number[]) => {
        setTimeout(() => {
            sendData({ type: 'action', message: { sessionId: sessionRecord.id, action: { type: action, index } } });
        }, 300);

        if (myRole === 'admin' || myRole === 'owner')
            applyAction(action, index);
    }

    const AlertAction = (type: string, indexi: number[]) => {
        if (!usersettings?.actions_alerts) return;
        const teamstr = indexi.length > 1 ? "teams" : "team";
        const is = indexi.length === 1 ? "is" : "are";
        const [actionType, value] = type.split(':');
        if (actionType === 'start') {
            useToast('success', `Starting ${teamstr} ${indexi.map(i => teams[i].name).join(', ')}`);
        }
        else if (actionType === 'pause') {
            useToast('warning', `Pausing ${teamstr} ${indexi.map(i => teams[i].name).join(', ')}`);
        }
        else if (actionType === 'unpause') {
            useToast('success', `Unpausing ${teamstr} ${indexi.map(i => teams[i].name).join(', ')}`);
        }
        else if (actionType === 'finish') {
            useToast('success', `${teamstr} ${indexi.map(i => teams[i].name).join(', ')} just finished!`);
        }
        else if (actionType === 'add') {
            const seconds = parseInt(value);
            const minutes_str = `${Math.floor(seconds / 60).toString().padStart(2, '0')}: ${Math.abs(seconds % 60).toString().padStart(2, '0')}`;
            if (!seconds) return;
            if (seconds > 0)
                useToast('info', `${minutes_str} were added to ${teamstr} ${indexi.map(i => teams[i].name).join(', ')}`);
            else
                useToast('info', `${minutes_str} were removed from ${teamstr} ${indexi.map(i => teams[i].name).join(', ')}`);
        }
        else if (actionType === 'rearm') {
            useToast('info', `Team ${teamstr} ${indexi.map(i => teams[i].name).join(', ')} reseted!`);
        }
        else if (actionType === 'speed') {
            const speed = parseFloat(value);
            if (!speed) return;
            useToast('info', `${teamstr} ${indexi.map(i => teams[i].name).join(', ')} ${is} at ${speed}x now!`);
        }
    }
    const setSessionUsers = (data: sessionUsers[]) => {
        _setSessionUsers(data);
        sessionUsersRef.current = data;
        console.log('Session users updated:', data);

    }
    const handleMessage = (data: any, onFailed: (message: string) => void) => {
        const { type, message } = JSON.parse(data);
        if (type === 'error') {
            useToast('error', message);
        }
        else if (type === 'info') {
            useToast('info', message);
        }
        else if (type === 'join_result') {
            // console.log(message, message.success);
            setStage(4);
            if (message.success) {
                useToast('success', 'Connected to session: ' + sessionRecordRef.current.id);
                // console.log('Session info:', message.users);
                setSessionUsers(message.users);
                setMyRole(message.role);
                if (message.config) {
                    const teams = JSON.parse(message.config);
                    setTeamsFromConfig(teams);
                }
                if (message.state) {
                    const state = JSON.parse(message.state);
                    updateTeamsState(state);
                }
                if (message.alias) {
                    setSessionRecord({ ...sessionRecordRef.current, alias: message.alias || sessionRecordRef.current.id });
                }
                // console.log('Joined session:', message);
                addToSessionHistory({ id: sessionRecordRef.current.id, alias: message.alias || sessionRecordRef.current.id });
            }
            else {
                onFailed("session doesn't exist.");
                setStage(-2);
                clearHistory(sessionRecordRef.current.id);
            }

        }
        else if (type === 'teams-config') {
            try {
                console.log('Teams config received:', message, type);
                const data = JSON.parse(message);
                setTeamsFromConfig(data);

            }
            catch (e) {
                console.log('Error parsing teams-config message:', message, type, JSON.parse(message));
                console.error('Failed to parse teams-config message:', e);
            }
        }
        else if (type === 'identify_result') {
            setStage(3);
            if (message.success) {
                setMyUserId(message.userId);
                sendData({ type: 'join', message: sessionRecordRef.current.id });
            }
            else {
                setStage(-4);
                useToast('error', 'Identification failed: ' + message.reason);
                invalidateToken();
            }
        }

    }

    const startPing = () => {
        pingIntervalRef.current = setTimeout(() => {
            if (socket.current.connected) {
                pingRef.current = performance.now();
                socket.current.emit('ping');
            }
        }, 1000);
    }

    const cleanLatency = () => {
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }
        pingRef.current = null;
        setLatency(undefined);
    }

    const joinSession = (_sessionId: string, onFailed: (message: string) => void) => {
        if (!token) {
            useToast('error', 'No token available for socket connection');
            return false;
        }
        setStage(1);
        socket.current = io(BASE_URL, {
            autoConnect: false,
            reconnectionAttempts: 3,
        });
        socket.current.connect();
        setSessionRecord({ ...sessionRecordRef.current, id: _sessionId });
        socket.current.on('connect', () => {
            setState(true);
            console.log('Connected to server with token:', token);
            sendData({ type: 'identify', message: token });
            setStage(2);
        });
        socket.current.on('message', (data) => {
            handleMessage(data, onFailed);
        });
        socket.current.on('disconnect', () => {
            setState(false);
            useToast('error', 'Disconnected from session ' + sessionRecordRef.current.id);
            setSessionRecord({ ...sessionRecordRef.current, id: '' });
            setStage(0);
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = null;
            }
            pingRef.current = null;
            setLatency(undefined);
            // joinSession(_sessionId, onFailed); // reset socket
        });
        socket.current.on('connect_error', (err) => {
            setState(false);
            setStage(-1);
            useToast('error', 'Connection error: ' + err.message);
            console.error('Connection error:', err);
        });
        socket.current.on('tick', (data) => {
            // handle tick data
            // console.log('Tick data:', data);
            updateTeamsState(data);
        });
        socket.current.on('fulltick', (data) => {
            // handle full tick data
            // console.log('Full tick data:', data);
            updateTeamsState(data);
        });
        socket.current.on('team-config', (data) => {
            const _tc = JSON.parse(data);
            updateTeamsState(_tc);
        });
        socket.current.on('action', (message) => {

            AlertAction(message.type, message.index);
            // handle action data if needed
        });
        socket.current.on('users', (message) => {
            for (const u of message) {
                if (usersettings?.actions_alert || true) {
                    const user = sessionUsersRef.current.find((user) => user.userId === u.userId);
                    console.log('User update:', u, user, u.role, user?.role);
                    if (user && user.role !== u.role) {
                        useToast('info', `${user.alias} is now ${u.role}.`);
                    }
                }
                if (u.userId === myUserIdRef.current) {
                    setMyRole(u.role);
                }
            }
            setSessionUsers(message);
        });
        socket.current.on('pong', () => {
            const pongTime = performance.now();
            const pingTime = pingRef.current || 0;
            setLatency(pongTime - pingTime);
            startPing();
        });

        socket.current.on('session-ended', () => {
            setStage(-3);
            clearHistory(sessionRecordRef.current.id);
            useToast('error', 'Session ' + sessionRecordRef.current.alias + ' has ended.');
        });

        startPing();
        return true;

    }

    const leaveSession = () => {
        if (socket.current.connected) {
            socket.current.offAny(); // clean disconnect
            setSessionRecord({ id: '', alias: '' });
            socket.current.disconnect();
        }
        setStage(0);
        setState(false);
        setMyUserId('');
        setMyRole('viewer');
        setSessionUsers([]);
        setLatency(0);
        socket.current = io(BASE_URL, {
            autoConnect: false,
        });
        cleanLatency();
    }

    React.useEffect(() => {
        return () => {
            leaveSession();
        };
    }, []);
    return (
        <SocketContext.Provider value={{ state, joinSession, leaveSession, sendAction, sessionUsers, myRole, stage, latency, sessionRecord }}>
            {children}
        </SocketContext.Provider>
    );
};