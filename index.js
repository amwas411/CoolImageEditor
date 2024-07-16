import resources from './resources.js';
import RangeInput from './components/rangeInput.js';
import ToolTab from './components/toolTab.js';

//#region Const
const canvasStates = {
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
const components = [];
const icons = {};
let mainCanvas;
let originalBackgroundImage;
let originalFile;
let canvasState = canvasStates.filter;
let transformStack = [];
let redoStack = [];
let filterConfig = {};
let isMouseDown = false;
let isResize = false;
let isUndoOrRedo = false;
//#endregion Const

function setCanvasState(state) {
  canvasState = state;
  mainCanvas.style.cursor = state.cursorStyle || "default";
}

function setFilterConfig(name, value) {
  if (filterConfig[name] === value) {
    return;
  }

  filterConfig[name] = value;
}

function resetCanvas() {
  // TODO: reset
  for (let component of components) {
    component?.reset();
  }

  setCanvasState(canvasStates.filter);
  mainCanvas.getContext("2d").resetTransform();
  transformStack = [];
  redoStack = [];
  filterConfig = {};
  isMouseDown = false;

  resizeCanvas();
}

async function loadIcons() {
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
    icons[key] = value;
  }
}

function generate(renderTo) {
  let container = document.getElementById(renderTo);
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
  let closeBtn = icons["close"];
  closeBtn.id = "cie-close-btn";
  closeBtn.classList.add("cie-svg-btn");
  closeBlock.append(closeBtn, span);
  
  let repeatBlock = document.createElement("div");
  repeatBlock.id = "cie-repeat-block";
  let undoBtn = icons["undo"];
  undoBtn.id = "cie-undo-btn";
  undoBtn.classList.add("cie-svg-btn");
  undoBtn.onclick = () => renderUndo();
  let redoBtn = icons["redo"];
  redoBtn.id = "cie-redo-btn";
  redoBtn.classList.add("cie-svg-btn");
  redoBtn.onclick = () => renderRedo();

  repeatBlock.append(undoBtn, redoBtn);

  title.append(closeBlock, repeatBlock);
  
  
  let filterIcon = icons["filter"];
  filterIcon.id = "cie-filter-btn";
  filterIcon.classList.add("cie-svg-btn");
  let cropIcon = icons["crop"];
  cropIcon.classList.add("cie-svg-btn");
  cropIcon.id = "cie-crop-btn";
  let textIcon = icons["text"];
  textIcon.classList.add("cie-svg-btn");
  textIcon.id = "cie-text-btn";
  let drawIcon = icons["draw"];
  drawIcon.classList.add("cie-svg-btn");
  drawIcon.id = "cie-draw-btn";
  let stickerIcon = icons["sticker"];
  stickerIcon.classList.add("cie-svg-btn");
  stickerIcon.id = "cie-sticker-btn";
  let saveIcon = icons["save"];
  saveIcon.classList.add("cie-svg-btn");
  saveIcon.id = "cie-save-btn";
  
  saveIcon.onclick = () => {
    if (!originalBackgroundImage) {
      return;
    }

    let downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = originalBackgroundImage.naturalWidth;
    downloadCanvas.height = originalBackgroundImage.naturalHeight;
    
    render(downloadCanvas, () => {
      let downloadElement = document.createElement('a');
      downloadElement.href = downloadCanvas.toDataURL(originalFile.type);
      downloadElement.download = originalFile.name;
      downloadElement.click();
    });
  };
  
  let toolTab = new ToolTab({
    events: {
      onClick: (e) => {
        switch (e.target.id) {
          case filterIcon.id:
            setCanvasState(canvasStates.filter);
            break;
          case cropIcon.id: 
            setCanvasState(canvasStates.crop);
            break;
          case textIcon.id:
            setCanvasState(canvasStates.text);
            break;
          case drawIcon.id:
            setCanvasState(canvasStates.draw);
            break;
          case stickerIcon.id:
            setCanvasState(canvasStates.sticker);
            break;
          default:
            setCanvasState(canvasStates.filter);
            break;
        }
      }
    }
  });

  let filterBlock = generateFilterBlock();
  toolTab.appendTab(filterIcon, filterBlock);
  toolTab.appendTab(cropIcon,   generateCropBlock());
  toolTab.appendTab(textIcon,   document.createElement("div"));
  toolTab.appendTab(drawIcon,   document.createElement("div"));
  toolTab.appendTab(stickerIcon, document.createElement("div"));
  toolTab.activateTab(filterIcon, filterBlock);

  rightPanel.append(title, toolTab.container, saveIcon);

  let fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "cie-fileInput";
  fileInput.accept = "image/png, image/jpeg";
  fileInput.onchange = fileInputChanged;

  mainContainer.append(leftPanel, rightPanel, fileInput);
  container.append(mainContainer);

  mainCanvas = canvas;
}

function generateCropBlock() {
  let cropBlock = document.createElement("div");
  cropBlock.id = "cie-crop-block";
  cropBlock.classList.add("cie-tools-block");

  let resetBtn = document.createElement("button");
  resetBtn.id = 'cie-reset';
  resetBtn.onclick = () => resetCanvas();
  resetBtn.textContent = "Reset";

  cropBlock.append(resetBtn);
  return cropBlock;
}

