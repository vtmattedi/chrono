
import { start } from 'repl';
import { Team } from './Teams';
import { time } from 'console';

/**
 * Represents a multi-team timer/chronometer system with support for multiple teams, adjustable speeds, and state management.
 * 
 * The `Chrono` class manages a collection of `Team` instances, each with its own timer, state, and speed. It provides methods to start, pause, finish, and modify timers for individual teams or all teams at once. The class also handles periodic ticking, drift correction, and notifies listeners of state changes.
 * 
 * @remarks
 * - The timer operates using a high-frequency interval and supports speeds of 0.5x, 1x, 2x, and 4x.
 * - State updates are sent via the `onUpdate` callback.
 * - Designed for real-time applications such as games or competitions where multiple teams need synchronized timers.
 * 
 * @example
 * ```typescript
 * const chrono = new Chrono('ownerId', ['Red', 'Blue'], 300, true);
 * chrono.startTeam([0]); // Start the timer for the first team
 * chrono.pauseTeam([1]); // Pause the timer for the second team
 * ```
 * 
 * @property {Team[]} teams - The list of teams managed by this chronometer.
 * @property {string} sessionId - Unique session identifier for this instance.
 * @property {number} avgTickTime - Average time per tick, useful for diagnostics.
 * @property {number} countedTicks - Number of ticks counted since start.
 * @property {string[]} listeners - List of listeners for updates.
 * @property {(data: any, full: boolean) => void} onUpdate - Callback invoked on state updates.
 * 
 * @method isAuthorized - Checks if a user is authorized to control the chronometer.
 * @method startClock - Starts the internal ticking mechanism.
 * @method stopClock - Stops the ticking mechanism.
 * @method rearm - Rearms (resets) the specified teams.
 * @method addTime - Adds time to the specified teams.
 * @method startTeam - Starts the timer for the specified teams.
 * @method pauseTeam - Pauses the timer for the specified teams.
 * @method finishTeam - Marks the specified teams as finished.
 * @method setSpeed - Sets the speed for the specified teams.
 * @method startAll - Starts all teams' timers.
 * @method getState - Retrieves the current state of all teams.
 * @method sendFullUpdate - Sends a full state update to listeners.
 * @method TeamsConfig - Returns the configuration of teams as a JSON string.
 * 
 * @constructor
 * @param {string} owner - The user ID of the owner/controller.
 * @param {string[]} [teamNames=[]] - Names of the teams to initialize.
 * @param {number} initialTime - Initial time (in seconds) for each team.
 * @param {boolean} [start=false] - Whether to start all timers immediately.
 */
class Chrono {
    private intervalId?: NodeJS.Timeout;
    private createdAt: Date = new Date();
    public teams: Team[] = [];
    private lastTick: number = 0;
    private nextTick: number = 0;
    private tickNumber: number = 0;
    public sessionId: string = '';
    private logData: string = '';
    private owner: string = '';
    public avgTickTime: number = 0;
    public countedTicks: number = 0;
    public listeners: string[] = [];
    public onUpdate = (data: any, full: boolean) => { };
    
    constructor(owner: string, teamNames: string[] = [], initialTime: number, start: boolean = false) {
        this.owner = owner;
        this.sessionId = Math.random().toString(36).slice(2, 12);
        this.teams = teamNames.map(name => new Team(name, initialTime)); // default 5 minutes
        this.createdAt = new Date();
        this.startClock();
        if (start) {
            this.startAll();
        }
    }

    // Check if a user is authorized (is the owner)
    public isAuthorized(userId: string): boolean {
        return this.owner === userId;
    }
    
    private sendUpdates() {
        this.onUpdate(this.getState(false), false);
    }
    public sendFullUpdate() {
        this.onUpdate(this.getState(true), true);
    }

    // Return teams configuration as JSON string
    public TeamsConfig = () => {
        const data = {
            name: this.teams.map(t => t.name),
            baseTime: this.teams[0]?.baseTime || 0,
        }
        return JSON.stringify(data);
    }

