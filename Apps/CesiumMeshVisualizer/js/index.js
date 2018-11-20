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
var MeshVisualizer = Cesium.MeshVisualizer;
var Mesh = Cesium.Mesh;
var MeshMaterial = Cesium.MeshMaterial;
var FramebufferTexture = Cesium.FramebufferTexture;
var MeshPhongMaterial = Cesium.MeshPhongMaterial;
var GeometryUtils = Cesium.GeometryUtils;
var LOD = Cesium.LOD;
var CSG = Cesium.CSG;
homePosition[2] = 1000;

init();

var center = Cesium.Cartesian3.fromDegrees(homePosition[0], homePosition[1], 20);
var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);

var meshVisualizer = new MeshVisualizer({
	modelMatrix: modelMatrix,
	up: { z: 1 },
	referenceAxisParameter: {
		length: 1000, 
		width: 5, 
		headLength:2,
		headWidth: 1.0
	}
});
viewer.scene.primitives.add(meshVisualizer);
meshVisualizer.showReference = true;//显示坐标轴

// 创建立方体
function createBoxMesh(dmX, dmY, dmZ, scale) {
	var dimensions = new Cesium.Cartesian3(dmX, dmY, dmZ);
	var boxGeometry = Cesium.BoxGeometry.fromDimensions({
		dimensions: dimensions,
		vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL
	});
	var material = new MeshPhongMaterial({
		defaultColor: "rgb(125, 125, 125)"
	});
	var mesh = new Mesh(boxGeometry, material);
	if (scale) {
		mesh.scale.x = scale;
		mesh.scale.y = scale;
		mesh.scale.z = scale;
	}
	return mesh;
}

var groundMesh = createBoxMesh(1000*2, 1000*2 , 10*2, 1);
groundMesh.position.z = -10;
meshVisualizer.add(groundMesh);

Cesium.Cartesian3.prototype.set = function (x, y, z) {
	this.x = x; this.y = y; this.z = z;
}
Cesium.Quaternion.prototype.set = function (x, y, z, w) {
	this.x = x; this.y = y; this.z = z; this.w = w;
}

Ammo().then(function() {
	// 全局变量
	var DISABLE_DEACTIVATION = 4;
	var TRANSFORM_AUX = new Ammo.btTransform();
	var ZERO_QUATERNION = new Cesium.Quaternion(0, 0, 0, 1);

	// 图形变量
	var materialDynamic, materialStatic, materialInteractive;

	// 物理变量
	var collisionConfiguration;
	var dispatcher;
	var broadphase;
	var solver;
	var physicWorld;

	var syncList = [];
	var time = 0;
	var objectTimePeriod = 3;
	var timeNextSpawn = time + objectTimePeriod;
	var maxNumObjects = 30;

	// 键盘事件
	var actions = {};
	var keyActions = {
		'keyW': 'acceleration',
		'keyS': 'braking',
		'keyA': 'left',
		'keyD': 'right'
	};

	// 函数
	function initGraphics() {
		materialDynamic = createMaterial();
		materialStatic = createMaterial();
		materialInteractive = createMaterial();

		window.addEventListener('keydown', keydown);
		window.addEventListener('keyup', keyup);
	}

	function initPhysics() {
		// 物理配置
		collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
		broadphase = new Ammo.btDbvtBroadphase();
		solver = new Ammo.btSequentialImpulseConstraintSolver();
		physicWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
		physicWorld.setGravity(new Ammo.btVector(0, -9.82, 0));
	}

	function updatePhysics(deltaTime) {
		for (let i = 0; i < syncList.length; i++) {
			syncList[i](deltaTime);
		}
		physicWorld.stepSimultaion
	}
})

// // 创建立方体
// function createBoxMesh(dmX, dmY, dmZ, scale) {
// 	var dimensions = new Cesium.Cartesian3(dmX, dmY, dmZ);
// 	var boxGeometry = Cesium.BoxGeometry.fromDimensions({
// 		dimensions: dimensions,
// 		vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL
// 	});
// 	var material = new MeshPhongMaterial({
// 		defaultColor: "rgb(125, 125, 125)"
// 	});
// 	var mesh = new Mesh(boxGeometry, material);
// 	if (scale) {
// 		mesh.scale.x = scale;
// 		mesh.scale.y = scale;
// 		mesh.scale.z = scale;
// 	}
// 	return mesh;
// }

