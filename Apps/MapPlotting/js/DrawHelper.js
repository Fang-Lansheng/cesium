/// <reference path="initCesium.js" />

import { OpsWorks } from "aws-sdk";

/**
 * 参考：
 * https://github.com/leforthomas/cesium-drawhelper/blob/master/DrawHelper.js
 */


var DrawHelper = (function() {

  // static variables
  var ellipsoid = Cesium.Ellipsoid.WGS84;

  // constructor
  function _(cesiumWidget) {
    this._scene = cesiumWidget.scene;
    this._tooltip = createTooltip(cesiumWidget.container);
    this._surface = [];

    this.initialiseHandlers();
    this.enhancePrimitives();
  }

  // 初始化 Hander
  _.prototype.initialiseHandlers = function() {
    // prototype 属性允许您向对象添加属性和方法
    var scene = this._scene;
    var _self = this;

    // scene events
    var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    // 使用 ScreenSpaceEvenHandler，一组在用户输入操作上触发指定功能的处理程序
    function callPrimitiveCallback(name, position) {
      if (_self._handlerMuted == true) return;
      var pickedObject = scene.pick(position);
      if (pickedObject && pickedObject.primitive && pickedObject.primitive[name]) {
        // 当 primitive 被选中时
        pickedObject.primitive[name](position);
      }
    }
    // ScreenSpaceEventHandler.setInputAction() 监听操作类型 ScreenSpaceEventType 的种类，
    // 并运行一个特定的函数，将用户操作作为参数传递
    // 左键点击时，callPrimitiveCallback 返回 'leftClick'
    handler.setInputAction(function(movement) {
      callPrimitiveCallback('leftClick', movement.position);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    // 左键双击时，callPrimitiveCallback 返回 'leftDoubleClick'
    handler.setInputAction(function(movement) {
      callPrimitiveCallback('leftDoubleClick', movement.position);
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    var mouseOutObject;
    // 随着鼠标移动，判断是否选中 primitive
    handler.setInputAction(function(movement) {
      if (_self._handlerMuted == true) return;
      var pickedObject = scene.pick(movement.position);
      if (mouseOutObject && (!pickedObject || mouseOutObject != pickedObject.primitive)) {
        !(mouseOutObject.isDestroyed && mouseOutObject.isDestroyed()) && mouseOutObject.mouseOut(movement.endPosition);
        mouseOutObject = null;
      }
      // 当鼠标选中 primitive 时
      if (pickedObject && pickedObject.primitive) {
        pickedObject = pickedObject.primitive;
        if (pickedObject.mouseOut) {
          mouseOutObject = pickedObject;
        }
        if (pickedObject.mouseMove) {
          pickedObject.mouseMove(movement.endPosition);
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 左键抬起时，callPrimitiveCallback 返回 'leftUp'
    handler.setInputAction(function(movement) {
      callPrimitiveCallback('leftUp', movement.position);
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
    // 左键按下时，callPrimitiveCallback 返回 'leftDown'
    handler.setInputAction(function(movement) {
      callPrimitiveCallback('leftDown', movement.position);
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
  }

  // 设置监听器
  _.prototype.setListener = function(primitive, type, callback) {
    primitive[type] = callback;
  }

  // muteHandler：消除 Handler
  _.prototype.muteHandler = function(muted) {
    this._handlerMuted = muted;
  }

  // register event handling for an editable shape
  // shape should implement setEditMode and setHighlighted
  // 设置 shape 的编辑模式
  _.prototype.registerEditableShape = function(surface) {
    var _self = this;

    // handlers for interactions
    // highlight polygon when mouse is entering
    setListener(surface, 'mouseMove', function(position) {
      // 鼠标移动，停留在 shape 上时，该 shape 高亮
      surface.setHighlighted(true);
      // 同时 tooltip 提示（当未进入编辑模式时）
      if (!surface._editMode) {
        _self._tooltip.showAt(position, 'Click to edit this shape');
      }
    })
    // hide the highlighting when mouse is leaving the polygon
    setListener(surface, 'mouseOut', function(position) {
      // 鼠标移开时，取消高亮
      surface.setHighlighted(false);
      // 同时隐藏 tooltip
      _self._tooltip.setVisible(false);
    })
    setListener(surface, 'leftClick', function(position) {
      // 左键单击后，进入 EditMode
      surface.setEditMode(true);
    })
  } 

  // 清楚所有图形
  _.prototype.startDrawing = function(cleanUp) {
    // undo any current edit of shapes
    this.disableAllEditMode();  // 退出所有编辑模式
    // check for cleanUp first
    if (this.editCleanUp) {
      this.editCleanUp();
    }
    this.editCleanUp = cleanUp;
    this.muteHandler(true); // 清楚所有 Handler
  }

  // stopDrawing
  _.prototype.stopDrawing = function() {
    // check for cleanUp first
    if (this.editCleanUp) {
      this.editCleanUp();
      this.editCleanUp = null;
    }
    this.muteHandler(false);
  }

  // make sure only one shape is highlighted at a time
  // 取消所有 shape 的高亮 （确保同时只有一个 shape 被高亮） 
  _.prototype.disableAllHighlights = function() {
    this.setHighlighted(undefined);
  }

  // 设置高亮
  _.prototype.setHighlighted = function(surface) {
    // 当目标 shape 已被高亮 & 未被取消高亮 & 处于高亮的不是目标图形
    if (this._highlightedSurface && 
        !this._highlightedSurface.isDestroyed() && 
        this._highlightedSurface != surface) {
      this._highlightedSurface.setHighlighted(false); // 取消高亮
    }
    this._highlightedSurface = surface;
  }

  // 取消所有图形的编辑
  _.prototype.disableAllEditMode = function() {
    this.setEdited(undefined);
  }

  // 设置编辑
  _.prototype.setEdited = function() {
    // 当目标图形已经被编辑 & 尚未取消编辑
    if (this._editedSurface && !this._editedSurface.isDestroyed()) {
      this._editedSurface.setEditMode(false); // 取消编辑
    }
    this._editedSurface = surface;
  }

  // 设置材质
  var material = Cesium.Material.fromType(Cesium.Material.ColorType);
  material.uniforms.color = new Cesium.Color(1.0, 1.0, 0.0, 0.5);
  
  // 默认 shape 的选项 （类似于 Cesium.Primitive 的属性设置）
  var defaultShapeOptions = {
    ellipsoid: Cesium.Ellipsoid.WGS84,  // WGS84 椭球体
    textureRotationAngle: 0.0,  // 纹理旋转角度：0.0
    height: 0.0,
    asynchronous: true,         // 异步
    show: true,
    debugShowBoundingVolume: false  // 不显示 debug 模式下的包围盒
  }

  var defaultSurfaceOptions = copyOptions(defaultShapeOptions, {
    appearance: new Cesium.EllipsoidSurfaceAppearance({
      aboveGround: false
    }),
    material: material,
    granularity: Math.PI / 180.0
  })

  var defaultPolygonOptions = copyOptions(defaultShapeOptions, {});               // 多边形
  var defaultExtentOptions = copyOptions(defaultShapeOptions, {});    
  var defaultCircleOptions = copyOptions(defaultShapeOptions, {});                // 圆
  var defaultEllipseOptions = copyOptions(defaultSurfaceOptions, {rotation: 0});  // 椭圆
  var defaultPolylineOptions = copyOptions(defaultShapeOptions, {                 // 多段线
    width: 5,
    geodesic: true,   // 测量的
    granularity: 10000,
    appearance: new Cesium.PolylineMaterialAppearance({
      aboveGround: false
    }),
    material: material
  })

  // Cesium.Polygon.prototype.setSrokeStyle = setStrokeStyle;
  // Cesium.Polygon.prototype.drawOutline = drawOutline;

  // 可编辑图形 ChangeablePrimitive 的实现
  var ChangeablePrimitive = (function() {
    function _() {}

    // 初始化 ChangeablePrimitive 的选项
    _.prototype.initialiseOptions = function(options) {
      fillOptions(this, options);

      this._ellipsoid = undefined;
      this._granularity = undefined;
      this._height = undefined;
      this._textureRotationAngle = undefined;
      this._id = undefined;

      // set the flags to initiate a first drawing
      this._createPrimitive = true;
      this._primitive = undefined;
      this._outlinePolygon = undefined;
    }

    // 设置属性
    _.prototype.setAttribute = function(name, value) {
      this[name] = value;
      this._createPrimitive = true;
    }

    // 获取属性
    _.prototype.getAttribute = function(name) {
      return this[name];
    }

    /**
     * @private
     */
    _.prototype.update = function(context, frameState, commandList) {
      // 当 this.ellipsoid == undefined
      if (!Cesium.undefined(this.ellipsoid)) {
        throw new Cesium.DeveloperError('this.ellipsoid must be defined.');
      }
      // 当 this.appearance == undefined
      if (!Cesium.undefined(this.appearance)) {
        throw new Cesium.DeveloperError('this.material must be defined.');
      }
      
      if (this.granularity < 0.0) {
        throw new Cesium.DeveloperError(
          'this.granularity and scene2D/scene3D overrides must be greater than zero.');
      }

      if (!this.show) {
        return;
      }

      if (!this._createPrimitive && (!Cesium.defined(this._primitive))) {
        // Mo positions/hierarchy to draw
        return;
      }

      if (this._createPrimitive ||
          (this._ellipsoid !== this.ellipsoid) ||
          (this._granularity !== this.granularity) ||
          (this._height !== this.height) ||
          (this._textureRotationAngle !== this.textureRotationAngle) ||
          (this._id !== this.id)) {
        var geometry = this.getGeometry();
        if (!geometry) {
          return;
        }

        this._createPrimitive = false;
        this._ellipsoid = this.ellipsoid;
        this._granularity = this.granularity;
        this._height = this.height;
        this._textureRotationAngle = this.textureRotationAngle;
        this._id = this.id;

        this._primitive = this._primitive && this._primitive.destroy();

        // this._primitive 是一个 Cesium.Primitive 实例
        this._primitive = new Cesium.Primitive({
          geometryInstance: new Cesium.GeometryInstance({
            geometry: geometry,
            id: this.id,
            pickPrimitive: this
          }),
          appearance: this.appearance,
          asynchronous: this.asynchronous
        })

        // 设置图形 highlight 时的外框
        this._outlinePolygon = this._outlinePolygon && this._outlinePolygon.destroy();
        if (this.strokeColor && this.getOutlineGeometry) {
          // create the highlighting frame
          this._outlinePolygon = new Cesium.Primitive({
            // 设置 GeometryInstance
            geometryInstance: new Cesium.GeometryInstance({
              geometry: this.getOutlineGeometry(),   // 该函数可以获取目标 outline 的几何形状
              attributes: { // 实例的属性
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(this.strokeColor)
              }
            }),
            // 设置每个实例的颜色
            appearance: new Cesium.PerInstanceColorAppearance({
              flat: true, // 不考虑光照，平面着色
              renderState: {  // The WebGL fixed-function state to use when rendering the geometry.
                depthTest: {
                  enabled: true
                },
                lineWidth: Math.min(this.strokeWidth || 4.0, context._aliasedLineWidthRange[1])
              }
            }) 
          }) // this._outlinePolygon
        }
      }

      var primitive = this._primitive;
      primitive.appearance.material = this.material;
      primitive.debugShowBoundingVolume = this.debugShowBoundingVolume;
      primitive.update(context, frameState, commandList);
      this._outlinePolygon && this._outlinePolygon.update(context, frameState, commandList);
    }

    _.prototype.isDestroyed = function() {
      return false;
    }

    _.prototype.destroy = function() {
      this._primitive = this._primitive && this._primitive.destroy();
      return Cesium.destroyObject(this);
    }

    // 设置笔画的形式
    _.prototype.setStrokeStyle = function(strokeColor, strokeWidth) {
      if (!this.strokeColor || !this.strokeColor.equals(strokeColor) || 
          this.strokeWidth != strokeWidth) {
        this._createPrimitive = true;
        this.strokeColor = strokeColor;
        this.strokeWidth = strokeWidth;
      }
    }

    return _;
  })();

  _.ExtentPrimitive = (function() {
    function _(options) {
      if (!Cesium.defined(options.extent)) {
        throw new Cesium.DeveloperError('Extent is required.');
      }

      options = copyOptions(options, defaultSurfaceOptions);
      this.initialiseOptions(options);
      this.setExtent(options.extent);
    }

    _.prototype = new ChangeablePrimitive();

    _.prototype.setExtent = function() {
      this.setAttribute('exent', extent);
    }

    _.prototype.getExtent = function() {
      return this.getAttribute('extent');
    }

    _.prototype.getGeometry = function() {
      if (!Cesium.defined(this.extent)) {
        return;
      }

      return new Cesium.RectangleGeometry({
        rectangle: this.extent,
        height: this.height,
        vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,  // 要计算的顶点属性
        stRotation: this.textureRotationAngle,  // 纹理坐标的旋转，以弧度表示。正向旋转是逆时针方向
        ellipsoid: this.ellipsoid,  // 矩形所在的椭球
        granularity: this.granularity // 每个经度和纬度之间的距离，以弧度表示。确定缓冲区中的位置数
      })
    }

    _.prototype.getOutlineGeometry = function() {
      return new Cesium.RectangleOutlineGeometry({
        rectangle: this.extent
      })
    }
    
    return _;
  })();

  _.PolygonPrimitive = (function() {
    function _(options) {
      options = copyOptions(options, defaultSurfaceOptions);
      this.initialiseOptions(options);
      this.isPolygon = true;
    }

    _.prototype = new ChangeablePrimitive();

    _.prototype.setPositions = function(positoins) {
      this.setAttribute('positions', positoins);
    }

    _.prototype.getPositions = function(positions) {
      return this.getAttribute('positions');
    }

    _.prototype.getGeometry = function() {
      if (!Cesium.defined(this.positions) || this.positions.length < 3) {
        return;
      }
      return Cesium.PolygonGeometry.fromPositions({
        positions: this.positions,
        height: this.height,
        vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
        stRotation: this.textureRotationAngle,
        ellipsoid: this.ellipsoid,
        granularity: this.granularity
      })
    }

    _.prototype.getOutlineGeometry = function() {
      return Cesium.PolygonOutlineGeometry.fromPositions({
        positions: this.getPositions()
      })
    }

    return _;
  })();

  _.CirclePrimitive = (function() {
    function _(options) {
      if (!(Cesium.defined(options.center) && Cesium.defined(options.radius))) {
        throw new Cesium.DeveloperError('Center and radius are required.');
      }

      options = copyOptions(options, defaultSurfaceOptions);

      this.initialiseOptions(options);
      this.setRadius(options.radius);
    }

    _.prototype = new ChangeablePrimitive();

    _.prototype.setCenter = function(center) {
      this.setAttribute('center', center);
    }

    _.prototype.setRadius = function(radius) {
      this.setAttribute('radius', Math.max(0.1, radius));
    }

    _.prototype.getCenter = function() {
      return this.getAttribute('center');
    }

    _.prototype.getRadius = function() {
      return this.getAttribute('radius');
    }

    _.prototype.getGeometry = function() {
      // 未定义 center 和 radius 时
      if (!(Cesium.defined(this.center) && Cesium.defined(this.radius))) {
        return;
      }

      return new Cesium.CircleGeometry({
        center: this.center,
        radius: this.radius,
        height: this.height,
        vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
        stRotation: this.textureRotationAngle,
        ellipsoid: this.ellipsoid,
        granularity: this.granularity
      })
    }

    _.prototype.getOutlineGeometry = function() {
      return new Cesium.CircleOutlineGeometry({
        center: this.getCenter(),
        radius: this.getRadius()
      })
    }

    return _;
  })();

  _.EllipsePrimitive=  (function() {
    function _(options) {
      if (!(Cesium.defined(options.center) && 
            Cesium.defined(options.semiMajorAxis) && Cesium.defined(options.semiMinorAxis))) {
        throw new Cesium.DeveloperError('center and semi major and semi minor axis are required.');
      }

      options = copyOptions(options, defaultEllipseOptions);
      this.initialiseOptions(options);
    }

    _.prototype = new ChangeablePrimitive();

    _.prototype.setCenter = function(center) {
      this.setAttribute('center', center);
    }

    _.prototype.setSemiMajorAxis = function(semiMajorAxis) {
      if (semiMajorAxis < this.getSemiMinorAxis()) return;
      this.setAttribute('semiMajorAxis', semiMajorAxis);
    }

    _.prototype.setSemiMinorAxis = function(semiMinorAxis) {
      if (semiMinorAxis > this.getSemiMajorAxis()) return;
      this.setAttribute('semiMinorAxis', semiMinorAxis);
    }

    _.prototype.setRotation = function() {
      return this.setAttribute('rotation', rotation);
    }

    _.prototype.getCenter = function() {
      return this.getAttribute('center');
    }

    _.prototype.getSemiMajorAxis = function() {
      return this.getAttribute('semiMajorAxis');
    }

    _.prototype.getSemiMinorAxis = function() {
      return this.getAttribute('semiMinorAxis');
    }

    _.prototype.getRotation = function() {
      return this.getAttribute('rotation');
    }

    _.prototype.getGeometry = function() {
      if (!(Cesium.defined(this.center) && 
            Cesium.defined(this.semiMajorAxis) && Cesium.defined(this.semiMinorAxis))) {
        return;
      }

      return new Cesium.EllipseGeometry({
        ellipsoid: this.ellipsoid,
        center: this.center,
        semiMajorAxis: this.semiMajorAxis,
        semiMinorAxis: this.semiMinorAxis,
        rotation: this.rotation,
        height: this.height,
        vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
        stRotation: this.textureRotationAngle,
        granularity: this.granularity
      });
    }

    _.prototype.getOutlineGeometry = function() {
      return new Cesium.EllipseOutlineGeometry({
        center: this.getCenter(),
        semiMajorAxis: this.getSemiMajorAxis(),
        semiMinorAxis: this.getSemiMinorAxis(),
        rotation: this.getRotation()
      });
    }

    return _;
  })();

  _.PolylinePrimitive = (function() {
    function _(options) {
      options = copyOptions(options, defaultPolylineOptions);
      this.initialiseOptions(options);
    }

    _.prototype = new ChangeablePrimitive();

    _.prototype.setPositions = function(positions) {
      this.setAttribute('positions', positions);
    }

    _.prototype.setWidth = function(width) {
      this.setAttribute('width', width);
    }

    _.prototype.setGeodesic = function(geodesic) {
      tihs.setAttribute('geodesic', geodesic);
    }

    _.prototype.getPositions = function() {
      return this.getAttribute('positions');
    }

    _.prototype.getWidth = function() {
      return this.getAttribute('width');
    }

    _.prototype.getGeodesic = function(geodesic) {
      return this.getAttribute('geodesic');
    }

    _.prototype.getGeometry = function() {
      if (!Cesium.defined(this.positions) || this.positions.length < 2) {
        return;
      }

      return new Cesium.PolylineGeometry({
        positions: this.positions,
        height: this.height,
        width: this.width < 1 ? 1 : this.width,
        vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
        ellipsoid: this.ellipsoid
      });
    }

    return _;
  })();

  var defaultBillboard = {
    iconUrl: './source/dragIcon.png',
    shiftX: 0,
    shiftY: 0
  };

  var dragBillboard = {
    iconUrl: './source/dragIcon.png',
    shiftX: 0,
    shiftY: 0
  };

  _.prototype.createBillboardGroup = function(points, options, callbacks) {
    var markers = new _.BillboardGroup(this, options);
    markers.addBillboard(points, callbacks);
    return markers;
  }

  _.BillboardGroup = function(drawHelper, options) {
    this._drawHelper = drawHelper;
    this._scene = drawHelper._scene;
    this._options = copyOptions(options, defaultBillboard);

    // create one common billboard collection for all billboard
    var b = new Cesium.BillboardCollection();
    this._scene.primitives.add(b);
    this._billboards = b;
    // keep an orderd list of billboards
    this._orderedBillboards = [];
  }

  _.BillboardGroup.prototype.createBillboard = function(position, callbacks) {
    var billboard = this._billboards.add({
      show: true,
      position: position,
      pixelOffset: new Cesium.Cartesian2(this._options.shiftX, this._options.shiftY),
      eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0),
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      scale: 1.0,
      image: this._options.iconUrl,
      color: new Cesium.Color(1.0, 1.0, 1.0, 1.0)
    });

    // if editable
    if (callbacks) {
      var _self = this;
      var screenSpaceCameraController = this._scene.screenSpaceCameraController;

      function enableRotation(enable) {
        screenSpaceCameraController.enableRotate = enable;
      }

      function getIndex() {
        // find index
        for (var i = 0, I = _self._orderedBillboards.length; i < I && _self._orderedBillboards[i] != billboard; ++i);
        return i;
      }
      
      if (callbacks.dragHandlers) {
        var _self = this;
        setListener(billboard, 'leftDown', function(position) {
          // TODO - start the drag handler here
          // create handlers for mouseOut and leftUp for the billboard and a mouseMove
          function onDrag(position) {
            billboard.position = position;
            // find index
            for (var i = 0; i < _self._orderedBillboards.length && _self._orderedBillboards[i] != billboard; ++i);
            callbacks.dragHandlers.onDrag && callbacks.dragHandlers.onDrag(getIndex(), position);
          }

          function onDragEnd(position) {
            handler.destroy();
            enableRotation(true);
            callbacks.dragHandlers.onDragEnd && callbacks.dragHandlers.onDragEnd(getIndex(), position);
          }

          var handler = new Cesium.ScreenSpaceEventHandler(_self._scene.canvas);

          handler.setInputAction(function(movement) {
            var cartesian = _self._scene.camera.pickEllipsoid(movement.endPosition, ellipsoid);
            if (cartesian) {
              onDrag(cartesian);
            }
            else {
              onDragEnd(cartesian);
            }
          }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

          handler.setInputAction(function(movement) {
            onDragEnd(_self._scene.camera.pickEllipsoid(movement.position, ellipsoid));
          }, Cesium.ScreenSpaceEventType.LEFT_UP);

          enableRotation(false);

          callbacks.dragHandlers.onDragStart && 
          callbacks.dragHandlers.onDragStart(getIndex(), _self._scene.camera.pickEllipsoid(position, ellipsoid));
        })
      }

      if (callbacks.onDoubleClick) {
        setListener(billboard, 'leftDoubleClick', function(position) {
          callbacks.onDoubleClick(getIndex());
        })
      }

      if (callbacks.onClick) {
        setListener(billboard, 'leftClick', function(position) {
          callbacks.onClick(getIndex());
        })
      }

      if (callbacks.tooltip) {
        setListener(billboard, 'mouseMove', function(position) {
          _self._drawHelper._tooltip.showAt(position, callbacks.tooltip());
        })
        setListener(billboard, 'mouseOut', function(position) {
          _self._drawHelper._tooltip.setVisible(false);
        })
      }
    }

    return billboard;
  }

  _.BillboardGroup.prototype.insertBillboard = function(index, position, callbacks) {
    // splice() 方法用于添加或删除数组中的元素。(这里相当于向数组中添加元素)
    this._orderedBillboards.splice(index, 0, this.createBillboard(position, callbacks));
  }

  _.BillboardGroup.prototype.addBillboard = function(position, callbacks) {
    // push() 方法可向数组的末尾添加一个或多个元素，并返回新的长度。
    this._orderedBillboards.push(this.createBillboard(position, callbacks));
  }

  _.BillboardGroup.prototype.addBillboards = function(positoins, callbacks) {
    for (var index = 0; index < positions.length; index++) {
      this.addBillboard(positoins[index], callbacks);
    }
  }

  _.BillboardGroup.prototype.updateBillboardsPositions = function(positions) {
    for (var index = 0; index < positions.length; index++) {
      this.getBillboard(index).position = positions[index];
    }
  }

  _.BillboardGroup.prototype.countBillboards = function() {
    return this._orderedBillboards.length;
  }

  _.BillboardGroup.prototype.getBillboard = function(index) {
    return this._orderedBillboards[index];
  }

  _.BillboardGroup.prototype.removeBillboard = function(index) {
    this._billboards.remove(this.getBillboard(index));
    this._orderedBillboards.splice(index, 1); // 从数组中删除该元素
  }

  _.BillboardGroup.prototype.remove = function() {
    this._billboards = this._billboards && this._billboards.removeAll() && this._billboards.destroy();
  }

  _.BillboardGroup.prototype.setOnTop = function() {
    this._scene.primitives.raiseToTop(this._billboards);
  }

  // 开始绘制一维的 billboard
  _.prototype.startDrawingMarker = function(options) {
    var options = copyOptions(options, defaultBillboard);

    this.startDrawing(function() {
      markers.remove();
      mouseHandler.destroy();
      tooltip.setVisible(false);
    })

    var _self = this;
    var scene = this._scene;
    var primitives = scene.primitives;
    var tooltip = this._tooltip;

    var markers = new _.BillboardGroup(this, options);

    var mouseHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

    // Now wair for start
    mouseHandler.setInputAction(function(movement) {
      if (movement.position != null) {
        var cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);
        if (cartesian) {
          markers.addBillboard(cartesian);  // 在鼠标点击处添加 billboard
          _self.stopDrawing();    // 同时停止标绘
          options.callback(cartesian);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    mouseHandler.setInputAction(function(movement) {
      var position = movement.endPosition;
      if (position != null) {
        var cartesian = scene.camera.pickEllipsoid(position, ellipsoid);
        if (cartesian) {
          tooltip.showAt(position, '<p>Click to add your marker. Postion is: </p>' 
                        + getDisplayLatLngString(ellipsoid.cartesianToCartographic(cartesian)));
        }
        else {
          toolbar.showAt(position, '<p>Click on the globe to add your marker.</p>');
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  // 开始绘制多边形
  _.prototype.startDrawingPolygon = function(options) {
    var options = copyOptions(options, defaultSurfaceOptions);
    this.startDrawingPolyshape(true, options);
  }

  // 开始绘制多段线
  _.prototype.startDrawingPolyline = function(options) {
    var options = copyOptions(options, defaultPolylineOptions);
    this.startDrawingPolyshape(false, options);
  }

  _.prototype.startDrawingPolyshape = function(isPolygon, options) {
    this.startDrawing(function() {
      primitives.remove(poly);
      markers.remove();
      mouseHandler.destroy();
      tooltip.setVisible(false);
    })

    var _self = this;
    var scene = this._scene;
    var primitives = scene.primitives;
    var tooltip = this._tooltip;

    var minPoints = isPolygon ? 3 : 2;  // 当是多边形时->至少三个点；多段线->至少两个点
    var poly;
    if (isPolygon) {
      poly = new DrawHelper.PolygonPrimitive(options); // 多边形
    }
    else {
      poly = new DrawHelper.PolylineGeometry(options);  // 多段线
    }
    poly.asynchronous = false;
    primitives.add(poly); // 在 Cesium.Primitives 中添加 poly

    var positions = [];
    var markers = new _.BillboardGroup(this, defaultBillboard);
    var mouseHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

    // Now wait for start
    mouseHandler.setInputAction(function(movement) {
      if (movement.position != null) {
        var cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);
        if (cartesian) {
          // first click
          if (positions.length == 0) {
            positions.push(cartesian.clone());
            markers.addBillboard(positions[0]);
          }
          if (positions.length >= minPoints) {
            poly.positions = positions;
            poly._createPrimitive = true;
          }
          // add new point to polygon
          // this one will move with the mouse
          positions.push(cartesian);
          // add marker at new position
          markers.addBillboard(cartesian);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    mouseHandler.setInputAction(function(movement) {
      var position = movement.endPosition;
      if (position != null) {
        if (positions.length == 0) {
          tooltip.showAt(position, '<p>Click to add first point</p>');
        }
        else {
          var cartesian = scene.camera.pickEllipsoid(position, ellipsoid);
          if (cartesian) {
            positions.pop();
            // make sure it is slightly  different
            cartesian.y += (1 + Math.random());
            positions.push(cartesian);
            if (positions.length >= minPoints) {
              poly.positions = positions;
              poly._createPrimitive = true;
            }
            // update marker
            markers.getBillboard(positions.length - 1).position = cartesian;
            // show tooltip 
            tooltip.showAt(position, 
              '<p>Click to add new point (' + positions.length + ")</p>" +
              (positions.length > minPoints ? "<p>Double click to finish drawing</p>" : ""));
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    mouseHandler.setInputAction(function(movement) {
      var position = movement.position;
      if (position != null) {
        if (positions.length < minPoints + 2) {
          return;
        }
        else {
          var cartesian = scene.camera.pickEllipsoid(position, ellipsoid);
          if (cartesian) {
            _self.stopDrawing();
            if (typeof options.callback == 'function') {
              // remove overlapping ones
              var index = positions.length - 1;
              options.callback(positions);
            }
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }

  function getExtentCorners(value) {
    return ellipsoid.cartographicArrayToCartesianArray([
      Cesium.Rectangle.northwest(value), 
      Cesium.Rectangle.northeast(value),
      Cesium.Rectangle.southeast(value),
      Cesium.Rectangle.southwest(value)]);
  }

  // 开始绘制矩形
  _.prototype.startDrawingExtent = function(options) {
    var options = copyOptions(options, defaultSurfaceOptions);

    this.startDrawing(function() {
      if (extent != null) {
        primitives.remove(extent);
      }
      markers.remove();
      mouseHandler.destroy();
      tooltip.setVisible(false);
    })

    var _self = this;
    var scene = this._scene;
    var primitives = this._scene.primitives;
    var tooltip = this._tooltip;

    var firstPoint = null;
    var extent = null;
    var markers = null;
    var mouseHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

    function updateExtent(value) {
      if (extent == null) {
        extent = new Cesium.RectanglePrimitive();
        extent.asynchronous = false;
        primitives.add(extent);
      }
      extent.rectangle = value;
      // update the markers
      var corners = getExtentCorners(value);
      // create if they do not yet exist
      if (markers == null) {
        markers = new _.BillboardGroup(_self, defaultBillboard);
        markers.addBillboards(corners);
      }
      else {
        markers.updateBillboardsPositions(corners);
      }
    }

    // Now wait for start
    mouseHandler.setInputAction(function(movement) {
      if (movement.position != null) {
        var cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);
        if (cartesian) {
          if (extent == null) {
            // create the rectangle
            firstPoint = ellipsoid.cartesianToCartographic(cartesian);
            var value = getExtent(firstPoint, firstPoint);
          }
          else {
            _self.stopDrawing();
            if (typeof options.callback == 'function') {
              options.callback(getExtent(firstPoint, ellipsoid.cartesianToCartographic(cartesian)));
            }
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    mouseHandler.setInputAction(function(movement) {
      var position = movement.endPosition;
      if (position != null) {
        if (extent == null) {
          tooltip.showAt(position, '<p>Click to start drawing rectangle</p>');
        }
        else {
          var cartesian = scene.camera.pickEllipsoid(position, ellipsoid);
          if (cartesian) {
            var value = getExtent(firstPoint, ellipsoid.cartesianToCartographic(cartesian));
            updateExtent(value);
            tooltip.showAt(position, 
              '<p>Drag to change rectangle extent</p>' +
              '<p>Click again to finish drawing</p>');
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  // 开始绘制圆
  _.prototype.startDrawingCircle = function(options) {
    var options = copyOptions(options, defaultSurfaceOptions);

    this.startDrawing(function cleanUp() {
      if (circle != null) {
        primitives.remove(circle);
      }
      marked.remove();
      mouseHandler.destroy();
      tooltip.setVisible(false);
    });

    var _self = this;
    var scene = this._scene;
    var primitives = this._scene.primitives;
    var tooltip = this._tooltip;

    var circle = null;
    var markers = null;
    var mouseHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

    // Now wait for start
    mouseHandler.setInputAction(function(movement) {
      if (movement.position != null) {
        var cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);
        if (cartesian) {
          if (circle == null) {
            // create the circle
            circle = new _.CirclePrimitive({
              center: cartesian,
              radius: 0,
              asynchronous: false,
              material: options.material
            });
            primitives.add(circle);
            markers = new _.BillboardGroup(_self, defaultBillboard);
            markers.addBillboards([cartesian]);
          }
          else {
            if (typeof options.callback == 'function') {
              options.callback(circle.getCenter(), circle.getRadius());
            }
            _self.stopDrawing();
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    mouseHandler.setInputAction(function(movement) {
      var position = movement.endPosition;
      if (position != null) {
        if (circle == null) {
          tooltip.showAt(position, '<p>Click to start drawing the circle</p>');
        }
        else {
          var cartesian = scene.camera.pickEllipsoid(position, ellipsoid);
          if (cartesian) {
            circle.setRadius(Cesium.Cartesian3.distance(circle.getCenter(), cartesian));
            markers.updateBillboardsPositions(cartesian);
            tooltip.showAt(position, 
              '<p>Move mouse to change circle radius</p>' +
              '<p>Click again to finish drawing</p>');
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  _.prototype.enhancePrimitives = function() {
    var drawHelper = this;
    Cesium.Billboard.prototype.setEditable = function() {
      if (this._editable) {
        return;
      }

      this._editable = true;
      var billboard = this;
      var _self = this;

      function enableRotation(enable) {
        drawHelper._scene.screenSpaceCameraController.enableRotate = enable;
      }

      setListener(billboard, 'leftDown', function(position) {
        // TODO - start the drag handlers here
        // create handlers for mouseOut and leftUp for the billboard and a mouseMove
        function onDrag(position) {
          billboard.position = position;
          _self.executeListeners({name: 'drag', positions: position});
        }
        function onDragEnd(position) {
          handler.destroy();
          enableRotation(true);
          _self.executeListeners({name: 'dragEnd', positions: position});
        }

        var handler = new Cesium.ScreenSpaceEventHandler(drawHelper._scene.canvas);

        handler.setInputAction(function(movement) {
          var cartesian = drawHelper._scene.camera.pickEllipsoid(movement.endPosition, cartesian);
          if (cartesian) {
            onDrag(cartesian);
          }          
          else {
            onDragEnd(cartesian);
          }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction(function(movement) {
          onDragEnd(drawHelper._scene.camera.pickEllipsoid(movement.position, ellipsoid));
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        enableRotation(false);
      })

      enhanceWithListeners(billboard);
    }

    function setHighlighted(highlighted) {
      var scene = drawHelper._scene;

      // if no change 
      // if already highlighted, the outline polygon will be available
      if (this._highlighted && this._highlighted == highlighted) {
        return;
      }
      // disable if already in edit mode
      if (this._editMode === true) {
        return;
      }
      this._highlighted = highlighted;
      // highlight by creating an outling polygon matching the polygon points
      if (highlighted) {
        // make sure all other shapes are not highlighted
        drawHelper.setHighlighted(this);
        this._strokeColor = this.strokeColor;
        this.set
      }
    }
  }
})