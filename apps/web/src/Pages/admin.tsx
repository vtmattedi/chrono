import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useGlobals } from '@/Providers/Globals';
import { useAlert } from '@/Providers/Alerts';

const Admin: React.FC = () => {
    const [users, setUsers] = React.useState<any>([]);
    const [sessions, setSessions] = React.useState<any>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [lastFetched, setLastFetched] = React.useState<Date>(new Date());
    const getDateDiff = () => {
        const diff = Math.floor((new Date().getTime() - lastFetched.getTime()) / 1000);
        return `${diff} seconds ago`;
    }
    const { token, alias } = useGlobals();
    const { useToast } = useAlert();
    const [colors, setColors] = React.useState<string[]>([]);
    React.useEffect(() => {
        const availableColors = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
            '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
            '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
            '#C2C2F0', '#FFB3E6', '#FF6666', '#C2F0C2', '#FFCC99'];

        setColors(users.map((_: any, index: number) => availableColors[index % availableColors.length]));

    }, [users])

    const fetchData = async () => {
        // setLoading(true);
        Promise.all([
            fetch('http://localhost:4500/api/listusers').then(res => res.json()),
            fetch('http://localhost:4500/api/listsessions').then(res => res.json())
        ]).then(([usersData, sessionsData]) => {
            console.log('Fetched users and sessions:', usersData.users, sessionsData.sessions);
            setUsers(usersData.users);
            setSessions(sessionsData.sessions);
            setLastFetched(new Date());
        }).catch(error => {
            console.error('Error fetching data:', error);
        }).finally(() => {
            console.log('Finished fetching data');
            setLoading(false);
        });
    };
    React.useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 1);
        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <Card className='m-4 p-4'>
                <div className='flex flex-row items-center justify-between w-full px-4'>
                    <h1 className='font-audiowide text-2xl'>Admin Panel</h1>
                    <div className='flex flex-row items-center gap-1'>
                        {!loading && <Button onClick={fetchData} className='h-6'><RotateCcw />Refresh</Button>}
                        <p className='text-sm text-muted-foreground'>
                            {loading ? (<>Loading...</>) : (<>{getDateDiff()}</>)}
                        </p>
                    </div>
                </div>
                <div className='w-full flex gap-2 text-wrap'
                    style={{ wordBreak: 'break-all' }}
                >
                    <strong className='w-20'>Token:</strong> {token}
                </div>
                <div className='w-full flex gap-2 text-wrap'>
                    <strong className='w-20'>Alias:</strong> {alias}
                </div>

                <Card >
                    <div className='flex flex-row items-center justify-between w-full px-4 mt-4'>
                        <h2 className='font-audiowide text-xl'>Users</h2>
                    </div>
                    <table className='w-full'>
                        <thead>
                            <tr>
                                <th className='text-left p-2'>ID</th>
                                <th className='text-left p-2'>Alias</th>
                                <th className='text-left p-2'>IP</th>
                                <th className='text-left p-2'>Sockets</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user: any, index: number) => (
                                <tr key={user.id} className='border-t'>
                                    <td className='p-2'
                                        style={{ color: colors[index] }}
                                    >{user.userId}</td>
                                    <td className='p-2'>{user.alias}</td>
                                    <td className='p-2'>{user.ip}</td>
                                    <td className='p-2'>{user.socketId.length}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
                <div className='flex justify-center '>
                    <Button className='w-40' onClick={() => {
                        fetch('http://localhost:4500/api/newsession', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                teams: ['Equipe 1', 'Equipe 2', 'Equipe 3', 'Equipe 4', 'Equipe 5'],
                                initialTime: 300,
                                start: true
                            }),
                        }).then(res => res.json()).then(data => {
                            useToast('success', 'Session created with ID: ' + data.sessionId);
                        }).catch(err => {
                            useToast('error', 'Error creating session: ' + err.message);
                        });
                    }}>Start New Session</Button>
                </div>
                <Card >
                    <div className='flex flex-row items-center justify-between w-full px-4 mt-4'>
                        <h2 className='font-audiowide text-xl'>Sessions</h2>
                    </div>
                    <table className='w-full'>
                        <thead>
                            <tr>
                                <th className='text-left p-2'>ID</th>
                                <th className='text-left p-2'>Owner</th>
                                <th className='text-left p-2'>Listeners</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((session: any) => {
                                const userIndex = users.findIndex((u: any) => u.userId === session.owner);
                                let color = '#000000';
                                if (userIndex !== -1) {
                                    color = colors[userIndex];
                                }

                                return (
                                    <tr key={session.id} className='border-t'>
                                        <td className='p-2'>{session.sessionId}</td>
                                        <td className='p-2'
                                            style={{ color: color }}
                                        >{session.owner}</td>
                                        <td className='p-2'>{session.listeners}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            </Card>
        </div>
    );
};

export default Admin;