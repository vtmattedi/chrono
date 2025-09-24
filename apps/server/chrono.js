
class Chrono {
    constructor(admin_id) {
        this.lastTick = Date.now();
        this.tickNumber = 0;
        this.teams = [];
        this.id = 'chrono_' + Math.random().toString(36).substr(2, 9);
        this.interval = null;
        this.admin_id = admin_id;
        this.listeners = [];
        this.log = [];
    }

    start() {
        if (this.interval) {
            return; // Already running
        }
        this.interval = setInterval(() => {
            if (Date.now() - this.lastTick < 248) {
                return;
            }
        }, 5);
        console.log('Chrono started:', this.id);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log('Chrono stopped:', this.id);
        }
    }

    setTeams(names, baseTime){
        this.teams = names.map(name => ({
            name,
            baseTime,
            currentTime: baseTime
        }));
    }
}

export default Chrono;