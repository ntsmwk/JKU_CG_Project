var gl = null;
var shaderProgram = null;
var root = null;
var canvasWidth = 800;
var canvasHeight = 800;
var aspectRatio = canvasWidth / canvasHeight;
var quadVertexBuffer, quadColorBuffer;
var rotateLight;
var sytem;
var numberOfParticles=150;



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


function init(resources) {
  gl = createContext(canvasWidth , canvasHeight);
  gl.enable(gl.DEPTH_TEST);
  root = createSceneGraph(gl, resources);
  initInteraction(gl.canvas);
  system = new ParticleSystem(resources);
}




function render(timeInMilliseconds) {
  checkForWindowResize(gl);
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), 30, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  context.viewMatrix = mat4.lookAt(mat4.create(), [0,0,-5], [0,0,0], [0,1,0]);
  context.sceneMatrix = glm.transform({translate: [camera.position.x,camera.position.y,camera.position.z], rotateX: -camera.rotation.y, rotateY: camera.rotation.x})
  root.render(context);
  system.transform(); //animation of article system if activated
  requestAnimationFrame(render);
}

function createSceneGraph(gl, resources) {
  root = new ShaderSGNode(createProgram(gl, resources.phong_vs, resources.phong_fs));
  return root;
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
  multitex_vs: 'shader/multi.vs.glsl',
  multitex_fs: 'shader/multi.fs.glsl',
  water_vs: 'shader/watercolor.vs.glsl',
  water_fs: 'shader/watercolor.fs.glsl',
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
  ceilingLampTexture: 'models/ceilingLamp/texture/whiteTextile.jpg'
}).then(function (resources) {
  init(resources);
  render(0);
});

//init function for the Particle system
function ParticleSystem (resources){
  //set origin of the Particle Sytem
  this.originX =0;
  this.originY=-3;
  this.originZ=0;
  this.particles = new Array(); //storage for particles
  this.active=true;  // is particle system active

  //init all particles and add to the array and append the root
  for (var i=0;i<numberOfParticles;i++){
  this.drop = new Particle(resources, this.originX+Math.random()/4, this.originY, this.originZ+Math.random()/4);
  //draw a Particle at point originX, originY, originY with small random differences
  this.drop.life=Math.floor(Math.random()*100);  //set a live random between 0 and 100
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
     this.particles[i].matrix = glm.transform({translate:[this.originX+Math.random()/4, this.originY, this.originZ+Math.random()/4], scale: 1});
     //refresh matrix at the origin
     this.particles[i].life=Math.floor(Math.random()*100);
     //refresh life with a lifespan between 0 and 100
   } else {
      mat4.multiply(this.particles[i].matrix,this.particles[i].matrix, glm.transform({translate: [0,0.05,0]}));
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
    this.particles[i].matrix = glm.transform({translate:[this.originX+Math.random()/4, this.originY, this.originZ+Math.random()/4], scale: 1});
    this.particles[i].life=Math.floor(Math.random()*100);
 }
};

//standard contrutor for each particel it has a resource and xyz Coordinates)
function Particle(resources, x, y, z){
  this.life=0;// life will be set later
  this.matrix = glm.transform({translate:[x,y,z], scale: 1}); //set position of the paricle
  return new TransformationSGNode(this.matrix,[createWaterDrop(resources)]); //create the sphere representing the water drop

 //function for creatin the sphere node
  function createWaterDrop(resources) {
      return new ShaderSGNode(createProgram(gl, resources.water_vs, resources.water_fs), [
        new RenderSGNode(makeSphere(0.075,10,10))
      ]);
    }
}
