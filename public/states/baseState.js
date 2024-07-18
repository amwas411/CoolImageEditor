export default class BaseState {
    cursorStyle = "default";
    hasMouseMoveEvents = false;
    coolImageEditor;
    render() { }
    canvasMouseMove(e) { }
    canvasMouseDown(e) { }
    getCursorStyle() {
        return this.cursorStyle;
    }
    isMouseMoveEventsEnabled() {
        return this.hasMouseMoveEvents;
    }
    constructor(coolImageEditor) {
        this.coolImageEditor = coolImageEditor;
    }
}
//# sourceMappingURL=baseState.js.map