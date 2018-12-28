/// <reference path="initCesium.js" />

homePosition[2] = 40000;

initCesium();
Sandcastle.finishedLoading();

var scene = viewer.scene;
var camera = viewer.camera;

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

// 为 ture 时，球体会有高程遮挡效果
viewer.scene.globe.depthTestAgainstTerrain = false;
// 设置地形
scene.terrainProvider = new Cesium.CesiumTerrainProvider({
  url: Cesium.IonResource.fromAssetId(3956),
  requestVertexNormals: true
});

$(function(){
  // 设置 input label 样式
  $('.terrain-check').find(':input').labelauty();
});

// // 添加新的大头针
// function createNewPin(text, color) {
//   var pinBuilder = new Cesium.PinBuilder();
//   var pinHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
//   pinHandler.setInputAction(function(movement) {
//     var newPin = viewer.entities.add({
//       name: 'newPin',
//       position: Cesium.Cartesian3.fromDegrees(cursorPointLongitude, cursorPointLatitude),
//       billboard: {
//         image: pinBuilder.fromText(text, SetColor(color), 48).toDataURL(),
//         verticalOrigin: Cesium.VerticalOrigin.BOTTOM
//       }
//     });
//   }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
//   pinHandler.setInputAction(function(movement) {
//     pinHandler.destroy();
//   }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
// }
// $(function() {
//   var $pin_button = $('#button-new-pin').find('.toolbar-button');
//   var $pin_modal = $('#button-new-pin').find('.modal');

//   // 点击 New Pin 图标时
//   $pin_button.click(function(event) {
//     if ($(event.target).is($pin_button) && $pin_modal.is(':hidden')) {
//       $('.modal').hide(300);
//       $pin_modal.show(300);
//     }
//     else if ($(event.target).is($pin_button) && !$pin_modal.is(':hidden')) {
//       $pin_modal.hide(300);
//     }
//   })

//   // 点击 √ or × 按钮时
//   $pin_modal.click(function(event) {
//     if ($(event.target).is($('.button-cancel'))) {
//       $pin_modal.hide(300);
//     }
//     if ($(event.target).is($('.button-commit'))) {
//       $pin_modal.hide(300);
//     }
//   })
// })

// /**
//  * 气泡窗口（左键单击确定位置，右键结束）
//  * 实现参考：
//  * Cesium 中加入可更随地球移动的气泡 消息框 弹出框 - 山路十八弯，走过多少遍！ - CSDN博客 https://blog.csdn.net/u012539364/article/details/80292605
//  * 基于Cesium的通视分析的实现 - cr196的博客 - CSDN博客 https://blog.csdn.net/cr196/article/details/77072814 
//  */
// function showPopup() {
//   var popupPick, popupCartesian, popupCartographic, popupLongitude, popupLatitude;
//   var infoDiv;
//   var popupHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
//   popupHandler.setInputAction(function(movement) {
//     if (cursorPointLatitude != undefined) {   // 存在经纬度（鼠标指针在地球上）
//       // 世界坐标（x, y, z）
//       popupCartesian = scene.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
//       // 屏幕坐标
//       popupPick = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, popupCartesian);
//       // 地理坐标（弧度）
//       popupCartographic = Cesium.Cartographic.fromCartesian(popupCartesian);
//       popupLongitude = Cesium.Math.toDegrees(popupCartographic.longitude);
//       popupLatitude = Cesium.Math.toDegrees(popupCartographic.latitude);

//       if (infoDiv) {
//         console.warn('气泡尚未关闭');
//         window.document.getElementById('popupLongitude').innerHTML = popupLongitude.toFixed(4);
//         window.document.getElementById('popupLatitude').innerHTML = popupLatitude.toFixed(4);
//         return false;
//       }
//       else {
//         infoDiv = window.document.createElement('div');
//         infoDiv.id = "trackPopUp";
//         infoDiv.style.display = 'none';
//         infoDiv.innerHTML = 
//           '<div id="trackPopUpContent" class="leaflet-popup" style="top:0;left:0;">' +
//             '<a class="leaflet-popup-close-button" href="javascript:closePopup()">×</a>' +
//             '<div class="leaflet-popup-content-wrapper">' +
//               '<div id="trackPopUpLink" class="leaflet-popup-content" style="max-width:300px; max-height:500px;">' +
//                 '<h2>经度：<span id="popupLongitude"></span>° 纬度：<span id="popupLatitude"></span>°</h2>' +
//               '</div>' +
//             '</div>' +
//             '<div class="leaflet-popup-tip-container">' +
//               '<div class="leaflet-popup-tip"></div>' +
//             '</div>' +
//           '</div>';
        
