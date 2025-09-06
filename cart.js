// cart.js
(function(){
  const {store, AISLE_ORDER, STORE_TAGS, parseQty, formatQty, stepFor, ensureQtyObject} = window.AppData;
  const { $, h, toast } = window.UI;

  let lastDeleted = null; // {items:[...], where:'single'|'clear'}

  function addToCart(items, recipe=null){
    const data = window.AppData;
    let cart = data.cart;
    for(const it of items){
      const ensured = ensureQtyObject({qty: it.qty, cat: it.cat, name: it.name});
      const incomingQtyStr = ensured.qtyStr;
      const existing = cart.find(x=>data.norm(x.name)===data.norm(it.name) && x.cat===it.cat);
      const source=recipe?{title:recipe.title, qty:incomingQtyStr}:{title:'Manuell', qty:incomingQtyStr};
      if(existing){
        const ex=parseQty(existing.qty||''); const ne=parseQty(incomingQtyStr);
        if(ex.unit&&ne.unit&&ex.unit===ne.unit&&ex.value!=null&&ne.value!=null){
          existing.qty=formatQty(ex.value+ne.value,ex.unit);
        }else{
          existing.qty = existing.qty ? `${existing.qty} + ${incomingQtyStr}` : incomingQtyStr;
        }
        existing.addon = existing.addon || !!it.addon;
        (existing.sources=existing.sources||[]).push(source);
      }else{
        cart.push({ id:crypto.randomUUID(), name:it.name, qty:incomingQtyStr, cat:it.cat, addon:!!it.addon, checked:false, purchased:false, sources:[source], lists: (it.lists||[]) });
      }
    }
    store.save('cart',cart); renderCart();
  }

  function applyStoreTagToChecked(storeName){
    let changed=false;
    window.AppData.cart.forEach(i=>{
      if(i.checked){
        i.lists = Array.isArray(i.lists)? i.lists : [];
        if(!i.lists.includes(storeName)){ i.lists.push(storeName); changed=true; }
      }
    });
    if(changed){ store.save('cart', window.AppData.cart); renderCart(); toast(`Tag „${storeName}” hinzugefügt`); }
  }
  function clearTagsFromChecked(){
    let changed=false;
    window.AppData.cart.forEach(i=>{
      if(i.checked && i.lists && i.lists.length){ i.lists = []; changed=true; }
    });
    if(changed){ store.save('cart', window.AppData.cart); renderCart(); toast('Tags entfernt'); }
  }
  function removeTagFromItem(item, tag){
    if(!item.lists) return;
    item.lists = item.lists.filter(t=>t!==tag);
    store.save('cart', window.AppData.cart);
    renderCart();
  }

  function renderCart(){
    const {cart} = window.AppData;
    const cartList = $('#cart-list');
    cartList.innerHTML='';
    if(!cart.length){ cartList.appendChild(h('div',{class:'card'},h('div',{class:'muted'},'Dein Einkaufskorb ist leer.'))); return; }

    const storeFilter = store.load('storeFilter','');

    for(const cat of AISLE_ORDER){
      const items=cart.filter(i=>{
        if(i.cat!==cat) return false;
        if(storeFilter && !(i.lists||[]).includes(storeFilter)) return false;
        return true;
      });
      if(!items.length) continue;

      const sec=h('div',{class:'card',style:'padding:10px'}); sec.appendChild(h('div',{class:'section-title',style:'margin-bottom:4px;'},cat));
      items.forEach(it=>{
        const line=h('div',{class:'checkline'});
        const cb=h('input',{type:'checkbox',checked:it.checked,onchange:()=>{ it.checked=cb.checked; store.save('cart',window.AppData.cart); }});

        // gekauft-Style
        if(it.purchased){
          line.style.opacity='0.55';
          line.style.filter='grayscale(0.7)';
          line.style.textDecoration='line-through';
        }else{
          line.style.opacity='';
          line.style.filter='';
          line.style.textDecoration='';
        }

        // Linke Spalte: nur Name (+add-on) und die Store-Tags (mit × zum Entfernen)
        const left=h('div',{},
          h('div',{},`${it.name}${it.addon?' • add-on':''}`),
          (function(){
            const info=h('div',{class:'info'});
            if(it.lists && it.lists.length){
              it.lists.forEach(tag=>{
                const pill=h('span',{class:'pill',style:'margin-right:6px;'}, tag, ' ', h('span',{class:'x',title:'Tag entfernen',onclick:()=>removeTagFromItem(it, tag)},'×'));
                info.append(pill);
              });
            }
            return info;
          })()
        );

        const qtyInput=h('input',{type:'text',value:it.qty||'', 'aria-label':'Menge bearbeiten'});
        qtyInput.addEventListener('change',()=>{ it.qty=qtyInput.value; store.save('cart',window.AppData.cart); });
        const minus=h('button',{type:'button',class:'btn neutral icon small',onclick:()=>{ const q=parseQty(qtyInput.value||it.qty||''); if(q.value==null) return; const step=stepFor(q); const newVal=Math.max(0,q.value-step); qtyInput.value=formatQty(newVal,q.unit)||String(newVal); it.qty=qtyInput.value; store.save('cart',window.AppData.cart);} },'–');
        const plus =h('button',{type:'button',class:'btn neutral icon small',onclick:()=>{ const q=parseQty(qtyInput.value||it.qty||''); if(q.value==null) return; const step=stepFor(q); const newVal=q.value+step; qtyInput.value=formatQty(newVal,q.unit)||String(newVal); it.qty=qtyInput.value; store.save('cart',window.AppData.cart);} },'+');

        // Info-Dialog mit Herkunft/Mengenaufschlüsselung
        const infoBtn=h('button',{type:'button',title:'Herkunft anzeigen',class:'btn neutral icon small',onclick:()=>{ const list=(it.sources||[]).map(s=>`• ${s.qty?`${s.qty} – `:''}${s.title}`).join('\n'); alert(`Zutat: ${it.name}\nKategorie: ${it.cat}\nGesamt: ${it.qty||'–'}${it.addon?' (add-on)':''}\n\nHerkunft:\n${list||'—'}`); }},'?');

        // „Gekauft“-Toggle
        const boughtBtn=h('button',{type:'button',class:'btn neutral small',onclick:()=>{ it.purchased=!it.purchased; store.save('cart',window.AppData.cart); renderCart(); }}, it.purchased?'Gekauft aufheben':'Gekauft');

        const del=h('button',{type:'button',class:'btn neutral small',onclick:()=>{ lastDeleted={items:[{...it}], where:'single'}; window.AppData.cart=window.AppData.cart.filter(x=>x.id!==it.id); store.save('cart',window.AppData.cart); renderCart(); showUndo('1 Artikel gelöscht'); }},'Löschen');

        const qtyWrap=h('div',{class:'qty'},minus,qtyInput,plus);
        line.append(cb,left,h('span',{class:'right'}),qtyWrap,infoBtn,boughtBtn,del); sec.appendChild(line);
      });
      cartList.appendChild(sec);
    }
  }

  function showUndo(msg){
    const t=document.getElementById('toast');
    t.textContent=msg+' — Rückgängig';
    t.style.display='block';
    t.style.cursor='pointer';
    function handler(){
      if(lastDeleted && lastDeleted.items && lastDeleted.items.length){
        window.AppData.cart.push(...lastDeleted.items);
        window.AppData.store.save('cart', window.AppData.cart);
        renderCart();
        toast('Wiederhergestellt');
      }
      cleanup();
    }
    function cleanup(){ t.style.display='none'; t.style.cursor='default'; t.removeEventListener('click',handler); }
    t.addEventListener('click',handler);
    clearTimeout(showUndo._t);
    showUndo._t=setTimeout(()=>cleanup(), 4000);
  }

  // Toolbar actions
  function checkAll(){ window.AppData.cart.forEach(i=>i.checked=true); store.save('cart',window.AppData.cart); renderCart(); }
  function uncheckAll(){ window.AppData.cart.forEach(i=>i.checked=false); store.save('cart',window.AppData.cart); renderCart(); }
  function clearCart(){
    if(!confirm('Einkaufskorb wirklich leeren?')) return;
    lastDeleted={items:[...window.AppData.cart], where:'clear'};
    window.AppData.cart=[]; store.save('cart',window.AppData.cart); renderCart(); showUndo('Korb geleert');
  }

  // Store-Filter
  function applyStoreFilter(v){ store.save('storeFilter', v||''); renderCart(); }
  function getStoreFilter(){ return store.load('storeFilter',''); }

  window.Cart = { addToCart, renderCart,
    applyStoreTagToChecked, clearTagsFromChecked, checkAll, uncheckAll, clearCart,
    applyStoreFilter, getStoreFilter
  };
})();
