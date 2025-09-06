// ui.js
(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  function h(tag,attrs={},...children){
    const e=document.createElement(tag);
    for(const [k,v] of Object.entries(attrs||{})){
      if(k==='class') e.className=v;
      else if(k==='html') e.innerHTML=v;
      else if(k.startsWith('on') && typeof v==='function') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k,v);
    }
    for(const c of children.flat()){ if(c==null) continue; e.appendChild(typeof c==='string'?document.createTextNode(c):c) }
    return e;
  }
  function flash(el){ el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  function toast(msg){ const t=$('#toast'); t.textContent=msg; t.style.display='block'; clearTimeout(toast._t); toast._t=setTimeout(()=>t.style.display='none',1100); }
  window.UI = { $, $$, h, flash, toast };
})();
