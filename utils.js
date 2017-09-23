/**
 * Basically equals <b>document.querySelector</b> ¯\_(ツ)_/¯<br>
 * Small change? I THINK NOT!
 * @kind method
 */
const $ = function() { return document.querySelector.apply(document, arguments); };

/**
 * Various Math, effect and WebGL utility methods
 * @namespace
 */
var Utils = {
  initializeCanvas: function(canvasObj, forceCtx) {
    // Prepare board mouseover effect
    canvasObj.effectBuffer.board_mouseover = {}
    for(let x = 0; x < 3; x++) {
      for(let y = 0; y < 3; y++) {
        let boardpos = "";
        if(y === 0) boardpos += "t"; else if(y === 2) boardpos += "b";
        if(x === 0) boardpos += "l"; else if(x === 1) boardpos += "m"; else if(x === 2) boardpos += "r";
        canvasObj.effectBuffer.board_mouseover[boardpos] = 0;
      }
    }
    // Set canvas to Canvas object
    canvasObj.canvas = $("#cv");
    if(forceCtx) canvasObj.ctx = canvasObj.canvas.getContext('2d');
    else {
      canvasObj.gl = canvasObj.canvas.getContext('webgl');
      if(!canvasObj.gl) canvasObj.ctx = canvasObj.canvas.getContext('2d');
    }
    window.requestAnimationFrame(Canvas.render);
  },
  /**
   * Math utility methods
   * @namespace
   * @memberof Utils
   */
  math: {
    /**
     * Linear interpolation function, returns a number between <b>a</b> and <b>b</b> by <b>x</b>
     * @param a - Initial number
     * @param b - Number to interpolate to
     * @param x - Percentage to interpolate by, between 0 and 1
     * @returns A number between <b>a</b> and <b>b</b> depending on <b>x</b>
     * @kind method
     */
    lerp: function(a, b, x) {
      return a * (1 - x) + b * x;
    }
  }
}
