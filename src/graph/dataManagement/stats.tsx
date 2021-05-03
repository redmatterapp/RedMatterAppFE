import PlotData from "./plotData";

export default class PlotStats {
  plot: PlotData;

  getPlotStats(plot: PlotData) {
    this.plot = plot;
    const means = this.getMeans();
    const pop = this.getPopulationStats();
    return {
      meanX: means.x,
      meanY: means.y,
      filePopulationSize: pop.fileSize,
      gatedFilePopulationSize: pop.plotSize,
      gatedFilePopulationPercentage: pop.percentage,
    };
  }

  private getPopulationStats() {
    const plotSize = this.plot.getXandYData().xAxis.length;
    const fileSize = this.plot.file.data.length;
    let percentage: number | string = 100 * (plotSize / fileSize);
    if (percentage < 1) {
      percentage = " < 1%";
    } else {
      percentage = percentage.toFixed(2) + " %";
    }
    return {
      percentage: percentage,
      fileSize: fileSize,
      plotSize: plotSize,
    };
  }

  private getMeans() {
    const data = this.plot.getXandYData();
    let sumX = 0;
    let sumY = 0;
    data.xAxis.forEach((e) => (sumX += e));
    data.yAxis.forEach((e) => (sumY += e));
    let countX = data.xAxis.length;
    let countY = data.yAxis.length;
    let x: number = sumX / countX;
    let y: number = sumY / countY;
    const parseNum = (num: number) => {
      if (num > 1e6 || num < 1e-6) {
        return num.toExponential();
      }
      if (num < 1) {
        return num.toFixed(6);
      }
      if (num > 1) {
        return num.toFixed(2);
      }
    };
    return { x: parseNum(x), y: parseNum(y) };
  }
}
