import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {MATERIALS,bounds,sceneBounds,formatMeasure} from './core.js';
import {SoftwareModelView} from './software3d.js';

export class ModelView{
 constructor(host,onSelect){
  const probe=document.createElement('canvas').getContext('webgl2');
  if(!probe)return new SoftwareModelView(host,onSelect);
  probe.getExtension('WEBGL_lose_context')?.loseContext();
  this.host=host;this.onSelect=onSelect;this.showDimensions=true;this.exploded=false;this.meshes=[];
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#eef1e8');
  this.camera=new THREE.PerspectiveCamera(36,1,1,100000);
  this.renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.setClearColor('#eef1e8');host.append(this.renderer.domElement);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.maxPolarAngle=Math.PI*.93;this.controls.minDistance=50;this.controls.maxDistance=40000;this.controls.addEventListener('change',()=>this.render());
  this.scene.add(new THREE.HemisphereLight(0xffffff,0xb2b99f,2.7));
  const light=new THREE.DirectionalLight(0xfff7e6,3.4);light.position.set(-1800,3200,2200);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-6000,right:6000,top:6000,bottom:-6000,near:1,far:12000});light.shadow.bias=-.0003;light.shadow.normalBias=2;this.scene.add(light);this.light=light;
  const fill=new THREE.DirectionalLight(0xe0e9ef,1.1);fill.position.set(2000,1200,-1500);this.scene.add(fill);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(60000,60000),new THREE.MeshStandardMaterial({color:'#e8ecdf',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-3;ground.receiveShadow=true;this.scene.add(ground);
  this.grid=new THREE.GridHelper(30000,300,0xcbd4bd,0xdde3d4);this.grid.position.y=-2;this.grid.material.transparent=true;this.grid.material.opacity=.38;this.scene.add(this.grid);
  this.group=new THREE.Group();this.scene.add(this.group);this.dims=new THREE.Group();this.scene.add(this.dims);
  this.colorMaterials=new Map();this.materials={};Object.entries(MATERIALS).forEach(([k,v])=>{this.materials[k]=new THREE.MeshStandardMaterial({color:v.color,roughness:.88,map:['oak','walnut'].includes(k)?this.woodTexture():null});});
  this.raycaster=new THREE.Raycaster();let down;
  this.renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
  this.renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const r=host.getBoundingClientRect();this.raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);const hit=this.raycaster.intersectObjects(this.meshes)[0];if(hit)this.onSelect(hit.object.userData.id);});
  new ResizeObserver(()=>this.resize()).observe(host);this.resize();
 }
 woodTexture(){const c=document.createElement('canvas');c.width=128;c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#f3ecdc';ctx.fillRect(0,0,128,512);let seed=73;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};for(let i=0;i<140;i++){const x=rand()*128;ctx.strokeStyle=`rgba(128,99,54,${.025+rand()*.055})`;ctx.lineWidth=.2+rand()*.8;ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+rand()*5,160,x-rand()*5,350,x,512);ctx.stroke();}const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(1,2);return tex;}
 clear(g){for(const o of [...g.children]){g.remove(o);o.traverse(n=>{n.geometry?.dispose();if(n.userData.disposable){n.material?.map?.dispose();n.material?.dispose();}});}}
 update(project,selected){this.project=project;this.selected=selected;this.clear(this.group);this.clear(this.dims);this.meshes=[];const b=sceneBounds(project);const mid=new THREE.Vector3((b.min.x+b.max.x)/2,(b.min.y+b.max.y)/2,(b.min.z+b.max.z)/2);
  for(const p of project.pieces){const geo=new THREE.BoxGeometry(p.w,p.h,p.d);let material=this.materials[p.material];if(p.color){if(!this.colorMaterials.has(p.color))this.colorMaterials.set(p.color,new THREE.MeshStandardMaterial({color:p.color,roughness:.92}));material=this.colorMaterials.get(p.color);}const mesh=new THREE.Mesh(geo,material);mesh.position.set(p.x+p.w/2,p.y+p.h/2,p.z+p.d/2);mesh.rotation.set(p.rx*Math.PI/180,p.ry*Math.PI/180,p.rz*Math.PI/180);if(p.matrix){mesh.matrix.fromArray(p.matrix);mesh.matrixAutoUpdate=false;}if(this.exploded&&!project.roomView){const v=mesh.position.clone().sub(mid);if(v.length()<1)v.set(0,1,0);mesh.position.add(v.normalize().multiplyScalar(Math.max(project.w,project.h)*.14));}mesh.castShadow=mesh.receiveShadow=true;mesh.userData.id=p.id;const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:p.id===selected?'#527b35':'#8e805e',transparent:true,opacity:p.id.startsWith('@wall')?0:p.id===selected?1:.30}));edges.userData.disposable=true;mesh.add(edges);this.group.add(mesh);if(!p.environment)this.meshes.push(mesh);}
  if(this.showDimensions&&project.pieces.length){const {min:a,max:z}=b;const offset=Math.max(z.x-a.x,z.y-a.y,500)*.09;const n=v=>formatMeasure(v,project.unit||'mm');this.dimension(new THREE.Vector3(a.x,a.y-offset,z.z+offset),new THREE.Vector3(z.x,a.y-offset,z.z+offset),n(z.x-a.x),offset*.8);this.dimension(new THREE.Vector3(a.x-offset,a.y,z.z+offset),new THREE.Vector3(a.x-offset,z.y,z.z+offset),n(z.y-a.y),offset*.8);this.dimension(new THREE.Vector3(z.x+offset,a.y-offset,a.z),new THREE.Vector3(z.x+offset,a.y-offset,z.z),n(z.z-a.z),offset*.8);}
  this.render();
 }
 dimension(a,b,text,height){const mat=new THREE.LineBasicMaterial({color:'#7e9170',transparent:true,opacity:.65});const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),mat);line.userData.disposable=true;this.dims.add(line);const tick=height*.1;for(const p of [a,b]){const q=p.clone().add(new THREE.Vector3(tick,tick,0)),r=p.clone().sub(new THREE.Vector3(tick,tick,0));const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([q,r]),mat.clone());l.userData.disposable=true;this.dims.add(l);}const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#eef1e8e8';ctx.beginPath();ctx.roundRect(30,20,452,88,20);ctx.fill();ctx.font='500 43px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#6e815c';ctx.fillText(text,256,64);const texture=new THREE.CanvasTexture(c);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,transparent:true}));sprite.position.copy(a).add(b).multiplyScalar(.5);sprite.scale.set(height*2.8,height*.7,1);sprite.userData.disposable=true;this.dims.add(sprite);}
 fit(mode){if(!this.project)return;mode=mode||this.project.presentationView||'iso';const b=sceneBounds(this.project),c=new THREE.Vector3((b.min.x+b.max.x)/2,(b.min.y+b.max.y)/2,(b.min.z+b.max.z)/2),ext=Math.max(b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z,200),aspect=Math.max(this.camera.aspect,.15);this.camera.fov=mode==='entry'?50:36;
 if(mode==='entry'&&this.project.roomView){c.set(this.project.w*.5,this.project.h*.47,0);this.camera.position.set(this.project.w*.61,this.project.h*.60,this.project.d+this.project.w*.8/Math.min(aspect,1));}
 else{const distance=ext/2/Math.tan(this.camera.fov*Math.PI/360)*(this.project.roomView?1.55:1.55)/Math.min(aspect,1),dir=mode==='top'?new THREE.Vector3(.001,1,.001):mode==='front'?new THREE.Vector3(0,.015,1):mode==='side'?new THREE.Vector3(1,.015,0):new THREE.Vector3(1.3,.85,1.8).normalize();this.camera.position.copy(c).add(dir.multiplyScalar(distance));}
 this.camera.near=.1;this.camera.far=100000;this.camera.updateProjectionMatrix();this.controls.target.copy(c);this.controls.update();this.render();}

 resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(w<1||h<1)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);this.render();}
 render(){this.renderer.render(this.scene,this.camera);}
 capture(){this.render();return this.renderer.domElement.toDataURL('image/png');}
}
