//Standard Globals
var gl = null;
var shaderProgram = null;
var root = null;
var canvasWidth = 1200;
var canvasHeight = 800;

var freeCamera=false;

//
//------------------------------
//
// textures used for multiTextureing
var multiTexture;
var multiTexture2;
var multiTextureBitmap;//bitmap for mutlitexture
//Objects & Models

////General
var wall = new MaterialSGNode([new RenderSGNode(makeRect())]);
var lamp = new MaterialSGNode([new RenderSGNode(makeLamp())]);
var cuboid = new MaterialSGNode([new RenderSGNode(makeCuboid())]);

////Bed
var bedsteadMaterial, bedMattressMaterial;

////Desk
var deskMaterial, chairMaterial;

////Ceiling Lamp
var ceilLampMaterial;

//
//------------------------------
//

//lights
var bedLightNode;
var ceilingLightNode = new LightSGNode();
var flashLightLightNode = new LightSGNode();
var kitchenCeilingLightNode = new LightSGNode();



//Particle system
var particleSytem;
var numberOfParticles=150;

//
//------------------------------
//

//Camera Globals
var currentLookAt = [0,0,0];
var currentCameraPos = [-2,0,0];
var currentUpVector = [0,1,0];
var currentCameraRightVector = [1,0,0];
var worldUpVector = [0,1,0];

var currentPitch = 45.0;
var currentYaw = 90.0;

var cameraFlightArray = [];

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
var armRotationPitch = 90;
var bodyRotationYaw = 0;



//// Flashlight
var flashLightTransformationNode;
var flashLightRotation

//
//------------------------------
//

//Animation Array
var animationArray = [];

//
//------------------------------
//
//------------------------------
//

//Render Section

function render(timeInMilliseconds) {
  checkForWindowResize(gl);
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (freeCamera){//select Animation according to room

      if (currentCameraPos[0]<=-1.5&&currentCameraPos[0]>=-3.7&&currentCameraPos[1]<=2&&currentCameraPos[1]>=0&&currentCameraPos[2]<=2&&currentCameraPos[2]>=0){
        renderBody(timeInMilliseconds%13000); //0-9000Millisecunden firstroom
      } else if (currentCameraPos[0]<=1&&currentCameraPos[0]>=-1.5&&currentCameraPos[1]<=2&&currentCameraPos[1]>=0&&currentCameraPos[2]<=2&&currentCameraPos[2]>=-0.5) {
        renderBody(11000+timeInMilliseconds%13000);
        renderParticleSystem(11000+timeInMilliseconds%13000);
      } else if (currentCameraPos[0]<=1&&currentCameraPos[0]>=-1&&currentCameraPos[1]<=2&&currentCameraPos[1]>=0&&currentCameraPos[2]<=-0.5&&currentCameraPos[2]>=-2.7) {
        renderBody(20000+timeInMilliseconds%10000);
      }
    //Coordinates for room
    //firstroom  x(-1.5,-3.7) y(0,2) z(2,0)
    //secondroom x(1,-1.5) y(0,2) z(2, -0.5)
    //thirdRoom  x(1,-1) y(0,2) z(-0.5,-2.7)
  } else {

    var relativeTimeInMilliseconds = timeInMilliseconds%30000;
    //Render Objects
    renderBody(relativeTimeInMilliseconds);
    renderParticleSystem(relativeTimeInMilliseconds);
    renderCameraFlight(relativeTimeInMilliseconds);
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  calculateCameraVectors();

  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), 30, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  context.viewMatrix = mat4.lookAt(mat4.create(), currentCameraPos, vec3.add(vec3.create(), currentCameraPos,currentLookAt), currentUpVector);
  context.sceneMatrix = mat4.create();

  root.render(context);
  requestAnimationFrame(render);
}



function renderBody(relativeTimeInMilliseconds){
  if(between(relativeTimeInMilliseconds, 6000,15000)){
    isFlashlightPickedUp = true;
  } else {
    isFlashlightPickedUp = false;
  }

  var animation = getBetweenAnimation(relativeTimeInMilliseconds);
  setFigureTranslation(animation, relativeTimeInMilliseconds);
  setFigureRotation(animation, relativeTimeInMilliseconds);
  setFlashLightTranslation(animation, relativeTimeInMilliseconds);
  swingArm(relativeTimeInMilliseconds);

}

function setFigureTranslation(animation, relativeTimeInMilliseconds){
  var translation = getFigureAnimationInterpolationTranslation(animation, relativeTimeInMilliseconds);
  figureTransformationNode.matrix[12] = translation[0];
  figureTransformationNode.matrix[13] = translation[1];
  figureTransformationNode.matrix[14] = translation[2];
}

function setFigureRotation(animation, relativeTimeInMilliseconds){
  var rotation = getFigureAnimationInterpolationRotationY(animation, relativeTimeInMilliseconds);
  mat4.multiply(figureTransformationNode.matrix, figureTransformationNode.matrix, glm.rotateY(rotation));
  mat4.multiply(figureTransformationNode.matrix, figureTransformationNode.matrix, glm.rotateY(-bodyRotationYaw));
  bodyRotationYaw = rotation;
}

function setFlashLightTranslation(animation, relativeTimeInMilliseconds){
  var translation = getFlashLightAnimationInterpolationTranslation(animation, relativeTimeInMilliseconds);
  flashLightTransformationNode.matrix[12] = translation[0];
  flashLightTransformationNode.matrix[13] = translation[1];
  flashLightTransformationNode.matrix[14] = translation[2];
}

