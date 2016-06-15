//Standard Globals
var gl = null;
var shaderProgram = null;
var root = null;
var canvasWidth = 1200;
var canvasHeight = 800;

//
//------------------------------
//

//Objects
var wall = new MaterialSGNode([new RenderSGNode(makeRect())]);
var lamp = new MaterialSGNode([new RenderSGNode(makeLamp())]);
var cuboid = new MaterialSGNode([new RenderSGNode(makeCuboid())]);
var bedLightNode = new LightSGNode();
var ceilingLightNode = new LightSGNode();
var bedsteadMaterial, bedMattressMaterial;
var deskMaterial, chairMaterial;
var ceilLampMaterial;

//
//------------------------------
//

//Camera Globals
var currentLookAt = [0,0,0];
var currentCameraPos = [-2,0,-2];
var currentUpVector = [0,1,0];
var currentCameraRightVector = [1,0,0];
var worldUpVector = [0,1,0];
var currentYaw = 90.0;
var currentPitch = 0.0;

//
//------------------------------
//

//Transformation matrices

////Body Transformation
var rightArmTransformationMatrix;
var leftArmTransformationMatrix;
var rightLegTransformationMatrix;
var leftLegTransformationMatrix;
var isFlashlightPickedUp = false;
var figureTransformationNode;

//
//------------------------------
//------------------------------
//

//Render Section

function render(timeInMilliseconds) {
  checkForWindowResize(gl);
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  calculateCameraVectors();

  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), 30, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  context.viewMatrix = mat4.lookAt(mat4.create(), currentCameraPos, vec3.add(vec3.create(), currentCameraPos,currentLookAt), currentUpVector);
  context.sceneMatrix = mat4.create();

  //Update Transformation matrices
  renderBody(timeInMilliseconds);

  root.render(context);
  requestAnimationFrame(render);

}

function renderBody(timeInMilliseconds){
  if(!isFlashlightPickedUp){
    if(timeInMilliseconds%2000 < 1000){
      renderArm(rightArmTransformationMatrix.matrix, 1);
      renderArm(leftArmTransformationMatrix.matrix, -1);
    } else{
      renderArm(rightArmTransformationMatrix.matrix, -1);
      renderArm(leftArmTransformationMatrix.matrix, 1);
    }
  }
}

function renderArm(armTransformationMatrix, rotation){
  var translationArm = mat4.getTranslation(vec3.create(),  armTransformationMatrix);
  mat4.multiply(armTransformationMatrix, armTransformationMatrix, glm.translate(translationArm[0], translationArm[1], translationArm[2]));
  mat4.multiply(armTransformationMatrix, armTransformationMatrix, glm.rotateX(rotation));
  mat4.multiply(armTransformationMatrix, armTransformationMatrix, glm.translate(-translationArm[0], -translationArm[1], -translationArm[2]));
}

//
//------------------------------
//

//Init Section

function init(resources) {
  gl = createContext(canvasWidth , canvasHeight);
  gl.enable(gl.DEPTH_TEST);
  root = createSceneGraph(gl, resources);
  initInteraction(gl.canvas);
  initWall();
  initCuboid();
  initLamp();
  initBedLightNode();
  initCeilingLightNode();
  initBedSteadMaterial(resources);
  initBedMattressMaterial(resources);
  initDeskMaterial(resources);
  initCeilingLampMaterial(resources);
}

function initWall(){
  wall.ambient = [0, 0, 0, 1];
  wall.diffuse = [0.1, 0.1, 0.1, 1];
  wall.specular = [0.2, 0.2, 0.2, 1];
  wall.shininess = 0.4;
}

function initLamp(){
  lamp.ambient = [0, 0, 0, 1];
  lamp.diffuse = [0.1, 0.1, 0.1, 1];
  lamp.specular = [0.5, 0.5, 0.5, 1];
  lamp.shininess = 0.4;
}

function initCuboid(){
  cuboid.ambient = [0, 0, 0, 1];
  cuboid.diffuse = [0.1, 0.1, 0.1, 1];
  cuboid.specular = [0.5, 0.5, 0.5, 1];
  cuboid.shininess = 0.4;
}

