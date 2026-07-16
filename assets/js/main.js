// Premium interactive site behavior
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const loadingScreen = document.getElementById('loading-screen');
const cursorFollower = document.getElementById('cursor-follower');
const scrollProgress = document.getElementById('scroll-progress');
const backToTop = document.getElementById('back-to-top');
const themeToggle = document.getElementById('theme-toggle');
const chatToggle = document.getElementById('chat-toggle');
const chatPanel = document.getElementById('chat-panel');
const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
const yearNode = document.getElementById('year');
const heroTitle = document.querySelector('.hero-copy h1');
const heroSubtitle = document.querySelector('.hero-copy p');

if (yearNode) yearNode.textContent = new Date().getFullYear();

const particles = () => {
  const layer = document.querySelector('.particle-layer');
  if (!layer || prefersReducedMotion) return;
  for (let i = 0; i < 24; i += 1) {
    const p = document.createElement('span');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 4}s`;
    p.style.opacity = String(0.25 + Math.random() * 0.65);
    layer.appendChild(p);
  }
};

const revealOnScroll = () => {
  document.querySelectorAll('.reveal').forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight - 120) item.classList.add('visible');
  });
};

const updateScrollProgress = () => {
  const scrollTop = window.scrollY;
  const height = document.documentElement.scrollHeight - window.innerHeight;
  const progress = height > 0 ? (scrollTop / height) * 100 : 0;
  if (scrollProgress) scrollProgress.style.width = `${progress}%`;
  if (backToTop) {
    backToTop.classList.toggle('visible', scrollTop > 600);
  }
};

const enableCursorGlow = () => {
  if (prefersReducedMotion || !cursorFollower) return;
  window.addEventListener('mousemove', (event) => {
    cursorFollower.style.left = `${event.clientX}px`;
    cursorFollower.style.top = `${event.clientY}px`;
  });
  document.querySelectorAll('a, button, .service-card, .portfolio-card, .pricing-card, .faq-item, .tech-item').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cursorFollower.style.width = '72px';
      cursorFollower.style.height = '72px';
      cursorFollower.style.borderColor = 'rgba(6,182,212,0.5)';
    });
    el.addEventListener('mouseleave', () => {
      cursorFollower.style.width = '40px';
      cursorFollower.style.height = '40px';
      cursorFollower.style.borderColor = 'rgba(255,255,255,0.2)';
    });
  });
};

const setActiveNav = () => {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const matchesIndex = path === '' || path === 'index.html' ? href.includes('index.html') : false;
    const isActive = href.includes(path) || matchesIndex;
    link.classList.toggle('active', isActive);
  });
};

const applyTheme = (theme) => {
  document.body.classList.toggle('light', theme === 'light');
  if (themeToggle) themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
};

const initTheme = () => {
  const saved = localStorage.getItem('zam-theme');
  if (saved) applyTheme(saved);
  else if (window.matchMedia('(prefers-color-scheme: light)').matches) applyTheme('light');
  else applyTheme('dark');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = document.body.classList.contains('light') ? 'dark' : 'light';
      localStorage.setItem('zam-theme', next);
      applyTheme(next);
    });
  }
};

const initChat = () => {
  if (chatToggle && chatPanel) {
    chatToggle.addEventListener('click', () => {
      chatPanel.classList.toggle('open');
    });
  }
};

const initPricingCalculator = () => {
  const range = document.getElementById('budget-range');
  const output = document.getElementById('budget-output');
  if (!range || !output) return;
  const update = () => {
    const value = Number(range.value);
    output.textContent = `₹${value.toLocaleString('en-IN')}+`;
  };
  range.addEventListener('input', update);
  update();
};

const initTestimonials = () => {
  const slides = Array.from(document.querySelectorAll('.testimonial-card'));
  const prev = document.getElementById('testimonial-prev');
  const next = document.getElementById('testimonial-next');
  if (!slides.length || !prev || !next) return;
  let index = 0;
  const render = () => {
    slides.forEach((slide, slideIndex) => {
      slide.style.display = slideIndex === index ? 'block' : 'none';
    });
  };
  prev.addEventListener('click', () => {
    index = (index - 1 + slides.length) % slides.length;
    render();
  });
  next.addEventListener('click', () => {
    index = (index + 1) % slides.length;
    render();
  });
  render();
};

const initFaq = () => {
  document.querySelectorAll('.faq-item').forEach((item) => {
    item.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });
};

const initCounters = () => {
  document.querySelectorAll('.stat-card .value').forEach((counter) => {
    const target = Number(counter.dataset.count || 0);
    let start = 0;
    const duration = 1400;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = target / steps;
    const tick = () => {
      start += increment;
      if (start < target) {
        counter.textContent = `${Math.round(start)}${target === 100 ? '%' : ''}`;
        requestAnimationFrame(tick);
      } else {
        counter.textContent = `${target}${target === 100 ? '%' : ''}`;
      }
    };
    tick();
  });
};

const initFilters = () => {
  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;
      document.querySelectorAll('.portfolio-card').forEach((card) => {
        const matches = filter === 'all' || card.dataset.category === filter;
        card.style.display = matches ? 'block' : 'none';
      });
    });
  });
};

const initPageTransition = () => {
  document.querySelectorAll('a[href]').forEach((anchor) => {
    const target = anchor.getAttribute('href');
    if (!target || target.startsWith('#') || target.startsWith('mailto:') || target.startsWith('tel:')) return;
    anchor.addEventListener('click', (event) => {
      const isExternal = target.startsWith('http');
      if (isExternal) return;
      event.preventDefault();
      document.body.classList.add('is-transitioning');
      setTimeout(() => {
        window.location.href = target;
      }, 450);
    });
  });
};

window.addEventListener('scroll', () => {
  updateScrollProgress();
  revealOnScroll();
});

window.addEventListener('load', () => {
  particles();
  revealOnScroll();
  updateScrollProgress();
  initCounters();
  if (loadingScreen) {
    setTimeout(() => loadingScreen.classList.add('hidden'), 850);
  }
});

setActiveNav();
initTheme();
enableCursorGlow();
initChat();
initPricingCalculator();
initTestimonials();
initFaq();
initFilters();
initPageTransition();

const heroText = ['Professional Websites', 'Powerful Web Applications', 'Future-Ready Digital Solutions'];
let heroIndex = 0;
if (heroTitle && heroSubtitle) {
  const typeText = () => {
    const current = heroText[heroIndex];
    heroSubtitle.innerHTML = `<span class="typing">${current}</span>`;
    heroIndex = (heroIndex + 1) % heroText.length;
  };
  typeText();
  setInterval(typeText, 2200);
}

backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
