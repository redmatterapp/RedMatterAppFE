import Gate, { GateState, Point } from "./gate";
import { pointInsidePolygon } from "graph/dataManagement/math/euclidianPlane";
import PlotData from "../plotData";
import FCSServices from "services/FCSServices/FCSServices";

interface PolygonGateState extends GateState {
  points: Point[];
}

export default class PolygonGate extends Gate {
  points: Point[] = [];
  gateType: string = "PolygonGate";

  constructor(gate: PolygonGateState) {
    super(gate);
    console.log("GATE CONSTUCTOR CALLED WITH GATE = ", gate);
    this.points = gate.points;
  }

  setState(gate: PolygonGateState) {
    super.setState(gate);
    this.points = gate.points;
  }

  getState(): PolygonGateState {
    return {
      ...super.getState(),
      points: this.points,
    };
  }

  getGateType() {
    return "Polygon Gate";
  }

  isPointInside(point: Point, context?: PlotData): boolean {
    if (context === undefined)
      return (
        pointInsidePolygon(point, this.points) && super.isPointInside(point)
      );
    let points = this.points.map((e) => {
      return { ...e };
    });
    const ranges = [
      context.linearRanges.get(context.xAxis),
      context.linearRanges.get(context.yAxis),
    ];
    const fcsServices = new FCSServices();
    const convert = (e: { x: number; y: number }) => {
      if (this.xAxisType === "bi")
        e.x = fcsServices.logicleMarkTransformer(
          [e.x],
          ranges[0][0],
          ranges[0][1]
        )[0];
      if (this.yAxisType === "bi")
        e.y = fcsServices.logicleMarkTransformer(
          [e.y],
          ranges[1][0],
          ranges[1][1]
        )[0];
      return e;
    };
    const rawConvert = (e: { x: number; y: number }) => {
      if (this.xAxisType === "bi")
        e.x = (e.x - ranges[0][0]) / (ranges[0][1] - ranges[0][0]);
      if (this.yAxisType === "bi")
        e.y = (e.y - ranges[1][0]) / (ranges[1][1] - ranges[1][0]);
      return e;
    };
    points = points.map((e) => rawConvert(e));
    point = convert(point);
    return pointInsidePolygon(point, points) && super.isPointInside(point);
  }
}