function swingArm(relativeTimeInMilliseconds){
  if(!isFlashlightPickedUp){
    var time = relativeTimeInMilliseconds%500;
    if(relativeTimeInMilliseconds%1000 < 500){
      resetArmTranslation(time);
      var rotation = getInterpolationRotation(90, 180, time, 0, 500);
      renderArm(rightArmTransformationMatrix.matrix, -rotation, armRotationPitch);
      renderArm(leftArmTransformationMatrix.matrix, rotation, -armRotationPitch);
      armRotationPitch = rotation;
    }
    if(relativeTimeInMilliseconds%1000 >= 500){
      var rotation = getInterpolationRotation(180, 90, time, 0, 500);
      renderArm(rightArmTransformationMatrix.matrix, -rotation, armRotationPitch);
      renderArm(leftArmTransformationMatrix.matrix, rotation, -armRotationPitch);
      armRotationPitch = rotation;
    }

  }
}

function resetArmTranslation(time){
  if(time < 15){
    leftArmTransformationMatrix.matrix[12] = 0.25;
    leftArmTransformationMatrix.matrix[13] = 0.05;
    leftArmTransformationMatrix.matrix[14] = 0;

    rightArmTransformationMatrix.matrix[12] = -0.25;
    rightArmTransformationMatrix.matrix[13] = 0.05;
    rightArmTransformationMatrix.matrix[14] = 0;
  }
}

function renderArm(armTransformationMatrix, rotation, oldRotation){
  var translationArm = mat4.getTranslation(vec3.create(), armTransformationMatrix);
  mat4.multiply(armTransformationMatrix, armTransformationMatrix, glm.translate(translationArm[0]+1, translationArm[1], translationArm[2]+1));
  mat4.multiply(armTransformationMatrix, armTransformationMatrix, glm.rotateX(rotation));
  mat4.multiply(armTransformationMatrix, armTransformationMatrix, glm.rotateX(oldRotation));
  mat4.multiply(armTransformationMatrix, armTransformationMatrix, glm.translate(-translationArm[0]-1, -translationArm[1], -translationArm[2]-1));

}

function renderParticleSystem(relativeTimeInMilliseconds){
    if (between(relativeTimeInMilliseconds,16000,21000)){
      if(!particleSystem.active){
        particleSystem.enable();
      }
      particleSystem.transform(); //animation of article system if activated
    }else {
      if(particleSystem.active){
        particleSystem.disable();
      }
    }
  }

function renderCameraFlight(relativeTimeInMilliseconds){
  var camera = getBetweenCamera(relativeTimeInMilliseconds);
  setCameraPosTranslation(camera, relativeTimeInMilliseconds);
  setCameraPitch(camera, relativeTimeInMilliseconds);
  setCameraYaw(camera, relativeTimeInMilliseconds);
}

function setCameraPosTranslation(camera, relativeTimeInMilliseconds){
  var translation = getInterpolationCameraPos(camera, relativeTimeInMilliseconds);
  currentCameraPos[0] = translation[0];
  currentCameraPos[1] = translation[1];
  currentCameraPos[2] = translation[2];
}

function setCameraPitch(camera, relativeTimeInMilliseconds){
  var rotation = getInterpolatedPitch(camera, relativeTimeInMilliseconds);
  currentPitch = rotation;
}

function setCameraYaw(camera, relativeTimeInMilliseconds){
  var rotation = getInterpolatedYaw(camera, relativeTimeInMilliseconds);
  currentYaw = rotation;
}

//
//------------------------------
//

//Init Section

function init(resources) {
  gl = createContext(canvasWidth , canvasHeight);
  gl.enable(gl.DEPTH_TEST);
  initMultitexturing(resources);// must be initialized bevor the SceneGraph
  root = createSceneGraph(gl, resources);
  initInteraction(gl.canvas);
  initWall();
  initCuboid();
  initLamp();
  initFlashLightLightNode();
  initKitchenCeilingLightNode();
  initBedLightNode();
  initCeilingLightNode();
  initBedSteadMaterial(resources);
  initBedMattressMaterial(resources);
  initDeskMaterial(resources);
  initCeilingLampMaterial(resources);
  initAnimationArray();
  initCameraFlightArray();
  initParticleSystem(resources);
  initPoint(resources);
}

function initMultitexturing(resources){
 initTextures(resources.bitmap);
 multiTextureBitmap=multiTexture;
 initTextures(resources.land);
 multiTexture2=multiTexture;
 initTextures(resources.woodChairTexture);
}

function initTextures(texture) {
  //create texture object
  multiTexture = gl.createTexture();
  //select a texture unit
  gl.activeTexture(gl.TEXTURE0);
  //bind texture to active texture unit
  gl.bindTexture(gl.TEXTURE_2D, multiTexture);
  //set sampling parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  //upload texture data
  gl.texImage2D(gl.TEXTURE_2D, //texture unit target == texture type
    0, //level of detail level (default 0)
    gl.RGBA, //internal format of the data in memory
    gl.RGBA, //image format (should match internal format)
    gl.UNSIGNED_BYTE, //image data type
    texture); //actual image data
  //clean up/unbind texture
  gl.bindTexture(gl.TEXTURE_2D, null);
}

