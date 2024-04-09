window.addEventListener("resize", function() {
  engine.resize();
});

let engine;
let scene;
let total = {};
const sphereDiameter = 10;
const boxWidth = 40;
const boxDepth = 10;
const firstDepthDiameter = 140;
let lastAngle = 0;
let preAngle = 0;
let secondServersTotal = 0;
let currentData = null;
let firstServers = null;
let angleList = [];
let criticalInstances = [];

let dataSetIndex = 1;
const dataSet = 6;
let IntervalFunc = null;
let eventTrigger = false;
const barRootNodes = [];

const createEnv = async () => {
  scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3.FromHexString("#070E26");
  // scene.debugLayer.show({ embedMode: true });

  const camera = new BABYLON.ArcRotateCamera("Camera", -2.5266446308420054, 1, 86.62862421718337, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(true);
  camera.useAutoRotationBehavior = true;
  camera.radius = 400; 
  camera.lowerBetaLimit = -Math.PI / 39;
  camera.upperBetaLimit = Math.PI / 2.2;
  camera.upperRadiusLimit = 1200;
  camera.lowerRadiusLimit = 80;

  const light1 = new BABYLON.HemisphericLight("hemiLight1", new BABYLON.Vector3(1, 5, 0), scene);
  light1.intensity = 4;
  const light2 = new BABYLON.HemisphericLight("hemiLight2", new BABYLON.Vector3(0, 1, 0), scene);
  
  const greenMat = new BABYLON.StandardMaterial("green", scene);
  greenMat.alpha = 0.5;
  greenMat.specularColor = new BABYLON.Color3(0,0,0);
  greenMat.emissiveColor = new BABYLON.Color3(0,0,0);
  greenMat.diffuseColor  = new BABYLON.Color3(0.0, 1.0, 1.0);
  const orangeMat = new BABYLON.StandardMaterial("orange", scene);
  orangeMat.specularColor = new BABYLON.Color3(0,0,0);
  // orangeMat.emissiveColor  = new BABYLON.Color3(1,0.5,0);
  orangeMat.emissiveColor  = new BABYLON.Color3(0,0,0);
  orangeMat.diffuseColor  = new BABYLON.Color3(1,0.5,0);
  const redMat = new BABYLON.StandardMaterial("red", scene);
  redMat.specularColor = new BABYLON.Color3(0,0,0);
  redMat.diffuseColor  = new BABYLON.Color3.Red();
  redMat.emissiveColor  = new BABYLON.Color3(0,0,0);
  // redMat.emissiveColor  = new BABYLON.Color3.Red();
  const blackMat = new BABYLON.StandardMaterial("black", scene);
  blackMat.specularColor = new BABYLON.Color3(0,0,0);
  blackMat.diffuseColor  = BABYLON.Color3.Black();
  blackMat.emissiveColor = new BABYLON.Color3(0,0,0);


  const gridGround = BABYLON.MeshBuilder.CreateBox("gridGround", { width: 7000, height: .1, depth:7000 }, scene);
  gridGround.position.y = -20;
  const gridMat = await BABYLON.NodeMaterial.ParseFromSnippetAsync("RHFLCX#13", scene);
  const scaleFactor = gridMat.getBlockByName("ScaleFactor");
  const gridFactor = gridMat.getBlockByName("Grid ratio");
  gridFactor.value = 1;
  scaleFactor.value = 0.1;
  gridGround.material = gridMat;
  gridGround.material.emissiveColor = new BABYLON.Color3(0,0,0);
  gridGround.material.specularColor = new BABYLON.Color3(0,0,0);

  const plane = BABYLON.MeshBuilder.CreatePlane('plane', { size: 1000 }, scene);
  plane.rotation.x = Math.PI / 2;
  plane.position = new BABYLON.Vector3(0, -10, 0);
  const material = new BABYLON.StandardMaterial('material', scene);
  const texture = new BABYLON.Texture('./img/gr.png', scene);
  texture.hasAlpha = true;
  material.diffuseTexture = texture;
  material.specularColor = new BABYLON.Color3(0,0,0);
  material.useAlphaFromDiffuseTexture = true;
  plane.material = material;

  // 애니메이션을 생성합니다.
  const animation = new BABYLON.Animation(
    "planeRotationAnimation", 
    "rotation.y", 
    60, // FPS
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );
  const keyFrames = []; 
  keyFrames.push({
    frame: 0,
    value: 0
  });
  keyFrames.push({
    frame: 3600, 
    value: 2 * Math.PI
  });
  animation.setKeys(keyFrames);
  plane.animations = [];
  plane.animations.push(animation);
  scene.beginAnimation(plane, 0, 3600, true);


  const row2 = document.getElementById("row2");
  const row3 = document.getElementById("row3");

  row2.cells[0].innerText = currentData.status[0];
  row2.cells[1].innerText = currentData.status[2];
  row2.cells[2].innerText = currentData.status[4];

  row3.cells[0].innerText = currentData.status[1];
  row3.cells[1].innerText = currentData.status[3];
  row3.cells[2].innerText = currentData.status[5];


  if (firstServers.length > 0) {
    for (let i=0; i<firstServers.length; i++) {
      secondServersTotal += firstServers[i].servers.length;
    }
  
    firstServers = sortData(firstServers);
  
    for (let i=0; i < firstServers.length; i++) {
      const angle = createFirstDepth(firstServers[i].id, firstServers[i].name, i, firstServers[i].servers.length);
      angleList.push(angle);
      for (let j=0; j<firstServers[i].servers.length; j++) {
        const [parentBox] = await createSecondDepth(firstServers[i].id, firstServers[i].name, firstServers[i].servers[j].id, firstServers[i].servers[j].name, j, firstServers[i].servers.length, firstServers[i].servers[j].status);
        const root = new BABYLON.TransformNode("root");
        for (let k=0; k<firstServers[i].servers[j].groups.length; k++) {
          if (k<20) {
            const thirdBox = createThirdDepth(firstServers[i].servers[j].id, firstServers[i].servers[j].name, firstServers[i].servers[j].groups[k], k, parentBox);
            thirdBox.setParent(root);
            thirdBox.id = firstServers[i].servers[j].groups[k][0];
            thirdBox.name = firstServers[i].servers[j].groups[k][0];
            thirdBox.parentData = firstServers[i].servers[j];
            barRootNodes.push(thirdBox);
          }
        }
        root.position.addInPlace(parentBox.position);
        root.rotation = new BABYLON.Vector3(BABYLON.Tools.ToRadians(360), parentBox.rotation.y, parentBox.rotation.z);
        root.setParent(parentBox);
      }
    }
  }
  drawFirstDepth(angleList);


  // const points = [[
  //     0, -1, 0,
  //     0, 0, 0,
  //     0, 1, 0
  // ], [
  //     -8, 0, 0,
  //     6, 0.5, 0
  // ],
  // [
  //     -4, -1, 0,
  //     4, 1, 0
  // ],
  // ]
  // const widths = [
  //     0, 0,
  //     100, 100,
  //     0, 0,
  // ]
  // const heights = [
  //   0, 0,
  //   100, 100,
  //   0, 0,
  // ]
  // const mesh = BABYLON.CreateGreasedLine("star", {
  //     points,
  //     widths,
  //     heights,
  // }, {
  // })

  // const godrays = new BABYLON.VolumetricLightScatteringPostProcess('godrays', 1.0, camera, mesh, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false);
  // godrays._volumetricLightScatteringRTT.renderParticles = true;
  // godrays.exposure = 0.1;
  // godrays.decay = 0.96815;
  // godrays.weight = 0.98767;
  // godrays.density = 0.996;
  // mesh.isVisible = false;

  engine.runRenderLoop(() => {
    scene.render();
  });

  return scene
};

const createFirstDepth = (id, name, index, secondServersLength) => {
  const parentSphere = BABYLON.MeshBuilder.CreateSphere(name, {diameter : sphereDiameter}, scene);
  parentSphere.id = id;
  
  const angle = lastAngle + (BABYLON.Tools.ToRadians(360) / secondServersTotal * secondServersLength);
  const centerAngle = angle - (BABYLON.Tools.ToRadians(360) / secondServersTotal * secondServersLength) / 2;

  parentSphere.position = new BABYLON.Vector3(firstDepthDiameter * Math.sin(centerAngle), 0, firstDepthDiameter * Math.cos(centerAngle));
  parentSphere.isVisible = false;
  total[name] = [];

  if (BABYLON.Tools.ToDegrees(BABYLON.Tools.ToRadians(360) / secondServersTotal * secondServersLength) > 50) {
    preAngle = 0
    preAngle += BABYLON.Tools.ToDegrees(lastAngle);
    const subSphereNum = Math.floor(BABYLON.Tools.ToDegrees(BABYLON.Tools.ToRadians(360) / secondServersTotal * secondServersLength)/25);
    const intervalAngle = BABYLON.Tools.ToDegrees(BABYLON.Tools.ToRadians(360) / secondServersTotal * secondServersLength) / subSphereNum; 

    for (let i=0; i<subSphereNum; i++) {
      const childSphere = BABYLON.MeshBuilder.CreateSphere(name+i, {diameter : sphereDiameter / 3}, scene);
      childSphere.position = new BABYLON.Vector3(firstDepthDiameter * Math.sin(BABYLON.Tools.ToRadians(preAngle + intervalAngle - 15)), 0, firstDepthDiameter * Math.cos(BABYLON.Tools.ToRadians(preAngle + intervalAngle- 15)));
      childSphere.setParent(parentSphere);
      childSphere.isVisible = false;

      total[name].push(childSphere);
      
      preAngle += intervalAngle;
    }
  } else {
    preAngle += lastAngle
  }

  lastAngle = angle;

  return [BABYLON.Tools.ToDegrees(BABYLON.Tools.ToRadians(360) / secondServersTotal * secondServersLength), name];
};

const createSecondDepth = async (parentId, parentName, id, name, index, serverCount, status) => {
  const parent = scene.getMeshById(parentId);

  const box = BABYLON.MeshBuilder.CreateBox(name, { width: boxWidth , height: boxWidth , depth:boxDepth}, scene);
  box.id = id;
  
  const namePlane = BABYLON.MeshBuilder.CreatePlane(`${name}_plane`, { width: boxWidth , height: boxWidth/4, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
  
  if (total[parentName].length == 0) {
    box.position = new BABYLON.Vector3((parent.position.x * index * 0.4) + parent.position.x * 1.5 , 0, (index * parent.position.z * 0.4) + parent.position.z * 1.5);
    box.rotation.y = parent.rotation.y;
  } else {
    const secondBlockDepth = Math.floor(index / total[parentName].length) * 0.4;
    box.position = new BABYLON.Vector3((total[parentName][index % total[parentName].length].absolutePosition.x * (1.5 + secondBlockDepth)), 0, (total[parentName][index % total[parentName].length].absolutePosition.z * (1.5 + secondBlockDepth)));
    box.rotation.y = total[parentName][index % total[parentName].length].rotation.y;
  }

  const lookAt = BABYLON.Matrix.LookAtLH(
    box.position,
    new BABYLON.Vector3(0,0,0),
    BABYLON.Vector3.Up()
  ).invert();
  
  box.rotationQuaternion = BABYLON.Quaternion.FromRotationMatrix( lookAt );
  const euler = box.rotationQuaternion.toEulerAngles();
  box.rotation= new BABYLON.Vector3(BABYLON.Tools.ToRadians(90), euler.y, euler.z);
  box.enableEdgesRendering();
  box.edgesWidth= 20;
 
  const boxMat = new BABYLON.StandardMaterial(`DynamicMat_${id}`, scene);
  boxMat.emissiveColor = new BABYLON.Color3(0,0,0);
  boxMat.alpha = 0.1;

  if (status == 'n') {
    boxMat.diffuseColor = BABYLON.Color3.FromHexString("#00aaff");
    box.edgesColor = new BABYLON.Color4(0,1,1,30);
  } else if (status == 'w') {
    boxMat.diffuseColor = BABYLON.Color3.FromHexString("#ff9900");
    box.edgesColor = new BABYLON.Color4(1,1,0,30);
  } else if (status == 'c') {
    boxMat.diffuseColor = BABYLON.Color3.FromHexString("#cc0000");
    box.edgesColor = new BABYLON.Color4(1,0,0,30);
  }

  box.material = boxMat;

  const nameTexture = new BABYLON.DynamicTexture(`DynamicTexture`, { width: 128, height: 64 }, scene);
  const nameMat = new BABYLON.StandardMaterial(`DynamicMat_${id}_${name}`, scene);
  // nameMat.alpha = .5;
  // nameMat.emissiveColor = new BABYLON.Color3(0,0,0);
  nameMat.specularColor = new BABYLON.Color3(0,0,0);
  nameMat.emissiveColor = new BABYLON.Color3(0,0,0);
  nameMat.diffuseTexture = nameTexture;
  nameMat.diffuseTexture.hasAlpha = true;
  nameTexture.drawText(name, null, null, "22px double Arial", "white", "transparent", false);
  namePlane.material = nameMat;  

  const vector = box.getBoundingInfo().boundingBox.vectorsWorld
  namePlane.setParent(box);
  namePlane.position = new BABYLON.Vector3((vector[0].x + vector[3].x + 0.1)/2, 0, (vector[0].z + vector[3].z+ 0.1)/2 +5);
  namePlane.rotation = new BABYLON.Vector3(box.rotation.x+ BABYLON.Tools.ToRadians(90),BABYLON.Tools.ToRadians(90), box.rotation.z+ BABYLON.Tools.ToRadians(90));
  return [box]
};

const createThirdDepth = (parentId, parentName, data, k) => {
  const root = new BABYLON.TransformNode(data[1]);
  root.info = data;
  let greenBox = null;
  let orangeBox = null;
  let redBox = null;
  const size = 4;

  if(data[5] != 0) {
    greenBox = BABYLON.MeshBuilder.CreateBox(`${data[0]}_g`, { size: size }, scene);
    greenBox.material = scene.getMaterialByName('green');
    greenBox.position.y = boxDepth/2 + data[5] * size/2;
    greenBox.scaling.y = data[5];
    greenBox.ani = true;
    greenBox.setParent(root);
  } else {
    greenBox = BABYLON.MeshBuilder.CreateBox(`${data[0]}_g`, { size: size }, scene);
    greenBox.material = scene.getMaterialByName('black');
    greenBox.position.y = boxDepth/2 + size/2;
    greenBox.scaling.y = 1;
    greenBox.ani = true;
    greenBox.setParent(root);
  }

  if (data[6] != 0) {
    orangeBox = BABYLON.MeshBuilder.CreateBox(`${data[0]}_o`, { size: size }, scene);
    orangeBox.material = scene.getMaterialByName('orange');
    orangeBox.position.y = greenBox.position.y + data[5]*size/2 + data[6]*size/2/4;
    orangeBox.scaling.y = data[6]/4;
    orangeBox.ani = true;
    orangeBox.setParent(root);
  } else {
    orangeBox = BABYLON.MeshBuilder.CreateBox(`${data[0]}_o`, { size:4 }, scene);
    orangeBox.material = scene.getMaterialByName('black');
    orangeBox.isVisible = false;
    orangeBox.ani = true;
    orangeBox.setParent(root);
  }
  if (data[7] != 0) {
    redBox = BABYLON.MeshBuilder.CreateBox(`${data[0]}_r`, { size:4 }, scene);
    redBox.material = scene.getMaterialByName('red');
    if (orangeBox.isVisible == false) {
      redBox.position.y = greenBox.position.y + data[5]*size/2 + data[7]*size/2/4;
    } else {
      redBox.position.y = orangeBox.position.y + data[6]*size/2/4 + data[7]*size/2/4;
    }
    redBox.scaling.y = data[7]/4;
    redBox.ani = true;
    redBox.setParent(root);
  } else {
    redBox = BABYLON.MeshBuilder.CreateBox(`${data[0]}_r`, { size:4 }, scene);
    redBox.material = scene.getMaterialByName('black');
    redBox.isVisible = false;
    redBox.ani = true;
    redBox.setParent(root);
  }

  const modal = document.getElementById('barLabel');
  greenBox.actionManager = new BABYLON.ActionManager(scene);
  greenBox.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(e){
    modal.style.display = 'inline-block';
    modal.innerText = data[1] + '(' + data[3] + '/' + data[4] + ')';
    modal.style.top = e.pointerY + 'px';
    modal.style.left = e.pointerX + 'px';
    modal.style.backgroundColor = 'green';    
  }));

  greenBox.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(e){
    modal.style.display = 'none';
  }));

  orangeBox.actionManager = new BABYLON.ActionManager(scene);
  orangeBox.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(e){
    modal.style.display = 'inline-block';
    modal.innerText = data[1] + '(' + data[3] + '/' + data[4] + ')';
    modal.style.top = e.pointerY + 'px';
    modal.style.left = e.pointerX + 'px';
    modal.style.backgroundColor = 'orange';  
  }));

  orangeBox.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(e){
    modal.style.display = 'none';
  }));

  redBox.actionManager = new BABYLON.ActionManager(scene);
  redBox.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(e){
    modal.style.display = 'inline-block';
    modal.innerText = data[1] + '(' + data[3] + '/' + data[4] + ')';
    modal.style.top = e.pointerY + 'px';
    modal.style.left = e.pointerX + 'px';
    modal.style.backgroundColor = 'red';
  }));

  redBox.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(e){
    modal.style.display = 'none';
  }));

  const term = 14;

  if (Math.floor(k/5) < 1) {
    if (k%5 == 0) {
      root.position = new BABYLON.Vector3(term, 0, term);
    } else if (k%5 == 1) {
      root.position = new BABYLON.Vector3(term/2, 0, term);
    } else if (k%5 == 2) {
      root.position = new BABYLON.Vector3(0, 0, term);
    } else if (k%5 == 3) {
      root.position = new BABYLON.Vector3(- term/2 , 0, term);
    } else if (k%5 == 4) {
      root.position = new BABYLON.Vector3(- term , 0, term);
    }
  } else {
    if (k%5 == 0) {
      root.position = new BABYLON.Vector3(term, 0, term - Math.floor(k/5)*term/1.5);
    } else if (k%5 == 1) {
      root.position = new BABYLON.Vector3(term/2, 0, term - Math.floor(k/5)*term/1.5);
    } else if (k%5 == 2) {
      root.position = new BABYLON.Vector3(0, 0, term - Math.floor(k/5)*term/1.5);
    } else if (k%5 == 3) {
      root.position = new BABYLON.Vector3(- term/2, 0, term - Math.floor(k/5)*term/1.5);
    } else if (k%5 == 4) {
      root.position = new BABYLON.Vector3(- term, 0, term - Math.floor(k/5)*term/1.5);
    }
  }
  return root
};

