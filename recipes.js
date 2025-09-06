// recipes.js
(function(){
  const {CATS, TAG_CATEGORIES, products, store, recipes, norm, UNIT_OPTIONS, defaultUnitForCategory, unitHintForName, parseQty, ensureQtyObject} = window.AppData;
  const { $, h, toast } = window.UI;

  const selectedFilters=Object.fromEntries(Object.keys(TAG_CATEGORIES).map(k=>[k,new Set()]));
  let photoData=null;

  function buildEditor(){
    const body = $('#editor-body');
    body.innerHTML='';

    const rowTop = h('div',{class:'row row-2'},
      h('div',{}, h('label',{class:'muted'},'Titel'), h('input',{id:'r-title',type:'text',placeholder:'z. B. Strawberry Cheesecake'})),
      h('div',{}, h('label',{class:'muted'},'Link (Video/Quelle)'), h('input',{id:'r-link',type:'url',placeholder:'https://…'}))
    );
    const rowMid = h('div',{class:'row row-2',style:'margin-top:8px;'},
      h('div',{},
        h('label',{class:'muted'},'Foto (optional)'),
        h('input',{id:'r-photo',type:'file',accept:'image/*', onchange:(e)=>handlePhoto(e)}),
        h('img',{id:'r-photo-preview',class:'img-glow',style:'display:none;margin-top:8px; width:100%; max-height:220px; object-fit:cover;'})
      ),
      h('div',{},
        h('label',{class:'muted'},'Anleitung'),
        h('textarea',{id:'r-steps',placeholder:'Kurz die Zubereitung …'})
      )
    );

    const ingredients = h('div',{}, h('div',{class:'section-title',style:'margin-top:8px;'},'Zutaten'), h('div',{id:'ingredients',class:'grid'}));
    const addIngBtn = h('button',{type:'button',class:'btn pink-ghost', onclick:()=>$('#ingredients').appendChild(ingredientRow())},'+ Zutat');

    const tagsBox = h('div',{}, h('div',{class:'section-title',style:'margin-top:12px;'},'Tags'), h('div',{id:'tag-pickers',class:'card',style:'background:#fff'}));

    const actions = h('div',{style:'display:flex; gap:8px; margin-top:12px;'},
      h('button',{type:'button',class:'btn pink', id:'btn-save-recipe', onclick:saveRecipe},'Rezept speichern'),
      h('button',{type:'button',class:'btn neutral', id:'btn-reset-form', onclick:resetForm},'Formular leeren')
    );

    body.append(rowTop,rowMid,ingredients,addIngBtn,tagsBox,actions);
    $('#ingredients').appendChild(ingredientRow()); // erste Zeile
    renderTagPickers(null);
  }

  function handlePhoto(e){
    const f=e.target.files&&e.target.files[0]; const prev=$('#r-photo-preview');
    if(!f){ photoData=null; prev.style.display='none'; return; }
    const r=new FileReader(); r.onload=()=>{ photoData=r.result; prev.src=photoData; prev.style.display='block' }; r.readAsDataURL(f);
  }

  function ingredientRow(data={}){
    const rowId = crypto.randomUUID();
    const datalistId = `dl-${rowId}`;
    const row=h('div',{class:'row',style:'align-items:end; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap:8px; border-bottom:1px dashed var(--border); padding-bottom:8px;'});

    const nameInput=h('input',{type:'text', list:datalistId, placeholder:'z. B. Tomate', value:data.name||''});
    const dl=h('datalist',{id:datalistId});
    Array.from(new Set(products.map(p=>p.name))).sort((a,b)=>a.localeCompare(b,'de')).forEach(n=>dl.appendChild(h('option',{value:n})));

    const qtyInput=h('input',{type:'number', step:'any', inputmode:'decimal', placeholder:'z. B. 200', value:data.amount||''});
    const unitSel=(function(){ const s=h('select'); UNIT_OPTIONS.forEach(u=>s.appendChild(h('option',{value:u},u||'—'))); s.value=data.unit||""; return s; })();
    const catSel=(function(){ const s=h('select'); window.AppData.CATS.forEach(c=>s.appendChild(h('option',{value:c},c))); s.value=data.cat||'Sonstiges'; return s; })();

    const optWrap=h('label',{class:'muted',style:'display:flex;align-items:center;gap:6px;'},
      h('input',{type:'checkbox',checked:!!data.optional}), ' add-on'
    ); // default off

    const del=h('button',{type:'button',class:'btn neutral small',onclick:()=>row.remove()},'✕');

    function guessFromProduct(name){
      const prod = products.find(p=>norm(p.name)===norm(name));
      if(prod) catSel.value = prod.cat;
      const hint = unitHintForName(name);
      if(hint){ unitSel.value = hint.unit; if(!qtyInput.value) qtyInput.value = hint.amount; }
      else if(prod && !unitSel.value){ unitSel.value = defaultUnitForCategory(prod.cat); }
    }
    nameInput.addEventListener('change',()=>guessFromProduct(nameInput.value));
    nameInput.addEventListener('input',()=>guessFromProduct(nameInput.value));

    row.append(
      h('div',{}, h('label',{class:'muted'},'Zutat'), nameInput, dl),
      h('div',{}, h('label',{class:'muted'},'Menge'), qtyInput),
      h('div',{}, h('label',{class:'muted'},'Einheit'), unitSel),
      h('div',{}, h('label',{class:'muted'},'Kategorie'), catSel),
      h('div',{}, optWrap),
      h('div',{}, del)
    );
    return row;
  }

  function saveRecipe(){
    const title=$('#r-title').value.trim(); if(!title){ alert('Bitte Titel eingeben'); return; }
    const link =$('#r-link').value.trim();
    const steps=$('#r-steps').value.trim();

    const rows=Array.from($('#ingredients').children);
    if(rows.length===0){ alert('Bitte mindestens eine Zutat hinzufügen'); return; }

    const ings = rows.map(row=>{
      const [nameIn, qtyIn, unitSel, catSel, optInput] = row.querySelectorAll('input, select');
      const name = nameIn.value.trim();
      const amount = qtyIn.value ? String(qtyIn.value).trim() : '';
      const unit = unitSel.value;
      const cat = catSel.value;
      const optional = optInput.checked;
      const qty = amount ? (unit ? `${amount} ${unit}` : amount) : '';
      return { name, qty, cat, optional, amount, unit };
    }).filter(x=>x.name);

    const tags=collectSelectedTagsFromEditor();
    window.AppData.recipes.unshift({ id:crypto.randomUUID(), title, link, steps, img:photoData, ings, tags });
    store.save('recipes',window.AppData.recipes);
    resetForm(); $('#recipe-editor').open=false; renderRecipeList(); toast('Rezept gespeichert');
  }

  function resetForm(){ photoData=null; buildEditor(); }

  function renderTagPickers(existing=null){
    const wrap=document.getElementById('tag-pickers'); wrap.innerHTML='';
    for(const [cat,tags] of Object.entries(TAG_CATEGORIES)){
      const box=h('div',{class:'tag-group'}); const h4=h('h4',{},cat);
      const chips=h('div',{class:'chips'});
      tags.forEach(t=>{
        const chip=h('button',{type:'button',class:'chip'},t);
        const isOn=!!(existing && existing[cat] && existing[cat].includes(t));
        if(isOn) chip.classList.add('active');
        chip.addEventListener('click',()=>chip.classList.toggle('active'));
        chips.appendChild(chip);
      });
      box.append(h4,chips); wrap.appendChild(box);
    }
  }
  function collectSelectedTagsFromEditor(){
    const result={}; const groups=document.querySelectorAll('#tag-pickers .tag-group');
    groups.forEach(g=>{ const cat=g.querySelector('h4').textContent;
      const active=Array.from(g.querySelectorAll('.chip.active')).map(c=>c.textContent);
      if(active.length) result[cat]=active;
    }); return result;
  }

  function renderFilterChips(){
    const host=document.getElementById('filter-chips'); host.innerHTML='';
    for(const [cat,tags] of Object.entries(TAG_CATEGORIES)){
      const box=h('div',{class:'tag-group'}); const h4=h('h4',{},cat); const chips=h('div',{class:'chips'});
      tags.forEach(t=>{
        const chip=h('button',{type:'button',class:'chip small'},t);
        if(selectedFilters[cat].has(t)) chip.classList.add('active');
        chip.addEventListener('click',()=>{
          if(selectedFilters[cat].has(t)) selectedFilters[cat].delete(t); else selectedFilters[cat].add(t);
          chip.classList.toggle('active'); renderRecipeList();
        });
        chips.appendChild(chip);
      });
      box.append(h4,chips); host.append(box);
    }
  }

  function matchRecipe(r,q){
    const s=(q||'').trim().toLowerCase();
    if(s && !(r.title.toLowerCase().includes(s) || (r.ings&&r.ings.some(i=>i.name.toLowerCase().includes(s))))) return false;
    for(const [cat,set] of Object.entries(selectedFilters)){
      if(set.size===0) continue; const rList=(r.tags&&r.tags[cat])?new Set(r.tags[cat]):new Set();
      if(!Array.from(set).some(x=>rList.has(x))) return false;
    }
    return true;
  }

  function recipeCard(r){
    const card=h('div',{class:'card'});
    if(r.img) card.appendChild(h('img',{src:r.img,class:'img-glow',style:'width:100%; max-height:220px; object-fit:cover; margin-bottom:8px'}));
    card.append(
      h('div',{class:'row'}, h('div',{class:'section-title'},r.title), r.link?h('a',{href:r.link,target:'_blank',class:'muted'},'Link öffnen ↗'):h('span',{class:'muted'},'')),
      h('div',{}, h('h3',{},'Zutaten'),
        ...r.ings.filter(i=>!i.optional).map(i=>h('div',{class:'checkline'},`• ${i.name}`,i.qty?` — ${i.qty}`:'',' ',h('span',{class:'pill'},i.cat))),
        r.ings.some(i=>i.optional)?h('div',{},...r.ings.filter(i=>i.optional).map(i=>h('span',{class:'pill',style:'margin-right:6px;'},i.name+' • add-on'))):null
      ),
      r.steps?h('div',{},h('h3',{},'Anleitung'),h('div',{},r.steps)):null
    );
    if(r.tags && Object.keys(r.tags).length){
      const tagWrap=h('div',{style:'display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;'});
      for(const [cat,list] of Object.entries(r.tags)){ list.forEach(t=>tagWrap.appendChild(h('span',{class:'chip small',style:'background:#ffe0f0;border-color:#ff74b8;color:#b0307d'},`${cat}: ${t}`))); }
      card.appendChild(tagWrap);
    }
    card.appendChild(
      h('div',{style:'display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;'},
        h('button',{type:'button',class:'btn pink',onclick:()=>openAddDialog(r.id)},'Zum Einkaufskorb'),
        h('button',{type:'button',class:'btn pink-ghost',onclick:()=>editRecipe(r.id)},'Bearbeiten'),
        h('button',{type:'button',class:'btn neutral',onclick:()=>deleteRecipe(r.id)},'Löschen')
      )
    );
    return card;
  }

  function renderRecipeList(){
    const q=$('#search-recipes').value; const listEl=$('#recipe-list'); listEl.innerHTML='';
    const list=window.AppData.recipes.filter(r=>matchRecipe(r,q));
    if(!list.length){ listEl.appendChild(h('div',{class:'muted'},q?'Keine Treffer.':'Noch keine Rezepte.')); return; }
    list.forEach(r=>listEl.appendChild(recipeCard(r)));
  }

  function deleteRecipe(id){
    if(!confirm('Rezept wirklich löschen?')) return;
    window.AppData.recipes = window.AppData.recipes.filter(r=>r.id!==id);
    store.save('recipes',window.AppData.recipes); renderRecipeList();
  }

  function editRecipe(id){
    const r=window.AppData.recipes.find(x=>x.id===id); if(!r) return; $('#recipe-editor').open=true; buildEditor();
    $('#r-title').value=r.title; $('#r-link').value=r.link||''; $('#r-steps').value=r.steps||'';
    if(r.img){ photoData=r.img; const prev=$('#r-photo-preview'); prev.src=r.img; prev.style.display='block'; }
    const host=$('#ingredients');
    r.ings.forEach(i=>{
      const q=parseQty(i.qty||''); host.appendChild(ingredientRow({name:i.name, amount:q.value ?? '', unit:q.unit ?? '', cat:i.cat, optional:!!i.optional}));
    });
    renderTagPickers(r.tags||null); window.scrollTo({top:0,behavior:'smooth'});
  }

  function openAddDialog(recipeId){
    const r=window.AppData.recipes.find(x=>x.id===recipeId); if(!r) return;
    const base = r.ings.filter(i=>!i.optional);
    const opts = r.ings.filter(i=>i.optional);

    const overlay = h('div',{style:'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25);z-index:1000;', onclick:(ev)=>{ if(ev.target===overlay) overlay.remove(); }});
    const modal = h('div',{class:'card', style:'max-width:520px;width:92%; border-radius:20px;'});
    modal.appendChild(h('div',{class:'section-title'},'Zum Einkaufskorb hinzufügen'));
    modal.appendChild(h('div',{class:'muted'},`Rezept: ${r.title}`));
    const list = h('div',{style:'max-height:50vh; overflow:auto; margin:10px 0; border:1px dashed var(--border);border-radius:12px; padding:8px;'});
    if(opts.length){
      list.appendChild(h('div',{class:'section-title'},'Optionale Add-ons'));
      opts.forEach((opt)=>{
        const id = crypto.randomUUID();
        const line = h('label',{class:'checkline', for:id, style:'border:0; padding:6px 0;'},
          h('input',{id, type:'checkbox'}),' ', h('span',{},opt.name),
          opt.qty? h('span',{class:'muted'},` — ${opt.qty}`): null,
          h('span',{class:'right'}), h('span',{class:'pill'},opt.cat)
        );
        list.appendChild(line);
      });
    }else{
      list.appendChild(h('div',{class:'muted'},'Keine optionalen Zutaten vorhanden.'));
    }
    const actions = h('div',{style:'display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap;'},
      h('button',{type:'button',class:'btn neutral',onclick:()=>overlay.remove()},'Abbrechen'),
      h('button',{type:'button',class:'btn pink',onclick:()=>{
        const chosen = Array.from(list.querySelectorAll('input[type="checkbox"]')).map((cb,i)=>cb.checked?opts[i]:null).filter(Boolean);
        const selected = [];
        base.forEach(i=>{ const ensured=ensureQtyObject({qty:i.qty, cat:i.cat, name:i.name}); selected.push({...i, qty:ensured.qtyStr, addon:false});});
        chosen.forEach(i=>{ const ensured=ensureQtyObject({qty:i.qty, cat:i.cat, name:i.name}); selected.push({...i, qty:ensured.qtyStr, addon:true});});
        window.Cart.addToCart(selected, r); overlay.remove(); toast('Zum Korb hinzugefügt');
      }},'In den Korb')
    );
    modal.append(list, actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  window.Recipes = { buildEditor, renderTagPickers, renderFilterChips, renderRecipeList, deleteRecipe, editRecipe, openAddDialog };
})();
