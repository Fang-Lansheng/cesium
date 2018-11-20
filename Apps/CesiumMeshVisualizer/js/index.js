/// <reference path="../js/common.js" />

//requirejs([
//       "../../../requirejs.config.js",
//       "../../../appconfig.js",
//       '../../../Source/Main',
//       '../common.js'
//], function (
//       config,
//       appconfig,
//       Cesium,
//       common
//       ) {
MeshVisualizer = Cesium.MeshVisualizer;
Mesh = Cesium.Mesh;
MeshMaterial = Cesium.MeshMaterial;
FramebufferTexture = Cesium.FramebufferTexture;
GeometryUtils = Cesium.GeometryUtils;
LOD = Cesium.LOD;
CSG = Cesium.CSG;

init();

var center = Cesium.Cartesian3.fromDegrees(homePosition[0], homePosition[1], 5000);
var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);

var meshVisualizer = new MeshVisualizer({
    modelMatrix: modelMatrix,
    up: { z: 1 }
});
viewer.scene.primitives.add(meshVisualizer);
meshVisualizer.showReference = true;//显示坐标轴

// 示例一：Cesium.Geometry + Cesium.MeshMaterial 组合
var box = Cesium.BoxGeometry.createGeometry(Cesium.BoxGeometry.fromDimensions({
    dimensions: new Cesium.Cartesian3(100000, 50000, 50000),
    vertexFormat: Cesium.VertexFormat.POSITION_ONLY
}));
var material = new MeshMaterial({
    defaultColor: "rgba(255, 0, 0, 1.0)",
    wireframe: false,
    side: MeshMaterial.Sides.DOUBLE
});
var boxMesh = new Mesh(box, material);
meshVisualizer.add(boxMesh);

// 示例二：Cesium.CSG + Cesium.MeshVisualizer 组合，可以用 Cesium.CSG 做布尔运算并渲染运算结果
// 首先使用 Cesium 创建球体
var sphere = new Cesium.SphereGeometry({
    radius: 50000.0,
    vertexFormat: Cesium.VertexFormat.POSITION_ONLY
});
sphere = Cesium.SphereGeometry.createGeometry(sphere);
var sphereMesh = new Mesh(sphere, material);
sphereMesh.position = new Cesium.Cartesian3(100000, 0, 0);
meshVisualizer.add(sphereMesh);
// 将球体对象 Cesium.SphereGeometry 转成 Cesium.CSG实例
sphere = CSG.toCSG(sphere);
// 将盒子对象转成 Cesium.CSG 实例
box = CSG.toCSG(box);
// 做布尔运算
var subResult = sphere.subtract(box);
// 渲染运算结果
var subResultMesh = new Mesh(subResult, material);
subResultMesh.position = new Cesium.Cartesian3(200000, 0, 0);
meshVisualizer.add(subResultMesh);

// var material = new MeshMaterial({
//     defaultColor: "rgba(200,0,0,1.0)",
//     wireframe: true,
//     side: MeshMaterial.Sides.FRONT
// });
// var geometry = new Cesium.SphereGeometry({
//     radius: 50000.0,
//     vertexFormat: Cesium.VertexFormat.POSITION_ONLY
// });
// var mesh = new Mesh(geometry, material);
// mesh.position.z += 50000;
// meshVisualizer.add(mesh);

// setInterval(function () {
//     mesh.rotation.angle += 1;
//     mesh.modelMatrixNeedsUpdate = true;
// }, 20);

//});
