var gl = null;
var shaderProgram = null;
var root = null;
var canvasWidth = 800;
var canvasHeight = 800;
var aspectRatio = canvasWidth / canvasHeight;
var quadVertexBuffer, quadColorBuffer;
var rotateNode, rotateLight;
const camera = {
  rotation: {
    x: 0,
    y: 0
  },
  position:{
    x:0,
    y:0,
    z:0
  }
};

let wall = new MaterialSGNode([new RenderSGNode(makeRect())]);
let light = new LightSGNode();


function init(resources) {
  gl = createContext(canvasWidth , canvasHeight);
  gl.enable(gl.DEPTH_TEST);
  root = createSceneGraph(gl, resources);
  initInteraction(gl.canvas);
  initWall();
  initLight();
}

function initWall(){
  wall.ambient = [0, 0, 0, 1];
  wall.diffuse = [0.1, 0.1, 0.1, 1];
  wall.specular = [0.5, 0.5, 0.5, 1];
  wall.shininess = 0.4;
}

function initLight(){
  light.ambient = [0.2, 0.2, 0.2, 1];
  light.diffuse = [0.8, 0.8, 0.8, 1];
  light.specular = [1, 1, 1, 1];
  light.position = [0, 0, 0];
}

function render(timeInMilliseconds) {
  checkForWindowResize(gl);
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), 30, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  context.viewMatrix = mat4.lookAt(mat4.create(), [0,0,-4], [0,0,0], [0,1,0]);
  context.sceneMatrix = glm.transform({translate: [camera.position.x,camera.position.y,camera.position.z], rotateX: camera.rotation.y, rotateY: camera.rotation.x})

  //rotateLight.matrix = glm.rotateY(timeInMilliseconds*0.05);
  root.render(context);

  requestAnimationFrame(render);
}

function createLightSphere(resources) {
    return new ShaderSGNode(createProgram(gl, resources.vs, resources.fs), [
      new RenderSGNode(makeSphere(.2,10,10))
    ]);
  }

function createSceneGraph(gl, resources) {

  const root = new ShaderSGNode(createProgram(gl, resources.phong_vs, resources.phong_fs));

  rotateNode = new TransformationSGNode(mat4.create(), []);
  createRooms(resources);
  createPathways();
  root.append(rotateNode);

  rotateLight = new TransformationSGNode(mat4.create());
  let translateLight = new TransformationSGNode(glm.translate(-1,0,1));

  rotateLight.append(translateLight);
  translateLight.append(light);
  translateLight.append(createLightSphere(resources));
  root.append(rotateLight);
  root.append(new TransformationSGNode(glm.transform({translate: [-3.1,1.522,0.3], rotateY:90, scale: 0.01}), new AdvancedTextureSGNode(resources.tableTexture,  new RenderSGNode(resources.table))));

  return root;
}

function createRooms(resources){
  var firstRoomTextureNode = new AdvancedTextureSGNode(resources.tableTexture,[]);
  rotateNode.append(new TransformationSGNode(glm.transform({translate: [-2-2/3,0,0], scale: 1}), firstRoomTextureNode));
  createFirstRoom(firstRoomTextureNode);

  var secondRoomTextureNode = new AdvancedTextureSGNode(resources.tileTexture,[]);
  rotateNode.append(new TransformationSGNode(glm.transform({translate: [0,0,0], scale: 1}), secondRoomTextureNode));
  createSecondRoom(secondRoomTextureNode);

  var thirdRoomTextureNode = new AdvancedTextureSGNode(resources.tableTexture,[]);
  rotateNode.append(new TransformationSGNode(glm.transform({translate: [0,0,-2-2/3], scale: 1}), thirdRoomTextureNode));
  createThirdRoom(thirdRoomTextureNode);
}

function createFirstRoom(firstRoomTransformationNode){
  //front
  firstRoomTransformationNode.append(new TransformationSGNode(glm.transform({ translate: [0,1,0], rotateX: 0, scale: 1}), wall));
  //back
  firstRoomTransformationNode.append(new TransformationSGNode(glm.transform({translate:[0,1,2], rotateX: 0, scale:1}), wall));
  //top
  firstRoomTransformationNode.append(new TransformationSGNode(glm.transform({translate:[0,0,1], rotateX: 90, scale:1}), wall));
  //bottom
  firstRoomTransformationNode.append(new TransformationSGNode(glm.transform({translate:[0,2,1], rotateX: 90, scale:1}), wall));
  //right
  var rightWall =new TransformationSGNode(glm.transform({translate:[1,1,1], rotateY: 90, scale:1}), []);
  addDoorSide(rightWall);
  firstRoomTransformationNode.append(rightWall);
  //left
  firstRoomTransformationNode.append(new TransformationSGNode(glm.transform({translate:[-1,1,1], rotateY: 90, scale:1}), wall));

}

function createSecondRoom(secondRoomTranformationNode){
  //front
  var frontWall = new TransformationSGNode(glm.transform({translate: [0,1,0], rotateX: 0, scale: 1}), []);
  frontWall = addDoorSide(frontWall);
  secondRoomTranformationNode.append(frontWall);
  //back
  secondRoomTranformationNode.append(new TransformationSGNode(glm.transform({translate:[0,1,2], rotateX: 0, scale:1}), wall));
  //top
  secondRoomTranformationNode.append(new TransformationSGNode(glm.transform({translate:[0,0,1], rotateX: 90, scale:1}), wall));
  //bottom
  secondRoomTranformationNode.append(new TransformationSGNode(glm.transform({translate:[0,2,1], rotateX: 90, scale:1}), wall));
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
  createFirstPathway(rotateNode,  new TransformationSGNode(glm.transform({translate: [-1-1/3,1,2/3], scale: 1/3}),[]));
  createSecondPathway(rotateNode,  new TransformationSGNode(glm.transform({translate:[-1/3,1,-1/3], rotateY:90, scale: 1/3}),[]));
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
    const delta = { x : mouse.pos.x - pos.x, y: mouse.pos.y - pos.y };
    if (mouse.leftButtonDown) {
  		camera.rotation.x += delta.x;
  		camera.rotation.y += delta.y;
    }
    mouse.pos = pos;
  });
  canvas.addEventListener('mouseup', function(event) {
    mouse.pos = toPos(event);
    mouse.leftButtonDown = false;
  });
  //register globally
  document.addEventListener('keypress', function(event) {
    if (event.code === 'KeyR') {
      camera.rotation.x = 0;
  		camera.rotation.y = 0;
      camera.position.x = 0;
      camera.position.y = 0;
      camera.position.z = 0;
    }
    if (event.code === 'KeyW') {
      camera.position.z += -0.3;
    }
    if (event.code === 'KeyS') {
      camera.position.z += 0.3;
    }
    if (event.code === 'KeyA') {
      camera.position.x += 0.3;
    }
    if (event.code === 'KeyD') {
      camera.position.x += -0.3;
    }
  });
}


loadResources({
  vs: 'shader/empty.vs.glsl',
  fs: 'shader/empty.fs.glsl',
  phong_vs: 'shader/phong.vs.glsl',
  phong_fs: 'shader/phong.fs.glsl',
  table: 'models/table/Table.obj',
  tableTexture: 'models/table/texture/Texture-1.jpg',
  tileTexture: 'textures/bathroom/tiles/Tiles.jpg'
}).then(function (resources) {
  init(resources);
  render(0);
});
