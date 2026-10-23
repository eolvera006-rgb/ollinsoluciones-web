(function(){
  var raiz=document.documentElement;
  // Fuera del dominio publicado (revisión en local) se ven los avisos de borrador
  var local=!/(^|\.)ollinsoluciones\.com$/.test(location.hostname);
  if(local) raiz.classList.add('local');

  // Portada: la foto entra hasta que está decodificada (así la animación no arranca con la imagen a medias); tope de 1.5 s
  var portada=document.querySelector('.portada'), fotoP=portada&&portada.querySelector('img');
  if(fotoP){
    var muestra=function(){ portada.classList.add('lista'); };
    var lista=fotoP.complete&&fotoP.naturalWidth?Promise.resolve():new Promise(function(r){ fotoP.addEventListener('load',r,{once:true}); fotoP.addEventListener('error',r,{once:true}); });
    lista.then(function(){ return fotoP.decode?fotoP.decode().catch(function(){}):null; }).then(muestra);
    setTimeout(muestra,1500);
  }

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
  // Ronda 6: con un panel abierto, si la página se desplaza más de 48 px el panel se cierra (la persona ya siguió leyendo)
  var y0=0;
  function alDesplazar(){ if(abierto&&Math.abs(window.scrollY-y0)>48) cierra(false); }
  window.addEventListener('scroll',alDesplazar,{passive:true});
  function abre(d){
    if(abierto===d) return cierra(true);
    cierra(false);
    abierto=d; d.b.setAttribute('aria-expanded','true'); d.p.classList.add('abierto');
    if(velo) velo.hidden=false;
    y0=window.scrollY;
    d.p.focus({preventScroll:true});
  }
  desps.forEach(function(d){
    if(!d.p) return;
    d.b.addEventListener('click',function(){ abre(d); });
    d.p.addEventListener('click',function(e){ if(e.target.closest('a')) cierra(false); });
    // salir del panel con Tab (o Mayús+Tab) lo cierra sin robar el foco
    d.p.addEventListener('focusout',function(e){ if(abierto===d&&e.relatedTarget&&!d.p.contains(e.relatedTarget)&&e.relatedTarget!==d.b) cierra(false); });
    // y salir hacia atrás desde su botón (Mayús+Tab más allá de la pestaña) también lo cierra
    d.b.addEventListener('focusout',function(e){ if(abierto===d&&e.relatedTarget&&!d.p.contains(e.relatedTarget)) cierra(false); });
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
    if(!raiz.classList.contains('ventana-abierta')) inerte(si);   // con la ventana del formulario abierta, la página sigue inerte
  }
  if(btn&&cajon){
    btn.addEventListener('click',function(){ cajonAbierto(btn.getAttribute('aria-expanded')!=='true'); });
    cajon.addEventListener('click',function(e){ if(e.target.closest('a')) cajonAbierto(false); });
    // Niveles (propuesta, como el menú de McKinsey): en teléfono el nivel ocupa el lugar de la lista y «‹ Volver» regresa;
    // en tableta el nivel se ve a la derecha de la lista
    var nivB=[].slice.call(cajon.querySelectorAll('.niv-b')), tableta=window.matchMedia('(min-width:640px)');
    var cierraNiveles=function(){ nivB.forEach(function(b){ b.setAttribute('aria-expanded','false'); document.getElementById(b.getAttribute('aria-controls')).hidden=true; }); cajon.classList.remove('en-nivel'); };
    var abreNivel=function(b){
      cierraNiveles();
      var n=document.getElementById(b.getAttribute('aria-controls'));
      b.setAttribute('aria-expanded','true'); n.hidden=false; cajon.classList.add('en-nivel');
      if(!tableta.matches){ cajon.scrollTop=0; n.focus({preventScroll:true}); }
    };
    nivB.forEach(function(b){ b.addEventListener('click',function(){ if(b.getAttribute('aria-expanded')==='true'&&!tableta.matches) cierraNiveles(); else abreNivel(b); }); });
    [].forEach.call(cajon.querySelectorAll('.niv-volver'),function(v){
      v.addEventListener('click',function(){ var b=cajon.querySelector('[aria-controls="'+v.closest('.nivel').id+'"]'); cierraNiveles(); b.focus(); });
    });
    // cada vez que el cajón se abre empieza en la lista (en tableta, con el primer nivel a la derecha)
    var actual=function(){ var r=location.pathname, id=/^\/(nosotros|como-trabajamos|contacto)\//.test(r)?'niv-nosotros':/^\/perspectivas\//.test(r)?'niv-perspectivas':'niv-ambitos';
      return cajon.querySelector('.niv-b[aria-controls="'+id+'"]')||nivB[0]; };
    btn.addEventListener('click',function(){ if(!cajon.hidden){ cierraNiveles(); if(tableta.matches&&nivB.length) abreNivel(actual()); } });
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

  // Pestañas de Nosotros en teléfono: la pestaña de la página actual queda a la vista, centrada (ronda 6)
  var tabA=document.querySelector('.subnav a[aria-current="page"]');
  if(tabA){
    var tabs=tabA.closest('ul');
    // con la lista desplazada, el borde izquierdo también se desvanece (sin él, la pestaña anterior se ve cortada)
    var bordes=function(){ tabs.classList.toggle('izq',tabs.scrollLeft>4); };
    if(tabs.scrollWidth>tabs.clientWidth) tabs.scrollLeft=tabA.offsetLeft-tabs.offsetLeft-(tabs.clientWidth-tabA.offsetWidth)/2;
    bordes(); tabs.addEventListener('scroll',bordes,{passive:true});
  }

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

  // Compartir un texto: la hoja de compartir del teléfono (WhatsApp, LinkedIn, correo…) o, donde no exista, copiar el enlace. Sin servicios de terceros.
  [].forEach.call(document.querySelectorAll('.compartir'),function(b){
    var ok=b.parentNode.querySelector('.compartir-ok'), url=b.getAttribute('data-url'), titulo=b.getAttribute('data-titulo');
    var copia=navigator.clipboard&&navigator.clipboard.writeText;
    if(!navigator.share&&!copia) return;
    b.hidden=false;
    b.addEventListener('click',function(){
      if(navigator.share){ navigator.share({title:titulo,url:url}).catch(function(){}); return; }
      navigator.clipboard.writeText(url).then(function(){ ok.textContent='Enlace copiado.'; },function(){ ok.textContent='No se pudo copiar. El enlace es '+url; });
    });
  });

  // Analítica: un solo escuchador delegado para lo marcado con data-evento. Sólo manda el nombre del evento y su ubicación;
  // nunca datos del formulario. Sin GA4_ID no existe gtag y no hace nada.
  function evento(nombre,ubicacion){
    if(typeof window.gtag==='function') window.gtag('event',nombre,{ubicacion:ubicacion,transport_type:'beacon'});
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('[data-evento]');
    if(a) evento(a.dataset.evento,a.dataset.ubicacion);
  });

  // Ventana del inicio: los enlaces a /contacto/ de la página y del pie abren el formulario en un recuadro sobre la página.
  // Sin JS siguen yendo a /contacto/; con Cmd/Ctrl o clic central se abren en otra pestaña, como cualquier enlace.
  // Ronda 6: las pestañas de Nosotros, «Siguiente» y los menús (paneles y cajón, con su botón Contacto) navegan a /contacto/ (es una página de Nosotros);
  // en teléfono (menos de 640 px) ningún enlace se intercepta, y por eso tampoco se anuncia como un cuadro de diálogo.
  // Mientras está abierta, la barra, la página y el pie quedan inertes: el foco no sale del recuadro (ni del reto de reCAPTCHA, que va al final del documento).
  var ventana=document.getElementById('ventana-contacto');
  var abreVentana=function(){}, cierraVentana=function(){};
  if(ventana){
    var caja=ventana.querySelector('.ventana-caja'), origen=null, desdeVelo=false;
    var tapadas=[document.querySelector('.saltar'),document.querySelector('header'),document.querySelector('main'),document.querySelector('footer')];
    abreVentana=function(a){
      origen=a; ventana.hidden=false; raiz.classList.add('ventana-abierta');
      tapadas.forEach(function(el){ if(el) el.inert=true; });
      caja.scrollTop=0; caja.focus({preventScroll:true});   // el foco entra al recuadro (lo anuncia el lector de pantalla) sin marcar ningún campo
      ventana.dispatchEvent(new Event('abierta'));
    };
    cierraVentana=function(){
      if(ventana.hidden) return;
      ventana.hidden=true; raiz.classList.remove('ventana-abierta');
      tapadas.forEach(function(el){ if(el) el.inert=false; });
      if(origen) origen.focus({preventScroll:true});
    };
    // propuesta: lo que la persona escribe en el asunto manda; sólo se reemplaza el asunto que puso un enlace
    var asV=ventana.querySelector('[name="asunto"]');
    if(asV) asV.addEventListener('input',function(e){ if(e.isTrusted) delete asV.dataset.auto; });
    var telefono=window.matchMedia('(max-width:639px)');
    var abren=[].filter.call(document.querySelectorAll('main a[href^="/contacto/"], footer a[href^="/contacto/"]'),function(a){
      return !/^\/contacto\/gracias/.test(a.getAttribute('href'))&&!a.closest('.subnav,.siguiente,.panel');
    });
    var popup=function(){ abren.forEach(function(a){ if(telefono.matches) a.removeAttribute('aria-haspopup'); else a.setAttribute('aria-haspopup','dialog'); }); };
    popup();
    if(telefono.addEventListener) telefono.addEventListener('change',popup); else telefono.addListener(popup);
    abren.forEach(function(a){
      a.addEventListener('click',function(e){
        if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button) return;
        if(telefono.matches) return;
        e.preventDefault();
        // propuesta: el ámbito del enlace (?ambito=…) escribe el asunto, si la persona no escribió otro
        var fv=ventana.querySelector('form'), am=(a.getAttribute('href').match(/[?&]ambito=([\w-]+)/)||[])[1], noms={};
        try{ noms=JSON.parse(fv.dataset.ambitos||'{}'); }catch(_){}
        var as=fv.elements.asunto;
        if(as&&(!as.value||as.dataset.auto)){ as.value=am&&noms[am]?noms[am]:''; if(as.value) as.dataset.auto='1'; else delete as.dataset.auto; as.dispatchEvent(new Event('input')); }
        // señales marcadas en el diagnóstico del inicio: pasan al mensaje
        var marcadas=[].map.call(document.querySelectorAll('#diag-senales input:checked'),function(c){ return c.value; });
        try{ sessionStorage.removeItem('ollin-senales'); }catch(_){}
        var m=ventana.querySelector('textarea[name="mensaje"]');
        if(a.id==='senales-ir'&&marcadas.length&&m&&!m.value) m.value='Reconozco estas señales en mi negocio:\n'+marcadas.map(function(x){ return '- '+x; }).join('\n')+'\n\n';
        abreVentana(a);
      });
    });
    // cierra con la cruz, con Esc o con un clic en el velo (sólo si el clic empezó ahí: seleccionar texto y soltar fuera no la cierra)
    ventana.addEventListener('pointerdown',function(e){ desdeVelo=e.target===ventana; });
    ventana.addEventListener('click',function(e){ if((e.target===ventana&&desdeVelo)||e.target.closest('[data-cierra]')) cierraVentana(); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&!ventana.hidden) cierraVentana(); });
  }

  // Formulario de contacto (en /contacto/ y en la ventana del inicio). Publicado, lo manda la aplicación web de Apps Script (Google Workspace)
  // al correo de la empresa después de validar reCAPTCHA, y lleva a /contacto/gracias/.
  var f=document.getElementById('f-forma');
  if(f){
    f.noValidate=true; f.elements.js.value='1';
    var destino=f.dataset.destino, t0=Date.now();
    // Validación de seguridad: reCAPTCHA v2 («No soy un robot»). En local, sin clave, se usa la clave de prueba pública de Google (siempre pasa y avisa que es de prueba).
    var clave=f.dataset.captcha||(local?'6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI':'');
    var err=document.getElementById('f-error'), estado=document.getElementById('f-estado'), boton=f.querySelector('button[type="submit"]');
    var GRACIAS='/contacto/gracias/', CORREO_RE=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var MSJ={
      nombre:'Escribe tu nombre.',
      correo:'Escribe tu correo.',
      correoMal:'Revisa tu correo: debe tener la forma nombre@dominio.com.',
      asunto:'Escribe el asunto.',
      captcha:'Marca la casilla «No soy un robot».',
      enviando:'Enviando…',
      falla:'No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos.',
      sinDestino:'El formulario todavía no está conectado. Inténtalo de nuevo más tarde.'
    };
    // vaciar y llenar en el siguiente cuadro: así role=status vuelve a anunciar aunque el texto sea el mismo
    var di=function(el,t){ el.__t=t; el.textContent=''; if(t) requestAnimationFrame(function(){ if(el.__t===t) el.textContent=t; }); };
    var marca=function(id,t){ var c=document.getElementById(id), e=document.getElementById(id+'-e'); if(c) c.setAttribute('aria-invalid',String(!!t)); if(e) e.textContent=t||''; return !!t; };
    var revisa=function(n){
      var v=f.elements[n].value.trim();
      return n==='correo'?(!v?MSJ.correo:CORREO_RE.test(v)?'':MSJ.correoMal):(v?'':MSJ[n]);
    };
    var OBLIGATORIOS=['nombre','correo','asunto'];

    var widget=null, cargado=false;
    var token=function(){ return clave&&widget!==null&&window.grecaptcha?window.grecaptcha.getResponse(widget):''; };
    // Enviar se ve en gris mientras falte algo obligatorio
    var listo=function(){ boton.classList.toggle('incompleto',OBLIGATORIOS.some(revisa)||(!!clave&&!token())); };
    // reCAPTCHA se carga sólo cuando el formulario está por verse: el resto del sitio no se conecta a Google
    function cargaCaptcha(){
      if(cargado||!clave) return; cargado=true;
      window.__ollinCaptcha=function(){
        widget=window.grecaptcha.render('f-captcha',{sitekey:clave,theme:'light',
          callback:function(){ marca('f-captcha',''); listo(); }, 'expired-callback':listo, 'error-callback':listo});
      };
      var sc=document.createElement('script'); sc.async=true;
      sc.src='https://www.google.com/recaptcha/api.js?onload=__ollinCaptcha&render=explicit&hl=es-419';
      document.head.appendChild(sc);
    }
    if(clave){
      if(ventana&&ventana.contains(f)) ventana.addEventListener('abierta',cargaCaptcha);
      else if('IntersectionObserver' in window){ var vi=new IntersectionObserver(function(es){ if(es[0].isIntersecting){ cargaCaptcha(); vi.disconnect(); } },{rootMargin:'300px 0px'}); vi.observe(f); }
      else cargaCaptcha();
      f.addEventListener('focusin',cargaCaptcha);
    }

    // Errores por campo, como en la referencia: al salir de un campo obligatorio se revisa; al corregirlo, el error se quita en cuanto escribe
    OBLIGATORIOS.forEach(function(n){
      var el=f.elements[n];
      el.addEventListener('blur',function(){ if(!(ventana&&ventana.hidden&&ventana.contains(f))) marca('f-'+n,revisa(n)); });
      el.addEventListener('input',function(){ if(el.getAttribute('aria-invalid')==='true') marca('f-'+n,revisa(n)); listo(); });
    });

    // Precarga: ?ambito=<slug> llena el asunto con el nombre del ámbito; las señales marcadas en el inicio llegan al mensaje y se borran del almacenamiento
    var amb=(location.search.match(/[?&]ambito=([\w-]+)/)||[])[1], nombres={};
    try{ nombres=JSON.parse(f.dataset.ambitos||'{}'); }catch(_){}
    if(amb&&nombres[amb]&&!f.elements.asunto.value) f.elements.asunto.value=nombres[amb];
    var llegadas=null;
    try{ llegadas=JSON.parse(sessionStorage.getItem('ollin-senales')||'null'); sessionStorage.removeItem('ollin-senales'); }catch(_){}
    var msj=f.elements.mensaje;
    if(llegadas&&llegadas.length&&msj&&!msj.value){
      msj.value='Reconozco estas señales en mi negocio:\n'+llegadas.map(function(x){ return '- '+x; }).join('\n')+'\n\n';
    }
    listo();

    f.addEventListener('submit',function(e){
      e.preventDefault();
      var d={};
      ['nombre','correo','puesto','negocio','asunto','mensaje'].forEach(function(n){ d[n]=f.elements[n].value.trim(); });
      var t=token();
      var malas=OBLIGATORIOS.map(function(n){ return marca('f-'+n,revisa(n)); });
      if(clave) malas.push(marca('f-captcha',t?'':MSJ.captcha));
      di(estado,''); di(err,'');
      if(malas.some(Boolean)){
        var primero=f.querySelector('[aria-invalid="true"]');
        if(primero&&primero.id!=='f-captcha') primero.focus(); else if(primero) primero.scrollIntoView({block:'center',behavior:'smooth'});
        return;
      }
      if(!destino){
        // Revisión en local sin FORMULARIO_URL: recorre el flujo hasta la confirmación sin enviar nada. Publicado así, avisa (el verificador no deja publicar sin destino).
        if(local){ evento('formulario_prueba_local','contacto'); location.href=GRACIAS; return; }
        di(err,MSJ.sinDestino); return;
      }
      var datos=new URLSearchParams(d);
      datos.append('g-recaptcha-response',t); datos.append('sitio_web',f.elements.sitio_web.value);
      datos.append('tiempo',String(Math.round((Date.now()-t0)/1000))); datos.append('js','1');
      boton.disabled=true; di(estado,MSJ.enviando);
      fetch(destino,{method:'POST',body:datos}).then(function(r){ return r.json(); }).then(function(r){
        if(!r||!r.ok) throw new Error((r&&r.error)||'sin respuesta');
        evento('formulario_enviado','contacto');   // sólo el nombre del evento y su ubicación, nunca lo que se escribió
        location.href=GRACIAS;
      }).catch(function(){
        di(err,MSJ.falla); di(estado,''); boton.disabled=false;
        if(widget!==null&&window.grecaptcha) window.grecaptcha.reset(widget);   // el token ya se usó: hay que marcar la casilla otra vez
        listo();
      });
    });
  }

})();
