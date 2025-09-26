import { io, Socket } from 'socket.io-client';
import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useGlobals } from './Globals';
import { useAlert } from '../Providers/Alerts';
import { useTimer } from './Timer';
import { BASE_URL } from '@/Providers/Urls.tsx';
import { on } from 'events';
// "undefined" means the URL will be computed from the `window.location` object

type SocketState = {
    joinSession: (sessionId: string, onFailed: (error: string) => void) => boolean;
    leaveSession: () => void;
    sendAction: (action: string, index: number[]) => void;
    userCount: number;
    state: boolean;
    adminRole: boolean;
    stage: number;
    latency?: number;
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

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [state, setState] = useState<boolean>(false);
    const { token } = useGlobals();
    const { useToast } = useAlert();
    const { updateTeamsState, setTeamsFromConfig, teams, applyAction } = useTimer();
    const [sessionId, _setSessionId] = useState<string>('');
    const [userCount, setUserCount] = useState<number>(0);
    const [stage, setStage] = useState<number>(0);
    const [adminRole, setAdminRole] = useState<boolean>(false);
    const [latency, setLatency] = useState<number | undefined>(undefined);
    const pingRef = React.useRef<number | null>(null);
    const pingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
    const sessionIdRef = React.useRef<string>('');
    const socket = React.useRef<Socket>(io(BASE_URL, {
        autoConnect: false,
    }));

    const  setSessionId = (id: string) => {
        _setSessionId(id);
        sessionIdRef.current = id;
    }

    const sendData = (data: any) => {
        if (socket.current?.connected) {
            socket.current.send(JSON.stringify(data));
        }
    }

    const sendAction = (action: string, index: number[]) => {
        sendData({ type: 'action', message: { sessionId, action: { type: action, index } } });
        if (adminRole)
            applyAction(action, index);
    }

    const AlertAction = (type: string, indexi: number[]) => {
        const teamstr = indexi.length > 1 ? "teams" : "team";
        const is = indexi.length === 1 ? "is" : "are";
        const [actionType, value] = type.split(':');
        console.log('Action received:', actionType, indexi, value);
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
            if (!seconds) return;
            if (seconds > 0)
                useToast('info', `${seconds} seconds were added to ${teamstr} ${indexi.map(i => teams[i].name).join(', ')}`);
            else
                useToast('info', `${-seconds} seconds were removed from ${teamstr} ${indexi.map(i => teams[i].name).join(', ')}`);
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

    const handleMessage = (data: any, onFailed: (message: string) => void) => {
        const { type, message } = JSON.parse(data);
        console.log('Message from server:', data, type);
        if (type === 'error') {
            useToast('error', message);
        }
        else if (type === 'info') {
            useToast('info', message);
        }
        else if (type === 'join_result') {
            console.log(message, message.success);
            setStage(4);
            if (message.success) {
                useToast('success', 'Successfully joined session');
                const userCount = parseInt(message.userCount);
                setAdminRole(message.role === 'admin');
                setUserCount(userCount);
                if (message.config) {
                    const teams = JSON.parse(message.config);
                    setTeamsFromConfig(teams);
                }
                if (message.state) {
                    const state = JSON.parse(message.state);
                    updateTeamsState(state);
                }
            }
            else {
                onFailed(message.errorMessage);
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
        else if (type === 'user-count') {
            const userCount = parseInt(message);
            setUserCount(userCount);
        }
        else if (type === 'identify_result') {
            setStage(3);
            sendData({ type: 'join', message: sessionIdRef.current });
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
        });
        socket.current.connect();
        setSessionId(_sessionId)
        console.log('connecting to server', _sessionId);
        socket.current.on('connect', () => {
            setState(true);
            console.log('Connected to server with token:', token);
            sendData({ type: 'identify', message: token });
            useToast('success', 'Connected to session ' + _sessionId);
            setStage(2);
        });
        socket.current.on('message', (data) => {
            handleMessage(data, onFailed);
        });
        socket.current.on('disconnect', () => {
            setState(false);
            useToast('error', 'Disconnected from server');
            setSessionId('');
            setStage(0);
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = null;
            }
            pingRef.current = null;
            setLatency(undefined);
            joinSession(_sessionId, onFailed); // reset socket
        });
        socket.current.on('connect_error', (err) => {
            setState(false);
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
        socket.current.on('user-count', (message) => {
            const userCount = parseInt(message);
            setUserCount(userCount);
        });
        socket.current.on('pong', () => {
            const pongTime = performance.now();
            const pingTime = pingRef.current || 0;
            setLatency(pongTime - pingTime);
            startPing();
        });

        startPing();
        return true;

    }

    // const enterSession = (sessionId: string) => {
    //     if (!token) {
    //         useToast('error', 'No token available for socket connection');
    //         return false;
    //     }
    // }

    const leaveSession = () => {
        if (socket.current.connected) {
            socket.current.offAny(); // clean disconnect 
            setSessionId('');
            socket.current.disconnect();
        }
        setStage(0);
        setState(false);
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
        <SocketContext.Provider value={{ state, joinSession, leaveSession, sendAction, userCount, adminRole, stage, latency }}>
            {children}
        </SocketContext.Provider>
    );
};