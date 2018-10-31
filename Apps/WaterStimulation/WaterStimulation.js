// 创建一个 viewer 实例
var viewer = new Cesium.Viewer('cesiumContainer', {
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
    shouldAnimate : true,          // 是否显示动画
    imageryProvider: new Cesium.BingMapsImageryProvider({
    url: 'https://dev.virtualearth.net',
    key: 'Au3ucURiaXsmmeNnBwafUWXupkCAvHe9ipzq6kOGYe5Xlthtf3MGRxiNURDN2FG2',
    mapStyle: Cesium.BingMapsStyle.AERIAL
    }),
    baseLayerPicker: false
});

// 创建一个 scene 实例
var scene = viewer.scene;
// 创建一个 ellipsoid 实例
var ellipsoid = scene.globe.ellipsoid;

// 设置控件
viewer._cesiumWidget._creditContainer.style.display = 'none'; // 隐藏 logo 信息
scene.debugShowFramesPerSecond = true;  // 显示帧率
// viewer.extend(Cesium.viewerCesiumInspectorMixin);

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

// load STK World Terrain
viewer.terrainProvider = Cesium.createWorldTerrain({
    requestWaterMask : true,        // 动态水纹
    requestVertexNormals: true      // 光效
});
// 确保在地形后面的物体被正确地遮挡，只有最前端的对象可见
viewer.scene.globe.depthTestAgainstTerrain = true;

// 绘制管道
// function computeCircle(radius) {
//     var positions = [];
//     for (var i = 0; i < 360; i++) {
//         var radians = Cesium.Math.toRadians(i); // 将角度转换为弧度
//         positions.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)));
//     };
//     return positions;
// }

// var redTube = viewer.entities.add({
//     name: 'Red tube with rounded corners',
//     polylineVolume: {
//         positions: Cesium.Cartesian3.fromDegreesArray([ -85.0, 32.0,
//                                                         -85.0, 36.0,
//                                                         -89.0, 36.0 ]),
//         shape: computeCircle(60000.0),
//         material: Cesium.Color.WHITE,
//         // outline: true,
//         // outlineWidth: 0.1
//         // fill: false
//     }
// });
// viewer.zoomTo(viewer.entities);

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
    var height = Math.ceil(viewer.camera.positionCartographic.height);
    document.getElementById("photo_altitude").innerHTML = height;
}, Cesium.ScreenSpaceEventType.WHEEL);


// 加载实体和为实体添加样式
// var kmlOptions = {
//     camera: scene.camera,
//     canvas: scene.canvas,
//     clampToGround: true
// };
// // Load geocache points of interest from a KML file
// var geocachePromise = Cesium.KmlDataSource.load('../SampleData/sampleGeocacheLocations')


// https://blog.csdn.net/qq_31709249/article/details/81303291 绘制水体
// 河道关键点数组
var riverPoint = [
    114.3551822527823,30.5307079885495,
    114.3552267019809,30.52923318471276,
    114.356143272256,30.52923318492236,
    114.3561327950136,30.53069861353263,
    114.3556273509441,30.53079783918866,
    114.3551822527823,30.5307079885495];

// 河道多边形
var riverPolygon = new Cesium.PolygonGeometry({
    polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(riverPoint)),
    extrudedHeight: 0,
    height: 0,
    vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
});

// 河流
var river = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
        geometry: riverPolygon
    }),
    appearance: new Cesium.EllipsoidSurfaceAppearance({
        aboveGround: true
    }),
    show: true
});

// 贴图
var riverMaterial = new Cesium.Material({
    fabric: {
        type: 'Water',
        uniforms: {
            normalMap: 'water.jpg',
            frequency: 100.0,
            animationSpeed: 0.01,
            amplitude: 10.0
        }
    }
});
river.appearance.material = riverMaterial;
scene.primitives.add(river);    // 添加到场景

function YundangLakeKML() {
    // Cesium 加载文件
    var Lake = viewer.dataSources.add(Cesium.KmlDataSource.load('Yundang-Lake.kml',{
        camera: viewer.camera,
        canvas: viewer.canvas,
    }));
    Lake.then(function(dataSource) {
        viewer.flyTo(dataSource.entities);
    });
    
};

