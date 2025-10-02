

import { userHandler } from '../app/Model/users';
import { logger_s } from '../app/Util/Logger';
import { Team } from './teams';

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
interface LogEntry {
    timestamp: Date;
    action: string;
    details: any;
}
class Chrono {
    private intervalId?: NodeJS.Timeout;
    public createdAt: Date = new Date();
    public teams: Team[] = [];
    private lastTick: number = 0;
    private nextTick: number = 0;
    private tickNumber: number = 0;
    public sessionId: string = '';
    private logData: LogEntry[] = [];
    public publicLogs: boolean = false;
    public idHasPrivilege: string[] = [];
    public isPublic: boolean = false;
    public owner: string = '';
    public avgTickTime: number = 0;
    public countedTicks: number = 0;
    public listeners: string[] = [];
    private updatesSent: number = 0;
    public lastActivity: Date = new Date();
    public alias: string = '';
    public onUpdate = (data: any, full: boolean) => { };
    public onUsersChanged = (data: any) => { };

    constructor(owner: string, teamNames: string[] = [], initialTime: number, start: boolean = false, isPublic: boolean = false) {
        this.owner = owner;
        this.isPublic = isPublic;
        this.idHasPrivilege =[owner];
        this.sessionId = Math.random().toString(36).slice(6, 12);
        this.teams = teamNames.map(name => new Team(name, initialTime)); // default 5 minutes
        this.createdAt = new Date();
        this.alias = this.sessionId;
        this.startClock();
        this.log('created', 'created ' + (isPublic ? 'public' : '') + ' chrono with teams: ' + teamNames.join(', ') + ' initial time: ' + initialTime + 's');

        if (start) {
            this.startAll();
        }
    }
    public isCreatedBy(userId: string): boolean {
        return this.owner === userId;
    }
    // Check if a user is authorized (is the owner)
    public isAuthorized(userId: string): boolean {
        if (this.isPublic) return true;
        return this.idHasPrivilege.includes(userId);
    }

    private sendUpdates() {

        const full = this.updatesSent++ % 15 === 0; // every 15 ticks send full update
        this.onUpdate(this.getState(full), full);
    }
    public sendFullUpdate() {
        this.onUpdate(this.getState(true), true);
    }

    // Return teams configuration as JSON string
    public teamsConfig = () => {
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
            if (now - this.lastTick < 247) {
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
        this.log('action', 'reseted teams: ' + idList.join(', '));
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
        this.log('action', 'added time: ' + seconds + 's to teams: ' + idList.join(', '));
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
        this.log('action', 'started teams: ' + idList.join(', '));
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
        this.log('action', 'paused teams: ' + idList.join(', '));
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
        this.log('action', 'finished teams: ' + idList.join(', '));
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
        this.log('action', 'set speed: ' + speed + 'x to teams: ' + idList.join(', '));
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
    public listUsers() {
       const users = this.listeners.map(userId => {
            const user = userHandler.getUserById(userId);
            return {
                userId,
                alias: user?.alias || userId,
                role: userId === this.owner ? 'owner' : this.isAuthorized(userId) ? 'admin' : 'viewer'
            }
        });
         return users;
    }
    // Start all teams
    public startAll() {
        this.startTeam(this.teams.map((_, index) => index));
        this.startClock();
        this.sendUpdates();
    }

    // Get current state of all teams
    public getState(full: boolean = false) {
        this.lastActivity = new Date();
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

    public getSimpleState() {
        const states = this.teams.map(team => team.state);
        if (states.every(state => state === 'ready')) return 'ready';
        if (states.every(state => state === 'finished')) return 'finished';
        if (states.some(state => state === 'running')) return 'running';
        if (states.some(state => state === 'paused')) return 'paused';
        return 'unknown';
    }

    private log (action: string, details: any) {
        this.logData.push({
            timestamp: new Date(),
            action,
            details
        });
    }

    public getLog() {
        return this.logData.map(entry => (
            `[${entry.timestamp.toISOString()}] ${entry.action}: ${typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details)}`
        )).join('\n');
    }

    public modifyPrivileges(userId: string, demote: boolean) {
        if (demote === true) {
            if (this.idHasPrivilege.includes(userId)) {
                this.idHasPrivilege = this.idHasPrivilege.filter(id => id !== userId);
                this.log('privilege', `removed privilege from user ${userId}`);
            }
        }
        else {
            if (!this.idHasPrivilege.includes(userId)) {
                this.idHasPrivilege.push(userId);
                this.log('privilege', `added privilege to user ${userId}`);
            }
        }
        logger_s(`User ${userId} ${demote ? 'removed' : 'granted'} admin privileges on chrono ${this.sessionId}`, 'Chrono.modifyPrivileges');
        this.onUsersChanged(this.listUsers());
    }

}

export default Chrono;