// // 创建球体
// function createSphereMesh(radius, scale) {
// 	var sphere = new Cesium.SphereGeometry({
// 		radius:	radius,
// 		vertexFormat: Cesium.VertexFormat.POSITION_ONLY
// 	});
// 	var material = new MeshPhongMaterial({
// 		defaultColor: "rgb(0, " + 125 * (Math.random() + 0.5) + ", 0)"
// 	});
// 	var mesh = new Mesh(sphere, material);
// 	if (scale) {
// 		mesh.scale.x = scale;
// 		mesh.scale.y = scale;
// 		mesh.scale.z = scale;
// 	}
// 	return mesh;
// }

// var groundMesh = createBoxMesh(500*2, 500*2 , 10*2, 1);
// groundMesh.position.z = -10;
// meshVisualizer.add(groundMesh);

// // var world2localMatrix = new Cesium.Matrix4();
// // var blueBoxLocalPos = new Cesium.Cartesian3();
// // var blueBoxPos = Cesium.Cartesian3.fromDegrees(homePosition[0], homePosition[1], 500);

// var blueBoxPosGet = new Cesium.Cartesian3();
// var blueBoxPosGet2World = new Cesium.Cartesian3();
// var isConstant = false;

// var blueBox = viewer.entities.add({
// 	name: 'Blue Box',
// 	position: new Cesium.CallbackProperty(function(time) {
// 		meshVisualizer.localToWorldCoordinates(blueBoxPosGet, blueBoxPosGet2World);
// 		return blueBoxPosGet2World;
// 	}, isConstant),
// 	box: {
// 		dimensions: new Cesium.Cartesian3(100, 100, 20),
// 		material: Cesium.Color.BLUE
// 	}
// });
// // viewer.zoomTo(blueBox);

// var localCoordinates = meshVisualizer.position;
// var result = new Cesium.Cartesian3();
// var result1 = new Cesium.Cartesian3();

// var scene = viewer.scene;
// var world, body, timeStep = 1/60;

// function initCannon() {
// 	world = new CANNON.World();
// 	world.gravity.set(0, 0, -9.82);
// 	world.broadphase = new CANNON.NaiveBroadphase();

// 	var groundBody = new CANNON.Body({
// 		mass: 0
// 	});
// 	var groundShape = new CANNON.Plane();
// 	groundBody.addShape(groundShape);
// 	world.addBody(groundBody);

// 	shape = new CANNON.Box(new CANNON.Vec3(100, 100, 20));
// 	// mass = 1;
// 	body = new CANNON.Body({
// 		mass: 1
// 	});
// 	body.addShape(shape);
// 	body.position = new CANNON.Vec3(0, 0, 500);
// 	world.addBody(body);
// }

// var fixedTimeStep = 1.0 / 60.0;		// second
// var maxSubSteps = 3;
// var lastTime;

// initCannon();

// viewer.scene.preRender.addEventListener(function(scene, time) {
// 	if (lastTime != undefined) {
// 		var dt = (time - lastTime) / 1000;
// 		world.step(fixedTimeStep, dt, maxSubSteps);
// 	}
// 	blueBox.position.getValue(time, blueBoxPosGet);
// 	blueBoxPosGet.x = body.position.x;
// 	blueBoxPosGet.y = body.position.y;
// 	blueBoxPosGet.z = body.position.z;

// 	lastTime = time;
// });

// // 示例一：Cesium.Geometry + Cesium.MeshMaterial 组合
// var box = Cesium.BoxGeometry.createGeometry(Cesium.BoxGeometry.fromDimensions({
// 	dimensions: new Cesium.Cartesian3(100000, 50000, 50000),
// 	vertexFormat: Cesium.VertexFormat.POSITION_ONLY
// }));
// var material = new MeshMaterial({
// 	defaultColor: "rgba(255, 0, 0, 1.0)",
// 	wireframe: false,
// 	side: MeshMaterial.Sides.DOUBLE
// });
// var boxMesh = new Mesh(box, material);
// meshVisualizer.add(boxMesh);

