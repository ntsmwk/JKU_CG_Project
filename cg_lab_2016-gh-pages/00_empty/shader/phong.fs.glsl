precision mediump float;

struct Material {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
	vec4 emission;
	float shininess;
};

struct Light {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
};

struct SpotLight {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
	float coneAngle;
	vec3 coneDirection;
};

uniform Material u_material;
uniform Light u_light;
uniform SpotLight u_spotLight;
uniform Light u_light3;
uniform Light u_light4;

varying vec2 v_texCoord;
uniform sampler2D u_tex;

varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
varying vec3 v_spotLightVec;
varying vec3 v_light3Vec;
varying vec3 v_light4Vec;

vec4 calculateSimplePointLight(Light light, Material material, vec3 lightVec, vec3 normalVec, vec3 eyeVec, vec4 textureColor) {
	lightVec = normalize(lightVec);
	normalVec = normalize(normalVec);
	eyeVec = normalize(eyeVec);

	float diffuse = max(dot(normalVec,lightVec),0.0);

	vec3 reflectVec = reflect(-lightVec,normalVec);
	float spec = pow( max( dot(reflectVec, eyeVec), 0.0) , material.shininess);


  material.diffuse = textureColor;
  material.ambient = textureColor;


	vec4 c_amb  = clamp(light.ambient * material.ambient, 0.0, 1.0);
	vec4 c_diff = clamp(diffuse * light.diffuse * material.diffuse, 0.0, 1.0);
	vec4 c_spec = clamp(spec * light.specular * material.specular, 0.0, 1.0);
	vec4 c_em   = material.emission;

	return c_amb + c_diff + c_spec + c_em;
}

vec4 calculateSimplePointSpotLight(SpotLight light, Material material, vec3 lightVec, vec3 normalVec, vec3 eyeVec, vec4 textureColor) {
	lightVec = normalize(lightVec);
	normalVec = normalize(normalVec);
	eyeVec = normalize(eyeVec);
	float lightToSurfaceAngle = degrees(acos(dot(-lightVec, normalize(light.coneDirection))));
	if(lightToSurfaceAngle < light.coneAngle){
		float diffuse = max(dot(normalVec,lightVec),0.0);

		vec3 reflectVec = reflect(-lightVec,normalVec);
		float spec = pow( max( dot(reflectVec, eyeVec), 0.0) , material.shininess);

	  material.diffuse = textureColor;
	  material.ambient = textureColor;

		vec4 c_amb  = clamp(light.ambient * material.ambient, 0.0, 1.0);
		vec4 c_diff = clamp(diffuse * light.diffuse * material.diffuse, 0.0, 1.0);
		vec4 c_spec = clamp(spec * light.specular * material.specular, 0.0, 1.0);
		vec4 c_em   = material.emission;
		return c_amb +  c_diff + c_spec + c_em;
		}	else{
			return vec4(0,0,0,1);
		}
}

void main() {

	 vec4 textureColor = texture2D(u_tex,v_texCoord);

	gl_FragColor =
	calculateSimplePointLight(u_light, u_material, v_lightVec, v_normalVec, v_eyeVec, textureColor)
		+	calculateSimplePointSpotLight(u_spotLight, u_material, v_spotLightVec, v_normalVec, v_eyeVec, textureColor)
		+ calculateSimplePointLight(u_light3, u_material, v_light3Vec, v_normalVec, v_eyeVec, textureColor)
		+ calculateSimplePointLight(u_light4, u_material, v_light4Vec, v_normalVec, v_eyeVec, textureColor);
;
}
