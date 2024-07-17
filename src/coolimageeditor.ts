import resources from './resources.js';
import RangeInput from './components/rangeInput.js';
import ToolTab from './components/toolTab.js';

interface CanvasState {
  id: number,
  cursorStyle: string
}
type FilterName = "enhance" | "brightness" | "contrast" | "saturation" | "warmth";

export default class CoolImageEditor {
  private canvasStates: {[key: string]: CanvasState} = {
    filter: {
      id: 0,
      cursorStyle: "default"
    },
    crop: {
      id: 1,
      cursorStyle: "default"
    },
    text: {
      id: 2,
      cursorStyle: "default"
    },
    draw: {
      id: 3,
      cursorStyle: "crosshair"
    },
    sticker: {
      id: 4,
      cursorStyle: "default"
    },
  };
  private mainCanvas: HTMLCanvasElement;
  private originalBackgroundImage: HTMLImageElement;
  private originalFile: File;
  private canvasState = this.canvasStates.filter;
  private transformStack: {path: Path2D, color: string}[] = [];
  private redoStack: {path: Path2D, color: string}[] = [];
  private static icons: {[key: string]: HTMLImageElement} = {};
  private filterConfig: {[key: string]: string} = {};
  private isMouseDown = false;
  private isResize = false;
  private isUndoOrRedo = false;
  private isSave = false;

  public container: HTMLDivElement;

  constructor(config: {
    img: HTMLImageElement,
    file: File
  }) {
    this.originalBackgroundImage = config.img;
    this.originalFile = config.file;
    this.mainCanvas = this.generateCanvas();
    this.container = this.generate();
    this.mainCanvas.onmousedown = (e) => this.canvasMouseDown(e);
    window.onresize = () => this.resizeCanvas();
  }

  public setImage(config: {
    img: HTMLImageElement,
    file: File
  }) {
    this.originalBackgroundImage = config.img;
    this.originalFile = config.file;
    this.resetCanvas();
  }

  private setCanvasState(state: CanvasState) {
    this.canvasState = state;
    this.mainCanvas.style.cursor = state.cursorStyle || "default";
  }
  
  private setFilterConfig(name: string, value: string) {
    if (this.filterConfig[name] === value) {
      return;
    }
  
    this.filterConfig[name] = value;
  }
  
  private resetCanvas() {
    // TODO: reset components.
    this.setCanvasState(this.canvasStates.filter);
    this.transformStack = [];
    this.redoStack = [];
    this.filterConfig = {};
    this.isMouseDown = false;
    this.mainCanvas.getContext("2d")?.resetTransform();
    
    this.resizeCanvas();
  }

  public static async loadIcons() {
    let paths = [
      './icons/close.svg',
      './icons/crop.svg',
      './icons/draw.svg',
      './icons/filter.svg',
      './icons/redo.svg',
      './icons/save.svg',
      './icons/sticker.svg',
      './icons/text.svg',
      './icons/undo.svg',
    ];
  
    let promises = paths.map((path) => {
      return new Promise((resolve) => {
        let img = new Image();
        img.src = path;
        img.onload = () => {
          resolve([path.slice(8).replace(".svg", ""), img]);
        };
      });
    });
  
    let values = await Promise.all(promises) as [string, HTMLImageElement][];
    for (let v of values) {
      let [key, value] = v;
      CoolImageEditor.icons[key] = value;
    }
  }

  private generateCanvas() {
    let canvas = document.createElement("canvas");
    canvas.id = "cie-canvas";
    return canvas;
  }
  
