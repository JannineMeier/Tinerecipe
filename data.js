// data.js
(function(){
  // iOS compat for ids
  if (!window.crypto) window.crypto = {};
  if (!crypto.randomUUID) {
    crypto.randomUUID = function(){ const s=()=>Math.random().toString(16).slice(2,10); return `id-${Date.now().toString(16)}-${s()}-${s()}`; };
  }

  const CATS=["Gemüse","Früchte","Milchprodukte","Fleisch/Fisch","Getreide/Backwaren","Konserven","Tiefkühl","Gewürze","Saucen/Öle","Getränke","Snacks","Sonstiges"];
  const TAG_CATEGORIES={
    "Mahlzeit":["Frühstück","Snack","Mittagessen","Abendessen","Brunch","Dessert"],
    "Ernährung":["Vegan","Veggie","Fleisch","Pescetarisch","Glutenfrei","Laktosefrei","Low Carb","Proteinreich","Gesund"],
    "Küche":["Italienisch","Asiatisch","Indisch","Mexikanisch","Mediterran","Schweizerisch","Orientalisch","Amerikanisch"],
    "Aufwand":["Schnell","Meal Prep","< 5 Zutaten","One-Pot","Ofen","Pfanne","Airfryer"]
  };
  const AISLE_ORDER=CATS.slice();
  const STORE_TAGS=["Migros","Coop","Aldi","Lidl","Denner"];

  // Intelligente Einheiten (kannst du erweitern)
  const UNIT_HINTS = {
    "tomate":{unit:'stk', amount:2},
    "cherry-tomaten":{unit:'g', amount:250},
    "gurke":{unit:'stk', amount:1},
    "zwiebel":{unit:'stk', amount:2},
    "knoblauch":{unit:'stk', amount:1},
    "banane":{unit:'stk', amount:3},
    "apfel":{unit:'stk', amount:4},
    "milch":{unit:'ml', amount:1000},
    "h-milch":{unit:'ml', amount:1000},
    "rahm/sahne":{unit:'ml', amount:200},
    "joghurt natur":{unit:'stk', amount:2},
    "skyr":{unit:'stk', amount:2},
    "quark":{unit:'g', amount:250},
    "butter":{unit:'g', amount:250},
    "parmesan":{unit:'g', amount:100},
    "mozarella":{unit:'stk', amount:2},
    "feta":{unit:'g', amount:200},
    "hähnchenbrust":{unit:'g', amount:400},
    "rindhack":{unit:'g', amount:500},
    "lachs frisch":{unit:'g', amount:300},
    "thunfisch (dose)":{unit:'stk', amount:2},
    "tofu":{unit:'g', amount:400},
    "tofu natur":{unit:'g', amount:400},
    "reis":{unit:'g', amount:500},
    "basmatireis":{unit:'g', amount:500},
    "pasta spaghetti":{unit:'g', amount:500},
    "pasta penne":{unit:'g', amount:500},
    "haferflocken":{unit:'g', amount:500},
    "mehl weiss":{unit:'g', amount:1000},
    "passata":{unit:'ml', amount:700},
    "tomaten (dose)":{unit:'stk', amount:2},
    "kokosmilch (dose)":{unit:'stk', amount:2},
    "olivenöl":{unit:'ml', amount:500},
    "sojasauce":{unit:'ml', amount:250},
    "sriracha":{unit:'ml', amount:200},
    "salz":{unit:'g', amount:500},
    "pfeffer schwarz":{unit:'g', amount:50},
    "wasser still":{unit:'ml', amount:1500},
    "cola":{unit:'ml', amount:1500},
    "eier":{unit:'stk', amount:10},
    "ei":{unit:'stk', amount:10}
  };

  const store = {
    load(k,f){ try{ return JSON.parse(localStorage.getItem(k)) ?? f }catch{ return f } },
    save(k,v){ localStorage.setItem(k, JSON.stringify(v)) }
  };

  let recipes = store.load('recipes',[]);
  let cart    = store.load('cart',[]);
  let products= store.load('products',null);

  const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const UNIT_OPTIONS=["","g","kg","ml","l","stk"];

  function unitHintForName(name){
    const n=norm(name);
    if(UNIT_HINTS[n]) return UNIT_HINTS[n];
    if(UNIT_HINTS[n.replace(/e?n?$/,'')]) return UNIT_HINTS[n.replace(/e?n?$/,'')];
    return null;
  }

  function defaultUnitForCategory(cat){
    switch(cat){
      case "Saucen/Öle": case "Getränke": return "ml";
      case "Fleisch/Fisch": case "Milchprodukte": case "Tiefkühl":
      case "Gewürze": case "Gemüse": case "Früchte": return "g";
      case "Getreide/Backwaren": case "Konserven": case "Snacks": return "stk";
      default: return "stk";
    }
  }
  function defaultAmountForUnit(unit){
    if(unit==="stk") return 1;
    if(unit==="g") return 200;
    if(unit==="kg") return 0.5;
    if(unit==="ml") return 500;
    if(unit==="l")  return 1;
    return 1;
  }
  function defaultQtyForProduct(name, cat){
    const hint = unitHintForName(name);
    if(hint) return {unit:hint.unit, amount:hint.amount};
    const u = defaultUnitForCategory(cat||"Sonstiges");
    return {unit:u, amount:defaultAmountForUnit(u)};
  }

  function formatQty(v,unit){
    if(v==null || unit==null || unit==="") return "";
    if(unit==='g' || unit==='ml') return `${Math.round(v)} ${unit}`;
    if(unit==='kg' || unit==='l')  return `${(+v).toFixed(2)} ${unit}`;
    if(unit==='stk') return `${Math.round(v)} Stk`;
    return String(v);
  }
  function parseQty(str){
    if(!str) return {value:null,unit:null,raw:''};
    const s=str.replace(',', '.').trim();
    const m=s.match(/^(\d+(\.\d+)?)\s*([a-zA-ZäöüÄÖÜ]+)?/);
    if(!m) return {value:null,unit:null,raw:str};
    const val=parseFloat(m[1]); const unitRaw=(m[3]||'').toLowerCase(); let unit=null;
    if(['g','gram','gramm'].includes(unitRaw)) unit='g';
    else if(['stk','stück','stueck','pcs'].includes(unitRaw)) unit='stk';
    else if(['kg'].includes(unitRaw)) unit='kg';
    else if(['ml'].includes(unitRaw)) unit='ml';
    else if(['l','lt','liter'].includes(unitRaw)) unit='l';
    return {value:isNaN(val)?null:val, unit, raw:str};
  }
  function stepFor(q){ if(q.unit==='stk') return 1; if(q.unit==='g') return (q.value!=null && q.value>=100)?100:10; if(q.unit==='kg'||q.unit==='l') return 0.1; if(q.unit==='ml') return 50; return 1; }
  function ensureQtyObject(item){
    const parsed = parseQty(item.qty||"");
    let unit = parsed.unit;
    let value = parsed.value;
    if(!unit){
      const def=defaultQtyForProduct(item.name||'', item.cat||'Sonstiges');
      unit = def.unit;
      if(value==null) value = def.amount;
    } else if(value==null){
      value = defaultAmountForUnit(unit);
    }
    return {qtyStr: formatQty(value, unit), value, unit};
  }

  if(!products){
    const veg=["Gurke","Salat (Kopf)","Römersalat","Eisbergsalat","Tomate","Cocktailtomaten","Cherry-Tomaten","Strauchtomaten","Paprika rot","Paprika gelb","Paprika grün","Peperoncini","Chili","Zwiebel gelb","Zwiebel rot","Frühlingszwiebel","Schalotte","Knoblauch","Karotte","Sellerie Stange","Sellerie Knolle","Fenchel","Lauch","Zucchini","Aubergine","Brokkoli","Blumenkohl","Rosenkohl","Spinat","Mangold","Kohlrabi","Weisskohl","Rotkohl","Wirsing","Radieschen","Rettich","Rucola","Feldsalat","Kresse","Pilze Champignons","Steinpilze","Austernpilze","Shiitake","Portobello","Süsskartoffel","Kartoffel festkochend","Kartoffel mehlig","Kürbis Hokkaido","Kürbis Butternut","Maiskolben","Zuckermais","Bohnen grün","Erbsen frisch","Spargel grün","Spargel weiss","Rote Bete","Topinambur","Artischocke","Okra","Pak Choi","Bok Choy","Edamame","Ingwer","Kurkuma","Zitronengras","Avocado","Oliven grün","Oliven schwarz","Kapern"];
    const fruit=["Apfel","Birne","Banane","Orange","Mandarine","Clementine","Grapefruit","Zitrone","Limette","Ananas","Mango","Papaya","Kiwi","Trauben hell","Trauben dunkel","Erdbeeren","Himbeeren","Brombeeren","Heidelbeeren","Kirschen","Pfirsich","Nektarine","Aprikose","Pflaume","Granatapfel","Melone Wassermelone","Melone Honigmelone","Melone Cantaloupe","Feigen","Datteln","Passionsfrucht","Kokosnuss"];
    const dairy=["Milch","H-Milch","Laktosefreie Milch","Rahm/Sahne","Joghurt natur","Joghurt griechisch","Skyr","Quark","Butter","Margarine","Käse Gouda","Käse Emmentaler","Käse Gruyère","Mozzarella","Feta","Parmesan","Ricotta","Mascarpone","Frischkäse","Eier"];
    const meatFish=["Hähnchenbrust","Pouletgeschnetzeltes","Rindhack","Rindsgeschnetzeltes","Schweinsfilet","Speckwürfel","Schinken","Salami","Lachs frisch","Lachs geräuchert","Thunfisch frisch","Thunfisch (Dose)","Garnelen","Tofu natur","Tofu geräuchert","Tempeh"];
    const grain=["Brot","Brötchen","Vollkornbrot","Tortilla Wraps","Toast","Reis","Basmatireis","Jasminreis","Risotto Reis","Pasta Spaghetti","Pasta Penne","Pasta Fusilli","Couscous","Bulgur","Quinoa","Haferflocken","Mehl Weiss","Mehl Vollkorn","Backpulver","Hefe"];
    const cans=["Tomaten (Dose)","Passata","Mais (Dose)","Kidneybohnen (Dose)","Kichererbsen (Dose)","Kokosmilch (Dose)","Bohnensalat (Dose)","Oliven (Glas)","Essiggurken"];
    const frozen=["TK-Spinat","TK-Beerenmix","TK-Erbsen","TK-Pizza","TK-Pommes","TK-Gemüsemix","Eiscreme"];
    const spices=["Salz","Pfeffer schwarz","Paprikapulver edelsüss","Paprikapulver scharf","Currypulver","Chiliflocken","Kreuzkümmel","Zimt","Oregano","Basilikum getrocknet","Thymian","Rosmarin","Knoblauchpulver","Zwiebelpulver"];
    const sauces=["Olivenöl","Rapsöl","Sonnenblumenöl","Sesamöl","Balsamico","Weissweinessig","Sojasauce","Worcestersauce","Sriracha","Mayonnaise","Senf","Ketchup","BBQ-Sauce","Pesto grün","Pesto rot","Tahini"];
    const drinks=["Wasser still","Wasser sprudel","Apfelsaft","Orangensaft","Cola","Tonic Water","Mineralwasser","Kaffee Bohnen","Kaffee gemahlen","Tee Schwarz","Tee Kräuter"];
    const snacks=["Chips","Nüsse gesalzen","Erdnüsse","Mandeln","Schokolade dunkel","Schokolade Milch","Kekse","Reiswaffeln","Popcorn"];
    products=[
      ...veg.map(n=>({id:crypto.randomUUID(), name:n, cat:"Gemüse"})),
      ...fruit.map(n=>({id:crypto.randomUUID(), name:n, cat:"Früchte"})),
      ...dairy.map(n=>({id:crypto.randomUUID(), name:n, cat:"Milchprodukte"})),
      ...meatFish.map(n=>({id:crypto.randomUUID(), name:n, cat:"Fleisch/Fisch"})),
      ...grain.map(n=>({id:crypto.randomUUID(), name:n, cat:"Getreide/Backwaren"})),
      ...cans.map(n=>({id:crypto.randomUUID(), name:n, cat:"Konserven"})),
      ...frozen.map(n=>({id:crypto.randomUUID(), name:n, cat:"Tiefkühl"})),
      ...spices.map(n=>({id:crypto.randomUUID(), name:n, cat:"Gewürze"})),
      ...sauces.map(n=>({id:crypto.randomUUID(), name:n, cat:"Saucen/Öle"})),
      ...drinks.map(n=>({id:crypto.randomUUID(), name:n, cat:"Getränke"})),
      ...snacks.map(n=>({id:crypto.randomUUID(), name:n, cat:"Snacks"})),
    ];
    store.save('products',products);
  }

  window.AppData = {
    CATS, AISLE_ORDER, TAG_CATEGORIES, STORE_TAGS,
    store, recipes, cart, products,
    norm, UNIT_OPTIONS,
    defaultUnitForCategory, defaultAmountForUnit, defaultQtyForProduct,
    parseQty, formatQty, stepFor, ensureQtyObject,
    unitHintForName
  };
})();
