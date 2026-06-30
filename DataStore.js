export class DataStore {
    constructor() {
        this.time = [];
        this.temp = [];
        this.hum = [];
        this.press = [];
        this.oldestKey = null;
    }

    appendRecord(timestamp, temp, hum, press) {
        this.time.push(timestamp);
        this.temp.push(temp);
        this.hum.push(hum);
        this.press.push(press);
    }

    prependRecords(times, temps, hums, presses, oldestKey) {
        this.time.unshift(...times);
        this.temp.unshift(...temps);
        this.hum.unshift(...hums);
        this.press.unshift(...presses);
        
        if (oldestKey) {
            this.oldestKey = oldestKey;
        }
    }
}