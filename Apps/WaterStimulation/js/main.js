viewer = null;

function initCesium() {
  if (viewer) {
    return;
  }

  // 创建一个 viewer 实例
  var viewer = new Cesium.Viewer("cesiumContainer", {
    animation: false,             // 是否显示动画小部件（左下角仪表盘）
    baseLayerPicker: true,        // 是否显示图层选择器
    fullscreenButton: true,       // 是否显示全屏按钮
    geocoder: true,               // 是否显示 geocoder 小部件（右上角查询按钮）
    vrButton: false,              // 是否显示 VR 按钮
    homeButton: true,             // 是否显示 Home 按钮
    infoBox: true,                // 是否显示信息框
    sceneModePicker: true,        // 是否显示 3D/2D 选择器
    selectionIndicator: false,    // 是否显示指示器组件
    timeline: false,              // 是否显示时间轴
    navigationHelpButton: false,  // 是否显示右上角的帮助按钮
    scene3DOnly: false,           // 如果设置为 true，则所有几何图形以 3D 模式绘制以节约GPU资源
    shadows : true,               // 是否显示阴影
    shouldAnimate : true,         // 是否显示动画
    // imageryProvider: new Cesium.BingMapsImageryProvider({
    // url: 'https://dev.virtualearth.net',
    // key: 'Au3ucURiaXsmmeNnBwafUWXupkCAvHe9ipzq6kOGYe5Xlthtf3MGRxiNURDN2FG2',
    // mapStyle: Cesium.BingMapsStyle.AERIAL
    // }),
    // baseLayerPicker: false,
    // // 加载地形系统
    // terrainProvider : Cesium.createWorldTerrain({
    //   // url: 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles', // 默认立体地表
    //   requestWaterMask : true,        // 动态水纹
    //   requestVertexNormals: true      // 光效
    // })
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

  // 隐藏 logo 与版权信息
  viewer._cesiumWidget._creditContainer.style.display = 'none'; 
  // 显示帧率
  scene.debugShowFramesPerSecond = true;  
  // 控制视角不转到地下（确保在地形后面的物体被正确地遮挡，只有最前端的对象可见）
  viewer.scene.globe.depthTestAgainstTerrain = true; 

  // 初始化相机参数
  var initialPosition = new Cesium.Cartesian3.fromDegrees(114.29045969, 30.56173526, 40000);
  var initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(0, -90, 0);
  var homeCameraView = {
      destination: initialPosition,
      orientation: {
          heading: initialOrientation.heading,
          pitch: initialOrientation.pitch,
          roll: initialOrientation.roll
      }
  };
  // 设置初始视野
  viewer.scene.camera.setView(homeCameraView);
  // 重写 homeButton
  viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function(e) {
    e.cancel = true;
    viewer.camera.flyTo({
        destination: initialPosition,
        orientation: {
            heading: initialOrientation.heading,
            pitch: initialOrientation.pitch,
            roll: initialOrientation.roll
        }
    })
  })

  // 实时显示经纬度、坐标值及视角高
  document.getElementById("longitude").innerHTML = '东经';             
  document.getElementById("longitude_show").innerHTML = 114.2906;   // 经度初始值
  document.getElementById("latitude").innerHTML = '北纬';             
  document.getElementById("latitude_show").innerHTML = 30.5617;     // 纬度初始值
  document.getElementById("altitude_show").innerHTML = 0;           // 海拔初始值
  // document.getElementById("x_show").innerHTML = initialPosition.x.toFixed(6)  // X 初始值
  // document.getElementById("y_show").innerHTML = initialPosition.y.toFixed(6)  // Y 初始值
  document.getElementById("photo_altitude").innerHTML = 40000;                 // 视角高初始值
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
      document.getElementById("altitude_show").innerHTML = height.toFixed(2);
    }
    else {
      console.log("地图外的点！");
    }
    // var ray = viewer.camera.getPickRay(movement.position);
    // var 
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  // 滑动鼠标滚轮获得该点摄影机高度
  handler.setInputAction(function(movement) {
      let height = Math.ceil(viewer.camera.positionCartographic.height);
      document.getElementById("photo_altitude").innerHTML = height;
      if (height > 99999999999) {
        alert("You've lost!");
      }
  }, Cesium.ScreenSpaceEventType.WHEEL);

  var elevation = document.getElementById("elevation");
  var changed = scene.terrainProvider.hasWaterMask;
  function showElevation(e) {
    if (!e) {
      elevation.style.display = 'block';
      console.log('显示高程');
      changed = !e;
    }
    else {
      elevation.style.display = 'none';
      console.log('不显示高程');
      changed = !e;
    }
  }
  showElevation(!changed);
  scene.terrainProviderChanged.addEventListener(function() {
    console.log("terrainProviderChanged!");
    showElevation(changed);
  });

  /**小车移动
   * 参考：
   * https://blog.csdn.net/HobHunter/article/details/74940280
   */
  // 小车旋转角度
  var radian = Cesium.Math.toRadians(2.0);  // Math.Radians(degrees) 将角度转换为弧度
  // 小车的速度
  var carSpeed = 5;
  // 速度矢量
  var speedVector = new Cesium.Cartesian3();  // Cesium.Cartesian3(x, y, z)  3D 笛卡尔坐标点
  // 起始位置
  var carPosition = Cesium.Cartesian3.fromDegrees(114.3570, 30.52601643, 0);  //  从以度为单位的经度和纬度值返回Cartesian3位置
  // 设置小车方向
  var hpr = new Cesium.HeadingPitchRoll(-45, 0, 0);
  var fixedFrameTransforms = Cesium.Transforms.localFrameToFixedFrameGenerator('north', 'west'); // 生成一个函数，该函数计算从以提供的原点为中心的参考帧到提供的椭球的固定参考帧的4x4变换矩阵

  // 添加小车模型
  var carPrimitive = Cesium.Model.fromGltf({
    url: '../SampleData/models/CesiumMilkTruck/CesiumMilkTruck-kmc.glb',
    modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(carPosition, hpr, Cesium.Ellipsoid.WGS84, fixedFrameTransforms),
    minimumPixelSize: 128
  });
  scene.primitives.add(carPrimitive);

  // 监听键盘按键
  // 小车状态标志
  var flag = {
    moveUp: false,
    moveDown: false,
    moveLeft: false,
    moveRight: false
  };

  // 根据键盘按键返回标志
  /*
  * keycode 37 = Left Arrow
  * keycode 38 = Up Arrow
  * keycode 39 = Right Arrow
  * keycode 40 = Down Arrow
  * keycode 87 = W
  * keycode 65 = A
  * keycode 83 = S
  * keycode 68 = D
  */
  function setFlagStatus(key, value) {
    switch (key.keyCode) {
      case 37:    // ←
        flag.moveLeft = value;
        break;
      case 38:    // ↑
        flag.moveUp = value;
        break;
      case 39:    // →
        flag.moveRight = value;
        break;
      case 40:    // ↓
        flag.moveDown = value;
        break;
      case 87:    // W
        flag.moveUp = value;
        break;
      case 65:    // A
        flag.moveLeft = value;
        break;
      case 83:    // S
        flag.moveDown = value;
        break;
      case 68:    // D
        flag.moveRight = value;
        break;
      default:
        flag.moveUp = false;
        flag.moveDown = false;
        flag.moveLeft = false;
        flag.moveRight = false;
        break;
    }
  };

  document.addEventListener('keydown', (e)=>{
    setFlagStatus(e, true);
    // console.log(String.fromCharCode(window.event ? e.keyCode : e.which));
  });
  document.addEventListener('keyup', (e)=>{
    setFlagStatus(e, false);
    // console.log(String.fromCharCode(window.event ? e.keyCode : e.which));
  });

  // 移动小车
  function moveCar(isUp) {
    // 计算速度矩阵
    if (isUp) {
      speedVector = Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_X, carSpeed, speedVector)
    }
    else {
      speedVector = Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_X, -carSpeed, speedVector)
    }
    // 根据速度计算出下一个位置的坐标
    carPosition = Cesium.Matrix4.multiplyByPoint(carPrimitive.modelMatrix, speedVector, carPosition);
    // 小车移动
    Cesium.Transforms.headingPitchRollToFixedFrame(carPosition, hpr, Cesium.Ellipsoid.WGS84, fixedFrameTransforms, carPrimitive.modelMatrix);
  }

  // 监听帧
  viewer.clock.onTick.addEventListener((clock)=>{
    if (flag.moveUp) {
      if (flag.moveLeft) {
        hpr.heading -= radian;
      };
      if (flag.moveRight) {
        hpr.heading += radian;
      };
      moveCar(true);
    }
    if (flag.moveDown) {
      if (flag.moveLeft) {
        hpr.heading += radian;
      };
      if (flag.moveRight) {
        hpr.heading -= radian;
      };
      moveCar(false);
    }
  });

  // var riverMaterial = new Cesium.Material({
  //   fabric: {
  //     type: 'Water',
  //     uniforms: {
  //       normalMap: './source/water.jpg',
  //       frequency: 100.0,
  //       animationSpeed: 0.01,
  //       amplitude: 10.0
  //     }
  //   }
  // });
  var Rivers = viewer.dataSources.add(Cesium.KmlDataSource.load('./source/wuhan_river_system.kml',{
    camera: scene.camera, // 相机选项
    canvas: scene.canvas, // 画布选项
    clampToGround: true   // 开启贴地
  }));
  Rivers.then(function(dataSource) {
    let riverEntities = dataSource.entities.values;  // 获取所有对象，一个 Entity 的 Array
    for (let i = 0; i < riverEntities.length; i++) {
      let entity = riverEntities[i];
      if (entity.polygon || entity.polyline) {
        viewer.entities.add(entity);
        entity.polygon.fill = undefined;
        entity.polygon.material = Cesium.Color.BLUE.withAlpha(0.1);
        // entity.polygon.material = new Cesium.ImageMaterialProperty({
        //   image: './source/water.jpg'
        // })
        entity.polygon.outlineColor = Cesium.Color.RED;

        // var riverInstance = new Cesium.GeometryInstance({
        //   geometry: new Cesium.PolygonGeometry({
        //     polygonHierarchy: entity.polygon.hierarchy,
        //     extrudedHeight: 0,
        //     height: 0,
        //     vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
        //   }),
        //   id: 'river instance'
        // });
        // scene.primitives.add(new Cesium.Primitive({
        //   geometryInstances: riverInstance,
        //   appearance: new Cesium.EllipsoidSurfaceAppearance({
        //     aboveGround: true,
        //     material: riverMaterial
        //   })
        // }));
      }
    }
    dataSource.entities.removeAll();
    // viewer.flyTo(dataSource.entities);
  });

  function LoadShaderFile(filename, onLoadShader) {
  // 导入文件
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === 4 && request.status === 200) {
        onLoadShader(request.responseText);
        console.log(request.responseText);
      }
    };
    request.open("GET", filename, true);
    request.send();
  };

  var rain_fs =
    'uniform sampler2D colorTexture;\n\
    varying vec2 v_textureCoordinates;\n\
    float hash(float x){\n\
        return fract(sin(x*133.3)*13.13);\n\
    }\n\
    void main(void){\n\
        float time = czm_frameNumber / 60.0;\n\
        vec2 resolution = czm_viewport.zw;\n\
        vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);\n\
        vec3 c=vec3(.6,.7,.8);\n\
        float a=-.4;\n\
        float si=sin(a),co=cos(a);\n\
        uv*=mat2(co,-si,si,co);\n\
        uv*=length(uv+vec2(0,4.9))*.3+1.;\n\
        float v=1.-sin(hash(floor(uv.x*100.))*2.);\n\
        float b=clamp(abs(sin(20.*time*v+uv.y*(5./(2.+v))))-.95,0.,1.)*20.;\n\
        c*=v*b;\n\
        gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(c,1), 0.5);\n\
    }\n';

  var rainPostProcessStage = new Cesium.PostProcessStage({
    fragmentShader: rain_fs,
    uniforms: {
      scale: 1.1,
      offset: function() {
          return new Cesium.Cartesian3(0.1, 0.2, 0.3);
      }
    }
  })
  scene.postProcessStages.add(rainPostProcessStage);
  rainPostProcessStage.enabled = false

  var snow_fs = 
    'uniform sampler2D colorTexture;\n\
    varying vec2 v_textureCoordinates;\n\
    float snow(vec2 uv,float scale) {\n\
        float time = czm_frameNumber / 60.0;\n\
        float w=smoothstep(1.,0.,-uv.y*(scale/10.));if(w<.1)return 0.;\n\
        uv+=time/scale;uv.y+=time*2./scale;uv.x+=sin(uv.y+time*.5)/scale;\n\
        uv*=scale;vec2 s=floor(uv),f=fract(uv),p;float k=3.,d;\n\
        p=.5+.35*sin(11.*fract(sin((s+p+scale)*mat2(7,3,6,5))*5.))-f;d=length(p);k=min(d,k);\n\
        k=smoothstep(0.,k,sin(f.x+f.y)*0.01);\n\
        return k*w;\n\
    }\n\
    void main(void) {\n\
        vec2 resolution = czm_viewport.zw;\n\
        vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);\n\
        vec3 finalColor=vec3(0);\n\
        //float c=smoothstep(1.,0.3,clamp(uv.y*.3+.8,0.,.75));\n\
        float c = 0.0;\n\
        c+=snow(uv,30.)*.0;\n\
        c+=snow(uv,20.)*.0;\n\
        c+=snow(uv,15.)*.0;\n\
        c+=snow(uv,10.);\n\
        c+=snow(uv,8.);\n\
        c+=snow(uv,6.);\n\
        c+=snow(uv,5.);\n\
        finalColor=(vec3(c));\n\
        gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(finalColor,1), 0.5);\n\
    }\n';

  var snowPostProcessStage = new Cesium.PostProcessStage({
    fragmentShader: snow_fs,
    uniforms: {
      scale: 1.1,
      offset: function() {
        return new Cesium.Cartesian3(0.1, 0.2, 0.3);
      }
    }
  });
  scene.postProcessStages.add(snowPostProcessStage);
  snowPostProcessStage.enabled = false;

  function clearWeather() {
    var length = scene.primitives.length;
    if (length > 1) {
      for (var i = 2; i < length; i++) {
        var p = scene.primitives.get(i);
        scene.primitives.remove(p);
      }
    }
  }

  /**
   * 函数 setParticleSystemPosition()
   * 确定粒子系统发射位置，由当前摄像机的空间位置决定
   */
  function setParticleSystemPosition() {
    let longitude = 180 * scene.camera.positionCartographic.longitude / Cesium.Math.PI;
    let latitude = 180 * scene.camera.positionCartographic.latitude / Cesium.Math.PI;
    let height = 2500;
    let cameraPosition = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
    return cameraPosition;
  }

  function showRainShader() {
    let height = Math.ceil(viewer.camera.positionCartographic.height);
    if (height >= 0 && height < 150000) {
      rainPostProcessStage.enabled = true;
      snowPostProcessStage.enabled = false;

      scene.skyAtmosphere.hueShift = -0.97;       // 色调
      scene.skyAtmosphere.saturationShift = 0.25; // 饱和度
      scene.skyAtmosphere.brightnessShift = -0.4; // 亮度 （默认为 0，-1.0 是完全黑暗）
      scene.fog.density = 0.00025;
      scene.fog.minimumBrightness = 0.01;
    }
    else {
      rainPostProcessStage.enabled = false;
      snowPostProcessStage.enabled = false;

      scene.skyAtmosphere.hueShift = 0.0;
      scene.skyAtmosphere.saturationShift = 0.0;
      scene.skyAtmosphere.brightnessShift = 0.0;
      scene.fog.density = 2.0e-4;
      scene.fog.minimumBrightness = 0.1;
    }
  }

  function showSnowShader() {
    let height = Math.ceil(viewer.camera.positionCartographic.height);
    if (height >= 0 && height < 150000) {
      rainPostProcessStage.enabled = false;
      snowPostProcessStage.enabled = true;

      scene.skyAtmosphere.hueShift = -0.97;
      scene.skyAtmosphere.saturationShift = 0.25;
      scene.skyAtmosphere.brightnessShift = -0.4;
      scene.fog.density = 0.00025;
      scene.fog.minimumBrightness = 0.01;
    }
    else {
      rainPostProcessStage.enabled = false;
      snowPostProcessStage.enabled = false;

      scene.skyAtmosphere.hueShift = 0.0;
      scene.skyAtmosphere.saturationShift = 0.0;
      scene.skyAtmosphere.brightnessShift = 0.0;
      scene.fog.density = 2.0e-4;
      scene.fog.minimumBrightness = 0.1;
    }
  }

  var weatherOptions = [{
    text: '选择天气',
    onselect: function() {
      // 移除所有天气效果

      clearWeather();
      rainPostProcessStage.enabled = false;
      snowPostProcessStage.enabled = false;
      let handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction(function(movement) {
        rainPostProcessStage.enabled = false;
        snowPostProcessStage.enabled = false;
      }, Cesium.ScreenSpaceEventType.WHEEL);

      // 修改大气指数为默认值
      scene.skyAtmosphere.hueShift = 0.0;
      scene.skyAtmosphere.saturationShift = 0.0;
      scene.skyAtmosphere.brightnessShift = 0.0;
      scene.fog.density = 2.0e-4;
      scene.fog.minimumBrightness = 0.1;
    }
  }, {
    text: '🌧 - Particle System',
    onselect: function() {
      clearWeather();
      rainPostProcessStage.enabled = false;
      snowPostProcessStage.enabled = false;
      let handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction(function(movement) {
        rainPostProcessStage.enabled = false;
        snowPostProcessStage.enabled = false;
      }, Cesium.ScreenSpaceEventType.WHEEL)
      
      // rain
      var rainParticleSize = scene.drawingBufferWidth / 80.0;
      var rainRadius = 100000.0;  // 粒子系统范围
      var rainImageSize = new Cesium.Cartesian2(rainParticleSize, rainParticleSize * 2.0);
      var rainSystem;

      var rainGravityScratch = new Cesium.Cartesian3();
      // 粒子移动、排列和可视化的实现
      var rainUpdate = function(particle, dt) {   // particle 为粒子系统f发射出的粒子
        rainGravityScratch = Cesium.Cartesian3.normalize(particle.position, rainGravityScratch);  
        rainGravityScratch = Cesium.Cartesian3.multiplyByScalar(rainGravityScratch, -1050.0, rainGravityScratch);

        particle.position = Cesium.Cartesian3.add(particle.position, rainGravityScratch, particle.position);
        // 随着 distance 的改变，粒子显示效果发生变化
        var distance = Cesium.Cartesian3.distance(scene.camera.position, particle.position);  // 摄像机距离到 particle position 的距离
        if (distance > 2 * rainRadius) {
            particle.endColor.alpha = 0.0;
        } else {
            particle.endColor.alpha = rainSystem.endColor.alpha / ((2 * distance) / rainRadius + 0.1);
        }
      };

      rainSystem = new Cesium.ParticleSystem({
        // modelMatrix: new Cesium.Matrix4.fromTranslation(scene.camera.position), // 4×4 变换矩阵，将粒子系统从模型转换为世界坐标
        modelMatrix: new Cesium.Matrix4.fromTranslation(setParticleSystemPosition()),
        speed : -1.0,                                         // 设置后会覆盖 minimumSpeed 和 maximumSpeed 
        lifetime : 25.0,                                      // 单位秒
        emitter : new Cesium.SphereEmitter(rainRadius),       // 粒子发射器
        startScale : 1.0,                                     // 粒子寿命开始时图像的初始比例
        endScale : 0.0,                                       // 粒子寿命结束时图像的比例
        image : '../SampleData/circular_particle.png',        // 图像的地址
        emissionRate : 10000.0,                               // 每秒发射的粒子数
        startColor :new Cesium.Color(0.27, 0.5, 0.70, 0.0),   // 粒子寿命开始时的颜色（R,G,B,透明度）
        endColor : new Cesium.Color(0.27, 0.5, 0.70, 0.98),   // 粒子寿命结束时的颜色
        imageSize : rainImageSize,                            // 图像尺寸，设置后会覆盖 minimumImageSize 和 maximumImageSize
        updateCallback : rainUpdate                           // 一系列强制回调。回调传递一个粒子和上次的差异
      });
      scene.primitives.add(rainSystem); 
      rainSystem.show = true;   // display the particle system

      scene.skyAtmosphere.hueShift = -0.97;
      scene.skyAtmosphere.saturationShift = 0.25;
      scene.skyAtmosphere.brightnessShift = -0.4;
      scene.fog.density = 0.00025;
      scene.fog.minimumBrightness = 0.01;
    }
  }, {
    text: '🌧 - Shader',
    onselect: function() {
      clearWeather();
      showRainShader();
      let handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction(function(movement) {
        showRainShader();
      }, Cesium.ScreenSpaceEventType.WHEEL);
    }
  }, {
    text: '❄ - Particle System',
    onselect: function() {
      clearWeather();
      rainPostProcessStage.enabled = false;
      snowPostProcessStage.enabled = false;
      let handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction(function(movement) {
        rainPostProcessStage.enabled = false;
        snowPostProcessStage.enabled = false;
      }, Cesium.ScreenSpaceEventType.WHEEL)

      // snow
      var snowParticleSize = scene.drawingBufferWidth / 100.0;
      var snowRadius = 100000.0;
      var minimumSnowImageSize = new Cesium.Cartesian2(snowParticleSize, snowParticleSize);
      var maximumSnowImageSize = new Cesium.Cartesian2(snowParticleSize * 2.0, snowParticleSize * 2.0);
      var snowSystem;

      var snowGravityScratch = new Cesium.Cartesian3();
      var snowUpdate = function(particle, dt) {
          snowGravityScratch = Cesium.Cartesian3.normalize(particle.position, snowGravityScratch);
          Cesium.Cartesian3.multiplyByScalar(snowGravityScratch, Cesium.Math.randomBetween(-30.0, -300.0), snowGravityScratch);
          particle.velocity = Cesium.Cartesian3.add(particle.velocity, snowGravityScratch, particle.velocity);

          var distance = Cesium.Cartesian3.distance(scene.camera.position, particle.position);
          if (distance > snowRadius) {
              particle.endColor.alpha = 0.0;
          } else {
              particle.endColor.alpha = snowSystem.endColor.alpha / (distance / snowRadius + 0.1);
          }
      };

      snowSystem = new Cesium.ParticleSystem({
          modelMatrix : new Cesium.Matrix4.fromTranslation(setParticleSystemPosition()),
          minimumSpeed : -1.0,
          maximumSpeed : 0.0,
          lifetime : 15.0,
          emitter : new Cesium.SphereEmitter(snowRadius),
          startScale : 0.5,
          endScale : 1.0,
          image : '../SampleData/snowflake_particle.png',
          emissionRate : 7000.0,
          startColor : Cesium.Color.WHITE.withAlpha(0.0),
          endColor : Cesium.Color.WHITE.withAlpha(1.0),
          minimumImageSize : minimumSnowImageSize,
          maximumImageSize : maximumSnowImageSize,
          updateCallback : snowUpdate
      });
      scene.primitives.add(snowSystem);
      snowSystem.show = true;

      scene.skyAtmosphere.hueShift = -0.97;
      scene.skyAtmosphere.saturationShift = 0.25;
      scene.skyAtmosphere.brightnessShift = -0.4;
      scene.fog.density = 0.00025;
      scene.fog.minimumBrightness = 0.01;
    }
  }, {
    text: '❄ - Shader',
    onselect: function() {
      clearWeather();
      showSnowShader();
      let handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction(function(movement) {
        showSnowShader();
      }, Cesium.ScreenSpaceEventType.WHEEL);
    }
  }]
  Sandcastle.addToolbarMenu(weatherOptions);

  Sandcastle.addToggleButton('使用太阳光源', scene.globe.enableLighting = false, function(checked) {
    scene.globe.enableLighting = checked;
  });
  Sandcastle.finishedLoading();
}

initCesium();