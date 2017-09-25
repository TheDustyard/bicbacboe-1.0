/**
 * Basically equals <b>document.querySelector</b> ¯\_(ツ)_/¯<br>
 * Small change? I THINK NOT!
 * @kind method
 */
const $ = function() { return document.querySelector.apply(document, arguments); };

// A shim to better accomodate browsers without requestAnimationFrame
// Thanks https://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

/**
 * Various Math, effect and WebGL utility methods
 * @namespace
 */
var Utils = {
  /**
   * Initialize a Canvas object
   * @param canvasObj - A Canvas object (<b>Not</b> element!)
   * @param {boolean} forceCtx - Whenever to use 2D context at all times or not
   */
  initializeCanvas: function(canvasObj, forceCtx) {
    // Prepare board mouseover effect
    canvasObj.effectBuffer.board_mouseover = {};
    for(let x = 0; x < 3; x++) {
      for(let y = 0; y < 3; y++) {
        canvasObj.effectBuffer.board_mouseover[Utils.effects.getBoardPos(x, y)] = 0;
      }
    }
    // Set canvas to Canvas object
    canvasObj.canvas = $("#cv");
    if(forceCtx) canvasObj.ctx = canvasObj.canvas.getContext('2d');
    else {
      canvasObj.gl = canvasObj.canvas.getContext('webgl');
      if(!canvasObj.gl) canvasObj.ctx = canvasObj.canvas.getContext('2d');
    }

    if(canvasObj.ctx) canvasObj.ctx.lineWidth = 15;

    // MOUSE EVENTS
    (function() {
      // Mouse Move event on Canvas
      canvasObj.canvas.addEventListener('mousemove', function(event) {
        // If board isn't visible, set X and Y to -1
        if(board.style && board.style.getPropertyValue('display') === 'none') { canvasObj.mousePos = { x: -1, y: -1 }; return; }
        // Canvas bounding box
        let rect = canvasObj.canvas.getBoundingClientRect();
        // Our coordinates
        let x = Math.floor((event.clientX - rect.left) / (rect.right - rect.left) * canvasObj.canvas.width);
        let y = Math.floor((event.clientY - rect.top) / (rect.bottom - rect.top) * canvasObj.canvas.height);
        // Finally, set the coordinates in the object
        canvasObj.mousePos = { x: x, y: y };
      });
      // Mouse Leave
      canvasObj.canvas.addEventListener('mouseleave', function(event) { if(canvasObj.canvas !== document.elementFromPoint(event.clientX, event.clientY)) canvasObj.mousePos = { x: -1, y: -1 }; });
      // Mouse clickity clack
      canvasObj.canvas.addEventListener('click', function(event) {
        if(board.style && board.style.getPropertyValue('display') === 'none') { canvasObj.mousePos = { x: -1, y: -1 }; return; };
        // Canvas bounding box
        let rect = canvasObj.canvas.getBoundingClientRect();
        // Our coordinates
        let x = Math.floor((event.clientX - rect.left) / (rect.right - rect.left) * canvasObj.canvas.width);
        let y = Math.floor((event.clientY - rect.top) / (rect.bottom - rect.top) * canvasObj.canvas.height);
        // If the X or Y coordinates are not on the canvas, set them to -1
        if(x < 0 || x > 340) x = -1;
        if(y < 0 || y > 340) y = -1;
        // Set the coordinates in the object
        canvasObj.mousePos = { x: x, y: y };
        // If no coordinates are -1, send a click event
        if(x !== -1 && y !== -1) canvasObj.click(x, y, event);
      });
    })();

    // TOUCH EVENTS (SINGLE TOUCH RIGHT NOW)
    (function() {
      // Touch events are much harder to process properly, so we need these
      // HOLD EVENTS ARE WIP
      //var maxHoldTime = 250;
      //let holdTime = 0; // If movedTooMuch is not true and holdTime reaches maxHoldTime, it will fire a type = HOLD event. If released before 250, a type = TAP event is fired
      //let holdFired = false;
      let alterPos = {x: 0, y: 0};
      let movedTooMuch = false; // Makes touch type = UNKNOWN instead of HOLD
      canvasObj.canvas.addEventListener('touchstart', function(event) {

      });
    })();

    window.requestAnimationFrame(canvasObj.render);
  },
  /**
   * Math utility methods
   * @namespace
   * @memberof Utils
   */
  math: {
    /**
     * Linear interpolation function (goes fast then slows down), returns a number between <b>a</b> and <b>b</b> by <b>x</b>
     * @param {number} a - Initial number
     * @param {number} b - Number to interpolate to
     * @param {number} x - Percentage to interpolate by, between 0 and 1
     * @returns {number} A number between <b>a</b> and <b>b</b> depending on <b>x</b>
     * @kind method
     */
    lerp: function(a, b, x) {
      //return a * (1 - (x / 3)) + b * (x / 3); // Inaccurate
      return a * (1 - x) + b * x;
    }
  },
  /**
   * Methods for helping generate effects
   * @namespace
   * @memberof Utils
   */
  effects: {
    /**
     * Generate a board position (in a string) from X and Y coordinates
     * @param {number} x
     * @param {number} y
     * @param {boolean} shortened - If the position should be shortened (bottomLeft X bl)
     * @returns {string} The board position
     */
    getBoardPos: function(x, y, shortened) {
      if(typeof x !== 'number') throw new TypeError(x.toString() + " is not a number!");
      else if(typeof y !== 'number') throw new TypeError(y.toString() + " is not a number!");
      switch(x.toString() + y.toString()) {
        // TOP ROW
        case "00": // Top Left
          if(shortened) return "tl";
          else return "topLeft";
          break;
        case "10": // Top
          if(shortened) return "t";
          else return "top";
          break;
        case "20": // Top Right
          if(shortened) return "tr";
          else return "topRight";
          break;
        // MIDDLE ROW
        case "01": // Left
          if(shortened) return "l";
          else return "left";
          break;
        case "11": // Middle
          if(shortened) return "m";
          else return "middle";
          break;
        case "21": // Right
          if(shortened) return "r";
          else return "right";
          break;
        // BOTTOM ROW
        case "02": // Bottom Left
          if(shortened) return "bl";
          else return "bottomLeft";
          break;
        case "12": // Bottom
          if(shortened) return "b";
          else return "bottom";
          break;
        case "22": // Bottom Right
          if(shortened) return "br";
          else return "bottomRight";
          break;
        default:
          console.warn("X " + x + " and Y " + y + " are not valid board coordinates!");
          return null;
      }
    },
    // 2D Context does have a circle function, but it's not standardized
    /**
     * A 2D Context draw ellipse function, because the built-in one is not standardized
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {number} w - Width
     * @param {number} h - Height
     */
    ctxDrawEllipse: function(ctx, x, y, w, h) {
      var kappa = .5522848,
          ox = (w / 2) * kappa, // control point offset horizontal
          oy = (h / 2) * kappa, // control point offset vertical
          xe = x + w,           // x-end
          ye = y + h,           // y-end
          xm = x + w / 2,       // x-middle
          ym = y + h / 2;       // y-middle

      ctx.beginPath();
      ctx.moveTo(x, ym);
      ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
      ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
      ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
      ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
      //ctx.closePath(); // not used correctly, see comments (use to close off open path)
      ctx.stroke();
    }
  }
}
