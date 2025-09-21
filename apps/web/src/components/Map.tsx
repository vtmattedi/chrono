import React, { useEffect, useState } from 'react';
import { TileLayer, useMap, Marker, Popup } from 'react-leaflet'
import { LocateFixed, Minus, Plus, ShieldClose } from 'lucide-react';
import AnexoI from '../assets/AnexoI.json';
import "./map.css" // darkmode for the zoom buttons
import L from 'leaflet';
import { Label, Pie, PieChart } from "recharts"
import mpGreen from '../assets/mp_green.svg';
import mpBlue from '../assets/mp_blue.svg';
import { useAlert } from '@/Providers/Alerts';
import {
    ChartContainer,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
} from "@/components/ui/chart"
import { chartConfigPerDate, getDataPerArea } from '../assets/util/AttachedData';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from './ui/button';

const areaTypeColors = {
    Produtiva: {
        color: 'green',
        iconUrl: mpGreen
    },
    Complementar: {
        color: 'orange',
        iconUrl: mpBlue
    },
}
interface IViewOption {
    value: string;
    label: string;
    url: string;
}
const viewOptions: IViewOption[] = [
    {
        value: 'satellite',
        label: 'Satélite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    },
    {
        value: 'streets',
        label: 'Normal',
        url: 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    },

]

const InnerMap: React.FC = () => {
    const map = useMap(); // map instance hook from react-leaflet
    const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
    const [areaFilter, setAreaFilter] = useState<string>('All') // All, Produtiva, Complementar
    const [view, setView] = useState<IViewOption>(viewOptions[1]); // satellite or streets tile layer
    // Get locations from AnexoI
    const locations = AnexoI.areas as { nome: string, tipo: string, latitude: number, longitude: number }[];
    // tailwind classes for zoom buttons
    const zoomClass = 'bg-gray-100 text-black dark:bg-black dark:hover:bg-gray-800 hover:bg-gray-300 border-b border-gray-300 dark:border-gray-700  disabled:opacity-50 disabled:cursor-not-allowed h-8 w-8 flex items-center justify-center';
    // Keep track of zoom level to disable buttons
    // must be a state to trigger re-render
    const [zoom, setZoom] = useState(map.getZoom());
    useEffect(() => {
        map.on('zoomend', () => {
            setZoom(map.getZoom());
        });
        return () => {
            map.off('zoomend');
        }
    }, [map]);
    const { showAlert } = useAlert();
    return (

        <>
            <TileLayer
                url={view.url}
            />
            {/* Controls, position must be absolute */}
            <div
                style={{
                    position: ' absolute',
                    top: '2px',
                    left: '2px',
                    padding: '10px',
                    zIndex: 699,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    borderRadius: '5px',
                }} className='bg-[#cccccc60] dark:bg-[#33333360] font-inter  gap-1'
                onClick={(e) => {
                    e.stopPropagation(); // Prevent map click  (Most of the time)
                }}
            >
                {/* Zoom Controls + Current Location */}
                <div className='flex gap-[1px] flex-col'>
                    <Button onClick={() => map.zoomIn()} disabled={zoom === map.getMaxZoom()}
                        className={zoomClass}
                        aria-label='Zoom In'
                    >
                        <Plus className='h-4 w-4' />
                    </Button>
                    <Button onClick={() => map.zoomOut()} disabled={zoom === map.getMinZoom()} className={zoomClass}
                        aria-label='Zoom Out'>
                        <Minus className='h-4 w-4' />
                    </Button>
                    <Button onClick={() => {
                        map.locate().on("locationfound", function (e) {
                            setCurrentPos([e.latlng.lat, e.latlng.lng]);
                            map.flyTo(e.latlng, map.getZoom());
                        }).on("locationerror", function (e) {
                            showAlert(
                                <div className='flex items-center gap-2'><ShieldClose color='darkred' /> Não foi possível obter a localização.</div>,
                                <div><strong>Erro {e.code}:</strong> {e.message}</div>
                            );
                        });
                    }} className={zoomClass}
                        aria-label='Current Location'>
                        <LocateFixed className='h-4 w-4' />
                    </Button>
                </div>
                {/* Filters */}
                <div className='flex gap-2 flex-col'>
                    {/* View Select */}
                    <Select value={view.value} onValueChange={(val) => {
                        setView(viewOptions.find(option => option.value === val)!);
                    }}
                    >
                        <SelectTrigger className="w-[220px] bg-gray-100 dark:bg-black dark:hover:bg-gray-800">
                            <SelectValue placeholder="Selecionar Áreas" />
                        </SelectTrigger>
                        <SelectContent >
                            <SelectGroup defaultValue={areaFilter}>
                                <SelectLabel>Mapa</SelectLabel>
                                {
                                    viewOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value} onClick={() => setView(option)}>{option.label}</SelectItem>
                                    ))
                                }
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {/* Area Filter */}
                    <Select value={areaFilter} onValueChange={(val) => {
                        setAreaFilter(val)
                    }}>
                        <SelectTrigger className="w-[220px] bg-gray-100 dark:bg-black dark:hover:bg-gray-800">
                            <SelectValue placeholder="Selecionar Áreas" />
                        </SelectTrigger>
                        <SelectContent >
                            <SelectGroup defaultValue={areaFilter}>
                                <SelectLabel>Tipos de Áreas</SelectLabel>
                                <SelectItem value="All">Todas as Áreas</SelectItem>
                                <SelectItem value="Produtiva">Áreas Produtivas</SelectItem>
                                <SelectItem value="Complementar">Áreas Complementares</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div >

            {
                currentPos &&
                <Marker position={[currentPos[0], currentPos[1]]}
                    icon={L.icon({
                        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1waW4taWNvbiBsdWNpZGUtcGluIj48cGF0aCBkPSJNMTIgMTd2NSIvPjxwYXRoIGQ9Ik05IDEwLjc2YTIgMiAwIDAgMS0xLjExIDEuNzlsLTEuNzguOUEyIDIgMCAwIDAgNSAxNS4yNFYxNmExIDEgMCAwIDAgMSAxaDEyYTEgMSAwIDAgMCAxLTF2LS43NmEyIDIgMCAwIDAtMS4xMS0xLjc5bC0xLjc4LS45QTIgMiAwIDAgMSAxNSAxMC43NlY3YTEgMSAwIDAgMSAxLTEgMiAyIDAgMCAwIDAtNEg4YTIgMiAwIDAgMCAwIDQgMSAxIDAgMCAxIDEgMXoiLz48L3N2Zz4=',
                        className: 'bg-red',
                        iconSize: [40, 40], // size of the icon
                        iconAnchor: [20, 40], // point of the icon which will correspond to marker's location
                        popupAnchor: [0, -35] // point from which the popup should open relative to the iconAnchor
                    })}
                >
                    <Popup className='fill-black'
                        closeOnEscapeKey={true}
                    >
                        <div className='flex flex-col '>
                            <span className='bi bi-pin' /><span className='text-sm font-inter'> Localização Atual</span>
                        </div>
                    </Popup>
                </Marker>
            }
            {
                locations.filter(loc => loc.tipo === areaFilter || areaFilter === 'All').map((loc, idx) => {
                    const data = getDataPerArea().find(area => area.area === loc.nome)?.values || [];
                    // Final Data for the most recent date
                    const chartData = [] as { name: string, value: number, fill: string }[];
                    let count = 0; // Helper to assign colors
                    //Extract keys from the last object in data array (most recent date)
                    data && Object.keys(data[data.length - 1]).forEach(key => {
                        if (key !== 'date') {
                            count++;
                            chartData.push({
                                name: key,
                                value: data[data.length - 1][key] as number,
                                fill: `var(--chart-${count})`,
                            });
                        }
                    });
                    // Get the date and the time since the last update
                    const date = new Date(data[data.length - 1]?.date || '').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    });
                    const age_date = new Date().getTime() - new Date(data[data.length - 1]?.date || '').getTime();
                    const age_days = Math.floor(age_date / (1000 * 60 * 60 * 24));
                    const total = Object.keys(data[data.length - 1]).reduce((acc, key) => {
                        if (key !== 'date') {
                            acc += data[data.length - 1][key] as number;
                        }
                        return acc;
                    }, 0);
                    if (!data) return undefined;
                    return (
                        <Marker key={idx} position={[loc.latitude, loc.longitude]}
                            riseOnHover={true}
                            riseOffset={100}
                            keyboard={true}
                            icon={L.icon({
                                iconUrl: areaTypeColors[loc.tipo as keyof typeof areaTypeColors]?.iconUrl || areaTypeColors['Complementar'].iconUrl,
                                iconSize: [40, 40], // size of the icon
                                iconAnchor: [20, 40], // point of the icon which will correspond to marker's location
                                popupAnchor: [0, -35] // point from which the popup should open relative to the iconAnchor
                            })}
                        >
                            <Popup>
                                <div className="flex-1 pb-0 z-1002" style={{ zIndex: 10002 }}>
                                    <strong className='text-lg font-lato'>{loc.nome}</strong>
                                    <div className='flex text-sm  justify-between font-inter'>
                                        <span>{loc.tipo}</span>
                                        <span>{loc.latitude.toFixed(2)}, {loc.longitude.toFixed(2)}</span>
                                    </div>
                                    <div className="flex-1 pb-0">
                                        <ChartContainer
                                            config={chartConfigPerDate}
                                            className=" aspect-square max-h-[300px]  w-[300px]"
                                        >
                                            <PieChart>
                                                <ChartTooltip
                                                    cursor={true}
                                                    content={<ChartTooltipContent />}
                                                />
                                                <Pie
                                                    data={chartData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={60}
                                                    strokeWidth={5}
                                                >
                                                    <Label
                                                        content={({ viewBox }) => {
                                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                                return (
                                                                    <text
                                                                        x={viewBox.cx}
                                                                        y={viewBox.cy}
                                                                        textAnchor="middle"
                                                                        dominantBaseline="middle"
                                                                    >
                                                                        <tspan
                                                                            x={viewBox.cx}
                                                                            y={viewBox.cy}
                                                                            className="fill-foreground text-4xl font-bold font-lato subpixel-antialiased"
                                                                            fill='black'
                                                                        >
                                                                            {total}
                                                                        </tspan>
                                                                        <tspan
                                                                            x={viewBox.cx}
                                                                            y={(viewBox.cy || 0) + 24}
                                                                            className="fill-muted-foreground font-lato text-sm"
                                                                        >
                                                                            Funcionarios
                                                                        </tspan>
                                                                    </text>
                                                                )
                                                            }
                                                        }}
                                                    />
                                                </Pie>
                                                <ChartLegend
                                                    content={<ChartLegendContent nameKey="name" />}
                                                    className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
                                                />
                                            </PieChart>
                                        </ChartContainer>
                                    </div>
                                    <div className='font-lato'>
                                        <span className='flex justify-center'>Último Registro:</span>
                                        <div className='mt-2 flex justify-center items-center gap-2'>
                                            <span><strong className='font-inter'>{date}</strong></span>
                                            <span className='text-gray-500 text-sm'> ({age_days} dias atrás)</span>
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                })
            }
        </>

    );
};

export default InnerMap;