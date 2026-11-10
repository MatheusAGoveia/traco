import {piece, clone, createProject, bounds} from './core.js';

// All stored geometry is in millimetres. Photo-only dimensions are explicitly provisional.
export const SAMUEL_KEY = 'traco-quarto-samuel-v1';
export const PRESET_ID = 'quarto-samuel-2026-11-05';
const wood = '#ba9362', fabric = '#d5c5b4';
function part(name,x,y,z,w,h,d,color=wood,extra={}) {
  return {...piece(name,x,y,z,w,h,d),color,fixedMaterial:color!==wood,...extra};
}
function custom(id,name,x,y,z,source,notes,status='provisional',extra={}) {
  const b=bounds(source);
  return {id,name,type:'custom',x,y,z,w:b.max.x-b.min.x,h:b.max.y-b.min.y,d:b.max.z-b.min.z,
    rotation:0,material:null,source,notes,measurementStatus:status,...extra};
}
export function createClosetParts() {
  const L=2430,H=1150,T=15,D=135,gap=2,door=(L-gap*5)/4,inside=(L-T*3)/2;
  return [
    part('Lateral esquerda',0,0,0,T,H,D),
    part('Lateral direita',L-T,0,0,T,H,D),
    part('Base',T,0,0,L-T*2,T,D),
    part('Teto',T,H-T,0,L-T*2,T,D),
    part('Divisória central',(L-T)/2,T,0,T,H-T*2,D),
    part('Travessa esquerda',T,H-100,0,inside,70,T),
    part('Travessa direita',(L+T)/2,H-100,0,inside,70,T),
    ...Array.from({length:4},(_,i)=>part(`Porta de abrir ${i+1}`,gap+i*(door+gap),gap,D,door,H-gap*2,T,wood,{door:true,hingeSide:i%2?'right':'left'}))
  ];
}
// The closet's conventional front elevation (length X) runs along the left room wall (Z).
export function closetAlongLeft(source) {
  return source.map(p=>{
    // Reflect the complete rotation matrix across X=Z, then recover XYZ Euler angles.
    const [x,y,z]=[p.rx||0,p.ry||0,p.rz||0].map(a=>a*Math.PI/180);
    const cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);
    const n11=cx*cy,n12=cx*sy*sz+sx*cz,n13=-cx*sy*cz+sx*sz;
    const n22=-sx*sy*sz+cx*cz,n23=sx*sy*cz+cx*sz,n32=-cy*sz,n33=cy*cz;
    const ry=Math.asin(Math.max(-1,Math.min(1,n13)));
    const rx=Math.abs(n13)<.9999999?Math.atan2(-n23,n33):Math.atan2(n32,n22);
    const rz=Math.abs(n13)<.9999999?Math.atan2(-n12,n11):0;
    return {...clone(p),x:p.z,y:p.y,z:p.x,w:p.d,h:p.h,d:p.w,rx:rx*180/Math.PI,ry:ry*180/Math.PI,rz:rz*180/Math.PI};
  });
}
export function applyClosetToRoom(project) {
  const o=project.room?.objects.find(o=>o.id==='samuel-closet');
  if(!o)return;
  o.source=closetAlongLeft(project.pieces); const b=bounds(o.source);
  o.w=b.max.x-b.min.x;o.h=b.max.y-b.min.y;o.d=b.max.z-b.min.z;
  o.measurementStatus='edited';o.notes='Chapas atualizadas na aba Móvel. Posição de instalação preservada.';
}
export function createSamuelProject() {
  const p=createProject('blank',2430,1150,150,'Closet ultrafino · Samuel',15);
  p.unit='cm';p.presetId=PRESET_ID;p.pieces=createClosetParts();
  p.designNotes='Envoltória: 243 × 115 × 15 cm. Base a 138 cm do piso. Corpo sem fundo, MDF de 15 mm, 4 portas; divisões, folgas de 2 mm e ferragens são propostas de montagem a confirmar.';
  const objects=[];
  objects.push(custom('samuel-panel-left','Painel esquerdo',0,0,0,[part('Painel esquerdo',0,0,0,15,900,2430)],'243 × 90 cm definidos. MDF de 1,5 cm usado no estudo; conferir espessura e encontros.','mixed'));
  objects.push(custom('samuel-panel-right','Painel direito',1795,0,0,[part('Painel direito',0,0,0,15,900,2430)],'243 × 90 cm definidos. MDF de 1,5 cm usado no estudo; conferir espessura e encontros.','mixed'));
  const bed=[part('Base da cama',0,0,0,950,300,1980,'#bba286'),part('Colchão',0,300,0,950,190,1980,fabric),
    part('Travesseiro',100,490,65,750,60,400,'#e5d8c9')];
  objects.push(custom('samuel-bed','Cama · colchão a 49 cm',15,0,450,bed,
    'Largura 95 cm e topo do colchão a 49 cm informados. Comprimento de aproximadamente 198 cm. Os 45 cm foram posicionados junto à bancada provisoriamente; confirmar essa direção. A altura total inclui o travesseiro.','mixed'));
  const bw=1780,bd=450,bh=900;
  const desk=[part('Tampo da bancada',0,bh-30,0,bw,30,bd),part('Apoio esquerdo',0,0,0,18,bh-30,bd),
    part('Apoio entre cama e circulação',950,0,0,18,bh-30,bd),part('Apoio direito',bw-18,0,0,18,bh-30,bd),
    ...Array.from({length:4},(_,i)=>part(`Frente de gaveta ${i+1}`,2+i*bw/4,bh-142,bd-18,bw/4-4,110,18))];
  objects.push(custom('samuel-desk','Bancada com quatro gavetas',15,0,0,desk,
    'Provisória: 178 × 45 × 90 cm (L × P × A). Largura calculada entre painéis de 1,5 cm; profundidade usa a folga presumida de 45 cm; altura alinha com o painel na referência. Medir bancada e gavetas existentes.'));
  objects.push(custom('samuel-closet','Closet ultrafino · 4 portas',0,1380,0,closetAlongLeft(p.pieces),
    'Comprimento 243 cm; profundidade externa 15 cm; base a 138 cm. Altura 115 cm calculada até o teto de 253 cm. Corpo sem fundo e quatro portas de abrir. MDF, divisão interna, ferragens e folgas ainda precisam de definição.','mixed',{doorsOpen:false}));
  for(let i=0;i<2;i++)objects.push(custom('samuel-mini-'+i,`Minipainel ${i+1} · 30 × 50`,i?1475:985,0,0,
    [part('Minipainel',0,0,0,300,500,15)],'30 × 50 cm definidos. Posição sob a bancada é provisória; não corresponde a uma posição medida.','mixed'));
  objects.push(custom('samuel-shelf','Prateleira direita',1575,1800,250,[part('Prateleira',0,0,0,220,25,1100)],
    'Referência visual: comprimento 110 cm, profundidade 22 cm, espessura 2,5 cm e base a 180 cm. Todas estas cotas precisam ser medidas.'));
  const led='#ffdc8e';
  objects.push(custom('samuel-led-left','LED do painel esquerdo',15,900,0,[part('Perfil LED',0,0,0,8,6,2430,led)],'Iluminação ilustrativa; perfil e instalação a definir.','visual',{decorative:true}));
  objects.push(custom('samuel-led-right','LED do painel direito',1787,900,0,[part('Perfil LED',0,0,0,8,6,2430,led)],'Iluminação ilustrativa; perfil e instalação a definir.','visual',{decorative:true}));
  objects.push(custom('samuel-led-desk','LED sob a bancada',983,755,40,[part('Perfil LED',0,0,0,790,6,8,led)],'Iluminação ilustrativa.','visual',{decorative:true}));
  p.room={name:'Quarto do Samuel',active:true,w:1810,d:2430,h:2530,walls:'interior',wallColor:'#ece6dc',floorColor:'#cfb994',objects,
    door:{wall:'front',offset:1000,width:760,height:2100,bottom:0,measurementStatus:'provisional'},
    window:{wall:'back',offset:505,width:800,height:900,bottom:1100,measurementStatus:'provisional'},
    measurementStatus:'reported',measurementNotes:'181 × 243 × 253 cm: medidas refeitas em 05/11/2026. Porta e janela com cotas provisórias. A imagem é referência de estilo, não uma planta em escala.'};
  return p;
}