function initAnimationArray(){

  animationArray.push({ start: 0, end: 2000,
                        translationFigureOld: [-2.0,1.6,0.3], translationFigureNew: [-2.0,1.6,1.0],
                        translationFlashLightOld: [-2.5,1.5,0.5], translationFlashLightNew: [-2.5,1.5,0.5],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: 0, rotationFigureY: 0});

  animationArray.push({ start: 2000, end: 3000,
                        translationFigureOld: [-2.0,1.6,1.0], translationFigureNew: [-2.0,1.6,1.0],
                        translationFlashLightOld: [-2.5,1.5,0.5], translationFlashLightNew: [-2.5,1.5,0.5],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: 0, rotationFigureY: -90});

  animationArray.push({ start: 3000, end: 4000,
                        translationFigureOld: [-2.0,1.6,1.0], translationFigureNew: [-2.4,1.6,1.0],
                        translationFlashLightOld: [-2.5,1.5,0.5], translationFlashLightNew: [-2.5,1.5,0.5],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: -90, rotationFigureY: -90});

  animationArray.push({ start: 4000, end: 5000,
                        translationFigureOld: [-2.4,1.6,1.0], translationFigureNew: [-2.4,1.6,1.0],
                        translationFlashLightOld: [-2.5,1.5,0.5], translationFlashLightNew: [-2.5,1.5,0.5],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: -90, rotationFigureY: 0});


  animationArray.push({ start: 5000, end: 6000,
                        translationFigureOld: [-2.4,1.6,1.0], translationFigureNew: [-2.4,1.6,0.7],
                        translationFlashLightOld: [-2.5,1.5,0.5], translationFlashLightNew: [-2.5,1.5,0.5],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: 0, rotationFigureY: 0});

  animationArray.push({ start: 6000, end: 7000,
                        translationFigureOld: [-2.4,1.6,0.7], translationFigureNew: [-2.4,1.6,0.7],
                        translationFlashLightOld: [-2.5,1.5,0.5], translationFlashLightNew: [-2.2,1.7,0.7],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: 0, rotationFigureY: 0});

  animationArray.push({ start: 7000, end: 8000,
                        translationFigureOld: [-2.4,1.6,0.7], translationFigureNew: [-2.4,1.6,1.0],
                        translationFlashLightOld: [-2.2,1.7,0.7], translationFlashLightNew: [-2.2,1.7,1.0],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: 0, rotationFigureY: 0});

  animationArray.push({ start: 8000, end: 9000,
                        translationFigureOld: [-2.4,1.6,1.0], translationFigureNew: [-2.4,1.6,1.0],
                        translationFlashLightOld: [-2.2,1.7,1], translationFlashLightNew: [-2.35,1.7,0.8],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: 0, rotationFigureY: 90});

  animationArray.push({ start: 9000, end: 14000,
                        translationFigureOld: [-2.4,1.6,1.0], translationFigureNew: [0,1.6,1.0],
                        translationFlashLightOld: [-2.35,1.7,0.8], translationFlashLightNew: [0,1.7,0.8],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: 90, rotationFigureY: 90});

  //Let FlashLight drop
  animationArray.push({ start: 14000, end: 15000,
                        translationFigureOld: [0,1.6,1.0], translationFigureNew: [0,1.6,1.0],
                        translationFlashLightOld:[0,1.7,0.8], translationFlashLightNew: [0,1.98,0.8],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: 90, rotationFigureY: 90});

  animationArray.push({ start: 15000, end: 16000,
                        translationFigureOld: [0,1.6,1.0], translationFigureNew: [0,1.6,1.0],
                        translationFlashLightOld:[0,1.98,0.8], translationFlashLightNew: [0,1.98,0.8],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: 90, rotationFigureY: 0});

  animationArray.push({ start: 16000, end: 17000,
                        translationFigureOld: [0,1.6,1.0], translationFigureNew: [0,1.6,1.2],
                        translationFlashLightOld: [0,1.98,0.8], translationFlashLightNew: [0,1.98,0.8],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: 0, rotationFigureY: 0});

  animationArray.push({ start: 17000, end: 19000,
                        translationFigureOld: [0,1.6,1.2], translationFigureNew: [0,1.6,1.2],
                        translationFlashLightOld: [0,1.98,0.8], translationFlashLightNew: [0,1.98,0.8],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: 0, rotationFigureY: 0});

  animationArray.push({ start: 19000, end: 20000,
                        translationFigureOld: [0,1.6,1.2], translationFigureNew: [0,1.6,1.2],
                        translationFlashLightOld:[0,1.98,0.8], translationFlashLightNew: [0,1.98,0.8],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: 0, rotationFigureY: 180});

  animationArray.push({ start: 20000, end: 26000,
                        translationFigureOld: [0,1.6,1.2], translationFigureNew: [0,1.6,-1.7],
                        translationFlashLightOld:[0,1.98,0.8], translationFlashLightNew: [0,1.98,0.8],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: 180, rotationFigureY: 180});

  animationArray.push({ start: 26000, end: 27000,
                        translationFigureOld: [0,1.6,-1.7], translationFigureNew: [0,1.6,-1.7],
                        translationFlashLightOld:[0,1.98,0.8], translationFlashLightNew: [0,1.98,0.8],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: 180, rotationFigureY: 90});

  animationArray.push({ start: 27000, end: 28000,
                        translationFigureOld: [0,1.6,-1.7], translationFigureNew: [0,1.6,-1.7],
                        translationFlashLightOld:[0,1.98,0.8], translationFlashLightNew: [0,1.98,0.8],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: 90, rotationFigureY: 0});

  animationArray.push({ start: 28000, end: 29000,
                        translationFigureOld: [0,1.6,-1.7], translationFigureNew: [0,1.6,-1.7],
                        translationFlashLightOld:[0,1.98,0.8], translationFlashLightNew: [0,1.98,0.8],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: 0, rotationFigureY: -90});
  animationArray.push({ start: 29000, end: 30000,
                        translationFigureOld: [0,1.6,-1.7], translationFigureNew: [0,1.6,-1.7],
                        translationFlashLightOld:[0,1.98,0.8], translationFlashLightNew: [0,1.98,0.8],
                        rotationFlashLightOldX:0, rotationFlashLightX: 0,
                        rotationFigureOldY: -90, rotationFigureY: -180});
}