function initCeilingLightNode(){
  ceilingLightNode.ambient = [0.2, 0.2, 0.2, 1];
  ceilingLightNode.diffuse = [0.2, 0.2, 0.2, 1];
  ceilingLightNode.specular = [0.2, 0.2, 0.2, 1];
  ceilingLightNode.position = [0, 0, 0];
  ceilingLightNode.uniform = 'u_light';
}

function initBedLightNode(){
  bedLightNode.ambient = [0.3, 0.3, 0.3, 1];
  bedLightNode.diffuse = [0.3, 0.3, 0.3, 1];
  bedLightNode.specular = [0.3, 0.3, 0.3, 1];
  bedLightNode.position = [0, 0, 0];
  bedLightNode.uniform = 'u_light2';
}

function initBedSteadMaterial(resources){
  bedsteadMaterial.ambient = resources.bedMtl.bedstead.ambient;
  bedsteadMaterial.diffuse = resources.bedMtl.bedstead.diffuse;
  bedsteadMaterial.specular = resources.bedMtl.bedstead.specular;
  bedsteadMaterial.emission = resources.bedMtl.bedstead.emission;
  bedsteadMaterial.shininess = resources.bedMtl.bedstead.shininess;
}

function initBedMattressMaterial(resources){
  bedMattressMaterial.ambient = resources.bedMtl.bedMattress.ambient;
  bedMattressMaterial.diffuse = resources.bedMtl.bedMattress.diffuse;
  bedMattressMaterial.specular = resources.bedMtl.bedMattress.specular;
  bedMattressMaterial.emission = resources.bedMtl.bedMattress.emission;
  bedMattressMaterial.shininess = resources.bedMtl.bedMattress.shininess;
}

function initDeskMaterial(resources){
  deskMaterial.ambient = resources.tableMaterial.table.ambient;
  deskMaterial.diffuse = resources.tableMaterial.table.diffuse;
  deskMaterial.specular = resources.tableMaterial.table.specular;
  deskMaterial.emission = resources.tableMaterial.table.emission;
  deskMaterial.shininess = resources.tableMaterial.table.shininess;
}

function initCeilingLampMaterial(resources){
  ceilLampMaterial.ambient = resources.ceilingLampMaterial.wire_143224087.ambient;
  ceilLampMaterial.diffuse = resources.ceilingLampMaterial.wire_143224087.diffuse;
  ceilLampMaterial.specular = resources.ceilingLampMaterial.wire_143224087.specular;
  ceilLampMaterial.emission = resources.ceilingLampMaterial.wire_143224087.emission;
  ceilLampMaterial.shininess = resources.ceilingLampMaterial.wire_143224087.shininess;
}

//SceneGraph Section
function createSceneGraph(gl, resources) {

  root = new ShaderSGNode(createProgram(gl, resources.phong_vs, resources.phong_fs));
  setMaterials(resources);
  createRooms(resources);
  createPathways();
  createDesk(resources);
  createBed(resources);
  createCeilLamp(resources);
  createBody(resources);
  createBedLightNode(resources);

  return root;
}

function setMaterials(resources){
    deskMaterial = new MaterialSGNode(new RenderSGNode(resources.table));
    chairMaterial = new MaterialSGNode(new RenderSGNode(resources.chair));
    ceilLampMaterial = new MaterialSGNode(new RenderSGNode(resources.ceilingLamp));
    bedMattressMaterial = new MaterialSGNode(new RenderSGNode(resources.bedMattress));
    bedsteadMaterial = new MaterialSGNode(new RenderSGNode(resources.bedstead));
}

function createCeilLamp(resources){
  root.append(new TransformationSGNode(glm.transform({translate:[-2.66,0.001,1], scale: 0.001}),new AdvancedTextureSGNode(resources.ceilingLampTexture, ceilLampMaterial)));
  var ceilLight = new TransformationSGNode(glm.transform({translate:[-2.66,0.38,1], scale: 0.18}),[createLightSphere(resources), ceilingLightNode]);
  root.append(ceilLight);
}

