'use strict';
(function(root){
 const catalog=root.GenealogyCatalog,id=new URLSearchParams(location.search).get('tree')||'game-of-thrones';
 const blank={id:'blank',title:'Nuovo albero',scope:'Copia locale',sources:[]};const entry=id==='blank'?blank:catalog.entries.find(e=>e.id===id);
 root.GenealogyMock={id,entry,prefix:'genealogy-mock:tree:'+id+':',resetting:false};
 root.GenealogyMock.ready=new Promise((resolve,reject)=>{
  if(!entry){reject(Error('Albero non presente nel catalogo. Torna alla raccolta per sceglierne uno.'));return;}
  document.title=entry.title+' · Genealogy';
  if(id==='blank'){root.GENEALOGY_DEMO={version:4,rootId:'first-person',persons:[{id:'first-person',name:'Prima persona',gender:'u',birthUnionId:null}],unions:[],relationships:[]};resolve();return;}
  if(location.protocol==='file:'){reject(Error('Per aprire gli alberi avvia node tools/preview.cjs e usa http://127.0.0.1:4173/.'));return;}
  fetch(entry.file,{cache:'no-store'}).then(response=>{if(!response.ok)throw Error('Impossibile caricare il JSON dell’albero.');return response.json();}).then(data=>{root.GENEALOGY_DEMO=data;resolve();}).catch(reject);
 });
 root.GenealogyMock.ready.catch(()=>{});
})(globalThis);
