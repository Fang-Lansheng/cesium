var viewer = new Cesium.Viewer("cesiumContainer", {
  // terrainProvider : Cesium.createWorldTerrain()
});
var scene = viewer.scene;
var clock = viewer.clock;
viewer._cesiumWidget._creditContainer.style.display = 'none'; // 隐藏 logo 信息
scene.debugShowFramesPerSecond = true;  // 显示帧率


// 小车旋转角度
var radian = Cesium.Math.toRadians(3.0);  // Math.Radians(degrees) 将角度转换为弧度
// 小车的速度
var speed = 60;
// 速度矢量
var speedVector = new Cesium.Cartesian3();  // Cesium.Cartesian3(x, y, z)  3D 笛卡尔坐标点
// 起始位置
var position = Cesium.Cartesian3.fromDegrees(116.080591, 39.919141, 0);  //  从以度为单位的经度和纬度值返回Cartesian3位置
// 设置小车方向
var hpr = new Cesium.HeadingPitchRoll();
var fixedFrameTransforms = Cesium.Transforms.localFrameToFixedFrameGenerator('north', 'west'); // 生成一个函数，该函数计算从以提供的原点为中心的参考帧到提供的椭球的固定参考帧的4x4变换矩阵

// 添加小车模型
var carPrimitive = scene.primitives.add(Cesium.Model.fromGltf({
  url: '../SampleData/models/CesiumMilkTruck/CesiumMilkTruck-kmc.glb',
  modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(position, hpr, Cesium.Ellipsoid.WGS84, fixedFrameTransforms),
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
*/
function setFlagStatus(key, value) {
  switch (key.KeyCode) {
    case 37:
      flag.moveLeft = value;
      break;
    case 38:
      flag.moveUp = value;
      break;
    case 39:
      flag.moveRight = value;
      break;
    case 40:
      flag.moveDown = value;
      break;
  }
};

document.addEventListener('keydown', (e)=>{
  setFlagStatus(e, true);
});
document.addEventListener('keyup', (e)=>{
  setFlagStatus(e, false);
});

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
      hpr.heading -= radian;
    };
    if (flag.moveRight) {
      hpr.heading += radian;
    };
    moveCar(false);
  }
});
// 移动小车
function moveCar(isUp) {
  // 计算速度矩阵
  if (isUp > 0) {
    speedVector = Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_X, speed, speedVector)
  }
  else {
    speedVector = Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_X, -speed, speedVector)
  }
  // 根据速度计算出下一个位置的坐标
  position = Cesium.Matrix4.multiplyByPoint(carPrimitive.modelMatrix, speedVector, position);
  // 小车移动
  Cesium.Transforms.headingPitchRollToFixedFrame(position, hpr, Cesium.Ellipsoid.WGS84, fixedFrameTransforms, carPrimitive.modelMatrix);
}



Sandcastle.finishedLoading();





