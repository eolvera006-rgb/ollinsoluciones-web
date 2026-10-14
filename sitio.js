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

  // Abre el correo ya armado (modo local, sin FORMULARIO_URL). Pasa por aquí para que las pruebas puedan sustituirla
  // (window.__abrirDestino) sin abrir nada de verdad.
  function abrirDestino(url){
    if(typeof window.__abrirDestino==='function') return window.__abrirDestino(url);
    location.href=url;
  }

  // Formulario (sólo en /contacto/): sin JS queda oculto y sólo se ven los enlaces directos.
  // Publicado, lo manda la aplicación web de Apps Script (Google Workspace) a proyectos@ después de validar reCAPTCHA.
  var f=document.getElementById('f-forma');
  if(f){
    f.hidden=false;
    var CORREO='proyectos@ollinsoluciones.com', destino=f.dataset.destino, clave=f.dataset.captcha;
    var err=document.getElementById('f-error'), estado=document.getElementById('f-estado'), boton=f.querySelector('button[type="submit"]');
    var MSJ={
      nombre:'Escribe tu nombre.',
      correo:'Escribe tu correo.',
      correoMal:'Revisa tu correo: debe tener la forma nombre@dominio.com.',
      asunto:'Escribe el asunto.',
      captcha:'Marca la casilla «No soy un robot».',
      enviando:'Enviando…',
      ok:'Gracias. Recibimos tu mensaje y te respondemos el mismo día, de lunes a sábado, de 9:00 a 21:00 h, para acordar la primera reunión.',
      falla:'No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos o escríbenos a '+CORREO+'.',
      local:'Para completar el envío, confirma el mensaje en tu programa de correo. Te respondemos el mismo día, de lunes a sábado, de 9:00 a 21:00 h.'
    };
    // vaciar y llenar en el siguiente cuadro: así role=status vuelve a anunciar aunque el texto sea el mismo
    // (el último texto pedido manda: un cuadro pendiente no pisa un mensaje más nuevo)
    var di=function(el,t){ el.__t=t; el.textContent=''; if(t) requestAnimationFrame(function(){ if(el.__t===t) el.textContent=t; }); };
    var marca=function(id,t){ var c=document.getElementById(id), e=document.getElementById(id+'-e'); if(c&&c.setAttribute) c.setAttribute('aria-invalid',String(!!t)); if(e) e.textContent=t||''; return !!t; };

    // reCAPTCHA se carga sólo cuando el formulario está por verse o alguien lo usa: el resto del sitio no se conecta a Google.
    var widget=null, cargado=false;
    function cargaCaptcha(){
      if(cargado||!clave) return; cargado=true;
      window.__ollinCaptcha=function(){ widget=window.grecaptcha.render('f-captcha',{sitekey:clave,theme:'dark'}); };
      var sc=document.createElement('script'); sc.async=true;
      sc.src='https://www.google.com/recaptcha/api.js?onload=__ollinCaptcha&render=explicit&hl=es-419';
      document.head.appendChild(sc);
    }
    if(clave){
      f.addEventListener('focusin',cargaCaptcha);
      if('IntersectionObserver' in window){ var vi=new IntersectionObserver(function(es){ if(es[0].isIntersecting){ cargaCaptcha(); vi.disconnect(); } },{rootMargin:'300px 0px'}); vi.observe(f); }
      else cargaCaptcha();
    }

    f.addEventListener('submit',function(e){
      e.preventDefault();
      var d={};
      ['nombre','correo','puesto','negocio','asunto','mensaje'].forEach(function(n){ d[n]=f.elements[n].value.trim(); });
      var token=clave&&widget!==null&&window.grecaptcha?window.grecaptcha.getResponse(widget):'';
      var malas=[
        marca('f-nombre',d.nombre?'':MSJ.nombre),
        marca('f-correo',!d.correo?MSJ.correo:/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.correo)?'':MSJ.correoMal),
        marca('f-asunto',d.asunto?'':MSJ.asunto),
        clave?marca('f-captcha',token?'':MSJ.captcha):false
      ];
      di(estado,''); di(err,'');
      if(malas.some(Boolean)){
        var primero=f.querySelector('[aria-invalid="true"]');
        if(primero&&primero.id!=='f-captcha') primero.focus(); else if(primero) primero.scrollIntoView({block:'center'});
        di(err,'Revisa los campos marcados.');
        return;
      }
      var cuerpo='Nombre: '+d.nombre+'\nCorreo: '+d.correo+(d.puesto?'\nPuesto: '+d.puesto:'')+(d.negocio?'\nNegocio: '+d.negocio:'')+(d.mensaje?'\n\n'+d.mensaje:'');
      if(!destino){   // modo local: sin aplicación web, se arma el correo
        evento('formulario_correo','contacto');
        abrirDestino('mailto:'+CORREO+'?subject='+encodeURIComponent(d.asunto)+'&body='+encodeURIComponent(cuerpo));
        di(estado,MSJ.local); return;
      }
      var datos=new URLSearchParams(d); datos.append('g-recaptcha-response',token); datos.append('sitio_web',f.elements.sitio_web.value);
      boton.disabled=true; di(estado,MSJ.enviando);
      fetch(destino,{method:'POST',body:datos}).then(function(r){ return r.json(); }).then(function(r){
        if(!r||!r.ok) throw new Error((r&&r.error)||'sin respuesta');
        evento('formulario_enviado','contacto');   // sólo el nombre del evento y su ubicación, nunca lo que se escribió
        f.reset(); di(estado,MSJ.ok);
      }).catch(function(){ di(err,MSJ.falla); di(estado,''); })
        .then(function(){ boton.disabled=false; if(widget!==null&&window.grecaptcha) window.grecaptcha.reset(widget); });
    });
  }

  raiz.classList.add('listo');
})();
