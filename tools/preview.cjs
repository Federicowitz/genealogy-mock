'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{build}=require('./build-catalog.cjs');
const root=path.resolve(__dirname,'..');build();let timer;
const watcher=fs.watch(path.join(root,'trees'),(_event,file)=>{if(file&&!/\.json$/i.test(file))return;clearTimeout(timer);timer=setTimeout(()=>{try{console.log(build().length+' alberi: catalogo aggiornato. Ricarica la pagina.');}catch(error){console.error(error.message);}},120);});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname),relative=pathname==='/'?'index.html':pathname.slice(1),target=path.resolve(root,relative);if(!['GET','HEAD'].includes(req.method)||!target.startsWith(root+path.sep)||relative.split(/[\\/]/).some(p=>p.startsWith('.')||['tools','node_modules','_site'].includes(p))){res.writeHead(404);res.end();return;}const bytes=fs.readFileSync(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?'':bytes);}catch{res.writeHead(404);res.end('File non trovato.');}});
server.listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('Genealogy: http://127.0.0.1:'+server.address().port+' — aggiungi JSON in trees/; Ctrl+C per chiudere.'));
server.on('error',error=>{console.error(error.message);watcher.close();process.exitCode=1;});
function close(){clearTimeout(timer);watcher.close();server.close(()=>process.exit(0));}for(const signal of ['SIGINT','SIGTERM'])process.on(signal,close);
