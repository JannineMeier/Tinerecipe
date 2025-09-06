// main.js
(function(){
  // simple manifest & icons
  (function(){
    function makeIcon(size, letter='R'){
      const c=document.createElement('canvas'); c.width=size; c.height=size;
      const g=c.getContext('2d'); g.fillStyle='#ff9ad1'; g.fillRect(0,0,size,size);
      g.fillStyle='#fff'; g.font=`${Math.floor(size*0.55)}px 900 system-ui, -apple-system, Segoe UI, Arial`;
      g.textAlign='center'; g.textBaseline='middle'; g.fillText(letter,size/2,size/2+size*0.04); return c.toDataURL('image/png');
    }
    const icon192=makeIcon(192,'R'), icon512=makeIcon(512,'R');
    const l=document.createElement('link'); l.rel='apple-touch-icon'; l.href=icon192; document.head.appendChild(l);
    const manifest={name:"Rezepte & Einkauf (Pink Pastell)", short_name:"Rezepte", start_url:".", display:"standalone",
      background_color:"#ffeef6", theme_color:"#ff74b8",
      icons:[{src:icon192,sizes:"192x192",type:"image/png"},{src:icon512,sizes:"512x512",type:"image/png"}]};
    const blob=new Blob([JSON.stringify(manifest)],{type:"application/manifest+json"});
    const url=URL.createObjectURL(blob); const lm=document.createElement('link'); lm.rel='manifest'; lm.href=url; document.head.appendChild(lm);
  })();

  const { $, $$, toast } = window.UI;
  const { STORE_TAGS } = window.AppData;

  function switchTab(tab){
    $$('.tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
    $('#view-recipes').style.display=(tab==='recipes')?'block':'none';
    $('#view-products').style.display=(tab==='products')?'block':'none';
    $('#view-cart').style.display=(tab==='cart')?'block':'none';
    if(tab==='cart') window.Cart.renderCart();
    if(tab==='products') window.Products.renderProducts();
    if(tab==='recipes') window.Recipes.renderRecipeList();
  }
  function wireTabs(){
    $('#tab-recipes').addEventListener('click',()=>switchTab('recipes'));
    $('#tab-products').addEventListener('click',()=>switchTab('products'));
    $('#tab-cart').addEventListener('click',()=>switchTab('cart'));
  }

  // Import / Export
  function exportAll(){
    const data={version:6, exportedAt:new Date().toISOString(), recipes:window.AppData.recipes, products:window.AppData.products, cart:window.AppData.cart};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`rezepte_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),3000);
  }
  function importAllFromFile(file){
    const r=new FileReader();
    r.onload=()=>{
      try{
        const data=JSON.parse(r.result);
        if(!data || typeof data!=='object') throw new Error('Ungültige Datei');
        if(!Array.isArray(data.recipes) || !Array.isArray(data.products) || !Array.isArray(data.cart)) throw new Error('Felder fehlen');
        if(!confirm('Bestehende Daten durch Import ersetzen?')) return;
        window.AppData.recipes=data.recipes; window.AppData.products=data.products; window.AppData.cart=data.cart;
        window.AppData.store.save('recipes',window.AppData.recipes);
        window.AppData.store.save('products',window.AppData.products);
        window.AppData.store.save('cart',window.AppData.cart);
        window.Recipes.renderRecipeList(); window.Products.renderProducts(); window.Cart.renderCart();
        toast('Import erfolgreich');
      }catch(e){ alert('Konnte nicht importieren: '+e.message); }
      finally{ document.getElementById('import-file').value=''; }
    };
    r.readAsText(file);
  }
  function wireImportExport(){
    $('#btn-export').addEventListener('click',exportAll);
    $('#btn-import').addEventListener('click',()=>$('#import-file').click());
    $('#import-file').addEventListener('change',e=>{
      const f=e.target.files && e.target.files[0]; if(!f) return; importAllFromFile(f);
    });
  }

  function wireCartToolbar(){
    // distinct handlers
    $('#btn-clear-cart').addEventListener('click',()=>window.Cart.clearCart());
    $('#btn-uncheck-all').addEventListener('click',()=>window.Cart.uncheckAll());
    $('#btn-check-all').addEventListener('click',()=>window.Cart.checkAll());

    // store tag buttons
    const wrap = document.getElementById('store-buttons'); wrap.innerHTML='';
    STORE_TAGS.forEach(s=>wrap.appendChild(
      window.UI.h('button',{type:'button',class:'btn pink small',onclick:()=>window.Cart.applyStoreTagToChecked(s)},s)
    ));
    document.getElementById('btn-clear-tags-selected').addEventListener('click',()=>window.Cart.clearTagsFromChecked());

    // store filter select
    const sel = document.getElementById('store-filter'); sel.innerHTML='';
    sel.appendChild(new Option('Alle Stores',''));
    STORE_TAGS.forEach(s=>sel.appendChild(new Option(s,s)));
    sel.value = window.Cart.getStoreFilter() || '';
    sel.addEventListener('change',()=>window.Cart.applyStoreFilter(sel.value));
  }

  function init(){
    wireTabs();
    window.Recipes.buildEditor();
    window.Products.initProductsUI();
    window.Recipes.renderTagPickers(null);
    window.Recipes.renderFilterChips();
    window.Recipes.renderRecipeList();
    window.Products.renderProducts();
    window.Cart.renderCart();
    wireCartToolbar();

    document.getElementById('toggle-editor').addEventListener('click',(e)=>{ e.preventDefault(); const d=document.getElementById('recipe-editor'); d.open=!d.open; });
    document.getElementById('search-recipes').addEventListener('input',()=>window.Recipes.renderRecipeList());
    window.UI.$$('button').forEach(b=>{ if(!b.hasAttribute('type')) b.setAttribute('type','button'); });
  }

  init();
})();