const drawFirstDepth = (angleList) => {
  let angle = [];

  if (angleList.length > 0) {
    angle = angleList;
  } else {
    angle = [
      [120,''],
      [120,''],
      [120,''],
    ];
  }

  const pie3d = {
    'slices': [],
    'spaceBetweenSlices': true,
    'innerRadiusPct': 70,
    'clickScalePct': 20,
    'verticalFactor': 25 ,
    'showLabel': true,
    "labelFontFactor": 10,
    'labelExtraTopMargin': -4,
  };

  for (let i=0; i<angle.length; i++) {
    const slice = {};
    slice.value = angle[i][0];
    slice.arcPct = angle[i][0];
    slice.color = scene.getMaterialByName('green');
    slice.label = angle[i][1];
    pie3d.slices.push(slice);
  }

  pieChart(pie3d);
  
};

const pieChart = (pie3d) => {
  for (let i = 0; i < pie3d.slices.length; i++) {
    if ( pie3d.slices[i].arcPct == undefined) pie3d.slices[i].arcPct = 1 / pie3d.slices.length * 360;
  }
    
  pie3d.diameter = 300;
  
  let oneSlice = function( height, arcFraction, color, label, value) {
      
  // CSG: Constructive Solid Geometry : pie (= cylinder with arc) - full cylinder for inner part to carve out
      
  // face UV is used to have the text on front. All other faces just get the background color
  const uniPiece = new BABYLON.Vector4(0, 0, 0.1, 0.1); // take a little piece from the left top
  let faceUV = new Array(6).fill( uniPiece);
  faceUV[4] = new BABYLON.Vector4(1, 1, 0, 0);
  
      // cylinder with arc
      const pie = BABYLON.MeshBuilder.CreateCylinder( 'pie', {
        height: Math.abs( height),
        diameter: pie3d.diameter,
        arc: arcFraction,  // fraction of 2 pi (ratio of the circumference between 0 and 1)
        enclose: true,  // activates the left & right side faces
        faceUV: faceUV,
        subDivision: 10000
      });
          
      const pieCSG = BABYLON.CSG.FromMesh(pie);
  
      // inner cylinder
      const donutHoleFraction = pie3d.innerRadiusPct / 100;
      const diameter = (pie3d.diameter * donutHoleFraction ) + 0.01; 
      
      faceUV[1] = faceUV[0]; 
      const cyl = BABYLON.MeshBuilder.CreateCylinder( 'cyl', {
        height: Math.abs( height),
        diameter: diameter,
        faceUV: faceUV,
        subDivision: 10000
      });
      
      const cylCSG = BABYLON.CSG.FromMesh(cyl);
  
      const donutCSG = pieCSG.subtract( cylCSG);
      const donut = donutCSG.toMesh( 'donut-' + sliceNr);
  
      let texture = new BABYLON.DynamicTexture( 'dynamic texture-' + sliceNr, {
        width: 800,
        height: 530
      });
      
      // const fontsize = 40
      let fontsize = 50 * arcFraction;
      if (fontsize < 20) {
        fontsize = 20;
      }
      const font = ['bold', fontsize + 'px', 'monospace'].join( ' ');
  
      let textOnSlice = '';
      if ( pie3d.showLabel) {
        textOnSlice = label
      }

      if ( pie3d.showValue) {
        textOnSlice = textOnSlice + ( pie3d.showLabel ? ': ': '') + value
      }

      const txt_X_distance_from_left_hand_edge = 30;
      const txt_Y_distance_from_the_top = ( 61 * ( 1 + ( pie3d.labelFontFactor / 3))) + pie3d.labelExtraTopMargin;

      texture.drawText( textOnSlice, txt_X_distance_from_left_hand_edge, txt_Y_distance_from_the_top, font, "white", '#1e2142', true);
      
      let mat = new BABYLON.StandardMaterial( 'mat-' + sliceNr); 
      mat.diffuseTexture = texture;
  
      donut.material = mat;
      donut.material.specularColor = new BABYLON.Color3(0,0,0);
      // donut.material.wireframe = true
       donut.visibility = 0.7;

      pie.dispose();
      cyl.dispose();
  
      donut.position.y = ( height / 2 ) - (pie3d.verticalFactor / 2 );
      
      const halfArcSlice = 2 * Math.PI * arcFraction / 2;
  
      donut.rotation.y = rotY;
      // donut.ani = true;
      if (pie3d.spaceBetweenSlices) {
        middleRadius = pie3d.diameter * 0.02; // 2% of diameter = 4% of R
        donut.position.x =   Math.cos( rotY + halfArcSlice) * middleRadius;
        donut.position.z = - Math.sin( rotY + halfArcSlice) * middleRadius;
      }
      
      donut.actionManager = new BABYLON.ActionManager();
      donut.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(e){
        const animation = new BABYLON.Animation('animation', 'scaling', 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keyFrame = [
            {
                frame: 0,
                value: donut.scaling
            },
            {
                frame: 5,
                value: new BABYLON.Vector3(1.1, 1.1, 1.1)
            },
        ];
        animation.setKeys(keyFrame);
        donut.animations = [animation];
        scene.beginAnimation(donut, 0, 5, false);
      }));

      donut.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(e){
        const animation = new BABYLON.Animation('animation', 'scaling', 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keyFrame = [
            {
                frame: 0,
                value: donut.scaling
            },
            {
                frame: 5,
                value: new BABYLON.Vector3(1, 1, 1)
            },
        ];
        animation.setKeys(keyFrame);
        donut.animations = [animation];
        scene.beginAnimation(donut, 0, 5, false);
      }));
      

      return donut;
    }
    
    const slices = pie3d.slices;
      
    let maxVal = 0;
    for ( let i = 0; i < slices.length ; i++) {
      if (slices[i].value > maxVal) {
        maxVal = slices[i].value;
      }
    }
  
    // let rotY = Math.PI/2 - 2 * Math.PI * slices[0].arcPct / 100 / 2;
    let rotY = Math.PI/2 - 0.1 * Math.PI * slices[0].arcPct / 360 / slices.length;
    let sliceNr = 0;
    const donutRoot = new BABYLON.TransformNode('donutRoot');
  
    for ( let i = 0; i < slices.length; i++) {
        
      let p = slices[i],
          h = p.value / maxVal * pie3d.verticalFactor;
      
      p.arcPct = p.arcPct / 360;

      const donut = oneSlice( h, p.arcPct, p.color, p.label, p.value);
      donut.setParent(donutRoot);
      // donut.material = p.color;
      rotY = rotY + ( 2 * Math.PI * p.arcPct);

      sliceNr = sliceNr + 1;
    }

    // donutRoot.rotation.y += BABYLON.Tools.ToRadians(115.0091);
    donutRoot.rotation.y -= BABYLON.Tools.ToRadians(178);
};

