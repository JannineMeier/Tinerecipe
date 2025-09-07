// recipes.js
(function(){
  const {
    CATS, TAG_CATEGORIES, products, store,
    recipes, norm, UNIT_OPTIONS,
    defaultUnitForCategory, unitHintForName, parseQty, ensureQtyObject
  } = window.AppData || {};
  const UI = window.UI || {};
  const $ = UI.$ || (sel => document.querySelector(sel));
  const h = UI.h || ((tag, props={}, ...children) => {
    const el = document.createElement(tag);
    Object.entries(props||{}).forEach(([k,v])=>{
      if(k==='class') el.className=v;
      else if(k==='style') el.setAttribute('style', v);
      else if(k.startsWith('on') && typeof v==='function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k,v);
    });
    children.flat().filter(Boolean).forEach(c=>{
      if(typeof c==='string' || typeof c==='number') el.appendChild(document.createTextNode(c));
      else el.appendChild(c);
    });
    return el;
  });
  const toast = UI.toast || (msg=>{ try{console.log('[toast]',msg);}catch{} });

  // Wenn AppData nicht geladen wurde, früh abbrechen
  if(!window.AppData){
    console.error('AppData not available. Ensure data.js is loaded before recipes.js');
    return;
  }

  const selectedFilters=Object.fromEntries(Object.keys(TAG_CATEGORIES).map(k=>[k,new Set()]));
  let photoData=null;

  function buildEditor(){
    const body = $('#editor-body');
    if(!body) return;
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

    const actions = h('div',{style:'display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;'},
      h('button',{type:'button',class:'btn pink', id:'btn-save-recipe', onclick:saveRecipe},'Rezept speichern'),
      h('button',{type:'button',class:'btn neutral', id:'btn-reset-form', onclick:resetForm},'Formular leeren')
    );

    body.append(rowTop,rowMid,ingredients,addIngBtn,tagsBox,actions);
    $('#ingredients').appendChild(ingredientRow()); // erste Zeile
    renderTagPickers(null);
  }

  function handlePhoto(e){
    const f=e.target.files&&e.target.files[0]; const prev=$('#r-photo-preview');
    if(!f){ photoData=null; if(prev) prev.style.display='none'; return; }
    const r=new FileReader(); r.onload=()=>{ photoData=r.result; if(prev){ prev.src=photoData; prev.style.display='block'; } }; r.readAsDataURL(f);
  }

  // === AUTOSUGGEST ===
  function attachSuggest(nameInput, unitSel, catSel, qtyInput){
    const wrap=document.createElement('div');
    wrap.className='suggest-wrap';
    nameInput.parentElement.insertBefore(wrap, nameInput);
    wrap.appendChild(nameInput);

    const box=document.createElement('div');
    box.className='suggest-box';
    box.style.display='none';
    wrap.appendChild(box);

    let closeTimer=null;
    function open(){ box.style.display='block'; }
    function close(){ box.style.display='none'; }
    function fill(list){
      box.innerHTML='';
      if(!list.length){ box.appendChild(h('div',{class:'suggest-empty'},'Keine Treffer')); return; }
      list.slice(0,8).forEach(p=>{
        const def = window.AppData.defaultQtyForProduct(p.name, p.cat);
        const item=h('div',{class:'suggest-item', onclick:()=>apply(p)},
          h('span',{class:'suggest-name'}, p.name),
          h('span',{class:'suggest-meta'}, `${def.amount} ${def.unit || ''} • ${p.cat}`)
        );
        box.appendChild(item);
      });
    }
    function search(q){
      const s=norm(q);
      if(!s){ close(); return; }
      const list = (window.AppData.products||[])
        .filter(p=>norm(p.name).includes(s))
        .sort((a,b)=>{
          const as=norm(a.name).startsWith(s)?0:1;
          const bs=norm(b.name).startsWith(s)?0:1;
          if(as!==bs) return as-bs;
          return a.name.localeCompare(b.name,'de');
        });
      if(list.length){ fill(list); open(); } else { close(); }
    }
    function apply(prod){
      nameInput.value = prod.name;
      catSel.value = prod.cat;
      const hint = window.AppData.unitHintForName(prod.name);
      if(hint){ unitSel.value = hint.unit; qtyInput.value = hint.amount; }
      else { const u=window.AppData.defaultUnitForCategory(prod.cat); unitSel.value=u; if(!qtyInput.value) qtyInput.value=window.AppData.defaultAmountForUnit(u); }
      close();
      // iOS: on-screen keyboard schließen
      nameInput.blur();
    }

    nameInput.addEventListener('input', ()=>search(nameInput.value));
    nameInput.addEventListener('focus', ()=>search(nameInput.value));
    nameInput.addEventListener('blur', ()=>{ closeTimer=setTimeout(close, 150); });
    box.addEventListener('mousedown', (e)=>{ e.preventDefault(); clearTimeout(closeTimer); });
    box.addEventListener('touchstart', (e)=>{ e.preventDefault(); clearTimeout(closeTimer); }, {passive:false});
  }

  function ingredientRow(data={}){
    const row=h('div',{class:'row',style:'align-items:end; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap:8px; border-bottom:1px dashed var(--border); padding-bottom:8px;'});

    const nameInput=h('input',{type:'text', placeholder:'z. B. Tomate', value:data.name||''});
    const nameField=h('div',{}, h('label',{class:'muted'},'Zutat'), nameInput);

    const qtyInput=h('input',{type:'number', step:'any', inputmode:'decimal', placeholder:'z. B. 2', value:data.amount||''});
    const unitSel=(function(){ const s=h('select'); (UNIT_OPTIONS||[]).forEach(u=>s.appendChild(h('option',{value:u},u||'—'))); s.value=data.unit||""; return s; })();
    const catSel=(function(){ const s=h('select'); (window.AppData.CATS||[]).forEach(c=>s.appendChild(h('option',{value:c},c))); s.value=data.cat||'Sonstiges'; return s; })();

    const optWrap=h('label',{class:'muted',style:'display:flex;align-items:center;gap:6px;'},
      h('input',{type:'checkbox',checked:!!data.optional}), ' add-on'
    );

    const del=h('button',{type:'button',class:'btn neutral small',onclick:()=>row.remove()},'✕');

    attachSuggest(nameInput, unitSel, catSel, qtyInput);

    function guessFromProduct(name){
      const arr = window.AppData.products||[];
      const prod = arr.find(p=>norm(p.name)===norm(name));
      if(prod) catSel.value = prod.cat;
      const hint = unitHintForName(name);
      if(hint){ unitSel.value = hint.unit; if(!qtyInput.value) qtyInput.value = hint.amount; }
      else if(prod && !unitSel.value){ const u=defaultUnitForCategory(prod.cat); unitSel.value=u; if(!qtyInput.value) qtyInput.value=window.AppData.defaultAmountForUnit(u); }
    }
    nameInput.addEventListener('change',()=>guessFromProduct(nameInput.value));

    row.append(
      nameField,
      h('div',{}, h('label',{class:'muted'},'Menge'), qtyInput),
      h('div',{}, h('label',{class:'muted'},'Einheit'), unitSel),
      h('div',{}, h('label',{class:'muted'},'Kategorie'), catSel),
      h('div',{}, optWrap),
      h('div',{}, del)
    );
    return row;
  }

  function saveRecipe(){
    const titleEl=$('#r-title'); if(!titleEl) return;
    const title=titleEl.value.trim(); if(!title){ alert('Bitte Titel eingeben'); return; }
    const link =($('#r-link')||{}).value?.trim?.() || '';
    const steps=($('#r-steps')||{}).value?.trim?.() || '';

    const host=$('#ingredients'); if(!host) return;
    const rows=Array.from(host.children);
    if(rows.length===0){ alert('Bitte mindestens eine Zutat hinzufügen'); return; }

    const ings = rows.map(row=>{
      const fields = row.querySelectorAll('input, select');
      const name = fields[0].value.trim();
      const amount = fields[1].value ? String(fields[1].value).trim() : '';
      const unit = fields[2].value;
      const cat = fields[3].value;
      const optional = fields[4].checked;
      const qty = amount ? (unit ? `${amount} ${unit}` : amount) : '';
      return { name, qty, cat, optional, amount, unit };
    }).filter(x=>x.name);

    const tags=collectSelectedTagsFromEditor();
    window.AppData.recipes.unshift({ id:crypto.randomUUID(), title, link, steps, img:photoData, ings, tags });
    store.save('recipes',window.AppData.recipes);

    resetForm();
    const ed = $('#recipe-editor'); if(ed && 'open' in ed) ed.open=false;
    renderRecipeList();
    toast('Rezept gespeichert');
  }

  function resetForm(){ photoData=null; buildEditor(); }

  // --- Tags ---
  function renderTagPickers(existing=null){
    const wrap=document.getElementById('tag-pickers'); if(!wrap) return;
    wrap.innerHTML='';
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
    const wrap = document.getElementById('tag-pickers');
    if(!wrap) return {};
    const result={}; const groups=wrap.querySelectorAll('.tag-group');
    groups.forEach(g=>{ const cat=g.querySelector('h4').textContent;
      const active=Array.from(g.querySelectorAll('.chip.active')).map(c=>c.textContent);
      if(active.length) result[cat]=active;
    }); return result;
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

  // === Collapsible Recipe Card ===
  function recipeCard(r){
    const det=h('details',{class:'collapsible card'});
    const summary=h('summary',{}, h('span',{class:'chev'},'▶'), ' ', h('strong',{}, r.title));
    det.appendChild(summary);

    const body=h('div',{style:'padding:10px;display:grid;gap:8px;'});
    if(r.img) body.appendChild(h('img',{src:r.img,class:'img-glow',style:'width:100%; max-height:220px; object-fit:cover; border-radius:12px;'}));

    // Grundzutaten
    const baseIngs = (r.ings||[]).filter(i=>!i.optional);
    const optIngs  = (r.ings||[]).filter(i=> i.optional);

    body.append(
      h('div',{}, h('h3',{},'Zutaten'),
        ...baseIngs.map(i=>h('div',{class:'checkline'},`• ${i.name}`,i.qty?` — ${i.qty}`:'',' ',h('span',{class:'pill'},i.cat))),
        optIngs.length ? h('div',{},h('div',{class:'muted',style:'margin:6px 0 0;'},'Add-ons:'),
          ...optIngs.map(i=>h('span',{class:'pill',style:'margin:4px 6px 0 0;'},i.name+(i.qty?` • ${i.qty}`:'')))
        ) : null
      ),
      r.steps?h('div',{},h('h3',{},'Anleitung'),h('div',{},r.steps)):null
    );

    if(r.tags && Object.keys(r.tags).length){
      const tagWrap=h('div',{style:'display:flex; flex-wrap:wrap; gap:6px;'});
      for(const [cat,list] of Object.entries(r.tags)){ list.forEach(t=>tagWrap.appendChild(h('span',{class:'chip small',style:'background:#ffe0f0;border-color:#ff74b8;color:#b0307d'},`${cat}: ${t}`))); }
      body.appendChild(tagWrap);
    }

    // Buttons + Feedback
    const btnAdd = h('button',{type:'button',class:'btn pink',onclick:()=>openAddDialog(r.id, btnAdd)},'Zum Einkaufskorb');
    const btnEdit= h('button',{type:'button',class:'btn pink-ghost',onclick:()=>editRecipe(r.id)},'Bearbeiten');
    const btnDel = h('button',{type:'button',class:'btn neutral',onclick:()=>deleteRecipe(r.id)},'Löschen');

    const actions = h('div',{style:'display:flex; gap:8px; margin-top:6px; flex-wrap:wrap;'}, btnAdd, btnEdit, btnDel);
    body.appendChild(actions);

    det.appendChild(body);
    return det;
  }

  function flashButtonSuccess(btn, okText='Hinzugefügt ✓'){
    if(!btn) return;
    const oldText = btn.textContent;
    btn.classList.add('success'); // erwarte CSS .btn.success { outline/box-shadow oder Hintergrundwechsel }
    btn.disabled = true;
    btn.textContent = okText;
    setTimeout(()=>{
      btn.classList.remove('success');
      btn.disabled = false;
      btn.textContent = oldText;
    }, 1200);
  }

  function renderRecipeList(){
    const qEl=$('#search-recipes');
    const q=qEl ? qEl.value : '';
    const listEl=$('#recipe-list'); if(!listEl) return;
    listEl.innerHTML='';
    const list=(window.AppData.recipes||[]).filter(r=>matchRecipe(r,q));
    if(!list.length){ listEl.appendChild(h('div',{class:'muted'},q?'Keine Treffer.':'Noch keine Rezepte.')); return; }
    list.forEach(r=>listEl.appendChild(recipeCard(r)));
  }

  function deleteRecipe(id){
    if(!confirm('Rezept wirklich löschen?')) return;
    window.AppData.recipes = (window.AppData.recipes||[]).filter(r=>r.id!==id);
    store.save('recipes',window.AppData.recipes); renderRecipeList();
  }

  function editRecipe(id){
    const r=(window.AppData.recipes||[]).find(x=>x.id===id); if(!r) return; const ed=$('#recipe-editor'); if(ed && 'open' in ed) ed.open=true;
    buildEditor();
    const t=$('#r-title'); if(t) t.value=r.title||'';
    const l=$('#r-link'); if(l) l.value=r.link||'';
    const s=$('#r-steps'); if(s) s.value=r.steps||'';
    if(r.img){ photoData=r.img; const prev=$('#r-photo-preview'); if(prev){ prev.src=r.img; prev.style.display='block'; } }
    const host=$('#ingredients'); if(host){
      r.ings.forEach(i=>{
        const q=parseQty(i.qty||'');
        host.appendChild(ingredientRow({name:i.name, amount:q.value ?? '', unit:q.unit ?? '', cat:i.cat, optional:!!i.optional}));
      });
    }
    renderTagPickers(r.tags||null); window.scrollTo({top:0,behavior:'smooth'});
  }

  function openAddDialog(recipeId, sourceBtn){
    const r=(window.AppData.recipes||[]).find(x=>x.id===recipeId); if(!r) return;
    const base = r.ings.filter(i=>!i.optional);
    const opts = r.ings.filter(i=>i.optional);

    const overlay = h('div',{style:'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25);z-index:1000;'});
    overlay.addEventListener('click',(ev)=>{ if(ev.target===overlay) document.body.removeChild(overlay); });

    const modal = h('div',{class:'card', style:'max-width:520px;width:92%; border-radius:20px; background:#fff;'});
    modal.appendChild(h('div',{class:'section-title'},'Zum Einkaufskorb hinzufügen'));
    modal.appendChild(h('div',{class:'muted'},`Rezept: ${r.title}`));
    const list = h('div',{style:'max-height:50vh; overflow:auto; margin:10px 0; border:1px dashed var(--border);border-radius:12px; padding:8px;'});
    if(opts.length){
      list.appendChild(h('div',{class:'section-title'},'Optionale Add-ons'));
      opts.forEach((opt, idx)=>{
        const id = 'opt-' + idx + '-' + crypto.randomUUID();
        const line = h('label',{class:'checkline', for:id, style:'border:0; padding:6px 0; display:flex; align-items:center; gap:6px;'},
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
      h('button',{type:'button',class:'btn neutral',onclick:()=>document.body.removeChild(overlay)},'Abbrechen'),
      h('button',{type:'button',class:'btn pink',onclick:()=>{
        const checkboxes = Array.from(list.querySelectorAll('input[type="checkbox"]'));
        const chosen = checkboxes.map((cb,i)=>cb.checked?opts[i]:null).filter(Boolean);
        const selected = [];
        base.forEach(i=>{ const ensured=ensureQtyObject({qty:i.qty, cat:i.cat, name:i.name}); selected.push({...i, qty:ensured.qtyStr, addon:false});});
        chosen.forEach(i=>{ const ensured=ensureQtyObject({qty:i.qty, cat:i.cat, name:i.name}); selected.push({...i, qty:ensured.qtyStr, addon:true});});
        if(window.Cart && typeof window.Cart.addToCart === 'function'){
          window.Cart.addToCart(selected, r);
        }
        document.body.removeChild(overlay);
        toast('Zum Korb hinzugefügt');
        // Visuelles Feedback am Auslöser-Button
        flashButtonSuccess(sourceBtn || null, 'Hinzugefügt ✓');
      }},'In den Korb')
    );
    modal.append(list, actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // ---- Filterchips rendern (Fehler-Fix) ----
  function renderFilterChips(){
    const host = $('#filter-chips');
    if(!host) return; // kein Container vorhanden -> silently ignore
    host.innerHTML = '';
    // Pro Tag-Kategorie eine Gruppe Chips
    Object.entries(TAG_CATEGORIES).forEach(([cat, tags])=>{
      const group = h('div',{class:'chip-group'});
      group.appendChild(h('span',{class:'chip-label'},cat+':'));
      tags.forEach(t=>{
        const chip = h('button',{type:'button',class:'chip'}, t);
        chip.addEventListener('click', ()=>{
          // toggle
          if(selectedFilters[cat].has(t)) selectedFilters[cat].delete(t);
          else selectedFilters[cat].add(t);
          chip.classList.toggle('active');
          renderRecipeList();
        });
        group.appendChild(chip);
      });
      host.appendChild(group);
    });
    // Clear-Button
    const clearBtn = h('button',{type:'button',class:'btn neutral small', style:'margin-left:8px;', onclick:()=>{
      Object.values(selectedFilters).forEach(set=>set.clear());
      host.querySelectorAll('.chip.active').forEach(el=>el.classList.remove('active'));
      renderRecipeList();
    }},'Filter löschen');
    host.appendChild(clearBtn);
  }

  // Export
  window.Recipes = {
    buildEditor, renderTagPickers, renderFilterChips, renderRecipeList, deleteRecipe, editRecipe, openAddDialog
  };
})();
