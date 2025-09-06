// data.js
(function(){
  if (!window.crypto) window.crypto = {};
  if (!crypto.randomUUID) {
    crypto.randomUUID = function(){ const s=()=>Math.random().toString(16).slice(2,10); return `id-${Date.now().toString(16)}-${s()}-${s()}`; };
  }

  const CATS=[
    "Gemüse","Früchte","Milchprodukte","Fleisch/Fisch","Getreide/Backwaren",
    "Konserven","Tiefkühl","Gewürze","Saucen/Öle","Getränke","Snacks","Sonstiges"
  ];
  const TAG_CATEGORIES={
    "Mahlzeit":["Frühstück","Snack","Mittagessen","Abendessen","Brunch","Dessert"],
    "Ernährung":["Vegan","Veggie","Fleisch","Pescetarisch","Glutenfrei","Laktosefrei","Low Carb","Proteinreich","Gesund"],
    "Küche":["Italienisch","Asiatisch","Indisch","Mexikanisch","Mediterran","Schweizerisch","Orientalisch","Amerikanisch"],
    "Aufwand":["Schnell","Meal Prep","< 5 Zutaten","One-Pot","Ofen","Pfanne","Airfryer"]
  };
  const AISLE_ORDER=CATS.slice();
  const STORE_TAGS=["Migros","Coop","Aldi","Lidl","Denner","Party"];

  // ===== Intelligente Einheiten (Default-Menge) =====
  // Vegetables & Fruits default = STÜCK; Ausnahmen hier auf g/ml setzen
  const UNIT_HINTS = {
    // Gemüse – Ausnahmen in g
    "kartoffel":{unit:'kg', amount:1},
    "süsskartoffel":{unit:'kg', amount:1},
    "karotte":{unit:'g', amount:500},
    "zwiebel":{unit:'stk', amount:2},
    "knoblauch":{unit:'stk', amount:1},
    "cherry-tomaten":{unit:'g', amount:250},
    "pilze champignons":{unit:'g', amount:400},
    "spinat":{unit:'g', amount:300},

    // Früchte – Beeren in g, Rest Stück
    "erdbeeren":{unit:'g', amount:500},
    "himbeeren":{unit:'g', amount:250},
    "brombeeren":{unit:'g', amount:250},
    "heidelbeeren":{unit:'g', amount:250},
    "trauben hell":{unit:'g', amount:500},
    "trauben dunkel":{unit:'g', amount:500},
    "apfel":{unit:'stk', amount:4},
    "banane":{unit:'stk', amount:4},
    "orange":{unit:'stk', amount:6},

    // Milchprodukte
    "milch":{unit:'l', amount:1},
    "h-milch":{unit:'l', amount:1},
    "rahm/sahne":{unit:'ml', amount:200},
    "butter":{unit:'g', amount:250},
    "joghurt natur":{unit:'stk', amount:2},
    "skyr":{unit:'stk', amount:2},
    "quark":{unit:'g', amount:250},
    "mozzarella":{unit:'stk', amount:2},
    "feta":{unit:'g', amount:200},
    "parmesan":{unit:'g', amount:100},
    "eier":{unit:'stk', amount:10},

    // Fleisch/Fisch/Tofu
    "rindhack":{unit:'g', amount:500},
    "hähnchenbrust":{unit:'g', amount:400},
    "lachs frisch":{unit:'g', amount:300},
    "thunfisch (dose)":{unit:'stk', amount:2},
    "tofu natur":{unit:'g', amount:400},

    // Getreide/Backwaren
    "reis":{unit:'g', amount:500},
    "basmatireis":{unit:'g', amount:500},
    "pasta spaghetti":{unit:'g', amount:500},
    "pasta penne":{unit:'g', amount:500},
    "haferflocken":{unit:'g', amount:500},
    "mehl weiss":{unit:'g', amount:1000},
    "brot":{unit:'stk', amount:1},
    "tortilla wraps":{unit:'stk', amount:6},

    // Konserven/Saucen/Gewürze
    "passata":{unit:'ml', amount:700},
    "tomaten (dose)":{unit:'stk', amount:2},
    "kokosmilch (dose)":{unit:'stk', amount:2},
    "olivenöl":{unit:'ml', amount:500},
    "sojasauce":{unit:'ml', amount:250},
    "sriracha":{unit:'ml', amount:200},
    "salz":{unit:'g', amount:500},
    "pfeffer schwarz":{unit:'g', amount:50},

    // Getränke
    "wasser still":{unit:'stk', amount:6},
    "cola":{unit:'stk', amount:4}
  };

  const store = {
    load(k,f){ try{ return JSON.parse(localStorage.getItem(k)) ?? f }catch{ return f } },
    save(k,v){ localStorage.setItem(k, JSON.stringify(v)) }
  };

  let recipes = store.load('recipes',[]);
  let cart    = store.load('cart',[]);
  let products= store.load('products',null);

  const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();

  function unitHintForName(name){
    const n=norm(name);
    if(UNIT_HINTS[n]) return UNIT_HINTS[n];
    if(UNIT_HINTS[n.replace(/e?n?$/,'')]) return UNIT_HINTS[n.replace(/e?n?$/,'')];
    return null;
  }

  const UNIT_OPTIONS=["","g","kg","ml","l","stk"];
  function defaultUnitForCategory(cat){
    // Gemüse & Früchte standardmäßig STÜCK
    switch(cat){
      case "Gemüse": case "Früchte": return "stk";
      case "Saucen/Öle": case "Getränke": return "ml";
      case "Fleisch/Fisch": case "Milchprodukte": case "Tiefkühl":
      case "Gewürze": return "g";
      case "Getreide/Backwaren": case "Konserven": case "Snacks": return "stk";
      default: return "stk";
    }
  }
  function defaultAmountForUnit(unit){
    if(unit==="stk") return 1;
    if(unit==="g") return 200;
    if(unit==="kg") return 1;
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
  function stepFor(q){
    if(q.unit==='stk') return 1;
    if(q.unit==='g') return (q.value!=null && q.value>=100)?100:50;
    if(q.unit==='kg'||q.unit==='l') return 0.5;
    if(q.unit==='ml') return 100;
    return 1;
  }
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

  // ===== erweiterte Produkte-Liste =====
  if(!products){
    const veg=[ // Gemüse
      "Gurke","Salat (Kopf)","Römersalat","Eisbergsalat","Rucola","Feldsalat","Kresse",
      "Tomate","Cherry-Tomaten","Strauchtomaten","Paprika rot","Paprika gelb","Paprika grün",
      "Peperoncini","Chili","Zwiebel gelb","Zwiebel rot","Frühlingszwiebel","Schalotte","Knoblauch",
      "Karotte","Sellerie Stange","Sellerie Knolle","Fenchel","Lauch","Zucchini","Aubergine",
      "Brokkoli","Blumenkohl","Rosenkohl","Spinat","Mangold","Kohlrabi","Weisskohl","Rotkohl","Wirsing",
      "Radieschen","Rettich","Pilze Champignons","Shiitake","Austernpilze","Portobello",
      "Süsskartoffel","Kartoffel festkochend","Kartoffel mehlig","Kürbis Hokkaido","Kürbis Butternut",
      "Maiskolben","Zuckermais","Grüne Bohnen","Erbsen frisch","Spargel grün","Spargel weiss","Rote Bete",
      "Artischocke","Okra","Pak Choi","Bok Choy","Edamame","Ingwer","Kurkuma","Zitronengras","Avocado",
      "Oliven grün","Oliven schwarz","Kapern"
    ];
    const fruit=[ // Früchte
      "Apfel","Birne","Banane","Orange","Mandarine","Clementine","Grapefruit","Zitrone","Limette",
      "Ananas","Mango","Papaya","Kiwi","Trauben hell","Trauben dunkel","Erdbeeren","Himbeeren",
      "Brombeeren","Heidelbeeren","Kirschen","Pfirsich","Nektarine","Aprikose","Pflaume","Granatapfel",
      "Melone Wassermelone","Melone Honigmelone","Melone Cantaloupe","Feigen","Datteln","Passionsfrucht","Kokosnuss"
    ];
    const dairy=[ // Milchprodukte
      "Milch","H-Milch","Laktosefreie Milch","Rahm/Sahne","Halbrahm","Vollrahm",
      "Joghurt natur","Joghurt griechisch","Skyr","Quark","Butter","Margarine",
      "Käse Gouda","Käse Emmentaler","Käse Gruyère","Mozzarella","Feta","Parmesan","Ricotta","Mascarpone","Frischkäse","Eier"
    ];
    const meatFish=[ // Fleisch/Fisch & Alternativen
      "Hähnchenbrust","Pouletgeschnetzeltes","Rindhack","Rindsgeschnetzeltes","Schweinsfilet","Speckwürfel","Schinken","Salami",
      "Lachs frisch","Lachs geräuchert","Thunfisch frisch","Thunfisch (Dose)","Garnelen",
      "Tofu natur","Tofu geräuchert","Tempeh","Seitan"
    ];
    const grain=[ // Getreide/Backwaren
      "Brot","Brötchen","Vollkornbrot","Toast","Tortilla Wraps","Pita",
      "Reis","Basmatireis","Jasminreis","Risotto Reis",
      "Pasta Spaghetti","Pasta Penne","Pasta Fusilli","Lasagneplatten",
      "Couscous","Bulgur","Quinoa","Polenta",
      "Haferflocken","Cornflakes","Müesli",
      "Mehl Weiss","Mehl Vollkorn","Backpulver","Hefe","Paniermehl"
    ];
    const cans=[ // Konserven/Glas
      "Tomaten (Dose)","Passata","Mais (Dose)","Kidneybohnen (Dose)","Kichererbsen (Dose)","Kokosmilch (Dose)",
      "Linsen (Dose)","Bohnen weiss (Dose)","Erbsen (Dose)","Sugo","Oliven (Glas)","Essiggurken","Rösti fixfertig (Beutel)"
    ];
    const frozen=[ // Tiefkühl
      "TK-Spinat","TK-Beerenmix","TK-Erbsen","TK-Pizza","TK-Pommes","TK-Gemüsemix","Eiscreme","TK-Lachsfilet","TK-Garnelen"
    ];
    const spices=[ // Gewürze
      "Salz","Pfeffer schwarz","Paprikapulver edelsüss","Paprikapulver scharf","Currypulver","Chiliflocken",
      "Kreuzkümmel","Zimt","Oregano","Basilikum getrocknet","Thymian","Rosmarin","Knoblauchpulver","Zwiebelpulver","Curry Paste rot","Curry Paste grün"
    ];
    const sauces=[ // Saucen/Öle/Essige
      "Olivenöl","Rapsöl","Sonnenblumenöl","Sesamöl","Balsamico","Weissweinessig","Rotweinessig",
      "Sojasauce","Worcestersauce","Sriracha","Mayonnaise","Senf","Ketchup","BBQ-Sauce","Pesto grün","Pesto rot","Tahini","Mirin","Reisessig"
    ];
    const drinks=[ // Getränke
      "Wasser still","Wasser sprudel","Apfelsaft","Orangensaft","Cola","Tonic Water","Mineralwasser",
      "Kaffee Bohnen","Kaffee gemahlen","Tee Schwarz","Tee Grün","Tee Kräuter","Haferdrink","Mandelmilch"
    ];
    const snacks=[ // Snacks/Süsses
      "Chips","Nüsse gesalzen","Erdnüsse","Mandeln","Cashews","Pistazien",
      "Schokolade dunkel","Schokolade Milch","Kekse","Reiswaffeln","Popcorn","Proteinriegel"
    ];
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
    CATS, AISLE_ORDER, TAG_CATEGORIES, STORE_TAGS, UNIT_HINTS,
    store, recipes, cart, products,
    norm, UNIT_OPTIONS,
    defaultUnitForCategory, defaultAmountForUnit, defaultQtyForProduct,
    parseQty, formatQty, stepFor, ensureQtyObject,
    unitHintForName
  };
})();