const updateThirdDepth = (data, parentData, parentMesh, k) => {
  const size = 4;
  let rootBars;
  rootBars = scene.getTransformNodeById(data[0]);
  
  if (rootBars) {
    rootBars.info = data;
    rootBars.parentData = parentData;

    if (data[5] > 0) {
      rootBars.getChildMeshes()[0].isVisible = true;
      rootBars.getChildMeshes()[0].material = scene.getMaterialByName('green');
      rootBars.getChildMeshes()[0].scaling.y = 1;
      rootBars.getChildMeshes()[0].scaling.y = data[5];
      rootBars.getChildMeshes()[0].position.y = boxDepth/2 + data[5] * size/2;
    } else {
      rootBars.getChildMeshes()[0].isVisible = true;
      rootBars.getChildMeshes()[0].material = scene.getMaterialByName('black');
      rootBars.getChildMeshes()[0].scaling.y = rootBars.getChildMeshes()[0].scaling.y / rootBars.getChildMeshes()[0].scaling.y/size;
      rootBars.getChildMeshes()[0].position.y = boxDepth/2 + size/2;
    }
    if (data[6] > 0) {
      rootBars.getChildMeshes()[1].isVisible = true;
      rootBars.getChildMeshes()[1].material = scene.getMaterialByName('orange');
      rootBars.getChildMeshes()[1].scaling.y = 1;
      rootBars.getChildMeshes()[1].scaling.y = data[6]/4;
      rootBars.getChildMeshes()[1].position.y = rootBars.getChildMeshes()[0].position.y + data[5]*size/2 + data[6]*size/2/4;
    } else {
      rootBars.getChildMeshes()[1].isVisible = false;
    }
    if (data[7] > 0) {
      rootBars.getChildMeshes()[2].isVisible = true;
      rootBars.getChildMeshes()[2].material = scene.getMaterialByName('red');
      rootBars.getChildMeshes()[2].scaling.y = 1;
      rootBars.getChildMeshes()[2].scaling.y = data[7]/4;
      if (rootBars.getChildMeshes()[1].isVisible == false) {
        rootBars.getChildMeshes()[2].position.y = rootBars.getChildMeshes()[0].position.y + data[5]*size/2 + data[7]*size/2/4;
      } else {
        rootBars.getChildMeshes()[2].position.y = rootBars.getChildMeshes()[1].position.y + data[6]*size/2/4 + data[7]*size/2/4;
      }
    } else {
      rootBars.getChildMeshes()[2].isVisible = false;
      rootBars.getChildMeshes()[2].material = scene.getMaterialByName('black');
    }
  } else {
    rootBars = new BABYLON.TransformNode(data[0]);
    rootBars.info = data;
    rootBars.parentData = parentData;
    rootBars.name = data[0];
    rootBars.id = data[0]

    let greenBox = null;
    let orangeBox = null;
    let redBox = null;
    const size = 4;

    if(data[5] != 0) {
      greenBox = BABYLON.MeshBuilder.CreateBox(`${data[0]}_g`, { size: size }, scene);
      greenBox.material = scene.getMaterialByName('green');
      greenBox.position.y = boxDepth/2 + data[5] * size/2;
      greenBox.scaling.y = data[5];
      greenBox.ani = true;
      greenBox.setParent(rootBars);
    } else {
      greenBox = BABYLON.MeshBuilder.CreateBox(`${data[0]}_g`, { size: size }, scene);
      greenBox.material = scene.getMaterialByName('black');
      greenBox.position.y = boxDepth/2 + size/2;
      greenBox.scaling.y = 1;
      greenBox.ani = true;
      greenBox.setParent(rootBars);
    }

    if (data[6] != 0) {
      orangeBox = BABYLON.MeshBuilder.CreateBox(`${data[0]}_o`, { size: size }, scene);
      orangeBox.material = scene.getMaterialByName('orange');
      orangeBox.position.y = greenBox.position.y + data[5]*size/2 + data[6]*size/2/4;
      orangeBox.scaling.y = data[6]/4;
      orangeBox.ani = true;
      orangeBox.setParent(rootBars);
    } else {
      orangeBox = BABYLON.MeshBuilder.CreateBox(`${data[0]}_o`, { size:4 }, scene);
      orangeBox.material = scene.getMaterialByName('black');
      orangeBox.isVisible = false;
      orangeBox.ani = true;
      orangeBox.setParent(rootBars);
    }
    if (data[7] != 0) {
      redBox = BABYLON.MeshBuilder.CreateBox(`${data[0]}_r`, { size:4 }, scene);
      redBox.material = scene.getMaterialByName('red');
      if (orangeBox.isVisible == false) {
        redBox.position.y = greenBox.position.y + data[5]*size/2 + data[7]*size/2/4;
      } else {
        redBox.position.y = orangeBox.position.y + data[6]*size/2/4 + data[7]*size/2/4;
      }
      redBox.scaling.y = data[7]/4;
      redBox.ani = true;
      redBox.setParent(rootBars);
    } else {
      redBox = BABYLON.MeshBuilder.CreateBox(`${data[0]}_r`, { size:4 }, scene);
      redBox.material = scene.getMaterialByName('black');
      redBox.isVisible = false;
      redBox.ani = true;
      redBox.setParent(rootBars);
    }

    const modal = document.getElementById('barLabel');
    greenBox.actionManager = new BABYLON.ActionManager(scene);
    greenBox.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(e){
      modal.style.display = 'inline-block';
      modal.innerText = data[1] + '(' + data[3] + '/' + data[4] + ')';
      modal.style.top = e.pointerY + 'px';
      modal.style.left = e.pointerX + 'px';
      modal.style.backgroundColor = 'green';    
    }));

    greenBox.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(e){
      modal.style.display = 'none';
    }));

    orangeBox.actionManager = new BABYLON.ActionManager(scene);
    orangeBox.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(e){
      modal.style.display = 'inline-block';
      modal.innerText = data[1] + '(' + data[3] + '/' + data[4] + ')';
      modal.style.top = e.pointerY + 'px';
      modal.style.left = e.pointerX + 'px';
      modal.style.backgroundColor = 'orange';  
    }));

    orangeBox.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(e){
      modal.style.display = 'none';
    }));

    redBox.actionManager = new BABYLON.ActionManager(scene);
    redBox.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(e){
      modal.style.display = 'inline-block';
      modal.innerText = data[1] + '(' + data[3] + '/' + data[4] + ')';
      modal.style.top = e.pointerY + 'px';
      modal.style.left = e.pointerX + 'px';
      modal.style.backgroundColor = 'red';
    }));

    redBox.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(e){
      modal.style.display = 'none';
    }));

    rootBars.position.addInPlace(parentMesh._parentNode.position);
    rootBars.rotation = new BABYLON.Vector3(BABYLON.Tools.ToRadians(360), parentMesh._parentNode.rotation.y, parentMesh._parentNode.rotation.z);
    rootBars.setParent(parentMesh);
    barRootNodes.push(rootBars);
  }

  const term = 14;

  if (Math.floor(k/5) < 1) {
    if (k%5 == 0) {
      rootBars.position = new BABYLON.Vector3(term, 0, term);
    } else if (k%5 == 1) {
      rootBars.position = new BABYLON.Vector3(term/2, 0, term);
    } else if (k%5 == 2) {
      rootBars.position = new BABYLON.Vector3(0, 0, term);
    } else if (k%5 == 3) {
      rootBars.position = new BABYLON.Vector3(- term/2 , 0, term);
    } else if (k%5 == 4) {
      rootBars.position = new BABYLON.Vector3(- term , 0, term);
    }
  } else {
    if (k%5 == 0) {
      rootBars.position = new BABYLON.Vector3(term, 0, term - Math.floor(k/5)*term/1.5);
    } else if (k%5 == 1) {
      rootBars.position = new BABYLON.Vector3(term/2, 0, term - Math.floor(k/5)*term/1.5);
    } else if (k%5 == 2) {
      rootBars.position = new BABYLON.Vector3(0, 0, term - Math.floor(k/5)*term/1.5);
    } else if (k%5 == 3) {
      rootBars.position = new BABYLON.Vector3(- term/2, 0, term - Math.floor(k/5)*term/1.5);
    } else if (k%5 == 4) {
      rootBars.position = new BABYLON.Vector3(- term, 0, term - Math.floor(k/5)*term/1.5);
    }
  }


  if (data[7] > 0 || data[6] > 0) {
    rootBars.getChildMeshes()[2].data = data[7];
    criticalInstances.push(rootBars.getChildMeshes()[2]);
  }
};