function generateFilterBlock() {
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
            setFilterConfig("brightness", `${(+e.target.value) * 2}%`);
            render();
          }
        };
        break;
      case "contrast":
        config.events = {
          onInput: (e) => {
            setFilterConfig("contrast", `${+e.target.value + 100}%`);
            render();
          }
        };
        break;
      
      case "saturation":
        config.events = {
          onInput: (e) => {
            setFilterConfig("saturate", `${+e.target.value + 100}%`);
            render();
          }
        };
        break;

      default:
        break;
    }

    let tool = new RangeInput(config);
    components.push(tool);
    filterBlock.append(tool.container);
  }
  return filterBlock;
}

async function init(renderTo) {
  await loadIcons();
  generate(renderTo);
  
  window.onresize = () => resizeCanvas();
  mainCanvas.onmousedown = (e) => canvasMouseDown(e);
}

function calculateRealPoint(x, y) {
  let ctx = mainCanvas.getContext("2d");
  let scaleLevel = ctx.getTransform().a;
  let dx = ctx.getTransform().e;
  let dy = ctx.getTransform().f;
  return {
    x: (x - dx) / scaleLevel,
    y: (y - dy) / scaleLevel
  };
}

function renderUndo() {
  let path = transformStack.pop();
  if (!path) {
    return;
  }

  redoStack.push(path);
  isUndoOrRedo = true;
  render();
}

function renderRedo() {
  let item = redoStack.pop();
  if (!item) {
    return;
  }

  transformStack.push(item);
  isUndoOrRedo = true;
  render();
}

function resizeCanvas() {
  let ctx = mainCanvas.getContext("2d");
  let parentElement = mainCanvas.parentElement;

  mainCanvas.width = parentElement.clientWidth;
  mainCanvas.height = parentElement.clientHeight;

  let centerPoint = {
    x: Math.floor(parentElement.clientWidth / 2),
    y: Math.floor(parentElement.clientHeight / 2),
  };

  let scaleCoefX = parentElement.clientWidth / originalBackgroundImage.naturalWidth;
  let scaleCoefY = parentElement.clientHeight / originalBackgroundImage.naturalHeight;
  let scaleCoef = Math.min(scaleCoefX, scaleCoefY);

  if (scaleCoef < 1) {
    ctx.translate(centerPoint.x - Math.floor(originalBackgroundImage.naturalWidth * scaleCoef / 2), centerPoint.y - Math.floor(originalBackgroundImage.naturalHeight * scaleCoef / 2));
    ctx.scale(scaleCoef, scaleCoef);
  } else {
    ctx.translate(centerPoint.x - Math.floor(originalBackgroundImage.naturalWidth / 2), centerPoint.y - Math.floor(originalBackgroundImage.naturalHeight / 2));
  }
  isResize = true;
  render();
}

function render(toCanvas, callback) {
  if (!originalBackgroundImage) {
    return;
  }
  requestAnimationFrame(() => {
    let canvas = toCanvas || mainCanvas;
    let ctx = canvas.getContext('2d');
    
    if (isResize) {
      let transformMatrix = ctx.getTransform();
      ctx.resetTransform();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(transformMatrix);
    }
    
    let filter = "";
    for (let [key, value] of Object.entries(filterConfig)) {
      filter += `${key}(${value}) `;
    }
    ctx.filter = filter;
    
    if (!isDraw() || isResize || isUndoOrRedo) {
      ctx.drawImage(originalBackgroundImage, 0, 0);
    }

    // Do not apply filters to drawings.
    ctx.filter = "none";

    for (let item of transformStack) {
      let { path, color } = item;
      ctx.fillStyle = color;
      ctx.fill(path);
    }
    isResize = false;
    isUndoOrRedo = false;
    callback?.call(this);
  });
}

function canvasMouseMove(e) {
  if (!isMouseDown || e.movementX === 0 && e.movementY === 0) {
    return;
  }

  if (isDraw()) {
    // Merge previous point with the current.
    let item = transformStack[transformStack.length - 1];
    if (item) {
      let { x, y } = calculateRealPoint(e.offsetX, e.offsetY);
      item.path.addPath(createDrawingPath(x, y));
    }
  }
  
  render();
}

function pushPathToTransformStack(path) {
  redoStack = [];
  // TODO: color.
  transformStack.push({
    path: path,
    color: "#ffff00"
  });

}

function canvasMouseDown(e) {
  if (!isDraw()) {
    return;
  }

  mainCanvas.onmousedown = () => {};
  mainCanvas.onmousemove = (e) => canvasMouseMove(e);
  mainCanvas.onmouseup = canvasMouseUp;
  document.onmouseup = canvasMouseUp;
  isMouseDown = true;

  if (isDraw()) {
    let { x, y } = calculateRealPoint(e.offsetX, e.offsetY);
    pushPathToTransformStack(createDrawingPath(x, y));
    render();
  }
}


function canvasMouseUp() {
  mainCanvas.onmousedown = canvasMouseDown;
  mainCanvas.onmousemove = () => {};
  mainCanvas.onmouseup = () => {};
  document.onmouseup = () => {};
  isMouseDown = false;
}

function createDrawingPath(x, y) {
  let path = new Path2D();
  // TODO: width.
  // TODO: may be not circles?
  path.arc(x, y, 20,
    0, 2 * Math.PI, false);
  return path;
}

function fileInputChanged() {
  if (this.files.length < 1) {
    return;
  }

  let file = this.files[0];
  let img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = () => {
    originalFile = file;
    originalBackgroundImage = img;
    resetCanvas();
  };
}

function isDraw() {
  return canvasState.id === canvasStates.draw.id;
}

init("main-container");