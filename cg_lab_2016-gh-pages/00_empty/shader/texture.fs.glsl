
precision mediump float;

varying vec2 v_texCoord;
uniform sampler2D u_tex;
uniform sampler2D u_tex2;
uniform sampler2D u_tex3;//bitmap

void main (void) {

    float c = texture2D(u_tex3,v_texCoord).r;
    gl_FragColor=texture2D(u_tex,v_texCoord)*c+texture2D(u_tex2,v_texCoord);
    //gl_FragColor=vec4(texture2D(u_tex2,v_texCoord).rgb);
}