//         window.document.getElementById('cesiumContainer').appendChild(infoDiv);
//         window.document.getElementById('popupLongitude').innerHTML = popupLongitude.toFixed(4);
//         window.document.getElementById('popupLatitude').innerHTML = popupLatitude.toFixed(4);
//         window.document.getElementById('trackPopUp').style.display = 'block';
//       }
//     }
//   }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
//   // 使弹窗保持相对位置不变
//   var popupPick_new;    // 新的屏幕坐标
//   viewer.scene.postRender.addEventListener(function() {
//     if (popupPick !== undefined) {
//       if (popupPick_new !== popupPick) {
//         popupPick_new = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, popupCartesian);
//         var popupWidth = document.getElementById('trackPopUpContent').offsetWidth;
//         var popupHeight = document.getElementById('trackPopUpContent').offsetHeight;
  
//         var trackPopUpContent = window.document.getElementById('trackPopUpContent');
//         trackPopUpContent.style.left = popupPick_new.x - (popupWidth / 2) + 'px';
//         trackPopUpContent.style.top = popupPick_new.y - (popupHeight - 3) + 'px';
//       }
//     }
//   })

//   // 右键单击结束
//   popupHandler.setInputAction(function(movement) {
//     popupHandler.destroy();
//   }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
// }

// /**
//  * 关闭气泡窗口
//  */
// function closePopup() {
//   var trackPopUp = window.document.getElementById('trackPopUp');
//   if (trackPopUp) {
//     trackPopUp.style.display = 'none';
//   }
// }

// // 将 color（string）与 Cesium.Color 一一对应
// function SetColor(color) {
//   switch(color) {
//     case "white":
//       color = Cesium.Color.WHITE;
//       break;
//     case "black":
//       color = Cesium.Color.BLACK;
//       break;
//     case "red":
//       color = Cesium.Color.RED;
//       break;
//     case "green":
//       color = Cesium.Color.GREEN;
//       break;
//     case "blue":
//       color = Cesium.Color.BLUE;
//       break;
//     default:
//       color = Cesium.Color.BLACK;
//   }
//   return color;
// }

// var guideOverlay = document.createElement('div');
// viewer.container.appendChild(guideOverlay);
// guideOverlay.className = 'backdrop';
// guideOverlay.style.display = 'none';
// guideOverlay.style.position = 'absolute';
// guideOverlay.style.bottom = '0';
// guideOverlay.style.left = '0';
// guideOverlay.style['pointer-events'] = 'none';
// guideOverlay.style.padding = '4px';
// guideOverlay.style.backgroundColor = 'rgba(50, 50, 50, 0.7)';

// var labels = scene.primitives.add(new Cesium.LabelCollection());
// var labels_num = 0;
// var $labels_list = $('.label-list').find('tbody');


// // 添加新的 Label
// function CreateNewLabel(text, color) {
//   var pinHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
//   pinHandler.setInputAction(function(movement) {  
//     guideOverlay.style.display = 'block';
//     guideOverlay.style.bottom = viewer.canvas.clientHeight - movement.endPosition.y + 'px';
//     guideOverlay.style.left = movement.endPosition.x + 'px';
//     guideOverlay.innerHTML = '左键双击确定位置</br>' + '右键单击退出编辑';
//   }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
//   pinHandler.setInputAction(function(movement) {
//     var cartesian = scene.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
//     labels.add({
//       position: cartesian,
//       text: text,
//       fillColor: SetColor(color),
//       translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.0),
//       scaleByDistance : new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.5)
//     })
//     var labels_node = 
//       '<tr class="label-list-tr">' +
//         '<th class="label_index" id="' + labels_num + '">' + (labels_num + 1) + '.</th>' +
//         '<th class="label_text" style="color: ' + color + ';">' + labels.get(labels_num).text + '</th>' +
//         '<th class="label_locate"><button type="button" class="button button-locate fa fa-search"></button></th>' +
//         '<th class="label_delete"><button type="button" class="button button-delete fa fa-trash"></button></th>' + 
//       '</tr>';
//     $labels_list.append(labels_node);
//     labels_num++;
//     CheckList();
//   }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
//   pinHandler.setInputAction(function(movement) {
//     guideOverlay.style.display = 'none';
//     pinHandler.destroy();
//   }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
// }

