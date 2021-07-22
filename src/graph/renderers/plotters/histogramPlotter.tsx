import GraphPlotter, {
  GraphPlotterState,
} from "graph/renderers/plotters/graphPlotter";
import HistogramDrawer from "../drawers/histogramDrawer";
import PluginGraphPlotter, { applyPlugin } from "./PluginGraphPlotter";
import PlotData from "graph/dataManagement/plotData";
import { COMMON_CONSTANTS } from "assets/constants/commonConstants";
import dataManager from "graph/dataManagement/dataManager";

const leftPadding = 70;
const rightPadding = 50;
const topPadding = 50;
const bottomPadding = 50;

interface HistogramPlotterState extends GraphPlotterState {
  direction: "vertical" | "horizontal";
  bins: number;
}

export default class HistogramPlotter extends PluginGraphPlotter {
  direction: "vertical" | "horizontal" = "vertical";
  bins: number = 1;
  drawer: HistogramDrawer;

  globalMax: number = 0;
  rangeMin: number = 0;
  rangeMax: number = 0;

  setup(canvasContext: any) {
    super.setup(canvasContext);
  }

  protected setDrawerState(): void {
    const ranges = this.plotData.getXandYRanges();
    const binListMax = this.plotData.getBins(
      this.bins,
      this.direction == "vertical" ? this.xAxisName : this.yAxisName
    ).max;
    let hBins =
      this.width === undefined ? 2 : Math.round(this.width / (30 * this.scale));
    let vBins =
      this.height === undefined
        ? 2
        : Math.round(this.height / (30 * this.scale));
    hBins = Math.max(2, hBins);
    vBins = Math.max(2, vBins);
    const drawerState = {
      x1: leftPadding * this.scale,
      y1: topPadding * this.scale,
      x2: (this.width - rightPadding) * this.scale,
      y2: (this.height - bottomPadding) * this.scale,
      ibx: this.direction == "vertical" ? this.rangeMin : 0,
      iex: this.direction == "vertical" ? this.rangeMax : this.globalMax,
      iby: this.direction == "vertical" ? 0 : this.rangeMin,
      iey: this.direction == "vertical" ? this.globalMax : this.rangeMax,
      scale: this.scale,
      xpts: hBins,
      ypts: vBins,
      bins: this.bins,
      axis: this.direction,
    };

    this.drawer.setDrawerState(drawerState);
  }

  public getPlotterState() {
    return {
      ...super.getPlotterState(),
      direction: this.direction,
      bins: this.bins,
    };
  }

  public setPlotterState(state: HistogramPlotterState) {
    super.setPlotterState(state);
    this.direction = state.direction;
    this.bins = state.bins !== undefined ? state.bins : 0;
  }

  protected getBins() {
    this.binSize = 1;
    this.horizontalBinCount =
      this.width === undefined
        ? 2
        : Math.max(2, Math.round(this.width / (this.binSize * this.scale)));
    this.verticalBinCount =
      this.height === undefined
        ? 2
        : Math.max(2, Math.round(this.height / (this.binSize * this.scale)));
    this.bins =
      this.direction === "vertical"
        ? this.horizontalBinCount
        : this.verticalBinCount;
  }

  public update() {
    super.update();
  }

  public createDrawer(): void {
    this.drawer = new HistogramDrawer();
  }

