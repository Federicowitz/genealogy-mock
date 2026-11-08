'use strict';
(()=>{const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function cover(preview){const nodes=preview?.nodes||[],edges=preview?.edges||[];return '<svg viewBox="0 0 560 300" aria-hidden="true">'+edges.map(d=>'<path class="edge" d="'+escape(d)+'"/>').join('')+nodes.map(n=>'<rect class="node" x="'+n.x+'" y="'+n.y+'" width="'+n.w+'" height="42" rx="4"/><text x="'+(n.x+n.w/2)+'" y="'+(n.y+25)+'" text-anchor="middle"><title>'+escape(n.label)+'</title>'+escape(n.label.length>Math.floor(n.w/6)?n.label.slice(0,Math.floor(n.w/6)-1)+'…':n.label)+'</text>').join('')+'</svg>';}

 const entries=GenealogyCatalog.entries.filter(entry=>!['game-of-thrones','windsor'].includes(entry.id));document.getElementById('collectionCount').textContent=entries.length+(entries.length===1?' albero':' alberi');
 document.querySelector('.other-trees').hidden=!entries.length;
 document.getElementById('collection').innerHTML=entries.map((entry,i)=>{let local=false;try{local=!!localStorage.getItem('genealogy-mock:tree:'+entry.id+':stable')||!!localStorage.getItem('genealogy-mock:tree:'+entry.id+':draft');}catch{}return `<a class="tree-card tone-${entry.tone==='ochre'?'ochre':'green'}" href="tree.html?tree=${encodeURIComponent(entry.id)}" aria-label="Apri ${escape(entry.title)}"><div class="card-index"><span>${String(i+1).padStart(2,'0')}</span><span>${escape(entry.category)}</span></div><div class="tree-cover">${cover(entry.preview||[])}</div><div class="card-bottom"><div><h2>${escape(entry.title)}</h2><p class="card-scope">${escape(entry.scope)}</p></div><span class="card-arrow" aria-hidden="true">↗</span></div><div class="card-stats"><span>${entry.people} persone</span><span>${entry.generations} generazioni</span>${local?'<span class="local-copy">Copia locale</span>':''}</div></a>`;}).join('');
 function journey(sectionId,treeId,characters,textId,linkId,statsId){
  const entry=GenealogyCatalog.entries.find(item=>item.id===treeId);if(!entry)return;
  const section=document.getElementById(sectionId);section.hidden=false;document.getElementById(statsId).textContent=entry.people+' persone · un unico albero';
  for(const button of section.querySelectorAll('[data-person]'))button.addEventListener('click',()=>{
   const selected=characters[button.dataset.person];
   for(const option of section.querySelectorAll('[data-person]')){const active=option===button;option.setAttribute('aria-pressed',String(active));option.querySelector('.character-select').textContent=active?'Selezionato ✓':'Scegli '+characters[option.dataset.person].name+' ↗';}
   document.getElementById(textId).textContent=selected.text;
   const link=document.getElementById(linkId);link.href='tree.html?tree='+encodeURIComponent(entry.id)+'&person='+encodeURIComponent(button.dataset.person);link.textContent='Esplora con '+selected.name+' →';
  });
 }
 journey('thrones','game-of-thrones',{
  'jon-snow':{name:'Jon Snow',text:'Entra con Jon Snow e scopri i legami tra il Nord e le altre casate.'},
  daenerys:{name:'Daenerys',text:'Entra con Daenerys e segui le radici e le ramificazioni della dinastia Targaryen.'},
  tyrion:{name:'Tyrion',text:'Entra con Tyrion e scopri come i Lannister si intrecciano con le altre casate.'}
 },'journeyText','enterThrones','thronesStats');
 journey('royals','windsor',{
  'elizabeth-ii':{name:'Elizabeth II',text:'Parti da Elizabeth II per esplorare i rami della famiglia Windsor.'},
  charles:{name:'Charles III',text:'Parti da Charles III e segui i legami con i suoi genitori, fratelli e figli.'},
  william:{name:'William',text:'Parti da William per esplorare genitori, fratello e figli della famiglia Windsor.'}
 },'royalJourneyText','enterRoyals','royalsStats');
})();
