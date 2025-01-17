export type FilterName = "brightness" | "contrast" | "saturation" | "convolution";
export type CursorStyle = "default" | "crosshair" | "grab";
export type TransformPath = {
  path: Path2D, 
  color: string,
  point: {x: number, y: number},
  width: number
};