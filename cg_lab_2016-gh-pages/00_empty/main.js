//the OpenGL context
var gl = null;
var shaderProgram = null;
var root = null;
var canvasWidth = 800;
var canvasHeight = 800;
var aspectRatio = canvasWidth / canvasHeight;
var quadVertexBuffer, quadColorBuffer;
var rotateNode;
const camera = {
  rotation: {
    x: 0,
    y: 0
  }
};

function init(resources) {
  gl = createContext(canvasWidth , canvasHeight);
  gl.enable(gl.DEPTH_TEST);
//  shaderProgram = createProgram(gl, resources.vs, resources.fs);
  root = createSceneGraph(gl, resources);
  initInteraction(gl.canvas);

}

function render(timeInMilliseconds) {
  checkForWindowResize(gl);
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), 30, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  context.viewMatrix = mat4.lookAt(mat4.create(), [0,-1,-4], [0,0,0], [0,1,0]);
  context.sceneMatrix = mat4.multiply(mat4.create(),
                            glm.rotateY(camera.rotation.x),
                            glm.rotateX(camera.rotation.y));

  //rotateNode.matrix = glm.rotateY(timeInMilliseconds*-0.01);
  //context.sceneMatrix = mat4.create();

  root.render(context);

  requestAnimationFrame(render);
}

function createSceneGraph(gl, resources) {

  const root = new ShaderSGNode(createProgram(gl, resources.vs, resources.fs));

  rotateNode = new TransformationSGNode(mat4.create(), []);
  createRooms();
  createPathways();
  root.append(rotateNode);
  return root;
}

function createRooms(){
  let floor = new RenderSGNode(makeRect());
  createFirstRoom(rotateNode, new TransformationSGNode(glm.transform({translate: [-1.5,-1,0], scale: 0.8}),[]));
  createSecondRoom(rotateNode, new TransformationSGNode(glm.transform({translate: [0.5,-1,0], scale: 0.8}),[]));
  createThirdRoom(rotateNode, new TransformationSGNode(glm.transform({translate: [0.5,-1,-2], scale: 0.8}),[]));
}

function createFirstRoom(node, firstRoomTransformationNode){
  createRoom(firstRoomTransformationNode);
  node.append(firstRoomTransformationNode);
}

function createSecondRoom(node, secondRoomTranformationNode){
  createRoom(secondRoomTranformationNode);
  node.append(secondRoomTranformationNode);
}

function createThirdRoom(node, thirdRoomTranformationNode){
  createRoom(thirdRoomTranformationNode);
  node.append(thirdRoomTranformationNode);
}

function createRoom(node){
  let floor = new RenderSGNode(makeRect());
  //front
  node.append(new TransformationSGNode(glm.transform({ translate: [0,1,0], rotateX: 0, scale: 1}),floor));
  //back
  node.append(new TransformationSGNode(glm.transform({translate:[0,1,2], rotateX: 0, scale:1}), floor));
  //top
  node.append(new TransformationSGNode(glm.transform({translate:[0,0,1], rotateX: 90, scale:1}), floor));
  //bottom
  node.append(new TransformationSGNode(glm.transform({translate:[0,2,1], rotateX: 90, scale:1}), floor));
  //right
  node.append(new TransformationSGNode(glm.transform({translate:[1,1,1], rotateY: 90, scale:1}), floor));
  //left
  node.append(new TransformationSGNode(glm.transform({translate:[-1,1,1], rotateY: 90, scale:1}), floor));
}

function createPathways(){
  createFirstPathway(rotateNode,  new TransformationSGNode(glm.transform({translate: [-0.45,0,0.5], scale: [0.5,0.5,0.5]}),[]));
  createSecondPathway(rotateNode,  new TransformationSGNode(glm.transform({translate:[0.25,0,-0.25],rotateY:90, scale: [0.5,0.5,0.5]}),[]));
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
  let floor = new RenderSGNode(makeRect());
  //front
  node.append(new TransformationSGNode(glm.transform({ translate: [0,0.5,0], rotateX: 0, scale: [0.5,0.75,0.5]}),floor));
  //back
  node.append(new TransformationSGNode(glm.transform({translate:[0,0.5,1], rotateX: 0, scale:[0.5,0.75,0.5]}), floor));
  //top
  node.append(new TransformationSGNode(glm.transform({translate:[0,-0.25,0.5], rotateX: 90, scale:[0.5,0.5,0.5]}), floor));
  //bottom
  node.append(new TransformationSGNode(glm.transform({translate:[0,1.25,0.5], rotateX: 90, scale:[0.5,0.5,0.5]}), floor));
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
    //TASK 0-1 add delta mouse to camera.rotation if the left mouse button is pressed
    if (mouse.leftButtonDown) {
      //add the relative movement of the mouse to the rotation variables
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
    //https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
    if (event.code === 'KeyR') {
      camera.rotation.x = 0;
  		camera.rotation.y = 0;
    }
  });
}


loadResources({
  vs: 'shader/empty.vs.glsl',
  fs: 'shader/empty.fs.glsl'
}).then(function (resources) {
  init(resources);
  render(0);
});
