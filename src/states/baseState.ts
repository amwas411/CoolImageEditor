import { CursorStyle } from "../types";
import CoolImageEditor from "../coolimageeditor";

export default class BaseState {
  protected cursorStyle: CursorStyle = "default";
  protected hasMouseMoveEvents = false;
  protected coolImageEditor: CoolImageEditor;
  public render(): void {}
  public canvasMouseMove(e: MouseEvent): void {}
  public canvasMouseDown(e: MouseEvent): void {}
  public getCursorStyle(): CursorStyle {
    return this.cursorStyle;
  }
  public isMouseMoveEventsEnabled(): boolean {
    return this.hasMouseMoveEvents;
  }
  constructor(coolImageEditor: CoolImageEditor) {
    this.coolImageEditor = coolImageEditor;
  }
}