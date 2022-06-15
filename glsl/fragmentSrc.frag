#version 300 es

precision highp float;

in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_position;

out vec4 color;

uniform sampler2D diffuseMap;
uniform sampler2D specularMap;

uniform vec3 u_ambientStrength;
uniform vec3 u_lightColorAmbient;
uniform vec3 u_lightColorDiffuse;
uniform vec3 u_diffuseVec;

uniform vec3 u_viewPosition;
uniform float shininess;
uniform float opacity;
uniform vec3 specular;

void main() {
	vec3 norm=normalize(v_normal);
	vec4 mapColor=texture(diffuseMap,v_texcoord);
	vec4 mapSpec=texture(specularMap,v_texcoord);
	vec3 lightDir=normalize(u_diffuseVec);
	vec3 ambientLight=u_ambientStrength*u_lightColorAmbient*mapColor.rgb;
	
	float diff = max(dot(norm,lightDir),0.0);
	vec3 diffuseLight=diff*u_lightColorDiffuse*mapColor.rgb;
	//especular
	vec3 viewDir=normalize(u_viewPosition-v_position);
	vec3 reflectDir=reflect(-lightDir,norm);

	float specularFactor=pow(max(dot(viewDir,reflectDir),0.0),shininess);
	vec3 specularLight=specularFactor*specular*mapSpec.rgb;
	vec3 result=ambientLight+diffuseLight+specularLight;
	color=vec4(result,opacity);	
}