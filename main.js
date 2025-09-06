// main.js
(function(){
  const { $, $$, toast }=window.UI;
  const { STORE_TAGS }=window.AppData;

  function switchTab(tab){ /* ... */ }
  function wireTabs(){ /* ... */ }
  function exportAll(){ /* ... */ }
  function importAllFromFile(file){ /* ... */ }
  function wireImportExport(){ /* ... */ }
  function wireCartToolbar(){ /* ... */ }

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
    window.UI.$$('button').forEach(b=>{ if(!b.hasAttribute('type')) b.setAttribute('type','button'); });
  }
  init();
})();
