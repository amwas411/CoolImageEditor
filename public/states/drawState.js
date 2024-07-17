import BaseState from './baseState.js';
export class DrawState extends BaseState {
    transformStack;
    redoStack;
    ctx;
    color = "#ffff00";
    width = 20;
    constructor(ctx, transformStack, redoStack) {
        super();
        this.ctx = ctx;
        this.transformStack = transformStack;
        this.redoStack = redoStack;
        this.cursorStyle = "crosshair";
        this.hasMouseMoveEvents = true;
    }
    canvasMouseDown(e) {
        let { x, y } = this.calculateRealPoint(e.offsetX, e.offsetY);
        let point = this.createDrawingPoint(x, y);
        this.pushPathToTransformStack(point, x, y);
    }
    ;
    render() {
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
    canvasMouseMove(e) {
        // Merge previous point with the current.
        let item = this.transformStack[this.transformStack.length - 1];
        if (item) {
            let { x, y } = this.calculateRealPoint(e.offsetX, e.offsetY);
            let line = this.createDrawingLine(item.point.x, item.point.y, x, y);
            item.path.addPath(line);
            let point = this.createDrawingPoint(x, y);
            item.path.addPath(point);
            item.point.x = x;
            item.point.y = y;
        }
    }
    createDrawingLine(x0, y0, x1, y1) {
        let line = new Path2D();
        line.moveTo(x0, y0);
        line.lineTo(x1, y1);
        return line;
    }
    createDrawingPoint(x, y) {
        let path = new Path2D();
        // TODO: width.
        path.arc(x, y, 1, 0, 2 * Math.PI);
        return path;
    }
    calculateRealPoint(x, y) {
        let scaleLevel = this.ctx.getTransform().a;
        let dx = this.ctx.getTransform().e;
        let dy = this.ctx.getTransform().f;
        return {
            x: (x - dx) / scaleLevel,
            y: (y - dy) / scaleLevel
        };
    }
    pushPathToTransformStack(path, x, y) {
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
//# sourceMappingURL=drawState.js.map