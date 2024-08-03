import BaseState from './baseState.js';

export class FilterState extends BaseState {
  Direction = {
    top: "top",
    right: "right",
    bottom: "bottom",
    left: "left"
  };

  render(): void {
    let cssFilters = ["brightness", "saturate", "contrast"];
    let filter = "";
    for (let [key, value] of Object.entries(this.coolImageEditor.filterConfig)) {
      if (cssFilters.includes(key)) {
        filter += `${key}(${value}) `;
      }
    }
    this.coolImageEditor.mainCtx.filter = filter;
    this.coolImageEditor.mainCtx.drawImage(this.coolImageEditor.originalBackgroundImage, 0, 0);
    let imageData = this.coolImageEditor.mainCtx.getImageData(0, 0,
      this.coolImageEditor.mainCanvas.width,
      this.coolImageEditor.mainCanvas.height
    );

    if (+this.coolImageEditor.filterConfig["sharpen"]) {
      this.applySharpen(this.coolImageEditor.mainCtx, imageData,
        +this.coolImageEditor.filterConfig["sharpen"]);
    }

    if (+this.coolImageEditor.filterConfig["vignette"]) {
      this.applyVignette(this.coolImageEditor.mainCtx, imageData,
        +this.coolImageEditor.filterConfig["vignette"]);
    }

    if (+this.coolImageEditor.filterConfig["grain"]) {
      this.applyGrain(this.coolImageEditor.mainCtx, imageData,
        +this.coolImageEditor.filterConfig["grain"]);
    }

    if (+this.coolImageEditor.filterConfig["warmth"]) {
      this.applyWarmth(this.coolImageEditor.mainCtx, imageData,
        +this.coolImageEditor.filterConfig["warmth"]);
    }

    this.coolImageEditor.mainCtx.putImageData(imageData, 0, 0);

    // Do not apply filters to drawings.
    this.coolImageEditor.mainCtx.save();
    this.coolImageEditor.mainCtx.filter = "none";

    for (let item of this.coolImageEditor.transformStack) {
      this.coolImageEditor.mainCtx.strokeStyle = item.color;
      this.coolImageEditor.mainCtx.lineWidth = item.width;
      this.coolImageEditor.mainCtx.stroke(item.path);
    }

    this.coolImageEditor.mainCtx.restore();
  }

  applyVignette(ctx: CanvasRenderingContext2D, imageData: ImageData, value: number) {
    const canvas = ctx.canvas;
    const data = imageData.data;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            let vignette = 0;
            if (value > 0) {
              vignette = 1 - (distance * value / 100 / Math.sqrt(centerX * centerX + centerY * centerY));
            }

            data[index] *= vignette;
            data[index + 1] *= vignette;
            data[index + 2] *= vignette;
        }
    }
  }

  applyWarmth(ctx: CanvasRenderingContext2D, imageData: ImageData, value: number): void {
    let canvas = ctx.canvas;
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        data[i] += value;
        data[i + 1] += value;
    }
  }
  
  applyGrain(ctx: CanvasRenderingContext2D, imageData: ImageData, value: number): void {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const grain = Math.random() * value;
        data[i] += grain; 
        data[i + 1] += grain;
        data[i + 2] += grain;
    }
  }

  applySharpen(ctx: CanvasRenderingContext2D, imageData: ImageData, value: number): void {
    let kernel = [
      0,0,0,
      0,1,0,
      0,0,0
    ];

    if (value > 0) {
      let c = value / 50 + 1;
      kernel = [
         0,     -1 * c,    0,
        -1 * c,  5 * c,   -1 * c,
         0,     -1 * c,    0,
      ];
    }

    const id = ctx.createImageData(imageData.width, imageData.height);
    const data = id.data;
    const kernelSide = Math.round(Math.sqrt(kernel.length));
    const halfKernelSide = Math.floor(kernelSide / 2);

    for (let y = 0; y < imageData.height; ++y) {
      for (let x = 0; x < imageData.width; ++x) {
        let r, g, b;
        r = g = b = 0;
        
        for (let ky = 0; ky < kernelSide; ++ky) {
          for (let kx = 0; kx < kernelSide; ++kx) {
            let cy = y - halfKernelSide + ky;
            let cx = x - halfKernelSide + kx;
            if (cy < 0) cy = 0;
            if (cy >= imageData.height) cy = imageData.height - 1;
            if (cx < 0) cx = 0;
            if (cx >= imageData.width) cx = imageData.width - 1;

            let wt = kernel[ky * kernelSide + kx];
            let pixel = data.slice((cy * imageData.width + cx)*4, (cy * imageData.width + cx)*4 + 4);

            r += wt * pixel[0];
            g += wt * pixel[1];
            b += wt * pixel[2];
          }
        }
        data[(y * imageData.width + x) * 4 + 0] = r;
        data[(y * imageData.width + x) * 4 + 1] = g;
        data[(y * imageData.width + x) * 4 + 2] = b;
      }
    }
    ctx.putImageData(id, 0,0);
  }
}