export class ChartService {
    constructor() {
        this.tempPlot = null;
        this.humPlot = null;
        this.pressPlot = null;
        this.renderTimeout = null;
    }

    initCharts() {
        this.tempPlot = this._makePlot(document.getElementById("tempChart"), "Temp", "#ffa500", "#ffa50033", 0, 40);
        this.humPlot = this._makePlot(document.getElementById("humChart"), "Humidity", "#00bfff", "#00bfff33", 0, 100);
        this.pressPlot = this._makePlot(document.getElementById("pressChart"), "Pressure", "#00ff00", "#00ff0033", 950, 1050);
    }

    render(store, rangeHours, updateAxis = true) {
        if (!this.renderTimeout) {
            this.renderTimeout = requestAnimationFrame(() => {
                this.tempPlot.setData([store.time, store.temp]);
                this.humPlot.setData([store.time, store.hum]);
                this.pressPlot.setData([store.time, store.press]);

                if (updateAxis) {
                    this.updateRange(store, rangeHours);
                }
                
                this.renderTimeout = null;
            });
        }
    }

    updateRange(store, rangeHours) {
        if (rangeHours >= 1440) {
            const minTime = store.time.length > 0 ? store.time[0] : null;
            const maxTime = store.time.length > 0 ? store.time[store.time.length - 1] : null;
            if (minTime) {
                [this.tempPlot, this.humPlot, this.pressPlot].forEach(p => p.setScale('x', { min: minTime, max: maxTime }));
            }
            return;
        }

        const nowSec = Math.floor(Date.now() / 1000);
        const rangeSec = rangeHours * 3600;

        [this.tempPlot, this.humPlot, this.pressPlot].forEach(p => {
            if (p) p.setScale('x', { min: nowSec - rangeSec, max: nowSec });
        });
    }

    _makePlot(container, label, strokeColor, fillColor, min, max) {
        const opts = {
            width: container.clientWidth || 300,
            height: container.clientHeight || 200,
            axes: [
                { stroke: "white", grid: { stroke: "rgba(255,255,255,0.1)" } },
                { stroke: "white", grid: { stroke: "rgba(255,255,255,0.1)" } }
            ],
            scales: {
                x: { time: true, auto: false },
                y: { range: [min, max], auto: false }
            },
            series: [
                { label: "Time" },
                { label: label, stroke: strokeColor, fill: fillColor, width: 2 }
            ],
            cursor: { sync: { key: "syncGroup" } }
        };

        const u = new uPlot(opts, [[], []], container);

        new ResizeObserver(entries => {
            for (let entry of entries) {
                u.setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
            }
        }).observe(container);

        return u;
    }
}