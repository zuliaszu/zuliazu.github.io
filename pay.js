(function(){
  'use strict';
  var links=Array.from(document.querySelectorAll('[data-pay-choice]'));
  var panels=Array.from(document.querySelectorAll('[data-pay-role]'));
  if(!links.length||!panels.length)return;
  function known(id){return panels.some(function(p){return p.id===id;});}
  function select(id,announce){
    if(!known(id))return;
    panels.forEach(function(p){p.hidden=p.id!==id;});
    links.forEach(function(a){if(a.dataset.payChoice===id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
    if(announce)document.getElementById('pay-selection-status').textContent='Showing '+document.getElementById('title-'+id).textContent;
  }
  links.forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();select(a.dataset.payChoice,true);try{history.replaceState(null,'','#'+a.dataset.payChoice);}catch(ignore){}});});
  function fromHash(){var id=location.hash.slice(1);if(known(id))select(id,false);}
  select(known(location.hash.slice(1))?location.hash.slice(1):'engineer',false);
  addEventListener('hashchange',fromHash);
})();