  private DRAW_DIVISION_CONST = 3;
  @applyPlugin()
  public draw() {
    const hideY =
      this.plotData.xAxis === this.plotData.yAxis &&
      this.plotData.histogramAxis === "vertical";

    const hideX =
      this.plotData.xAxis === this.plotData.yAxis &&
      this.plotData.histogramAxis === "horizontal";

    super.draw({
      lines: false,
      vbins: (this.height - bottomPadding) / 50,
      hbins: (this.width - rightPadding) / 50,
      xAxisLabel: !hideX ? this.plotData.xAxis : "",
      yAxisLabel: !hideY ? this.plotData.yAxis : "",
    });
    const axis =
      this.direction === "vertical" ? this.xAxisName : this.yAxisName;

    let mainHist = this.plotData.getBins(this.bins, axis);

    let globlMax = mainHist.max;
    this.plotData.updateRanges();
    let range = this.plotData.ranges.get(axis);

    const overlaysObj = this.plotData.histogramOverlays;
    const overlays = [];

    this.rangeMin = range[0];
    this.rangeMax = range[1];

    for (const overlay of overlaysObj) {
      console.log(overlay);
      if (!overlay) continue;
      let newPlotData;

      switch (overlay.plotSource) {
        case COMMON_CONSTANTS.PLOT:
          newPlotData = dataManager.getPlot(overlay.plotId);
          break;
        case COMMON_CONSTANTS.FILE:
          newPlotData = new PlotData();
          newPlotData.file = overlay.plot.file;
          newPlotData.population = overlay.plot.population;
          newPlotData.setupPlot();
          newPlotData.getXandYRanges();
          break;
      }
      newPlotData.ranges.set(axis, [range[0], range[1]]);
      const overlayRes = newPlotData.getBins(
        Math.round(this.bins / this.DRAW_DIVISION_CONST) - 1,
        axis
      );
      overlayRes.list = overlayRes.list.map(
        (e: any) => e / this.DRAW_DIVISION_CONST
      );
      overlays.push({
        ...overlayRes,
        color: overlay.color,
      });
      const lastMax = newPlotData.getBins(Math.round(this.bins) - 1, axis).max;
      if (lastMax > globlMax) globlMax = lastMax;
    }
    this.globalMax = globlMax;
    const barOverlays = this.plotData.histogramBarOverlays;
    let binsArray = [];
    let parentBinsArray = [];
    let mainPlotColor =
      this.plotData.population && this.plotData.population.length > 0
        ? this.plotData.population[0].gate.color
        : "";

    if (barOverlays) {
      for (let i = 0; i < barOverlays.length; i++) {
        if (!barOverlays[i]) continue;
        let newPlotData;
        switch (barOverlays[i].plotSource) {
          case COMMON_CONSTANTS.PLOT:
            newPlotData = dataManager.getPlot(barOverlays[i].plotId);
            break;
          case COMMON_CONSTANTS.FILE:
            newPlotData = barOverlays[i].plot;
            break;
        }
        const lastMax = newPlotData.getBins(
          Math.round(this.bins) - 1,
          axis
        ).max;
        if (lastMax > globlMax) globlMax = lastMax;
      }
      this.globalMax = globlMax;
      for (let i = 0; i < barOverlays.length; i++) {
        let newPlotData;
        switch (barOverlays[i].plotSource) {
          case COMMON_CONSTANTS.PLOT:
            newPlotData = dataManager.getPlot(barOverlays[i].plotId);
            break;
          case COMMON_CONSTANTS.FILE:
            newPlotData = new PlotData();
            newPlotData.file = barOverlays[i].plot.file;
            newPlotData.population = barOverlays[i].plot.population;
            newPlotData.setupPlot();
            newPlotData.getXandYRanges();
            break;
        }
        newPlotData.ranges.set(axis, [range[0], range[1]]);
        let overlayMainHist = newPlotData.getBins(this.bins, axis);
        let binsArray = [];
        for (let j = 0; j < this.bins; j++) {
          binsArray.push({
            value: overlayMainHist.list[j] / globlMax,
            color: barOverlays[i].color,
          });
        }
        parentBinsArray.push(binsArray);
        binsArray = [];
      }
    }
    for (let i = 0; i < this.bins; i++) {
      binsArray.push({
        value: mainHist.list[i] / globlMax,
        color: mainPlotColor,
      });
    }
    for (let i = 0; i < binsArray.length; i++) {
      let binsAscArray = [];
      binsAscArray.push(binsArray[i]);
      for (let j = 0; j < parentBinsArray.length; j++) {
        binsAscArray.push(parentBinsArray[j][i]);
      }
      binsAscArray.sort((a, b) => {
        return b.value - a.value;
      });
      for (let j = 0; j < binsAscArray.length; j++) {
        if (binsAscArray[j].color)
          this.drawer.addBin(i, binsAscArray[j].value, binsAscArray[j].color);
        else this.drawer.addBin(i, binsAscArray[j].value);
      }
    }

    for (const overlay of overlays) {
      const curve = overlay.list
        .map((e: any, i: number) => {
          return this.drawer.getBinPos(
            i,
            e / globlMax,
            Math.floor(this.bins / this.DRAW_DIVISION_CONST)
          );
        })
        .sort((a: any, b: any) => {
          return a.x - b.x;
        });
      this.drawer.curve({
        points: curve,
        strokeColor: overlay.color,
        lineWidth: 6,
      });
    }
  }
}
