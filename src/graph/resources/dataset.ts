import { getGate } from "graph/utils/workspace";
import { getPlotFile } from "./plots";
import {
  Color,
  Dataset,
  File,
  FileID,
  Gate,
  Gate2D,
  Point,
  PolygonGate,
  PopulationGateType,
} from "./types";

import * as GateResource from "graph/resources/gates";
import { pointInsidePolygon } from "graph/utils/euclidianPlane";
import FCSServices from "services/FCSServices/FCSServices";

/*
    Public
*/

export const createDataset = (data: number[][], file: File): FileID => {
  if (data.length === 0 || data[0].length === 0) {
    throw Error("Empty dataset");
  }
  let axisCount = data.length;
  let dataCount = data[0].length;
  let axes: number[][] = [];
  if (dataCount < axisCount) {
    let temp = axisCount;
    axisCount = dataCount;
    dataCount = temp;
    while (axes.length < axisCount) axes.push([]);
    for (let i = 0; i < dataCount; i++) {
      for (let j = 0; j < axisCount; j++) {
        axes[j].push(data[i][j]);
      }
    }
  } else {
    while (axes.length < axisCount) axes.push([]);
    for (let i = 0; i < dataCount; i++) {
      for (let j = 0; j < axisCount; j++) {
        axes[i].push(data[i][j]);
      }
    }
  }

  let dataset: Dataset = {};
  let i = 0;
  for (const list of axes) {
    dataset[file.axes[i++]] = new Float32Array(list);
  }

  const storage = new DatasetStorage();
  const id = storage.store(file.id, dataset);
  return id;
};

export const deleteDataset = (id: FileID) => {
  const storage = new DatasetStorage();
  storage.delete(id);
};

export const getDataset = (fileId: FileID): Dataset => {
  const storage = new DatasetStorage();
  return storage.retrieve(fileId);
};

/*
    Private
*/

class DatasetStorage {
  static instance: DatasetStorage | null = null;
  datasets: Map<FileID, Dataset> = new Map();

  constructor() {
    if (DatasetStorage.instance) {
      return DatasetStorage.instance;
    }
    DatasetStorage.instance = this;
  }

  retrieve(id: FileID): Dataset {
    if (!this.datasets.has(id)) {
      throw Error("Dataset not found");
    }
    return this.datasets.get(id);
  }

  store(id: string, dataset: Dataset): FileID {
    this.datasets.set(id, dataset);
    return id;
  }

  delete(id: FileID) {
    if (!this.datasets.has(id)) {
      throw Error("Dataset not found");
    }
    return this.datasets.delete(id);
  }
}

/*
    Transformations
*/

let axesLookup: { [index: string]: number } = {};

export const isPointInside = (
  gate: { gate: PolygonGate; inverseGating: boolean },
  point: number[],
  cond: boolean = false
): boolean => {
  const p = {
    x: point[axesLookup[gate.gate.xAxis]],
    y: point[axesLookup[gate.gate.yAxis]],
  };
  let pointInside = false;
  if (gate.gate.gateType === "polygon") {
    pointInside = pointInsidePolygon(p, gate.gate.points);
  } else {
    throw Error("gate type not supported");
  }
  return pointInside ? !gate.inverseGating : gate.inverseGating;
};

const gateDFS = (
  point: number[],
  gate: { gate: PolygonGate; inverseGating: boolean },
  currentDepth: number
): { depth: number; color: string | null } => {
  if (!isPointInside(gate, point)) {
    return { depth: 0, color: null };
  }
  let ans = { depth: currentDepth, color: gate.gate.color };
  // for (const child of gate.gate.children) {
  //   const cAns = gateDFS(
  //     point,
  //     { gate: child, inverseGating: false },
  //     currentDepth + 1
  //   );
  //   if (cAns.color !== null && cAns.depth > ans.depth) {
  //     ans = cAns;
  //   }
  // }
  return ans;
};

export const getDatasetColors = (
  dataset: Dataset,
  targets: PopulationGateType[],
  stdColor: Color = "#000"
): string[] => {
  const colors: string[] = [];
  const axes = Object.keys(dataset);
  axesLookup = {};
  axes.forEach((e, i) => (axesLookup[e] = i));
  const dataLength = dataset[axes[0]].length;
  const gates = targets.map((e) => {
    return {
      gate: getGate(e.gate) as PolygonGate,
      inverseGating: e.inverseGating,
    };
  });
  for (let i = 0; i < dataLength; i++) {
    let ans = { depth: 0, color: stdColor };
    const x: number[] = [];
    for (const key of axes) {
      x.push(dataset[key][i]);
    }
    for (const gate of gates) {
      const cAns = gateDFS(x, gate, 1);
      if (cAns.color !== null && cAns.depth > ans.depth) {
        ans = cAns;
      }
    }
    colors.push(ans.color);
  }
  return colors;
};

export const getDatasetFilteredPoints = (
  dataset: Dataset,
  targets: PopulationGateType[]
): Dataset => {
  const gates = targets.map((e) => {
    return {
      gate: getGate(e.gate) as PolygonGate,
      inverseGating: e.inverseGating,
    };
  });
  const axes = Object.keys(dataset);
  const size = dataset[axes[0]].length;
  for (const axis of Object.keys(dataset)) {
    if (dataset[axis].length !== size)
      throw Error("Axes of different size were found");
  }
  const transformedDataset: Dataset = {};
  const addIndexes: number[] = [];
  let dontAdd = false;
  for (let i = 0; i < size; i++) {
    dontAdd = false;
    const x: number[] = [];
    for (const axis of axes) {
      x.push(dataset[axis][i]);
    }
    for (const gate of gates) {
      const inside = isPointInside(gate, x, i < 10);
      if (!inside) {
        dontAdd = true;
        break;
      }
    }
    if (dontAdd) continue;
    addIndexes.push(i);
  }
  for (const axis of axes) {
    transformedDataset[axis] = new Float32Array(addIndexes.length);
  }
  for (let i = 0; i < addIndexes.length; i++) {
    for (const axis of axes)
      transformedDataset[axis][i] = dataset[axis][addIndexes[i]];
  }
  return transformedDataset;
};

export const isPointInsideWithLogicle = (
  gate: { gate: PolygonGate; inverseGating: boolean },
  point: Point,
  forceRaw: boolean = false
): boolean => {
  let points = gate.gate.points.map((e) => {
    return { ...e };
  });
  if (forceRaw) {
    return pointInsidePolygon(point, points);
  }
  const ranges = [gate.gate.xAxisOriginalRanges, gate.gate.yAxisOriginalRanges];
  const fcsServices = new FCSServices();
  const convert = (e: { x: number; y: number }) => {
    if (gate.gate.xAxisType === "bi")
      e.x = fcsServices.logicleMarkTransformer(
        [e.x],
        ranges[0][0],
        ranges[0][1]
      )[0];
    if (gate.gate.yAxisType === "bi")
      e.y = fcsServices.logicleMarkTransformer(
        [e.y],
        ranges[1][0],
        ranges[1][1]
      )[0];
    return e;
  };
  const rawConvert = (e: { x: number; y: number }) => {
    if (gate.gate.xAxisType === "bi")
      e.x = (e.x - ranges[0][0]) / (ranges[0][1] - ranges[0][0]);
    if (gate.gate.yAxisType === "bi")
      e.y = (e.y - ranges[1][0]) / (ranges[1][1] - ranges[1][0]);
    return e;
  };
  points = points.map((e) => rawConvert(e));
  point = convert(point);
  return pointInsidePolygon(point, points);
};