function createBedLightNode(resources){
  root.append(new TransformationSGNode(glm.transform({translate:[-3.5,1.78,1.2], rotateX:90, scale: 0.1}),new AdvancedTextureSGNode(resources.sandTexture, lamp)));
  var descLight = new TransformationSGNode(glm.transform({translate:[-3.5,1.7,1.2], scale: 0.3}),[createLightSphere(resources), bedLightNode]);
  root.append(descLight);
}

function createLightSphere(resources) {
    return new ShaderSGNode(createProgram(gl, resources.light_vs, resources.light_fs),[new RenderSGNode(makeSphere(.2,10,10))]);
  }

function createDesk(resources){
  root.append(new TransformationSGNode(glm.transform({translate: [-3.1,1.522,0.3], rotateY:90, scale: 0.01}), new AdvancedTextureSGNode(resources.tableTexture, deskMaterial)));
  root.append(new TransformationSGNode(glm.transform({translate: [-2.9,1.65,0.7], rotateX: 180, rotateY: 0, scale: [0.04,0.03,0.03]}), new AdvancedTextureSGNode(resources.woodChairTexture, chairMaterial)));
}

function createBed(resources){
  var bedTransformationNode = new TransformationSGNode(glm.transform({translate: [-2.95,1.71,1.67], scale: 0.003}));
  bedTransformationNode.append(new TransformationSGNode(glm.transform({translate: [0,0,0], rotateX: 180, rotateY: 90, scale: 1}),
    new AdvancedTextureSGNode(resources.bedsteadTexture, bedsteadMaterial)));
  bedTransformationNode.append(new TransformationSGNode(glm.transform({translate: [0,-0.5,0], rotateX: 180, rotateY: 90, scale: 1.001}),
    new AdvancedTextureSGNode(resources.bedMatressTexture, bedMattressMaterial)));
  root.append(bedTransformationNode);
}

function createBody(resources){
  figureTransformationNode = new TransformationSGNode(glm.transform({translate:[-1,0.9,0.3],scale:0.6}), []);

  var texturedBodyPart = new AdvancedTextureSGNode(resources.skinTexture, cuboid);
  //Arms
  leftArmTransformationMatrix = new TransformationSGNode(glm.transform({ translate: [-2,1.05,1], rotateY: 00, rotateX: 90, scale: [0.05,0.05,0.1]}), texturedBodyPart);
  rightArmTransformationMatrix = new TransformationSGNode(glm.transform({ translate: [-2.5,1.05,1], rotateY: 00, rotateX: 90, scale: [0.05,0.05,0.1]}), texturedBodyPart);
  figureTransformationNode.append(leftArmTransformationMatrix);
  figureTransformationNode.append(rightArmTransformationMatrix);
  //Legs
  leftLegTransformationMatrix = new TransformationSGNode(glm.transform({ translate: [-2.1,1.6,1], rotateY: 00, rotateX: 90, scale: [0.05,0.05,0.1]}), texturedBodyPart);
  rightLegTransformationMatrix = new TransformationSGNode(glm.transform({ translate: [-2.4,1.6,1], rotateY: 00, rotateX: 90, scale: [0.05,0.05,0.1]}), texturedBodyPart);
  figureTransformationNode.append(leftLegTransformationMatrix);
  figureTransformationNode.append(rightLegTransformationMatrix);

  //Body
  figureTransformationNode.append(new TransformationSGNode(glm.transform({ translate: [-2.25,1.1,1], rotateY: 00, rotateX: 90, scale: [0.2,0.2,0.15]}), texturedBodyPart));


  root.append(figureTransformationNode);

}

