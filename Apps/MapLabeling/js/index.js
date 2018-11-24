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

const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
var cursorPointLongitude;   // 鼠标指针当前经度
var cursorPointLatitude;    // 鼠标指针当前纬度
handler.setInputAction(function(movement) {
  var cartesian = scene.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);
  if (cartesian) {
    var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    cursorPointLongitude = Cesium.Math.toDegrees(cartographic.longitude);
    cursorPointLatitude = Cesium.Math.toDegrees(cartographic.latitude);
  }
  else {
    cursorPointLongitude = undefined;
    cursorPointLatitude = undefined;
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);


function createNewPin() {
  var pinHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  pinHandler.setInputAction(function(movement) {
    var newPin = viewer.entities.add({
      name: 'newPin',
      position: Cesium.Cartesian3.fromDegrees(cursorPointLongitude, cursorPointLatitude),
      billboard: {
        image: pinBuilder.fromText('?', Cesium.Color.BLACK, 48).toDataURL(),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
      }
    });
  }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  pinHandler.setInputAction(function(movement) {
    pinHandler.destroy();
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
}

function showCoordinate() {
  // HTML overlay for showing feature name on mouseover
  var coordinateOverlay = document.createElement('div');
  viewer.container.appendChild(coordinateOverlay);
  coordinateOverlay.className = 'backdrop';
  coordinateOverlay.style.display = 'none';
  coordinateOverlay.style.position = 'absolute';
  coordinateOverlay.style.bottom = '0';
  coordinateOverlay.style.left = '0';
  coordinateOverlay.style['pointerEvents'] = 'none';
  coordinateOverlay.style.padding = '4px';
  coordinateOverlay.style.backgroundColor = 'black';

  var coordinateHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  coordinateHandler.setInputAction(function(movement) {
    if (cursorPointLatitude != undefined) {   // 存在经纬度
      // var coordinateString = '经度：' + cursorPointLongitude + '纬度' + cursorPointLatitude;
      var coordinateString = '\
      <h1>TEST</h1>\
      <p>TEST</p>';
      var coordinateLabel = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(cursorPointLongitude, cursorPointLatitude),
        label: {
          text: coordinateString
        }
      });
      coordinateLabel.label.scale = 0.5;
      coordinateLabel.label.showBackground = true;
    }
    else {                                    // 鼠标在地图外
      coordinateOverlay.style.display = 'none';
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  // 右键单击结束
  coordinateHandler.setInputAction(function(movement) {
    coordinateOverlay.style.display = 'none';
    coordinateHandler.destroy();
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  
}

Sandcastle.addToolbarButton('New Pin', function() {
  return createNewPin();
})
Sandcastle.addToolbarButton('Get Coordinate', function() {
  return showCoordinate();
})
Sandcastle.addToolbarButton('Clear All', function() {
  viewer.entities.removeAll();
})