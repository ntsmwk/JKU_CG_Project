/**
 * empty basic fragment shader
 */

//need to specify how "precise" float should be
precision mediump float;
uniform vec4 color ;

//entry point again
void main() {
  gl_FragColor = vec4(0,0,1,0.5);
}
