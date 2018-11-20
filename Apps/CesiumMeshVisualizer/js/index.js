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
homePosition[2] = 100;

init();

var center = Cesium.Cartesian3.fromDegrees(homePosition[0], homePosition[1], 20);
var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);

var meshVisualizer = new MeshVisualizer({
	modelMatrix: modelMatrix,
	up: { y: 1 },
	referenceAxisParameter: {
		length: 500, 
		width: 0.1, 
		headLength:2,
		headWidth: 1.0
	}
});
viewer.scene.primitives.add(meshVisualizer);
meshVisualizer.showReference = true;//显示坐标轴

// // 创建 groundMesh
// var groundGeometry = Cesium.BoxGeometry.createGeometry(Cesium.BoxGeometry.fromDimensions({
// 	dimensions: new Cesium.Cartesian3(2000, 0.1, 2000),
// 	vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL
// }));
// var groundMaterial = new MeshMaterial({
// 	defaultColor: 'rgb(125, 125, 125)',
// 	wireframe: false,
// 	side: MeshMaterial.Sides.DOUBLE
// });
// var groundMesh = new Mesh(groundGeometry, groundMaterial);
// groundMesh.position.z = -10;
// meshVisualizer.add(groundMesh);

function createRandomColor() {
	return Cesium.Color.fromRandom({
		alpha: 1
	});
	// fromRgba(Math.floor(Math.random() * (1 << 24)));
}

function createMaterial() {
	return new MeshPhongMaterial({
		defaultColor: createRandomColor(),
		side: MeshMaterial.Sides.DOUBLE,
		translucent: false
	});
}

Cesium.Cartesian3.prototype.set = function (x, y, z) {
	this.x = x; this.y = y; this.z = z;
}
Cesium.Quaternion.prototype.set = function (x, y, z, w) {
	this.x = x; this.y = y; this.z = z; this.w = w;
}

