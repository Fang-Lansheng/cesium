/// <reference path="initCesium.js" />
/// <reference path="DrawHelper.js" />
/**
 * 【参考】
 * 1. leforthomas/cesium-drawhelper: A shape editor for Cesium. 
 *    https://github.com/leforthomas/cesium-drawhelper
 * 2. Cesium学习笔记-工具篇03-DrawHelper_cumtzheNo1_新浪博客
 *    http://blog.sina.com.cn/s/blog_15e866bbe0102xvwv.html
 * 3. Cesium学习笔记-工具篇04-ChangeablePrimitive可编辑图形_cumtzheNo1_新浪博客
 *    http://blog.sina.com.cn/s/blog_15e866bbe0102xvwx.html
 * 4. 标绘 （绘制文字、点、线、面、管道等） 【矢量数据 数据编辑】 | MarsGIS for Cesium 示例 | 合肥火星科技有限公司
 *    http://cesium.marsgis.cn/cesium-example/editor.html#26_draw
 */

// Plotting

homePosition[2] = 40000;

initCesium();
Sandcastle.finishedLoading();
var scene = viewer.scene;
// 为 ture 时，球体会有高程遮挡效果
viewer.scene.globe.depthTestAgainstTerrain = false;
// 设置地形
scene.terrainProvider = new Cesium.CesiumTerrainProvider({
  url: Cesium.IonResource.fromAssetId(3956),
  requestVertexNormals: true
});

// 设置 input label 样式
$('.terrain-check').find(':input').labelauty();


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
  if ($(event.target).is($('#plotting-line')) ||
      $(event.target).is($('#plotting-line').find('img'))) {
    $plotting_modal.hide(300);
    startDrawingPolyline();
  }
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



/**
 * DrawHelper
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
  };

  return _;
})();

// 初始化
function startDrawingPolyline() {
  var polylineHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  var positions = [];
  var polyline = undefined;

  polylineHandler.setInputAction(function(movement) {
    var cartesian = scene.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
    if (positions.length == 0) {
      positions.push(cartesian.clone());
    }
    positions.push(cartesian);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  polylineHandler.setInputAction(function(movement) {
    var cartesian = scene.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);
    if (positions.length >= 2) {
      if (!Cesium.defined(polyline)) {
        polyline = new PolylinePrimitive(positions);
      } else {
        positions.pop();
        cartesian.y += (1 + Math.random());
        positions.push(cartesian);
      }
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  polylineHandler.setInputAction(function(movement) {
    polylineHandler.destroy();
  }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
}