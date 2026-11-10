// Rectangle handles in drawing coordinates. Keep the opposite edge fixed even after rotation.
export function resizeFrame(o,view='top',room=false) {
  const axes=view==='top'?['x','z']:view==='side'?['z','y']:['x','y'];
  const dimensions=view==='top'?['w','d']:view==='side'?['d','h']:['w','h'];
  if(!room){const excluded=view==='top'?['rx','rz']:view==='side'?['ry','rz']:['rx','ry'];
    if(excluded.some(k=>Math.abs((o[k]||0)%360)>.0001))return null;}
  const angle=(room?-o.rotation:view==='front'?o.rz:view==='top'?-o.ry:-o.rx)*Math.PI/180;
  const c=Math.cos(angle||0),s=Math.sin(angle||0);
  return {axes,dimensions,a:{u:c,v:s},b:{u:-s,v:c},center:{u:o[axes[0]]+o[dimensions[0]]/2,v:o[axes[1]]+o[dimensions[1]]/2},w:o[dimensions[0]],h:o[dimensions[1]]};
}
export function resizeHandles(o,view,room){const f=resizeFrame(o,view,room);if(!f)return[];
  return [[-1,-1],[1,-1],[1,1],[-1,1],[0,-1],[1,0],[0,1],[-1,0]].map(([sx,sy])=>({sx,sy,
    u:f.center.u+f.a.u*sx*f.w/2+f.b.u*sy*f.h/2,v:f.center.v+f.a.v*sx*f.w/2+f.b.v*sy*f.h/2}));
}
export function resizeRectangle(original,handle,delta,{view='top',room=false,step=0,proportional=false}={}) {
  const f=resizeFrame(original,view,room);if(!f)return null;
  const dot=a=>delta.u*a.u+delta.v*a.v,minimum=room?1:.1;
  const quantize=n=>Math.min(20000,Math.max(minimum,Math.round((step?Math.round(n/step)*step:n)*100)/100));
  let w=handle.sx?quantize(f.w+handle.sx*dot(f.a)):f.w,h=handle.sy?quantize(f.h+handle.sy*dot(f.b)):f.h;
  if(proportional&&handle.sx&&handle.sy){const ratio=Math.abs(w/f.w-1)>=Math.abs(h/f.h-1)?w/f.w:h/f.h;
    const r=Math.max(Math.max(minimum/f.w,minimum/f.h),Math.min(ratio,Math.min(20000/f.w,20000/f.h)));w=f.w*r;h=f.h*r;}
  const du=handle.sx*(w-f.w)/2,dv=handle.sy*(h-f.h)/2;
  return {[f.dimensions[0]]:w,[f.dimensions[1]]:h,
    [f.axes[0]]:f.center.u+f.a.u*du+f.b.u*dv-w/2,
    [f.axes[1]]:f.center.v+f.a.v*du+f.b.v*dv-h/2};
}
