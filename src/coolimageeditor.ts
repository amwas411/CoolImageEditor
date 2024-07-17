import resources from './resources.js';
import RangeInput from './components/rangeInput.js';
import ToolTab from './components/toolTab.js';
import BaseState from './states/baseState.js';
import { FilterState } from './states/filterState.js';
import { CropState } from './states/cropState.js';
import { TextState } from './states/textState.js';
import { DrawState } from './states/drawState.js';
import { StickerState } from './states/stickerState.js';
import { FilterName, TransformPath } from './types.js';

export default class CoolImageEditor {
  private appState: BaseState;
  private appStates: {
    filter: FilterState,
    crop: CropState,
    text: TextState,
    draw: DrawState,
    sticker: StickerState,
  };
  private mainCanvas: HTMLCanvasElement;
  private mainCtx: CanvasRenderingContext2D;
  private originalBackgroundImage: HTMLImageElement;
  private originalFile: File;
  private transformStack: TransformPath[] = [];
  private redoStack: TransformPath[] = [];
  private filterConfig: {[key: string]: string} = {};
  // public methods guard.
  private isInitialized = false;
  
  private static icons: {[key: string]: HTMLImageElement} = {};

  public container: HTMLDivElement;

  constructor(config: {
    img: HTMLImageElement,
    file: File
  }) {
    this.originalBackgroundImage = config.img;
    this.originalFile = config.file;
    this.mainCanvas = this.generateCanvas();
    let ctx = this.mainCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to obtain 2d context from the main canvas");
    }
    this.mainCtx = ctx;
    this.container = this.generate();
    this.mainCanvas.onmousedown = (e) => this.canvasMouseDown(e);
    this.appStates = {
      filter: new FilterState(
        this.mainCtx, 
        this.originalBackgroundImage, 
        this.filterConfig,
        this.transformStack,
        this.mainCanvas
      ),
      crop: new CropState(),
      text: new TextState(),
      draw: new DrawState(
        this.mainCtx,
        this.transformStack,
        this.redoStack
      ),
      sticker: new StickerState(),
    }
    this.appState = this.appStates.filter;
    window.onresize = () => this.resizeCanvas();
    this.isInitialized = true;
  }

  private setCanvasState(state: BaseState): void {
    this.appState = state;
    this.mainCanvas.style.cursor = state.getCursorStyle();
  }
  
  private reset(): void {
    // TODO: reset components.
    while (this.transformStack.length > 0) {
      this.transformStack.pop();
    }
    while (this.redoStack.length > 0) {
      this.redoStack.pop();
    }
    for (let key in this.filterConfig) {
      this.filterConfig[key] = "none";
    }
    this.mainCtx.reset();
    this.setCanvasState(this.appStates.filter);
    this.resizeCanvas();
  }

  private generateCanvas(): HTMLCanvasElement {
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
    span.textContent = resources.strings["edit"];
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
      let downloadCanvas = document.createElement('canvas');
      downloadCanvas.width = this.originalBackgroundImage.naturalWidth;
      downloadCanvas.height = this.originalBackgroundImage.naturalHeight;
      
      this.render(true, downloadCanvas, () => {
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
              this.setCanvasState(this.appStates.filter);
              break;
            case cropIcon.id: 
              this.setCanvasState(this.appStates.crop);
              break;
            case textIcon.id:
              this.setCanvasState(this.appStates.text);
              break;
            case drawIcon.id:
              this.setCanvasState(this.appStates.draw);
              break;
            case stickerIcon.id:
              this.setCanvasState(this.appStates.sticker);
              break;
            default:
              this.setCanvasState(this.appStates.filter);
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
  
  private generateCropBlock(): HTMLDivElement {
    let cropBlock = document.createElement("div");
    cropBlock.id = "cie-crop-block";
    cropBlock.classList.add("cie-tools-block");
    return cropBlock;
  }
  
  private generateFilterBlock(): HTMLDivElement {
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
        label: resources.strings[toolName] || "",
        value: "0"
      };
  
      switch (toolName) {
        case "brightness":
          config.min = "0";
          config.max = "100";
          config.value = "50";
          config.events = {
            onInput: (e) => {
              this.filterConfig["brightness"] = `${(+(e.target as HTMLInputElement).value) * 2}%`;
              this.render();
            }
          };
          break;
        case "contrast":
          config.events = {
            onInput: (e) => {
              this.filterConfig["contrast"] = `${+(e.target as HTMLInputElement).value + 100}%`;
              this.render();
            }
          };
          break;
        
        case "saturation":
          config.events = {
            onInput: (e) => {
              this.filterConfig["saturate"] = `${+(e.target as HTMLInputElement).value + 100}%`;
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
  
  private renderUndo(): void {
    let path = this.transformStack.pop();
    if (!path) {
      return;
    }
  
    this.redoStack.push(path);
    this.render(true);
  }
  
  private renderRedo(): void {
    let item = this.redoStack.pop();
    if (!item) {
      return;
    }
  
    this.transformStack.push(item);
    this.render(true);
  }
  
  private render(isRerender?: boolean, toCanvas?: HTMLCanvasElement, callback?: () => void): void {
    requestAnimationFrame(() => {
      if (isRerender) {
        this.rerender(toCanvas);
      } else {
        this.appState.render();
      }
      callback?.call(this);
    });
  }

  private rerender(toCanvas?: HTMLCanvasElement): void {
    let canvas = toCanvas || this.mainCanvas;
    let ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error("Unable to obtain 2d context from canvas");
    }

    let transformMatrix = ctx.getTransform();
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(transformMatrix);
    if (toCanvas) {
      ctx.filter = this.mainCtx.filter;
    }
    ctx.drawImage(this.originalBackgroundImage, 0, 0);
    
    // Do not apply filters to drawings.
    let filterCopy = ctx.filter;
    ctx.filter = "none";

    for (let item of this.transformStack) {
      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.width;
      ctx.stroke(item.path);
    }
    ctx.filter = filterCopy;
  }
  
  private canvasMouseMove(e: MouseEvent): void {
    if (e.movementX === 0 && e.movementY === 0) {
      return;
    }
  
    this.appState.canvasMouseMove(e);
    this.render();
  }
  
  private canvasMouseDown(e: MouseEvent): void {
    if (!this.appState.isMouseMoveEventsEnabled()) {
      return;
    }

    this.mainCanvas.onmousedown = () => {};
    this.mainCanvas.onmousemove = (e) => this.canvasMouseMove(e);
    this.mainCanvas.onmouseup = () => this.canvasMouseUp();
    document.onmouseup = () => this.canvasMouseUp();
  
    this.appState.canvasMouseDown(e);
    this.render();
  }
  
  private canvasMouseUp(): void {
    if (!this.appState.isMouseMoveEventsEnabled()) {
      return;
    }

    this.mainCanvas.onmousedown = (e) => this.canvasMouseDown(e);
    this.mainCanvas.onmousemove = () => {};
    this.mainCanvas.onmouseup = () => {};
    document.onmouseup = () => {};
  }

  public setImage(config: {
    img: HTMLImageElement,
    file: File
  }): void {
    if (!this.isInitialized) {
      throw new Error("You must first construst the app.");
    }

    this.reset();
    this.originalBackgroundImage = config.img;
    this.originalFile = config.file;
  }

  public resizeCanvas(): void {
    if (!this.isInitialized) {
      throw new Error("You must first construst the app.");
    }

    let parentElement = this.mainCanvas.parentElement!;
  
    let scaleCoefX = parentElement.clientWidth / this.originalBackgroundImage.naturalWidth;
    let scaleCoefY = parentElement.clientHeight / this.originalBackgroundImage.naturalHeight;
    let scaleCoef = Math.min(scaleCoefX, scaleCoefY);
  
    this.mainCanvas.width = this.originalBackgroundImage.naturalWidth;
    this.mainCanvas.height = this.originalBackgroundImage.naturalHeight;

    if (scaleCoef < 1) {
      this.mainCanvas.width  *= scaleCoef;
      this.mainCanvas.height *= scaleCoef;

      this.mainCtx.scale(scaleCoef, scaleCoef);
    }

    this.render(true);
  }

  public static async loadIcons(): Promise<void> {
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
}