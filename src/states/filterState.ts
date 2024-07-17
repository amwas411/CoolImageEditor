import { TransformPath } from '../types.js';
import BaseState from './baseState.js';

export class FilterState extends BaseState {
  private mainCanvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private originalBackgroundImage: HTMLImageElement;
  private filterConfig: { [key: string]: string } = {};
  private transformStack: TransformPath[];

  constructor(ctx: CanvasRenderingContext2D, originalBackgroundImage: HTMLImageElement,
    filterConfig: { [key: string]: string }, transformStack: TransformPath[], mainCanvas: HTMLCanvasElement) {
      super();
      this.mainCanvas = mainCanvas;
      this.ctx = ctx;
      this.originalBackgroundImage = originalBackgroundImage;
      this.filterConfig = filterConfig;
      this.transformStack = transformStack;
  }

  render(): void {
    let filter = "";
    for (let [key, value] of Object.entries(this.filterConfig)) {
      filter += `${key}(${value}) `;
    }
    this.ctx.filter = filter;
    this.ctx.drawImage(this.originalBackgroundImage, 0, 0);

    // Do not apply filters to drawings.
    let filterCopy = this.ctx.filter;
    this.ctx.filter = "none";

    for (let item of this.transformStack) {
      this.ctx.strokeStyle = item.color;
      this.ctx.lineWidth = item.width;
      this.ctx.stroke(item.path);
    }
    this.ctx.filter = filterCopy;
  };
}