function createRooms(resources){
  var firstRoomTextureNode = new AdvancedTextureSGNode(resources.tableTexture,[]);
  var firstRoomFloorTextureNode = new AdvancedTextureSGNode(resources.woodFloorTexture,[]);
  root.append(new TransformationSGNode(glm.transform({translate: [-2-2/3,0,0], scale: 1}), [firstRoomTextureNode, firstRoomFloorTextureNode]));
  createFirstRoom(firstRoomTextureNode, firstRoomFloorTextureNode);


  var secondRoomTextureNode = new AdvancedTextureSGNode(resources.tileTexture,[]);
  var secondRoomFloorTextureNode = new AdvancedTextureSGNode(resources.tileFloorTexture,[]);
  root.append(new TransformationSGNode(glm.transform({translate: [0,0,0], scale: 1}), [secondRoomTextureNode, secondRoomFloorTextureNode]));
  createSecondRoom(secondRoomTextureNode, secondRoomFloorTextureNode);

  var thirdRoomTextureNode = new AdvancedTextureSGNode(resources.tableTexture,[]);
  root.append(new TransformationSGNode(glm.transform({translate: [0,0,-2-2/3], scale: 1}), thirdRoomTextureNode));
  createThirdRoom(thirdRoomTextureNode);


}

function createFirstRoom(firstRoomTransformationNode, firstRoomFloorNode){
  //front
  firstRoomTransformationNode.append(new TransformationSGNode(glm.transform({ translate: [0,1,0], rotateX: 0, scale: 1}), wall));
  //back
  firstRoomTransformationNode.append(new TransformationSGNode(glm.transform({translate:[0,1,2], rotateX: 0, scale:1}), wall));
  //top
  firstRoomTransformationNode.append(new TransformationSGNode(glm.transform({translate:[0,0,1], rotateX: 90, scale:1}), wall));
  //bottom
  firstRoomFloorNode.append(new TransformationSGNode(glm.transform({translate:[0,2,1], rotateX: 90, scale:1}), wall));
  //right
  var rightWall =new TransformationSGNode(glm.transform({translate:[1,1,1], rotateY: 90, scale:1}), []);
  addDoorSide(rightWall);
  firstRoomTransformationNode.append(rightWall);
  //left
  firstRoomTransformationNode.append(new TransformationSGNode(glm.transform({translate:[-1,1,1], rotateY: 90, scale:1}), wall));
}

function createSecondRoom(secondRoomTranformationNode, secondRoomFloorTextureNode){
  //front
  var frontWall = new TransformationSGNode(glm.transform({translate: [0,1,0], rotateX: 0, scale: 1}), []);
  frontWall = addDoorSide(frontWall);
  secondRoomTranformationNode.append(frontWall);
  //back
  secondRoomTranformationNode.append(new TransformationSGNode(glm.transform({translate:[0,1,2], rotateX: 0, scale:1}), wall));
  //top
  secondRoomTranformationNode.append(new TransformationSGNode(glm.transform({translate:[0,0,1], rotateX: 90, scale:1}), wall));
  //bottom
  secondRoomFloorTextureNode.append(new TransformationSGNode(glm.transform({translate:[0,2,1], rotateX: 90, scale:1}), wall));
  //right
  secondRoomTranformationNode.append(new TransformationSGNode(glm.transform({translate:[1,1,1], rotateY: 90, scale:1}), wall));
  //left
  var leftWall =new TransformationSGNode(glm.transform({translate:[-1,1,1], rotateY: 90, scale:1}), []);
  leftWall = addDoorSide(leftWall);
  secondRoomTranformationNode.append(leftWall);
}

function createThirdRoom(thirdRoomTranformationNode){
  //front
  thirdRoomTranformationNode.append(new TransformationSGNode(glm.transform({ translate: [0,1,0], rotateX: 0, scale: 1}),wall));
  //back
  var backWall =new TransformationSGNode(glm.transform({translate:[0,1,2], rotateX: 0, scale:1}), []);
  backWall = addDoorSide(backWall);
  thirdRoomTranformationNode.append(backWall);
  //top
  thirdRoomTranformationNode.append(new TransformationSGNode(glm.transform({translate:[0,0,1], rotateX: 90, scale:1}), wall));
  //bottom
  thirdRoomTranformationNode.append(new TransformationSGNode(glm.transform({translate:[0,2,1], rotateX: 90, scale:1}), wall));
  //right
  thirdRoomTranformationNode.append(new TransformationSGNode(glm.transform({translate:[1,1,1], rotateY: 90, scale:1}), wall));
  //left
  thirdRoomTranformationNode.append(new TransformationSGNode(glm.transform({translate:[-1,1,1], rotateY: 90, scale:1}), wall));
}

