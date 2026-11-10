import test from 'node:test';
import assert from 'node:assert/strict';
import {piece,createProject,validateProject,bounds,corners} from '../dist/core.js';
import {createRoom,createRoomObject,objectPieces,insideRoom,solidsOverlap,roomScene} from '../dist/room-core.js';
import {resizeRectangle,resizeHandles} from '../dist/resize.js';

const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-6,message||`${a} != ${b}`);
const custom=source=>createRoomObject('custom',source);

test('user-created room and furniture survive a JSON round trip in cm and mm',()=>{
  for(const unit of ['cm','mm']){
    const p={...createProject('desk'),unit,room:createRoom()};
    p.room.objects.push(createRoomObject('bed'),custom(p));
    assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))),p);
  }
});

test('catalogue and custom furniture render inside their room bounds',()=>{
  const room=createRoom();
  for(const o of [createRoomObject('bed'),createRoomObject('desk'),custom(createProject('cabinet'))]){
    assert.ok(insideRoom(o,room));
    const b=bounds(objectPieces(o));
    for(const [axis,limit] of [['x',room.w],['y',room.h],['z',room.d]]){
      assert.ok(b.min[axis]>=0);assert.ok(b.max[axis]<=limit);
    }
  }
});

test('opening custom doors moves the leaves while preserving the body',()=>{
  const p=createProject('blank');
  p.pieces=[piece('Corpo',0,0,0,500,1000,500),{...piece('Porta',500,0,0,18,1000,500),door:true,hingeSide:'left'}];
  const o=custom(p),closed=objectPieces(o),open=objectPieces({...o,doorsOpen:true});
  assert.deepEqual(corners(closed[0]),corners(open[0]));
  assert.notDeepEqual(corners(closed[1]),corners(open[1]));
});

test('custom desk hollow allows furniture underneath but detects solid collisions',()=>{
  const desk={...custom(createProject('desk',1200,750,550)),x:0,z:0};
  const panel={...custom({name:'Painel',pieces:[piece('Painel',0,0,0,300,500,18)]}),x:400,z:200};
  assert.equal(solidsOverlap(desk,panel),false);
  assert.equal(solidsOverlap(desk,{...panel,x:0}),true);
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
test('custom furniture sources stay independent and serializable',()=>{
  const p={...createProject('desk'),room:createRoom()};
  const o=custom(p);p.room.objects.push(o);
  const original=o.source[0].w;p.pieces[0].w+=100;
  assert.equal(o.source[0].w,original);
  assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))),p);
  const scene=roomScene(p);
  assert.equal(scene.name,p.room.name);
  assert.ok(scene.pieces.some(part=>part.id===o.id));
});

test('a selected finish recolors wood and preserves fixed decorative colors',()=>{
  const p=createProject('panel');
  p.pieces.push({...piece('Luz',0,0,0,10,10,10,'white'),color:'#ffdc8e',fixedMaterial:true});
  const rendered=objectPieces({...custom(p),material:'walnut'});
  assert.equal(rendered[0].material,'walnut');
  assert.equal(rendered[0].color,undefined);
  assert.equal(rendered[1].material,'white');
  assert.equal(rendered[1].color,'#ffdc8e');
});