function initCameraFlightArray(){
  cameraFlightArray.push({ start: 0, end: 2000,
                            cameraPosOld: [-2,0.05,0.05], cameraPosNew: [-2,0.05,0.05],
                            pitchOld: 60, pitchNew: 40,
                            yawOld: 90, yawNew: 90});

  cameraFlightArray.push({ start: 2000, end: 9000,
                            cameraPosOld: [-2,0.05,0.05], cameraPosNew: [-2,0.05,0.05],
                            pitchOld: 40, pitchNew: 40,
                            yawOld: 90, yawNew: 120});

  cameraFlightArray.push({ start: 9000, end: 11000,
                            cameraPosOld: [-2,0.05,0.05], cameraPosNew: [-3.5,1,1],
                            pitchOld: 40, pitchNew: 40,
                            yawOld: 120, yawNew: 30});

  cameraFlightArray.push({ start: 11000, end: 15000,
                            cameraPosOld: [-0,1,1], cameraPosNew: [0.3,1,1],
                            pitchOld: 40, pitchNew: 40,
                            yawOld: 180, yawNew: 180});

  cameraFlightArray.push({ start: 15000, end: 16000,
                            cameraPosOld: [0.3,1,1], cameraPosNew: [0.3,1,0.5],
                            pitchOld: 40, pitchNew: 40,
                            yawOld: 180, yawNew: 90});


  cameraFlightArray.push({ start: 16000, end: 20000,
                            cameraPosOld: [0.3,1,0.5], cameraPosNew: [0,1,0.5],
                            pitchOld: 40, pitchNew: 40,
                            yawOld: 90, yawNew: 90});

  cameraFlightArray.push({ start: 20000, end: 22000,
                            cameraPosOld: [0,1,0.5], cameraPosNew: [0,1,1],
                            pitchOld: 40, pitchNew: 40,
                            yawOld: 90, yawNew: 270});


  cameraFlightArray.push({ start: 22000, end: 25000,
                            cameraPosOld: [0,1,1.2], cameraPosNew: [0,1,-1],
                            pitchOld: 40, pitchNew: 40,
                            yawOld: 270, yawNew: 270});

  cameraFlightArray.push({ start: 25000, end: 30000,
                            cameraPosOld: [0.5,0.3,-2], cameraPosNew: [0.5,0.3,-2],
                            pitchOld: 60, pitchNew: 50,
                            yawOld: 130, yawNew: 130});
}

function initPoint(resources){
  root.append(new TransformationSGNode(glm.transform({translate:[-1,0,-2.7]}), new AdvancedTextureSGNode(resources.woodChairTexture,new RenderSGNode(makeSphere(0.05,10,10)))));
}

function initParticleSystem(resources){
  particleSystem = new ParticleSystem(resources);
}

function initWall(){
  wall.ambient = [0.9, 0.9, 0.9, 1];
  wall.diffuse = [0.9, 0.9, 0.9, 1];
  wall.specular = [0.9, 0.9, 0.9, 1];
  wall.shininess = 5;
}

function initLamp(){
  lamp.ambient = [0, 0, 0, 1];
  lamp.diffuse = [0.9, 0.9, 0.9, 1];
  lamp.specular = [0.9, 0.9, 0.9, 1];
  lamp.shininess = 0.4;
}

function initCuboid(){
  cuboid.ambient = [0, 0, 0, 1];
  cuboid.diffuse = [0.1, 0.1, 0.1, 1];
  cuboid.specular = [0.9, 0.9, 0.9, 1];
  cuboid.shininess = 5;
}

function initCeilingLightNode(){
  ceilingLightNode.ambient = [0.1, 0.1, 0.1, 1];
  ceilingLightNode.diffuse = [0.1, 0.1, 0.1, 1];
  ceilingLightNode.specular = [0.1, 0.1, 0.1, 1];
  ceilingLightNode.position = [0, 0, 0];
  ceilingLightNode.uniform = 'u_light';
}

function initBedLightNode(){
  //SpotLight
  bedLightNode.ambient = [0.9, 0.9, 0.9, 1];
  bedLightNode.diffuse = [0.9, 0.9, 0.9, 1];
  bedLightNode.specular = [0.9, 0.9, 0.9, 1];
  bedLightNode.position = [0, 0, 0];
}

function initFlashLightLightNode(){
  flashLightLightNode.ambient = [0.2, 0.2, 0.2, 1];
  flashLightLightNode.diffuse = [0.2, 0.2, 0.2, 1];
  flashLightLightNode.specular = [0.2, 0.2, 0.2, 1];
  flashLightLightNode.position = [0, 0, 0];
  flashLightLightNode.uniform = 'u_light3';
}

function initKitchenCeilingLightNode(){
  kitchenCeilingLightNode.ambient = [0.1, 0.1, 0.1, 1];
  kitchenCeilingLightNode.diffuse = [0.1, 0.1, 0.1, 1];
  kitchenCeilingLightNode.specular = [0.1, 0.1, 0.1, 1];
  kitchenCeilingLightNode.position = [0, 0, 0];
  kitchenCeilingLightNode.uniform = 'u_light4';
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
  createPathways(resources);
  createDesk(resources);
  createBed(resources);
  createBedroomCeilLamp(resources);
  createBody(resources);
  createBedLightNode(resources);
  createFlashLighLightNode(resources);
  createBath(resources);
  createKitchen(resources);
  return root;
}

function setMaterials(resources){
    deskMaterial = new MaterialSGNode(new RenderSGNode(resources.table));
    chairMaterial = new MaterialSGNode(new RenderSGNode(resources.chair));
    ceilLampMaterial = new MaterialSGNode(new RenderSGNode(resources.ceilingLamp));
    bedMattressMaterial = new MaterialSGNode(new RenderSGNode(resources.bedMattress));
    bedsteadMaterial = new MaterialSGNode(new RenderSGNode(resources.bedstead));
    toiletMaterial=new MaterialSGNode(new RenderSGNode(resources.toilet));
    sinkMaterial=new MaterialSGNode(new RenderSGNode(resources.sink));
    frezzerMaterial=new MaterialSGNode(new RenderSGNode(resources.frezzer));
    tabMaterial = new MaterialSGNode(new RenderSGNode(resources.tab));
}

