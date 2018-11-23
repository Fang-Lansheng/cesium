//准备
var homePosition = [114.29, 30.56, 300000];//初始位置
var viewer = null;
var home = Cesium.Cartesian3.fromDegrees(homePosition[0], homePosition[1], homePosition[2]);

//初始化
function initCesium() {
	if (viewer) {
		return;
	}
	viewer = new Cesium.Viewer("cesiumContainer", {
    animation: false,             // 是否显示动画小部件（左下角仪表盘）
    baseLayerPicker: true,        // 是否显示图层选择器
    fullscreenButton: false,      // 是否显示全屏按钮
    geocoder: true,               // 是否显示 geocoder 小部件（右上角查询按钮）
    vrButton: false,              // 是否显示 VR 按钮
    homeButton: true,             // 是否显示 Home 按钮
    infoBox: true,                // 是否显示信息框
    scene3DOnly: false,           // 如果设置为 true，则所有几何图形以 3D 模式绘制以节约GPU资源
    sceneModePicker: true,        // 是否显示 3D/2D 选择器
    selectionIndicator: false,    // 是否显示指示器组件
    shadows : true,               // 是否显示阴影
    shouldAnimate : true,         // 是否显示动画
    navigationHelpButton: true,  	// 是否显示右上角的帮助按钮
    timeline: false,              // 是否显示时间轴
		creditContainer: "creditContainer",
		// imageryProvider: new Cesium.BingMapsImageryProvider({
		// 	url: 'https://dev.virtualearth.net',
		// 	key: 'Au3ucURiaXsmmeNnBwafUWXupkCAvHe9ipzq6kOGYe5Xlthtf3MGRxiNURDN2FG2',
		// 	mapStyle: Cesium.BingMapsStyle.AERIAL
		// 	}),
		// baseLayerPicker: false
	});
	// 添加天地图注记
	viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
		url: 'http://t0.tianditu.com/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles',
		layer: 'tdtImgAnnoLayer',
		style: 'default',
		format: 'image/jpeg',
		tileMatrixSetID: 'GoogleMapsCompatible',
		show: false
	}));

	// 创建一个 scene 实例
	var scene = viewer.scene;
	// 创建一个 ellipsoid 实例
	var ellipsoid = scene.globe.ellipsoid;
	// 创建一个 clock 实例
	var clock = viewer.clock;

	//移动设备上禁掉以下几个选项，可以相对更加流畅
	if (navigator.userAgent.match(/(iPhone|iPod|Android|ios)/i)) {
		viewer.scene.fog.enable = false;
		viewer.scene.skyAtmosphere.show = false;
		viewer.scene.fxaa = false;
	}
	// 重设 homeButton
	viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function (evt) {
		look(homePosition[0], homePosition[1], homePosition[2]);
		evt.cancel = true;
	})
	navigationHelpButtonLang();
	//设置操作习惯
	viewer.scene.screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH];
	viewer.scene.screenSpaceCameraController.tiltEventTypes = [Cesium.CameraEventType.PINCH, Cesium.CameraEventType.RIGHT_DRAG];

	look(homePosition[0], homePosition[1], homePosition[2]);

	var imageryProviderViewModels = viewer.baseLayerPicker.viewModel.imageryProviderViewModels;
	viewer.baseLayerPicker.viewModel.selectedImagery = imageryProviderViewModels[3];
	viewer.extend(Cesium.viewerCesiumInspectorMixin);
	viewer.cesiumInspector.container.style.display = "none";	// 
	// viewer.scene.globe.depthTestAgainstTerrain = true; 			// 控制视角不转到地下（确保在地形后面的物体被正确地遮挡，只有最前端的对象可见）
	viewer.scene.debugShowFramesPerSecond = true;							// 显示帧率
	document.addEventListener('keydown', function (event) {		// 监测键盘事件
		var e = event || window.event || arguments.callee.caller.arguments[0];
		if (e) {
			switch (e.keyCode) {
				case 82: // R键查看地形三角网
					if (viewer.cesiumInspector) {
						viewer.cesiumInspector.viewModel.wireframe = !viewer.cesiumInspector.viewModel.wireframe;
					}
					break;
				case 70: // F键查看帧率
					viewer.scene.debugShowFramesPerSecond = !viewer.scene.debugShowFramesPerSecond;
					break;
				default:
			}
		}
	});

	// 实时显示经纬度、坐标值及视角高
	document.getElementById("widget").style.display = 'block';								// 未加载前，先不显示
	document.getElementById("longitude").innerHTML = '东经';             
	document.getElementById("longitude_show").innerHTML = homePosition[0];    // 经度初始值
	document.getElementById("latitude").innerHTML = '北纬';             
	document.getElementById("latitude_show").innerHTML = homePosition[1];     // 纬度初始值
	document.getElementById("altitude_show").innerHTML = 0;           				// 海拔初始值
	document.getElementById("photo_altitude").innerHTML = homePosition[2];    // 视角高初始值
	// 使用 ScreenSpaceEvenHandler，一组在用户输入操作上触发指定功能的处理程序
	const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
	// ScreenSpaceEventHandler.setInputAction() 监听操作类型 ScreenSpaceEventType 的种类，并运行一个特定的函数，将用户操作作为参数传递
	// 移动鼠标获得该点经、纬度、X、Y 坐标
	handler.setInputAction(function(movement) {
		// 通过指定的椭球或者地图对应的坐标系，将鼠标的二维坐标转换为对应椭球体三维坐标
		// var ray = viewer.camera.getPickRay(movement.endPosition);
		// var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
		var cartesian = scene.camera.pickEllipsoid(movement.endPosition, ellipsoid);
		if (cartesian) {
			var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
			// var cartographic = scene.globe.ellipsoid.cartesianToCartographic(cartesian);
			var longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(4); // 经度
			var latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(4);   // 维度
			var height = viewer.scene.globe.getHeight(cartographic);                  // 海拔
			height = Number(height).toFixed(2);
			if (longitude >= 0) {
				document.getElementById("longitude").innerHTML = '东经';
				document.getElementById("longitude_show").innerHTML = longitude;        // 经度
			}
			else {
				document.getElementById("longitude").innerHTML = '西经';
				document.getElementById("longitude_show").innerHTML = -longitude;       // 经度
			}
			if (latitude >= 0) {
				document.getElementById("latitude").innerHTML = '北纬';
				document.getElementById("latitude_show").innerHTML = latitude;          // 纬度
			}
			else {
				document.getElementById("latitude").innerHTML = '南纬';
				document.getElementById("latitude_show").innerHTML = -latitude;         // 纬度
			}
			document.getElementById("altitude_show").innerHTML = height;
		}
		else {
			console.log("地图外的点！");
		}
		let c_height = Math.ceil(viewer.camera.positionCartographic.height);
		document.getElementById("photo_altitude").innerHTML = c_height;
		if (c_height > 99999999999) {
			alert("You've lost!");
		}
	}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
	// 滑动鼠标滚轮获得该点摄影机高度
	handler.setInputAction(function(movement) {
			let height = Math.ceil(viewer.camera.positionCartographic.height);
			document.getElementById("photo_altitude").innerHTML = height;
			if (height > 99999999999) {
				console.log("You've lost!");
			}
	}, Cesium.ScreenSpaceEventType.WHEEL);

	var elevation = document.getElementById("elevation");
	var changed = scene.terrainProvider.hasWaterMask;
	function showElevation(e) {
		if (!e) {
			elevation.style.display = 'block';
			// console.log('显示高程');
			changed = !e;
		}
		else {
			elevation.style.display = 'none';
			// console.log('不显示高程');
			changed = !e;
		}
	}
	showElevation(!changed);
	scene.terrainProviderChanged.addEventListener(function() {
		console.log("terrainProviderChanged!");
		showElevation(changed);
	});


	// Sandcastle.finishedLoading();
}

