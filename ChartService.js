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
                
                const currentMin = this.tempPlot ? this.tempPlot.scales.x.min : null;
                const currentMax = this.tempPlot ? this.tempPlot.scales.x.max : null;

                if (this.tempPlot) this.tempPlot.setData([store.time, store.temp], false);
                if (this.humPlot) this.humPlot.setData([store.time, store.hum], false);
                if (this.pressPlot) this.pressPlot.setData([store.time, store.press], false);

                if (updateAxis) {
                    this.updateRange(store, rangeHours);
                } else if (currentMin != null && currentMax != null) {
                    if (this.tempPlot) this.tempPlot.setScale('x', { min: currentMin, max: currentMax });
                    if (this.humPlot) this.humPlot.setScale('x', { min: currentMin, max: currentMax });
                    if (this.pressPlot) this.pressPlot.setScale('x', { min: currentMin, max: currentMax });
                }
                
                this.renderTimeout = null;
            });
        }
    }

    updateRange(store, rangeHours) {
        if (store.time.length === 0) return;

        const latestTimestamp = store.time[store.time.length - 1];
        const oldestTimestamp = store.time[0];

        let minTime, maxTime;

        if (rangeHours >= 1440) {
            minTime = oldestTimestamp;
            maxTime = latestTimestamp;
        } else {
            maxTime = latestTimestamp;
            minTime = latestTimestamp - (rangeHours * 3600);
        }

        if (this.tempPlot) this.tempPlot.setScale('x', { min: minTime, max: maxTime });
        if (this.humPlot) this.humPlot.setScale('x', { min: minTime, max: maxTime });
        if (this.pressPlot) this.pressPlot.setScale('x', { min: minTime, max: maxTime });
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
                x: { time: true },
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
                u.setSize({ 
                    width: entry.contentRect.width, 
                    height: entry.contentRect.height - 55 
                });
            }
        }).observe(container);

        return u;
    }
}