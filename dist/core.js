export const clone = v => JSON.parse(JSON.stringify(v));
export const uid = () => globalThis.crypto?.randomUUID?.() || `p${Date.now()}${Math.random().toString(36).slice(2)}`;
export const MATERIALS={oak:{name:'Carvalho natural',color:'#cdb991'},white:{name:'Branco fosco',color:'#f0eee5'},walnut:{name:'Nogueira',color:'#8b674c'},sage:{name:'Verde sálvia',color:'#87977b'}};
export function piece(name,x,y,z,w,h,d,material='oak'){return{id:uid(),name,x,y,z,w,h,d,rx:0,ry:0,rz:0,material};}
export function createProject(kind='cabinet',w=1200,h=900,d=350,name='Meu armário',t=18){
 const p={version:1,name,w,h,d,thickness:t,pieces:[],measures:[]};
 if(kind==='cabinet'){
 const iw=w-2*t,ih=h-2*t,half=(iw-t)/2;
 p.pieces=[piece('Lateral esquerda',0,0,0,t,h,d),piece('Lateral direita',w-t,0,0,t,h,d),piece('Base',t,0,0,iw,t,d),piece('Tampo',t,h-t,0,iw,t,d),piece('Divisória central',t+half,t,6,t,ih,d-6),piece('Prateleira esquerda',t,(h-t)/2,6,half,t,d-6),piece('Prateleira direita',t+half+t,(h-t)/2,6,half,t,d-6),piece('Fundo',t,t,0,iw,ih,6,'white')];
 }else if(kind==='desk')p.pieces=[piece('Tampo',0,h-t,0,w,t,d),piece('Lateral esquerda',0,0,0,t,h-t,d),piece('Lateral direita',w-t,0,0,t,h-t,d),piece('Travessa',t,h-200,0,w-2*t,150,t)];
 else if(kind==='panel')p.pieces=[piece('Painel',0,0,0,w,h,t)];
 return p;
}
export function projectPoint(v,view){return view==='top'?{u:v.x,v:v.z}:view==='side'?{u:v.z,v:v.y}:{u:v.x,v:v.y};}
export function viewAxes(view){return view==='top'?['x','z','y']:view==='side'?['z','y','x']:['x','y','z'];}
export function corners(p){
 if(p.matrix){const m=p.matrix,out=[];for(const x of [-p.w/2,p.w/2])for(const y of [-p.h/2,p.h/2])for(const z of [-p.d/2,p.d/2])out.push({x:m[0]*x+m[4]*y+m[8]*z+m[12],y:m[1]*x+m[5]*y+m[9]*z+m[13],z:m[2]*x+m[6]*y+m[10]*z+m[14]});return out;}
 const [ax,ay,az]=[p.rx,p.ry,p.rz].map(v=>(v||0)*Math.PI/180),sx=Math.sin(ax),cx=Math.cos(ax),sy=Math.sin(ay),cy=Math.cos(ay),sz=Math.sin(az),cz=Math.cos(az),out=[];
 for(const x of [-p.w/2,p.w/2])for(const y of [-p.h/2,p.h/2])for(const z of [-p.d/2,p.d/2]){
 // Three.js Euler XYZ applies Z, then Y, then X to a vertex.
 let vx=x*cz-y*sz,vy=x*sz+y*cz,vz=z;let qx=vx*cy+vz*sy,qz=-vx*sy+vz*cy;out.push({x:qx+p.x+p.w/2,y:vy*cx-qz*sx+p.y+p.h/2,z:vy*sx+qz*cx+p.z+p.d/2});
 }return out;
}
export function bounds(pieces){const pts=pieces.flatMap(corners);if(!pts.length)return{min:{x:0,y:0,z:0},max:{x:1200,y:900,z:350}};return{min:Object.fromEntries(['x','y','z'].map(k=>[k,Math.min(...pts.map(p=>p[k]))])),max:Object.fromEntries(['x','y','z'].map(k=>[k,Math.max(...pts.map(p=>p[k]))]))};}
export function hull(points){const a=[...points].sort((a,b)=>a.u-b.u||a.v-b.v);const cross=(o,a,b)=>(a.u-o.u)*(b.v-o.v)-(a.v-o.v)*(b.u-o.u);let lo=[],hi=[];for(const p of a){while(lo.length>=2&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(const p of a.reverse()){while(hi.length>=2&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
export function polygon(p,view){return hull(corners(p).map(v=>projectPoint(v,view)));}
export function area(pieces){return pieces.reduce((s,p)=>{const dims=[p.w,p.h,p.d].sort((a,b)=>b-a);return s+dims[0]*dims[1]/1e6;},0);}
export function pieceFromLine(a,b,view,ref,t){
 const du=b.u-a.u,dv=b.v-a.v,L=Math.hypot(du,dv);if(L<1)return null;
 const ang=Math.atan2(dv,du)*180/Math.PI;
 if(view==='front'){const p=piece('Peça desenhada',(a.u+b.u)/2-L/2,(a.v+b.v)/2-t/2,0,L,t,ref.d);p.rz=ang;return p;}
 if(view==='top'){const p=piece('Peça desenhada',(a.u+b.u)/2-L/2,0,(a.v+b.v)/2-t/2,L,ref.h,t);p.ry=-ang;return p;}
 const p=piece('Peça desenhada',0,(a.v+b.v)/2-t/2,(a.u+b.u)/2-L/2,ref.w,t,L);p.rx=-ang;return p;
}
export function pieceFromRect(a,b,view,ref,t){let u=Math.min(a.u,b.u),v=Math.min(a.v,b.v),w=Math.abs(a.u-b.u),h=Math.abs(a.v-b.v);if(w<1||h<1)return null;if(view==='front')return piece('Painel frontal',u,v,Math.max(0,ref.d-t),w,h,t);if(view==='top')return piece('Painel horizontal',u,0,v,w,t,h);return piece('Painel lateral',0,v,u,t,h,w);}
export function validateProject(raw){
 if(!raw||raw.version!==1||typeof raw.name!=='string'||raw.name.length>120||!Array.isArray(raw.pieces)||raw.pieces.length>1000)throw new Error('Formato de projeto inválido.');
 for(const k of ['w','h','d','thickness'])if(!Number.isFinite(raw[k])||raw[k]<=0||raw[k]>20000)throw new Error('Medidas do projeto inválidas.');
 const seen=new Set();for(const p of raw.pieces){if(typeof p.id!=='string'||seen.has(p.id)||typeof p.name!=='string'||p.name.length>120)throw new Error('Peça inválida.');seen.add(p.id);for(const k of ['x','y','z','w','h','d','rx','ry','rz'])if(!Number.isFinite(p[k])||Math.abs(p[k])>100000||(['w','h','d'].includes(k)&&p[k]<=0))throw new Error('Medida de peça inválida.');if(!MATERIALS[p.material])throw new Error('Material desconhecido.');}
 if(!Array.isArray(raw.measures)||raw.measures.length>500)throw new Error('Cotas inválidas.');for(const m of raw.measures){if(!['front','top','side'].includes(m.view)||!m.a||!m.b||![m.a.u,m.a.v,m.b.u,m.b.v].every(v=>Number.isFinite(v)&&Math.abs(v)<=100000))throw new Error('Cota inválida.');}
 if(raw.unit!==undefined&&!['mm','cm'].includes(raw.unit))throw new Error('Unidade inválida.');
 if(raw.room!==undefined)validateRoom(raw.room);
 return clone(raw);
}
export function formatMeasure(v,unit='mm'){return new Intl.NumberFormat('pt-BR',{maximumFractionDigits:unit==='cm'?2:1}).format(v/(unit==='cm'?10:1))+' '+unit;}
export function sceneBounds(project){return project.roomView?{min:{x:0,y:0,z:0},max:{x:project.w,y:project.h,z:project.d}}:bounds(project.pieces);}
export function validateRoom(r){
 if(!r||typeof r.name!=='string'||r.name.length>120||typeof r.active!=='boolean'||!['cutaway','all','none','interior'].includes(r.walls)||!Array.isArray(r.objects)||r.objects.length>150)throw new Error('Quarto inválido.');
 for(const k of ['w','h','d'])if(!Number.isFinite(r[k])||r[k]<500||r[k]>20000)throw new Error('Medidas do quarto inválidas.');
 for(const k of ['wallColor','floorColor'])if(!/^#[0-9a-fA-F]{6}$/.test(r[k]))throw new Error('Cor do quarto inválida.');
 const ids=new Set();for(const o of r.objects){if(typeof o.id!=='string'||ids.has(o.id)||typeof o.name!=='string'||o.name.length>120||!['bed','double-bed','desk','wardrobe','chair','box','custom'].includes(o.type))throw new Error('Móvel do quarto inválido.');ids.add(o.id);for(const k of ['x','y','z','w','h','d','rotation'])if(!Number.isFinite(o[k])||Math.abs(o[k])>100000||(['w','h','d'].includes(k)&&(o[k]<1||o[k]>20000)))throw new Error('Medida do móvel inválida.');if(o.material!==null&&!MATERIALS[o.material])throw new Error('Acabamento do móvel inválido.');if(o.type==='custom'){if(!Array.isArray(o.source)||!o.source.length||o.source.length>1000)throw new Error('Modelo de móvel inválido.');for(const p of o.source){for(const k of ['x','y','z','w','h','d','rx','ry','rz'])if(!Number.isFinite(p[k])||Math.abs(p[k])>100000||(['w','h','d'].includes(k)&&p[k]<=0))throw new Error('Peça de móvel inválida.');if(!MATERIALS[p.material]||p.matrix!==undefined)throw new Error('Peça de móvel inválida.');}}}
 for(const type of ['door','window']){const o=r[type];if(o===null)continue;if(!o||!['back','front','left','right'].includes(o.wall))throw new Error('Abertura inválida.');const length=['back','front'].includes(o.wall)?r.w:r.d;for(const k of ['offset','width','height','bottom'])if(!Number.isFinite(o[k])||o[k]<0)throw new Error('Medida de abertura inválida.');if(o.width<100||o.height<100||o.offset+o.width>length||o.bottom+o.height>r.h)throw new Error('A porta ou janela ultrapassa a parede.');if(type==='door'&&o.bottom!==0)throw new Error('A porta deve começar no piso.');}
 if(r.door&&r.window&&r.door.wall===r.window.wall){const a=r.door,b=r.window;if(a.offset<b.offset+b.width&&a.offset+a.width>b.offset&&a.bottom<b.bottom+b.height&&a.bottom+a.height>b.bottom)throw new Error('A porta e a janela não podem ocupar o mesmo espaço.');}
 return r;
}
