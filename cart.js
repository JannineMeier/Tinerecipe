// cart.js
(function(){
  const {store,AISLE_ORDER,STORE_TAGS,parseQty,formatQty,stepFor,ensureQtyObject}=window.AppData;
  const { $,h,toast }=window.UI;

  let lastDeleted=null;

  function addToCart(items,recipe=null){ /* ... */ }

  function renderCart(){ /* ... finale Version ... */ }

  function showUndo(msg){ /* ... */ }

  function checkAll(){ window.AppData.cart.forEach(i=>i.checked=true); store.save('cart',window.AppData.cart); renderCart(); }
  function uncheckAll(){ window.AppData.cart.forEach(i=>i.checked=false); store.save('cart',window.AppData.cart); renderCart(); }
  function clearCart(){ /* ... */ }

  window.Cart={addToCart,renderCart,checkAll,uncheckAll,clearCart};
})();
