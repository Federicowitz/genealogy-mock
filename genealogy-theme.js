'use strict';
(()=>{
 const key='genealogy-mock:theme',system=matchMedia('(prefers-color-scheme: dark)');
 let preference;try{preference=localStorage.getItem(key);}catch(_){}
 if(!['light','dark'].includes(preference))preference=null;
 let current;
 function apply(theme){
  current=theme;document.documentElement.dataset.theme=theme;
  const button=document.getElementById('themeToggle'),dark=theme==='dark';
  if(button){button.setAttribute('aria-pressed',String(dark));button.title=dark?'Passa alla modalità chiara':'Passa alla modalità scura';button.setAttribute('aria-label',button.title);button.innerHTML='<span aria-hidden="true">'+(dark?'☀':'☾')+'</span><span class="label"> '+(dark?'Chiara':'Scura')+'</span>';}
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=dark?'#151e1a':'#203e34';
 }
 apply(preference||(system.matches?'dark':'light'));
 document.addEventListener('DOMContentLoaded',()=>{
  apply(current);
  document.getElementById('themeToggle').onclick=()=>{preference=current==='dark'?'light':'dark';apply(preference);try{localStorage.setItem(key,preference);}catch(_){} };
 });
 system.addEventListener?.('change',()=>{if(!preference)apply(system.matches?'dark':'light');});
})();
