'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),{once}=require('node:events');

function catalog(source){const context={};vm.runInNewContext(source,context);return context.GenealogyCatalog.entries;}
async function until(check,description){const deadline=Date.now()+10000;while(Date.now()<deadline){if(await check())return;await new Promise(resolve=>setTimeout(resolve,50));}throw Error('Timeout: '+description);}

(async()=>{let isolated,server,closed=false;try{
 isolated=await fs.mkdtemp(path.join(os.tmpdir(),'genealogy-catalog-test-'));
 await fs.cp(path.resolve(__dirname,'..'),isolated,{recursive:true,filter:source=>!['.git','node_modules','_site'].includes(path.basename(source))});
 const {build}=require(path.join(isolated,'tools/build-catalog.cjs')),trees=path.join(isolated,'trees'),index=path.join(isolated,'catalog-data.js');
 const initial=build();assert.equal(initial.length,2);assert.deepEqual((await fs.readdir(trees)).sort(),['aurora.json','windsor.json']);
 const windsor=initial.find(e=>e.id==='windsor');assert.equal(windsor.people,19);assert.equal(windsor.generations,6);assert(windsor.preview.nodes.some(n=>n.label==='Elizabeth II'));for(let i=1;i<windsor.preview.nodes.length;i++){const a=windsor.preview.nodes[i-1],b=windsor.preview.nodes[i];if(a.y===b.y)assert(a.x+a.w<b.x,'Preview nodes do not overlap');}
 const sample={version:4,rootId:'child',persons:[{id:'parent',name:'Genitore'},{id:'child',name:'Figlio',birthUnionId:'family'}],unions:[{id:'family',fatherId:'parent'}]};
 const file=path.join(trees,'Nuovo albero #1.json');await fs.writeFile(file,JSON.stringify(sample));let entry=build().find(e=>e.id==='nuovo-albero-1');assert.equal(entry.title,'Nuovo albero #1');assert.equal(entry.file,'trees/Nuovo%20albero%20%231.json');assert.equal(entry.people,2);assert.equal(entry.generations,2);assert.deepEqual(entry.preview.nodes.map(n=>n.label),['Genitore','Figlio']);
 sample.title='Titolo personalizzato';await fs.writeFile(file,JSON.stringify(sample));assert.equal(build().find(e=>e.id==='nuovo-albero-1').title,sample.title);
 const good=await fs.readFile(index,'utf8');sample.unions[0].fatherId='missing';await fs.writeFile(file,JSON.stringify(sample));assert.throws(()=>build(),/Unione non valida/);assert.equal(await fs.readFile(index,'utf8'),good,'Invalid JSON does not replace the published catalog');
 sample.unions[0].fatherId='child';await fs.writeFile(file,JSON.stringify(sample));assert.throws(()=>build(),/Ciclo genealogico/);sample.unions[0].fatherId='parent';await fs.writeFile(file,JSON.stringify(sample));
 const duplicate=path.join(trees,'nuovo-albero-1.json');await fs.writeFile(duplicate,JSON.stringify(sample));assert.throws(()=>build(),/ambiguo/);await fs.unlink(duplicate);await fs.unlink(file);assert.equal(build().length,2);
 build({site:true});const site=path.join(isolated,'_site');await fs.access(path.join(site,'index.html'));await fs.access(path.join(site,'tree.html'));await fs.access(path.join(site,'assets/favicon-32.png'));await fs.access(path.join(site,'trees/aurora.json'));assert.equal(catalog(await fs.readFile(path.join(site,'catalog-data.js'),'utf8')).length,2);for(const name of ['tools','.github','.git','README.md'])await assert.rejects(fs.access(path.join(site,name)));
 // Exercise the real local preview and its watcher; always stop it afterwards.
 let output='';server=spawn(process.execPath,[path.join(isolated,'tools/preview.cjs')],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe'],windowsHide:true});server.on('exit',()=>{closed=true;});server.stdout.on('data',chunk=>output+=chunk);server.stderr.on('data',chunk=>output+=chunk);
 await until(()=>/Genealogy: http:\/\/127\.0\.0\.1:\d+/.test(output),'preview startup');const base=output.match(/http:\/\/127\.0\.0\.1:\d+/)[0];
 assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/tools/build-catalog.cjs')).status,404);assert.equal((await fetch(base+'/.github/workflows/pages.yml')).status,404);
 await fs.writeFile(file,JSON.stringify(sample));await until(async()=>catalog(await (await fetch(base+'/catalog-data.js')).text()).length===3,'automatic card creation');assert.equal((await (await fetch(base+'/trees/Nuovo%20albero%20%231.json')).json()).title,sample.title);
 await fs.unlink(file);await until(async()=>catalog(await (await fetch(base+'/catalog-data.js')).text()).length===2,'automatic card removal');
 console.log('PASS automatic discovery, metadata-free JSON, generated preview, validation, collision/cycle handling, static publication package and local watcher.');
}finally{
 if(server&&!closed){const exit=once(server,'exit');server.kill();await exit;}
 if(isolated){const target=path.resolve(isolated);if(!target.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(target).startsWith('genealogy-catalog-test-'))throw Error('Unexpected cleanup path');await fs.rm(target,{recursive:true,force:true});}
}})().catch(error=>{console.error(error);process.exitCode=1;});