function createBedroomCeilLamp(resources){
  root.append(new TransformationSGNode(glm.transform({translate:[-2.66,0.001,1], scale: 0.001}),new AdvancedTextureSGNode(resources.ceilingLampTexture, ceilLampMaterial)));
  var ceilLight = new TransformationSGNode(glm.transform({translate:[-2.66,0.38,1], scale: 0.18}),[createLightSphere(resources), ceilingLightNode]);
  root.append(ceilLight);
}

function createBedLightNode(resources){
  bedLightNode = new SpotLightSGNode(vec3.create(), [], [0,-1,1], 30.0);
  root.append(new TransformationSGNode(glm.transform({translate:[-3.5,1.78,1.2], rotateX:90, scale: 0.1}),new AdvancedTextureSGNode(resources.sandTexture, lamp)));
  var descLight = new TransformationSGNode(glm.transform({translate:[-3.5,1.7,1.2], scale: 0.3}),[createLightSphere(resources), bedLightNode]);
  root.append(descLight);
}

function createFlashLighLightNode(resources){


  flashLightTransformationNode = new TransformationSGNode(glm.transform({translate:[-2.5,1.5,0.5], rotateY:90, scale: 0.02}),[]);
  flashLightTransformationNode.append(new TransformationSGNode(mat4.create(),new AdvancedTextureSGNode(resources.flashLightTexture, cuboid)));
  var flashLight = new TransformationSGNode(glm.transform({translate:[0,0,2]}),[createFlashLightSphere(resources), flashLightLightNode]);
  //flashLight.append(new ShaderSGNode(createProgram(gl, resources.light_vs, resources.light_fs),[new RenderSGNode(makeSphere(1,10,10))]));
  //flashLight.append(flashLightLightNode);
  flashLightTransformationNode.append(flashLight);
  root.append(flashLightTransformationNode);




}

function createLightSphere(resources) {
    return new ShaderSGNode(createProgram(gl, resources.light_vs, resources.light_fs),[new RenderSGNode(makeSphere(.2,10,10))]);
}

function createFlashLightSphere(resources) {
    return new ShaderSGNode(createProgram(gl, resources.light_vs, resources.light_fs),[new RenderSGNode(makeSphere(1,10,10))]);
}

function createKitchen(resources){
  root.append(new TransformationSGNode(glm.transform({translate: [0.9,2,-1.2], rotateX: 180, rotateY: -90, scale: 0.015}), new AdvancedTextureSGNode(resources.keramik, frezzerMaterial)));
  root.append(new TransformationSGNode(glm.transform({translate: [-0.3,1.65,-1.7], rotateX: 180, rotateY: 0, scale: [0.04,0.03,0.03]}), new AdvancedTextureSGNode(resources.woodChairTexture, chairMaterial)));
  createKitchenTable(resources);
  createKitchenCeilLamp(resources);
  }

  function createKitchenTable(resources){
  root.append(new TransformationSGNode(glm.transform({translate:[-0.02,1.75,-2.0], scale:[0.01,0.25,0.01]}), new AdvancedTextureSGNode(resources.woodChairTexture,new RenderSGNode(makeCuboid(1,1,1)))));
  root.append(new TransformationSGNode(glm.transform({translate:[-0.9,1.75,-2.0], scale:[0.01,0.25,0.01]}), new AdvancedTextureSGNode(resources.woodChairTexture,new RenderSGNode(makeCuboid(1,1,1)))));
  root.append(new TransformationSGNode(glm.transform({translate:[-0.02,1.75,-2.4], scale:[0.01,0.25,0.01]}), new AdvancedTextureSGNode(resources.woodChairTexture,new RenderSGNode(makeCuboid(1,1,1)))));
  root.append(new TransformationSGNode(glm.transform({translate:[-0.9,1.75,-2.4], scale:[0.01,0.25,0.01]}), new AdvancedTextureSGNode(resources.woodChairTexture,new RenderSGNode(makeCuboid(1,1,1)))));
  createTableMulti(resources);

  }

  function createTableMulti(resources){
  var node = new ShaderSGNode(createProgram(gl, resources.text_vs, resources.text_fs));
     let plate = new MaterialSGNode(new TextureSGNode(multiTexture,multiTexture2,multiTextureBitmap, new RenderSGNode(makeCuboid(1,1,1))));
     node.append(new TransformationSGNode(glm.transform({translate:[-0.5,1.5,-2.2], rotateY: -90, rotateX: 90, scale:[0.01,0.30,0.25]}), [plate]));
    root.append(node);
  }

function createKitchenCeilLamp(resources){
  root.append(new TransformationSGNode(glm.transform({translate:[0,0.001,-2], scale: 0.001}),new AdvancedTextureSGNode(resources.ceilingLampTexture, ceilLampMaterial)));
  var ceilLight = new TransformationSGNode(glm.transform({translate:[0,0.38,-2], scale: 0.18}),[createLightSphere(resources), kitchenCeilingLightNode]);
  root.append(ceilLight);
}

function createBath(resources){
  createBathtub(resources);
  root.append(new TransformationSGNode(glm.transform({translate: [-0.7,2.0,1.95], rotateX: 180, rotateY: 0, scale: 0.01}), new AdvancedTextureSGNode(resources.keramik, sinkMaterial)));
  root.append(new TransformationSGNode(glm.transform({translate: [0.80,2,0.25], rotateX: 180, rotateY: -90, scale: 0.0005}), new AdvancedTextureSGNode(resources.keramik, toiletMaterial)));
  root.append(new TransformationSGNode(glm.transform({translate: [0.89,1.4,1.7], rotateX: 180, rotateY: 0, scale: 0.03}), new AdvancedTextureSGNode(resources.metal, tabMaterial)));
}

