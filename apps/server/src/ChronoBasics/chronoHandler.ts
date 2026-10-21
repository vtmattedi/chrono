import { logger_i, logger_s } from "../app/Util/Logger";
import Chrono from "./chrono";

class ChronoHandler {
    private chronos: Map<string, Chrono> = new Map();
    private afkInterval?: NodeJS.Timeout;
    public onChronoCreated = (chrono: Chrono) => { };
    public onChronoDeleted = (sessionId: string) => { };
    public createChrono(ownerId: string, teams: string[], initialTime: number, start: boolean = false, isPublic: boolean = false): Chrono {
        const chrono = new Chrono(ownerId, teams, initialTime, start, isPublic);
        this.chronos.set(chrono.sessionId, chrono);
        this.onChronoCreated(chrono);
        return chrono;
    }
    public addListener(sessionId: string, userId: string): number {
        const chrono = this.chronos.get(sessionId);
        if (!chrono) return -1;
        if (!chrono.listeners.includes(userId)) {
            chrono.listeners.push(userId);
            chrono.onUsersChanged(chrono.listUsers());
        }
        return chrono.listeners.length;
    }

    public listenersCount(sessionId: string): number {
        const chrono = this.chronos.get(sessionId);
        if (!chrono) return -1;
        return chrono.listeners.length;
    }

    public listChronos(): { sessionId: string; owner: string; listeners: number, createdAt: Date }[] {
        const res: any[] = [];
        this.chronos.forEach((chrono) => {
            res.push({
                sessionId: chrono.sessionId,
                alias: chrono.alias,
                owner: chrono.owner,
                listeners: [...chrono.listeners],
                createdAt: chrono.createdAt,
                privileges: chrono.idHasPrivilege,
                public: chrono.isPublic,
                state: chrono.getSimpleState(),
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
                chrono.onUsersChanged(chrono.listUsers());
            }
            logger_s(`Removed listener ${userId} from chrono ${chrono.sessionId}`, 'ChronoHandler.removeListener', old, chrono.listeners);
        }
        return found;
    }

    public killChrono(sessionId: string): boolean {
        let chrono = this.chronos.get(sessionId);
        if (!chrono) return false;
        this.chronos.delete(sessionId);
        chrono.stopClock();
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
                const diff = (now.getTime() - chrono['lastActivity'].getTime()) / 1000 / 60; // in minutes
                if (diff > timeoutMinutes && chrono.listeners.length === 0) {
                    logger_i(`Killing chrono ${sessionId} due to inactivity`);
                    this.killChrono(sessionId);
                }
            });
        }, 30 * 60 * 1000);
    }
    public stopAfkCheck() {
        if (this.afkInterval) {
            clearInterval(this.afkInterval);
            this.afkInterval = undefined;
        }
    }

    public getChronoById(sessionId: string): Chrono | null {
        return this.chronos.get(sessionId) || null;
    }


}
export const chronoHandler = new ChronoHandler();