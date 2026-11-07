'use strict';
(function(root){
 const PREFIX=root.GenealogyMock.prefix,STABLE=PREFIX+'stable',RECOVERY=PREFIX+'recovery',PREVIOUS=PREFIX+'previous',INTERVAL=5*60*1000;
 const fingerprint=text=>{let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(16);};
 function validate(text){const data=JSON.parse(text);if(!data||!Array.isArray(data.persons)||!data.persons.length||!Array.isArray(data.unions))throw Error('Il JSON non contiene un albero valido.');return data;}
 function read(key){try{return localStorage.getItem(key);}catch{return null;}}
 function write(key,value){try{localStorage.setItem(key,value);}catch{throw Error('Salvataggio locale non disponibile o spazio esaurito. Esporta una copia JSON per conservare il lavoro.');}}
 const seedText=()=>JSON.stringify(root.GENEALOGY_DEMO,null,2)+'\n';
 function current(){const raw=read(STABLE);if(raw){const record=JSON.parse(raw);validate(record.document);return record;}const document=seedText();return {document,revision:fingerprint(document)};}
 async function loadInitial(){await root.GenealogyMock.ready;
  // Retain edits made in the earlier single-tree demo. The marker is outside
  // the per-tree prefix so resetting Aurora does not restore the old copy.
  const marker='genealogy-mock:migrated-aurora-v1';
  if(root.GenealogyMock.id==='aurora'&&!read(marker)){
   const suffixes=['stable','recovery','previous','draft','draft-draft-info','draft-previous-draft'];let migrated=false;
   for(const suffix of suffixes){const old=read('genealogy-mock:'+suffix);if(old!==null){if(read(PREFIX+suffix)===null)write(PREFIX+suffix,old);migrated=true;}}
   if(migrated)write(marker,'true');
  }
  const record=current();return {data:validate(record.document),text:record.document,baseHash:fingerprint(record.document),revision:record.revision};}
 class Archive{
  constructor({initialText,baselineDocument,revision,onStatus=()=>{}}){Object.assign(this,{expectedText:initialText,baselineDocument,revision,baseHash:fingerprint(initialText),onStatus,connected:true,queue:Promise.resolve(),lastAction:'Demo locale · modifiche solo su questo browser',lastRecoveryDocument:null});}
  dirty(document){return document!==this.baselineDocument;}
  enqueue(action){const next=this.queue.then(action);this.queue=next.catch(()=>{});return next;}
  saveStable(document){return this.enqueue(async()=>{validate(document);const previous=current();if(previous.revision!==this.revision)throw Error('Un’altra scheda ha salvato modifiche. Esporta la tua bozza prima di ricaricare e confrontare le versioni.');const revision=fingerprint(document),savedAt=new Date().toISOString();write(PREVIOUS,previous.document);write(STABLE,JSON.stringify({document,revision,savedAt}));Object.assign(this,{expectedText:document,baselineDocument:document,revision,baseHash:fingerprint(document),lastAction:'Copia salvata in questo browser'});this.onStatus();return {written:true,revision,savedAt};});}
  autosave(document){return this.enqueue(async()=>{if(!this.dirty(document)||this.lastRecoveryDocument===document)return {written:false};validate(document);const savedAt=new Date().toISOString();write(RECOVERY,JSON.stringify({document,savedAt}));this.lastRecoveryDocument=document;this.lastAction='Bozza di recupero salvata nel browser';this.onStatus();return {written:true,savedAt};});}
  async loadRecovery(){const raw=read(RECOVERY);if(!raw)throw Error('Non ci sono ancora copie di recupero in questo browser.');const record=JSON.parse(raw);return {...validate(record.document),_recovery:{savedAt:record.savedAt}};}
 }
 function resetDemo(){root.GenealogyMock.resetting=true;try{const keys=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(PREFIX)&&key!==PREFIX+'theme')keys.push(key);}for(const key of keys)localStorage.removeItem(key);}catch{root.GenealogyMock.resetting=false;alert('Impossibile ripristinare la demo: memoria locale non disponibile.');return;}location.reload();}
 root.GenealogyFiles={Archive,loadInitial,fingerprint,validate,INTERVAL,resetDemo};
})(globalThis);
