import { CursorStyle } from "../types";

export default class BaseState {
  protected cursorStyle: CursorStyle = "default";
  protected hasMouseMoveEvents = false;
  public render() {}
  public canvasMouseMove(e: MouseEvent) {}
  public canvasMouseDown(e: MouseEvent) {}
  public getCursorStyle() {
    return this.cursorStyle;
  }
  public isMouseMoveEventsEnabled() {
    return this.hasMouseMoveEvents;
  }
}