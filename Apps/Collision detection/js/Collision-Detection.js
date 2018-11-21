viewer = null;

function initCesium() {
  if (viewer) {
    return;
  }

  // 创建一个 viewer 实例
  var viewer = new Cesium.Viewer("cesiumContainer", {
    animation: false,             // 是否显示动画小部件（左下角仪表盘）
    baseLayerPicker: true,        // 是否显示图层选择器
    fullscreenButton: true,       // 是否显示全屏按钮
    geocoder: true,               // 是否显示 geocoder 小部件（右上角查询按钮）
    vrButton: false,              // 是否显示 VR 按钮
    homeButton: true,             // 是否显示 Home 按钮
    infoBox: true,                // 是否显示信息框
    scene3DOnly: false,           // 如果设置为 true，则所有几何图形以 3D 模式绘制以节约GPU资源
    sceneModePicker: true,        // 是否显示 3D/2D 选择器
    selectionIndicator: false,    // 是否显示指示器组件
    shadows : true,               // 是否显示阴影
    shouldAnimate : true,         // 是否显示动画
    navigationHelpButton: false,  // 是否显示右上角的帮助按钮
    timeline: false,              // 是否显示时间轴
    imageryProvider: new Cesium.BingMapsImageryProvider({
    url: 'https://dev.virtualearth.net',
    key: 'Au3ucURiaXsmmeNnBwafUWXupkCAvHe9ipzq6kOGYe5Xlthtf3MGRxiNURDN2FG2',
    mapStyle: Cesium.BingMapsStyle.AERIAL
    }),
    baseLayerPicker: false,
    // // 加载地形系统
    // terrainProvider : Cesium.createWorldTerrain({
    //   // url: 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles', // 默认立体地表
    //   requestWaterMask : true,        // 动态水纹
    //   requestVertexNormals: true      // 光效
    // })
  });

  // 添加天地图注记
  viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
    url: 'http://t0.tianditu.com/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles',
    layer: 'tdtImgAnnoLayer',
    style: 'default',
    format: 'image/jpeg',
    tileMatrixSetID: 'GoogleMapsCompatible',
    show: false
  }));

  // 创建一个 scene 实例
  var scene = viewer.scene;
  // 创建一个 ellipsoid 实例
  var ellipsoid = scene.globe.ellipsoid;
  // 创建一个 clock 实例
  var clock = viewer.clock;

  // 隐藏 logo 与版权信息
  viewer._cesiumWidget._creditContainer.style.display = 'none'; 
  // 显示帧率
  scene.debugShowFramesPerSecond = true;  
  // 控制视角不转到地下（确保在地形后面的物体被正确地遮挡，只有最前端的对象可见）
  viewer.scene.globe.depthTestAgainstTerrain = true; 

  // 初始化相机参数
  var initialPosition = new Cesium.Cartesian3.fromDegrees(114.29045969, 30.56173526, 40000);
  var initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(0, -90, 0);
  // var homeCameraView = {
  //     destination: initialPosition,
  //     orientation: {
  //         heading: initialOrientation.heading,
  //         pitch: initialOrientation.pitch,
  //         roll: initialOrientation.roll
  //     }
  // };
  // // 设置初始视野
  // viewer.scene.camera.setView(homeCameraView);
  // 重写 homeButton
  viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function(e) {
    e.cancel = true;
    viewer.camera.flyTo({
        destination: initialPosition,
        orientation: {
            heading: initialOrientation.heading,
            pitch: initialOrientation.pitch,
            roll: initialOrientation.roll
        }
    })
  })

  // 实时显示经纬度、坐标值及视角高
  document.getElementById("longitude").innerHTML = '东经';             
  document.getElementById("longitude_show").innerHTML = 114.2906;   // 经度初始值
  document.getElementById("latitude").innerHTML = '北纬';             
  document.getElementById("latitude_show").innerHTML = 30.5617;     // 纬度初始值
  document.getElementById("altitude_show").innerHTML = 0;           // 海拔初始值
  // document.getElementById("x_show").innerHTML = initialPosition.x.toFixed(6)  // X 初始值
  // document.getElementById("y_show").innerHTML = initialPosition.y.toFixed(6)  // Y 初始值
  document.getElementById("photo_altitude").innerHTML = 40000;                 // 视角高初始值
  // 使用 ScreenSpaceEvenHandler，一组在用户输入操作上触发指定功能的处理程序
  const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  // ScreenSpaceEventHandler.setInputAction() 监听操作类型 ScreenSpaceEventType 的种类，并运行一个特定的函数，将用户操作作为参数传递
  // 移动鼠标获得该点经、纬度、X、Y 坐标
  handler.setInputAction(function(movement) {
    // 通过指定的椭球或者地图对应的坐标系，将鼠标的二维坐标转换为对应椭球体三维坐标
    // var ray = viewer.camera.getPickRay(movement.endPosition);
    // var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    var cartesian = scene.camera.pickEllipsoid(movement.endPosition, ellipsoid);
    if (cartesian) {
      var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      // var cartographic = scene.globe.ellipsoid.cartesianToCartographic(cartesian);
      var longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(4); // 经度
      var latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(4);   // 维度
      var height = viewer.scene.globe.getHeight(cartographic);                  // 海拔
      height = Number(height).toFixed(2);
      if (longitude >= 0) {
        document.getElementById("longitude").innerHTML = '东经';
        document.getElementById("longitude_show").innerHTML = longitude;        // 经度
      }
      else {
        document.getElementById("longitude").innerHTML = '西经';
        document.getElementById("longitude_show").innerHTML = -longitude;       // 经度
      }
      if (latitude >= 0) {
        document.getElementById("latitude").innerHTML = '北纬';
        document.getElementById("latitude_show").innerHTML = latitude;          // 纬度
      }
      else {
        document.getElementById("latitude").innerHTML = '南纬';
        document.getElementById("latitude_show").innerHTML = -latitude;         // 纬度
      }
      document.getElementById("altitude_show").innerHTML = height;
    }
    else {
      console.log("地图外的点！");
    }
    let c_height = Math.ceil(viewer.camera.positionCartographic.height);
    document.getElementById("photo_altitude").innerHTML = c_height;
    if (c_height > 99999999999) {
      alert("You've lost!");
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  // 滑动鼠标滚轮获得该点摄影机高度
  handler.setInputAction(function(movement) {
      let height = Math.ceil(viewer.camera.positionCartographic.height);
      document.getElementById("photo_altitude").innerHTML = height;
      if (height > 99999999999) {
        alert("You've lost!");
      }
  }, Cesium.ScreenSpaceEventType.WHEEL);

  var elevation = document.getElementById("elevation");
  var changed = scene.terrainProvider.hasWaterMask;
  function showElevation(e) {
    if (!e) {
      elevation.style.display = 'block';
      // console.log('显示高程');
      changed = !e;
    }
    else {
      elevation.style.display = 'none';
      // console.log('不显示高程');
      changed = !e;
    }
  }
  showElevation(!changed);
  scene.terrainProviderChanged.addEventListener(function() {
    console.log("terrainProviderChanged!");
    showElevation(changed);
  });

  // var MeshVisualizer = Cesium.MeshVisualizer;
  // var Mesh = Cesium.Mesh;
  // var MeshMaterial = Cesium.MeshMaterial;
  // var FramebufferTexture = Cesium.FramebufferTexture;
  // var GeometryUtils = Cesium.GeometryUtils;
  // var ReferenceMesh = Cesium.ReferenceMesh;
  // var LOD = Cesium.LOD;

  // var meshModelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(initialPosition)
  // var meshVisualizer = new MeshVisualizer({
  //   modelMatrix: meshModelMatrix,
  //   referenceAxisParameter: {
  //     length: 100,
  //     width: 0.5,
  //     headLength: 2,
  //     headWidth: 1.0
  //   },
  //   up: { z: 1 }
  // })
  // viewer.scene.primitives.add(meshVisualizer);
  // meshVisualizer.showReference = true;  // 显示坐标轴

  /**移动
   * 参考：
   * https://blog.csdn.net/HobHunter/article/details/74940280
   * https://github.com/CyanHabao/CesiumCesium_man
   */
  // 旋转角度
  var radian = Cesium.Math.toRadians(2.0);  // Math.Radians(degrees) 将角度转换为弧度
  // 小车的速度
  var manSpeed = 0.1;
  // 速度矢量
  var speedVector = new Cesium.Cartesian3();  // Cesium.Cartesian3(x, y, z)  3D 笛卡尔坐标点
  // 起始位置
  // var manPosition = Cesium.Cartesian3.fromDegrees(114.3570, 30.52601643, 0);  //  从以度为单位的经度和纬度值返回Cartesian3位置
  var manPosition = Cesium.Cartesian3.fromDegrees(-75.5977, 40.0384, 100);
  // 设置方向
  var hpr = new Cesium.HeadingPitchRoll(-45, 0, 0);
  var fixedFrameTransforms = Cesium.Transforms.localFrameToFixedFrameGenerator('north', 'west'); 
  // 生成一个函数，该函数计算从以提供的原点为中心的参考帧到提供的椭球的固定参考帧的4x4变换矩阵

  // 添加小车模型
  var manPrimitive = Cesium.Model.fromGltf({
    // url: '../SampleData/models/CesiumMilkTruck/CesiumMilkTruck-kmc.glb',
    url: 'Source/Cesium_Man.gltf',
    modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(manPosition, hpr, Cesium.Ellipsoid.WGS84, fixedFrameTransforms),
    minimumPixelSize: 1
  });
  scene.primitives.add(manPrimitive);
  manPrimitive.readyPromise.then(function(model) {
    var entity = viewer.entities.add({
      id: 'Cesium Man',
      model: model
    });
    viewer.trackedEntity = entity;
  })

  var debugModelMatrixPrimitive = scene.primitives.add(new Cesium.DebugModelMatrixPrimitive({
    modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(manPosition, hpr, Cesium.Ellipsoid.WGS84, fixedFrameTransforms),
    length: 300.0,
    width: 10
  }));

  // 监听键盘按键
  // 小车状态标志
  var flag = {
    moveUp: false,
    moveDown: false,
    moveLeft: false,
    moveRight: false
  };

  // 根据键盘按键返回标志
  /*
  * keycode 37 = Left Arrow
  * keycode 38 = Up Arrow
  * keycode 39 = Right Arrow
  * keycode 40 = Down Arrow
  * keycode 87 = W
  * keycode 65 = A
  * keycode 83 = S
  * keycode 68 = D
  */
  function setFlagStatus(key, value) {
    switch (key.keyCode) {
      case 37:    // ←
        flag.moveLeft = value;
        break;
      case 38:    // ↑
        flag.moveUp = value;
        break;
      case 39:    // →
        flag.moveRight = value;
        break;
      case 40:    // ↓
        flag.moveDown = value;
        break;
      case 87:    // W
        flag.moveUp = value;
        break;
      case 65:    // A
        flag.moveLeft = value;
        break;
      case 83:    // S
        flag.moveDown = value;
        break;
      case 68:    // D
        flag.moveRight = value;
        break;
      default:
        flag.moveUp = false;
        flag.moveDown = false;
        flag.moveLeft = false;
        flag.moveRight = false;
        break;
    }
  };

  document.addEventListener('keydown', (e)=>{
    setFlagStatus(e, true);
    // console.log(String.fromCharCode(window.event ? e.keyCode : e.which));
  });
  document.addEventListener('keyup', (e)=>{
    setFlagStatus(e, false);
    // console.log(String.fromCharCode(window.event ? e.keyCode : e.which));
  });

  // 移动人物
  function moveCar(isUp) {
    // 计算速度矩阵
    if (isUp) {
      speedVector = Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_X, manSpeed, speedVector)
    }
    else {
      speedVector = Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_X, -manSpeed, speedVector)
    }
    // 根据速度计算出下一个位置的坐标
    manPosition = Cesium.Matrix4.multiplyByPoint(manPrimitive.modelMatrix, speedVector, manPosition);
    // 移动
    Cesium.Transforms.headingPitchRollToFixedFrame(manPosition, hpr, Cesium.Ellipsoid.WGS84, fixedFrameTransforms, manPrimitive.modelMatrix);
    Cesium.Transforms.headingPitchRollToFixedFrame(manPosition, hpr, Cesium.Ellipsoid.WGS84, fixedFrameTransforms, debugModelMatrixPrimitive.modelMatrix);
  }

  // 监听帧
  viewer.clock.onTick.addEventListener((clock)=>{
    if (flag.moveUp) {              // 前进
      if (flag.moveLeft) {          // 左转
        hpr.heading -= radian;
      };
      if (flag.moveRight) {         // 右转
        hpr.heading += radian;
      };
      moveCar(true);
    }
    if (flag.moveDown) {            // 后退
      if (flag.moveLeft) {
        hpr.heading += radian;
      };
      if (flag.moveRight) {
        hpr.heading -= radian;
      };
      moveCar(false);
    }
    if ((flag.moveLeft)&&(!flag.moveRight)&&(!flag.moveUp)&&(!flag.moveDown)) {    // 左转
      hpr.heading -= radian;
      Cesium.Transforms.headingPitchRollToFixedFrame(manPosition, hpr, Cesium.Ellipsoid.WGS84, fixedFrameTransforms, manPrimitive.modelMatrix);
      Cesium.Transforms.headingPitchRollToFixedFrame(manPosition, hpr, Cesium.Ellipsoid.WGS84, fixedFrameTransforms, debugModelMatrixPrimitive.modelMatrix);
    }
    if ((flag.moveRight)&&(!flag.moveLeft)&&(!flag.moveUp)&&(!flag.moveDown)) {    // 右转
      hpr.heading += radian;
      Cesium.Transforms.headingPitchRollToFixedFrame(manPosition, hpr, Cesium.Ellipsoid.WGS84, fixedFrameTransforms, manPrimitive.modelMatrix);
      Cesium.Transforms.headingPitchRollToFixedFrame(manPosition, hpr, Cesium.Ellipsoid.WGS84, fixedFrameTransforms, debugModelMatrixPrimitive.modelMatrix);
    }
    if ((!flag.moveLeft)&&(!flag.moveRight)&&(!flag.moveUp)&&(!flag.moveDown)) {   // 静止时
      manPrimitive.readyPromise.then(function(model) {
        model.activeAnimations.addAll({
          speedup: 1.0,
          loop: Cesium.ModelAnimationLoop.REPEAT
        })
      })
    }
    if ((flag.moveLeft)||(flag.moveRight)||(flag.moveUp)||(flag.moveDown)) {     // 在移动或转动时
      manPrimitive.readyPromise.then(function(model) {
        model.activeAnimations.add({
          name: 'animation_0',
        })
      })
    }

  });

  var tileset = new Cesium.Cesium3DTileset({
    url: Cesium.IonResource.fromAssetId(6074)
  });

  viewer.scene.primitives.add(tileset);
  viewer.zoomTo(tileset);
  handler.setInputAction(function(movement) {
    var pick = scene.pick(movement.endPosition);
    if (Cesium.defined(pick) && Cesium.defined(pick.node) && Cesium.defined(pick.mesh)) {
      console.log('node: ' + pick.node.name + '. mesh: ' + pick.mesh.name);
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  // // 函数：确定位置
  // function setPosition(entity) {
  //   let modelPosition = new Cesium.Cartesian3;
  //   handler.setInputAction(function(movement) {
  //     let cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);
  //     if (cartesian) {
  //       modelPosition = cartesian;
  //       console.log('确定位置' + modelPosition);
  //     }
  //     else {
  //       alert('地图外的点！请重新选择');
  //       setPosition();
  //     }
  //   }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

  //   entity.position = modelPosition;
  //   viewer.entities.add(entity);
  //   viewer.trackedEntity = entity;
  // }
  

  // 函数：加载模型
  function createModel(modelURI, modelID) {
    // viewer.entities.removeAll();
    // // viewer.entities.removeById(id);

    // var entity = {
    //   id: modelID,
    //   name: modelID,
    //   model: {
    //     uri: modelURI,
    //     minimumPixelSize: 128,
    //     maximumScale: 100
    //   }
    // };
    // setPosition(entity);

    // handler.setInputAction(function(movement) {
    //   let cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);
    //   if (cartesian) {
    //     entity.position = cartesian;
    //     console.log(entity.id);
    //   }
    //   else {
    //     alert('地图外的点！\n请重绘模型');
    //   }
    // }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    // var heading = Cesium.Math.toRadians(135);
    // var heading = 0;
    // var pitch = 0;
    // var roll = 0;
    // var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    // var orientation = Cesium.Transforms.headingPitchRollQuaternion(modelPosition, hpr);
    
    // var entity = viewer.entities.add({
    //   id: id,
    //   name : id,
    //   position : modelPosition,
    //   orientation : orientation,
    //   model : {
    //     uri : url,
    //     minimumPixelSize : 128,
    //     maximumScale : 20000
    //   }
    // });
    // entity.description = '<p>A model.</p>'
    // viewer.entities.add(entity);
    // viewer.trackedEntity = entity;
    // viewer.zoomTo(viewer.entities);
  }

  // Sandcastle.addToolbarButton('加载教室模型', function() {
  //   createModel('../SampleData/models/classroom_dae.gltf', 'classroom');
  // });
  // Sandcastle.addToolbarButton('加载人物模型', function() {
  //   createModel('../SampleDate/models/CesiumMan/Cesium_Man.glb', 'Cesium Man');
  // })

  // var entity = {
  //   model: {
  //     uri: '../SampleDate/models/CesiumMan/Cesium_Man.gltf'
  //   }
  // };
  // handler.setInputAction(function(movement) {
  //   let cartesian = scene.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
  //   entity.position = cartesian;
  //   viewer.entities.add(entity);
  // }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

  Sandcastle.addToolbarButton('清除模型', function() {
    // viewer.entities.removeById('classroom');
    viewer.entities,removeAll();
  });
  Sandcastle.finishedLoading();
}

initCesium();

// function initCannonJS() {
//   // Setup our world
//   var world = new CANNON.World();
//   world.gravity.set(0, 0, -9.82);   // m/s²

//   // Create a sphere
//   var radius = 1; // m
//   var sphereBody = new CANNON.Body({
//     mass: 5,  // kg
//     position: new CANNON.Vec3(0, 0, 10),    // m
//     shape: new CANNON.Sphere(radius)
//   });

//   world.addBody(sphereBody);

//   // Create a plane
//   var groundBody = new CANNON.Body({
//     mass: 0   // mass == 0 makes the body static
//   });
//   var groundShape = new CANNON.Plane();
//   groundBody.addShape(groundShape);
//   world.addBody(groundBody);

//   var fixedTimeStep = 1.0 / 60.0;   // sceonds
//   var maxSubSteps = 3;

//   // Start the stimulation loop
//   var lastTime;
//   (function simloop(time){
//     requestAnimationFrame(simloop);
//     if (lastTime != undefined) {
//       var dt = (time - lastTime) / 1000;
//       world.step(fixedTimeStep, dt, maxSubSteps);
//     }
//     // console.log("Sphere z position: " + sphereBody.position.z);
//     lastTime = time;
//   })();
// }

// initCannonJS();