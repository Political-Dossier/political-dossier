// Floating "Jump to the map" button and scroll cue for the Policy Ecosystem Atlas.
(function(){
  var btn = document.getElementById('jumpmap');
  var explore = document.getElementById('explore');
  var mapView = document.getElementById('v-map');
  if (!btn || !explore || !mapView) return;
  function goMap(e){
    e.preventDefault();
    if (location.hash !== '#map') location.hash = 'map';
    setTimeout(function(){ explore.scrollIntoView({behavior:'smooth'}); }, 60);
  }
  btn.addEventListener('click', goMap);
  var ticking = false;
  function update(){
    ticking = false;
    var onMap = mapView.classList.contains('on');
    var top = explore.getBoundingClientRect().top;
    // Show it everywhere except once the full map is on screen.
    btn.hidden = onMap && top < window.innerHeight * 0.55;
  }
  function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  window.addEventListener('hashchange', function(){ setTimeout(update, 30); });
  var cue = document.querySelector('.scrollcue');
  if (cue) cue.addEventListener('click', function(e){
    e.preventDefault();
    if (location.hash && location.hash !== '#map') location.hash = 'map';
    var steps = document.getElementById('steps');
    setTimeout(function(){ (steps || explore).scrollIntoView({behavior:'smooth'}); }, 60);
  });
  update();
})();