const updateSecondDepth = (id, mesh, status) => {
  const mat = scene.getMaterialByName(`DynamicMat_${id}`);
  if (status == 'w') {
    mat.diffuseColor = BABYLON.Color3.FromHexString("#ff9900");
    mesh.edgesColor = new BABYLON.Color4(1,1,0,30);
  } else if (status == 'c') {
    mat.diffuseColor = BABYLON.Color3.FromHexString("#cc0000");
    mesh.edgesColor = new BABYLON.Color4(1,0,0,30);
  } else {
    mat.diffuseColor = BABYLON.Color3.FromHexString("#00aaff");
    mesh.edgesColor = new BABYLON.Color4(0,1,1,30);
  }
};

const createCameraAnimation = (target) => {
  eventTrigger = true;
  let endPosition;
  if (target.parent) {
    endPosition = new BABYLON.Vector3(target.parent.absolutePosition.x*1.8, target.absolutePosition.y + 200, target.parent.absolutePosition.z*1.8);
  } else {
    endPosition = new BABYLON.Vector3(target.absolutePosition.x*1.8, target.absolutePosition.y + 220, target.absolutePosition.z*1.8);
  }
  
  if (target.name.includes('_g')) {
    endPosition = new BABYLON.Vector3(target.parent.absolutePosition.x*1.5, target.absolutePosition.y * 1.2 + 50, target.parent.absolutePosition.z*1.5);
  } 

  const animation = new BABYLON.Animation(
    'cameraAnimation',
    'position',
    50,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  const keys = [];
  keys.push({
    frame: 0,
    value: scene.activeCamera.position.clone()
  });
  keys.push({
    frame: 50,
    value: endPosition
  });

  animation.setKeys(keys);
  scene.activeCamera.animations.push(animation);
  const cameraAnimation = scene.beginAnimation(scene.activeCamera, 0, 50, false);
  
  // BABYLON.Animation.CreateAndStartAnimation('targetAnimation', scene.activeCamera, 'target', 50, 50, scene.activeCamera.target, new BABYLON.Vector3(target.parent.absolutePosition.x, target.absolutePosition.y + 30, target.parent.absolutePosition.z), 0);
  
  // 기둥선택 시 해당 기둥 데이터(groups데이터)를 callback 으로 전달되게 구현
  cameraAnimation.onAnimationEnd = function () {
    scene.activeCamera.useAutoRotationBehavior = false;
    showDetailInstanceData(target.parent);
    eventTrigger = false;
	};
};

// warning & critical 데이터가 들어왔을 때 무조건 이동
const criticalAlertAnimation = () => {
  if (criticalInstances.length <= 0) {
    return
  }
  const ease = new BABYLON.CubicEase();
  ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
  const keys = [];
  keys.push({
    frame: 0,
    value: scene.activeCamera.position.clone()
  });

  criticalInstances = criticalInstances.sort(function(a, b)  {
    return b.data - a.data;
  });

  for (let i=0; i<2; i++) {
    let endPosition;
    if (criticalInstances[i].parent) {
      endPosition = new BABYLON.Vector3(criticalInstances[i].parent.absolutePosition.x*1.8, criticalInstances[i].absolutePosition.y + 220, criticalInstances[i].parent.absolutePosition.z*1.8)
      keys.push({frame: 100/2*(i+1), value:endPosition});
    } else {
      endPosition = new BABYLON.Vector3(criticalInstances[i].absolutePosition.x*1.8, criticalInstances[i].absolutePosition.y + 320, criticalInstances[i].absolutePosition.z*1.8)
      keys.push({frame: 100/2*(i+1), value:endPosition});
    }
  }
    const animation = new BABYLON.Animation(
      'cameraAnimation',
      'position',
      25,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    animation.setEasingFunction(ease);
    animation.setKeys(keys);
    scene.activeCamera.animations.push(animation);
    scene.beginAnimation(scene.activeCamera, 0, 100, false);
};

const sortData = (dataArray) => {
  if (dataArray.length > 1) {
    const odd = []
    const even = []
    const result = []

    for (let i=0; i < dataArray.length; i++) {
        if (i%2 === 0) {
          odd.push(dataArray[i])
        } else {
          even.push(dataArray[i])
        } 
    }
    
    odd.sort((a,b) => (b.servers.length / secondServersTotal * 360)-(a.servers.length / secondServersTotal * 360)); 
    even.sort((a,b) => (a.servers.length / secondServersTotal * 360)-(b.servers.length / secondServersTotal * 360));

    for(let j in even) {
      result.push(odd[j]);
      result.push(even[j]);
    }

    return result;
  } else {
    return dataArray
  }
};

const createAll = async () => {
  const canvas = document.getElementById("renderCanvas");
  engine = new BABYLON.Engine(canvas, true, { useWebGL2: true });
  
  await fetchData(dataSet, dataSetIndex, createEnv);

  startIntervalFunc(dataSet, dataSetIndex);

  canvas.addEventListener('click', (event) => {
    const pickResult = scene.pick(scene.pointerX, scene.pointerY);
    if (pickResult.hit && pickResult.pickedMesh) {
      const selectedMesh = pickResult.pickedMesh;
      if (!selectedMesh.ani) {
        return
      }
      createCameraAnimation(selectedMesh);
      const searchCloseButton = document.getElementById("searchCloseButton");
      searchCloseButton.style.display = 'block';
      searchInput.value = null;
    }
  });

  const searchButton = document.getElementById('searchButton');
  searchButton.addEventListener('click', ()=> {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = `${searchInput.value}_g`;
    
    const target = scene.getMeshById(searchTerm);
    // const target2 = scene.getMeshByName(searchTerm);
    if (target != null) {
      createCameraAnimation(target);
      const searchCloseButton = document.getElementById("searchCloseButton");
      searchCloseButton.style.display = 'block';
      searchInput.value = null;
    } else {
      alert('검색결과가 존재하지 않습니다. 입력하신 ID를 다시 확인해주세요.');
    }
  });

  const stopRotateButton = document.getElementById('stopRotateButton2');
  let rotateTrigger = true;
  stopRotateButton.addEventListener('click', ()=> {
    scene.stopAnimation(scene.activeCamera);
    if (rotateTrigger) {
      scene.activeCamera.useAutoRotationBehavior = false;
      stopRotateButton.innerText = '카메라 회전';
      rotateTrigger = !rotateTrigger;
    } else {
      scene.activeCamera.useAutoRotationBehavior = true;
      stopRotateButton.innerText = '카메라 회전 중지';
      rotateTrigger = !rotateTrigger;
    }
  }); 

  // const lightTriggerButton = document.getElementById('lightTriggerButton2');
  // let lightTrigger = true;
  // lightTriggerButton.addEventListener('click', ()=> {
  //   const star = scene.getMeshByName("star");
  //   if (lightTrigger) {
  //     star.isVisible = true;
  //     lightTrigger = !lightTrigger;
  //   } else {
  //     star.isVisible = false;
  //     lightTrigger = !lightTrigger;
  //   }
  // }); 

  const closeButton = document.getElementById("searchCloseButton");
  closeButton.addEventListener('click', ()=> {
    closeButton.style.display = 'none';
    scene.activeCamera.useAutoRotationBehavior = true;
    // BABYLON.Animation.CreateAndStartAnimation('targetAnimation', scene.activeCamera, 'target', 100, 100, scene.activeCamera.target, new BABYLON.Vector3(0,0,0), 0);
  }); 
};

// 데이터 요청 함수(콜백함수 인자로 넣어주어야함)
const fetchData = async (dataSet, dataSetIndex, callBack) => {
  fetch(`./jsonData/dashboard_event_${dataSet}/response_${dataSetIndex}.json`)
    .then(function(response) {
    return response.json();
    }).then(async function(myJson) {
      currentData = myJson.data;
      firstServers = currentData.serverGroups;
      callBack();
  });
};

// 인터벌 함수 종료
const stopIntervalFunc = () => {
  clearInterval(IntervalFunc);
};

// 인터벌 함수 시작
const startIntervalFunc = (dataSet, dataSetIndex) => {
  IntervalFunc = setInterval( async ()=>{
    if (!eventTrigger) {
      if (dataSetIndex < 5) {
        dataSetIndex += 1;
        fetchData(dataSet, dataSetIndex, intervalFunction);
      } else {
        dataSetIndex = 0;
        fetchData(dataSet, dataSetIndex, intervalFunction);
      }
    }
  }, 5000);
}

// 인터벌 함수 콜백함수(데이터 변경 로직)
const intervalFunction = async () => {
  animationGroups = new BABYLON.AnimationGroup("Group1");
  criticalInstances = [];

  if (firstServers.length > 0) {
    for (let i=0; i<firstServers.length; i++) {
      secondServersTotal += firstServers[i].servers.length;
    }
  
    firstServers = sortData(firstServers);
  
    for (let i=0; i < firstServers.length; i++) {
      for (let j=0; j<firstServers[i].servers.length; j++) {
        const mesh = scene.getMeshById(firstServers[i].servers[j].id);
        updateSecondDepth(firstServers[i].servers[j].id, mesh, firstServers[i].servers[j].status);
        
        const node = mesh._children[1].getChildMeshes();
        for (let m=0; m<node.length; m++) {
          node[m].isVisible = false;
        }
        for (let k=0; k<firstServers[i].servers[j].groups.length; k++) {
          if (k<20) {
            updateThirdDepth(firstServers[i].servers[j].groups[k], firstServers[i].servers[j], mesh._children[1], k);
          }
        }
      }
    }
  
    for (let i=0; i<barRootNodes.length; i++) {
      if (barRootNodes[i]._children[0].isVisible == false) {
        barRootNodes[i].dispose();
        barRootNodes.splice(i, 1);
      }
    }
  
    if (scene.activeCamera.useAutoRotationBehavior) {
      criticalAlertAnimation();
    }
  }
};

// 인스턴스 상세 정보 모달창 이벤트
const showDetailInstanceData = (targetMesh) => {
  console.log('showDetail');
  
  console.log("인스턴스 막대에 대한 정보");
  console.log(targetMesh.info);

  console.log("###########");

  console.log("인스턴스 그룹에 대한 정보");
  console.log(targetMesh.parentData);
  
};

window.onload = function() {
  createAll();
}