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
        canvasObj.effectBuffer.board_mouseover[Utils.Effects.getBoardPos(x, y)] = 0;
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
        let pos = Utils.Effects.calculatePos(canvasObj, event);
        // Set the coordinates in the object
        canvasObj.mousePos = pos;
      });
      // Mouse Leave
      canvasObj.canvas.addEventListener('mouseleave', function(event) { if(canvasObj.canvas !== document.elementFromPoint(event.clientX, event.clientY)) canvasObj.mousePos = { x: -1, y: -1 }; });
      // Mouse clickity clack
      canvasObj.canvas.addEventListener('click', function(event) {
        let pos = Utils.Effects.calculatePos(canvasObj, event);
        // Set the coordinates in the object
        canvasObj.mousePos = pos;
        // If no coordinates are -1, send a click event
        if(pos.x !== -1 && pos.y !== -1) canvasObj.click(x, y, event);
      });
    })();

    // TOUCH EVENTS (SINGLE TOUCH RIGHT NOW)
    (function() {
      let lastPos = { x: -1, y: -1 }; // To avoid mouse interference, cause that's a thing
      let touchId = null;
      let moved = false; // Makes touch type = UNKNOWN
      canvasObj.canvas.addEventListener('touchstart', function(event) {
        console.log("TouchStart triggered");
        event.preventDefault();
        if(touchId === null) {
          console.log("Passed");
          touchId = event.targetTouches[0].identifier;
          let pos = Utils.Effects.calculatePos(canvasObj, event.targetTouches[0]);
          moved = false;
          canvasObj.mousePos = pos;
          lastPos = pos;
          canvasObj.touchState = { touching: true, moved: false };
        }
      }, false);
      canvasObj.canvas.addEventListener('touchmove', function(event) {
        console.log("TouchMove triggered");
        event.preventDefault();
        for(let i = 0; i < event.changedTouches.length; i++) {
          if(event.changedTouches[i].identifier === touchId) {
          console.log("Passed");
          let pos = Utils.Effects.calculatePos(canvasObj, event.targetTouches[0]);
          moved = true;
          canvasObj.mousePos = pos;
          lastPos = pos;
          canvasObj.touchState = { touching: true, moved: true };
          }
        }
      }, false);
      canvasObj.canvas.addEventListener('touchcancel', function(event) {
        console.log("TouchCancel triggered");
        event.preventDefault();
        for(let i = 0; i < event.changedTouches.length; i++) {
          if(event.changedTouches[i].identifier === touchId) {
            console.log("Passed");
            moved = false;
            canvasObj.mousePos = { x: -1, y: -1 };
            lastPos = { x: -1, y: -1 };
            canvasObj.touchState = { touching: false, moved: false };
            touchId = null;
          }
        }
      }, false);
      canvasObj.canvas.addEventListener('touchend', function(event) {
        console.log("TouchEnd triggered");
        event.preventDefault();
        for(let i = 0; i < event.changedTouches.length; i++) {
          if(event.changedTouches[i].identifier === touchId) {
            console.log("Passed");
            //let pos = Utils.Effects.calculatePos(canvasObj, event.targetTouches[0]);
            if(moved) canvasObj.touch(lastPos.x, lastPos.y, "UNKNOWN", event);
            else canvasObj.touch(lastPos.x, lastPos.y, "TAP", event);
            moved = false;
            canvasObj.mousePos = { x: -1, y: -1 };
            lastPos = { x: -1, y: -1 };
            canvasObj.touchState = { touching: false, moved: false };
            touchId = null;
          }
        }
      }, false);
    })();

    // CREATE SHADERS AND FRAGMENTS IF RUNNING IN WEBGL MODE
    if(canvasObj.gl) {
      let gl = canvasObj.gl;
      gl.viewport(0, 0, canvasObj.canvas.width, canvasObj.canvas.height);
      Utils.WebGL.loadShader("square-vertex.js", function(err, sv) {
        if(err) { console.error("Failed to load square vertex shader!", err); return; }
        Utils.WebGL.loadShader("fragment.js", function(err, f) {
          if(err) { console.error("Failed to load fragment shader!", err); return; }
          let shaders = Utils.WebGL.initShaders(gl, {sv: sv, f: f});
          let buffers = Utils.WebGL.initBuffers(gl);
          // Combine programs with buffers
          buffers.sv.program = shaders.sv;
          canvasObj.glData = buffers;
          // Use the square program
          gl.useProgram(canvasObj.glData.sv.program);

          canvasObj.glData.sv.program.uColor = gl.getUniformLocation(canvasObj.glData.sv.program, "uColor");
          canvasObj.glData.sv.program.vPosition = gl.getAttribLocation(canvasObj.glData.sv.program, "vPosition");
          gl.enableVertexAttribArray(canvasObj.glData.sv.program.vPosition);

          window.requestAnimationFrame(canvasObj.render);
        });
      });
    } else window.requestAnimationFrame(canvasObj.render);
  },
  /**
   * Various WebGL utility and helper methods
   * @namespace
   * @memberof Utils
   */
  WebGL: {
    /**
     * Load a shader from the webserver
     * @param {string} name - The name of the shader, webgl/ is prefixed
     * @param {method} callback
     */
    loadShader: function(name, callback) {
      let req = new XMLHttpRequest();
      req.open('GET', 'webgl/' + name);
      req.onreadystatechange = function() {
        if(req.readyState === 4) {
          if(req.status !== 200) callback({ status: req.status, message: req.statusText, error: "Failed request" }, null);
          else if(!req.responseText) callback({ status: req.status, message: req.statusText, error: "No data" }, null);
          else callback(null, req.responseText);
          req = null;
        }
      }
      req.send();
    },
    initShaders: function(gl, shaders) {
      // Compile the square vertex shader
      var svs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(svs, shaders.sv);
      gl.compileShader(svs);
      // Compile the fragment shader
      var fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, shaders.f);
      gl.compileShader(fs);
      // Attach and link everything together
      svprogram = gl.createProgram();
      gl.attachShader(svprogram, svs);
      gl.attachShader(svprogram, fs);
      gl.linkProgram(svprogram);

      // ERROR CHECKING
      if (!gl.getShaderParameter(svs, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(svs));
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(fs));
      if (!gl.getProgramParameter(svprogram, gl.LINK_STATUS))
        console.error(gl.getProgramInfoLog(svprogram));

      return {
        sv: svprogram
      }
    },
    /** Initialize all our buffers */
    initBuffers: function(gl) {
      // Create 2 triangles to make a square
      // 0.5 * 360 = 100 - Each square in 2D context has width and height 100px
      let svvertices = new Float32Array([
        -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, // Triangle 1
        -0.5, 0.5, 0.5, -0.5, -0.5, -0.5 // Triangle 2
      ]);

      // Create a buffer and assign the triangles to it
      svbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, svbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, svvertices, gl.STATIC_DRAW);

      return {
        sv: { buffer: svbuffer, itemSize: 2, numItems: svvertices.length / 2 }
      };
    }
  },
  /**
   * Math utility methods
   * @namespace
   * @memberof Utils
   */
  Math: {
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
   * Methods for helping generate Effects
   * @namespace
   * @memberof Utils
   */
  Effects: {
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
    },
    /** Helper function to get mouse/touch position
     * @param {Canvas} canvasObj - Canvas Object
     * @param {MouseEvent/TouchEvent} event
     * @returns {object} X and Y coordinates
     */
    calculatePos: function(canvasObj, event) {
      if(board.style && board.style.getPropertyValue('display') === 'none') { return { x: -1, y: -1 }; };
      // Canvas bounding box
      let rect = canvasObj.canvas.getBoundingClientRect();
      // Our coordinates
      let x = Math.floor((event.clientX - rect.left) / (rect.right - rect.left) * canvasObj.canvas.width);
      let y = Math.floor((event.clientY - rect.top) / (rect.bottom - rect.top) * canvasObj.canvas.height);
      // If the X or Y coordinates are not on the canvas, set them to -1
      if(x < 0 || x > 340) x = -1;
      if(y < 0 || y > 340) y = -1;
      // Return the coordinates
      return { x: x, y: y };
    }
  }
}