function createBathtub(resources){
  root.append(new TransformationSGNode(glm.transform({translate:[0.99,1.80,1.70], scale:[0.01,0.20,0.15]}),new AdvancedTextureSGNode(resources.sandTexture, new RenderSGNode(makeCuboid(1,1,1)))));
  root.append(new TransformationSGNode(glm.transform({translate:[-0.31,1.80,1.70], scale:[0.01,0.20,0.15]}), new AdvancedTextureSGNode(resources.sandTexture,new RenderSGNode(makeCuboid(1,1,1)))));
  root.append(new TransformationSGNode(glm.transform({translate:[0.35,1.80,1.99], rotateY: -90, scale:[0.01,0.20,0.33]}), new AdvancedTextureSGNode(resources.sandTexture,new RenderSGNode(makeCuboid(1,1,1)))));
  root.append(new TransformationSGNode(glm.transform({translate:[0.35,1.80,1.40], rotateY: -90, scale:[0.01,0.20,0.33]}), new AdvancedTextureSGNode(resources.sandTexture,new RenderSGNode(makeCuboid(1,1,1)))));
  root.append(new TransformationSGNode(glm.transform({translate:[0.35,2,1.70], rotateY: -90, rotateX: 90, scale:[0.01,0.30,0.33]}), new AdvancedTextureSGNode(resources.sandTexture,new RenderSGNode(makeCuboid(1,1,1)))));
  root.append(new TransformationSGNode(glm.transform({translate:[0.35,1.7,1.70], rotateY: -90, rotateX: 90, scale:[0.01,0.30,0.33]}), new ShaderSGNode(createProgram(gl, resources.water_vs, resources.water_fs), new RenderSGNode(makeCuboid(1,1,1)))));
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
  figureTransformationNode = new TransformationSGNode(glm.transform({translate:[-2.0,1.6,0.3], rotateY:0, scale:0.6}), []);
  var texturedBodyPart = new AdvancedTextureSGNode(resources.skinTexture, cuboid);

  //Arms
  leftArmTransformationMatrix = new TransformationSGNode(glm.transform({ translate: [0.25,0.05,0], rotateY: 00, rotateX: 90, scale: [0.05,0.05,0.1]}), texturedBodyPart);
  rightArmTransformationMatrix = new TransformationSGNode(glm.transform({ translate: [-0.25,0.05,0], rotateY: 00, rotateX: 90, scale: [0.05,0.05,0.1]}), texturedBodyPart);
  figureTransformationNode.append(leftArmTransformationMatrix);
  figureTransformationNode.append(rightArmTransformationMatrix);

  //Legs
  leftLegTransformationMatrix = new TransformationSGNode(glm.transform({ translate: [0.15,0.5,0], rotateY: 00, rotateX: 90, scale: [0.05,0.05,0.1]}), texturedBodyPart);
  rightLegTransformationMatrix = new TransformationSGNode(glm.transform({ translate: [-0.15,0.5,0], rotateY: 00, rotateX: 90, scale: [0.05,0.05,0.1]}), texturedBodyPart);
  figureTransformationNode.append(leftLegTransformationMatrix);
  figureTransformationNode.append(rightLegTransformationMatrix);

  //Body
  figureTransformationNode.append(new TransformationSGNode(glm.transform({ translate: [0,0,0], rotateY: 00, rotateX: 90, scale: [0.2,0.1,0.15]}), texturedBodyPart));

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
  var thirdRoomFloorTextureNode = new AdvancedTextureSGNode(resources.woodFloorTexture,[]);
  root.append(new TransformationSGNode(glm.transform({translate: [0,0,-2-2/3], scale: 1}),[ thirdRoomTextureNode, thirdRoomFloorTextureNode]));
  createThirdRoom(thirdRoomTextureNode, thirdRoomFloorTextureNode);


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

function createThirdRoom(thirdRoomTranformationNode, thirdRoomFloorTextureNode){
  //front
  thirdRoomTranformationNode.append(new TransformationSGNode(glm.transform({ translate: [0,1,0], rotateX: 0, scale: 1}),wall));
  //back
  var backWall =new TransformationSGNode(glm.transform({translate:[0,1,2], rotateX: 0, scale:1}), []);
  backWall = addDoorSide(backWall);
  thirdRoomTranformationNode.append(backWall);
  //top
  thirdRoomTranformationNode.append(new TransformationSGNode(glm.transform({translate:[0,0,1], rotateX: 90, scale:1}), wall));
  //bottom
  thirdRoomFloorTextureNode.append(new TransformationSGNode(glm.transform({translate:[0,2,1], rotateX: 90, scale:1}), wall));
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

function createPathways(resources){
  createFirstPathway(root,  new TransformationSGNode(glm.transform({translate: [-1-1/3,1,2/3], scale: 1/3}),[]), resources);
  createSecondPathway(root,  new TransformationSGNode(glm.transform({translate:[-1/3,1,-1/3], rotateY:90, scale: 1/3}),[]), resources);
}

function createFirstPathway(node, firstPathwayTransformationNode, resources){
  createPathway(firstPathwayTransformationNode, resources);
  node.append(firstPathwayTransformationNode);
}

function createSecondPathway(node, secondPathwayTransformationNode, resources){
  createPathway(secondPathwayTransformationNode,resources);
  node.append(secondPathwayTransformationNode);
}

function createPathway(node, resources){
  //front
  node.append(new AdvancedTextureSGNode(resources.tableTexture,[new TransformationSGNode(glm.transform({ translate: [0,1.5,0], rotateX: 0, scale: [1,1.5,1]}),wall)]));
  //back
  node.append(new AdvancedTextureSGNode(resources.tableTexture, [new TransformationSGNode(glm.transform({translate:[0,1.5,2], rotateX: 0, scale:[1,1.5,1]}), wall)]));
  //top
  node.append(new AdvancedTextureSGNode(resources.tableTexture, [new TransformationSGNode(glm.transform({translate:[0,-0,1], rotateX: 90, scale:[1,1,1]}), wall)]));
  //bottom
  node.append(new AdvancedTextureSGNode(resources.woodFloorTexture, [new TransformationSGNode(glm.transform({translate:[0,3,1], rotateX: 90, scale:[1,1,1]}), wall)]));
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

  document.addEventListener('keyup', function(event) {
    if (event.code == 'Tab') {
      freeCamera=!freeCamera;
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

//Particle System

//init function for the Particle system
function ParticleSystem (resources){
  //set origin of the Particle Sytem
  this.originX =0.78;
  this.originY=1.38;
  this.originZ=1.7;
  this.particles = new Array(); //storage for particles
  this.active=true;  // is particle system active

  //init all particles and add to the array and append the root
  for (var i=0;i<numberOfParticles;i++){
    this.drop = new Particle(resources);
    this.drop.life=Math.floor(Math.random()*10);  //set a live random between 0 and 100
    this.particles.push(this.drop); // add particles into the array
    root.append(this.drop);// append root with the new node
  }
}

//function for rendering the Particle System
ParticleSystem.prototype.transform = function (resources) {
  if (this.active){ //check if Particle System is active, camera close by
    for (var i=0; i<numberOfParticles;i++){// for each particle
     this.particles[i].life=this.particles[i].life-1;   // lower the life by one
     if (this.particles[i].life<0){ //if particle death
       this.particles[i].matrix = glm.transform({translate:[this.originX+Math.random()/100, this.originY, this.originZ+Math.random()/100], scale: 1});
       //refresh matrix at the origin
       this.particles[i].life=Math.floor(Math.random()*100);
       //refresh life with a lifespan between 0 and 1000
     } else {
       mat4.multiply(this.particles[i].matrix,this.particles[i].matrix, glm.transform({translate: [0,0.004,0]}));
       //if paricle is alive perform a transformation
     }
    }
  }
};

 //function to enable of the particle System animation
ParticleSystem.prototype.enable = function () {
 this.active=true;
};

//function to disable the particle System animation and reset the particles
ParticleSystem.prototype.disable = function () {
 this.active=false;
 //reset all drop to origin
 for (var i=0; i<numberOfParticles;i++){
   this.particles[i].matrix = glm.transform({translate:[this.originX+Math.random()/100, this.originY, this.originZ+Math.random()/100], scale: 1});
   this.particles[i].life=Math.floor(Math.random()*100);
 }
};

//standard contrutor for each particel it has a resource and xyz Coordinates)
function Particle(resources){
  this.life=0;// life will be set later
  //this.matrix = glm.transform({translate:[x,y,z], scale: 1}); //set position of the paricle
  return new TransformationSGNode(mat4.create(),[createWaterDrop(resources)]); //create the sphere representing the water drop

 //function for creatin the sphere node
  function createWaterDrop(resources) {
      return new ShaderSGNode(createProgram(gl, resources.water_vs, resources.water_fs), [
        new RenderSGNode(makeSphere(0.008,10,10))
      ]);
  }
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

function getBetweenAnimation(currentTime){
  var arrayLength = animationArray.length;
  for (var i = 0; i < arrayLength; i++) {
    var lower = animationArray[i].start;
    var upper = animationArray[i].end;
    if(between(currentTime, lower, upper)){
      return animationArray[i];
    }
  }
}

function getBetweenCamera(currentTime){
  var arrayLength = cameraFlightArray.length;
  for (var i = 0; i < arrayLength; i++) {
    var lower = cameraFlightArray[i].start;
    var upper = cameraFlightArray[i].end;
    if(between(currentTime, lower, upper)){
      return cameraFlightArray[i];
    }
  }
}

function between(time, lower, upper){
  return (time>=lower && time < upper);
}

function getFigureAnimationInterpolationTranslation(animation, current){
  var translationOld = animation.translationFigureOld;
  var translationNew = animation.translationFigureNew;
  var relativePassedTime = (current - animation.start)/(animation.end-animation.start);
  var translation = vec3.create();
  translation[0] = translationOld[0] + (translationNew[0] - translationOld[0]) * relativePassedTime;
  translation[1] = translationOld[1] + (translationNew[1] - translationOld[1]) * relativePassedTime;
  translation[2] = translationOld[2] + (translationNew[2] - translationOld[2]) * relativePassedTime;
  return translation;
}

function getFigureAnimationInterpolationRotationY(animation, current){
  var relativePassedTime = (current - animation.start)/(animation.end-animation.start);
  return animation.rotationFigureOldY + (animation.rotationFigureY - animation.rotationFigureOldY) * relativePassedTime;
}

function getFlashLightAnimationInterpolationTranslation(animation, current){
  var translationOld = animation.translationFlashLightOld;
  var translationNew = animation.translationFlashLightNew;
  var translation = vec3.create();
  var relativePassedTime = (current - animation.start)/(animation.end-animation.start);
  translation[0] = translationOld[0] + (translationNew[0] - translationOld[0]) * relativePassedTime;
  translation[1] = translationOld[1] + (translationNew[1] - translationOld[1]) * relativePassedTime;
  translation[2] = translationOld[2] + (translationNew[2] - translationOld[2]) * relativePassedTime;
  return translation;
}

function getInterpolationLookAt(camera, current){
  var translationOld = camera.lookAtOld;
  var translationNew = camera.lookAtNew;
  var relativePassedTime = (current - camera.start)/(camera.end-camera.start);
  var translation = vec3.create();
  translation[0] = translationOld[0] + (translationNew[0] - translationOld[0]) * relativePassedTime;
  translation[1] = translationOld[1] + (translationNew[1] - translationOld[1]) * relativePassedTime;
  translation[2] = translationOld[2] + (translationNew[2] - translationOld[2]) * relativePassedTime;
  return translation;
}

function getInterpolationCameraPos(camera, current){
  var translationOld = camera.cameraPosOld;
  var translationNew = camera.cameraPosNew;
  var relativePassedTime = (current - camera.start)/(camera.end-camera.start);
  var translation = vec3.create();
  translation[0] = translationOld[0] + (translationNew[0] - translationOld[0]) * relativePassedTime;
  translation[1] = translationOld[1] + (translationNew[1] - translationOld[1]) * relativePassedTime;
  translation[2] = translationOld[2] + (translationNew[2] - translationOld[2]) * relativePassedTime;
  return translation;
}

function getInterpolatedPitch(camera, current){
  var relativePassedTime = (current - camera.start)/(camera.end-camera.start);
  return camera.pitchOld + (camera.pitchNew - camera.pitchOld) * relativePassedTime;
}

function getInterpolatedYaw(camera, current){
    var relativePassedTime = (current - camera.start)/(camera.end-camera.start);
    return camera.yawOld + (camera.yawNew - camera.yawOld) * relativePassedTime;
}

function getInterpolationRotation(oldRotation, newRotation, currentTime, start, end){
    var relativePassedTime = (currentTime - start)/(end-start);
    var rotation = oldRotation + (newRotation - oldRotation) * relativePassedTime;
    return rotation;
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
  water_vs: 'shader/watercolor.vs.glsl',
  water_fs: 'shader/watercolor.fs.glsl',
  text_vs: 'shader/texture.vs.glsl',
  text_fs: 'shader/texture.fs.glsl',
  bitmap:'textures/multitex/bitmap.jpg',
  land:'textures/multitex/land.jpg',
  table: 'models/table/Table.obj',
  tableMaterial: 'models/table/Table.mtl',
  chair: 'models/chair/chair.obj',
  toilet:'models/toilet.obj',
  sink:'models/sink.obj',
  chair: 'models/chair/chair.obj',
  frezzer:'models/frezzer.obj',
  tab:'models/tab.obj',
  keramik:'textures/bathroom/keramik.jpg',
  metal:'textures/bathroom/tab.jpg',
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
  skinTexture: 'textures/skin/skinTexture.jpg',
  flashLightTexture: 'textures/flashlight/blue.jpg'
}).then(function (resources) {
  init(resources);
  render(0);
});

class TextureSGNode extends SGNode {
  constructor(texture, texture2, bitmap, children ) {
      super(children);
      this.texture = texture;
      this.texture2 = texture2;
      this.bitmap=bitmap;
      this.textureunit = 1;
      this.textureunit2 = 2;
      this.textureunit3= 3;
  }

  render(context)
  {
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_tex'), this.textureunit);
    gl.activeTexture(gl.TEXTURE0 + this.textureunit);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_tex2'), this.textureunit2);
    gl.activeTexture(gl.TEXTURE0 + this.textureunit2);
    gl.bindTexture(gl.TEXTURE_2D, this.texture2);
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_tex3'), this.textureunit3);//u_tex3 is bitmap
    gl.activeTexture(gl.TEXTURE0 + this.textureunit3);
    gl.bindTexture(gl.TEXTURE_2D, this.bitmap);
    super.render(context);
    gl.activeTexture(gl.TEXTURE0 + this.textureunit);
    gl.activeTexture(gl.TEXTURE0 + this.textureunit2);
    gl.activeTexture(gl.TEXTURE0 + this.textureunit3);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}

class SpotLightSGNode extends LightSGNode{

  constructor(position, children, coneDirection, coneAngle) {
    super(position, children);
    this.position = position || [0, 0, 0];
    this.ambient = [0, 0, 0, 1];
    this.diffuse = [1, 1, 1, 1];
    this.specular = [1, 1, 1, 1];
    this.coneAngle = coneAngle;
    this.coneDirection = coneDirection;
    this.uniform = 'u_spotLight';
  }



  setLightUniforms(context) {
    const gl = context.gl;
    //no materials in use
    if (!context.shader || !isValidUniformLocation(gl.getUniformLocation(context.shader, this.uniform+'.ambient'))) {
      return;
    }
    gl.uniform4fv(gl.getUniformLocation(context.shader, this.uniform+'.ambient'), this.ambient);
    gl.uniform4fv(gl.getUniformLocation(context.shader, this.uniform+'.diffuse'), this.diffuse);
    gl.uniform4fv(gl.getUniformLocation(context.shader, this.uniform+'.specular'), this.specular);
    gl.uniform1f(gl.getUniformLocation(context.shader, this.uniform+'.coneAngle'), this.coneAngle);
    gl.uniform3fv(gl.getUniformLocation(context.shader, this.uniform+'.coneDirection'), this.coneDirection);
  }

  setLightPosition(context) {
    const gl = context.gl;
    if (!context.shader || !isValidUniformLocation(gl.getUniformLocation(context.shader, this.uniform+'Pos'))) {
      return;
    }
    const position = this._worldPosition || this.position;
    gl.uniform3f(gl.getUniformLocation(context.shader, this.uniform+'Pos'), position[0], position[1], position[2]);
  }

  computeLightPosition(context) {
    //transform with the current model view matrix
    const modelViewMatrix = mat4.multiply(mat4.create(), context.viewMatrix, context.sceneMatrix);
    const original = this.position;
    const position =  vec4.transformMat4(vec4.create(), vec4.fromValues(original[0], original[1],original[2], 1), modelViewMatrix);

    this._worldPosition = position;
  }

  /**
   * set the light uniforms without updating the last light position
   */
  setLight(context) {
    this.setLightPosition(context);
    this.setLightUniforms(context);
  }

  render(context) {
    this.computeLightPosition(context);
    this.setLight(context);

    //since this a transformation node update the matrix according to my position
    this.matrix = glm.translate(this.position[0], this.position[1], this.position[2]);
    //render children
    super.render(context);
  }
}
