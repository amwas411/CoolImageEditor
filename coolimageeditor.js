import resources from './resources.js';
import RangeInput from './components/rangeInput.js';
import ToolTab from './components/toolTab.js';

export default class CoolImageEditor {
  canvasStates = {
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
  icons = {};
  mainCanvas;
  originalBackgroundImage;
  originalFile;
  canvasState = this.canvasStates.filter;
  transformStack = [];
  redoStack = [];
  filterConfig = {};
  isMouseDown = false;
  isResize = false;
  isUndoOrRedo = false;
  isSave = false;

  constructor() {
  }
  
  async construct() {
    await this.loadIcons();
    this.generate();
    window.onresize = () => this.resizeCanvas();
    this.mainCanvas.onmousedown = (e) => this.canvasMouseDown(e);
  }

  setCanvasState(state) {
    this.canvasState = state;
    this.mainCanvas.style.cursor = state.cursorStyle || "default";
  }
  
  setFilterConfig(name, value) {
    if (this.filterConfig[name] === value) {
      return;
    }
  
    this.filterConfig[name] = value;
  }
  
  resetCanvas() {
    // TODO: reset components.
    this.setCanvasState(this.canvasStates.filter);
    this.mainCanvas.getContext("2d").resetTransform();
    this.transformStack = [];
    this.redoStack = [];
    this.filterConfig = {};
    this.isMouseDown = false;
  
    this.resizeCanvas();
  }
  
  async loadIcons() {
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
  
    let values = await Promise.all(promises);
    for (let v of values) {
      let [key, value] = v;
      this.icons[key] = value;
    }
  }
  
  generate() {
    let mainContainer = document.createElement("div");
    mainContainer.id = "cie-main";
  
    let leftPanel = document.createElement("div");
    leftPanel.id = "cie-left-panel";
    let canvas = document.createElement("canvas");
    canvas.id = "cie-canvas";
    leftPanel.append(canvas);
  
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
    let closeBtn = this.icons["close"];
    closeBtn.id = "cie-close-btn";
    closeBtn.classList.add("cie-svg-btn");
    closeBlock.append(closeBtn, span);
    
    let repeatBlock = document.createElement("div");
    repeatBlock.id = "cie-repeat-block";
    let undoBtn = this.icons["undo"];
    undoBtn.id = "cie-undo-btn";
    undoBtn.classList.add("cie-svg-btn");
    undoBtn.onclick = () => this.renderUndo();
    let redoBtn = this.icons["redo"];
    redoBtn.id = "cie-redo-btn";
    redoBtn.classList.add("cie-svg-btn");
    redoBtn.onclick = () => this.renderRedo();
  
    repeatBlock.append(undoBtn, redoBtn);
  
    title.append(closeBlock, repeatBlock);
    
    
    let filterIcon = this.icons["filter"];
    filterIcon.id = "cie-filter-btn";
    filterIcon.classList.add("cie-svg-btn");
    let cropIcon = this.icons["crop"];
    cropIcon.classList.add("cie-svg-btn");
    cropIcon.id = "cie-crop-btn";
    let textIcon = this.icons["text"];
    textIcon.classList.add("cie-svg-btn");
    textIcon.id = "cie-text-btn";
    let drawIcon = this.icons["draw"];
    drawIcon.classList.add("cie-svg-btn");
    drawIcon.id = "cie-draw-btn";
    let stickerIcon = this.icons["sticker"];
    stickerIcon.classList.add("cie-svg-btn");
    stickerIcon.id = "cie-sticker-btn";
    let saveIcon = this.icons["save"];
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
        downloadElement.download = this.originalFile.name;
        downloadElement.click();
      });
    };
    
    let toolTab = new ToolTab({
      events: {
        onClick: (e) => {
          switch (e.target.id) {
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
  
    let fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "cie-fileInput";
    fileInput.accept = "image/png, image/jpeg";
    fileInput.onchange = () => this.fileInputChanged(fileInput);
  
    mainContainer.append(leftPanel, rightPanel, fileInput);
    this.container = mainContainer;
    this.mainCanvas = canvas;
  }
  
  generateCropBlock() {
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
  
  generateFilterBlock() {
    let filterBlock = document.createElement("div");
    filterBlock.id = "cie-filter-block";
    filterBlock.classList.add("cie-tools-block");
    const filterTools = [
      "enhance",
      "brightness",
      "contrast",
      "saturation",
      "warmth",
    ];
    for (let toolName of filterTools) {
      let config = {
        min: -100,
        max: 100,
        step: 1,
        label: resources[toolName],
        value: 0
      };
  
      switch (toolName) {
        case "brightness":
          config.min = 0;
          config.max = 100;
          config.value = 50;
          config.events = {
            onInput: (e) => {
              this.setFilterConfig("brightness", `${(+e.target.value) * 2}%`);
              this.render();
            }
          };
          break;
        case "contrast":
          config.events = {
            onInput: (e) => {
              this.setFilterConfig("contrast", `${+e.target.value + 100}%`);
              this.render();
            }
          };
          break;
        
        case "saturation":
          config.events = {
            onInput: (e) => {
              this.setFilterConfig("saturate", `${+e.target.value + 100}%`);
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
  
  calculateRealPoint(x, y) {
    let ctx = this.mainCanvas.getContext("2d");
    let scaleLevel = ctx.getTransform().a;
    let dx = ctx.getTransform().e;
    let dy = ctx.getTransform().f;
    return {
      x: (x - dx) / scaleLevel,
      y: (y - dy) / scaleLevel
    };
  }
  
  renderUndo() {
    let path = this.transformStack.pop();
    if (!path) {
      return;
    }
  
    this.redoStack.push(path);
    this.isUndoOrRedo = true;
    this.render();
  }
  
  renderRedo() {
    let item = this.redoStack.pop();
    if (!item) {
      return;
    }
  
    this.transformStack.push(item);
    this.isUndoOrRedo = true;
    this.render();
  }
  
  resizeCanvas() {
    if (!this.originalBackgroundImage) {
      return;
    }

    let ctx = this.mainCanvas.getContext("2d");
    let parentElement = this.mainCanvas.parentElement;
  
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
  
  render(toCanvas, callback) {
    if (!this.originalBackgroundImage) {
      return;
    }
    requestAnimationFrame(() => {
      let canvas = toCanvas || this.mainCanvas;
      let ctx = canvas.getContext('2d');
      
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
  
  canvasMouseMove(e) {
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
  
  pushPathToTransformStack(path) {
    this.redoStack = [];
    // TODO: color.
    this.transformStack.push({
      path: path,
      color: "#ffff00"
    });
  
  }
  
  canvasMouseDown(e) {
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
  
  
  canvasMouseUp() {
    this.mainCanvas.onmousedown = () => this.canvasMouseDown();
    this.mainCanvas.onmousemove = () => {};
    this.mainCanvas.onmouseup = () => {};
    document.onmouseup = () => {};
    this.isMouseDown = false;
  }
  
  createDrawingPath(x, y) {
    let path = new Path2D();
    // TODO: width.
    // TODO: may be not circles?
    path.arc(x, y, 20,
      0, 2 * Math.PI, false);
    return path;
  }
  
  fileInputChanged(fileInput) {
    if (fileInput.files.length < 1) {
      return;
    }
  
    let file = fileInput.files[0];
    let img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      this.originalFile = file;
      this.originalBackgroundImage = img;
      this.resetCanvas();
    };
  }
  
  isDraw() {
    return this.canvasState.id === this.canvasStates.draw.id;
  }
}