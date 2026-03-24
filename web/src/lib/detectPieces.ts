/**
 * detectPieces.ts
 *
 * OpenCV-based tray piece detection.
 * Visualizes the Black & White thresholding change directly on the canvas.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runDetectPieces(
  cv: any,
  src: any,
  imageData: ImageData,
  canvas: HTMLCanvasElement,
  offX: number,
  offY: number,
): void {
  const ctx = canvas.getContext('2d')!;

  // 1. Define the specific "Slice" (65% to 85% of screen height)
  const testYStart = 0.65; 
  const testYEnd   = 0.85; 
  const startY = Math.round(src.rows * testYStart); 
  const endY   = Math.round(src.rows * testYEnd); 
  const scanHeight = endY - startY;

  // Create the ROI (Region of Interest)
  const rect = new cv.Rect(0, startY, src.cols, scanHeight);
  const dockROI = src.roi(rect);

  // 2. Process the Dock into HSV
  const hsv  = new cv.Mat();
  const mask = new cv.Mat();
  cv.cvtColor(dockROI, hsv, cv.COLOR_RGBA2RGB);
  cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

  // 3. Background Filter Logic
  // Targets dark background. Adjust '75' to '110' if the preview is too dark.
  const lowBg  = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 0, 0, 0]);
  const highBg = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [180, 255, 75, 255]); 

  cv.inRange(hsv, lowBg, highBg, mask);
  cv.bitwise_not(mask, mask); // Pieces = White, Background = Black

  // 4. Clean up shapes (removes noise/thin lines)
  const M = cv.Mat.ones(5, 5, cv.CV_8U);
  cv.morphologyEx(mask, mask, cv.MORPH_OPEN, M);

  // --- VISUALIZATION STEP: FIXES THE "WEIRD/SLANTED" PREVIEW ---
  // We must convert 1-channel Grayscale (mask) to 4-channel RGBA for the browser
  const rgbaMask = new cv.Mat();
  cv.cvtColor(mask, rgbaMask, cv.COLOR_GRAY_RGBA);

  // Create ImageData using the RGBA Mat's data and dimensions
  const maskData = new ImageData(
    new Uint8ClampedArray(rgbaMask.data),
    rgbaMask.cols,
    rgbaMask.rows
  );
  
  // Draw the Black and White mask onto the canvas at the correct Y-offset
  const drawYStart = offY + Math.round(imageData.height * testYStart);
  ctx.putImageData(maskData, offX, drawYStart);

  // 5. Extract Piece Data from the mask
  const contours  = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  // 6. Draw detected piece bounding rects (Yellow) on top of the B&W mask
  for (let i = 0; i < contours.size(); i++) {
    const cnt  = contours.get(i);
    const area = cv.contourArea(cnt);

    // Only process objects larger than 400 pixels
    if (area > 400) {
      const bound = cv.boundingRect(cnt);
      const finalX = offX + bound.x;
      const finalY = drawYStart + bound.y;

      ctx.strokeStyle = 'rgba(255, 220, 0, 0.9)';
      ctx.lineWidth   = 2.5;
      ctx.strokeRect(finalX, finalY, bound.width, bound.height);
      
      console.log(`Detected Piece: ${bound.width}x${bound.height}`);
    }
    cnt.delete(); // Memory management for each contour
  }

  // --- CLEANUP SECTION: PREVENTS MEMORY LEAKS ---
  rgbaMask.delete();
  dockROI.delete(); 
  hsv.delete(); 
  mask.delete(); 
  lowBg.delete(); 
  highBg.delete(); 
  M.delete();
  contours.delete(); 
  hierarchy.delete();
}