function addDoorSide(side){
  side.append(new TransformationSGNode(glm.transform({translate:[2/3,0,0], scale:[1/3,1,1/3]}), wall));
  side.append(new TransformationSGNode(glm.transform({translate:[0,-1/2,0], scale:[1/3,1/2,1/3]}), wall));
  side.append(new TransformationSGNode(glm.transform({translate:[-2/3,0,0], scale:[1/3,1,1/3]}), wall));
  return side;
}

function createPathways(){
  createFirstPathway(root,  new TransformationSGNode(glm.transform({translate: [-1-1/3,1,2/3], scale: 1/3}),[]));
  createSecondPathway(root,  new TransformationSGNode(glm.transform({translate:[-1/3,1,-1/3], rotateY:90, scale: 1/3}),[]));
}

function createFirstPathway(node, firstPathwayTransformationNode){
  createPathway(firstPathwayTransformationNode);
  node.append(firstPathwayTransformationNode);
}

function createSecondPathway(node, secondPathwayTransformationNode){
  createPathway(secondPathwayTransformationNode);
  node.append(secondPathwayTransformationNode);
}

function createPathway(node){
  //front
  node.append(new TransformationSGNode(glm.transform({ translate: [0,1.5,0], rotateX: 0, scale: [1,1.5,1]}),wall));
  //back
  node.append(new TransformationSGNode(glm.transform({translate:[0,1.5,2], rotateX: 0, scale:[1,1.5,1]}), wall));
  //top
  node.append(new TransformationSGNode(glm.transform({translate:[0,-0,1], rotateX: 90, scale:[1,1,1]}), wall));
  //bottom
  node.append(new TransformationSGNode(glm.transform({translate:[0,3,1], rotateX: 90, scale:[1,1,1]}), wall));
  }

function makeLamp() {
  width = 1;
  height = 2;
  var position = [-width, -width, -height,
                  width, -width, -height,
                  width, width, -height,
                  -width, width, -height,
                  -width, -width, height,
                  width, -width, height,
                  width, width, height,
                  -width, width, height];
  var normal = [-1, -1, -1,
                1, -1, -1,
                1, 1, -1,
                -1, 1, -1,
                -1,-1, 1,
                1, -1, 1,
                1, 1, 1,
                -1, 1, 1];
  var texture = [0, 1,
                 1/3, 1,
                 2/3, 1,
                 1, 1,
                 0, 0,
                 1/3, 0,
                 2/3, 0,
                 1, 0];
  var index = [0, 1, 2,
               2, 3, 0,
               0, 1, 4,
               1,4,5,
               1,2,5,
               2,5,6,
               2,3,6,
               3,6,7,
               0,3,4,
               3,4,7
             ];
  return {
    position: position,
    normal: normal,
    texture: texture,
    index: index
  };
}

function makeCuboid() {
  width = 1;
  height = 2;
  var position = [-width, -width, -height,
                  width, -width, -height,
                  width, width, -height,
                  -width, width, -height,
                  -width, -width, height,
                  width, -width, height,
                  width, width, height,
                  -width, width, height];
  var normal = [-1, -1, -1,
                1, -1, -1,
                1, 1, -1,
                -1, 1, -1,
                -1,-1, 1,
                1, -1, 1,
                1, 1, 1,
                -1, 1, 1];
  var texture = [0, 1,
                 1/3, 1,
                 2/3, 1,
                 1, 1,
                 0, 0,
                 1/3, 0,
                 2/3, 0,
                 1, 0];
  var index = [0, 1, 2,
               2, 3, 0,
               0, 1, 4,
               1,4,5,
               1,2,5,
               2,5,6,
               2,3,6,
               3,6,7,
               0,3,4,
               3,4,7,
               4,5,6,
               6,7,4
             ];
  return {
    position: position,
    normal: normal,
    texture: texture,
    index: index
  };
}

