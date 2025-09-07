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
  // Seed: Nur wenn noch keine Rezepte gespeichert sind
if (!recipes || recipes.length === 0) {
  recipes = [
    {
      id: crypto.randomUUID(),
      title: "Fajita mit Hähnchen",
      ings: [
        { name:"Hähnchenbrust", qty:"400 g", cat:"Fleisch/Fisch" },
        { name:"Paprika rot", qty:"1 Stk", cat:"Gemüse" },
        { name:"Paprika gelb", qty:"1 Stk", cat:"Gemüse" },
        { name:"Gurke", qty:"1 Stk", cat:"Gemüse" },
        { name:"Tomate", qty:"2 Stk", cat:"Gemüse" },
        { name:"Zwiebel gelb", qty:"1 Stk", cat:"Gemüse" },
        { name:"Creme Fraiche", qty:"200 g", cat:"Milchprodukte" },
        { name:"Ketchup", qty:"50 g", cat:"Saucen/Öle" },
        { name:"Käse gerieben", qty:"120 g", cat:"Milchprodukte", optional:true },
        { name:"Mais (Dose)", qty:"1 Stk", cat:"Konserven" },
        { name:"Avocado", qty:"1 Stk", cat:"Früchte" },
        { name:"Granatapfelkerne", qty:"60 g", cat:"Früchte" },
        { name:"Tortilla Wraps", qty:"6 Stk", cat:"Getreide/Backwaren" },
        { name:"Tortilla Chips", qty:"100 g", cat:"Snacks" }
      ],
      tags:{ Mahlzeit:["Mittagessen","Abendessen"], Ernährung:["Fleisch"], Küche:["Mexikanisch"], Aufwand:["Schnell"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Quesadilla",
      ings: [
        { name:"Tortilla Wraps", qty:"4 Stk", cat:"Getreide/Backwaren" },
        { name:"Käse gerieben", qty:"200 g", cat:"Milchprodukte" },
        { name:"Paprika rot", qty:"1 Stk", cat:"Gemüse" },
        { name:"Tomate", qty:"1 Stk", cat:"Gemüse" },
        { name:"Mais (Dose)", qty:"0.5 Stk", cat:"Konserven" },
        { name:"Zwiebel gelb", qty:"0.5 Stk", cat:"Gemüse" }
      ],
      tags:{ Mahlzeit:["Snack","Abendessen"], Ernährung:["Veggie"], Küche:["Mexikanisch"], Aufwand:["Schnell","< 5 Zutaten"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Bruschetta",
      ings: [
        { name:"Brot", qty:"6 Scheiben", cat:"Getreide/Backwaren" },
        { name:"Tomate", qty:"3 Stk", cat:"Gemüse" },
        { name:"Olivenöl", qty:"2 EL", cat:"Saucen/Öle" },
        { name:"Balsamico", qty:"1 EL", cat:"Saucen/Öle", optional:true },
        { name:"Knoblauch", qty:"1 Zehe", cat:"Gemüse" }
      ],
      tags:{ Mahlzeit:["Snack","Vorspeise"], Ernährung:["Veggie"], Küche:["Italienisch"], Aufwand:["Schnell","< 5 Zutaten"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Butter Chicken mit Reis & Naan",
      ings: [
        { name:"Hähnchenbrust", qty:"500 g", cat:"Fleisch/Fisch" },
        { name:"Butter Chicken Sauce", qty:"1 Glas", cat:"Saucen/Öle" },
        { name:"Reis", qty:"300 g", cat:"Getreide/Backwaren" },
        // einfache Naan-Basis
        { name:"Mehl Weiss", qty:"300 g", cat:"Getreide/Backwaren" },
        { name:"Joghurt natur", qty:"150 g", cat:"Milchprodukte" },
        { name:"Backpulver", qty:"1 Pck", cat:"Getreide/Backwaren" },
        { name:"Olivenöl", qty:"1 EL", cat:"Saucen/Öle" },
      ],
      tags:{ Mahlzeit:["Abendessen"], Ernährung:["Fleisch"], Küche:["Indisch"], Aufwand:["Ofen","Pfanne","Meal Prep"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Reis Bowl",
      ings: [
        { name:"Reis", qty:"250 g", cat:"Getreide/Backwaren" },
        { name:"Gurke", qty:"1 Stk", cat:"Gemüse" },
        { name:"Süsskartoffel", qty:"1 Stk", cat:"Gemüse", optional:true },
        { name:"Avocado", qty:"1 Stk", cat:"Früchte", optional:true },
        { name:"Edamame", qty:"150 g", cat:"Gemüse", optional:true },
        { name:"Granatapfelkerne", qty:"60 g", cat:"Früchte", optional:true },
        { name:"Hähnchenbrust", qty:"250 g", cat:"Fleisch/Fisch", optional:true },
        { name:"Rindsgeschnetzeltes", qty:"250 g", cat:"Fleisch/Fisch", optional:true },
        { name:"Mango", qty:"0.5 Stk", cat:"Früchte", optional:true }
      ],
      tags:{ Mahlzeit:["Mittagessen","Abendessen"], Ernährung:["Veggie","Fleisch"], Küche:["Fusion"], Aufwand:["Meal Prep"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Nudeln mit Lachs und Rahmsauce",
      ings: [
        { name:"Pasta Spaghetti", qty:"300 g", cat:"Getreide/Backwaren" },
        { name:"Lachs frisch", qty:"300 g", cat:"Fleisch/Fisch" },
        { name:"Rahm/Sahne", qty:"200 ml", cat:"Milchprodukte" },
        { name:"Zitrone", qty:"0.5 Stk", cat:"Früchte", optional:true },
        { name:"Knoblauch", qty:"1 Zehe", cat:"Gemüse", optional:true },
        { name:"Olivenöl", qty:"1 EL", cat:"Saucen/Öle" }
      ],
      tags:{ Mahlzeit:["Abendessen"], Ernährung:["Pescetarisch"], Küche:["Italienisch"], Aufwand:["Pfanne","Schnell"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Rührei",
      ings: [
        { name:"Eier", qty:"4 Stk", cat:"Milchprodukte" },
        { name:"Butter", qty:"20 g", cat:"Milchprodukte" },
        { name:"Milch", qty:"30 ml", cat:"Milchprodukte", optional:true },
        { name:"Schnittlauch", qty:"1 Bund", cat:"Gemüse", optional:true }
      ],
      tags:{ Mahlzeit:["Frühstück","Snack"], Ernährung:["Veggie","Proteinreich"], Aufwand:["Schnell","< 5 Zutaten","Pfanne"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Ofenkartoffeln (Varianten)",
      ings: [
        { name:"Kartoffel festkochend", qty:"1 kg", cat:"Gemüse" },
        { name:"Olivenöl", qty:"2 EL", cat:"Saucen/Öle" },
        { name:"Paprikapulver edelsüss", qty:"1 TL", cat:"Gewürze" },
        { name:"Karotte", qty:"3 Stk", cat:"Gemüse", optional:true },
        { name:"Brokkoli", qty:"1 Stk", cat:"Gemüse", optional:true },
        { name:"Blumenkohl", qty:"1 Stk", cat:"Gemüse", optional:true },
        { name:"Hähnchenbrust", qty:"300 g", cat:"Fleisch/Fisch", optional:true },
        { name:"Lachs frisch", qty:"300 g", cat:"Fleisch/Fisch", optional:true },
        { name:"Veggie Nuggets", qty:"1 Pck", cat:"Tiefkühl", optional:true }
      ],
      tags:{ Mahlzeit:["Abendessen"], Ernährung:["Veggie","Fleisch"], Küche:["Amerikanisch"], Aufwand:["Ofen","Meal Prep"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Creamy Feta Gnocchis in Tomatenrahm",
      ings: [
        { name:"Gnocchi", qty:"500 g", cat:"Getreide/Backwaren" },
        { name:"Passata", qty:"400 ml", cat:"Konserven" },
        { name:"Rahm/Sahne", qty:"150 ml", cat:"Milchprodukte" },
        { name:"Feta", qty:"150 g", cat:"Milchprodukte" },
        { name:"Knoblauch", qty:"1 Zehe", cat:"Gemüse", optional:true },
        { name:"Olivenöl", qty:"1 EL", cat:"Saucen/Öle" }
      ],
      tags:{ Mahlzeit:["Abendessen"], Ernährung:["Veggie"], Küche:["Italienisch"], Aufwand:["Schnell","Pfanne"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Creamy Pasta",
      ings: [
        { name:"Pasta Penne", qty:"300 g", cat:"Getreide/Backwaren" },
        { name:"Rahm/Sahne", qty:"200 ml", cat:"Milchprodukte" },
        { name:"Parmesan", qty:"60 g", cat:"Milchprodukte" },
        { name:"Knoblauch", qty:"1 Zehe", cat:"Gemüse", optional:true },
        { name:"Olivenöl", qty:"1 EL", cat:"Saucen/Öle" }
      ],
      tags:{ Mahlzeit:["Abendessen"], Ernährung:["Veggie"], Küche:["Italienisch"], Aufwand:["Schnell","< 5 Zutaten","Pfanne"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Rösti mit Rahmsauce (ohne Pilze)",
      ings: [
        { name:"Rösti fixfertig (Beutel)", qty:"1 Stk", cat:"Konserven" },
        { name:"Rahm/Sahne", qty:"200 ml", cat:"Milchprodukte" },
        { name:"Zwiebel gelb", qty:"1 Stk", cat:"Gemüse" },
        { name:"Butter", qty:"20 g", cat:"Milchprodukte" }
      ],
      tags:{ Mahlzeit:["Mittagessen","Abendessen"], Ernährung:["Veggie"], Küche:["Schweizerisch"], Aufwand:["Pfanne","Schnell"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Sandwich / Panini",
      ings: [
        { name:"Brot", qty:"4 Scheiben", cat:"Getreide/Backwaren" },
        { name:"Tomate", qty:"1 Stk", cat:"Gemüse" },
        { name:"Mozzarella", qty:"1 Stk", cat:"Milchprodukte" },
        { name:"Schinken", qty:"4 Scheiben", cat:"Fleisch/Fisch", optional:true },
        { name:"Sucuk", qty:"120 g", cat:"Fleisch/Fisch", optional:true }
      ],
      tags:{ Mahlzeit:["Snack","Mittagessen"], Ernährung:["Veggie","Fleisch"], Küche:["Italienisch"], Aufwand:["Schnell"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Nudelsalat Caprese",
      ings: [
        { name:"Pasta Fusilli", qty:"300 g", cat:"Getreide/Backwaren" },
        { name:"Tomate", qty:"3 Stk", cat:"Gemüse" },
        { name:"Mozzarella", qty:"2 Stk", cat:"Milchprodukte" },
        { name:"Pesto grün", qty:"3 EL", cat:"Saucen/Öle" },
        { name:"Pinienkerne", qty:"30 g", cat:"Snacks", optional:true }
      ],
      tags:{ Mahlzeit:["Mittagessen","Abendessen"], Ernährung:["Veggie"], Küche:["Italienisch"], Aufwand:["Schnell","Meal Prep"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Caesar Salad",
      ings: [
        { name:"Römersalat", qty:"1 Stk", cat:"Gemüse" },
        { name:"Hähnchenbrust", qty:"300 g", cat:"Fleisch/Fisch", optional:true },
        { name:"Parmesan", qty:"40 g", cat:"Milchprodukte" },
        { name:"Croutons", qty:"1 Pck", cat:"Getreide/Backwaren", optional:true },
        { name:"Mayonnaise", qty:"2 EL", cat:"Saucen/Öle" },
        { name:"Zitronensaft", qty:"1 EL", cat:"Früchte" },
        { name:"Knoblauch", qty:"1 Zehe", cat:"Gemüse", optional:true }
      ],
      tags:{ Mahlzeit:["Mittagessen","Abendessen"], Ernährung:["Veggie","Fleisch"], Küche:["Amerikanisch"], Aufwand:["Schnell"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Guacamole-Toast mit Tomaten",
      ings: [
        { name:"Brot", qty:"2 Scheiben", cat:"Getreide/Backwaren" },
        { name:"Avocado", qty:"1 Stk", cat:"Früchte" },
        { name:"Tomate", qty:"1 Stk", cat:"Gemüse" },
        { name:"Limette", qty:"0.5 Stk", cat:"Früchte", optional:true }
      ],
      tags:{ Mahlzeit:["Frühstück","Snack"], Ernährung:["Veggie","Gesund"], Küche:["Mexikanisch"], Aufwand:["Schnell","< 5 Zutaten"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Chicken Pad Thai",
      ings: [
        { name:"Reisnudeln", qty:"300 g", cat:"Getreide/Backwaren" },
        { name:"Hähnchenbrust", qty:"300 g", cat:"Fleisch/Fisch" },
        { name:"Sojasauce", qty:"3 EL", cat:"Saucen/Öle" },
        { name:"Limette", qty:"1 Stk", cat:"Früchte" },
        { name:"Eier", qty:"2 Stk", cat:"Milchprodukte" },
        { name:"Frühlingszwiebel", qty:"1 Bund", cat:"Gemüse" },
        { name:"Erdnüsse", qty:"40 g", cat:"Snacks" }
      ],
      tags:{ Mahlzeit:["Abendessen"], Ernährung:["Fleisch"], Küche:["Asiatisch"], Aufwand:["Pfanne"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Smoothie Bowl (Ninja Creamy)",
      ings: [
        { name:"TK-Beerenmix", qty:"300 g", cat:"Tiefkühl" },
        { name:"Skyr", qty:"250 g", cat:"Milchprodukte" },
        { name:"Banane", qty:"1 Stk", cat:"Früchte" },
        { name:"Haferflocken", qty:"40 g", cat:"Getreide/Backwaren", optional:true }
      ],
      tags:{ Mahlzeit:["Frühstück","Snack"], Ernährung:["Gesund","Proteinreich","Veggie"], Aufwand:["Schnell"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Sticky Salmon Bites mit Reis",
      ings: [
        { name:"Lachs frisch", qty:"400 g", cat:"Fleisch/Fisch" },
        { name:"Reis", qty:"300 g", cat:"Getreide/Backwaren" },
        { name:"Sojasauce", qty:"3 EL", cat:"Saucen/Öle" },
        { name:"Sriracha", qty:"1 EL", cat:"Saucen/Öle", optional:true },
        { name:"Honig", qty:"1 EL", cat:"Saucen/Öle" }
      ],
      tags:{ Mahlzeit:["Abendessen"], Ernährung:["Pescetarisch","Proteinreich"], Küche:["Asiatisch"], Aufwand:["Pfanne"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Burger mit Salat",
      ings: [
        { name:"Brötchen", qty:"4 Stk", cat:"Getreide/Backwaren" },
        { name:"Rindhack", qty:"500 g", cat:"Fleisch/Fisch" },
        { name:"Salat (Kopf)", qty:"1 Stk", cat:"Gemüse" },
        { name:"Tomate", qty:"1 Stk", cat:"Gemüse" },
        { name:"Käse Gouda", qty:"4 Scheiben", cat:"Milchprodukte", optional:true },
        { name:"Ketchup", qty:"2 EL", cat:"Saucen/Öle" }
      ],
      tags:{ Mahlzeit:["Abendessen"], Ernährung:["Fleisch"], Küche:["Amerikanisch"], Aufwand:["Pfanne"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Pizza mit Speckstreifen und Mais",
      ings: [
        { name:"Pizzateig", qty:"1 Stk", cat:"Getreide/Backwaren" },
        { name:"Passata", qty:"200 ml", cat:"Konserven" },
        { name:"Mozzarella", qty:"1 Stk", cat:"Milchprodukte" },
        { name:"Speckwürfel", qty:"100 g", cat:"Fleisch/Fisch" },
        { name:"Mais (Dose)", qty:"0.5 Stk", cat:"Konserven" }
      ],
      tags:{ Mahlzeit:["Abendessen"], Ernährung:["Fleisch"], Küche:["Italienisch"], Aufwand:["Ofen"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Crispy Kartoffelsalat",
      ings: [
        { name:"Kartoffel festkochend", qty:"1 kg", cat:"Gemüse" },
        { name:"Olivenöl", qty:"2 EL", cat:"Saucen/Öle" },
        { name:"Balsamico", qty:"1 EL", cat:"Saucen/Öle" },
        { name:"Schnittlauch", qty:"1 Bund", cat:"Gemüse" }
      ],
      tags:{ Mahlzeit:["Beilage","Mittagessen"], Ernährung:["Veggie","Gesund"], Küche:["Mediterran"], Aufwand:["Ofen"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Burrito Bowl mit Süsskartoffeln",
      ings: [
        { name:"Reis", qty:"300 g", cat:"Getreide/Backwaren" },
        { name:"Süsskartoffel", qty:"1 Stk", cat:"Gemüse" },
        { name:"Mais (Dose)", qty:"1 Stk", cat:"Konserven" },
        { name:"Avocado", qty:"1 Stk", cat:"Früchte", optional:true },
        { name:"Tomate", qty:"2 Stk", cat:"Gemüse" }
      ],
      tags:{ Mahlzeit:["Mittagessen","Abendessen"], Ernährung:["Veggie"], Küche:["Mexikanisch"], Aufwand:["Meal Prep"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Tortellini-Auflauf",
      ings: [
        { name:"Tortellini", qty:"500 g", cat:"Getreide/Backwaren" },
        { name:"Passata", qty:"400 ml", cat:"Konserven" },
        { name:"Mozzarella", qty:"1 Stk", cat:"Milchprodukte" },
        { name:"Parmesan", qty:"40 g", cat:"Milchprodukte" },
        { name:"Rahm/Sahne", qty:"100 ml", cat:"Milchprodukte", optional:true }
      ],
      tags:{ Mahlzeit:["Abendessen"], Ernährung:["Veggie"], Küche:["Italienisch"], Aufwand:["Ofen"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Crispy Chickpeas Salat",
      ings: [
        { name:"Kichererbsen (Dose)", qty:"1 Stk", cat:"Konserven" },
        { name:"Römersalat", qty:"1 Stk", cat:"Gemüse" },
        { name:"Gurke", qty:"1 Stk", cat:"Gemüse" },
        { name:"Tomate", qty:"2 Stk", cat:"Gemüse" },
        { name:"Olivenöl", qty:"2 EL", cat:"Saucen/Öle" }
      ],
      tags:{ Mahlzeit:["Mittagessen"], Ernährung:["Vegan","Gesund"], Küche:["Mediterran"], Aufwand:["Schnell"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Crispy Reis Salat",
      ings: [
        { name:"Reis", qty:"250 g", cat:"Getreide/Backwaren" },
        { name:"Edamame", qty:"150 g", cat:"Gemüse", optional:true },
        { name:"Gurke", qty:"1 Stk", cat:"Gemüse" },
        { name:"Avocado", qty:"1 Stk", cat:"Früchte", optional:true },
        { name:"Granatapfelkerne", qty:"60 g", cat:"Früchte", optional:true }
      ],
      tags:{ Mahlzeit:["Mittagessen"], Ernährung:["Veggie","Vegan"], Küche:["Fusion"], Aufwand:["Schnell"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Gebratener Reis mit Ei",
      ings: [
        { name:"Reis", qty:"300 g", cat:"Getreide/Backwaren" },
        { name:"Eier", qty:"3 Stk", cat:"Milchprodukte" },
        { name:"Frühlingszwiebel", qty:"1 Bund", cat:"Gemüse" },
        { name:"Karotte", qty:"2 Stk", cat:"Gemüse" },
        { name:"TK-Erbsen", qty:"150 g", cat:"Tiefkühl" },
        { name:"Sojasauce", qty:"2 EL", cat:"Saucen/Öle" }
      ],
      tags:{ Mahlzeit:["Mittagessen","Abendessen"], Ernährung:["Veggie","Proteinreich"], Küche:["Asiatisch"], Aufwand:["Pfanne","Schnell"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Steak mit Kartoffeln oder Reis",
      ings: [
        { name:"Rindsteak", qty:"2 Stk", cat:"Fleisch/Fisch" },
        { name:"Kartoffel festkochend", qty:"800 g", cat:"Gemüse", optional:true },
        { name:"Reis", qty:"250 g", cat:"Getreide/Backwaren", optional:true },
        { name:"Olivenöl", qty:"1 EL", cat:"Saucen/Öle" }
      ],
      tags:{ Mahlzeit:["Abendessen"], Ernährung:["Fleisch","Proteinreich"], Küche:["International"], Aufwand:["Pfanne"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Salat mit Ei",
      ings: [
        { name:"Salat (Kopf)", qty:"1 Stk", cat:"Gemüse" },
        { name:"Eier", qty:"3 Stk", cat:"Milchprodukte" },
        { name:"Tomate", qty:"1 Stk", cat:"Gemüse" },
        { name:"Gurke", qty:"0.5 Stk", cat:"Gemüse" }
      ],
      tags:{ Mahlzeit:["Mittagessen"], Ernährung:["Veggie","Proteinreich"], Küche:["International"], Aufwand:["Schnell"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Gözleme mit Spinat",
      ings: [
        { name:"Pita", qty:"2 Stk", cat:"Getreide/Backwaren" },
        { name:"Spinat", qty:"300 g", cat:"Gemüse" },
        { name:"Feta", qty:"150 g", cat:"Milchprodukte" },
        { name:"Zwiebel gelb", qty:"0.5 Stk", cat:"Gemüse", optional:true }
      ],
      tags:{ Mahlzeit:["Mittagessen","Abendessen"], Ernährung:["Veggie"], Küche:["Orientalisch"], Aufwand:["Pfanne"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Creamy Protein Eis (Schoko)",
      ings: [
        { name:"Skyr", qty:"250 g", cat:"Milchprodukte" },
        { name:"Kakaopulver", qty:"2 EL", cat:"Snacks" },
        { name:"Banane", qty:"1 Stk", cat:"Früchte" }
      ],
      tags:{ Mahlzeit:["Snack","Dessert"], Ernährung:["Gesund","Proteinreich"], Aufwand:["Schnell","< 5 Zutaten"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Kaiserschmarrn",
      ings: [
        { name:"Mehl Weiss", qty:"200 g", cat:"Getreide/Backwaren" },
        { name:"Milch", qty:"250 ml", cat:"Milchprodukte" },
        { name:"Eier", qty:"3 Stk", cat:"Milchprodukte" },
        { name:"Butter", qty:"20 g", cat:"Milchprodukte" },
        { name:"Zucker", qty:"2 EL", cat:"Snacks" }
      ],
      tags:{ Mahlzeit:["Dessert","Snack"], Ernährung:["Veggie"], Küche:["Österreichisch"], Aufwand:["Pfanne"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Teriyaki Chicken Summer Rolls",
      ings: [
        { name:"Reispapier", qty:"10 Stk", cat:"Getreide/Backwaren" },
        { name:"Hähnchenbrust", qty:"300 g", cat:"Fleisch/Fisch" },
        { name:"Teriyaki Sauce", qty:"4 EL", cat:"Saucen/Öle" },
        { name:"Gurke", qty:"1 Stk", cat:"Gemüse" },
        { name:"Karotte", qty:"2 Stk", cat:"Gemüse" },
        { name:"Salat (Kopf)", qty:"0.5 Stk", cat:"Gemüse" }
      ],
      tags:{ Mahlzeit:["Mittagessen","Abendessen"], Ernährung:["Fleisch"], Küche:["Asiatisch"], Aufwand:["Schnell"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Caprese Salat",
      ings: [
        { name:"Tomate", qty:"3 Stk", cat:"Gemüse" },
        { name:"Mozzarella", qty:"2 Stk", cat:"Milchprodukte" },
        { name:"Basilikum getrocknet", qty:"1 TL", cat:"Gewürze" },
        { name:"Olivenöl", qty:"1 EL", cat:"Saucen/Öle" }
      ],
      tags:{ Mahlzeit:["Vorspeise","Mittagessen"], Ernährung:["Veggie","Gesund"], Küche:["Italienisch"], Aufwand:["Schnell","< 5 Zutaten"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Mais in Butter angebraten",
      ings: [
        { name:"Mais (Dose)", qty:"1 Stk", cat:"Konserven" },
        { name:"Butter", qty:"20 g", cat:"Milchprodukte" }
      ],
      tags:{ Mahlzeit:["Beilage","Snack"], Ernährung:["Veggie"], Aufwand:["Schnell","< 5 Zutaten","Pfanne"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Waffeln mit Ahornsirup/Früchten",
      ings: [
        { name:"Mehl Weiss", qty:"200 g", cat:"Getreide/Backwaren" },
        { name:"Milch", qty:"250 ml", cat:"Milchprodukte" },
        { name:"Eier", qty:"2 Stk", cat:"Milchprodukte" },
        { name:"Butter", qty:"40 g", cat:"Milchprodukte" },
        { name:"Ahornsirup", qty:"nach Bedarf", cat:"Snacks" },
        { name:"Beerenmix", qty:"150 g", cat:"Früchte", optional:true }
      ],
      tags:{ Mahlzeit:["Frühstück","Dessert"], Ernährung:["Veggie"], Küche:["International"], Aufwand:["Ofen"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Flammkuchen mit Speck, Käse, Creme Fraiche, Zwiebeln",
      ings: [
        { name:"Flammkuchenteig", qty:"1 Stk", cat:"Getreide/Backwaren" },
        { name:"Creme Fraiche", qty:"200 g", cat:"Milchprodukte" },
        { name:"Zwiebel gelb", qty:"1 Stk", cat:"Gemüse" },
        { name:"Speckwürfel", qty:"100 g", cat:"Fleisch/Fisch" },
        { name:"Käse gerieben", qty:"100 g", cat:"Milchprodukte" }
      ],
      tags:{ Mahlzeit:["Abendessen"], Ernährung:["Fleisch"], Küche:["Französisch"], Aufwand:["Ofen"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Kürbissuppe mit Karotten & Zwiebeln",
      ings: [
        { name:"Kürbis Hokkaido", qty:"1 Stk", cat:"Gemüse" },
        { name:"Karotte", qty:"3 Stk", cat:"Gemüse" },
        { name:"Zwiebel gelb", qty:"1 Stk", cat:"Gemüse" },
        { name:"Rahm/Sahne", qty:"100 ml", cat:"Milchprodukte", optional:true },
        { name:"Gemüsebouillon", qty:"1 Würfel", cat:"Gewürze" }
      ],
      tags:{ Mahlzeit:["Abendessen","Vorspeise"], Ernährung:["Veggie","Gesund"], Küche:["International"], Aufwand:["Topf"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Brokkoli-Cremesuppe",
      ings: [
        { name:"Brokkoli", qty:"1 Stk", cat:"Gemüse" },
        { name:"Zwiebel gelb", qty:"1 Stk", cat:"Gemüse" },
        { name:"Rahm/Sahne", qty:"150 ml", cat:"Milchprodukte", optional:true },
        { name:"Gemüsebouillon", qty:"1 Würfel", cat:"Gewürze" }
      ],
      tags:{ Mahlzeit:["Abendessen","Vorspeise"], Ernährung:["Veggie","Gesund"], Küche:["International"], Aufwand:["Topf","< 5 Zutaten"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Kokos-Curry-Suppe",
      ings: [
        { name:"Kokosmilch (Dose)", qty:"1 Stk", cat:"Konserven" },
        { name:"Currypulver", qty:"1 TL", cat:"Gewürze" },
        { name:"Gemüsebouillon", qty:"1 Würfel", cat:"Gewürze" },
        { name:"Karotte", qty:"2 Stk", cat:"Gemüse" }
      ],
      tags:{ Mahlzeit:["Abendessen","Vorspeise"], Ernährung:["Vegan","Gesund"], Küche:["Asiatisch"], Aufwand:["Topf"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Flädlesuppe",
      ings: [
        { name:"Pfannkuchen/Crêpe", qty:"2 Stk", cat:"Getreide/Backwaren" },
        { name:"Gemüsebouillon", qty:"500 ml", cat:"Gewürze" },
        { name:"Schnittlauch", qty:"1 Bund", cat:"Gemüse", optional:true }
      ],
      tags:{ Mahlzeit:["Vorspeise","Snack"], Ernährung:["Veggie"], Küche:["Schweizerisch"], Aufwand:["Schnell"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Crêpe",
      ings: [
        { name:"Mehl Weiss", qty:"200 g", cat:"Getreide/Backwaren" },
        { name:"Milch", qty:"400 ml", cat:"Milchprodukte" },
        { name:"Eier", qty:"3 Stk", cat:"Milchprodukte" },
        { name:"Butter", qty:"20 g", cat:"Milchprodukte" }
      ],
      tags:{ Mahlzeit:["Frühstück","Dessert"], Ernährung:["Veggie"], Küche:["Französisch"], Aufwand:["Pfanne"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Menemen mit Sucuk (opt.)",
      ings: [
        { name:"Eier", qty:"3 Stk", cat:"Milchprodukte" },
        { name:"Tomate", qty:"2 Stk", cat:"Gemüse" },
        { name:"Paprika grün", qty:"1 Stk", cat:"Gemüse" },
        { name:"Zwiebel gelb", qty:"0.5 Stk", cat:"Gemüse" },
        { name:"Sucuk", qty:"120 g", cat:"Fleisch/Fisch", optional:true }
      ],
      tags:{ Mahlzeit:["Frühstück","Mittagessen"], Ernährung:["Veggie","Fleisch"], Küche:["Orientalisch"], Aufwand:["Pfanne"] }
    },
    {
      id: crypto.randomUUID(),
      title: "Blumenkohlsuppe",
      ings: [
        { name:"Blumenkohl", qty:"1 Stk", cat:"Gemüse" },
        { name:"Zwiebel gelb", qty:"1 Stk", cat:"Gemüse" },
        { name:"Rahm/Sahne", qty:"100 ml", cat:"Milchprodukte", optional:true },
        { name:"Gemüsebouillon", qty:"1 Würfel", cat:"Gewürze" }
      ],
      tags:{ Mahlzeit:["Abendessen","Vorspeise"], Ernährung:["Veggie","Gesund"], Küche:["International"], Aufwand:["Topf"] }
    }
  ];

  // Nach dem Seed gleich speichern
  store.save('recipes', recipes);
}

  // --- Grundzutaten je Rezepttitel festlegen und alle anderen Zutaten als add-on markieren ---
(function(){
  // Map: Rezepttitel -> Liste der fixen Grundzutaten (per Name; Case-insensitive, enthält Teiltreffer)
  const CORE_INGS = {
    "Fajita mit Hähnchen": ["Hähnchenbrust","Paprika","Tortilla"],
    "Quesadilla": ["Tortilla","Käse"],
    "Bruschetta": ["Brot","Tomate","Olivenöl"],
    "Butter Chicken": ["Hähnchen","Butter Chicken Sauce","Reis","Mehl","Joghurt","Backpulver"], // Naan basics auch fix
    "Reis Bowl": ["Reis","Gurke"],
    "Nudeln mit Lachs": ["Pasta","Lachs","Rahm","Sahne"],
    "Rührei": ["Eier","Butter"],
    "Ofenkartoffeln": ["Kartoffel","Olivenöl"],
    "Creamy Feta Gnocchi": ["Gnocchi","Passata","Rahm","Sahne","Feta"],
    "Creamy Pasta": ["Pasta","Rahm","Sahne","Parmesan"],
    "Rösti mit Rahmsauce": ["Rösti","Rahm","Sahne","Zwiebel","Butter"],
    "Sandwich": ["Brot"],
    "Panini": ["Brot"],
    "Nudelsalat": ["Pasta","Tomate","Mozzarella","Pesto"],
    "Caesar Salad": ["Römersalat","Parmesan"],
    "Guacamole-Toast": ["Brot","Avocado","Tomate"],
    "Chicken Pad Thai": ["Reisnudeln","Hähnchen","Sojasauce","Eier"],
    "Smoothie Bowl": ["TK-Beeren","Skyr","Banane"],
    "Sticky Salmon Bites": ["Lachs","Reis","Sojasauce"],
    "Burger": ["Brötchen","Rindhack","Salat","Tomate"],
    "Pizza": ["Pizzateig","Passata","Mozzarella"],
    "Crispy Kartoffelsalat": ["Kartoffel","Olivenöl","Balsamico"],
    "Burrito Bowl": ["Reis","Süsskartoffel","Mais"],
    "Tortellini-Auflauf": ["Tortellini","Passata","Mozzarella"],
    "Crispy Chickpeas Salat": ["Kichererbsen","Römersalat"],
    "Crispy Reis Salat": ["Reis","Gurke"],
    "Gebratener Reis mit Ei": ["Reis","Eier","Karotte","Erbsen","Sojasauce"],
    "Steak": ["Rindsteak"],
    "Salat mit Ei": ["Salat","Eier","Tomate"],
    "Gözleme": ["Pita","Spinat","Feta"],
    "Creamy Protein Eis": ["Skyr","Kakaopulver","Banane"],
    "Kaiserschmarrn": ["Mehl","Milch","Eier"],
    "Teriyaki Chicken Summer Rolls": ["Reispapier","Hähnchen","Teriyaki","Gurke","Karotte","Salat"],
    "Caprese": ["Tomate","Mozzarella","Basilikum","Olivenöl"],
    "Mais in Butter": ["Mais","Butter"],
    "Waffeln": ["Mehl","Milch","Eier","Butter"],
    "Flammkuchen": ["Flammkuchenteig","Creme Fraiche","Zwiebel"],
    "Kürbissuppe": ["Kürbis","Karotte","Zwiebel","Bouillon"],
    "Brokkoli-Cremesuppe": ["Brokkoli","Zwiebel","Bouillon"],
    "Kokos-Curry-Suppe": ["Kokosmilch","Currypulver","Bouillon","Karotte"],
    "Flädlesuppe": ["Bouillon","Pfannkuchen","Crêpe"],
    "Crêpe": ["Mehl","Milch","Eier"],
    "Menemen": ["Eier","Tomate","Paprika","Zwiebel"],
    "Blumenkohlsuppe": ["Blumenkohl","Zwiebel","Bouillon"]
  };

  function markOptionalsForRecipe(rec){
    const cores = CORE_INGS[Object.keys(CORE_INGS).find(k => rec.title.toLowerCase().includes(k.toLowerCase()))] || null;
    if(!Array.isArray(rec.ings)) return rec;
    if(!cores){ 
      // Fallback: lasse existierende optional-Werte wie sie sind
      return rec;
    }
    const normalizedCores = cores.map(s=>s.toLowerCase());
    rec.ings = rec.ings.map(ing=>{
      const nm = (ing.name||'').toLowerCase();
      const isCore = normalizedCores.some(core => nm.includes(core));
      return {...ing, optional: !isCore ? true : false};
    });
    return rec;
  }

  // anwenden auf geladene/seeded Rezepte
  window.AppData.recipes = (window.AppData.recipes||[]).map(markOptionalsForRecipe);
  store.save('recipes', window.AppData.recipes);
})();


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