// 基于 ammo.js 引擎（Bullet Physics Engine on JavaScript）
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
		'KeyW': 'acceleration',			// W
		'KeyA': 'left',							// A
		'KeyS': 'braking',					// S
		'KeyD': 'right',						// D
		'ArrowUp': 'acceleration',	// ↑
		'ArrowDown': 'braking',			// ↓
		'ArrowLeft': 'left',				// ←
		'ArrowRight': 'right'				// →
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
		physicWorld.setGravity(new Ammo.btVector3(0, -9.82, 0));
	}

	function updatePhysics(deltaTime) {
		for (let i = 0; i < syncList.length; i++) {
			syncList[i](deltaTime);
		}
		physicWorld.stepSimulation(deltaTime, 10);
		time += deltaTime;
	}

	function keyup(e) {
		if (keyActions[e.code]) {
			actions[keyActions[e.code]] = false;
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
	}

	function keydown(e) {
		if (keyActions[e.code]) {
			actions[keyActions[e.code]] = true;
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
	}

	// 函数：创建立方体盒子
	function createBox(pos, quat, w, l, h, mass, friction) {
		var material = createMaterial();	//= mass > 0 ? materialDynamic : materialStatic;
		var shape = Cesium.BoxGeometry.fromDimensions({
			dimensions: new Cesium.Cartesian3(w, l, h),
			vertexFormat: new Cesium.VertexFormat({
					position: true,
					normal: true
			})
		});

		var geometry = new Ammo.btBoxShape(new Ammo.btVector3(w * 0.5, l * 0.5, h * 0.5));

		if (!mass) mass = 0;
		if (!friction) friction = 1;

		var mesh = new Mesh(shape, material);
		Cesium.Cartesian3.clone(pos, mesh.position);
		mesh.quaternion = new Cesium.Quaternion(quat.x, quat.y, quat.z, quat.w);
		meshVisualizer.add(mesh);

		var transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
		var motionState = new Ammo.btDefaultMotionState(transform);

		var localInertia = new Ammo.btVector3(0, 0, 0);
		geometry.calculateLocalInertia(mass, localInertia);

		var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, geometry, localInertia);
		var body = new Ammo.btRigidBody(rbInfo);

		body.setFriction(friction);
		//body.setRestitution(.9);
		//body.setDamping(0.2, 0.2);

		physicWorld.addRigidBody(body);

		if (mass > 0) {
			body.setActivationState(DISABLE_DEACTIVATION);
			// Sync physics and graphics
			function sync(dt) {
				var ms = body.getMotionState();
				if (ms) {
						ms.getWorldTransform(TRANSFORM_AUX);
						var p = TRANSFORM_AUX.getOrigin();
						var q = TRANSFORM_AUX.getRotation();
						mesh.position.set(p.x(), p.y(), p.z());
						mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
						mesh.modelMatrixNeedsUpdate = true;
				}
			}

			syncList.push(sync);
		}
	}
	// 函数：创建球体
	function createSphere(pos, radius, mass, friction) {
		var sphere = new Mesh(new Cesium.SphereGeometry({
			radius: radius,
			stackPartitions: 20,
			slicePartitions: 20,
			vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL
		}), createMaterial());

		var shape = new Ammo.btSphereShape(radius);
		shape.setMargin(0.05);

		if (!mass) mass = 0;
		if (!friction) friction = 1;
	
		sphere.position = pos;
		var localInertia = new Ammo.btVector3(0, 0, 0);
		shape.calculateLocalInertia(mass, localInertia);
		
		var transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		var motionState = new Ammo.btDefaultMotionState(transform);
		
		var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
		var body = new Ammo.btRigidBody(rbInfo);
		body.setFriction(friction);

		meshVisualizer.add(sphere);
		physicWorld.addRigidBody(body);
	
		if (mass > 0) {
			body.setActivationState(DISABLE_DEACTIVATION);
			// Sync physics and graphics
			function sync(dt) {
				var ms = body.getMotionState();
				if (ms) {
						ms.getWorldTransform(TRANSFORM_AUX);
						var p = TRANSFORM_AUX.getOrigin();
						sphere.position.set(p.x(), p.y(), p.z());
						sphere.modelMatrixNeedsUpdate = true;
				}
			}
	
			syncList.push(sync);
		}
	}

	// 创建小车车轮
	function createWheelMesh(radius, width) {
		var t = new Cesium.CylinderGeometry({		// 创建圆柱体
			length: width,
			topRadius: radius,
			bottomRadius: radius,
			slices: 24
		});
		// var t = new THREE.CylinderGeometry(radius, radius, width, 24, 1);

		var mesh = new Mesh(t, materialInteractive);
		GeometryUtils.rotateY(mesh.geometry, Math.PI / 2);
		mesh.quaternion = new Cesium.Quaternion();	
		// Cesium.Quaternion.fromAxisAngle(new Cesium.Cartesian3(0, 0, 1), Math.PI / 2);

		var shape = Cesium.BoxGeometry.fromDimensions({
			dimensions: new Cesium.Cartesian3(width * 1.5, radius * 1.75, radius * 0.25),
			vertexFormat: new Cesium.VertexFormat({
				position: true,
				normal: true
			})
		});
		var meshShape = new Mesh(shape, materialInteractive);

		meshShape.quaternion = new Cesium.Quaternion();
		// Cesium.Quaternion.fromAxisAngle(new Cesium.Cartesian3(0, 0, 1), 0);
		mesh.add(meshShape);
		meshVisualizer.add(mesh);
		return mesh;
	}

	// 创建小车底座
	function createChassisMesh(width, length, height) {
		var shape = Cesium.BoxGeometry.fromDimensions({	// 创建立方体
			dimensions: new Cesium.Cartesian3(width, length, height),
			vertexFormat: new Cesium.VertexFormat({
				position: true, 
				normal: true
			})
		});

		var mesh = new Mesh(shape, materialInteractive);
		mesh.quaternion = new Cesium.Quaternion(0, 0, 0, 1);
		meshVisualizer.add(mesh);
		return mesh;
	}

	// 创建小车
	function createVehicle(pos, quat) {
		// 小车参数
		var chassisWidth = 1.8;						// 车架宽度
		var chassisHeight = 0.6;					// 车架高度
		var chassisLength = 4;						// 车架长度
		var massVehicle = 1200;						// 汽车质量

		var wheelAxisPositionBack = -1.3;	// 后轮位置 
		var wheelAxisHeightBack = 0.3;		// 后轮轴高度
		var wheelHalfTrackBack = 1;				// 后两轮间距
		var wheelRadiusBack = 0.4;				// 后轮半径
		var wheelWidthBack = 0.5;					// 后轮宽度

		var wheelAxisPositionFront = 1.4;	// 前轮位置
		var wheelAxisHeightFront = 0.3;		// 前轮轴高度
		var wheelHalfTrackFront = 1;			// 前两轮间距
		var wheelRadiusFront = 0.4;			  // 前轮半径
		var wheelWidthFront = 0.4;				// 后轮宽度

		var friction = 1000;							// 摩擦力
		var suspensionStiffness = 20.0;		// 悬架刚度
		var suspensionDamping = 2.3;			// 悬架阻尼
		var suspensionCompression = 4.4;	// 
		var suspensionRestLength = 0.6;		// 悬架长度（静止长度）
		var rollInfluence = 0.2;

		var steeringIncrement = 0.04;			// 转向增量
		var steeringClamp = 0.5;					// 转向角度
		var maxEngineForce = 2000;				// 最大牵引力
		var maxBreakingForce = 100;				// 最大制动力

		// 车辆底盘
		var geometry = new Ammo.btBoxShape(new Ammo.btVector3(chassisWidth * 0.5, chassisHeight * 0.5, chassisLength * 0.5));
		var transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
		var motionState = new Ammo.btDefaultMotionState(transform);
		var localInertia = new Ammo.btVector3(0, 0, 0);
		geometry.calculateLocalInertia(massVehicle, localInertia);
		var body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massVehicle, motionState, geometry, localInertia));
		body.setActivationState(DISABLE_DEACTIVATION);
		physicWorld.addRigidBody(body);
		var chassisMesh = createChassisMesh(chassisWidth, chassisHeight, chassisLength);

		// 
		var engineForce = 0;
		var vehicleSteering = 0;
		var breakingForce = 0;
		var tuning = new Ammo.btVehicleTuning();
		var rayCaster = new Ammo.btDefaultVehicleRaycaster(physicWorld);
		var vehicle = new Ammo.btRaycastVehicle(tuning, body, rayCaster);
		vehicle.setCoordinateSystem(0, 1, 2);
		physicWorld.addAction(vehicle);

		// 车轮
		var FRONT_LEFT = 0;			//		┌┬┐ ←前
		var FRONT_RIGHT = 1;		//		0┼1
		var BACK_LEFT = 2;			// 		2┼3
		var BACK_RIGHT = 3;			//		└┴┘ ←后
		var wheelMeshes = [];
		var wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
		var wheelAxleCS = new Ammo.btVector3(-1, 0, 0);

		function addWheel(isFront, pos, radius, width, index) {
			var wheelInfo = vehicle.addWheel(
				pos,
				wheelDirectionCS0,
				wheelAxleCS,
				suspensionRestLength,
				radius,
				tuning,
				isFront
			);
			wheelInfo.set_m_suspensionStiffness(suspensionStiffness);
			wheelInfo.set_m_wheelsDampingRelaxation(suspensionDamping);
			wheelInfo.set_m_wheelsDampingCompression(suspensionCompression);
			wheelInfo.set_m_frictionSlip(friction);
			wheelInfo.set_m_rollInfluence(rollInfluence);

			wheelMeshes[index] = createWheelMesh(radius, width);
		}

		addWheel(true, new Ammo.btVector3(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisPositionFront), wheelRadiusFront, wheelWidthFront, FRONT_LEFT);
		addWheel(true, new Ammo.btVector3(-wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisPositionFront), wheelRadiusFront, wheelWidthFront, FRONT_RIGHT);
		addWheel(false, new Ammo.btVector3(-wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_LEFT);
		addWheel(false, new Ammo.btVector3(wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_RIGHT);

		// 同步键盘事件+图像+物理
		function sync(dt) {
			var speed = vehicle.getCurrentSpeedKmHour();
			console.log((speed < 0 ? '(R) ' : '') + Math.abs(speed).toFixed(1) + 'km/h');

			breakingForce = 0;
			engineForce = 0;

			if (actions.acceleration) {			// W 或 ↑：前进
				if (speed < -1)
					breakingForce = maxBreakingForce;
				else
					engineForce = maxEngineForce;
			}
			if (actions.braking) {					// S 或 ↓：后退
				if (speed > 1)
					breakingForce = maxBreakingForce;
				else
					engineForce = -maxEngineForce;
			}
			if (actions.left) {							// A 或 ←：左转
				if (vehicleSteering < steeringClamp)
					vehicleSteering += steeringClamp;
			}
			else {
				if (actions.right) {					// D 或 →：右转
					if (vehicleSteering > -steeringClamp) 
						vehicleSteering -= steeringClamp;
				}
				else {
					if (vehicleSteering < -steeringClamp)
						vehicleSteering += steeringClamp;
					else {
						if (vehicleSteering > steeringClamp)
							vehicleSteering -= steeringClamp;
						else 
							vehicleSteering = 0;
					}
				}
			}
		
			vehicle.applyEngineForce(engineForce, BACK_LEFT);
			vehicle.applyEngineForce(engineForce, BACK_RIGHT);

			vehicle.setBrake(breakingForce / 2, FRONT_LEFT);
			vehicle.setBrake(breakingForce / 2, FRONT_RIGHT);
			vehicle.setBrake(breakingForce, BACK_LEFT);
			vehicle.setBrake(breakingForce, BACK_RIGHT);

			vehicle.setSteeringValue(vehicleSteering, FRONT_LEFT);
			vehicle.setSteeringValue(vehicleSteering, FRONT_RIGHT);

			var tm, p, q, i;
			var n = vehicle.getNumWheels();
			for (i = 0; i < n; i++) {
				vehicle.updateWheelTransform(i, true);
				tm = vehicle.getWheelTransformWS(i);
				p = tm.getOrigin();
				q = tm.getRotation();
				wheelMeshes[i].position.set(p.x(), p.y(), p.z());
				wheelMeshes[i].quaternion.set(q.x(), q.y(), q.z(), q.w());

				wheelMeshes[i].modelMatrixNeedsUpdate = true;
			}

			tm = vehicle.getChassisWorldTransform();
			p = tm.getOrigin();
			q = tm.getRotation();
			chassisMesh.position.set(p.x(), p.y(), p.z());
			chassisMesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
			chassisMesh.modelMatrixNeedsUpdate = true;
		}
		syncList.push(sync);
	}

	// 创建场景中的实体（方块 + 小车）
	function createObjects() {
		createBox(new Cesium.Cartesian3(0, -0.5, 0), ZERO_QUATERNION, 200, 1, 200, 0, 0.2);	// 平台
		createBox(new Cesium.Cartesian3(100, 0, 0), ZERO_QUATERNION, 1, 10, 200, 0, 0.2);		// 墙
		createBox(new Cesium.Cartesian3(-100, 0, 0), ZERO_QUATERNION, 1, 10, 200, 0, 0.2);	// 墙
		createBox(new Cesium.Cartesian3(0, 0, 100), ZERO_QUATERNION, 200, 10, 1, 0, 0.2);		// 墙
		createBox(new Cesium.Cartesian3(0, 0, -100), ZERO_QUATERNION, 200, 10, 1, 0, 0.2);	// 墙
		var quaternion = new Cesium.Quaternion(0, 0, 0, 1);
		Cesium.Quaternion.fromAxisAngle(new Cesium.Cartesian3(1, 0, 0), -Math.PI / 18, quaternion);
		createBox(new Cesium.Cartesian3(0, -1.5, 0), quaternion, 8, 4, 10, 0);							// 斜台

		var size = 0.75;
		var nw = 8;		// 一行八个
		var nh = 6;		// 一共六行
		for (let j = 0; j < nw; j++) {
			for (let i = 0; i < nh; i++) {
				createBox(new Cesium.Cartesian3(size * j - (size * (nw - 1)) / 2, size * i, 10), ZERO_QUATERNION, size, size, size, 10);
			}
		}
		createVehicle(new Cesium.Cartesian3(0, 4, -20), ZERO_QUATERNION);
		createSphere(new Cesium.Cartesian3(0, 1.5, 20), 2, 10, 0.1);
	}

	var start = false;
	var init = false; 
	var startTime = new Date();
	function update(frameState) {
		var deltaTime = (new Date() - startTime) / 1000.0;
		updatePhysics(deltaTime);
		startTime = new Date();
	}
	setTimeout(function() {
		if (!init) {
			initGraphics();
			initPhysics();
			createObjects();
			init = true;
		}
		if (!start) {
			meshVisualizer.beforeUpdate.addEventListener(update);
			start = true;
		}
		else {
			meshVisualizer.beforeUpdate.removeEventListener(update);
			start = false;
		}
	}, 1000 * 3);

});

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
///////////////////////////////////////////////////////////////////////////////////////////
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
