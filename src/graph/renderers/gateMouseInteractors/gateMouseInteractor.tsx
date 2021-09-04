import GatePlotterPlugin from "graph/renderers/plotters/runtimePlugins/gatePlotterPlugin";
import { Gate, Point } from "graph/resources/types";
import ScatterPlotter from "../plotters/scatterPlotter";
import * as PlotResource from "graph/resources/plots";

export interface GateState {
  lastMousePos: Point;
}

export interface MouseInteractorState {
  plotID: string;
  rerender: Function;
  xAxis: string;
  yAxis: string;
}

export default abstract class GateMouseInteractor {
  static targetGate: Gate;
  static targetPlugin: GatePlotterPlugin;

  protected started: boolean = false;
  protected plugin: GatePlotterPlugin;
  protected lastMousePos: Point;
  private rerenderLastTimestamp: any = 0;

  unsetGating: Function;

  plotID: string;
  rerender: Function;
  xAxis: string;
  yAxis: string;
  plotter: ScatterPlotter | null = null;

  setMouseInteractorState(state: MouseInteractorState) {
    this.rerender = state.rerender;
    this.plotID = state.plotID;
    this.xAxis = state.xAxis;
    this.yAxis = state.yAxis;
  }

  setup(plotter: ScatterPlotter) {
    this.plotter = plotter;
    this.plugin.isGating = true;
  }

  start() {
    this.started = true;
  }

  end() {
    this.started = false;
    this.clearGateState();
    this.setPluginState();
    this.unsetGating();
  }

  setPluginState() {
    this.plugin.setGatingState(this.getGatingState());
  }

  getGatingState(): GateState {
    return {
      lastMousePos: this.lastMousePos,
    };
  }

  protected abstract instanceGate(): Gate;
  protected abstract clearGateState(): void;
  protected abstract gateEvent(type: string, point: Point): void;
  protected abstract editGateEvent(type: string, point: Point): void;

  createAndAddGate() {
    // TODO
    const gate = this.instanceGate();
    PlotResource.createSubpopPlot(this.plotter.plot, [gate]);
    // dataManager.addNewGateToWorkspace(gate);
    // dataManager.linkGateToPlot(this.plotID, gate.id);
    // dataManager.clonePlot(this.plotID);
    this.end();
  }

  registerMouseEvent(type: string, x: number, y: number) {
    if (this.plugin === undefined || this.plugin.plotter === undefined) return;
    const p = { x, y };
    this.lastMousePos = this.plugin.lastMousePos = p;
    if (this.plotter != null && this.plotter.gates.length > 0) {
      this.editGateEvent(type, p);
    }
    if (this.started) {
      this.gateEvent(type, p);
      this.setPluginState();
      const now = new Date().getTime();
      if (this.rerenderLastTimestamp + 10 < now) {
        this.rerenderLastTimestamp = now;
        this.rerender();
      }
    }
  }
}
