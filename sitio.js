(function(){
  var raiz=document.documentElement;
  var quieto=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Alto de la barra: anclas (scroll-padding) y panel del menú móvil
  var barra=document.querySelector('.barra');
  function medir(){ raiz.style.setProperty('--barra-h', barra.getBoundingClientRect().height+'px'); }
  if(barra){ medir(); if(window.ResizeObserver) new ResizeObserver(medir).observe(barra); else window.addEventListener('resize',medir); }

  // Menú móvil: botón de despliegue (patrón disclosure) que cubre la página
  var btn=document.querySelector('.menu-btn'), menu=document.getElementById('menu');
  if(btn&&menu){
    btn.hidden=false;
    var etiqueta=btn.querySelector('.menu-t');
    var fuera=[document.querySelector('.saltar'),document.querySelector('main'),document.querySelector('footer')];
    var abrir=function(si){
      raiz.classList.toggle('menu-abierto',si);
      btn.setAttribute('aria-expanded',String(si));
      if(etiqueta) etiqueta.textContent=si?'Cerrar':'Menú';
      fuera.forEach(function(el){ if(el) el.inert=si; });
    };
    btn.addEventListener('click',function(){ abrir(btn.getAttribute('aria-expanded')!=='true'); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&raiz.classList.contains('menu-abierto')){ abrir(false); btn.focus(); } });
    menu.addEventListener('click',function(e){ if(e.target.closest('a')) abrir(false); });
    var ancho=window.matchMedia('(min-width:760px)');
    (ancho.addEventListener?ancho.addEventListener('change',function(e){ if(e.matches) abrir(false); }):ancho.addListener(function(e){ if(e.matches) abrir(false); }));
    window.addEventListener('pagehide',function(){ abrir(false); });
  }

  // Revelado al bajar: una sola vez. El script del final del <body> ya dejó visible lo de la primera pantalla
  // (arriba del 90 % de la ventana) y puso html.revela; aquí sólo se vigila lo de abajo.
  var els=[].slice.call(document.querySelectorAll('[data-revela]'));
  [].forEach.call(document.querySelectorAll('[data-grupo]'),function(g){
    [].forEach.call(g.querySelectorAll('[data-revela]'),function(el,i){ el.style.setProperty('--i',Math.min(i,3)); });
  });
  var tarde=window.performance&&performance.now()>2300;   // la red de seguridad CSS ya mostró todo: no se vuelve a esconder
  if(!raiz.classList.contains('revela')||quieto||tarde||!('IntersectionObserver' in window)){
    els.forEach(function(el){ el.classList.add('visto'); });
  } else {
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('visto'); io.unobserve(e.target); } });
    },{rootMargin:'0px 0px -10% 0px'});
    els.forEach(function(el){ if(!el.classList.contains('visto')) io.observe(el); });
  }

  // Dirección del recorrido para la transición entre páginas (la lee el script del <head> en la página nueva)
  window.addEventListener('pageswap',function(){ try{ sessionStorage.setItem('ollin-paso',raiz.dataset.paso); }catch(_){} });

  // Analítica: un solo escuchador delegado para los enlaces marcados con data-evento (WhatsApp, correo y "Hablemos").
  // Sólo manda el nombre del evento y su ubicación; nunca datos del formulario. Sin GA4_ID no existe gtag y no hace nada.
  function evento(nombre,ubicacion){
    if(typeof window.gtag==='function') window.gtag('event',nombre,{ubicacion:ubicacion,transport_type:'beacon'});
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('[data-evento]');
    if(a) evento(a.dataset.evento,a.dataset.ubicacion);
  });

  // Abre WhatsApp o el correo ya armados. Todo pasa por aquí, así las pruebas pueden sustituirla (window.__abrirDestino)
  // sin abrir nada de verdad.
  function abrirDestino(url){
    if(typeof window.__abrirDestino==='function') return window.__abrirDestino(url);
    if(url.indexOf('https://wa.me/')===0) window.open(url,'_blank','noopener');
    else location.href=url;
  }

  // Formulario (sólo en /contacto/): sin JS queda oculto y sólo se ven los enlaces directos.
  var f=document.getElementById('f-forma');
  if(f){
    f.hidden=false;
    var WA='525574086846', CORREO='proyectos@ollinsoluciones.com', err=document.getElementById('f-error'), estado=document.getElementById('f-estado');
    var MSJ={
      falta:'Escribe tu nombre y un teléfono de 10 dígitos para enviar.',
      wa:'Gracias. Para completar el envío, confirma el mensaje en WhatsApp. Te responderemos dentro de nuestro horario de atención, de lunes a sábado de 9:00 a 21:00 h, para acordar la primera reunión.',
      mail:'Gracias. Para completar el envío, confirma el mensaje en tu programa de correo. Te responderemos dentro de nuestro horario de atención, de lunes a sábado de 9:00 a 21:00 h, para acordar la primera reunión.'
    };
    var digitos=function(v){ var n=v.replace(/\D/g,''); if(n.length===12&&n.indexOf('52')===0) n=n.slice(2); return n; };
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var via=(e.submitter&&e.submitter.dataset.via)||'wa', ok=true, d={};
      ['nombre','negocio','telefono','mensaje'].forEach(function(n){
        var el=f.elements[n]; d[n]=el.value.trim();
        if(el.required){ var bad=!d[n]; el.setAttribute('aria-invalid',String(bad)); if(bad) ok=false; }
      });
      var tel=f.elements.telefono;
      if(d.telefono&&digitos(d.telefono).length!==10){ tel.setAttribute('aria-invalid','true'); ok=false; }
      // vaciar y llenar en el siguiente cuadro: así role=status vuelve a anunciar aunque el texto sea el mismo
      var di=function(el,t){ el.textContent=''; if(t) requestAnimationFrame(function(){ el.textContent=t; }); };
      di(estado,'');
      if(!ok){ di(err,MSJ.falta); f.querySelector('[aria-invalid="true"]').focus(); return; }
      di(err,'');
      var t='Hola, soy '+d.nombre+(d.negocio?' de '+d.negocio:'')+'. Mi teléfono: '+d.telefono+'.'+(d.mensaje?'\n\n'+d.mensaje:'');
      evento(via==='wa'?'formulario_whatsapp':'formulario_correo','contacto');
      abrirDestino(via==='wa'
        ? 'https://wa.me/'+WA+'?text='+encodeURIComponent(t)
        : 'mailto:'+CORREO+'?subject='+encodeURIComponent('Quiero hablar de mi negocio'+(d.negocio?': '+d.negocio:''))+'&body='+encodeURIComponent(t));
      di(estado,MSJ[via==='wa'?'wa':'mail']);
    });
  }

  raiz.classList.add('listo');
})();