    /// Starts the internal ticking mechanism.
    public startClock() {
        if (this.intervalId) return; // already started
        this.lastTick = performance.now();
        this.intervalId = setInterval(() => {
            const now = performance.now();
            const delta = Number(now - this.lastTick)
            if (now - this.lastTick < 245) {
                return; // not enough time passed
            }
            this.avgTickTime += delta;
            this.countedTicks++;
            this.lastTick = now;
            this.tickNumber = (this.tickNumber + 1) % 8;// 0 to 7 cycle 0.5 to 4x speed
            let updated = false;
            let finished = false;
            for (const team of this.teams) {
                // Determine if this tick should affect the team based on its speed
                const mod = team.speed === 0.5 ? 8 : team.speed === 1 ? 4 : team.speed === 2 ? 2 : team.speed === 4 ? 1 : 0;

                if (this.tickNumber % mod !== 0) {
                    continue;
                }
                if (team.state === 'running' && team.timeLeft > 0) {
                    team.timeLeft -= 1;
                    team.timeRunning = (team.timeRunning || 0) + 1 / team.speed!;
                    updated = true;
                }
                if (team.state === 'paused' && team.timeLeft > 0) {
                    team.timePaused = (team.timePaused || 0) + 1 / team.speed!;
                    updated = true;
                }
                const teamFinished = team.checkFinish();
                if (teamFinished) {
                    finished = true;
                }
                team.correctDrift(now);

            }
            if (finished) {
                this.sendFullUpdate();
            }
            else if (updated) {
                this.sendUpdates();
            }
        }, 5);
    }

    /// Stops the internal ticking mechanism.
    public stopClock() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

    // Rearm (reset) the specified teams
    public rearm(idList: number[]) {
        let updated = false;
        idList.forEach(id => {
            if (this.teams[id]) {
                this.teams[id].rearm();
                updated = true;
            }
        });
        if (updated) {
            this.sendUpdates();
        }
        return updated;
    }

    public addTime(idList: number[], seconds: number) {
        let updated = false;
        idList.forEach(id => {
            if (this.teams[id]) {
                this.teams[id].addTime(seconds);
                updated = true;
            }
        });
        if (updated)
            this.sendUpdates();
        return updated;
    }
    public startTeam(idList: number[]) {
        let updated = false;
        idList.forEach(id => {
            if (this.teams[id]) {
                this.teams[id].start();
                updated = true;
            }
        });
        if (updated)
            this.sendUpdates();
        return updated;
    }
    public pauseTeam(idList: number[]) {
        let updated = false;
        idList.forEach(id => {
            if (this.teams[id]) {
                this.teams[id].pause();
                updated = true;
            }
        });
        if (updated)
            this.sendUpdates();
        return updated;
    }
    public finishTeam(idList: number[]) {
        let updated = false;
        idList.forEach(id => {
            if (this.teams[id] && this.teams[id].state !== 'finished') {
                this.teams[id].state = 'finished';
                this.teams[id].finishTime = new Date();
                updated = true;
            }
        });
        if (updated) {
            this.sendFullUpdate();
        }
        return updated;
    }
    public setSpeed(idList: number[], speed: 0.5 | 1 | 2 | 4) {
        let updated = false;
        idList.forEach(id => {
            if (this.teams[id]) {
                this.teams[id].speed = speed;
                updated = true;
            }
        });
        if (updated) {
            this.sendUpdates();
        }
        return updated;
    }

    // Start all teams
    public startAll() {
        this.teams.forEach(team => {
            team.start();
        });
        this.startClock();
        this.sendUpdates();
    }

    // Get current state of all teams
    public getState(full: boolean = false) {
        const data: any[] = this.teams.map(team => {
            const _data: any =
            {
                name: team.name,
                state: team.state,
                timeLeft: team.timeLeft,
                speed: team.speed,
                finishTime: team.finishTime || null,
                startTime: team.startTime || null
            }
            if (full) {
                _data.baseTime = team.baseTime;
                _data.timeAdded = team.timeAdded;
                _data.timeSubtracted = team.timeSubtracted;
                _data.timePaused = team.timePaused;
                _data.timeRunning = team.timeRunning;
                _data.finalDrift = team.finalDrift;
            }
            return _data;
        });
        return data;
    }

    public getLog() {
        return this.logData;
    }

}

