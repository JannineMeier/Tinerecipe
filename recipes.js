// recipes.js
(function(){
  const {store}=window.AppData;
  const { $,h }=window.UI;
  const TAG_CATEGORIES={
    Mahlzeit:["Frühstück","Snack","Mittagessen","Abendessen","Dessert"],
    Ernährung:["Vegan","Veggie","Fleisch","Proteinreich","Gesund","Glutenfrei","Low Carb"],
    Küche:["Italienisch","Asiatisch","Indisch","Mexikanisch","Mediterran"],
    Aufwand:["Schnell","Meal Prep","<5 Zutaten","One-Pot","Ofen","Pfanne"]
  };
  const selectedFilters=Object.fromEntries(Object.keys(TAG_CATEGORIES).map(k=>[k,new Set()]));

  function buildEditor(){ $('#recipe-form').innerHTML='[Form-UI hier, wie gehabt]'; }

  function renderTagPickers(existing=null){ /* ... wie vorher ... */ }
  function collectSelectedTagsFromEditor(){ /* ... wie vorher ... */ }
  function renderFilterChips(){ /* ... wie vorher ... */ }

  function recipeCard(r){ /* ... wie vorher ... */ }
  function renderRecipeList(){ /* ... wie vorher ... */ }

  window.Recipes={buildEditor,renderTagPickers,collectSelectedTagsFromEditor,renderFilterChips,renderRecipeList};
})();