// // 删除 Label
// function DeleteLabel(node, label) {
//   node.remove();
//   labels.remove(label);
//   labels_num--;

//   var tabels = $('.label-list-tr');
//   for (let i = 0; i < tabels.length; i++) {
//     tabels[i].firstChild.id = i + '';
//     tabels[i].firstChild.innerHTML = i + 1 + '.'
//   }
// }
// // 检查 Label List 是否为空
// function CheckList() {
//   if ($('.label-list-tr').length > 0) {
//     $('.label-list-guide').hide(300);
//   }
//   else if ($('.label-list-tr').length == 0) {
//     $('.label-list-guide').show(300);
//   }
// }

// // New Label
// $(function() {
//   var content_0 = $('.label-text').val(); // 文本框内容
//   var count_0 = content_0.length;           // 字符长度
//   $('.label-text-num').text(count_0);
//   $('.label-text').on('blur keyup input', function() {
//     var content = $('.label-text').val();
//     var count = content.length;
//     $('.label-text-num').text(count);
//   })

//   var $color_radio = $('.color-select').find(':input');
//   $color_radio.labelauty();

//   var $label_button = $('#button-new-label').find('.toolbar-button');
//   var $label_modal = $('#button-new-label').find('.modal');

//   $label_button.click(
//     function(event) {
//       if ($(event.target).is($label_button) && $label_modal.is(':hidden')) {
//         $('.modal').hide(300);
//         $label_modal.show(300);
//         $('.label-text').focus();
//         $('.label-text').select();  // 输入框文本被选中
//       } 
//       else if ($(event.target).is($label_button) && !$label_modal.is(':hidden')) {
//         $label_modal.hide(300);
//       }
//     }
//   )
  
//   var label_content = null, label_color;
//   $label_modal.click(function(event) {
//     if ($(event.target).is($('.button-cancel'))) {
//       $label_modal.hide(300);
//     }
//     if ($(event.target).is($('.button-commit'))) {
//       label_content = $('.label-text').val(); // 文本框内容
//       label_color = $('.color-select').find('input:checked').val(); // 选择的颜色
//       if (label_content == '' || label_content == null) {
//         confirm('Text is empty!')
//         return;
//       }
//       $label_modal.hide(300);
//       CreateNewLabel(label_content, label_color);
//     }
//   })
// })

// // Label List
// $(function() {
//   var $label_list_button = $('#button-list-label').find('.toolbar-button');
//   var $label_list_modal = $('#button-list-label').find('.modal');

//   // 点击 Label List 图标时
//   $label_list_button.click(function(event) {
//     if ($(event.target).is($label_list_button) && $label_list_modal.is(':hidden')) {
//       $('.modal').hide(300);
//       $label_list_modal.show(300);
//       CheckList();
//     }
//     else if ($(event.target).is($label_list_button) && !$label_list_modal.is(':hidden')) {
//       $label_list_modal.hide(300);
//     }
//   })

//   $label_list_modal.click(function(event) {
//     // 点击 🔍 按钮时
//     if ($(event.target).is($('.button-locate'))) {
//       // // 先通过表格第一列获取该 Label 的序号
//       var index_0 = $(event.target).parent().parent().find('.label_index').attr('id');
//       // 根据序号得到这个 Label 的实例
//       var label_0 = labels.get(index_0);
//       var label_cartographic = scene.globe.ellipsoid.cartesianToCartographic(label_0.position)
//       var label_longitude = label_cartographic.longitude / Math.PI * 180;
//       var label_latitude = label_cartographic.latitude / Math.PI * 180;
//       // look(label_cartographic.longitude, label_cartographic.latitude, 30000);
//       camera.flyTo({
//         destination: Cesium.Cartesian3.fromDegrees(label_longitude, label_latitude, 30000),
//         orientation: {
//           heading: 0.0,
//           pitch: Cesium.Math.toRadians(-85.0),
//           roll: 0.0
//         }
//       });
//     }    
//     // 点击 🗑️ 按钮时
//     if ($(event.target).is($('.button-delete'))) {
//       // 同理
//       var index_1 = $(event.target).parent().parent().find('.label_index').attr('id');
//       var label_1 = labels.get(index_1);
//       DeleteLabel($(event.target).parent().parent(), label_1);
//       CheckList();
//     }
//     // 点击 √ 按钮时
//     if ($(event.target).is($('.button-commit'))) {
//       $label_list_modal.hide(300);
//     }
//   })
// })