class ChronoHandler {
    private chronos: Map<string, Chrono> = new Map();
    private afkInterval?: NodeJS.Timeout;
    public onChronoCreated = (chrono: Chrono) => { };
    public onChronoDeleted = (sessionId: string) => { };
    public createChrono(ownerId: string, teams: string[], initialTime: number, start: boolean = false): Chrono {
        const chrono = new Chrono(ownerId, teams, initialTime, start);
        this.chronos.set(chrono.sessionId, chrono);
        this.onChronoCreated(chrono);
        return chrono;
    }
    public addListener(sessionId: string, userId: string): number {
        const chrono = this.chronos.get(sessionId);
        if (!chrono) return -1;
        chrono.listeners.push(userId);
        return chrono.listeners.length;
    }

    public listenersCount(sessionId: string): number {
        const chrono = this.chronos.get(sessionId);
        if (!chrono) return -1;
        return chrono.listeners.length;
    }

    public listChronos(): { sessionId: string; owner: string; listeners: number }[] {
        const res: any[] = [];
        this.chronos.forEach((chrono) => {
            res.push({
                sessionId: chrono.sessionId,
                owner: chrono['owner'],
                listeners: chrono.listeners.length
            });
        });
        return res;
    }

    public removeListener(userId: string): string[] {
        let found = [];
        for (const chrono of this.chronos.values()) {
            const old = Array.from(chrono.listeners);
            if (old.includes(userId)) {
                chrono.listeners = chrono.listeners.filter(id => id !== userId);
                found.push(chrono.sessionId);
            }
        }
        return found;
    }

    public killChrono(sessionId: string): boolean {
        const chrono = this.chronos.get(sessionId);
        if (!chrono) return false;
        this.chronos.delete(sessionId);
        this.onChronoDeleted(sessionId);
        return true;
    }

    public dispatchAction(sessionId: string, userId: string, action: { type: string, index: number[] }): { result: boolean, message: string } {
        const chrono = this.chronos.get(sessionId);
        if (!chrono) return { result: false, message: "Chrono not found" };
        if (!chrono.isAuthorized(userId)) return { result: false, message: "User not authorized. " };
        const [_action, _values] = action.type.split(':');
        if (_action === 'start') {
            chrono.startTeam(action.index);
            return { result: true, message: "Teams started" };
        }
        else if (_action === 'pause') {
            chrono.pauseTeam(action.index);
            return { result: true, message: "Teams paused" };
        }
        else if (_action === 'finish') {
            chrono.finishTeam(action.index);
            return { result: true, message: "Teams finished" };
        }
        else if (_action === 'rearm') {
            chrono.rearm(action.index);
            return { result: true, message: "Teams rearmed" };
        }
        else if (_action === 'add') {
            const seconds = parseInt(_values) || 0;
            if (seconds === 0) return { result: false, message: "Invalid seconds to add" };
            chrono.addTime(action.index, seconds);
            return { result: true, message: "Teams time modified" };
        }
        else if (_action === 'speed') {
            const speed = parseFloat(_values) as (0.5 | 1 | 2 | 4);
            if (![0.5, 1, 2, 4].includes(speed)) return { result: false, message: "Invalid speed" };
            chrono.setSpeed(action.index, speed);
            return { result: true, message: "Teams speed set" };
        }
        return { result: false, message: "Unknown action" };
    }

    public startAfkCheck(timeoutMinutes: number = 10) {
        this.stopAfkCheck();
        this.afkInterval = setInterval(() => {
            const now = new Date();
            this.chronos.forEach((chrono, sessionId) => {
                const diff = (now.getTime() - chrono['createdAt'].getTime()) / 1000 / 60; // in minutes
                if (diff > 30 && chrono.listeners.length === 0) {
                    console.log(`Killing chrono ${sessionId} due to inactivity`);
                    this.killChrono(sessionId);
                }
            });
        }, timeoutMinutes * 60 * 1000);
    }
    public stopAfkCheck() {
        if (this.afkInterval) {
            clearInterval(this.afkInterval);
            this.afkInterval = undefined;
        }
    }
}
export const chronoHandler = new ChronoHandler();
export default Chrono;