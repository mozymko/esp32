import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onChildAdded, get, query, orderByKey, endBefore, limitToLast } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export class FirebaseService {
    constructor(config) {
        this.app = initializeApp(config);
        this.db = getDatabase(this.app);
        this.auth = getAuth(this.app);
    }

    login(email, password) {
        return signInWithEmailAndPassword(this.auth, email, password);
    }

    onAuth(callback) {
        onAuthStateChanged(this.auth, callback);
    }

    async fetchInitial(store, limit = 1000) {
        const q = query(ref(this.db, "sensorData"), orderByKey(), limitToLast(limit));
        const snapshot = await get(q);
        return this._processSnapshot(snapshot, store, true);
    }

    subscribeToLive(store, onNewData) {
        const q = query(ref(this.db, "sensorData"), orderByKey(), limitToLast(1));

        onChildAdded(q, (snapshot) => {
            const ts = Number(snapshot.key);
            const val = snapshot.val();

            if (store.time.length > 0 && ts <= store.time[store.time.length - 1]) {
                return;
            }

            document.getElementById("temp").innerText = val.temp + "°C";
            document.getElementById("hum").innerText = val.humidity + "%";
            document.getElementById("press").innerText = val.pressure + " hPa";

            store.appendRecord(ts, val.temp, val.humidity, val.pressure);
            onNewData();
        });
    }

    async fetchOlder(store, limit) {
        if (!store.oldestKey) return false;

        const q = query(
            ref(this.db, "sensorData"),
            orderByKey(),
            endBefore(store.oldestKey),
            limitToLast(limit)
        );

        const snapshot = await get(q);
        return this._processSnapshot(snapshot, store, false);
    }

    _processSnapshot(snapshot, store, isInitial) {
        if (!snapshot.exists()) return false;

        let firstKey = null;
        const times = [], temps = [], hums = [], presses = [];

        snapshot.forEach(child => {
            if (!firstKey) firstKey = child.key;
            const val = child.val();
            times.push(Number(child.key));
            temps.push(val.temp);
            hums.push(val.humidity);
            presses.push(val.pressure);
        });

        if (isInitial && times.length > 0) {
            store.time = times;
            store.temp = temps;
            store.hum = hums;
            store.press = presses;
            store.oldestKey = firstKey;
        } else if (times.length > 0) {
            store.prependRecords(times, temps, hums, presses, firstKey);
        }

        return times.length > 0;
    }
}