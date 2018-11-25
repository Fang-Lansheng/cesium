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
var pick;                   // 三维坐标转屏幕坐标
var cartesian;              // 世界坐标（三维坐标 x, y, z）
var cartographic;           // 地理坐标（弧度）
var cursorPointLongitude;   // 鼠标指针当前经度
var cursorPointLatitude;    // 鼠标指针当前纬度
var cameraCartesian;        // 摄像机位置（三维坐标）
var cameraCartographic;     // 摄像机位置（地理坐标）
var cameraPosLongitude;     // 摄像机位置经度
var cameraPosLatitude;      // 摄像机位置纬度
var cameraPosHeight;        // 摄像机位置高度
handler.setInputAction(function(movement) {
  cartesian = scene.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);
  pick = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, cartesian);
  cameraCartesian = viewer.camera.position;
  cameraCartographic = Cesium.Cartographic.fromCartesian(cameraCartesian);
  cameraPosLongitude = Cesium.Math.toDegrees(cameraCartographic.longitude);
  cameraPosLatitude = Cesium.Math.toDegrees(cameraCartographic.latitude);
  cameraPosHeight = Cesium.Math.toDegrees(cameraCartographic.height);
  if (cartesian) {
    cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    cursorPointLongitude = Cesium.Math.toDegrees(cartographic.longitude);
    cursorPointLatitude = Cesium.Math.toDegrees(cartographic.latitude);
  }
  else {
    cursorPointLongitude = undefined;
    cursorPointLatitude = undefined;
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

// 添加新的大头针
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

/**
 * 气泡窗口（左键单击确定位置，右键结束）
 * 实现参考：
 * Cesium 中加入可更随地球移动的气泡 消息框 弹出框 - 山路十八弯，走过多少遍！ - CSDN博客 https://blog.csdn.net/u012539364/article/details/80292605
 *  
 */

function showPopup() {
  var popupPosition, popupPick, popupCartesian, popupCartographic, popupLongitude, popupLatitude;
  var infoDiv;
  var popupHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  popupHandler.setInputAction(function(movement) {
    if (cursorPointLatitude != undefined) {   // 存在经纬度
      popupCartesian = scene.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
      popupPick = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, popupCartesian);
      if (popupCartesian) {
        popupCartographic = Cesium.Cartographic.fromCartesian(popupCartesian);
        popupLongitude = Cesium.Math.toDegrees(popupCartographic.longitude);
        popupLatitude = Cesium.Math.toDegrees(popupCartographic.latitude);
      }

      if (infoDiv) {
        console.warn('气泡尚未关闭');
        window.document.getElementById('popupLongitude').innerHTML = popupLongitude.toFixed(4);
        window.document.getElementById('popupLatitude').innerHTML = popupLatitude.toFixed(4);
        return false;
      }
      else {
        infoDiv = window.document.createElement('div');
        infoDiv.id = "trackPopUp";
        infoDiv.style.display = 'none';
        infoDiv.innerHTML = 
          '<div id="trackPopUpContent" class="leaflet-popup" style="top:0;left:0;">' +
            '<a class="leaflet-popup-close-button" href="javascript:closePopup()">×</a>' +
            '<div class="leaflet-popup-content-wrapper">' +
              '<div id="trackPopUpLink" class="leaflet-popup-content" style="max-width:300px; max-height:500px;">' +
                '<h2>经度：<span id="popupLongitude"></span> 纬度：<span id="popupLatitude"></span></h2>' +
              '</div>' +
            '</div>' +
            '<div class="leaflet-popup-tip-container">' +
              '<div class="leaflet-popup-tip"></div>' +
            '</div>' +
          '</div>';
        window.document.getElementById('cesiumContainer').appendChild(infoDiv);
        window.document.getElementById('popupLongitude').innerHTML = popupLongitude.toFixed(4);
        window.document.getElementById('popupLatitude').innerHTML = popupLatitude.toFixed(4);
        window.document.getElementById('trackPopUp').style.display = 'block';
      }
      popupPosition = {
        x: popupPick.x,
        y: popupPick.y
      }

    }
    else {                                    // 鼠标在地图外
      // popupOverlay.style.display = 'none';
      window.document.getElementById('trackPopUp').style.display = 'block';
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  var popupPosition_new;
  viewer.scene.postRender.addEventListener(function() {
    if (popupPick != undefined) {
      if (popupPosition_new != popupPosition) {
        popupPosition_new = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, popupCartesian);
        var popupWidth = document.getElementById('trackPopUpContent').offsetWidth;
        var popupHeight = document.getElementById('trackPopUpContent').offsetHeight;
  
        var trackPopUpContent = window.document.getElementById('trackPopUpContent');
        trackPopUpContent.style.left = popupPosition_new.x - (popupWidth / 2) + 'px';
        trackPopUpContent.style.top = popupPosition_new.y - (popupHeight - 3) + 'px';
      }
    }
  })

  var popupIsSeen = true;
  
  if (!popupIsSeen) {     // 判断弹窗是否可见
    window.document.getElementById('trackPopUp').style.display = 'none';
  }

  // 右键单击结束
  popupHandler.setInputAction(function(movement) {
    // popupOverlay.style.display = 'none';
    popupHandler.destroy();
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
}


Sandcastle.addToolbarButton('New Pin', function() {
  return createNewPin();
})
Sandcastle.addToolbarButton('Popup', function() {
  return showPopup();
})
Sandcastle.addToolbarButton('Clear All', function() {
  viewer.entities.removeAll();
})

// 自定义 letflet风格 气泡窗口: https://blog.csdn.net/zlx312/article/details/79824940
// 使用cesium创建icon+text类型的标注: https://blog.csdn.net/u014529917/article/details/79523231

function closePopup() {
  window.document.getElementById('trackPopUp').style.display = 'none';
}