  private generate(): HTMLDivElement {
    let mainContainer = document.createElement("div");
    mainContainer.id = "cie-main";
  
    let leftPanel = document.createElement("div");
    leftPanel.id = "cie-left-panel";
    leftPanel.append(this.mainCanvas);
  
    let rightPanel = document.createElement("div");
    rightPanel.id = "cie-right-panel";
    
  
    let title = document.createElement("div");
    title.id = "cie-title-block";
    title.classList.add("cie-block");
  
    let closeBlock = document.createElement("div");
    closeBlock.id = "cie-close-block";
  
    let span = document.createElement("span");
    span.classList.add(..."cie-text-20 cie-white".split(" "));
    span.textContent = resources["edit"];
    let closeBtn = CoolImageEditor.icons["close"];
    closeBtn.id = "cie-close-btn";
    closeBtn.classList.add("cie-svg-btn");
    closeBlock.append(closeBtn, span);
    
    let repeatBlock = document.createElement("div");
    repeatBlock.id = "cie-repeat-block";
    let undoBtn = CoolImageEditor.icons["undo"];
    undoBtn.id = "cie-undo-btn";
    undoBtn.classList.add("cie-svg-btn");
    undoBtn.onclick = () => this.renderUndo();
    let redoBtn = CoolImageEditor.icons["redo"];
    redoBtn.id = "cie-redo-btn";
    redoBtn.classList.add("cie-svg-btn");
    redoBtn.onclick = () => this.renderRedo();
  
    repeatBlock.append(undoBtn, redoBtn);
  
    title.append(closeBlock, repeatBlock);
    
    
    let filterIcon = CoolImageEditor.icons["filter"];
    filterIcon.id = "cie-filter-btn";
    filterIcon.classList.add("cie-svg-btn");
    let cropIcon = CoolImageEditor.icons["crop"];
    cropIcon.classList.add("cie-svg-btn");
    cropIcon.id = "cie-crop-btn";
    let textIcon = CoolImageEditor.icons["text"];
    textIcon.classList.add("cie-svg-btn");
    textIcon.id = "cie-text-btn";
    let drawIcon = CoolImageEditor.icons["draw"];
    drawIcon.classList.add("cie-svg-btn");
    drawIcon.id = "cie-draw-btn";
    let stickerIcon = CoolImageEditor.icons["sticker"];
    stickerIcon.classList.add("cie-svg-btn");
    stickerIcon.id = "cie-sticker-btn";
    let saveIcon = CoolImageEditor.icons["save"];
    saveIcon.classList.add("cie-svg-btn");
    saveIcon.id = "cie-save-btn";
    
    saveIcon.onclick = () => {
      if (!this.originalBackgroundImage) {
        return;
      }
  
      let downloadCanvas = document.createElement('canvas');
      downloadCanvas.width = this.originalBackgroundImage.naturalWidth;
      downloadCanvas.height = this.originalBackgroundImage.naturalHeight;
      
      this.isSave = true;
      this.render(downloadCanvas, () => {
        let downloadElement = document.createElement('a');
        downloadElement.href = downloadCanvas.toDataURL(this.originalFile.type);
        downloadElement.download = this.originalFile.name || "";
        downloadElement.click();
      });
    };
    
    let toolTab = new ToolTab({
      events: {
        onClick: (e: MouseEvent) => {
          switch ((e.target as HTMLElement).id) {
            case filterIcon.id:
              this.setCanvasState(this.canvasStates.filter);
              break;
            case cropIcon.id: 
              this.setCanvasState(this.canvasStates.crop);
              break;
            case textIcon.id:
              this.setCanvasState(this.canvasStates.text);
              break;
            case drawIcon.id:
              this.setCanvasState(this.canvasStates.draw);
              break;
            case stickerIcon.id:
              this.setCanvasState(this.canvasStates.sticker);
              break;
            default:
              this.setCanvasState(this.canvasStates.filter);
              break;
          }
        }
      }
    });
  
    let filterBlock = this.generateFilterBlock();
    toolTab.appendTab(filterIcon, filterBlock);
    toolTab.appendTab(cropIcon,   this.generateCropBlock());
    toolTab.appendTab(textIcon,   document.createElement("div"));
    toolTab.appendTab(drawIcon,   document.createElement("div"));
    toolTab.appendTab(stickerIcon, document.createElement("div"));
    toolTab.activateTab(filterIcon, filterBlock);
  
    rightPanel.append(title, toolTab.container, saveIcon);
    
    mainContainer.append(leftPanel, rightPanel);
    return mainContainer;
  }
  
