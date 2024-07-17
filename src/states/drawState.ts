import { TransformPath } from '../types.js';
import BaseState from './baseState.js';

export class DrawState extends BaseState {
  private transformStack: TransformPath[];
  private redoStack: TransformPath[];
  private ctx: CanvasRenderingContext2D;
  private color = "#ffff00";
  private width = 20;

  constructor(ctx: CanvasRenderingContext2D, transformStack: TransformPath[], redoStack: TransformPath[]) {
    super();
    this.ctx = ctx;
    this.transformStack = transformStack;
    this.redoStack = redoStack;
    this.cursorStyle = "crosshair";
    this.hasMouseMoveEvents = true;
  }

  public canvasMouseDown(e: MouseEvent): void {
    let {x, y} = this.calculateRealPoint(e.offsetX, e.offsetY);
    let point = this.createDrawingPoint(x, y);
    this.pushPathToTransformStack(point, x, y);
  };

  public render(): void {
    let item = this.transformStack[this.transformStack.length - 1];
    if (item) {
      let filterCopy = this.ctx.filter;
      // Do not apply filters to drawings.
      this.ctx.filter = "none";

      this.ctx.lineWidth = this.width;
      this.ctx.strokeStyle = item.color;
      this.ctx.stroke(item.path);

      this.ctx.filter = filterCopy;
    }
  }

  public canvasMouseMove(e: MouseEvent): void {
    // Merge previous point with the current.
    let item = this.transformStack[this.transformStack.length - 1];
    if (item) {
      let {x, y} = this.calculateRealPoint(e.offsetX, e.offsetY);

      let line = this.createDrawingLine(item.point.x, item.point.y, x, y);
      item.path.addPath(line);

      let point = this.createDrawingPoint(x, y);
      item.path.addPath(point);
      item.point.x = x;
      item.point.y = y;
    }
  }

  private createDrawingLine(x0: number, y0: number, x1: number, y1: number): Path2D {
    let line = new Path2D();
    line.moveTo(x0, y0);
    line.lineTo(x1, y1);
    return line;
  }

  private createDrawingPoint(x: number, y: number): Path2D {
    let path = new Path2D();
    // TODO: width.
    path.arc(x, y, 1, 0, 2 * Math.PI);
    return path;
  }

  private calculateRealPoint(x: number, y: number): {x: number, y: number} {
    let scaleLevel = this.ctx.getTransform().a;
    let dx = this.ctx.getTransform().e;
    let dy = this.ctx.getTransform().f;
    return {
      x: (x - dx) / scaleLevel,
      y: (y - dy) / scaleLevel
    };
    
  }

  private pushPathToTransformStack(path: Path2D, x: number, y: number): void {
    while (this.redoStack.length > 0) {
      this.redoStack.pop();
    }

    // TODO: color.
    this.transformStack.push({
      path: path,
      color: this.color,
      point: {
        x: x, 
        y: y
      },
      width: this.width
    });
  }
}