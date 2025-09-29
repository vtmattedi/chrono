import React from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { InfoIcon } from 'lucide-react';


interface InfoTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
    legend?: React.ReactNode;
    children?: React.ReactNode;
    iconSize?: number;
    iconColor?: string;
    legendClassName?: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ legend, legendClassName, children, iconSize = 24, ...props }) => {
    return (
        <Tooltip >
            <TooltipTrigger asChild>
                <div className='text-gray-500 ' {...props}>
                    <InfoIcon
                        size={iconSize}
                    />
                </div>
            </TooltipTrigger>
            <TooltipContent sideOffset={4} className='z-100001 text-md font-inter max-w-[90vw]'>
            {
                legend && <div className={legendClassName}>{legend}</div>
            }
            {
                !legend && <>{children}</>
            }
            </TooltipContent>
        </Tooltip>
    );
};

export default InfoTooltip;