  private generateCropBlock() {
    let cropBlock = document.createElement("div");
    cropBlock.id = "cie-crop-block";
    cropBlock.classList.add("cie-tools-block");
  
    let resetBtn = document.createElement("button");
    resetBtn.id = 'cie-reset';
    resetBtn.onclick = () => this.resetCanvas();
    resetBtn.textContent = "Reset";
  
    cropBlock.append(resetBtn);
    return cropBlock;
  }
  
  private generateFilterBlock() {
    let filterBlock = document.createElement("div");
    filterBlock.id = "cie-filter-block";
    filterBlock.classList.add("cie-tools-block");
    const filterNames: FilterName[] = [
      "enhance",
      "brightness",
      "contrast",
      "saturation",
      "warmth",
    ];
    for (let toolName of filterNames) {
      let config: {
        min: string,
        max: string,
        step: string,
        label: string,
        value: string,
        events?: RangeInput["events"]
      } = {
        min: "-100",
        max: "100",
        step: "1",
        label: resources[toolName] || "",
        value: "0"
      };
  
      switch (toolName) {
        case "brightness":
          config.min = "0";
          config.max = "100";
          config.value = "50";
          config.events = {
            onInput: (e) => {
              this.setFilterConfig("brightness", `${(+(e.target as HTMLInputElement).value) * 2}%`);
              this.render();
            }
          };
          break;
        case "contrast":
          config.events = {
            onInput: (e) => {
              this.setFilterConfig("contrast", `${+(e.target as HTMLInputElement).value + 100}%`);
              this.render();
            }
          };
          break;
        
        case "saturation":
          config.events = {
            onInput: (e) => {
              this.setFilterConfig("saturate", `${+(e.target as HTMLInputElement).value + 100}%`);
              this.render();
            }
          };
          break;
  
        default:
          break;
      }
  
      let tool = new RangeInput(config);
      filterBlock.append(tool.container);
    }
    return filterBlock;
  }
  
  private calculateRealPoint(x: number, y: number) {
    let ctx = this.mainCanvas.getContext("2d");
    if (!ctx) {
      throw new Error(`Canvas ${this.mainCanvas.id} has no context`);
    }

    let scaleLevel = ctx.getTransform().a;
    let dx = ctx.getTransform().e;
    let dy = ctx.getTransform().f;
    return {
      x: (x - dx) / scaleLevel,
      y: (y - dy) / scaleLevel
    };
  }
  
  private renderUndo() {
    let path = this.transformStack.pop();
    if (!path) {
      return;
    }
  
    this.redoStack.push(path);
    this.isUndoOrRedo = true;
    this.render();
  }
  
  private renderRedo() {
    let item = this.redoStack.pop();
    if (!item) {
      return;
    }
  
    this.transformStack.push(item);
    this.isUndoOrRedo = true;
    this.render();
  }
  
  public resizeCanvas() {
    if (!this.originalBackgroundImage) {
      return;
    }
    if (!this.mainCanvas) {
      throw new Error("The main canvas is not initialized");
    }

    let ctx = this.mainCanvas.getContext("2d");
    if (!ctx) {
      throw new Error(`Canvas ${this.mainCanvas.id} has no context`);
    }

    let parentElement = this.mainCanvas.parentElement!;
  
    this.mainCanvas.width = parentElement.clientWidth;
    this.mainCanvas.height = parentElement.clientHeight;
  
    let centerPoint = {
      x: Math.floor(parentElement.clientWidth / 2),
      y: Math.floor(parentElement.clientHeight / 2),
    };
  
    let scaleCoefX = parentElement.clientWidth / this.originalBackgroundImage.naturalWidth;
    let scaleCoefY = parentElement.clientHeight / this.originalBackgroundImage.naturalHeight;
    let scaleCoef = Math.min(scaleCoefX, scaleCoefY);
  
    if (scaleCoef < 1) {
      ctx.translate(centerPoint.x - Math.floor(this.originalBackgroundImage.naturalWidth * scaleCoef / 2), centerPoint.y - Math.floor(this.originalBackgroundImage.naturalHeight * scaleCoef / 2));
      ctx.scale(scaleCoef, scaleCoef);
    } else {
      ctx.translate(centerPoint.x - Math.floor(this.originalBackgroundImage.naturalWidth / 2), centerPoint.y - Math.floor(this.originalBackgroundImage.naturalHeight / 2));
    }
    this.isResize = true;
    this.render();
  }
  
