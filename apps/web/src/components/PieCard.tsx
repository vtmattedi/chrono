import React from 'react';
import { Card } from './ui/card';
import { chartConfigPerArea, chartConfigPerDate, getDataPerDate } from '@/assets/util/AttachedData';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { LabelList, PieChart, Pie } from 'recharts';
import { availableAreas, type FilterType } from '@/components/Filter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useGlobals } from '@/Providers/Globals';
import CountUp from './CountUp';
interface PieCardProps extends React.ComponentProps<"div"> {
    filters: FilterType;
    periodSelected?: string;
}

const PieCard: React.FC<PieCardProps> = ({ filters, periodSelected, ...props }) => {
    const baseData = getDataPerDate();
    const filterClassProps = { ...props };
    delete filterClassProps.className; // Remove className to avoid passing it twice
    const [numAreas, setNumAreas] = React.useState<number>(filters.area.length);
    const [selectedArea, setSelectedArea] = React.useState<string>("all");
    const [selectedDateIndex, setSelectedDateIndex] = React.useState<number>(0);
    const [dateOptions, setDateOptions] = React.useState<string[]>([]); // Options for date selection
    const { onMobile } = useGlobals();
    // Component re-renders when filters change so we can use simple functions to get filtered data

    // Data layout change between showing data for a single area or multiple areas
    const getFilteredData: () => any[] = () => {
        // If no areas selected, return empty data
        if (numAreas === 0) return [];
        // If one area selected, return data for that area
        if (numAreas === 1 || selectedArea !== "all") {
            const _area = numAreas === 1 ? filters.area[0] : selectedArea;
            const data = baseData;
            // Final Data for the most recent date
            const newData = [] as { name: string, value: number, fill: string, id: string | undefined }[];
            let count = 0; // Helper to assign colors
            //Extract keys from the last object in data array (most recent date)
            data.forEach(item => {
                let key = item.date;
                if (filters.dataType.time === 'Daily') {
                    key = new Date(item.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
                }
                else if (filters.dataType.time === 'Weekly') {
                    const firstDayOfWeek = new Date(item.date);
                    firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay());
                    const lastDayOfWeek = new Date(firstDayOfWeek);
                    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
                    key = firstDayOfWeek.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit' }) + " - " + lastDayOfWeek.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit' });
                }
                else if (filters.dataType.time === 'Monthly') {
                    const date = new Date(item.date);
                    key = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
                }
                if (key !== dateOptions[selectedDateIndex]) {
                    return;
                }
                item.values.forEach(item => {
                    if (item.area !== _area || !filters.function.includes(item.function)) {
                        return;
                    }
                    const existing = newData.find(newItem => newItem.name === item.function);
                    if (existing) {
                        existing.value += item.value;
                        return;
                    }
                    else {
                        count++;
                        newData.push({
                            name: item.function,
                            id: item.function, // id is used to get the color from config
                            value: item.value,
                            // Makes sure we get the correct color from config, maintaing consistency
                            fill: chartConfigPerDate[item.function as keyof typeof chartConfigPerDate]?.color || `var(--chart-${count})`,
                        });
                    }
                });

            });
            return newData;
        }
        // If multiple areas selected, return aggregated data per area
        else {
            const data = baseData
            const newData = [] as { name: string, value: number, fill: string, id: string | undefined }[];
            let count = 5; // Helper to assign colors
            // Starts at 5 to avoid color clash with functions
            data.forEach(item => {
                let key = item.date;
                if (filters.dataType.time === 'Daily') {
                    key = new Date(item.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
                }
                else if (filters.dataType.time === 'Weekly') {
                    const firstDayOfWeek = new Date(item.date);
                    firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay());
                    const lastDayOfWeek = new Date(firstDayOfWeek);
                    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
                    key = firstDayOfWeek.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit' }) + " - " + lastDayOfWeek.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit' });
                }
                else if (filters.dataType.time === 'Monthly') {
                    const date = new Date(item.date);
                    key = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
                }
                if (key !== dateOptions[selectedDateIndex]) {
                    return;
                }
                item.values.forEach(item => {
                    if (!filters.area.includes(item.area) || !filters.function.includes(item.function)) {
                        return;
                    }
                    const existing = newData.find(newItem => newItem.name === item.area);
                    if (existing) {
                        existing.value += item.value;
                        return;
                    }
                    else {
                        count++;
                        // id is used to get the color from config
                        const id = Object.keys(chartConfigPerArea).find(key => chartConfigPerArea[key as keyof typeof chartConfigPerArea].label === item.area);
                        newData.push({
                            name: item.area,
                            id: id,
                            value: item.value,
                            fill: `var(--chart-${count})`,
                        });// For debug
                    }
                });

            });
            return newData;
        }
    }

    const getFilteredChartConfig: () => ChartConfig = () => {
        //No need to filter here since on pie chart we get the color from data directly
        //Also we are not showing legend.
        if (filters.area.length === 0) return {};
        if (filters.area.length === 1 || selectedArea !== "all") {
            return chartConfigPerDate;
        }
        else {
            return chartConfigPerArea;
        }
    }
    React.useEffect(() => {
        // Generate date options based on selected area
        const maxDate = new Date(Math.max(...baseData.map(d => new Date(d.date).getTime())));
        let options: string[] = [];
        const data = baseData.map(d => new Date(d.date)).filter(d => {
            return filters.timeFrame < 0 || maxDate.getTime() - d.getTime() <= filters.timeFrame * 24 * 60 * 60 * 1000;
        });
        if (filters.dataType.time === 'Daily') {
            options = Array.from(new Set(data.map(d => d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }))));
        }
        else if (filters.dataType.time === 'Weekly') {
            const weekSet = new Set<string>();

            data.forEach(date => {
                const firstDayOfWeek = new Date(date);
                firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay());
                const lastDayOfWeek = new Date(firstDayOfWeek);
                lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
                const weekRange = firstDayOfWeek.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit' }) + " - " + lastDayOfWeek.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit' });
                weekSet.add(weekRange);
            });
            options = Array.from(weekSet);
        }
        else if (filters.dataType.time === 'Monthly') {
            options = Array.from(new Set(data.map(date => {
                return date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
            })));
        }
        const newOptions = options.reverse();
        const oldSelectedDate = dateOptions[selectedDateIndex];
        // If the old selected date is still in options, keep it selected
        const newSelectedDateIndex = newOptions.indexOf(oldSelectedDate);
        setDateOptions(newOptions);
        setSelectedDateIndex(newSelectedDateIndex !== -1 ? newSelectedDateIndex : 0); // Default to the most recent date
    }, [filters.dataType.time, filters.timeFrame]);
    React.useEffect(() => {
        setNumAreas(filters.area.length);
        if (!filters.area.includes(selectedArea)) {
            setSelectedArea("all");
        }
    }, [filters.area]);
    React.useEffect(() => {
        numAreas === 1 && setSelectedArea(filters.area[0]);
    }, [selectedArea]);
    //Externally controlled period change
    React.useEffect(() => {
        if (periodSelected) {
            const index = dateOptions.indexOf(periodSelected);
            if (index !== -1) {
                setSelectedDateIndex(index);
            }
        }
    }, [periodSelected]);
    return (
        <Card className={`gap-0 ${props.className}`} {...filterClassProps}
            style={{
                width: onMobile ? '100%' : 'calc(2*250px + 0.5rem)',
                padding: '0.25rem 0',
            }}>
            <div className='text-center flex flex-col items-center gap-2 pb-2 '>
                <div className='font-bold  text-xl font-lato'>
                    {
                        numAreas === 0 ? " Selecione ao menos uma área para ver a distribuição." : numAreas === 1 ? filters.area[0] : "Distribuição por Área" + (selectedArea == 'all' ? "" : ": " + selectedArea)
                    }
                </div>
                {numAreas > 1 &&
                    <div className='flex w-full gap-2 items-center text-lg font-inter font-[300] justify-center dark:text-gray-300'>
                        Analisar área:
                        <Select
                            value={selectedArea}
                            onValueChange={setSelectedArea}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Selecione uma área" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem key={"allAreas"} value="all">Todas as Áreas</SelectItem>
                                {filters.area.map(area => (
                                    <SelectItem key={area} value={area}>
                                        {area}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                }
            </div>
            <div className={`my-2 h-[300px] w-full flex justify-center items-center ${selectedArea === "all" ? "setCursor" : ""} `}>
                <ChartContainer config={getFilteredChartConfig()}
                    className="[&_.recharts-pie-label-text]:fill-foreground [&_.recharts-pie-label-text]:break-words [&_.recharts-pie-label-text]:text-wrap mx-auto aspect-square max-h-[300px] pb-0 w-full hover:pointer">
                    <PieChart>
                        <ChartTooltip
                            content={<ChartTooltipContent />}
                        />
                        <Pie data={getFilteredData()} dataKey="value" label={
                            ({ name, percent }) => {
                                return onMobile ? ` ${(percent * 100).toFixed(0)}%` : `${getFilteredChartConfig()[name]?.label || name}`
                            }}
                            nameKey="name"
                            onClick={(props) => {
                                // console.log("Clicked", props);
                                const name = props?.name || "";
                                if (selectedArea === "all" && availableAreas.includes(name)) {
                                    setSelectedArea(name);
                                }
                            }}
                        >
                            <LabelList
                                dataKey="value"
                                className="fill-background font-inter font-bold"
                                stroke="2"
                                fontSize={20}
                                formatter={(value: string) => `${value}`}

                            />

                        </Pie >
                        {onMobile && <ChartLegend content={<ChartLegendContent nameKey='id' />}
                            className="flex-wrap gap-2  *:justify-center" />}
                    </PieChart>
                </ChartContainer>
            </div>
            <hr />
            <div className='text-center m-0 gap-1 p-2 flex flex-col'>
                <div className='flex w-full gap-2 items-center text-lg font-inter font-[300] justify-center dark:text-gray-300 '>
                    <div className=''>Periodo :</div>
                    <Select
                        value={selectedDateIndex.toString()}
                        onValueChange={(value) => {
                            const index = parseInt(value);
                            if (isNaN(index) || index < 0 || index >= dateOptions.length) {
                                setSelectedDateIndex(dateOptions.length - 1);
                            }
                            else {
                                setSelectedDateIndex(parseInt(value));
                            }
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecione uma data" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem key={"last"} value="-1">Última </SelectItem>
                            {dateOptions.map((dateStr, index) => (
                                <SelectItem key={dateStr} value={index.toString()}>
                                    {dateStr}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className='flex gap-2 items-center text-2xl font-inter justify-center mt-2'>
                    Total:
                    <CountUp
                        from={0}
                        to={getFilteredData().reduce((a, b) => a + b.value, 0)}
                        duration={1}
                        separator="."
                    />
                </div>
                <div className='text-center text-sm text-muted-foreground font-inter'>
                    de funcionarios {filters.dataType.time === 'Hourly' ? "nesta hora" : (filters.dataType.time === 'Daily' ? "neste dia" : (filters.dataType.time === 'Weekly' ? "nesta semana" : "neste mês"))}
                    {numAreas > 1 && selectedArea !== "all" ? " na área: " + selectedArea : ""}
                    {numAreas === 1 ? " na área: " + filters.area[0] : ""}
                    {numAreas > 1 && selectedArea === "all" ? " nas áreas selecionadas" : ""}
                    .
                </div>
            </div>

        </Card >
    );
};

export default PieCard;