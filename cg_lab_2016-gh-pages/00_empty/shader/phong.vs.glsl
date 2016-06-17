
attribute vec3 a_position;
attribute vec3 a_normal;

attribute vec2 a_texCoord;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;

uniform vec3 u_lightPos;
uniform vec3 u_light2Pos;
uniform vec3 u_light3Pos;

varying vec2 v_texCoord;

varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
varying vec3 v_light2Vec;
varying vec3 v_light3Vec;

void main() {
	vec4 eyePosition = u_modelView * vec4(a_position,1);
	v_texCoord = a_texCoord;
  v_normalVec = u_normalMatrix * a_normal;

  v_eyeVec = -eyePosition.xyz;
	v_lightVec = u_lightPos - eyePosition.xyz;
	v_light2Vec = u_light2Pos - eyePosition.xyz;
	v_light3Vec = u_light3Pos - eyePosition.xyz;

	gl_Position = u_projection * eyePosition;
}