// Plotting
$(function() {
  /**
   * Plotting
   */
  var $plotting_button = $('#button-plotting-new');
  var $plotting_modal = $('#plotting-modal')

  // 点击 ✎ 按钮时
  $plotting_button.click(function(event) {
    if ($(event.target).is($plotting_button) && $plotting_modal.is(':hidden')) {
      $('.modal').hide(300);  // 关闭所有其他模态窗
      $plotting_modal.show(300);
    } else {
      $plotting_modal.hide(300);
    }
  })

  $plotting_modal.click(function(event) {
    // 点击 √ 按钮时
    if ($(event.target).is($('.button-commit'))) {
      $plotting_modal.hide(300);
    }
  })


  /**
   * Plotting Options
   */
  var $plotting_options_button = $('#button-plotting-options');
  var $plotting_options_modal = $('#plotting-options-modal');

  // 点击 ▼ 按钮时
  $plotting_options_button.click(function(event) {
    if ($(event.target).is($plotting_options_button) && $plotting_options_modal.is(':hidden')) {
      $('.modal').hide(300);
      $plotting_options_modal.show(300);
    } else {
      $plotting_options_modal.hide(300);
    }
  })

  $plotting_options_modal.click(function(event) {

    // 点击 保存文件 按钮时
    if ($(event.target).is('#file-save')) {

    }

    // 点击 打开文件 按钮时
    if ($(event.target).is('#file-open') ||
        $(event.target).is($('#file-open').find('span'))) {
      $('#file-plot-input').click();
    }
    $('#file-plot-input').change(function() {
      var file = this.files[0];
      var filename = file.name;
      if ('json' != filename.substring(filename.lastIndexOf('.') + 1, filename.length).toLowerCase()) {
        return;
      }
      if (window.FileReader) {
        var fileReader = new FileReader;
        fileReader.readAsText(file, 'UTF-8');
        fileReader.onloadend = function(o) {
          // jsonToLayer(this.result); clearSelectFile();
        }
      }

    })

    // 点击 【地形开启】CheckBox 时
    $('#checkHasterrain').change(function() {
      var checked = $(this).is(':checked');
      var $label_content = $(this).next();
      if (checked) {
        scene.terrainProvider = new Cesium.CesiumTerrainProvider({
          url: Cesium.IonResource.fromAssetId(3956),
          requestVertexNormals: true
        });
      } else {
        scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();  // 默认，无地形
      }
    })

    // 点击 【深度检测】CheckBox 时
    $('#checkTestterrain').change(function() {
      var checked = $(this).is(':checked');
      // 为 ture 时，球体会有高程遮挡效果
      viewer.scene.globe.depthTestAgainstTerrain = checked;
    })

    // 点击 √ 按钮时
    if ($(event.target).is($('.button-commit'))) {
      $plotting_options_modal.hide(300);
    }

  })
})


/**
 * 
 */
// 封装 Polyline 对象
var PolylinePrimitive = (function() {
  function _(positions) {
    this.options = {
      polyline: {
        show: true,
        positions: [],
        material: Cesium.Color.CORNFLOWERBLUE,
        width: 5
      }
    };
    this.positions = positions;
    this._init();
  }

  _.prototype._init = function() {
    var _self = this;
    var _update = function() {
      return _self.positions;
    };

    // 实时更新 polyline.positions
    this.options.polyline.positions = new Cesium.CallbackProperty(_update, false);
    viewer.entities.add(this.options);
  }

  return _;
})();

// 初始化
var positions = [];
var poly = undefined;

// 鼠标监听事件
handler.setInputAction(function(movement) {
  var cartesian = scene.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
  
  if (positions.length == 0) {
    positions.push(cartesian.clone());
  }

  positions.push(cartesian);
}, Cesium.ScreenSpaceEventType.LEFT_CLICK)

handler.setInputAction(function(movement) {
  var cartesian = scene.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);

  if (positions.length >= 2) {
    if (!Cesium.defined(poly)) {
      poly = new PolylinePrimitive(positions);
    } else {
      positions.pop();
      cartesian.y += (1 + Math.random());
      positions.push(cartesian);
    }
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

handler.setInputAction(function(movement) {
  handler.destroy();
}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);