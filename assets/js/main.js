(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const header = $('.site-header');
  const progress = $('#scroll-progress');
  const backToTop = $('#back-to-top');
  const cursor = $('#cursor-follower');

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Initialize the existing body.light theme before optional motion and cursor code.
  // Storage is best-effort: a restricted storage context must not disable the button.
  const themeToggle = $('#theme-toggle');
  const applyTheme = (theme) => {
    const isLight = theme === 'light';
    document.body.classList.toggle('light', isLight);
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      themeToggle.setAttribute('aria-pressed', String(isLight));
      themeToggle.textContent = isLight ? '◐' : '☼';
    }
  };
  let savedTheme = 'dark';
  try {
    const storedTheme = localStorage.getItem('zam-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') savedTheme = storedTheme;
  } catch (_) { /* The in-page toggle still works when storage is unavailable. */ }
  applyTheme(savedTheme);
  themeToggle?.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('light') ? 'dark' : 'light';
    applyTheme(nextTheme);
    try { localStorage.setItem('zam-theme', nextTheme); } catch (_) { /* Keep the current session usable. */ }
  });

  // Keep scroll work to one frame even during rapid touchpad or wheel input.
  let scrollQueued = false;
  const updateScroll = () => {
    const top = window.scrollY;
    const range = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${range > 0 ? (top / range) * 100 : 0}%`;
    if (header) header.classList.toggle('scrolled', top > 28);
    if (backToTop) backToTop.classList.toggle('visible', top > 550);
    scrollQueued = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateScroll);
    }
  }, { passive: true });
  updateScroll();

  // Reveal only as content approaches the viewport; reveal content immediately when motion is reduced.
  const revealItems = $$('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  // Mobile navigation exposes its state to assistive technology and closes after route selection.
  const menuToggle = $('.menu-toggle');
  const nav = $('#site-nav');
  if (menuToggle && nav) {
    const closeMenu = () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
      nav.classList.remove('open');
    };
    menuToggle.addEventListener('click', () => {
      const open = menuToggle.getAttribute('aria-expanded') !== 'true';
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      nav.classList.toggle('open', open);
    });
    nav.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 780) closeMenu(); });
  }

  // Active navigation follows the current file, including the default root URL.
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav-links a').forEach((link) => {
    const href = (link.getAttribute('href') || '').split('#')[0];
    link.classList.toggle('active', href === currentPage || (currentPage === '' && href === 'index.html'));
  });

  // One glowing desktop pointer with a contextual VIEW label on work cards.
  if (finePointer && !reducedMotion && cursor) {
    let cursorFrame = 0;
    let pointX = 0;
    let pointY = 0;
    window.addEventListener('pointermove', (event) => {
      pointX = event.clientX;
      pointY = event.clientY;
      if (cursorFrame) return;
      cursorFrame = requestAnimationFrame(() => {
        cursor.style.left = `${pointX}px`;
        cursor.style.top = `${pointY}px`;
        cursor.style.opacity = '1';
        cursorFrame = 0;
      });
    }, { passive: true });
    $$('a,button,[data-cursor-label]').forEach((item) => {
      item.addEventListener('pointerenter', () => {
        cursor.classList.add('is-hover');
        cursor.textContent = item.dataset.cursorLabel || '';
      });
      item.addEventListener('pointerleave', () => {
        cursor.classList.remove('is-hover');
        cursor.textContent = '';
      });
    });
  }

  // Gentle depth on project tiles, plus a small magnetic pull on primary actions.
  if (finePointer && !reducedMotion) {
    $$('[data-tilt],.portfolio-card,.service-card,.why-card,.pricing-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${y * -3}deg) rotateY(${x * 4}deg) translateY(-2px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
    $$('.btn,.btn-secondary').forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        button.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * 0.08}px,${(event.clientY - rect.top - rect.height / 2) * 0.12}px)`;
      });
      button.addEventListener('pointerleave', () => { button.style.transform = ''; });
    });
  }

  // Route transitions skip external links, modifiers, downloads, hashes and native contact links.
  if (!reducedMotion) {
    $$('a[href]').forEach((anchor) => anchor.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (anchor.target || anchor.hasAttribute('download')) return;
      const raw = anchor.getAttribute('href');
      if (!raw || raw.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(raw)) return;
      const destination = new URL(raw, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname && destination.hash) return;
      event.preventDefault();
      document.body.classList.add('is-transitioning');
      window.setTimeout(() => { window.location.assign(destination.href); }, 280);
    }));
  }

  // Keep the existing chat, pricing estimate, testimonial controls and portfolio filters working.
  const chatToggle = $('#chat-toggle');
  const chatPanel = $('#chat-panel');
  chatToggle?.addEventListener('click', () => chatPanel?.classList.toggle('open'));

  const contactForm = $('#contact-form');
  contactForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    const fields = new FormData(contactForm);
    const subject = `Project inquiry from ${fields.get('name') || 'website visitor'}`;
    const body = [...fields.entries()].map(([name, value]) => `${name}: ${value}`).join('\n');
    const mailto = `mailto:farazsid20@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  });

  const budget = $('#budget-range');
  const budgetOutput = $('#budget-output');
  const updateBudget = () => {
    if (!budget || !budgetOutput) return;
    budgetOutput.textContent = `₹${Number(budget.value).toLocaleString('en-IN')}+`;
  };
  budget?.addEventListener('input', updateBudget);
  updateBudget();

  const testimonialCards = $$('.testimonial-card');
  const previousTestimonial = $('#testimonial-prev');
  const nextTestimonial = $('#testimonial-next');
  if (testimonialCards.length && previousTestimonial && nextTestimonial) {
    let activeTestimonial = 0;
    const renderTestimonials = () => testimonialCards.forEach((card, index) => {
      const visible = index === activeTestimonial;
      card.hidden = !visible;
      card.setAttribute('aria-hidden', String(!visible));
    });
    previousTestimonial.addEventListener('click', () => {
      activeTestimonial = (activeTestimonial - 1 + testimonialCards.length) % testimonialCards.length;
      renderTestimonials();
    });
    nextTestimonial.addEventListener('click', () => {
      activeTestimonial = (activeTestimonial + 1) % testimonialCards.length;
      renderTestimonials();
    });
    renderTestimonials();
  }

  $$('.faq-item').forEach((item) => {
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-expanded', String(item.classList.contains('active')));
    const toggle = () => {
      const expanded = item.classList.toggle('active');
      item.setAttribute('aria-expanded', String(expanded));
    };
    item.addEventListener('click', (event) => { if (!event.target.closest('a,button')) toggle(); });
    item.addEventListener('keydown', (event) => {
      if (event.target !== item) return;
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
    });
  });

  $$('.filter-chip').forEach((chip) => chip.addEventListener('click', () => {
    $$('.filter-chip').forEach((item) => item.classList.toggle('active', item === chip));
    const filter = chip.dataset.filter;
    $$('.portfolio-card').forEach((card) => {
      const matches = filter === 'all' || card.dataset.category === filter;
      card.hidden = !matches;
      if (matches) card.classList.add('visible');
    });
  }));

  // Existing counters animate once when visible rather than consuming frames offscreen.
  const counters = $$('.stat-card .value[data-count]');
  const animateCounter = (counter) => {
    const target = Number(counter.dataset.count || 0);
    if (reducedMotion) { counter.textContent = `${target}${target === 100 ? '%' : ''}`; return; }
    const start = performance.now();
    const duration = 1100;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      counter.textContent = `${Math.round(target * eased)}${target === 100 ? '%' : ''}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window && !reducedMotion) {
    const counterObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    }), { threshold: .5 });
    counters.forEach((counter) => counterObserver.observe(counter));
  } else counters.forEach(animateCounter);

  const focusText = $('#hero-focus-text');
  if (focusText && !reducedMotion) {
    const focusLines = ['Powerful web applications', 'Future-ready digital solutions', 'Modern websites that convert'];
    let focusIndex = 0;
    window.setInterval(() => {
      if (document.hidden) return;
      focusText.style.opacity = '0';
      window.setTimeout(() => {
        focusIndex = (focusIndex + 1) % focusLines.length;
        focusText.textContent = focusLines[focusIndex];
        focusText.style.opacity = '1';
      }, 180);
    }, 3200);
  }

  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));

})();
