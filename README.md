`2018年10月30日` `Cesium 学习笔记` `JavaScript`
> 我在Github上的 Cesium 项目：https://github.com/Fang-Lansheng/Cesium

[TOC]
# 一、Cesium 简介

**官方地址：**  
> Cesium 官方主页：https://cesiumjs.org/  
> Cesium 开源地址：https://github.com/AnalyticalGraphicsInc/cesium  
> Cesium API 文档：https://cesiumjs.org/Cesium/Build/Documentation/  
> Cesium 官方教程：https://cesiumjs.org/tutorials/  
> Cesium 官方沙盒：https://cesiumjs.org/Cesium/Build/Apps/Sandcastle/  
> Cesium 示例展示：https://cesiumjs.org/demos/  
> Cesium 商业网站：https://cesium.com/  
> Cesium 官方博客：https://cesium.com/blog/  

**相关资源：** 
> 学习网站：  
> - Cesium 教程 | 合肥火星科技有限公司：http://cesium.marsgis.cn/forcesium/tutorials/index.html  
> - Cesium API 文档 | 合肥火星科技有限公司：http://cesium.marsgis.cn/go.html?id=13  
> - Cesium Sandcastle | 合肥火星科技有限公司：http://cesium.marsgis.cn/forcesium/Apps/Sandcastle/index.html
> - cesium 中文网：http://cesium.xin/  
> 
> 个人教程：  
> - Cesium 教程系列汇总 - fu*k - 博客园：http://www.cnblogs.com/fuckgiser/p/5706842.html  
> - Cesium 学习笔记：https://blog.gmem.cc/cesium-study-note  
> - Cesium基础使用介绍 - 云+社区 - 腾讯云：https://cloud.tencent.com/developer/article/1113376  



**Cesium 是什么：**  
> An open-source JavaScript library for world-class 3D globes and maps.🌎  

Cesium 是一款面向三维地球和地图的，世界级的 JavaScript 开源产品。它提供了基于 JavaScript 语言的开发包，方便用户快速搭建一款零插件的虚拟地球 Web 应用，并在性能，精度，渲染质量以及多平台，易用性上都有高质量的保证。

通过Cesium提供的JS API，可以实现以下功能：
- 全球级别的高精度的地形和影像服务
- 矢量以及模型数据
- 基于时态的数据可视化
- 多种场景模式（3D，2.5D以及2D场景）的支持，真正的二三维一体化
- 1.35版推出3D Tiles规范，支持海量模型数据（倾斜，BIM，点云等）
  ​        



# 二、Cesium 安装
- 准备条件
```shell
$ npm -v
6.4.1

$ node -v
8.12.0
```
- 安装依赖
```shell
$ npm install
```

- 运行服务
```shell
$ node server
```
*默认会运行在本地服务器(即 localhost/127.0.0.1) 上*  
*使用命令行参数控制是否运行在所有服务器上*  

```shell
$ node server --public true     # 全服务器
{ address: '0.0.0.0', family: 'IPv4', port: 8080 }
Cesium development server running publicly.  Connect to http://0.0.0.0:8080/

$ node server --public false    # 本地服务器
{ address: '127.0.0.1', family: 'IPv4', port: 8080 }
Cesium development server running locally.  Connect to http://127.0.0.1:8080/
```
*进入 `server.js` 搜索 '8080' 修改端口号*  

# 三、Cesium 基础操作
## 3.1 Hello World

html文件
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Use correct character set. -->
  <meta charset="utf-8">
  <!-- Tell IE to use the latest, best version. -->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!-- Make the application on mobile take up the full browser screen and disable user scaling. -->
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no">
  <title>模拟</title>
  <!-- 在 script 标签内加入 Cesium.js，它定义了 Cesium 对象， 包含我们所需要的一切。 -->
  <script src="../../Build/Cesium/Cesium.js"></script>
  <script type="text/javascript" src="../Sandcastle/Sandcastle-header.js"></script>
  <script type="text/javascript" src="../../ThirdParty/requirejs-2.1.20/require.js"></script>
  </script>
  <!-- 使用 Cesium Viewer 小部件 -->
  <style>
        @import url(../../Build/Cesium/Widgets/widgets.css);
        html, body, #cesiumContainer {
            width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden;
        }
  </style>
</head>
<body class="sandcastle-loading" data-sandcastle-bucket="bucket-requirejs.html">
  <style>
    @import url(../Sandcastle/templates/bucket.css);
  </style>
  <!-- 在 HTML 主体中，为 viewer 创建一个 div。 -->
  <div id="cesiumContainer" class="fullSize"></div>
  <div id="loadingOverlay"><h1>Loading...</h1></div>
  <div id="toolbar"></div>
  <script id="cesium_sandcastle_script", src="app.js"></script>                    
