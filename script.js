/* =============================================
   ANIMAÇÕES DE ENTRADA — IntersectionObserver
   ============================================= */
(function () {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

  document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
    observer.observe(el);
  });
})();


/* =============================================
   CONTADOR ANIMADO — "10 anos em 1"
   ============================================= */
(function () {
  function animateCount(el, target, duration) {
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    }

    requestAnimationFrame(step);
  }

  var counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = '1';
        var target = parseInt(entry.target.dataset.target, 10);
        /* "1" anima mais rápido para parecer resultado imediato */
        var duration = target === 1 ? 900 : 1800;
        animateCount(entry.target, target, duration);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-target]').forEach(function (el) {
    counterObserver.observe(el);
  });
})();


/* =============================================
   CARROSSEL INFINITO DE DEPOIMENTOS
   ============================================= */
(function () {
  var carousel = document.getElementById('depoimentos-carousel');
  if (!carousel) return;

  var track        = carousel.querySelector('.carousel-track');
  var realSlides   = Array.from(carousel.querySelectorAll('.carousel-slide'));
  var prevBtn      = carousel.querySelector('.carousel-btn--prev');
  var nextBtn      = carousel.querySelector('.carousel-btn--next');
  var dotsWrap     = carousel.closest('.carousel-wrapper').querySelector('.carousel-dots');

  var count        = realSlides.length; // 7
  var current      = 1;                 // 1 = primeiro slide real (após clone do último)
  var transitioning = false;
  var DURATION     = 460;               // ms

  /* ---- Clona primeiro e último para loop infinito ---- */
  var firstClone = realSlides[0].cloneNode(true);
  var lastClone  = realSlides[count - 1].cloneNode(true);
  firstClone.setAttribute('aria-hidden', 'true');
  lastClone.setAttribute('aria-hidden', 'true');
  track.appendChild(firstClone);
  track.prepend(lastClone);

  var allSlides = Array.from(track.querySelectorAll('.carousel-slide'));
  var total     = allSlides.length; // count + 2

  /* ---- Ajusta larguras (chamado no init e no resize) ---- */
  function setWidths() {
    var w = carousel.offsetWidth;
    track.style.width     = (total * w) + 'px';
    allSlides.forEach(function (s) { s.style.width = w + 'px'; });
    moveTo(current, false);
  }

  /* ---- Move o track ---- */
  function moveTo(index, animate) {
    track.style.transition = animate === false
      ? 'none'
      : 'transform ' + DURATION + 'ms ease';
    track.style.transform  = 'translateX(-' + (index * carousel.offsetWidth) + 'px)';
    current = index;
    updateDots();
    pauseOtherVideos();
  }

  /* ---- Salta silenciosamente ao bater nos clones ---- */
  track.addEventListener('transitionend', function () {
    transitioning = false;
    if (current === 0) {
      moveTo(count, false);           // estava no clone do último → pula para o real
    } else if (current === total - 1) {
      moveTo(1, false);               // estava no clone do primeiro → pula para o real
    }
  });

  /* ---- Dots ---- */
  var dots = [];
  realSlides.forEach(function (_, i) {
    var btn = document.createElement('button');
    btn.className = 'carousel-dot';
    btn.setAttribute('aria-label', 'Depoimento ' + (i + 1));
    btn.addEventListener('click', function () { goTo(i + 1); });
    dotsWrap.appendChild(btn);
    dots.push(btn);
  });

  function updateDots() {
    var real = current - 1;
    if (real < 0)      real = count - 1;
    if (real >= count) real = 0;
    dots.forEach(function (d, i) {
      d.classList.toggle('is-active', i === real);
    });
  }

  /* ---- Pausa vídeos fora do slide ativo ---- */
  function pauseOtherVideos() {
    allSlides.forEach(function (s, i) {
      var vid = s.querySelector('video');
      if (vid && i !== current) vid.pause();
    });
  }

  /* ---- Navegar ---- */
  function goTo(index) {
    if (transitioning) return;
    transitioning = true;
    moveTo(index, true);
  }

  prevBtn.addEventListener('click', function () { goTo(current - 1); });
  nextBtn.addEventListener('click', function () { goTo(current + 1); });

  /* ---- Swipe (touch) ---- */
  var touchX = 0;
  var dragX  = 0;

  track.addEventListener('touchstart', function (e) {
    touchX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchmove', function (e) {
    dragX = e.touches[0].clientX - touchX;
  }, { passive: true });

  track.addEventListener('touchend', function () {
    if (Math.abs(dragX) > 48) {
      goTo(dragX < 0 ? current + 1 : current - 1);
    }
    dragX = 0;
  });

  /* ---- Init ---- */
  setWidths();
  updateDots();
  window.addEventListener('resize', setWidths);
})();


/* =============================================
   SELETOR DE TEMA — somente em modo ?preview
   Produção (sem ?preview) usa o tema definido no <html>: grafite.
   ============================================= */
(function () {
  /* aceita ?preview (servidor) ou #preview (arquivo local file://) */
  var isPreview = (location.search + location.hash).indexOf('preview') !== -1;
  if (!isPreview) return; // visitante real: nada acontece

  var themes = [
    { id: '',      label: 'Ivory' },
    { id: 'split', label: 'Grafite' },
    { id: 'white', label: 'Branco' }
  ];

  /* restaura escolha da sessão de preview;
     na 1ª vez, parte do tema de produção definido no <html> */
  var saved = localStorage.getItem('mr-theme');
  if (saved === null) saved = document.documentElement.getAttribute('data-theme') || '';
  applyTheme(saved);

  var bar = document.createElement('div');
  bar.className = 'theme-switch';

  themes.forEach(function (t) {
    var btn = document.createElement('button');
    btn.textContent = t.label;
    btn.dataset.theme = t.id;
    btn.addEventListener('click', function () {
      applyTheme(t.id);
      localStorage.setItem('mr-theme', t.id);
      updateActive();
    });
    bar.appendChild(btn);
  });

  document.body.appendChild(bar);
  updateActive();

  function applyTheme(id) {
    if (id) {
      document.documentElement.setAttribute('data-theme', id);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  function updateActive() {
    var current = document.documentElement.getAttribute('data-theme') || '';
    bar.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.theme === current);
    });
  }
})();


/* =============================================
   FAQ — ACORDEÃO
   ============================================= */
(function () {
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item    = btn.closest('.faq-item');
      var isOpen  = item.classList.contains('is-open');
      var answer  = item.querySelector('.faq-answer');

      /* fecha todos os outros */
      document.querySelectorAll('.faq-item.is-open').forEach(function (openItem) {
        openItem.classList.remove('is-open');
        openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      /* abre o clicado (se estava fechado) */
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        answer.removeAttribute('hidden');
      }
    });
  });
})();
