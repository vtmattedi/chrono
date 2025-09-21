import React from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Pause, Play, Square } from 'lucide-react';
import { useGlobals } from '../Providers/Globals.tsx';
interface BtnsProps extends React.ComponentProps<"button"> {
    state: string;
}

export const PlayBtn: React.FC<BtnsProps> = ({ state, ...props }) => {
    const { theme } = useGlobals();
    const color = theme === 'dark' ? '#fff' : '#000';
    return (
        <Button className='bg-green-500 text-white hover:bg-green-600' {...props} disabled={state === 'running'}
            style={{ color: color }}
        >
            <Play fill={color} /> {(state === 'paused' || state === 'ready') ? 'Start' : 'Resume'}
        </Button>
    );
};

export const PauseBtn: React.FC<BtnsProps> = ({ state, ...props }) => {
    const { theme } = useGlobals();
    const color = theme === 'dark' ? '#fff' : '#000';
    return (
        <Button className='bg-yellow-500 text-[#000] hover:bg-yellow-600' {...props} disabled={state !== 'running'}

            style={{ color }}
        >
            <Pause fill={color} /> Pause
        </Button>
    );
};

export const StopBtn: React.FC<BtnsProps> = ({ state, ...props }) => {
    const { theme } = useGlobals();
    const color = theme === 'dark' ? '#fff' : '#000';
    return (
        <Button className='bg-red-500 text-white hover:bg-red-600' {...props} disabled={state !== 'running'}
            style={{ color }}>
            <Square fill={color} /> Stop
        </Button>
    );
};
