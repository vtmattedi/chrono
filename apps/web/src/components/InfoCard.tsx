import React from 'react';
import CountUp from './CountUp';
import { Card } from './ui/card';

interface InfoCardProps extends React.ComponentProps<"div"> {
    cardTitle: React.ReactNode;
    number: number;
    unit: React.ReactNode;
    description: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ cardTitle, number, unit, description,  ...props}) => {
    const filterClassProps = { ...props };
    delete filterClassProps.className; // Remove className to avoid passing it twice
    const cardClass = "min-w-[100px] w-[250px] gap-1 ";
    return (
        <Card className={cardClass + " " + props.className} {...filterClassProps}>
            <div className='text-center text-lg font-inter flex justify-center items-center gap-2 '>
                {cardTitle}
            </div>
            <div className='text-4xl font-lato font-bold text-center m-4'>
                {
                    (number > -1 && !isNaN(number)) ? (

                        <CountUp
                            from={0}
                            to={number}
                            separator=","
                            direction="up"
                            duration={1}
                            className="count-up-text"
                        />

                    ) : (
                        <div className='text-center'>--</div>
                    )}
                <div className='text-sm font-lato font-[300] text-center'>
                    {unit}
                </div>
            </div>
            <div>

                <div className='text-center text-sm text-muted-foreground font-inter'>
                    {description}
                </div>
            </div>
        </Card>
    );
};

export default InfoCard;