/*
  This is responsible for plotting a general graph given specific inputs
*/
import Drawer from "./drawer";
import Polygon from "../gate/polygon";

interface ScatterDrawerConstructorParams {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  ibx: number;
  iex: number;
  iby: number;
  iey: number;
  scale: number;
}

interface GraphLineParams {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  ib: number;
  ie: number;
}

interface ScatterPlotGraph {
  addLine: Function;
  addPoint: Function;
  addPolygon: Function;
}

export default class ScatterDrawer extends Drawer {
  private x1: number;
  private y1: number;
  private x2: number;
  private y2: number;
  private ibx: number;
  private iex: number;
  private iby: number;
  private iey: number;
  private xpts: number;
  private ypts: number;
  private scale: number;

  static index = 0;
  index: number;

  constructor({
    x1,
    y1,
    x2,
    y2,
    ibx,
    iex,
    iby,
    iey,
    scale,
  }: ScatterDrawerConstructorParams) {
    super();
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.ibx = ibx;
    this.iex = iex;
    this.iby = iby;
    this.iey = iey;
    this.scale = scale;
    this.index = ScatterDrawer.index++;

    this.xpts = this.ypts = 3;
  }

  setMeta(state: any) {
    this.x1 = state.x1;
    this.y1 = state.y1;
    this.x2 = state.x2;
    this.y2 = state.y2;
    this.ibx = state.ibx;
    this.iex = state.iex;
    this.iby = state.iby;
    this.iey = state.iey;
    this.scale = state.scale;

    this.xpts = Math.round(
      (Math.max(this.x1, this.x2) - Math.min(this.x1, this.x2)) / 100
    );
    this.ypts = Math.round(
      (Math.max(this.y1, this.y2) - Math.min(this.y1, this.y2)) / 100
    );
  }

