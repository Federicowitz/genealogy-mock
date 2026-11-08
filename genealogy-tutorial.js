
'use strict';
(function(root){
 const $=id=>document.getElementById(id),KEY='genealogy-mock:tutorial:v1:dismissed';
 const dismissed=()=>{try{return localStorage.getItem(KEY)==='true';}catch{return false;}};
 const settings=document.createElement('section');settings.id='settingsTutorial';
 settings.innerHTML=`<h3>Guida alla navigazione</h3><button type="button" class="btn" id="reopenTutorial">Riapri tutorial</button><label class="tutorial-preference"><input type="checkbox" id="hideTutorial"> Non mostrare più il tutorial all’ingresso</label><p class="muted">Puoi riaprirlo in qualsiasi momento. La preferenza resta in questo browser.</p>`;
 $('settingsDisplay').after(settings);
 const dialog=document.createElement('dialog');dialog.className='navigation-tutorial';
 dialog.setAttribute('aria-labelledby','tutorialTitle');dialog.setAttribute('aria-describedby','tutorialText');
 dialog.innerHTML=`<div class="tutorial-top"><span id="tutorialProgress"></span><button type="button" class="tutorial-skip" id="tutorialSkip">Salta guida</button></div><div aria-live="polite" aria-atomic="true"><p class="tutorial-kicker" id="tutorialKicker"></p><h2 id="tutorialTitle"></h2><p id="tutorialText"></p></div><label class="tutorial-preference"><input type="checkbox" id="tutorialRemember" checked> Non mostrare più</label><div class="tutorial-actions"><button type="button" class="btn" id="tutorialPrevious">Indietro</button><button type="button" class="btn primary" id="tutorialNext">Avanti</button></div>`;
 document.body.append(dialog);
 const steps=[
  {target:'.reference-box',kicker:'Il tuo punto di partenza',title:'Un albero, tanti punti di vista',text:'Stai esplorando la persona scelta. Nel riquadro “Stai esplorando” trovi il nome attuale; “Riferimento base” ti riporta sempre al punto di partenza salvato.'},
  {target:'#headerNavigation',kicker:'Segui un altro ramo',title:'Attiva navigazione',text:'Premi il pulsante con la bussola “Attiva navigazione”, in alto. Poi clicca una persona nell’albero: diventerà il centro della vista e potrai esplorarne i familiari. La freccia nel riquadro ti riporta alla persona precedente.'},
  {target:'.header-search',kicker:'Trova e osserva',title:'Cerca chi vuoi conoscere',text:'La ricerca in alto ti porta direttamente a un personaggio, anche se non è nella vista attuale. Trascina lo sfondo per muoverti e usa + e − per lo zoom. Con la navigazione disattivata, seleziona una persona e premi “Scheda” per leggerne il profilo.'},
  {target:'#settingsToggle',kicker:'La guida resta a disposizione',title:'Ora segui la tua curiosità',text:'Trovi sempre “Riapri tutorial” nelle Impostazioni, insieme alla preferenza per mostrarlo all’ingresso. Lascia spuntato “Non mostrare più” per ricordare la tua scelta. Iniziamo attivando la navigazione?'}
 ];
 let step=0,highlight=null,returnFocus=null;
 function remember(value){try{localStorage.setItem(KEY,String(value));}catch{}$('hideTutorial').checked=value;}
 function clearHighlight(){highlight?.classList.remove('tutorial-highlight');highlight=null;}
 function paint(){
  clearHighlight();const current=steps[step];highlight=document.querySelector(current.target);highlight?.classList.add('tutorial-highlight');
  $('tutorialProgress').textContent=String(step+1).padStart(2,'0')+' / 04';$('tutorialKicker').textContent=current.kicker;
  $('tutorialTitle').textContent=current.title;$('tutorialText').textContent=current.text;
  $('tutorialPrevious').disabled=step===0;$('tutorialNext').textContent=step===steps.length-1?'Attiva navigazione e inizia':'Avanti';
 }
 function finish(activate=false){
  remember($('tutorialRemember').checked);clearHighlight();dialog.close();
  if(activate&&$('navigationToggle').getAttribute('aria-pressed')!=='true')$('headerNavigation').click();
  const target=returnFocus?.isConnected&&!returnFocus.closest('[hidden]')?returnFocus:$('headerNavigation');target?.focus({preventScroll:true});
 }
 function open(){
  if(dialog.open)return;returnFocus=document.activeElement;
  root.GenealogyShell?.close('settings');root.GenealogyShell?.close('tools');
  step=0;$('tutorialRemember').checked=true;paint();dialog.showModal();$('tutorialNext').focus();
 }
 $('hideTutorial').checked=dismissed();$('hideTutorial').onchange=e=>remember(e.target.checked);
 $('reopenTutorial').onclick=open;$('tutorialSkip').onclick=()=>finish();
 $('tutorialPrevious').onclick=()=>{if(step>0){step--;paint();}};
 $('tutorialNext').onclick=()=>{if(step<steps.length-1){step++;paint();}else finish(true);};
 dialog.addEventListener('cancel',event=>{event.preventDefault();finish();});
 root.GenealogyTutorial={start(){if(!dismissed())open();},open};
})(globalThis);