// // 示例二：Cesium.CSG + Cesium.MeshVisualizer 组合，可以用 Cesium.CSG 做布尔运算并渲染运算结果
// // 首先使用 Cesium 创建球体
// var sphere = new Cesium.SphereGeometry({
// 	radius: 50000.0,
// 	vertexFormat: Cesium.VertexFormat.POSITION_ONLY
// });
// sphere = Cesium.SphereGeometry.createGeometry(sphere);
// var sphereMesh = new Mesh(sphere, material);
// sphereMesh.position = new Cesium.Cartesian3(100000, 0, 0);
// meshVisualizer.add(sphereMesh);
// // 将球体对象 Cesium.SphereGeometry 转成 Cesium.CSG实例
// sphere = CSG.toCSG(sphere);
// // 将盒子对象转成 Cesium.CSG 实例
// box = CSG.toCSG(box);
// // 做布尔运算
// var subResult = sphere.subtract(box);
// // 渲染运算结果
// var subResultMesh = new Mesh(subResult, material);
// subResultMesh.position = new Cesium.Cartesian3(200000, 0, 0);
// meshVisualizer.add(subResultMesh);

// // 示例三：使用帧缓存做纹理，实际应用中如体绘制、风场、流长绘制等等都可以运用此技术
// function createGeometry() {
// 	var p1 = new Cesium.Cartesian3(-50000, 50000, 100);
// 	var p2 = new Cesium.Cartesian3(-50000, -50000, 100);
// 	var p3 = new Cesium.Cartesian3(50000, -50000, 100);
// 	var p4 = new Cesium.Cartesian3(50000, 50000, 100);

// 	var positions = new Float64Array([
// 		p1.x, p1.y, p1.z,
// 		p2.x, p2.y, p2.z,
// 		p3.x, p3.y, p3.z,
// 		p4.x, p4.y, p4.z
// 	]);

// 	var indices = new Uint16Array([
// 		0, 1, 3,
// 		1, 2, 3
// 	]);

// 	var sts = new Float32Array([
// 		1, 1,
// 		1, 0,
// 		0, 0,
// 		0, 1
// 	]);

// 	var geometry = new Cesium.Geometry({
// 		attributes: {
// 			position: new Cesium.GeometryAttribute({
// 				componentDatatype: Cesium.ComponentDatatype.DOUBLE,
// 				componentsPerAttribute: 3,
// 				values: positions
// 			}),
// 			st: new Cesium.GeometryAttribute({
// 				componentDatatype: Cesium.ComponentDatatype.FLOAT,
// 				componentsPerAttribute: 2,
// 				values: sts
// 			})
// 		},
// 		indices: indices,
// 		primitiveType: Cesium.PrimitiveType.TRIANGLES,
// 		boundingSphere: Cesium.BoundingSphere.fromVertices(positions)
// 	});
// 	return geometry;
// }

// var framebufferTex = new FramebufferTexture(boxMesh);
// var geometry = createGeometry();
// var customMesh = new Mesh(geometry, new MeshMaterial({
// 	uniforms: {
// 		u_textureMap: framebufferTex	//Cesium.buildModuleUrl('Widgets/Images/TerrainProviders/STK.png')
// 	},
// 	side: MeshMaterial.Sides.DOUBLE,
// 	vertexShader : "\n\
// 		\n\
// 		varying vec3 v_position;\n\
// 		varying vec2 v_st;\n\
// 		\n\
// 		void main(void) \n\
// 		{\n\
// 		vec4 pos = u_modelViewMatrix * vec4(position,1.0);\n\
// 		v_position = pos.xyz;\n\
// 		v_st=st;\n\
// 		gl_Position = u_projectionMatrix * pos;\n\
// 		}",
// 	fragmentShader : "varying vec2 v_st;\
// 		uniform sampler2D u_textureMap;\
// 		void main()\
// 		{\
// 		gl_FragColor = texture2D(u_textureMap,v_st);\n\
// 		\
// 		}\
// 		"
// }));
// customMesh.position = new Cesium.Cartesian3(100000, 0, 0);
// meshVisualizer.add(customMesh);


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
