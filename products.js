// products.js
(function(){
  const {CATS, AISLE_ORDER, store, products, UNIT_OPTIONS, defaultUnitForCategory, defaultAmountForUnit} = window.AppData;
  const { $, h, toast, flash } = window.UI;

  function buildAddProductForm(){
    const box = $('#product-add'); box.innerHTML='';
    const nameInput=h('input',{id:'p-name',type:'text',placeholder:'z. B. Rucola'});
    const catSel=(function(){ const s=h('select',{id:'p-cat'}); CATS.forEach(c=>s.appendChild(h('option',{value:c},c))); return s; })();
    const row=h('div',{class:'row row-2'},
      h('div',{}, h('label',{class:'muted'},'Produktname'), nameInput),
      h('div',{}, h('label',{class:'muted'},'Kategorie'), catSel),
    );
    const actions=h('div',{style:'display:flex; gap:8px; margin-top:10px;'},
      h('button',{type:'button',class:'btn pink',onclick:saveProd},'Produkt speichern'),
      h('button',{type:'button',class:'btn neutral',onclick:()=>box.style.display='none'},'Abbrechen')
    );
    box.append(row,actions);
    function saveProd(){
      const name=nameInput.value.trim(); if(!name){ alert('Bitte Produktname eingeben'); return; }
      const cat=catSel.value;
      const exists=window.AppData.products.some(p=>window.AppData.norm(p.name)===window.AppData.norm(name)&&p.cat===cat);
      if(exists){ alert('Produkt existiert bereits in dieser Kategorie'); return; }
      window.AppData.products.unshift({id:crypto.randomUUID(), name, cat}); store.save('products',window.AppData.products);
      nameInput.value=''; catSel.value='Gemüse'; box.style.display='none'; renderProducts(); toast('Produkt gespeichert');
    }
  }

  function productLine(it){
    const defU=defaultUnitForCategory(it.cat); const defA=defaultAmountForUnit(defU);
    const line=h('div',{class:'card', style:'padding:10px; display:grid; grid-template-columns: 1fr auto auto auto; gap:8px; align-items:center;'});
    const name=h('div',{}, it.name, ' ', h('span',{class:'pill'},it.cat));
    const amount=h('input',{type:'number', step:'any', inputmode:'decimal', value:defA, style:'width:100px;', 'aria-label':'Menge'});
    const unit=(function(){ const s=h('select'); UNIT_OPTIONS.forEach(u=>s.appendChild(h('option',{value:u},u||'—'))); s.value=defU; return s; })();
    const addBtn=h('button',{type:'button',class:'btn pink small'},'+ in Korb');
    addBtn.addEventListener('click',()=>{
      let v = amount.value? parseFloat(amount.value): null;
      let u = unit.value || defU;
      if(v==null || isNaN(v)) v = defaultAmountForUnit(u);
      const qtyStr = window.AppData.formatQty(v,u);
      window.Cart.addToCart([{name:it.name, qty:qtyStr, cat:it.cat, addon:false}]);
      flash(line); toast(`${it.name} hinzugefügt`);
    });
    line.append(name, amount, unit, addBtn);
    return line;
  }

  function section(cat, items){
    if(!items.length) return null;
    const details = h('details',{class:'collapsible card', open:false});
    const sum=h('summary',{},h('span',{class:'chev'},'▶'),' ',h('strong',{},cat),' ',h('span',{class:'muted'},`(${items.length})`));
    details.appendChild(sum);
    items.forEach(it=>details.appendChild(productLine(it)));
    return details;
  }

  function renderProducts(){
    const wrap=$('#product-list'); wrap.innerHTML='';
    const q=(($('#search-products').value)||'').toLowerCase();
    for(const cat of AISLE_ORDER){
      const items=window.AppData.products.filter(p=>p.cat===cat && (!q || p.name.toLowerCase().includes(q) || cat.toLowerCase().includes(q)));
      const sec=section(cat, items); if(sec) wrap.appendChild(sec);
    }
    if(!wrap.children.length) wrap.appendChild(h('div',{class:'card'},h('div',{class:'muted'},'Keine Produkte gefunden.')));
  }

  function initProductsUI(){
    $('#btn-add-product-row').addEventListener('click',()=>{ const box=$('#product-add'); if(box.style.display==='none'||!box.style.display){ box.style.display='block'; buildAddProductForm(); } else { box.style.display='none'; }});
    $('#search-products').addEventListener('input',renderProducts);
  }

  window.Products = { renderProducts, initProductsUI };
})();
