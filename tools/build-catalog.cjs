'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),directory=path.join(root,'trees');
function preview(data){
 const people=new Map(data.persons.map(p=>[p.id,p])),unions=new Map(data.unions.map(u=>[u.id,u])),person=people.get(data.rootId),parents=unions.get(person.birthUnionId);
 const family=data.unions.filter(u=>[u.fatherId,u.motherId].includes(person.id)).sort((a,b)=>data.persons.filter(p=>p.birthUnionId===b.id).length-data.persons.filter(p=>p.birthUnionId===a.id).length)[0];
 const partner=family&&people.get(family.fatherId===person.id?family.motherId:family.fatherId),children=family?data.persons.filter(p=>p.birthUnionId===family.id).slice(0,4):[];
 const nodes=[],edges=[];const add=(p,x,y,w=140)=>{if(p)nodes.push({label:p.name,x,y,w});};
 const father=people.get(parents?.fatherId),mother=people.get(parents?.motherId);add(father,mother?80:210,42);add(mother,father?340:210,42);add(person,partner?80:210,130);add(partner,340,130);
 if(father||mother){if(father&&mother)edges.push('M220 63H340');const bottom=partner?150:280;edges.push('M280 63V108H'+bottom+'V130');}
 if(partner)edges.push('M220 151H340');
 if(children.length){const centers=children.map((p,i)=>560*(i+1)/(children.length+1)),width=Math.min(140,560/(children.length+1)-12);edges.push('M280 151V201');if(children.length>1)edges.push('M'+centers[0]+' 201H'+centers.at(-1));children.forEach((p,i)=>{edges.push('M'+centers[i]+' 201V222');add(p,centers[i]-width/2,222,width);});}
 return {nodes,edges};
}
function build(options={}){
 const ids=new Set(),entries=[];
 for(const file of fs.readdirSync(directory).filter(f=>/\.json$/i.test(f)).sort()){
  const basename=file.replace(/\.json$/i,''),id=basename.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');if(!id||id==='blank'||ids.has(id))throw Error('Nome file non valido o ambiguo: '+file);ids.add(id);
  const data=JSON.parse(fs.readFileSync(path.join(directory,file),'utf8').replace(/^\uFEFF/,''));if(!Array.isArray(data.persons)||!data.persons.length||!Array.isArray(data.unions))throw Error('Albero non valido: '+file);
  const people=new Map(data.persons.map(p=>[p.id,p])),unions=new Map(data.unions.map(u=>[u.id,u])),memo=new Map();if(people.size!==data.persons.length||unions.size!==data.unions.length||!people.has(data.rootId))throw Error('ID o riferimento non validi: '+file);
  for(const person of data.persons)if(typeof person.id!=='string'||!person.id||typeof person.name!=='string')throw Error('Persona non valida: '+file);
  for(const union of data.unions)if(typeof union.id!=='string'||!union.id||[union.fatherId,union.motherId].some(id=>id&&!people.has(id)))throw Error('Unione non valida: '+file);
  function generation(id,seen=new Set()){if(memo.has(id))return memo.get(id);if(seen.has(id))throw Error('Ciclo genealogico: '+file);const p=people.get(id);if(!p)throw Error('Persona inesistente: '+id);const u=unions.get(p.birthUnionId);if(p.birthUnionId&&!u)throw Error('Unione inesistente: '+p.birthUnionId);const next=new Set(seen);next.add(id);const n=1+Math.max(0,...[u?.fatherId,u?.motherId].filter(Boolean).map(pid=>generation(pid,next)));memo.set(id,n);return n;}
  entries.push({id,title:typeof data.title==='string'&&data.title.trim()?data.title:basename.replace(/[-_]/g,' '),category:data.category||'Albero',scope:data.scope||'',tone:data.tone||'green',sources:Array.isArray(data.sources)?data.sources:[],file:'trees/'+encodeURIComponent(file),people:data.persons.length,generations:Math.max(...data.persons.map(p=>generation(p.id))),preview:preview(data)});
 }
 const output='// Generated automatically from trees/*.json.\nglobalThis.GenealogyCatalog={entries:'+JSON.stringify(entries)+'};\n';fs.writeFileSync(path.join(root,'catalog-data.js'),output);
 if(options.site){const target=path.join(root,'_site');if(fs.existsSync(target))throw Error('_site esiste già: usa una cartella di lavoro pulita.');fs.mkdirSync(target);for(const item of fs.readdirSync(root,{withFileTypes:true})){if(item.isFile()&&(/\.(html|css|js)$/.test(item.name)||item.name==='.nojekyll'))fs.copyFileSync(path.join(root,item.name),path.join(target,item.name));}for(const name of ['trees','assets'])if(fs.existsSync(path.join(root,name)))fs.cpSync(path.join(root,name),path.join(target,name),{recursive:true});}
 return entries;
}
if(require.main===module){try{console.log(build({site:process.argv.includes('--site')}).length+' alberi rilevati automaticamente.');}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={build};
