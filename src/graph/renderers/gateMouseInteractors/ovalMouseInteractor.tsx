import OvalGate from "../../dataManagement/gate/ovalGate";
import {
  euclidianDistance2D,
  distLinePoint2D,
  getVectorAngle2D,
  rotateVector2D,
} from "../../dataManagement/math/euclidianPlane";
import GateMouseInteractor, {
  Point,
  GateState,
  MouseInteractorState,
} from "./gateMouseInteractor";
import ScatterOvalGatePlotter from "../plotters/runtimePlugins/scatterOvalGatePlotter";

export interface OvalGateState extends GateState {
  center: Point | null = null;
  primaryP1: Point | null = null;
  primaryP2: Point | null = null;
  secondaryP1: Point | null = null;
  secondaryP2: Point | null = null;
  majorToMinorSize: number = 0;
  lastMousePos: { x: number; y: number } | null = null;
  ang: number = 0;
  xAxis: string;
  yAxis: string;
}

export interface OvalMouseInteractorState extends MouseInteractorState {
  xAxis: string;
  yAxis: string;
}

export default class OvalMouseInteractor extends GateMouseInteractor {
  static targetGate: OvalGate;
  static targetPlugin: OvalGatePlotterPlugin;

  protected plugin: ScatterOvalGatePlotter;

  private xAxis: string;
  private yAxis: string;
  private ovalGateP0: Point | null = null;
  private ovalGateP1: Point | null = null;
  private majorToMinorSize: number = 0;
  private ang: number = 0;

  setMouseInteractorState(state: OvalMouseInteractorState) {
    super.setMouseInteractorState(state);
    this.xAxis = state.xAxis;
    this.yAxis = state.yAxis;
  }

  protected instanceGate(): OvalGate {
    const {
      center,
      primaryP1,
      primaryP2,
      secondaryP1,
      secondaryP2,
      ang,
      xAxis,
      yAxis,
    } = this.getGatingState();

    const checkNotNullOrUndefined = (x: any): void => {
      if (x === null || x === undefined) {
        throw Error("Invalid gate params on instancing");
      }
    };
    checkNotNullOrUndefined(center);
    checkNotNullOrUndefined(primaryP1);
    checkNotNullOrUndefined(primaryP2);
    checkNotNullOrUndefined(secondaryP1);
    checkNotNullOrUndefined(secondaryP2);
    checkNotNullOrUndefined(ang);
    checkNotNullOrUndefined(xAxis);
    checkNotNullOrUndefined(yAxis);

    return new OvalGate({
      center: center,
      primaryP1: primaryP1,
      primaryP2: primaryP2,
      secondaryP1: secondaryP1,
      secondaryP2: secondaryP2,
      ang: ang,
      xAxis: xAxis,
      yAxis: yAxis,
    });
  }

  protected clearGateState() {
    this.ovalGateP0 = null;
    this.ovalGateP1 = null;
    this.majorToMinorSize = 0;
    this.lastMousePos = null;
    this.ang = 0;
  }

  getGatingState(): OvalGateState {
    // This is going to calculate the 2 secondary points by creating a vector
    // from center to primaryP1, then rotate that vector -90º and multiply
    // for secondaryP1 and do the same but 90º to get secondaryP2

    if (this.ovalGateP0 === null) {
      return {
        ...super.getGatingState(),
        center: null,
        primaryP1: null,
        primaryP2: null,
        secondaryP1: null,
        secondaryP2: null,
        ang: null,
        majorToMinorSize: this.majorToMinorSize,
        xAxis: this.xAxis,
        yAxis: this.yAxis,
      };
    }

    if (this.ovalGateP1 === null) {
      return {
        ...super.getGatingState(),
        center: null,
        primaryP1: this.ovalGateP0,
        primaryP2: this.ovalGateP0,
        secondaryP1: null,
        secondaryP2: null,
        majorToMinorSize: this.majorToMinorSize,
        ang: null,
        xAxis: this.xAxis,
        yAxis: this.yAxis,
      };
    }

    const mx = (this.ovalGateP0.x + this.ovalGateP1.x) / 2;
    const my = (this.ovalGateP0.y + this.ovalGateP1.y) / 2;
    const vec = { x: this.ovalGateP0.x - mx, y: this.ovalGateP0.y - my };
    const s1 = rotateVector2D(vec, -Math.PI / 2);
    const s2 = rotateVector2D(vec, Math.PI / 2);

    s1.x *= this.majorToMinorSize;
    s1.y *= this.majorToMinorSize;
    s2.x *= this.majorToMinorSize;
    s2.y *= this.majorToMinorSize;

    s1.x += mx;
    s1.y += my;
    s2.x += mx;
    s2.y += my;

    return {
      ...super.getGatingState(),
      center: {
        x: mx,
        y: my,
      },
      primaryP1: this.ovalGateP0,
      primaryP2: this.ovalGateP1,
      secondaryP1: {
        x: s1.x,
        y: s1.y,
      },
      secondaryP2: {
        x: s2.x,
        y: s2.y,
      },
      majorToMinorSize: this.majorToMinorSize,
      ang: this.ang,
      xAxis: this.xAxis,
      yAxis: this.yAxis,
      lastMousePos: this.lastMousePos,
    };
  }

  gateEvent(type: string, { x, y }: Point) {
    if (this.ovalGateP0 == null && type == "mousedown") {
      // Step 1: select first point
      this.ovalGateP0 = { x: x, y: y };
    } else if (this.ovalGateP1 == null && type == "mousedown") {
      // Step 2: select second point
      this.ovalGateP1 = { x: x, y: y };
      this.calculateEllipseAngle();
    } else if (
      // Step 3: move mouse to select other axis of oval gate
      this.ovalGateP0 != null &&
      this.ovalGateP1 != null &&
      type == "mousemove"
    ) {
      this.calculateEllipseAngle();
      this.calculateMainToSecondaryAxisEllipseSize(x, y);
    } else if (
      // Step 4: press to confirm and create gate
      this.ovalGateP0 != null &&
      this.ovalGateP1 != null &&
      type == "mousedown"
    ) {
      // create gate...
      this.createAndAddGate();
    }
  }

  private calculateMainToSecondaryAxisEllipseSize(x: number, y: number) {
    if (this.ovalGateP0 === null || this.ovalGateP1 === null) {
      throw Error("Invalid axis calculation: points not defined");
    }
    const distMouseFromLine = distLinePoint2D(
      this.ovalGateP0,
      this.ovalGateP1,
      this.lastMousePos
    );
    this.majorToMinorSize =
      (distMouseFromLine * 2) /
      euclidianDistance2D(this.ovalGateP0, this.ovalGateP1);
  }

  private calculateEllipseAngle() {
    this.ang = -getVectorAngle2D(this.ovalGateP0, this.ovalGateP1);
    const p1 = this.plugin.plotter.transformer.toConcretePoint({
      x: this.ovalGateP0.x,
      y: this.ovalGateP0.y,
    });
    const p2 = this.plugin.plotter.transformer.toConcretePoint({
      x: this.ovalGateP1.x,
      y: this.ovalGateP1.y,
    });
    const concreteAngle = getVectorAngle2D(p1, p2);
    this.ang = concreteAngle;
  }
}