//
//------------------------------
//

//User Interaction Section

function initInteraction(canvas) {
  const mouse = {
    pos: { x : 0, y : 0},
    leftButtonDown: false
  };
  function toPos(event) {
    //convert to local coordinates
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
  canvas.addEventListener('mousedown', function(event) {
    mouse.pos = toPos(event);
    mouse.leftButtonDown = event.button === 0;
  });
  canvas.addEventListener('mousemove', function(event) {
    const pos = toPos(event);
    const delta = { x : mouse.pos.x - pos.x, y: pos.y - mouse.pos.y };
    if (mouse.leftButtonDown) {
      currentYaw   += delta.x * 0.25;
      currentPitch += delta.y * 0.25;
      if(currentPitch > 89.0){
        pitch = 89.0;
      }
      if(currentPitch < -89.0){
        currentPitch = -89.0;
      }
      calculateCameraVectors();
    }
    mouse.pos = pos;
  });
  canvas.addEventListener('mouseup', function(event) {
    mouse.pos = toPos(event);
    mouse.leftButtonDown = false;
  });
  //register globally
  document.addEventListener('keypress', function(event) {
    if (event.code == 'ArrowUp') {
          var scale = vec3.scale(vec3.create(), currentLookAt , 0.25);
          vec3.add(currentCameraPos, currentCameraPos, scale);
    }
    if (event.code == 'ArrowDown') {
        var scale = vec3.scale(vec3.create(), currentLookAt , 0.25);
        vec3.subtract(currentCameraPos, currentCameraPos, scale);
    }
  });
}

function calculateCameraVectors(){
  var lookat = vec3.create();
  lookat[0] = Math.cos(deg2rad(currentYaw)) * Math.cos(deg2rad(currentPitch));
  lookat[1] = Math.sin(deg2rad(currentPitch));
  lookat[2] = Math.sin(deg2rad(currentYaw)) * Math.cos(deg2rad(currentPitch));
  vec3.normalize(currentLookAt, lookat);

  vec3.normalize(currentCameraRightVector, vec3.cross(vec3.create(), currentLookAt, worldUpVector));
  vec3.normalize(currentUpVector, vec3.cross(vec3.create(), currentCameraRightVector, currentLookAt));
}

//
//------------------------------
//

//Other Section

function deg2rad(degrees) {
  return degrees * Math.PI / 180;
}

function rad2deg(rad){
  return rad/Math.PI * 180
}

//
//------------------------------
//

//Load Resources Section

loadResources({
  light_vs: 'shader/light.vs.glsl',
  light_fs: 'shader/light.fs.glsl',
  phong_vs: 'shader/phong.vs.glsl',
  phong_fs: 'shader/phong.fs.glsl',
  table: 'models/table/Table.obj',
  tableMaterial: 'models/table/Table.mtl',
  chair: 'models/chair/chair.obj',
  tableTexture: 'models/table/texture/Texture-1.jpg',
  tileTexture: 'textures/bathroom/tiles/Tiles.jpg',
  tileFloorTexture: 'textures/bathroom/tiles/Tiles_Floor.jpg',
  woodChairTexture: 'textures/wood/WoodChair.jpg',
  woodFloorTexture: 'textures/wood/WoodFloor.jpg',
  bedstead: 'models/bed/bedstead.obj',
  bedMattress: 'models/bed/bedMattress.obj',
  bedMtl: 'models/bed/bed.mtl',
  bedsteadTexture: 'models/bed/Texture/drvo.bmp',
  bedMatressTexture: 'models/bed/Texture/dusek.bmp',
  sandTexture: 'textures/sand/sand.jpg',
  ceilingLamp: 'models/ceilingLamp/3d-model.obj',
  ceilingLampMaterial: 'models/ceilingLamp/3d-model.mtl',
  ceilingLampTexture: 'models/ceilingLamp/texture/whiteTextile.jpg',
  skinTexture: 'textures/skin/skinTexture.jpg'
}).then(function (resources) {
  init(resources);
  render(0);
});