  private render(toCanvas?: HTMLCanvasElement, callback?: () => void) {
    if (!this.originalBackgroundImage) {
      return;
    }
    let canvas = toCanvas || this.mainCanvas;
    if (!canvas) {
      return;
    }
    let ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error(`Canvas ${canvas.id} has no context`);
    }

    requestAnimationFrame(() => {
      if (this.isResize) {
        let transformMatrix = ctx.getTransform();
        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(transformMatrix);
      }
      
      let filter = "";
      for (let [key, value] of Object.entries(this.filterConfig)) {
        filter += `${key}(${value}) `;
      }
      ctx.filter = filter;
      
      if (!this.isDraw() || this.isResize || this.isUndoOrRedo || this.isSave) {
        ctx.drawImage(this.originalBackgroundImage, 0, 0);
      }
  
      // Do not apply filters to drawings.
      ctx.filter = "none";
  
      for (let item of this.transformStack) {
        let { path, color } = item;
        ctx.fillStyle = color;
        ctx.fill(path);
      }
      this.isResize = false;
      this.isUndoOrRedo = false;
      this.isSave = false;
      callback?.call(this);
    });
  }
  
  private canvasMouseMove(e: MouseEvent) {
    if (!this.isMouseDown || e.movementX === 0 && e.movementY === 0) {
      return;
    }
  
    if (this.isDraw()) {
      // Merge previous point with the current.
      let item = this.transformStack[this.transformStack.length - 1];
      if (item) {
        let { x, y } = this.calculateRealPoint(e.offsetX, e.offsetY);
        item.path.addPath(this.createDrawingPath(x, y));
      }
    }
    
    this.render();
  }
  
  private pushPathToTransformStack(path: Path2D) {
    this.redoStack = [];
    // TODO: color.
    this.transformStack.push({
      path: path,
      color: "#ffff00"
    });
  
  }
  
  private canvasMouseDown(e: MouseEvent) {
    if (!this.isDraw()) {
      return;
    }
  
    this.mainCanvas.onmousedown = () => {};
    this.mainCanvas.onmousemove = (e) => this.canvasMouseMove(e);
    this.mainCanvas.onmouseup = () => this.canvasMouseUp();
    document.onmouseup = () => this.canvasMouseUp();
    this.isMouseDown = true;
  
    if (this.isDraw()) {
      let { x, y } = this.calculateRealPoint(e.offsetX, e.offsetY);
      this.pushPathToTransformStack(this.createDrawingPath(x, y));
      this.render();
    }
  }
  
  
  private canvasMouseUp() {
    this.mainCanvas.onmousedown = (e) => this.canvasMouseDown(e);
    this.mainCanvas.onmousemove = () => {};
    this.mainCanvas.onmouseup = () => {};
    document.onmouseup = () => {};
    this.isMouseDown = false;
  }
  
  private createDrawingPath(x: number, y: number) {
    let path = new Path2D();
    // TODO: width.
    // TODO: may be not circles?
    path.arc(x, y, 20,
      0, 2 * Math.PI, false);
    return path;
  }
  
  private isDraw() {
    return this.canvasState.id === this.canvasStates.draw.id;
  }
}