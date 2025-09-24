import React from 'react';
import { Button } from '@/components/ui/button.tsx';
import { FastForwardIcon, Pause, Play, RotateCcw, Square } from 'lucide-react';
import { useGlobals } from '../Providers/Globals.tsx';
import type { SpeedType } from '@/Providers/Timer.tsx';

interface BtnsProps extends React.ComponentProps<"button"> {
    state: string;
    overrrideName?: string;
}
interface SpeedControlProps extends React.ComponentProps<"div"> {
    state: string;
    speed: SpeedType;
    setSpeed: (speed: SpeedType) => void;
}

interface AllButtonsProps extends React.ComponentProps<"div"> {
    onAction: (action: string) => void;
}

export const PlayBtn: React.FC<BtnsProps> = ({ state, ...props }) => {
    const { theme } = useGlobals();
    const color = theme === 'dark' ? '#fff' : '#000';
    return (
        <Button className='bg-green-500 text-white hover:bg-green-600' {...props} disabled={state === 'running'}
            style={{ color: color }}
        >
            <Play fill={color} /> {props.overrrideName ? props.overrrideName : (state === 'paused' ? 'Resume' : 'Start')}
        </Button>
    );
};

export const PauseBtn: React.FC<BtnsProps> = ({ state, ...props }) => {
    const { theme } = useGlobals();
    const color = theme === 'dark' ? '#fff' : '#000';
    return (
        <Button className='bg-yellow-500 text-[#000] hover:bg-yellow-600' {...props}
            disabled={state !== 'running'}
            style={{ color }}
        >
            <Pause fill={color} /> {props.overrrideName ? props.overrrideName : 'Pause'}
        </Button>
    );
};

export const StopBtn: React.FC<BtnsProps> = ({ state, ...props }) => {
    const { theme } = useGlobals();
    const color = theme === 'dark' ? '#fff' : '#000';
    return (
        <Button className='bg-red-500 text-white hover:bg-red-600' {...props} disabled={state !== 'running'}
            style={{ color }}>
            <Square fill={color} /> {props.overrrideName ? props.overrrideName : 'Stop'}
        </Button>
    );
};
export const SpeedControl: React.FC<SpeedControlProps> = ({ state, speed, setSpeed, ...props }) => {
    const { theme } = useGlobals();
    const color = theme === 'dark' ? '#ffffff' : '#000000';
    const speeds = [0.5, 1, 2, 4] as SpeedType[];
    const fowardState = speed < 4;
    const backwardState = speed > 0.5;
    const speedIndex = speeds.indexOf(speed);
    const commonClass = ` ${theme === 'dark' ? 'fill-white' : 'fill-black'} hover:cursor-pointer ${theme === 'dark' ? 'text-white' : 'text-black'}`;
    const disabledClass = 'opacity-50 cursor-false fill-gray-500 text-gray-500 ';
    return (
        <div className={`flex flex-row items-center gap-2  dark:bg-blue-800 p-2 rounded-md `} {...props}>
            <button onClick={(event) => {
                event.stopPropagation();
                if (backwardState) {
                    setSpeed(speeds[Math.max(0, speedIndex - 1)]);
                }
            }}>
                <FastForwardIcon className={`${commonClass} ${!backwardState ? disabledClass : ''} rotate-180`} />
            </button>
            <div className='text-xl font-bold font-lato' style={{ color }}>
                {speed}x
            </div>
            <button onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                if (fowardState) {
                    setSpeed(speeds[Math.min(speeds.length - 1, speedIndex + 1)]);
                }
            }}
            >
                <FastForwardIcon className={`${commonClass} ${!fowardState ? disabledClass : ''} `} />
            </button>
        </div>
    );
};

export const AllButtons: React.FC<AllButtonsProps> = ({ onAction, ...props }) => {
    return (
        <div
            {...props}
        >
            <PlayBtn state={'ready'} onClick={() => onAction('start')} overrrideName='Start All' />
            <PauseBtn state={'running'} onClick={() => onAction('pause')} overrrideName='Pause All' />
            <StopBtn state={'running'} onClick={() => onAction('finish')} overrrideName='Stop All' />
            <Button> <RotateCcw className='rotate-275' /> <span onClick={() => onAction('rearm')}>Reset All</span>
            </Button>
        </div>
    );
};