// function BackToSchool() {
//     Sandcastle.declare(BackToSchool);
//     viewer.camera.flyTo({
//         destination: Cesium.Cartesian3.fromDegrees(114.3557895996096, 30.52703615981503, 5000),
//         orientation: {
//             heading: Cesium.Math.toRadians(0),
//             pitch: Cesium.Math.toRadians(-90),
//             roll: Cesium.Math.toRadians(0)
//         }
//     })
// };

var resetCameraFunction = function() {
    scene.camera.setView({
        // destination: Cesium.Cartesian3(-2267652.2655411586, 5009272.549292408, 5000),
        destination: Cesium.Cartesian3(Cesium.Cartesian3.x, Cesium.Cartesian3.y, 5000),
        orientation: {
            heading: Cesium.HeadingPitchRoll.heading,
            pitch: Cesium.HeadingPitchRoll.pitch,
            roll: Cesium.HeadingPitchRoll.roll
        }
    });
};
resetCameraFunction();

// snow
var snowParticleSize = scene.drawingBufferWidth / 100.0;
var snowRadius = 100000.0;
var minimumSnowImageSize = new Cesium.Cartesian2(snowParticleSize, snowParticleSize);
var maximumSnowImageSize = new Cesium.Cartesian2(snowParticleSize * 2.0, snowParticleSize * 2.0);
var snowSystem;

var snowGravityScratch = new Cesium.Cartesian3();
var snowUpdate = function(particle, dt) {
    snowGravityScratch = Cesium.Cartesian3.normalize(particle.position, snowGravityScratch);
    Cesium.Cartesian3.multiplyByScalar(snowGravityScratch, Cesium.Math.randomBetween(-30.0, -300.0), snowGravityScratch);
    particle.velocity = Cesium.Cartesian3.add(particle.velocity, snowGravityScratch, particle.velocity);

    var distance = Cesium.Cartesian3.distance(scene.camera.position, particle.position);
    if (distance > snowRadius) {
        particle.endColor.alpha = 0.0;
    } else {
        particle.endColor.alpha = snowSystem.endColor.alpha / (distance / snowRadius + 0.1);
    }
};

snowSystem = new Cesium.ParticleSystem({
    modelMatrix : new Cesium.Matrix4.fromTranslation(scene.camera.position),
    minimumSpeed : -1.0,
    maximumSpeed : 0.0,
    lifetime : 15.0,
    emitter : new Cesium.SphereEmitter(snowRadius),
    startScale : 0.5,
    endScale : 1.0,
    image : '../SampleData/snowflake_particle.png',
    emissionRate : 7000.0,
    startColor : Cesium.Color.WHITE.withAlpha(0.0),
    endColor : Cesium.Color.WHITE.withAlpha(1.0),
    minimumImageSize : minimumSnowImageSize,
    maximumImageSize : maximumSnowImageSize,
    updateCallback : snowUpdate
});
scene.primitives.add(snowSystem);

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
    endScale : 0.0,
    image : '../SampleData/circular_particle.png',
    emissionRate : 9000.0,
    startColor :new Cesium.Color(0.27, 0.5, 0.70, 0.0),
    endColor : new Cesium.Color(0.27, 0.5, 0.70, 0.98),
    imageSize : rainImageSize,
    updateCallback : rainUpdate
});
scene.primitives.add(rainSystem);

var options1 = [{
    text: '选择天气',
    onselect: function() {
        rainSystem.show = false;
        snowSystem.show = false;
    }
}, {
    text : 'Snow',
    onselect : function() {
        rainSystem.show = false;
        snowSystem.show = true;

        scene.skyAtmosphere.hueShift = -0.8;
        scene.skyAtmosphere.saturationShift = -0.7;
        scene.skyAtmosphere.brightnessShift = -0.33;

        scene.fog.density = 0.001;
        scene.fog.minimumBrightness = 0.8;
    }
}, {
    text : 'Rain',
    onselect : function() {
        rainSystem.show = true;
        snowSystem.show = false;

        scene.skyAtmosphere.hueShift = -0.97;
        scene.skyAtmosphere.saturationShift = 0.25;
        scene.skyAtmosphere.brightnessShift = -0.4;

        scene.fog.density = 0.00025;
        scene.fog.minimumBrightness = 0.01;
    }
}];


// Sandcastle.addToolbarButton('  ', function() {
//     YundangLakeKML();
// });
Sandcastle.addToggleButton('使用太阳光源', scene.globe.enableLighting = false, function(checked) {
    scene.globe.enableLighting = checked;
});
Sandcastle.addToolbarMenu(options1);
Sandcastle.finishedLoading();
