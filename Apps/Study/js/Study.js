// 创建一个 viewer 实例
var viewer = new Cesium.Viewer("cesiumContainer", {
  animation: true,              // 是否显示动画小部件（左下角仪表盘）
  baseLayerPicker: true,        // 是否显示图层选择器
  fullscreenButton: true,       // 是否显示全屏按钮
  geocoder: true,               // 是否显示 geocoder 小部件（右上角查询按钮）
  vrButton: false,              // 是否显示 VR 按钮
  homeButton: true,             // 是否显示 Home 按钮
  infoBox: true,                // 是否显示信息框
  sceneModePicker: true,        // 是否显示 3D/2D 选择器
  selectionIndicator: false,    // 是否显示指示器组件
  timeline: false,              // 是否显示时间轴
  navigationHelpButton: false,  // 是否显示右上角的帮助按钮
  scene3DOnly: false,           // 如果设置为 true，则所有几何图形以 3D 模式绘制以节约GPU资源
  shadows : true,               // 是否显示阴影
  shouldAnimate : true,         // 是否显示动画
  // imageryProvider: new Cesium.BingMapsImageryProvider({
  // url: 'https://dev.virtualearth.net',
  // key: 'Au3ucURiaXsmmeNnBwafUWXupkCAvHe9ipzq6kOGYe5Xlthtf3MGRxiNURDN2FG2',
  // mapStyle: Cesium.BingMapsStyle.AERIAL
  // }),
  // baseLayerPicker: false,
  // 加载地形系统
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
var homeCameraView = {
    destination: initialPosition,
    orientation: {
        heading: initialOrientation.heading,
        pitch: initialOrientation.pitch,
        roll: initialOrientation.roll
    }
};
// 设置初始视野
viewer.scene.camera.setView(homeCameraView);
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
document.getElementById("longitude_show").innerHTML = 114.29045969;         // 经度初始值
document.getElementById("latitude_show").innerHTML = 30.56173526;           // 纬度初始值
document.getElementById("x_show").innerHTML = initialPosition.x.toFixed(6)  // X 初始值
document.getElementById("y_show").innerHTML = initialPosition.y.toFixed(6)  // Y 初始值
document.getElementById("photo_altitude").innerHTML = 40000;                 // 视角高初始值
// 使用 ScreenSpaceEvenHandler，一组在用户输入操作上触发指定功能的处理程序
const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
// ScreenSpaceEventHandler.setInputAction() 监听操作类型 ScreenSpaceEventType 的种类，并运行一个特定的函数，将用户操作作为参数传递
// 移动鼠标获得该点经、纬度、X、Y 坐标
handler.setInputAction(function(movement) {
    // 通过指定的椭球或者地图对应的坐标系，将鼠标的二维坐标转换为对应椭球体三维坐标
    var cartesian = scene.camera.pickEllipsoid(movement.endPosition, ellipsoid);
    if (cartesian) {
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        var longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(8);   // 经度
        var latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(8);     // 维度

        document.getElementById("longitude_show").innerHTML = longitude;            // 经度
        document.getElementById("latitude_show").innerHTML = latitude;              // 纬度
        document.getElementById("x_show").innerHTML = cartesian.x.toFixed(6)        // X
        document.getElementById("y_show").innerHTML = cartesian.y.toFixed(6)        // Y
        latitude_show.innerHTML = latitude;
    }
    else {
        console.log("地图外的点！");
    }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
// 滑动鼠标滚轮获得该点摄影机高度
handler.setInputAction(function(movement) {
    let height = Math.ceil(viewer.camera.positionCartographic.height);
    document.getElementById("photo_altitude").innerHTML = height;
}, Cesium.ScreenSpaceEventType.WHEEL);


/**小车移动
 * 参考：
 * https://blog.csdn.net/HobHunter/article/details/74940280
 */
// 小车旋转角度
var radian = Cesium.Math.toRadians(3.0);  // Math.Radians(degrees) 将角度转换为弧度
// 小车的速度
var carSpeed = 5;
// 速度矢量
var speedVector = new Cesium.Cartesian3();  // Cesium.Cartesian3(x, y, z)  3D 笛卡尔坐标点
// 起始位置
var carPosition = Cesium.Cartesian3.fromDegrees(114.3570, 30.52601643, 0);  //  从以度为单位的经度和纬度值返回Cartesian3位置
// 设置小车方向
var hpr = new Cesium.HeadingPitchRoll(-45, 0, 0);
var fixedFrameTransforms = Cesium.Transforms.localFrameToFixedFrameGenerator('north', 'west'); // 生成一个函数，该函数计算从以提供的原点为中心的参考帧到提供的椭球的固定参考帧的4x4变换矩阵

// 添加小车模型
var carPrimitive = scene.primitives.add(Cesium.Model.fromGltf({
  url: '../SampleData/models/CesiumMilkTruck/CesiumMilkTruck-kmc.glb',
  modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(carPosition, hpr, Cesium.Ellipsoid.WGS84, fixedFrameTransforms),
  minimumPixelSize: 128
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
  console.log(String.fromCharCode(window.event ? e.keyCode : e.which));
});
document.addEventListener('keyup', (e)=>{
  setFlagStatus(e, false);
  // console.log(String.fromCharCode(window.event ? e.keyCode : e.which));
});

// 移动小车
function moveCar(isUp) {
  // 计算速度矩阵
  if (isUp) {
    speedVector = Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_X, carSpeed, speedVector)
  }
  else {
    speedVector = Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_X, -carSpeed, speedVector)
  }
  // 根据速度计算出下一个位置的坐标
  carPosition = Cesium.Matrix4.multiplyByPoint(carPrimitive.modelMatrix, speedVector, carPosition);
  // 小车移动
  Cesium.Transforms.headingPitchRollToFixedFrame(carPosition, hpr, Cesium.Ellipsoid.WGS84, fixedFrameTransforms, carPrimitive.modelMatrix);
}

// 监听帧
viewer.clock.onTick.addEventListener((clock)=>{
  if (flag.moveUp) {
    if (flag.moveLeft) {
      hpr.heading -= radian;
    };
    if (flag.moveRight) {
      hpr.heading += radian;
    };
    moveCar(true);
  }
  if (flag.moveDown) {
    if (flag.moveLeft) {
      hpr.heading += radian;
    };
    if (flag.moveRight) {
      hpr.heading -= radian;
    };
    moveCar(false);
  }
});


// 函数：加载模型
function createModel(url, id,  height) {
  viewer.entities.removeAll();
  // viewer.entities.removeById(id);

  var position = Cesium.Cartesian3.fromDegrees(114.3557895996096, 30.52703615981503, height);
  // var heading = Cesium.Math.toRadians(135);
  var heading = 0;
  var pitch = 0;
  var roll = 0;
  var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
  
  var entity = viewer.entities.add({
    id: id,
    name : id,
    position : position,
    orientation : orientation,
    model : {
      uri : url,
      minimumPixelSize : 128,
      maximumScale : 20000
    }
  });
  viewer.trackedEntity = entity;
  // viewer.zoomTo(viewer.entities);

  entity.description = '\
  <h1>教室模型</h1>\
  <p>这是一个教室模型！</p>'
}

// // snow
// var snowParticleSize = scene.drawingBufferWidth / 100.0;
// var snowRadius = 100000.0;
// var minimumSnowImageSize = new Cesium.Cartesian2(snowParticleSize, snowParticleSize);
// var maximumSnowImageSize = new Cesium.Cartesian2(snowParticleSize * 2.0, snowParticleSize * 2.0);
// var snowSystem;

// var snowGravityScratch = new Cesium.Cartesian3();
// var snowUpdate = function(particle, dt) {
//     snowGravityScratch = Cesium.Cartesian3.normalize(particle.position, snowGravityScratch);
//     Cesium.Cartesian3.multiplyByScalar(snowGravityScratch, Cesium.Math.randomBetween(-30.0, -300.0), snowGravityScratch);
//     particle.velocity = Cesium.Cartesian3.add(particle.velocity, snowGravityScratch, particle.velocity);

//     var distance = Cesium.Cartesian3.distance(scene.camera.position, particle.position);
//     if (distance > snowRadius) {
//         particle.endColor.alpha = 0.0;
//     } else {
//         particle.endColor.alpha = snowSystem.endColor.alpha / (distance / snowRadius + 0.1);
//     }
// };

// snowSystem = new Cesium.ParticleSystem({
//     modelMatrix : new Cesium.Matrix4.fromTranslation(scene.camera.position),
//     minimumSpeed : -1.0,
//     maximumSpeed : 0.0,
//     lifetime : 15.0,
//     emitter : new Cesium.SphereEmitter(snowRadius),
//     startScale : 0.5,
//     endScale : 1.0,
//     image : '../SampleData/snowflake_particle.png',
//     emissionRate : 7000.0,
//     startColor : Cesium.Color.WHITE.withAlpha(0.0),
//     endColor : Cesium.Color.WHITE.withAlpha(1.0),
//     minimumImageSize : minimumSnowImageSize,
//     maximumImageSize : maximumSnowImageSize,
//     updateCallback : snowUpdate
// });
// scene.primitives.add(snowSystem);

// rain
var rainParticleSize = scene.drawingBufferWidth / 80.0;
var rainRadius = 100000.0;
var rainImageSize = new Cesium.Cartesian2(rainParticleSize, rainParticleSize * 2.0);
var rainSystem;

var rainGravityScratch = new Cesium.Cartesian3();
var rainUpdate = function(particle, dt) {
  rainGravityScratch = Cesium.Cartesian3.normalize(particle.position, rainGravityScratch);
  rainGravityScratch = Cesium.Cartesian3.multiplyByScalar(rainGravityScratch, -1050.0, rainGravityScratch);

  particle.position = Cesium.Cartesian3.add(particle.position, rainGravityScratch, particle.position);

  var distance = Cesium.Cartesian3.distance(scene.camera.position, particle.position);
  if (distance > rainRadius) {
      particle.endColor.alpha = 0.0;
  } else {
      particle.endColor.alpha = rainSystem.endColor.alpha / (distance / rainRadius + 0.1);
  }
};

rainSystem = new Cesium.ParticleSystem({
  modelMatrix : new Cesium.Matrix4.fromTranslation(scene.camera.position),
  speed : -1.0,
  lifetime : 15.0,
  emitter : new Cesium.SphereEmitter(rainRadius),
  startScale : 1.0,
  endScale : 0.1,
  image : '../SampleData/circular_particle.png',
  emissionRate : 9000.0,
  startColor :new Cesium.Color(0.27, 0.5, 0.70, 0.0),
  endColor : new Cesium.Color(0.27, 0.5, 0.70, 0.98),
  imageSize : rainImageSize,
  updateCallback : rainUpdate
});
scene.primitives.add(rainSystem); 
scene.primitives.lowerToBottom(rainSystem);

function WuhanRiverKML() {
  var Rivers = viewer.dataSources.add(Cesium.KmlDataSource.load('./source/武汉水系_region.kml',{
    camera: scene.camera, // 相机选项
    canvas: scene.canvas, // 画布选项
    clampToGround: true   // 开启贴地
  }));
  Rivers.then(function(dataSource) {
    let riverEntities = dataSource.entities.values;  // 获取所有对象，一个 entity 的阵列
    for (let i = 0; i < riverEntities.length; i++) {
      let entity = riverEntities[i];
      if (entity.polygon || entity.polyline) {
        viewer.entities.add(entity);
        entity.polygon.fill = undefined;
        entity.polygon.material = Cesium.Color.BLUE.withAlpha(0.1);
        entity.polygon.outlineColor = Cesium.Color.RED;
      }
    }
    viewer.flyTo(dataSource.entities);
  });
};

Sandcastle.addToggleButton('🌧', rainSystem.show = false, function(checked) {
  rainSystem.show = checked;
  
  scene.skyAtmosphere.hueShift = -0.97;
  scene.skyAtmosphere.saturationShift = 0.25;
  scene.skyAtmosphere.brightnessShift = -0.4;
  scene.fog.density = 0.00025;
  scene.fog.minimumBrightness = 0.01;
});
Sandcastle.addToolbarButton('加载水系图层', function() {
  WuhanRiverKML();
});

// Sandcastle.addToolbarButton('加载教室模型', function() {
//   createModel('../SampleData/models/classroom_dae.gltf', 'classroom', 0);
// });
// Sandcastle.addToolbarButton('清除模型', function() {
//   viewer.entities.removeById('classroom');
// });

Sandcastle.finishedLoading();