</body>
</html>
```
其中 js 文件只需一行代码即可：
```javascript
viewer = new Cesium.Viewer('cesiumContainer');
```


## 3.2 viewer 及图层设置
```javascript
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
  // baseLayerPicker: false,    // 是否显示图层显示器
  // imageryProvider: new Cesium.BingMapsImageryProvider({
  // url: 'https://dev.virtualearth.net',
  // key: 'YourBingMapKey',
  // mapStyle: Cesium.BingMapsStyle.AERIAL
  // }),
  // 加载地形系统
  terrainProvider : Cesium.createWorldTerrain({
    // url: 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles', // 默认立体地表
    requestWaterMask : true,        // 动态水纹
    requestVertexNormals: true      // 光效
  })
});
```

- 创建其他实例
```javascript
// 创建一个 scene 实例
var scene = viewer.scene;
// 创建一个 ellipsoid 实例
var ellipsoid = scene.globe.ellipsoid;
// 创建一个 clock 实例
var clock = viewer.clock;
// 创建一个 canvas 实例
var canvas = viewer.canvas
// 创建一个 camera 实例
var camera = viewer.scene.camera;
// 创建一个 entities 实例
var entities = viewer.entities;
```
## 3.3 其他设置
```javascript
// 隐藏 logo 与版权信息
viewer._cesiumWidget._creditContainer.style.display = 'none'; 
// 显示帧率
scene.debugShowFramesPerSecond = true;  
// 控制视角不转到地下（确保在地形后面的物体被正确地遮挡，只有最前端的对象可见）
this.viewer.scene.globe.depthTestAgainstTerrain = true; 
// 阳光照射区域高亮
scene.globe.enableLighting = true;
```

- 视野及相机参数
```javascript
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
});
```

- 结束加载
```javascript
Sandcastle.finishedLoading();
```
## 3.4 坐标转换

Cesium 其实是一个封装好的 WebGL 库，当然这里面就牵扯到好几套坐标问题：
屏幕坐标、三维空间坐标、投影坐标。而且坐标转换肯定是我们在开发任何地理信息系统中经常会碰到的问题，也比较复杂，简单总结了几种转换方式：

- pick：屏幕坐标
- cartesian：世界坐标（三维坐标）
- cartographic：地理坐标（弧度）
- point：经纬度坐标

### 3.4.1 坐标系
```javascript
new Cesium.Cartesian2(x, y)     // 表示一个二维笛卡尔坐标系，也就是直角坐标系（屏幕坐标系）
new Cesium.Cartesian3(x, y, z)  // 表示一个三维笛卡尔坐标系，也是直角坐标系（就是真实世界的坐标系）
```

### 3.4.2 二维屏幕坐标系到三维坐标系的转换

```javascript
var pick = new Cesium.Cartesian2(window.innerWidth, window,innerHeight);	// 屏幕坐标
var cartesian= scene.globe.pick(viewer.camera.getPickRay(pick), scene) // 世界坐标
```

注：在2D下上述方法不适用，改为

```javascript
var pick = new Cesium.Cartesian2(0, 0);	// 屏幕坐标
var cartesian = viewer.camera.pickEllipsoid(pick, viewer.scene.globe.ellipsoid);	// 世界坐标
```

### 3.4.3 三维坐标到地理坐标的转换

```javascript
var cartographic = scene.globe.ellipsoid.cartesianToCartographic(cartesian) 
// 其中 cartesian 是一个 Cesium.Cartesian3 对象。
```

或：

```javascript
var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
```

### 3.4.4 地理坐标到经纬度坐标的转换

```javascript
var point = [cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180]; 
//其中 cartographic 是一个地理坐标。
```

### 3.4.5 经纬度坐标转地理坐标（弧度）
```javascript
var cartographic = Cesium.Cartographic.fromDegree(point);           // point 是经纬度值
var coord_wgs84 = Cesium.Cartographic.fromDegrees(lng, lat, alt);   // 单位：度，度，米
```

### 3.4.6 经纬度转世界坐标
```javascript
var cartesian = Cesium.Cartesian3.fromDegree(point);
```

### 3.4.7 三维坐标转屏幕坐标

```javascript
var pick = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, cartesian)
```

### 3.4.8 计算两个三维坐标系之间的距离

```javascript
// pick1、pick3都是三维坐标系
var d = Cesium.Cartesian3.distance(
    new Cesium.Cartesian3(pick1.x, pick1.y, pick1.z), 
    new Cesium.Cartesian3(pick3.x, pick3.y, pick3.z)
);  
```

## 3.5 加载 3D 对象（Entity）

通过Cesium可以很清楚的将一个三维模型加载到地球中。有两种方式可以实现此功能。

### 3.5.1 直接添加
```javascript
var entity = viewer.entities.add({ 
    position : Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706), 
    model : { uri : '../Apps/SampleData/models/CesiumGround/Cesium_Ground.gltf' }
});
viewer.trackedEntity = entity; // 镜头追踪，将镜头固定在对象上
```


