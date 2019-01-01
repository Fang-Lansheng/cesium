/// <reference path="initCesium.js" />

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
$(function() {
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

  // 点击 √ 按钮时
  $plotting_modal.click(function(event) {
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
})