//汉化帮助按钮
function navigationHelpButtonLang() {
	var viewer = this.viewer;
	if (viewer.navigationHelpButton) {
		viewer.navigationHelpButton.viewModel.tooltip = "操作指南";

		var clickHelper = viewer.navigationHelpButton.container.getElementsByClassName("cesium-click-navigation-help")[0];
		var touchHelper = viewer.navigationHelpButton.container.getElementsByClassName("cesium-touch-navigation-help")[0];

		var button = viewer.navigationHelpButton.container.getElementsByClassName("cesium-navigation-button-right")[0]
		button.innerHTML = button.innerHTML.replace(">Touch", ">手势");
		button = viewer.navigationHelpButton.container.getElementsByClassName("cesium-navigation-button-left")[0]
		button.innerHTML = button.innerHTML.replace(">Mouse", ">鼠标");

		var click_help_pan = clickHelper.getElementsByClassName("cesium-navigation-help-pan")[0];
		click_help_pan.innerHTML = "平移";
		var click_help_pan_details = click_help_pan.parentNode.getElementsByClassName("cesium-navigation-help-details")[0];
		click_help_pan_details.innerHTML = "按下左键 + 拖动";

		var click_help_zoom = clickHelper.getElementsByClassName("cesium-navigation-help-zoom")[0];
		click_help_zoom.innerHTML = "旋转";
		click_help_zoom.parentNode.getElementsByClassName("cesium-navigation-help-details")[0].innerHTML = "按下右键+拖动";
		click_help_zoom.parentNode.getElementsByClassName("cesium-navigation-help-details")[1].innerHTML = "";

		var click_help_rotate = clickHelper.getElementsByClassName("cesium-navigation-help-rotate")[0];
		click_help_rotate.innerHTML = "缩放";
		click_help_rotate.parentNode.getElementsByClassName("cesium-navigation-help-details")[0].innerHTML = "滚动鼠标滚轮";
		click_help_rotate.parentNode.getElementsByClassName("cesium-navigation-help-details")[1].innerHTML = "";

		//触屏操作
		var touch_help_pan = touchHelper.getElementsByClassName("cesium-navigation-help-pan")[0];
		touch_help_pan.innerHTML = "平移";
		touch_help_pan.parentNode.getElementsByClassName("cesium-navigation-help-details")[0].innerHTML = "单指拖动";

		var touch_help_zoom = touchHelper.getElementsByClassName("cesium-navigation-help-zoom")[0];
		touch_help_zoom.innerHTML = "缩放";
		touch_help_zoom.parentNode.getElementsByClassName("cesium-navigation-help-details")[0].innerHTML = "双指捏合";

		var touch_help_tilt = touchHelper.getElementsByClassName("cesium-navigation-help-rotate")[0];
		touch_help_tilt.innerHTML = "俯仰";
		touch_help_tilt.parentNode.getElementsByClassName("cesium-navigation-help-details")[0].innerHTML = "双指同向拖动";

		var touch_help_rotate = touchHelper.getElementsByClassName("cesium-navigation-help-tilt")[0];
		touch_help_rotate.innerHTML = "旋转";
		touch_help_rotate.parentNode.getElementsByClassName("cesium-navigation-help-details")[0].innerHTML = "双指反向拖动";
	}
}

function look(lon, lat, offset) {
	if (!viewer) {
		return;
	}
	var center = Cesium.Cartesian3.fromDegrees(lon, lat);
	var transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);

	// View in east-north-up frame
	var camera = viewer.camera;
	camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z;
	camera.lookAtTransform(transform, new Cesium.Cartesian3(-offset, -offset, offset));
	setTimeout(function () {
		camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
	}, 100)
}
