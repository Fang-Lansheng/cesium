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
var cameraCartographic;     // 摄像机位置（地理坐标：{经，纬，高}）
handler.setInputAction(function(movement) {
  cartesian = scene.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);
  pick = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, cartesian);
  cameraCartesian = viewer.camera.position;
  cameraCartographic = Cesium.Cartographic.fromCartesian(cameraCartesian);
  cameraCartographic.longitude = Cesium.Math.toDegrees(cameraCartographic.longitude);
  cameraCartographic.latitude = Cesium.Math.toDegrees(cameraCartographic.latitude);
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
  var $button = $('#button-new-pin').find('.cesium-button');
  var $modal = $('#button-new-pin').find('.modal');

  $button.on('click', function(event) {
    if ($(event.target).is($button)) {
      $modal.show(300);
    } else {
      $modal.hide(300);
    }
  });

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
 * 基于Cesium的通视分析的实现 - cr196的博客 - CSDN博客 https://blog.csdn.net/cr196/article/details/77072814 
 */
function showPopup() {
  var popupPick, popupCartesian, popupCartographic, popupLongitude, popupLatitude;
  var infoDiv;
  var popupHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  popupHandler.setInputAction(function(movement) {
    if (cursorPointLatitude != undefined) {   // 存在经纬度（鼠标指针在地球上）
      // 世界坐标（x, y, z）
      popupCartesian = scene.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
      // 屏幕坐标
      popupPick = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, popupCartesian);
      // 地理坐标（弧度）
      popupCartographic = Cesium.Cartographic.fromCartesian(popupCartesian);
      popupLongitude = Cesium.Math.toDegrees(popupCartographic.longitude);
      popupLatitude = Cesium.Math.toDegrees(popupCartographic.latitude);

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
                '<h2>经度：<span id="popupLongitude"></span>° 纬度：<span id="popupLatitude"></span>°</h2>' +
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
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
  // 使弹窗保持相对位置不变
  var popupPick_new;    // 新的屏幕坐标
  viewer.scene.postRender.addEventListener(function() {
    if (popupPick !== undefined) {
      if (popupPick_new !== popupPick) {
        popupPick_new = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, popupCartesian);
        var popupWidth = document.getElementById('trackPopUpContent').offsetWidth;
        var popupHeight = document.getElementById('trackPopUpContent').offsetHeight;
  
        var trackPopUpContent = window.document.getElementById('trackPopUpContent');
        trackPopUpContent.style.left = popupPick_new.x - (popupWidth / 2) + 'px';
        trackPopUpContent.style.top = popupPick_new.y - (popupHeight - 3) + 'px';
      }
    }
  })

  // 右键单击结束
  popupHandler.setInputAction(function(movement) {
    popupHandler.destroy();
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
}

/**
 * 关闭气泡窗口
 */
function closePopup() {
  var trackPopUp = window.document.getElementById('trackPopUp');
  if (trackPopUp) {
    trackPopUp.style.display = 'none';
  }
}

/**
 * 添加新的 Label
 */
function NewLabel() {

  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(homePosition[0], homePosition[1], 100),
    label: {
      text: 'A new label',
      font: '24px Helvetica',
      fillColor: Cesium.Color.SKYBLUE,
      // outlineColor: Cesium.Color.BLACK,
      // outlineWidth: 2,
      // style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      translucencyByDistance : new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e8, 0.0)
    }
  });
}

$(function() {
  var content_0 = $('.label-text').val(); // 文本框内容
  var count_0 = content_0.length;           // 字符长度
  $('.label-text-num').text(count_0);
  $('.label-text').on('blur keyup input', function() {
    var content = $('.label-text').val();
    var count = content.length;
    $('.label-text-num').text(count);
  })
})

var $pin_button = $('#button-new-pin').find('.toolbar-button');
var $pin_modal = $('#button-new-pin').find('.modal');

$pin_button.click(
  function(event) {
    if ($(event.target).is($pin_button)) {
      $pin_modal.show(300);
    } else {
      $pin_modal.hide(300);
    }
  }
  // ,
  // function(event) {
  //   if ($(event.target).is($pin_button)) {
  //     $pin_modal.hide(300);
  //   }
  // }
)

var pin_content;
$pin_modal.click(function(event) {
  if ($(event.target).is($('.button-cancel'))) {
    $pin_modal.hide(300);
  }
  if ($(event.target).is($('.button-commit'))) {
    $pin_modal.hide(300);
    pin_content = $('.label-text').val(); // 文本框内容
  }
})

Sandcastle.addToggleButton('天地图注记', viewer.imageryLayers.get(1).show = true, function(checked) {
  viewer.imageryLayers.get(1).show = checked;
}, 'button-tianditu');
// Sandcastle.addToolbarButton('New Pin', function() {
//   // return createNewPin();
// }, 'button-new-pin')
// Sandcastle.addToolbarButton('Popup', function() {
//   return showPopup();
// }, 'button-popup')
// Sandcastle.addToolbarButton('☥', function() {
//   return NewLabel();
// }, 'button-new-label')
// Sandcastle.addToolbarButton('Clear All', function() {
//   viewer.entities.removeAll();
// }, 'button-clear-all')
