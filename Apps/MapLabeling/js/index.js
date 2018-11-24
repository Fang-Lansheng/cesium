/// <reference path="initCesium.js" />

homePosition[2] = 40000;

initCesium();
Sandcastle.finishedLoading();

// var Rivers = viewer.dataSources.add(Cesium.KmlDataSource.load('./source/wuhan_river_system.kml', {
//   camera: viewer.scene.camera, 
//   canvas: viewer.scene.canvas,
//   clampToGround: true     // 开启贴地
// }));
// Rivers.then(function(dataSource) {
//   let riverEntities = dataSource.entities.values; // 获取所有对象，一个 Entity 的 ArrayList
//   for (let i = 0; i < riverEntities.length; i++) {
//     let entity = riverEntities[i];
//     if (entity.polygon || entity.polyline) {
//       viewer.entities.add(entity);
//       entity.polygon.fill = undefined;
//       entity.polygon.material = Cesium.Color.BLUE.withAlpha(0.25);
//       entity.lable = new Cesium.LabelGraphics({
//         text: entity._name,   // 文字
//         font: '14px',
//         color: Cesium.Color.YELLOW,
//         style: Cesium.LabelStyle.FILL_AND_OUTLINE,
//         outlineWidth: 1,
//         pixelOffset: new Cesium.Cartesian2(0, 20)
//       })
//     }
//   }
//   dataSource.entities.removeAll();
// });

var scene = viewer.scene;

var pinBuilder = new Cesium.PinBuilder();

var bluePin = viewer.entities.add({
  name: 'Blank blue pin',
  position: home,
  billborad: {
    image: pinBuilder.fromText('?', Cesium.Color.BLACK, 48).toDataURL(),
    verticalOrigin: Cesium.VerticalOrigin.BOTTOM
  }
});

var questionPin = viewer.entities.add({
  name : 'Question mark',
  position : Cesium.Cartesian3.fromDegrees(-75.1698529, 39.9220071),
  billboard : {
      image : pinBuilder.fromText('?', Cesium.Color.BLACK, 48).toDataURL(),
      verticalOrigin : Cesium.VerticalOrigin.BOTTOM
  }
});

const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
var cursorPointLongitude;
var cursorPointLatitude;
handler.setInputAction(function(movement) {
  var cartesian = scene.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);
  if (cartesian) {
    var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    cursorPointLongitude = Cesium.Math.toDegrees(cartographic.longitude);
    cursorPointLatitude = Cesium.Math.toDegrees(cartographic.latitude);
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

function createPin() {
  var newPin = viewer.entities.add({
    name: 'newPin',
    position: Cesium.Cartesian3.fromDegrees(cursorPointLongitude, cursorPointLatitude),
    billboard: {
      image: pinBuilder
    }
  })
}