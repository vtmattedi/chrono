import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, LineChart, Line, BarChart, Bar } from "recharts"

import type { ChartConfig } from "@/components/ui/chart"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import {
    AreaChartIcon,
    BarChartIcon,
    ChartLineIcon,
    Spline,
    GitCommitHorizontal

} from "lucide-react"
export type ChartData = {

    date: string;
    caldeireiro: number;
    eletricista: number;
    mecanico: number;
    operador: number;
    pintor: number;
}


// Helper function to generate gradients
const genGrads = (name: string, color: string) => {
    return <linearGradient id={`fill${name}`} x1="0" y1="0" x2="0" y2="1" key={name}>
        <stop
            offset="5%"
            stopColor={color}
            stopOpacity={0.8}
        />
        <stop
            offset="95%"
            stopColor={color}
            stopOpacity={0.1}
        />
    </linearGradient>
}

// Function to generate chart based on type
const genChart = (type: string, data: any[], chartConfig: ChartConfig, useSpline: boolean, periodChange?: (newPeriod: string) => void): React.JSX.Element => {
    // Improves legend and tooltip by filtering only the selected functions
    // Do the same for area when implementing pie chart
    const Ydomain = <YAxis domain={[0, (dataMax: number) => Math.round(dataMax * 1.05)]} />;
    const Legend = <ChartLegend content={<ChartLegendContent />} className="flex-wrap gap-2  *:justify-center" />;
    const _onClick = (props:any) => {
        if (!periodChange) return;
        if (props && props.activeLabel) {
            periodChange(props.activeLabel);
        }
    }
    
    if (type === "area") {
        return (
            <AreaChart
                accessibilityLayer
                data={data}
                margin={{
                    left: 6,
                    right: 6,
                }}
                onClick={(props) => {
                   _onClick(props);
                }}
            >
                <CartesianGrid vertical={true} />
                <XAxis
                    dataKey="date"
                    tickLine={true}
                    axisLine={true}
                    tickMargin={2}
                    tickCount={30}
                />
                {Ydomain}
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <defs>
                    {
                        Object.entries(chartConfig).map(([key, config]) => genGrads(key, config.color || "blue"))
                    }
                </defs>
                {
                    Object.entries(chartConfig).map(([key, config]) => {
                        return (
                            <Area
                                dataKey={key}
                                type={useSpline ? "natural" : "linear"}
                                fill={`url(#fill${key})`}
                                fillOpacity={0.4}
                                stroke={config.color}
                                stackId="a"

                            />
                        )
                    })
                }
                {Legend}
            </AreaChart>)
    }

    if (type === "line") {
        return (
            <LineChart
                accessibilityLayer
                data={data}
                margin={{
                    left: 12,
                    right: 12,
                }}
                 onClick={(props) => {
                   _onClick(props);
                }}
            >
                <CartesianGrid vertical={true} />
                <XAxis
                    dataKey="date"
                    tickLine={true}
                    axisLine={true}
                    tickMargin={2}
                    tickCount={30}
                />
                {Ydomain}
                {
                    Object.entries(chartConfig).map(([key, config]) => {
                        return (
                            <Line
                                dataKey={key}
                                type={useSpline ? "natural" : "linear"}
                                stroke={config.color}
                                strokeWidth={2}
                                key={key}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        )

                    })
                }
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                {Legend}
            </LineChart>)
    }

    if (type === "bar") {
        return (
            <BarChart
                accessibilityLayer
                data={data}
                margin={{
                    left: 12,
                    right: 12,
                }}
                 onClick={(props) => {
                   _onClick(props);
                }}
            >
                <CartesianGrid vertical={true} />
                <XAxis
                    dataKey="date"
                    tickLine={true}
                    axisLine={true}
                    tickMargin={2}
                    tickCount={30}
                />
                {Ydomain}
                {
                    Object.entries(chartConfig).map(([key, config]) => {
                        return (
                            <Bar
                                dataKey={key}
                                fill={config.color}
                                key={key}
                            />
                        )

                    })
                }
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

                {Legend}
            </BarChart>
        )
    }

    // Should never reach here
    return <></>
}

export default function MainChart({ data, chartConfig, periodChange }: { data: ChartData[], chartConfig: ChartConfig, periodChange?: (newPeriod: string) => void }) {

    const [chartType, setChartType] = React.useState("area");
    const [useSpline, setUseSpline] = React.useState(true);

    return (

        <div className="w-full h-full  ">
            <div className="flex flex-row justify-between items-center px-4 mb-2 ">
                <ToggleGroup type="single" value={chartType} className=" border " aria-label="Chart Type Toggle"
                    onValueChange={(value) => {
                        if (value) setChartType(value)
                    }}>
                    <ToggleGroupItem value="area" className='hover:cursor-pointer'
                    ><AreaChartIcon /></ToggleGroupItem>
                    <ToggleGroupItem value="line" className='hover:cursor-pointer'
                    ><ChartLineIcon /></ToggleGroupItem>
                    <ToggleGroupItem value="bar" className='hover:cursor-pointer'
                    ><BarChartIcon /></ToggleGroupItem>
                    {/* <ToggleGroupItem value="pie" className='hover:cursor-pointer'
                    ><PieChartIcon /></ToggleGroupItem> */}

                </ToggleGroup>
                <ToggleGroup type="single" value={"" + useSpline} className={`border ${chartType == "area" || chartType == "line" ? "" : "hidden"}`} aria-label="Spline Toggle"
                    onValueChange={(value) => {
                        if (value) setUseSpline(value === "true")
                    }}>
                    <ToggleGroupItem value={'true'} className='hover:cursor-pointer'
                    ><Spline /></ToggleGroupItem>
                    <ToggleGroupItem value={'false'} className='hover:cursor-pointer'
                    ><GitCommitHorizontal /></ToggleGroupItem>
                </ToggleGroup>
            </div>
            <ChartContainer config={chartConfig}  className="setCursor">
                {genChart(chartType, data, chartConfig, useSpline, periodChange)}
            </ChartContainer>

        </div>

    )
}