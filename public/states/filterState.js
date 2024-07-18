import BaseState from './baseState.js';
export class FilterState extends BaseState {
    render() {
        let filter = "";
        for (let [key, value] of Object.entries(this.coolImageEditor.filterConfig)) {
            filter += `${key}(${value}) `;
        }
        this.coolImageEditor.mainCtx.filter = filter;
        this.coolImageEditor.mainCtx.drawImage(this.coolImageEditor.originalBackgroundImage, 0, 0);
        // Do not apply filters to drawings.
        let filterCopy = this.coolImageEditor.mainCtx.filter;
        this.coolImageEditor.mainCtx.filter = "none";
        for (let item of this.coolImageEditor.transformStack) {
            this.coolImageEditor.mainCtx.strokeStyle = item.color;
            this.coolImageEditor.mainCtx.lineWidth = item.width;
            this.coolImageEditor.mainCtx.stroke(item.path);
        }
        this.coolImageEditor.mainCtx.filter = filterCopy;
    }
    ;
}
//# sourceMappingURL=filterState.js.map