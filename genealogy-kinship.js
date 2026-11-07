'use strict';
(function(root){
 // Pedigree distance, not a DNA estimate. Shared unnamed birth families count
 // as a known sibling link; marriages never act as blood connections.
 function distances(document,base){
  const people=new Map(document.persons.map(p=>[p.id,p])),unions=new Map(document.unions.map(u=>[u.id,u])),children=new Map();
  for(const p of people.values()){const u=unions.get(p.birthUnionId);for(const parent of [u?.fatherId,u?.motherId].filter(Boolean)){if(!children.has(parent))children.set(parent,[]);children.get(parent).push(p.id);}}
  function ancestors(id){const out=new Map(),queue=[[id,0]];for(let i=0;i<queue.length;i++){const [pid,d]=queue[i],k='p:'+pid;if(out.has(k)&&out.get(k)<=d)continue;out.set(k,d);const u=unions.get(people.get(pid)?.birthUnionId);if(u){const key='u:'+u.id;out.set(key,Math.min(out.get(key)??Infinity,d+1));for(const parent of [u.fatherId,u.motherId].filter(Boolean))queue.push([parent,d+1]);}}return out;}
  const origin=ancestors(base),direct=new Set([...origin.keys()].filter(k=>k.startsWith('p:')).map(k=>k.slice(2))),queue=[base];
  for(let i=0;i<queue.length;i++)for(const id of children.get(queue[i])||[])if(!direct.has(id)){direct.add(id);queue.push(id);}
  const result=new Map(),cousins=[];for(const id of people.keys()){let distance=Infinity,firstCousin=false;for(const [key,d] of ancestors(id))if(origin.has(key)){distance=Math.min(distance,d+origin.get(key));if(d===2&&origin.get(key)===2)firstCousin=true;}firstCousin=firstCousin&&distance===4&&!direct.has(id);if(firstCousin)cousins.push(id);result.set(id,{distance:Number.isFinite(distance)?distance:null,direct:direct.has(id),firstCousin,cousinBranch:false});}
  const seen=new Set();for(let i=0;i<cousins.length;i++){const id=cousins[i];if(seen.has(id))continue;seen.add(id);result.get(id).cousinBranch=true;cousins.push(...children.get(id)||[]);}return result;
 }
 function factor(info,settings){if(!settings?.enabled||!info||info.distance===null||settings.keepDirect&&info.direct||settings.keepCousins&&info.cousinBranch)return {opacity:1,size:1};const steps=Math.max(0,info.distance-2),strength=settings.strength??.6;return {opacity:Math.max(.25,1-steps*.2*strength),size:settings.shrink?Math.max(.8,1-steps*.075*strength):1};}
 const api={distances,factor};root.GenealogyKinship=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
