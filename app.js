import { DataStore } from "./DataStore.js";
import { ChartService } from "./ChartService.js";
import { FirebaseService } from "./FirebaseService.js";

const firebaseConfig = {
    apiKey: "FIREBASE_API_KEY",
    databaseURL: "DATABASE_URL"
};

const store = new DataStore();
const firebaseService = new FirebaseService(firebaseConfig);
const chartService = new ChartService();

let started = false;
let rangeHours = 1;

function updateButtonStates(isFetchComplete = false) {
    if (store.time.length === 0) return;
    
    const latestTimestamp = store.time[store.time.length - 1];
    const oldestTimestamp = store.time[0];
    const availableHours = (latestTimestamp - oldestTimestamp) / 3600;

    document.querySelectorAll(".rangeBtn").forEach(btn => {
        const range = Number(btn.dataset.range);
        
        if (isFetchComplete || availableHours >= range || range === 1) {
            btn.disabled = false;
        }
    });
}

async function startApp() {
    if (started) return;
    started = true;

    document.getElementById("overlay").style.display = "none";
    chartService.initCharts();
    setupEventListeners();

    await firebaseService.fetchInitial(store, 1000);
    
    if (store.time.length > 0) {
        const lastIdx = store.time.length - 1;
        document.getElementById("temp").innerText = store.temp[lastIdx] + "°C";
        document.getElementById("hum").innerText = store.hum[lastIdx] + "%";
        document.getElementById("press").innerText = store.press[lastIdx] + " hPa";
    }

    updateButtonStates(false);

    chartService.render(store, rangeHours, true);

    firebaseService.subscribeToLive(store, () => {
        chartService.render(store, rangeHours, false);
    });

    backgroundFetchOlderData();
}

async function backgroundFetchOlderData() {
    let hasMore = true;
    let iterations = 0;

    while (hasMore && iterations < 25) {
        hasMore = await firebaseService.fetchOlder(store, 10000);
        
        if (hasMore) {
            chartService.render(store, rangeHours, false);
            updateButtonStates(false);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        iterations++;
    }

    updateButtonStates(true);
}

function setupEventListeners() {
    window.addEventListener("dblclick", () => {
        chartService.render(store, rangeHours, true);
    });

    document.querySelectorAll(".rangeBtn").forEach(btn => {
        btn.onclick = () => {
            if (btn.disabled) return;
            
            document.querySelectorAll(".rangeBtn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            rangeHours = Number(btn.dataset.range);
            
            chartService.render(store, rangeHours, true);
        };
    });
}

document.getElementById("loginBtn").onclick = () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    firebaseService.login(email, password)
        .catch(error => alert("Błąd: " + error.message));
};

firebaseService.onAuth((user) => {
    if (user) startApp();
});