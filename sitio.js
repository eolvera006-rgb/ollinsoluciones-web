(function(){
  var raiz=document.documentElement;
  // Fuera del dominio publicado (revisión en local) se ven los avisos de borrador
  var local=!/(^|\.)ollinsoluciones\.com$/.test(location.hostname);
  if(local) raiz.classList.add('local');

  // Alto de la barra: anclas (scroll-padding), paneles, velo y cajón
  var barra=document.querySelector('.barra');
  function medir(){ raiz.style.setProperty('--barra-h', barra.getBoundingClientRect().height+'px'); }
  if(barra){ medir(); if(window.ResizeObserver) new ResizeObserver(medir).observe(barra); else window.addEventListener('resize',medir); }
  var fuera=[document.querySelector('.saltar'),document.querySelector('main'),document.querySelector('footer')];
  var inerte=function(si){ fuera.forEach(function(el){ if(el) el.inert=si; }); };

  // Menús desplegables (escritorio): se abren con clic, Enter o espacio; Esc, clic fuera o abrir otro los cierra.
  // El foco pasa al panel al abrir y vuelve al botón al cerrar.
  var velo=document.querySelector('.velo');
  var desps=[].map.call(document.querySelectorAll('.desp-b'),function(b){ return {b:b, p:document.getElementById(b.getAttribute('aria-controls'))}; });
  var abierto=null;
  function cierra(devolver){
    if(!abierto) return;
    var d=abierto; abierto=null;
    d.b.setAttribute('aria-expanded','false'); d.p.classList.remove('abierto');
    if(velo) velo.hidden=true;
    if(devolver) d.b.focus();
  }
  function abre(d){
    if(abierto===d) return cierra(true);
    cierra(false);
    abierto=d; d.b.setAttribute('aria-expanded','true'); d.p.classList.add('abierto');
    if(velo) velo.hidden=false;
    d.p.focus({preventScroll:true});
  }
  desps.forEach(function(d){
    if(!d.p) return;
    d.b.addEventListener('click',function(){ abre(d); });
    d.p.addEventListener('click',function(e){ if(e.target.closest('a')) cierra(false); });
    // salir del panel con Tab (o Mayús+Tab) lo cierra sin robar el foco
    d.p.addEventListener('focusout',function(e){ if(abierto===d&&e.relatedTarget&&!d.p.contains(e.relatedTarget)&&e.relatedTarget!==d.b) cierra(false); });
  });
  if(velo) velo.addEventListener('click',function(){ cierra(false); });
  document.addEventListener('click',function(e){ if(abierto&&!abierto.p.contains(e.target)&&!abierto.b.contains(e.target)) cierra(false); });

  // Cajón móvil (menos de 900 px): pantalla completa, acordeones, fondo sin desplazamiento
  var btn=document.querySelector('.menu-btn'), cajon=document.getElementById('cajon');
  function cajonAbierto(si){
    if(!btn||!cajon) return;
    cajon.hidden=!si; raiz.classList.toggle('cajon-abierto',si);
    btn.setAttribute('aria-expanded',String(si));
    var t=btn.querySelector('.menu-t'); if(t) t.textContent=si?'Cerrar':'Menú';
    inerte(si);
  }
  if(btn&&cajon){
    btn.addEventListener('click',function(){ cajonAbierto(btn.getAttribute('aria-expanded')!=='true'); });
    cajon.addEventListener('click',function(e){ if(e.target.closest('a')) cajonAbierto(false); });
    [].forEach.call(cajon.querySelectorAll('.acor-b'),function(b){
      var l=document.getElementById(b.getAttribute('aria-controls'));
      b.addEventListener('click',function(){ var si=b.getAttribute('aria-expanded')!=='true'; b.setAttribute('aria-expanded',String(si)); l.hidden=!si; });
    });
    var ancho=window.matchMedia('(min-width:900px)');
    var alCambiar=function(e){ if(e.matches) cajonAbierto(false); else cierra(false); };
    if(ancho.addEventListener) ancho.addEventListener('change',alCambiar); else ancho.addListener(alCambiar);
    window.addEventListener('pagehide',function(){ cajonAbierto(false); });
  }
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape') return;
    if(abierto) cierra(true);
    else if(raiz.classList.contains('cajon-abierto')){ cajonAbierto(false); btn.focus(); }
  });

  // Índice lateral: marca la sección que se está leyendo
  [].forEach.call(document.querySelectorAll('.indice-lateral'),function(indice){
    if(!('IntersectionObserver' in window)) return;
    var ligas={}; [].forEach.call(indice.querySelectorAll('a[href^="#"]'),function(a){ ligas[a.getAttribute('href').slice(1)]=a; });
    var vi=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ for(var k in ligas) ligas[k].classList.toggle('activo',k===e.target.id); } });
    },{rootMargin:'-20% 0px -70% 0px'});
    Object.keys(ligas).forEach(function(id){ var el=document.getElementById(id); if(el) vi.observe(el); });
  });

  // Diagnóstico del inicio: cuenta las señales; con dos o más aparece "Platiquemos de ellas".
  // Las marcadas viajan a Hablemos por sessionStorage (nunca en la URL).
  var sen=document.getElementById('diag-senales');
  if(sen){
    var cajas=[].slice.call(sen.querySelectorAll('input[type="checkbox"]')), ir=document.getElementById('senales-ir'),
        cuenta=document.getElementById('senales-cuenta'), msg=document.getElementById('senales-msg');
    var marcadas=function(){ return cajas.filter(function(c){ return c.checked; }).map(function(c){ return c.value; }); };
    var pinta=function(){
      var n=marcadas().length;
      cuenta.textContent=n;
      ir.hidden=n<2;
      msg.textContent=n<2?'Marca las que apliquen a tu negocio. Si reconoces dos o más, conviene platicarlo.'
        :'Reconoces '+n+' de '+cajas.length+'. Son justo los temas en los que trabajamos. En la primera reunión los revisamos contigo, sin costo.';
    };
    cajas.forEach(function(c){ c.addEventListener('change',pinta); });
    ir.addEventListener('click',function(){ try{ sessionStorage.setItem('ollin-senales',JSON.stringify(marcadas())); }catch(_){} });
    pinta();
  }

  // Perspectivas: el filtro funciona sin JS como anclas a los grupos; con JS filtra la lista (también desde el menú: #cat-… y #formato-…)
  var filtro=document.querySelector('.filtro');
  if(filtro){
    var lista=document.querySelector('.persp-lista'), filas=[].slice.call(document.querySelectorAll('#lista-articulos > li'));
    var botones=[].slice.call(filtro.querySelectorAll('a[data-cat]'));
    var aplica=function(cat,formato){
      botones.forEach(function(b){ b.setAttribute('aria-pressed',String(!formato&&b.dataset.cat===cat)); });
      var todos=!formato&&cat==='todos';
      if(lista) lista.classList.toggle('filtrada',!todos);
      filas.forEach(function(li){ li.hidden=!(todos||(formato?li.dataset.formato===formato:li.dataset.cat===cat)); });
    };
    botones.forEach(function(b){ b.setAttribute('role','button'); b.addEventListener('click',function(e){ e.preventDefault(); aplica(b.dataset.cat); }); });
    var desdeHash=function(){
      var h=decodeURIComponent(location.hash.slice(1)), m;
      if((m=h.match(/^cat-(.+)$/))) aplica(m[1]);
      else if((m=h.match(/^formato-(.+)$/))) aplica(null,m[1].replace(/s$/,''));   // #formato-guias → data-formato="guia"
      else return aplica('todos');
      var l=document.getElementById('pe1-t'); if(l) l.scrollIntoView();
    };
    window.addEventListener('hashchange',desdeHash);
    desdeHash();
  }

  // Analítica: un solo escuchador delegado para lo marcado con data-evento. Sólo manda el nombre del evento y su ubicación;
  // nunca datos del formulario. Sin GA4_ID no existe gtag y no hace nada.
  function evento(nombre,ubicacion){
    if(typeof window.gtag==='function') window.gtag('event',nombre,{ubicacion:ubicacion,transport_type:'beacon'});
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('[data-evento]');
    if(a) evento(a.dataset.evento,a.dataset.ubicacion);
  });

  // Formulario de Hablemos. Publicado, lo manda la aplicación web de Apps Script (Google Workspace) al correo de la empresa y lleva a /contacto/gracias/.
  // Sin JS, el formulario se envía directo a la aplicación web, que responde con su propia página de confirmación.
  var f=document.getElementById('f-forma');
  if(f){
    f.noValidate=true; f.elements.js.value='1';
    var destino=f.dataset.destino, t0=Date.now();
    var err=document.getElementById('f-error'), estado=document.getElementById('f-estado'), boton=f.querySelector('button[type="submit"]');
    var GRACIAS='/contacto/gracias/';
    var MSJ={
      ambito:'Elige qué te trae.',
      nombre:'Escribe tu nombre.',
      correo:'Escribe tu correo.',
      correoMal:'Revisa tu correo: debe tener la forma nombre@dominio.com.',
      mensaje:'Cuéntanos de tu negocio o de lo que hoy te quita tiempo.',
      enviando:'Enviando…',
      falla:'No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos.',
      sinDestino:'El formulario todavía no está conectado. Inténtalo de nuevo más tarde.'
    };
    // vaciar y llenar en el siguiente cuadro: así role=status vuelve a anunciar aunque el texto sea el mismo
    var di=function(el,t){ el.__t=t; el.textContent=''; if(t) requestAnimationFrame(function(){ if(el.__t===t) el.textContent=t; }); };
    var marca=function(id,t){ var c=document.getElementById(id), e=document.getElementById(id+'-e'); if(c) c.setAttribute('aria-invalid',String(!!t)); if(e) e.textContent=t||''; return !!t; };

    // Precarga: ?ambito=<slug> elige "¿Qué te trae?"; las señales marcadas en el inicio llegan a "Cuéntanos" y se borran del almacenamiento
    var amb=(location.search.match(/[?&]ambito=([\w-]+)/)||[])[1];
    if(amb) [].forEach.call(f.querySelectorAll('input[name="ambito"]'),function(r){ if(r.value===amb) r.checked=true; });
    var llegadas=null;
    try{ llegadas=JSON.parse(sessionStorage.getItem('ollin-senales')||'null'); sessionStorage.removeItem('ollin-senales'); }catch(_){}
    var msj=f.elements.mensaje;
    if(llegadas&&llegadas.length&&msj&&!msj.value){
      msj.value='Reconozco estas señales en mi negocio:\n'+llegadas.map(function(x){ return '- '+x; }).join('\n')+'\n\n';
    }
    f.addEventListener('change',function(e){ if(e.target.name==='ambito') marca('f-ambito',''); });

    f.addEventListener('submit',function(e){
      e.preventDefault();
      var elegido=f.querySelector('input[name="ambito"]:checked');
      var d={ambito:elegido?elegido.value:''};
      ['nombre','correo','negocio','mensaje'].forEach(function(n){ d[n]=f.elements[n].value.trim(); });
      var malas=[
        marca('f-ambito',d.ambito?'':MSJ.ambito),
        marca('f-nombre',d.nombre?'':MSJ.nombre),
        marca('f-correo',!d.correo?MSJ.correo:/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.correo)?'':MSJ.correoMal),
        marca('f-mensaje',d.mensaje?'':MSJ.mensaje)
      ];
      di(estado,''); di(err,'');
      if(malas.some(Boolean)){
        var primero=f.querySelector('[aria-invalid="true"]');
        if(primero&&primero.id==='f-ambito') f.querySelector('input[name="ambito"]').focus(); else if(primero) primero.focus();
        di(err,'Revisa los campos marcados.');
        return;
      }
      if(!destino){
        // Revisión en local sin FORMULARIO_URL: recorre el flujo hasta la confirmación sin enviar nada. Publicado así, avisa (el verificador no deja publicar sin destino).
        if(local){ evento('formulario_prueba_local','contacto'); location.href=GRACIAS; return; }
        di(err,MSJ.sinDestino); return;
      }
      var datos=new URLSearchParams(d);
      datos.append('sitio_web',f.elements.sitio_web.value); datos.append('tiempo',String(Math.round((Date.now()-t0)/1000))); datos.append('js','1');
      boton.disabled=true; di(estado,MSJ.enviando);
      fetch(destino,{method:'POST',body:datos}).then(function(r){ return r.json(); }).then(function(r){
        if(!r||!r.ok) throw new Error((r&&r.error)||'sin respuesta');
        evento('formulario_enviado','contacto');   // sólo el nombre del evento y su ubicación, nunca lo que se escribió
        location.href=GRACIAS;
      }).catch(function(){ di(err,MSJ.falla); di(estado,''); boton.disabled=false; });
    });
  }

})();
