// data.js
(function(){
  const CATS = [
    "Gemüse","Früchte","Milchprodukte","Gewürze","Saucen/Öle",
    "Getreide/Backwaren","Fleisch/Fisch","Konserven","Tiefkühl",
    "Getränke","Snacks","Sonstiges"
  ];
  const AISLE_ORDER = CATS.slice();
  const STORE_TAGS = ["Coop","Migros","Aldi","Lidl","Party"];

  // Intelligente Einheiten
  const UNIT_HINTS = {
    tomate:{unit:"Stk",step:1}, gurke:{unit:"Stk",step:1},
    salat:{unit:"Stk",step:1}, zwiebel:{unit:"Stk",step:1},
    banane:{unit:"Stk",step:1}, apfel:{unit:"Stk",step:1},
    milch:{unit:"l",step:0.5}, butter:{unit:"g",step:100},
    käse:{unit:"g",step:100}, fleisch:{unit:"g",step:100},
    hähnchen:{unit:"g",step:100}, pasta:{unit:"g",step:100}
  };

  function parseQty(str){
    if(!str) return {value:null, unit:null};
    const m=/([0-9]+)(?:\s*([a-zA-ZäöüÄÖÜ]+))?/.exec(str);
    if(!m) return {value:null,unit:null};
    return {value:parseInt(m[1]), unit:m[2]||null};
  }
  function formatQty(v,u){ if(v==null) return ''; return `${v}${u?' '+u:''}`; }
  function stepFor(q){
    if(!q.unit) return 1;
    if(q.unit.toLowerCase().startsWith('g')){
      if(q.value>=100) return 100; return 10;
    }
    if(q.unit.toLowerCase().startsWith('ml')) return 100;
    if(q.unit.toLowerCase().startsWith('l')) return 0.5;
    return 1;
  }
  function ensureQtyObject(obj){
    let qtyStr=obj.qty||'';
    const hint=UNIT_HINTS[obj.name.toLowerCase()];
    if(!qtyStr && hint) qtyStr=`1 ${hint.unit}`;
    return {...obj, qtyStr};
  }

  const store = {
    load:(k,f)=>{ try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;} },
    save:(k,v)=>localStorage.setItem(k,JSON.stringify(v))
  };

  const AppData={
    CATS,AISLE_ORDER,STORE_TAGS,UNIT_HINTS,
    store,
    recipes:store.load('recipes',[]),
    products:store.load('products',[]),
    cart:store.load('cart',[]),
    norm:s=>s.toLowerCase(),
    parseQty,formatQty,stepFor,ensureQtyObject
  };
  window.AppData=AppData;
})();
