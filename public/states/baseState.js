export default class BaseState {
    cursorStyle = "default";
    hasMouseMoveEvents = false;
    render() { }
    canvasMouseMove(e) { }
    canvasMouseDown(e) { }
    getCursorStyle() {
        return this.cursorStyle;
    }
    isMouseMoveEventsEnabled() {
        return this.hasMouseMoveEvents;
    }
}
//# sourceMappingURL=baseState.js.map