  private graphLine({ x1, y1, x2, y2, ib, ie }: GraphLineParams) {
    // Draw line
    this.line({
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      lineWidth: 2,
    });

    if (x1 === x2) {
      let counter = this.ypts;
      let interval = Math.max(y1, y2) - Math.min(y1, y2);
      interval /= this.ypts;
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y += interval) {
        this.line({
          x1: x1 - 14,
          y1: y,
          x2: x1 + 14,
          y2: y,
          lineWidth: 1,
        });

        let textWrite = (
          (Math.abs(ie - ib) / this.ypts) * counter +
          ib
        ).toString();
        if (textWrite.length > 6) textWrite = textWrite.substring(0, 6);

        this.text({
          x: x1 - 90,
          y: y + 8,
          text: textWrite,
          font: "20px Arial",
          fillColor: "black",
        });

        counter--;
      }
    } else if (y1 === y2) {
      let counter = this.xpts;
      let interval = Math.max(x1, x2) - Math.min(x1, x2);
      interval /= this.xpts;
      for (let x = Math.max(x1, x2); x >= Math.min(x1, x2); x -= interval) {
        this.line({
          x1: x,
          y1: y1 - 14,
          x2: x,
          y2: y1 + 14,
          lineWidth: 1,
        });
        let textWrite = (
          (Math.abs(ie - ib) / this.xpts) * counter +
          ib
        ).toString();
        if (textWrite.length > 6) textWrite = textWrite.substring(0, 6);

        this.text({
          font: "20px Arial",
          fillColor: "black",
          text: textWrite,
          x: x - 24,
          y: y1 + 40,
        });

        counter--;
      }
    } else {
      throw new Error("Plot line is not vertical nor horizontal");
    }
  }

  private plotCanvasWidth(): number {
    return Math.max(this.x1, this.x2) - Math.min(this.x1, this.x2);
  }

  private plotCanvasHeight(): number {
    return Math.max(this.y1, this.y2) - Math.min(this.y1, this.y2);
  }

  convertToPlotCanvasPoint = (x: number, y: number) => {
    const w = this.plotCanvasWidth();
    const h = this.plotCanvasHeight();
    const xBegin = Math.min(this.x1, this.x2);
    const yEnd = Math.max(this.y1, this.y2);
    const v = [
      (((x - this.ibx) / (this.iex - this.ibx)) * w + xBegin) / this.scale,
      (yEnd - ((y - this.iby) / (this.iey - this.iby)) * h) / this.scale,
    ];
    return v;
  };

  convertToAbstractPoint = (x: number, y: number) => {
    const plotXRange = this.x2 / this.scale - this.x1 / this.scale;
    const plotYRange = this.y1 / this.scale - this.y2 / this.scale;
    const abstractXRange = this.iex - this.ibx;
    const abstractYRange = this.iey - this.iby;
    const nx =
      ((x - this.x1 / this.scale) / plotXRange) * abstractXRange + this.ibx;
    const ny =
      this.iey - ((this.y1 / this.scale - y) / plotYRange) * abstractYRange;
    return { x: nx, y: ny };
  };

  test() {
    let p = { x: 100, y: 100 };
    for (let i = 0; i < 100; i++) {
      const p1 = this.convertToAbstractPoint(p.x, p.y);
      console.log("abstract p is", p1.x, p1.y);
      const [x, y] = this.convertToPlotCanvasPoint(p1.x, p1.y);
      p = { x: x, y: y };
      console.log("p is now:", p.x, p.y);
    }
  }

  scline({ x1, y1, x2, y2, lineWidth, strokeColor }: LineParams) {
    const p1 = this.convertToPlotCanvasPoint(x1, y1);
    x1 = p1[0] * this.scale;
    y1 = p1[1] * this.scale;
    const p2 = this.convertToPlotCanvasPoint(x2, y2);
    x2 = p2[0] * this.scale;
    y2 = p2[1] * this.scale;
    this.line({ x1, y1, x2, y2, lineWidth, strokeColor });
  }

  oval(obj: any) {
    const [x, y] = this.convertToPlotCanvasPoint(obj.x, obj.y);

    this.setStrokeColor("#f33");
    this.ctx.beginPath();
    this.ctx.ellipse(
      x * this.scale,
      y * this.scale,
      obj.d1 * this.scale,
      obj.d2 * this.scale,
      obj.ang,
      0,
      2 * Math.PI
    );
    this.setLineWidth(5);
    this.ctx.stroke();
  }

  drawPlotGraph(): ScatterPlotGraph {
    this.graphLine({
      x1: this.x1,
      y1: this.y1,
      x2: this.x1,
      y2: this.y2,
      ib: this.iby,
      ie: this.iey,
    });

    this.graphLine({
      x1: this.x1,
      y1: this.y2,
      x2: this.x2,
      y2: this.y2,
      ib: this.ibx,
      ie: this.iex,
    });

    // Horizontal plot lines
    for (let i = 0; i < this.ypts; i++) {
      const height =
        (Math.abs(this.y1 - this.y2) / this.ypts) * i +
        Math.min(this.y1, this.y2);
      this.line({
        x1: this.x1,
        y1: height,
        x2: this.x2,
        y2: height,
        strokeColor: "#bababa",
      });
    }
    // Vertical plot lines
    for (let i = 1; i <= this.xpts; i++) {
      const width =
        (Math.abs(this.x1 - this.x2) / this.xpts) * i +
        Math.min(this.x1, this.x2);
      this.line({
        x1: width,
        y1: this.y1,
        x2: width,
        y2: this.y2,
        strokeColor: "#bababa",
      });
    }

    return ((parent) => {
      return {
        addPoint: (
          x: number,
          y: number,
          r: number = 1,
          color: string = "#000"
        ) => {
          if (x < parent.ibx || x > parent.iex) return;
          if (y < parent.iby || y > parent.iey) return;
          const plotPoints = parent.convertToPlotCanvasPoint(x, y);
          const plotx = plotPoints[0];
          const ploty = plotPoints[1];
          parent.circle({
            x: plotx * this.scale,
            y: ploty * this.scale,
            radius: r * this.scale,
            fillColor: color,
          });
        },
        addPolygon: (polygon: Polygon, color: string = "#000") => {
          const pl = polygon.getLength();
          for (let i = 0; i < pl; i++) {
            let pA = polygon.getPoint(i);
            const a = parent.convertToPlotCanvasPoint(pA.x, pA.y);

            let pB = polygon.getPoint((i + 1) % pl);
            const b = parent.convertToPlotCanvasPoint(pB.x, pB.y);

            parent.line({
              x1: a[0] * this.scale,
              y1: a[1] * this.scale,
              x2: b[0] * this.scale,
              y2: b[1] * this.scale,
              strokeColor: color,
            });
          }
        },
        addLine: (
          pa: [number, number],
          pb: [number, number],
          color: string = "#000"
        ) => {
          parent.ctx.strokeStyle = color;
          const a = parent.convertToPlotCanvasPoint(pa[0], pa[1]);
          const b = parent.convertToPlotCanvasPoint(pb[0], pb[1]);
          parent.line({
            x1: a[0] * this.scale,
            y1: a[1] * this.scale,
            x2: b[0] * this.scale,
            y2: b[1] * this.scale,
            strokeColor: color,
          });
        },
      };
    })(this);
  }
}
