'use strict';
// Pure, bounded local search. Couples stay rigid; only whole blocks change order.
// Every candidate is scored against all adjacent generation bands, so fixing
// one family cannot silently add more crossings in the next band.
(function(root){
 function clusterBirthFamilies(groups,birthFamilies={}){const buckets=new Map();for(let i=0;i<groups.length;i++){const ids=groups[i],families=[...new Set(ids.map(id=>birthFamilies[id]).filter(Boolean))],key=families.length===1&&ids.every(id=>birthFamilies[id]===families[0])?'family:'+families[0]:'couple:'+i;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(ids);}return [...buckets.values()].flat();}
 // Reserve the full visible descendant footprint, not just the parents' cards.
 // Shared child blocks (including marriages between cousins) count only once.
 function descendantWidths({blocks,ranks,sizes,unions,owners={}}){
  const byPerson=new Map(),widths=new Map();blocks.forEach((ids,i)=>ids.forEach(id=>byPerson.set(id,i)));
  const children=blocks.map(()=>new Set());
  for(const u of unions)for(const parent of [u.fatherId,u.motherId]){const a=byPerson.get(owners[parent]||parent);if(a===undefined)continue;for(const child of u.children){const b=byPerson.get(owners[child]||child);if(b!==undefined&&b!==a&&ranks[blocks[b][0]]<ranks[blocks[a][0]])children[a].add(b);}}
  for(const i of blocks.map((_,i)=>i).sort((a,b)=>ranks[blocks[a][0]]-ranks[blocks[b][0]])){
   const own=blocks[i].reduce((sum,id)=>sum+sizes[id],0)+26*(blocks[i].length-1),desc=[...children[i]],footprint=desc.reduce((sum,j)=>sum+widths.get(j),0)+56*Math.max(0,desc.length-1);
   widths.set(i,Math.max(own,footprint));
  }
  return Object.fromEntries(blocks.flatMap((ids,i)=>ids.map(id=>[id,widths.get(i)])));
 }
 function optimize(input){
  const x={...input.centers},ranks=input.ranks,sizes=input.sizes,owners=input.owners||{},pinned=new Set(input.pinned||[]);
  const ordered=input.blocks.map(ids=>[...ids]).sort((a,b)=>Math.min(...a.map(id=>x[id]))-Math.min(...b.map(id=>x[id]))),merged=new Map();for(let i=0;i<ordered.length;i++){const ids=ordered[i],families=[...new Set(ids.map(id=>input.birthFamilies?.[id]).filter(Boolean))],key=families.length===1&&ids.every(id=>input.birthFamilies?.[id]===families[0])?'family:'+ranks[ids[0]]+':'+families[0]:'couple:'+i;if(!merged.has(key))merged.set(key,[]);merged.get(key).push(...ids);}const blocks=[...merged.values()].map(ids=>ids.sort((a,b)=>x[a]-x[b])),byPerson=new Map();blocks.forEach((ids,i)=>ids.forEach(id=>byPerson.set(id,i)));
  const rows=new Map();blocks.forEach((ids,i)=>{const rank=ranks[ids[0]];if(!rows.has(rank))rows.set(rank,[]);rows.get(rank).push(i);});
  const center=(ids,positions=x)=>ids.reduce((s,id)=>s+positions[id],0)/ids.length;
  for(const order of rows.values())order.sort((a,b)=>center(blocks[a])-center(blocks[b]));
  const front=id=>owners[id]||id;
  function measure(positions){
   const bands=new Map();let length=0,crossings=0;
   for(const u of input.unions){const parents=[...new Set([u.fatherId,u.motherId].filter(Boolean).map(front))].filter(id=>Number.isFinite(positions[id]));if(!parents.length)continue;const rank=Math.max(...parents.map(id=>ranks[id])),top=center(parents,positions);if(!bands.has(rank))bands.set(rank,[]);
    for(const child of u.children){if(!Number.isFinite(positions[child])||ranks[child]>=rank)continue;const bottom=positions[child];bands.get(rank).push({top,bottom,union:u.id,child});length+=Math.pow(Math.abs(top-bottom),1.12);}
   }
   let weighted=0;for(const [rank,edges] of bands)for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){const a=edges[i],b=edges[j];if(a.union===b.union||a.child===b.child)continue;if((a.top-b.top)*(a.bottom-b.bottom)<-1){crossings++;weighted+=1+2/(1+Math.abs(rank));}}
   return {crossings,length,cost:weighted*100000+length};
  }
  function packed(order,anchor){const candidate={...x},spans=new Map();for(const i of order){const ids=blocks[i],lo=Math.min(...ids.map(id=>x[id]-(input.extents?.[id]?.left??sizes[id]/2))),hi=Math.max(...ids.map(id=>x[id]+(input.extents?.[id]?.right??sizes[id]/2)));spans.set(i,{lo,hi,width:hi-lo});}
   const a=order.indexOf(anchor),gap=28;
   for(let i=a+1;i<order.length;i++){const previous=spans.get(order[i-1]),current=spans.get(order[i]),shift=previous.hi+gap-current.lo;current.lo+=shift;current.hi+=shift;for(const id of blocks[order[i]])candidate[id]+=shift;}
   for(let i=a-1;i>=0;i--){const next=spans.get(order[i+1]),current=spans.get(order[i]),shift=next.lo-gap-current.hi;current.lo+=shift;current.hi+=shift;for(const id of blocks[order[i]])candidate[id]+=shift;}
   return candidate;
  }
  const before=measure(x);let best=before;
  const anchors=[...input.direct].filter(id=>byPerson.has(id)).sort((a,b)=>Math.abs(ranks[a])-Math.abs(ranks[b]));
  for(let pass=0;pass<2;pass++){let improved=false;for(const id of anchors){const rank=ranks[id],order=rows.get(rank);if(order.some(i=>blocks[i].some(id=>pinned.has(id))))continue;const anchor=byPerson.get(id),siblings=new Set((input.siblings[id]||[]).map(id=>byPerson.get(id)).filter(i=>i!==undefined&&i!==anchor&&order.includes(i)));if(!siblings.size)continue;
    for(const side of [-1,1]){const moving=order.filter(i=>siblings.has(i)),rest=order.filter(i=>!siblings.has(i)),at=rest.indexOf(anchor)+(side>0?1:0),proposed=[...rest.slice(0,at),...moving,...rest.slice(at)],candidate=packed(proposed,anchor),score=measure(candidate);if(score.cost+0.01<best.cost){Object.assign(x,candidate);order.splice(0,order.length,...proposed);best=score;improved=true;}}
   }if(!improved)break;
  }
  return {centers:x,before,after:best};
 }
 root.GenealogyLayout={optimize,clusterBirthFamilies,descendantWidths};if(typeof module!=='undefined')module.exports=root.GenealogyLayout;
})(globalThis);
