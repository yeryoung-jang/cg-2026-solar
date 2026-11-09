/* 6주차 실습 1 시작 코드. TODO 1~5를 직접 작성하여 완성하세요.
 * 비교 예제 d06-materials.js는 정답을 확인하는 참고 자료입니다.
 * Copilot에 각 TODO와 week06.md 수식을 읽히고 코드를 제안받아도 됩니다.
 * 각 단계에서 무엇이 왜 달라졌는지 직접 화면으로 검증하세요.
 */
(() => {
'use strict';
const cv=document.querySelector('#cv'), gl=D.context(cv); if(!gl)return;
const VS=`#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUV;
uniform mat4 uVP,uModel;
out vec3 vP,vN,vLocal; out vec2 vUV;
void main(){
  vec4 worldPos=uModel*vec4(aPos,1.0);
  vP=worldPos.xyz;
  vN=mat3(uModel)*aNormal;
  vLocal=aPos;
  vUV=aUV;
  gl_Position=uVP*worldPos;
}`;
const FS=`#version 300 es
precision highp float;
const float PI=3.14159265;
in vec3 vP,vN,vLocal; in vec2 vUV; out vec4 outColor;
uniform sampler2D uColor,uNormal,uARM,uEnv;
uniform vec3 uEye,uLight,uTint;
uniform float uRough,uMetal,uNormalStrength,uPower,uAmbient,uEnvPower;
uniform float uDistance,uAsh;
uniform float uMaskView;

vec3 srgbToLinear(vec3 c){
 return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));
}
vec3 linearToSrgb(vec3 c){
 return mix(12.92*c,1.055*pow(c,vec3(1./2.4))-.055,step(vec3(.0031308),c));
}

float crackPattern(vec2 uv){
  vec2 p=uv*vec2(16.0,10.0);
  vec2 cell=floor(p);
  vec2 f=fract(p);

  float nearest=10.0;
  float second=10.0;

  for(int y=-1;y<=1;y++){
    for(int x=-1;x<=1;x++){
      vec2 n=vec2(float(x),float(y));
      vec2 id=cell+n;

      vec2 random=fract(sin(vec2(
        dot(id,vec2(127.1,311.7)),
        dot(id,vec2(269.5,183.3))
      ))*43758.5453);

      float d=length(n+random-f);

      if(d<nearest){
        second=nearest;
        nearest=d;
      }else if(d<second){
        second=d;
      }
    }
  }

  return second-nearest;
}

float hash21(vec2 p){
  return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);
}

vec2 hash22(vec2 p){
  return vec2(
    hash21(p),
    hash21(p+vec2(19.19,73.73))
  );
}

float crackPatternWrapped(vec2 uv){
  const float CELLS_X=18.0;
  const float CELLS_Y=10.0;

  vec2 p=vec2(uv.x*CELLS_X, uv.y*CELLS_Y);
  vec2 cell=floor(p);
  vec2 f=fract(p);

  float nearest=10.0;
  float second=10.0;

  for(int j=-1;j<=1;j++){
    for(int i=-1;i<=1;i++){
      vec2 n=vec2(float(i),float(j));
      vec2 id=cell+n;

      // x 방향 wrap
      id.x=mod(id.x+CELLS_X, CELLS_X);

      vec2 rnd=hash22(id);
      vec2 diff=n+rnd-f;
      float d=length(diff);

      if(d<nearest){
        second=nearest;
        nearest=d;
      }else if(d<second){
        second=d;
      }
    }
  }

  return second-nearest;
}

vec3 directPBR(vec3 N,vec3 V,vec3 L,vec3 base,float rough,float metal){
  float nv=max(dot(N,V),0.0);
  float nl=max(dot(N,L),0.0);
  if(nv<=0.0 || nl<=0.0) return vec3(0.0);

  vec3 H=normalize(V+L);
  float r=clamp(rough,0.045,1.0);
  float a=r*r, a2=a*a;
  float nh=max(dot(N,H),0.0);
  float d=nh*nh*(a2-1.0)+1.0;

  float D=a2/max(PI*d*d,1e-7);
  vec3 F0=mix(vec3(0.04),base,metal);
  vec3 F=F0+(1.0-F0)*pow(1.0-max(dot(H,V),0.0),5.0);

  float k=(r+1.0)*(r+1.0)/8.0;
  float G=(nv/(nv*(1.0-k)+k))*(nl/(nl*(1.0-k)+k));

  vec3 specular=D*F*G/max(4.0*nv*nl,1e-6);
  vec3 kd=(1.0-F)*(1.0-metal);

  return (kd*base/PI+specular)*nl;
}

void main(){
  vec3 N=normalize(vN),V=normalize(uEye-vP),L=normalize(uLight);
  vec3 base=srgbToLinear(texture(uColor,vUV).rgb)*uTint;

  float rough=uRough,metal=uMetal,ao=1.0;

  vec3 arm=texture(uARM,vUV).rgb;
  ao=arm.r;
  rough=max(arm.g*uRough,0.045);
  metal=arm.b*uMetal;
  
  // 태양에 가까울수록 표면 온도가 높아지는 효과
  float heat=1.0-clamp(uDistance/100.0,0.0,1.0);

  // UV 경계가 끊기지 않도록 x 방향 wrap이 있는 균열 패턴
  float cracks=crackPatternWrapped(vUV);

  // 밝은 중심 / 어두운 바깥 glow 를 분리
  float lavaCore=heat*(1.0-smoothstep(0.012,0.024+0.06*heat,cracks));
  float lavaGlow=heat*(1.0-smoothstep(0.020,0.060+0.10*heat,cracks));
  float lavaMask=lavaGlow;

  // 용암 색을 단일색이 아니라 2단계로 섞음
  vec3 lavaEdgeColor=vec3(0.66,0.105,0.012);
  vec3 lavaCoreColor=vec3(1.25,0.23,0.018);
  vec3 lavaColor=mix(lavaEdgeColor,lavaCoreColor,lavaCore);

  base=mix(base,lavaColor,lavaGlow);
  rough=mix(rough,0.18,lavaGlow);
  metal=mix(metal,0.0,lavaGlow);

  // 화산 활동에 따라 화산재가 쌓이는 영역 계산
  float ashActivity=clamp(uAsh/100.0,0.0,1.0);

  // UV 좌표를 이용해 불규칙한 화산재 패턴 생성
  float ashPattern=0.5
    +0.25*sin(vUV.x*31.0+2.0*sin(vUV.y*17.0))
    +0.25*sin(vUV.y*41.0+2.0*sin(vUV.x*13.0));

  // 활동이 강할수록 화산재 영역이 넓어짐
  float ashMask=ashActivity*
    (1.0-smoothstep(0.20+0.45*ashActivity,
                    0.30+0.45*ashActivity,ashPattern));

  // 용암이 있는 부분에는 화산재를 덮지 않음
  ashMask*=1.0-lavaCore;

  // 화산재 영역의 색상과 재질 변경
  base=mix(base,vec3(0.045,0.043,0.041),ashMask);
  rough=mix(rough,0.92,ashMask);
  metal=mix(metal,0.0,ashMask);

  if (uNormalStrength > 0.0) {
    vec3 dp1=dFdx(vP), dp2=dFdy(vP);
    vec2 du1=dFdx(vUV), du2=dFdy(vUV);
    vec3 T=cross(dp2,N)*du1.x+cross(N,dp1)*du2.x;
    vec3 B=cross(dp2,N)*du1.y+cross(N,dp1)*du2.y;
    float inv=inversesqrt(max(max(dot(T,T),dot(B,B)),1e-8));
    vec3 mapN=texture(uNormal,vUV).xyz*2.0-1.0;
    mapN.xy *= uNormalStrength;
    N=normalize(mat3(T*inv,B*inv,N)*normalize(mapN));
  }

  vec3 color=directPBR(N,V,L,base,rough,metal)*uPower;
  vec3 F0=mix(vec3(0.04),base,metal);
  color+=uAmbient*ao*(base*(1.0-metal)*(1.0-F0)+F0);

  vec3 reflected = reflect(-V,N);
  vec2 envUV = vec2(atan(reflected.z,reflected.x)/(2.0*PI)+0.5,
                    asin(clamp(reflected.y,-1.0,1.0))/PI+0.5);
  vec3 envColor = srgbToLinear(textureLod(uEnv,envUV,rough*7.0).rgb);
  vec3 envF0 = mix(vec3(0.04),base,metal);
  color += uEnvPower * ao * envColor * envF0;
  // 용암 중심은 진한 주황색, 가장자리는 어두운 붉은색
  vec3 lavaEmission=
      vec3(2.05,0.30,0.018)*lavaCore
    + vec3(0.75,0.09,0.005)*max(lavaGlow-lavaCore,0.0);
  color+=lavaEmission;
  // 용암 마스크 흑백 표시
  if(uMaskView > 0.5 && uMaskView < 1.5){
    outColor=vec4(vec3(lavaMask),1.0);
    return;
  }

  // 화산재 마스크 흑백 표시
  if(uMaskView > 1.5){
    outColor=vec4(vec3(ashMask),1.0);
    return;
  }

  color=max(color,vec3(0.0));
  color=color/(1.0+color); // HDR → 표시 범위
  outColor=vec4(linearToSrgb(color),1.0);
 }`;

const sunFS=`#version 300 es
precision highp float;
in vec3 vP,vN;
in vec2 vUV;
uniform vec3 uEye;
out vec4 outColor;

void main(){
  vec3 N=normalize(vN);
  vec3 V=normalize(uEye-vP);

  // 보는 방향에 따른 태양 표면 밝기
  float facing=clamp(dot(N,V),0.0,1.0);

  // 중앙은 밝은 노란색, 가장자리는 주황색
  vec3 center=vec3(1.0,0.88,0.49);
  vec3 edge=vec3(1.0,0.42,0.10);
  vec3 color=mix(edge,center,pow(facing,0.55));

  outColor=vec4(clamp(color,0.0,1.0),1.0);
}`;

const blueFS=`#version 300 es
precision highp float;
in vec3 vP,vN,vLocal;
in vec2 vUV;
out vec4 outColor;

void main(){
  vec3 N=normalize(vN);

  // 5주차 느낌의 푸른 표면 무늬
  float pattern=
      0.45
    + 0.22*sin(vUV.x*18.0 + 1.4*sin(vUV.y*9.0))
    + 0.18*sin(vUV.y*21.0 - 1.8*sin(vUV.x*11.0))
    + 0.10*sin((vUV.x+vUV.y)*16.0);

  pattern=clamp(pattern,0.0,1.0);

  vec3 base=mix(
    vec3(0.03,0.08,0.28),
    vec3(0.12,0.32,0.82),
    pattern
  );

  // 5주차의 어두운 이상 영역
  vec3 surface=normalize(vLocal);
  vec3 center=normalize(vec3(0.46,0.22,0.86));
  float dist=length(surface-center);

  float edgeVariation=
      0.015*sin(surface.x*27.0 + surface.y*17.0)
    * sin(surface.y*23.0 - surface.z*12.0);

  float halo=1.0-smoothstep(0.13,0.43,dist+edgeVariation);
  float core=1.0-smoothstep(0.035,0.19,dist+edgeVariation);

  base=mix(base,vec3(0.05,0.06,0.09),halo*0.65);
  base=mix(base,vec3(0.008,0.012,0.022),core*0.92);

  // 어두운 우주 배경에서도 잘 보이도록 최소 밝기 확보
  vec3 lightDir=normalize(vec3(0.4,0.8,0.5));
  float diffuse=max(dot(N,lightDir),0.0);
  float shade=0.55+0.45*diffuse;

  outColor=vec4(base*shade,1.0);
}`;

const beaconFS=`#version 300 es
precision highp float;
in vec3 vP,vN;
uniform vec3 uEye;
uniform float uPulse;
out vec4 outColor;

void main(){
  vec3 N=normalize(vN);
  vec3 V=normalize(uEye-vP);

  float facing=max(dot(N,V),0.0);
  float innerGlow=pow(facing,2.2);
  float rimGlow=pow(1.0-facing,2.0);

  vec3 fakeLightDir=normalize(vec3(0.35,0.9,0.6));
  vec3 H=normalize(fakeLightDir+V);
  float hotspot=pow(max(dot(N,H),0.0),48.0);

  vec3 base=vec3(0.78,0.08,0.06)*(0.82+0.58*innerGlow);
  vec3 rim =vec3(1.0,0.12,0.10)*rimGlow*0.22;
  vec3 hot =vec3(1.0,0.72,0.60)*hotspot*0.55;

  vec3 color=(base+rim+hot)*uPulse;
  outColor=vec4(min(color,vec3(1.0)),1.0);
}`;

const prog=D.program(gl,VS,FS),U=D.uniforms(gl,prog,[
 'uVP','uModel','uEye','uLight','uTint','uRough','uMetal','uNormalStrength','uPower','uAmbient','uEnvPower',
 'uColor','uNormal','uARM','uEnv','uDistance','uAsh','uMaskView'
]);
const mesh=D.upload(gl,D.revolution(D.profiles.sphere(0.95,32),64));
const sunMesh=D.upload(gl,D.revolution(D.profiles.sphere(0.3,24),48));
const blueMesh=D.upload(gl,D.revolution(D.profiles.sphere(0.48,32),64));
const blueProg=D.program(gl,VS,blueFS);
const blueU=D.uniforms(gl,blueProg,['uVP','uModel']);
const beaconMesh=D.upload(gl,D.revolution(D.profiles.sphere(0.12,24),48));
const beaconProg=D.program(gl,VS,beaconFS);
const beaconU=D.uniforms(gl,beaconProg,['uVP','uModel','uEye','uPulse']);
const sunProg=D.program(gl,VS,sunFS);
const sunU=D.uniforms(gl,sunProg,['uVP','uModel','uEye']);
const assets={wood_planks:['Diffuse','nor_gl','arm'],rusty_metal_04:['Diffuse','nor_gl','arm'],rock_boulder_dry:['Diffuse','nor_gl','arm']};
const textures={},jobs=[];let failed=false;
function load(name){
 const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([128,128,255,255]));
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 jobs.push(new Promise(resolve=>{const img=new Image();img.onload=()=>{
  gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  resolve();
 };img.onerror=()=>{failed=true;resolve();};
 img.src='assets/week06/'+name+(name.endsWith('_arm')?'.png':'.jpg');}));
 return tex;
}
for(const [asset,kinds] of Object.entries(assets))textures[asset]=kinds.map(kind=>load(asset+'_'+kind));
const envTex=load('studio_small_09_tonemapped');
Promise.all(jobs).then(()=>{document.querySelector('#status').textContent=failed?'텍스처 로딩 실패: HTTP 서버와 파일 경로 확인':'텍스처 로딩 완료 · 화산 행성 재질 적용';});
document.querySelector('#ui').innerHTML='';
const S=D.UI('#ui',[
 {id:'material',type:'select',label:'재질 선택',value:'rock_boulder_dry',options:[
   {value:'rusty_metal_04',label:'녹슨 금속'},{value:'wood_planks',label:'나무'},{value:'rock_boulder_dry',label:'돌'}]},
 {id:'rough',label:'roughness 배율',min:.05,max:1,step:.01,value:1},
 {id:'metal',label:'metallic 배율',min:0,max:1,step:.01,value:1},
 {id:'normal',label:'normal 강도',min:0,max:10,step:.1,value:5},
 {id:'power',label:'직접광 세기',min:0,max:8,step:.1,value:4},
 {id:'ambient',label:'상수 ambient',min:0,max:1,step:.01,value:.15},
 {id:'env',label:'환경맵 반사 세기',min:0,max:3,step:.1,value:1.5},
 {id:'distance',label:'태양과의 거리',min:0,max:100,step:1,value:50},
 {id:'ash',label:'화산 활동',min:0,max:100,step:1,value:0},
 {id:'viewMode',type:'select',label:'화면 표시',value:'surface',options:[
   {value:'surface',label:'재질 보기'},
   {value:'base',label:'기본 표면 (변화 없음)'},
   {value:'lava',label:'용암 마스크'},
   {value:'ash',label:'화산재 마스크'}
 ]},
]);

const cam=D.orbit(cv,{dist:3.7,pitch:.15,yaw:0});document.querySelector('#reset').onclick=()=>{cam.dist=3.7;cam.yaw=0;cam.pitch=.15;};
const view=D.M4.create(),proj=D.M4.create(),vp=D.M4.create();
const model=D.M4.create();
const sunModel=D.M4.create();
const blueModel=D.M4.create();
const beaconModel=D.M4.create();
let rotationAngle=0;
let lastFrameTime=performance.now();
let isPaused=false;

const pauseButton=document.createElement('button');
pauseButton.type='button';
pauseButton.textContent='자전 일시정지';

pauseButton.onclick=()=>{
  isPaused=!isPaused;
  pauseButton.textContent=isPaused?'자전 다시 시작':'자전 일시정지';
};

document.querySelector('#ui').appendChild(pauseButton);
document.querySelector('#note').textContent='태양 거리와 화산 활동을 조절하여 표면 변화를 확인하세요. 화면 표시 메뉴에서 기본 표면과 두 마스크를 비교할 수 있습니다.';
let visible=true;new IntersectionObserver(e=>visible=e[0].isIntersecting).observe(cv);
D.loop(()=>{
 if(!visible||document.hidden)return;
 D.fit(cv);gl.viewport(0,0,cv.width,cv.height);gl.clearColor(0.018,0.026,0.055,1.0);gl.enable(gl.DEPTH_TEST);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const eye=cam.eye([0,0,0]);D.M4.lookAt(view,eye,[0,0,0],[0,1,0]);D.M4.perspective(proj,Math.PI/4,cv.width/cv.height,.1,100);D.M4.multiply(vp,proj,view);
 const now=performance.now();
 const deltaTime=Math.min((now-lastFrameTime)/1000,0.05);
 lastFrameTime=now;

 if(!isPaused){
   rotationAngle+=deltaTime*0.3;
 }

 D.M4.rotateY(model,D.M4.identity(model),rotationAngle);
 const sunDistance=1.3+S.distance*0.005;

 gl.useProgram(prog);
 gl.uniformMatrix4fv(U.uVP,false,vp);
 gl.uniformMatrix4fv(U.uModel,false,model);
 gl.uniform3fv(U.uEye,eye);
 gl.uniform3fv(U.uLight,[sunDistance,0.5,-0.3]);
 gl.uniform3fv(U.uTint,[.6,.6,.6]);
 for(const [key,value] of Object.entries({uRough:S.rough,uMetal:S.metal,uNormalStrength:S.normal,uPower:S.power,uAmbient:S.ambient,uEnvPower:S.env}))gl.uniform1f(U[key],value);
 gl.uniform1f(U.uDistance,S.viewMode==='base'?100:S.distance);
 gl.uniform1f(U.uAsh,S.viewMode==='base'?0:S.ash);
 gl.uniform1f(U.uMaskView,S.viewMode==='lava'?1:S.viewMode==='ash'?2:0);
 [...textures[S.material],envTex].forEach((tex,i)=>{
  gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.uniform1i(U[['uColor','uNormal','uARM','uEnv'][i]],i);
 });
 gl.bindVertexArray(mesh.vao);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);gl.bindVertexArray(null);
 
 D.M4.translate(sunModel,D.M4.identity(sunModel),[sunDistance,0.5,-0.3]);

 gl.useProgram(sunProg);
 gl.uniformMatrix4fv(sunU.uVP,false,vp);
 gl.uniformMatrix4fv(sunU.uModel,false,sunModel);
 gl.uniform3fv(sunU.uEye,eye);

 gl.bindVertexArray(sunMesh.vao);
 gl.drawElements(gl.TRIANGLES,sunMesh.count,gl.UNSIGNED_SHORT,0);
 gl.bindVertexArray(null);
 // 5주차의 파란 행성을 왼쪽에 배치
 D.M4.translate(blueModel,D.M4.identity(blueModel),[-1.9,0.0,-0.5]);

 gl.useProgram(blueProg);
 gl.uniformMatrix4fv(blueU.uVP,false,vp);
 gl.uniformMatrix4fv(blueU.uModel,false,blueModel);

 gl.bindVertexArray(blueMesh.vao);
 gl.drawElements(gl.TRIANGLES,blueMesh.count,gl.UNSIGNED_SHORT,0);
 gl.bindVertexArray(null);
 // 파란 행성 주변을 공전하는 붉은 경고 비콘
 const beaconAngle=rotationAngle*3.0;
 const beaconX=-1.9+0.7*Math.cos(beaconAngle);
 const beaconZ=-0.5-0.7*Math.sin(beaconAngle);

 D.M4.translate(beaconModel,D.M4.identity(beaconModel),[beaconX,0.0,beaconZ]);

 // 비콘의 붉은빛이 주기적으로 밝아졌다 어두워짐
 const warningPulse=0.82+0.38*(0.5+0.5*Math.sin(performance.now()*0.007));

 gl.useProgram(beaconProg);
 gl.uniformMatrix4fv(beaconU.uVP,false,vp);
 gl.uniformMatrix4fv(beaconU.uModel,false,beaconModel);
 gl.uniform3fv(beaconU.uEye,eye);
 gl.uniform1f(beaconU.uPulse,warningPulse);

 gl.bindVertexArray(beaconMesh.vao);
 gl.drawElements(gl.TRIANGLES,beaconMesh.count,gl.UNSIGNED_SHORT,0);
 gl.bindVertexArray(null);
 });
})();
