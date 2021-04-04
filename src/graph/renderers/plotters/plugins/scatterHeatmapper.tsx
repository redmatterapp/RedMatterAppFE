import PlotterPlugin from "graph/renderers/plotters/plugins/plotterPlugin";
import ScatterPlotter from "graph/renderers/plotters/scatterPlotter";
import { pointInsideEllipse } from "graph/dataManagement/math/euclidianPlane";

export default class ScatterHeatmapperPlugin extends PlotterPlugin {
  static TargetPlotter = ScatterPlotter;
  plotter: ScatterPlotter;
  heatmappingRadius = 0.05;
  heatMapCache: Array<{ xAxis: string; yAxis: string; colors: string[] }> = [];
  colors: string[] | null = null;

  setPlotter(plotter: ScatterPlotter) {
    this.plotter = plotter;
  }

  getPointColor_AFTER(index: number) {
    if (this.colors === null) {
      this.colors = this.getHeatmapColors();
    }
    return this.colors[index];
  }

  private getHeatmapColors() {
    const plotter = this.plotter;
    for (const hm of this.heatMapCache) {
      const { xAxis, yAxis, colors } = hm;
      if (plotter.xAxisName == xAxis && plotter.yAxisName == yAxis) {
        return colors;
      }
    }
    const hmr = this.heatmappingRadius;
    // Returns how many points are close (within heatmapping percentage radius)
    // to a given point i
    const closePoints = (i: number) => {
      let count = 0;

      const x = plotter.xAxis[i];
      const y = plotter.yAxis[i];
      const xr = plotter.xRange[1] - plotter.xRange[0];
      const yr = plotter.yRange[1] - plotter.yRange[0];
      const pp1 = { x: x - hmr * xr, y: y };
      const pp2 = { x: x + hmr * xr, y: y };
      const sp1 = { x: x, y: y - hmr * yr };
      const sp2 = { x: x, y: y + hmr * yr };

      plotter.xAxis.forEach((e, j) => {
        if (
          j !== i &&
          pointInsideEllipse(
            { x: plotter.xAxis[j], y: plotter.yAxis[j] },
            {
              center: { x: x, y: y },
              primaryP1: pp1,
              primaryP2: pp2,
              secondaryP1: sp1,
              secondaryP2: sp2,
              ang: 0,
            }
          )
        ) {
          count++;
        }
      });
      return count;
    };
    const lp = Array(plotter.xAxis.length)
      .fill(0)
      .map((e, i) => closePoints(i));

    //@ts-ignore
    const mx = lp.reduce((a, c) => (a > c ? a : c), []);
    let cColors: string[] = lp.map((e) => {
      const p = -Math.pow(e / mx, 5) + 1;
      const blue = (150 - 50) * p + 50;
      const red = -(210 - 100) * p + 210;
      const green = 80;
      return `rgb(${red}, ${green}, ${blue})`;
    });
    for (let i = 0; i < plotter.xAxis.length; i++) {}
    this.heatMapCache.push({
      colors: cColors,
      xAxis: plotter.xAxisName,
      yAxis: plotter.yAxisName,
    });
    return cColors;
  }
}
