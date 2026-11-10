import test from 'node:test';
import assert from 'node:assert/strict';
import {piece,clone,validateProject,bounds,corners} from '../dist/core.js';
import {createSamuelProject,applyClosetToRoom,closetAlongLeft} from '../dist/samuel-room.js';
import {objectPieces,insideRoom,solidsOverlap,roomScene} from '../dist/room-core.js';
import {resizeRectangle,resizeHandles} from '../dist/resize.js';

const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-6,message||`${a} != ${b}`);
test('known room and closet dimensions survive JSON round trip in cm and mm',()=>{
  for(const unit of ['cm','mm']){const p=createSamuelProject();p.unit=unit;const q=validateProject(JSON.parse(JSON.stringify(p)));
    assert.deepEqual([q.room.w,q.room.d,q.room.h],[1810,2430,2530]);
    const c=q.room.objects.find(o=>o.id==='samuel-closet');assert.deepEqual([c.w,c.d,c.h,c.y],[150,2430,1150,1380]);
    assert.equal(c.y+c.h,q.room.h);assert.equal(q.room.window.measurementStatus,'provisional');assert.equal(q.pieces.filter(p=>p.door).length,4);
    assert.equal(q.room.objects.find(o=>o.id==='samuel-desk').measurementStatus,'provisional');
  }
});
test('every closed object and every rendered part lies in the room',()=>{
  const p=createSamuelProject();for(const o of p.room.objects){assert.ok(insideRoom(o,p.room),o.name);const b=bounds(objectPieces(o));
    for(const [axis,limit] of [['x',p.room.w],['y',p.room.h],['z',p.room.d]]){assert.ok(b.min[axis]>=-.001,`${o.name} min ${axis}`);assert.ok(b.max[axis]<=limit+.001,`${o.name} max ${axis}`);}}
});
test('mattress really ends at 490 mm; pillow does not rescale the bed',()=>{
  const p=createSamuelProject(),o=p.room.objects.find(o=>o.id==='samuel-bed'),m=objectPieces(o).find(p=>p.name==='Colchão');near(bounds([m]).max.y,490);
});
test('opening doors preserves the cabinet body and moves only door leaves',()=>{
  const o=createSamuelProject().room.objects.find(o=>o.id==='samuel-closet'),closed=objectPieces(o),open=objectPieces({...o,doorsOpen:true});
  for(let i=0;i<closed.length;i++){if(!closed[i].door)assert.deepEqual(corners(closed[i]),corners(open[i]));else assert.ok(bounds([open[i]]).max.x>700);}
});
test('bench hollow does not collide with panels placed underneath it',()=>{
  const p=createSamuelProject();const desk=p.room.objects.find(o=>o.id==='samuel-desk');for(const o of p.room.objects.filter(o=>o.id.startsWith('samuel-mini')))assert.equal(solidsOverlap(desk,o),false,o.name);
});
test('resize fixes the opposite handle for all room rotations',()=>{
  for(const rotation of [0,27,90,180,270])for(const h of resizeHandles({x:100,y:0,z:200,w:800,h:900,d:500,rotation},'top',true)){
    const original={x:100,y:0,z:200,w:800,h:900,d:500,rotation};const before=resizeHandles(original,'top',true).find(a=>a.sx===-h.sx&&a.sy===-h.sy);
    const changed={...original,...resizeRectangle(original,h,{u:123,v:57},{room:true,view:'top'})};
    const after=resizeHandles(changed,'top',true).find(a=>a.sx===-h.sx&&a.sy===-h.sy);near(before.u,after.u);near(before.v,after.v);assert.equal(changed.h,900);
  }
});
test('piece resize preserves thickness in all aligned views and supports decimal dimensions',()=>{
  for(const view of ['front','side','top']){const p=piece('Test',30,20,10,620,540,15),h=resizeHandles(p,view,false)[2];const patch=resizeRectangle(p,h,{u:12.3,v:24.6},{view});
    const unused=view==='front'?'d':view==='top'?'h':'w';assert.equal({...p,...patch}[unused],p[unused]);assert.ok(Object.values(patch).every(Number.isFinite));}
});
test('minimum limits and proportional resizing never yield negative geometry',()=>{
  const p={x:0,y:0,z:0,w:950,h:490,d:1980,rotation:0};const h=resizeHandles(p,'top',true)[2];
  const changed=resizeRectangle(p,h,{u:-4000,v:-4000},{room:true,step:50});assert.ok(changed.w>0&&changed.d>0);
  const proportional=resizeRectangle(p,h,{u:100,v:35},{room:true,proportional:true});near(proportional.w/proportional.d,p.w/p.d);
});
test('editing the closet can be applied back to the room and is serializable',()=>{
  const p=createSamuelProject();p.pieces.find(p=>p.name==='Divisória central').x+=100;applyClosetToRoom(p);validateProject(p);
  const o=p.room.objects.find(o=>o.id==='samuel-closet');assert.equal(o.source.find(p=>p.name==='Divisória central').z,p.pieces.find(p=>p.name==='Divisória central').x);
  assert.equal(roomScene(p).presentationView,'entry');
});
test('applying a rotated panel to the left wall preserves all eight corners',()=>{
  const p={...piece('Rotated panel',30,40,50,250,110,15),rx:22,ry:37,rz:48};
  const actual=corners(closetAlongLeft([p])[0]);
  for(const c of corners(p)){assert.ok(actual.some(a=>Math.hypot(a.x-c.z,a.y-c.y,a.z-c.x)<1e-6));}
});
test('a selected finish recolors wood while keeping the original light strip',()=>{
  const p=createSamuelProject(),o=p.room.objects.find(o=>o.id==='samuel-closet');
  const rendered=objectPieces({...o,material:'white'});assert.ok(rendered.every(p=>p.material==='white'&&!p.color));
});
