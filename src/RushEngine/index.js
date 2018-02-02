var RushEngine = (function() {
  var engine = function(options) {
    var extended = this._applyDefaults(options);

    this._data = { createdAt: performance.now() };

    this.resetLayers(extended.layers);
    if (typeof extended.stepStart === "function")
      this._data.stepStart = extended.stepStart;
    if (typeof extended.stepEnd === "function")
      this._data.stepEnd = extended.stepEnd;

    if (this.target(extended.target)) {
      if (extended.autoStart) {
        this.start();
      }
    } else {
      console.error(
        "The engine needs a canvas target, even if it's not onscreen."
      );
    }
  };

  engine.prototype._defaults = {
    target: null,
    stepStart: null,
    stepEnd: null,
    layers: null,
    autoStart: true
  };

  engine.prototype._applyDefaults = function(options) {
    if (typeof options !== "object" || typeof options.target === "undefined") {
      console.error('The "target" option is required.');
      return false;
    }

    var data = Object.create(this._defaults);

    for (var key in data) {
      if (typeof options[key] !== "undefined") data[key] = options[key];
    }

    return data;
  };

  engine.prototype.target = function(target) {
    if (target) {
      var targetElement =
        typeof target === "string" ? document.querySelector(target) : target;

      if (targetElement instanceof HTMLCanvasElement) {
        this._data.target = targetElement;
        this._data.context = targetElement.getContext("2d");
        this.setCanvasSize();
      } else {
        console.error(
          'The "target" option must be a canvas element or a string selector to one of them.'
        );
        return false;
      }
    }

    return this._data.target || null;
  };

  engine.prototype.setCanvasSize = function(width, height) {
    var canvasWidth =
      typeof width === "number" ? width : this._data.target.clientWidth;
    var canvasHeight =
      typeof height === "number" ? height : this._data.target.clientHeight;

    this._data.target.width = canvasWidth;
    this._data.target.height = canvasHeight;

    this._data.size = {
      width: canvasWidth,
      height: canvasHeight
    };
  };

  engine.prototype.resetLayers = function(layers) {
    this._data.layers = [];

    if (layers instanceof Array) {
      for (var i = 0, ln = layers.length; i < ln; i++) {
        this.addLayer(layers[i]);
      }
    }
  };

  engine.prototype.addLayer = function(layer) {
    if (layer instanceof RushLayer) {
      this._data.layers.push(layer);
      return this._data.layers.length;
    } else {
      console.error('The "layer" parameter must be a RushLayer instance.');
      return false;
    }
  };

  engine.prototype.removeLayer = function(layer) {
    if (
      layer instanceof RushLayer ||
      (typeof layer === "string" && layer !== "")
    ) {
      for (var i = this._data.layers.length - 1; i >= 0; i--) {
        var currLayer = this._data.layers[i];
        if (currLayer === layer || currLayer.label() === layer) {
          this._data.layers.splice(i, 1);
        }
      }
    } else {
      console.error(
        'The "layer" parameter must be a RushLayer instance or a string representing the layer label.'
      );
    }

    return this._data.layers.length;
  };

  engine.prototype.draw = function() {
    var d = this._data;
    d.context.clearRect(0, 0, d.size.width, d.size.height);

    for (var i = 0, ln = d.layers.length; i < ln; i++) {
      var layer = d.layers[i];

      if (layer.active() && layer.source() && layer.opacity()) {
        var position = layer.position();

        d.context.globalAlpha = layer.opacity();
        d.context.drawImage(layer.source(), position.x, position.y);
      }
    }

    d.context.globalAlpha = 1;
  };

  engine.prototype._step = function(now) {
    var d = this._data,
      offset = now - d.lastCall,
      _this = this;

    if (typeof d.stepStart === "function") d.stepStart(offset, now, d.size);

    this.draw();

    if (typeof d.stepEnd === "function") d.stepEnd(offset, now, d.size);

    d.lastCall = now;

    if (d.running)
      requestAnimationFrame(function(now) {
        _this._step(now);
      });
  };

  engine.prototype.start = function() {
    var now = performance.now();
    d = this._data;

    d.startedAt = now;
    d.lastCall = now;
    d.running = true;

    this._step(now);
  };

  engine.prototype.stop = function() {
    this._data.running = false;
  };

  return engine;
})();