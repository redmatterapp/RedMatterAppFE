import { useRef, useEffect, useState } from "react";
import { PlotID } from "graph/resources/types";

export class CanvasManager {
  private context: any | null = null;
  private useCanvasCalled = false;

  private canvasRender: Function | null = null;

  id: string;
  width: number = 0;
  height: number = 0;
  scale: number = 2;

  setMouseEvent: (type: string, x: number, y: number) => void;

  constructor(setMouseEvent: (type: string, x: number, y: number) => void) {
    this.setMouseEvent = setMouseEvent;
  }

  setCanvasState(state: {
    id: PlotID;
    width: number;
    height: number;
    scale: number;
  }) {
    this.id = state.id;
    this.width = state.width;
    this.height = state.height;
    this.scale = state.scale;
  }

  getContext(): any {
    if (this.context === null) {
      throw Error("getContext() can only be called after initialization");
    }
    return this.context;
  }

  render() {
    if (this.canvasRender !== null) this.canvasRender();
    else throw Error("Null canvasRender() on <canvas>");
  }

  setUseCanvasUsed(value: boolean) {
    this.useCanvasCalled = value;
  }

  useCanvas(ref: any) {
    if (this.useCanvasCalled) {
      throw Error(
        "Calling useCanvas twice in the same instance is not allowed."
      );
    }
    this.useCanvasCalled = true;

    const canvas = ref.current;
    const context = canvas.getContext("2d");
    this.context = context;
    let animationFrameId = 0;

    const sendMouseInteraction = (event: Event, lock?: boolean) => {
      //@ts-ignore
      const x = event.offsetX;
      //@ts-ignore
      const y = event.offsetY;
      const type = event.type;
      this.setMouseEvent(type, x, y);
    };

    const addCanvasListener = (type: string, func: Function) => {
      if (canvas.getAttribute(`${type}-listener`) !== "true") {
        canvas.addEventListener(type, func);
        canvas.setAttribute(`${type}-listener`, "true");
      }
    };

    addCanvasListener("mousedown", (e: Event) => sendMouseInteraction(e, true));
    addCanvasListener("mouseup", (e: Event) => sendMouseInteraction(e, false));
    addCanvasListener("mousemove", (e: Event) => sendMouseInteraction(e));

    this.canvasRender = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width * this.scale;
        canvas.height = height * this.scale;
      }
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      // canvas is now ready to be drawn on.
      return () => {
        window.cancelAnimationFrame(animationFrameId);
      };
    };

    this.canvasRender();

    return ref;
  }
}

const CanvasComponent = (props: {
  plotID: PlotID;
  setCanvas: (canvas: CanvasManager) => void;
  setMouseEvent: (type: string, x: number, y: number) => void;
}) => {
  const [canvas, setCanvas] = useState<CanvasManager | null>(null);
  let canvasRef = useRef(null);

  useEffect(() => {
    if (!canvas) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const newCanvas = new CanvasManager(props.setMouseEvent);
      canvas.setUseCanvasUsed(true);
      setCanvas(newCanvas);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      canvasRef = newCanvas.useCanvas(canvasRef);
      props.setCanvas(canvas);
    }
    return () => {
      canvas.setUseCanvasUsed(false);
    };
  }, []);

  const id = `canvas-${props.plotID}`;

  return (
    <canvas
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      style={{
        backgroundColor: "#fff",
        textAlign: "center",
        width: canvas.width,
        height: canvas.height,
        borderRadius: 5,
        boxShadow: "1px 3px 4px #bbd",
        flexGrow: 1,
      }}
      ref={canvasRef}
      id={id}
    />
  );
};

export default CanvasComponent;
