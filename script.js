/* ================================================================
   Lumen & Loom — Scroll-driven Experience
   Lenis smooth scroll + GSAP ScrollTrigger + custom cursor
   ================================================================ */

(function () {
  'use strict';

  /* ---------- 0. Wait for libs ---------- */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(init);

  function init() {
    initLoader();
    initCursor();
    initNav();
    initLenis();
    initHero();
    initReveal();
    initMarquee();
    initCounters();
    initParallax();
    initSplitTitle();
    initPinnedSections();
    initCart();         // Cart store + drawer (mounts on every page)
    initQuickAdd();     // Wires existing .quick-add buttons to Cart.add
    initCategoryRouter();
  }

  /* ================================================================
     1. Loader
     ================================================================ */
  function initLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    window.addEventListener('load', () => {
      setTimeout(() => loader.classList.add('done'), 900);
    });
    // Failsafe: hide after 3s even if window.load is slow
    setTimeout(() => loader.classList.add('done'), 3000);
  }

  /* ================================================================
     2. Custom Cursor
     ================================================================ */
  function initCursor() {
    if (window.matchMedia('(hover: none)').matches) return;
    const cursor = document.getElementById('cursor');
    if (!cursor) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX;
    let curY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function tick() {
      curX += (mouseX - curX) * 0.18;
      curY += (mouseY - curY) * 0.18;
      cursor.style.transform = `translate3d(${curX}px, ${curY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    }
    tick();

    // Hover state
    document.querySelectorAll('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
    document.querySelectorAll('[data-cursor="view"]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('view');
        cursor.classList.remove('hover');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('view');
      });
    });

    // Hide on leave
    document.addEventListener('mouseleave', () => (cursor.style.opacity = '0'));
    document.addEventListener('mouseenter', () => (cursor.style.opacity = '1'));
  }

  /* ================================================================
     3. Nav — scroll state
     ================================================================ */
  function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 60) {
        nav.classList.add('scrolled');
        document.body.classList.add('nav-scrolled');
      } else {
        nav.classList.remove('scrolled');
        document.body.classList.remove('nav-scrolled');
      }
    }, { passive: true });
  }

  /* ================================================================
     4. Lenis smooth scroll
     ================================================================ */
  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Bridge Lenis with GSAP ScrollTrigger
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    // Anchor links via Lenis
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length <= 1) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80, duration: 1.4 });
      });
    });
  }

  /* ================================================================
     5. Hero — entrance animation
     ================================================================ */
  function initHero() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    // Hero title line mask reveal
    const lines = document.querySelectorAll('.hero-title .line-mask .line');
    gsap.to(lines, {
      y: 0,
      duration: 1.4,
      ease: 'expo.out',
      stagger: 0.12,
      delay: 1.0,
    });

    // Hero top / sub / actions fade
    const heroTag = document.querySelector('.hero-tag');
    const heroScroll = document.querySelector('.hero-scroll');
    const heroSub = document.querySelector('.hero-sub');
    const heroActions = document.querySelector('.hero-actions');
    const heroMeta = document.querySelector('.hero-meta');

    [heroTag, heroScroll, heroSub, heroActions].forEach((el, i) => {
      if (!el) return;
      gsap.from(el, {
        y: 24,
        opacity: 0,
        duration: 1.0,
        ease: 'expo.out',
        delay: 1.4 + i * 0.08,
      });
    });

    // Hero background parallax
    const heroBg = document.querySelector('.hero-bg');
    if (heroBg) {
      gsap.to(heroBg, {
        y: '20%',
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }
  }

  /* ================================================================
     6. Generic reveal — fade up
     ================================================================ */
  function initReveal() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const elements = document.querySelectorAll('[data-anim="fade-up"]');
    elements.forEach((el) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      });
    });
  }

  /* ================================================================
     7. Marquee — speed control with scroll
     ================================================================ */
  function initMarquee() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    document.querySelectorAll('.marquee-track, .hero-marquee-track').forEach((track) => {
      const tween = gsap.to(track, {
        xPercent: -50,
        duration: 30,
        ease: 'none',
        repeat: -1,
      });
      ScrollTrigger.create({
        trigger: track,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          if (velocity > 200) tween.timeScale(2.5);
          else if (velocity < -200) tween.timeScale(0.4);
          else tween.timeScale(1);
        },
      });
    });
  }

  /* ================================================================
     8. Counters — stat numbers
     ================================================================ */
  function initCounters() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const counters = document.querySelectorAll('[data-count]');
    counters.forEach((el) => {
      const target = parseInt(el.getAttribute('data-count'), 10);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 2.2,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        onUpdate: () => {
          if (target >= 100) el.textContent = Math.round(obj.v);
          else el.textContent = Math.round(obj.v);
        },
      });
    });
  }

  /* ================================================================
     9. Parallax — image slow movement
     ================================================================ */
  function initParallax() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    // Story & Material & Featured images — gentle parallax
    const parallaxImgs = [
      { sel: '.story-img img', factor: 0.18 },
      { sel: '.material-img img', factor: 0.16 },
      { sel: '.featured-img img', factor: 0.08 },
    ];
    parallaxImgs.forEach(({ sel, factor }) => {
      document.querySelectorAll(sel).forEach((img) => {
        gsap.to(img, {
          yPercent: -15 * factor * 10,
          ease: 'none',
          scrollTrigger: {
            trigger: img.closest('section, article') || img,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
    });

    // Lifestyle gallery parallax
    document.querySelectorAll('.lifestyle-img').forEach((img, i) => {
      gsap.fromTo(img,
        { y: 60 },
        {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: '.lifestyle',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    });
  }

  /* ================================================================
     10. Section titles — split into spans
     ================================================================ */
  function initSplitTitle() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    document.querySelectorAll('.section-title').forEach((title) => {
      // Skip ones already wrapped
      if (title.querySelector('.line-mask')) return;

      // Wrap whole text in a single line for now (clamped)
      // For a softer effect, animate the title with clip-path
      gsap.fromTo(title,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: title,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
  }

  /* ================================================================
     11. Pinned sections — sticky feel
     ================================================================ */
  function initPinnedSections() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    // Story — sticky image, text scrolls over
    const storySection = document.querySelector('.story');
    if (storySection) {
      const right = storySection.querySelector('.story-right');
      if (right) {
        ScrollTrigger.create({
          trigger: storySection,
          start: 'top top+=100',
          end: 'bottom bottom',
          pin: false, // CSS sticky already handles it
          onUpdate: (self) => {
            // Subtle scale on the image
            const img = storySection.querySelector('.story-img img');
            if (img) gsap.to(img, { scale: 1 + (1 - self.progress) * 0.12, duration: 0.4, overwrite: true });
          },
        });
      }
    }

    // Material — sticky image
    const matSection = document.querySelector('.material');
    if (matSection) {
      const img = matSection.querySelector('.material-img img');
      if (img) {
        gsap.to(img, {
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: matSection,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            onUpdate: (self) => {
              gsap.set(img, { scale: 1.15 - self.progress * 0.15 });
            },
          },
        });
      }
    }

    // Section heads subtle entrance
    document.querySelectorAll('.section-head').forEach((head) => {
      const children = head.children;
      gsap.from(children, {
        y: 30,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: head,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      });
    });
  }

  /* ================================================================
     12. Quick add — event-delegated (works for home + dynamically
     rendered category pages without re-binding)
     ================================================================ */
  function initQuickAdd() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.quick-add');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const product = readProductFromButton(btn);
      if (!product) return;
      Cart.add(product);
      bumpCartCount();
      showToast(`${product.name} added to bag`);
      const original = btn.textContent;
      btn.textContent = '✓ Added';
      btn.style.background = 'var(--accent)';
      setTimeout(() => {
        btn.textContent = original;
        btn.style.background = '';
      }, 1400);
    });
  }

  /* ================================================================
     12b. Cart Store + Drawer
     ================================================================ */
  function escAttr(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Render the cart UI. Called on any cart change and on category page re-render.
  function renderCartNow() {
    const items = Cart.items;
    const count = Cart.count;
    const subtotal = Cart.subtotal;
    document.querySelectorAll('.cart-count').forEach((el) => { el.textContent = count; });
    const headCount = document.getElementById('cartHeadCount');
    if (headCount) headCount.textContent = count + (count === 1 ? ' item' : ' items');
    const body = document.getElementById('cartBody');
    if (body) {
      if (items.length === 0) {
        body.innerHTML = `
          <div class="cart-empty">
            <div class="cart-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 7h14l-1.5 12.5a1 1 0 0 1-1 .9H7.5a1 1 0 0 1-1-.9L5 7z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>
            </div>
            <h4>Your bag is empty</h4>
            <p>Hand-knotted rugs take a while — but they're worth the wait. Start with our bestsellers.</p>
            <a href="#bestsellers" class="btn btn-outline" data-cursor="link">
              <span>Shop bestsellers</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
          </div>
        `;
      } else {
        body.innerHTML = items.map((it) => `
          <article class="cart-item" data-id="${escAttr(it.id)}">
            <div class="cart-item-img"><img src="${escAttr(it.img)}" alt="${escAttr(it.name)}" /></div>
            <div class="cart-item-info">
              <span class="cart-item-cat">${escAttr(it.cat || '')}</span>
              <div class="cart-item-name">${escAttr(it.name)}</div>
              ${it.size ? `<div class="cart-item-size">${escAttr(it.size)}</div>` : ''}
              <div class="cart-item-price">$${(it.price * (it.qty || 1)).toLocaleString()}</div>
              <div class="cart-item-actions">
                <div class="qty-control">
                  <button data-act="dec" data-cursor="link" aria-label="Decrease">−</button>
                  <span>${it.qty || 1}</span>
                  <button data-act="inc" data-cursor="link" aria-label="Increase">+</button>
                </div>
                <button class="cart-item-remove" data-act="rm" data-cursor="link">Remove</button>
              </div>
            </div>
          </article>
        `).join('');
      }
    }
    const subEl = document.getElementById('cartSubtotal');
    if (subEl) subEl.textContent = '$' + subtotal.toLocaleString();
    const shipEl = document.getElementById('cartShipping');
    if (shipEl) shipEl.textContent = subtotal >= 500 ? 'Free' : 'Calculated at checkout';
  }
  const Cart = (() => {
    const KEY = 'lumen-cart-v1';
    let items = [];
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) items = JSON.parse(raw) || [];
    } catch (e) { items = []; }

    const listeners = new Set();
    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
      listeners.forEach((fn) => { try { fn(items); } catch (e) {} });
    }

    return {
      get items() { return items; },
      get count() { return items.reduce((s, i) => s + (i.qty || 1), 0); },
      get subtotal() { return items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0); },
      add(product) {
        const incoming = { qty: 1, ...product };
        const id = incoming.id;
        const existing = items.find((i) => i.id === id);
        if (existing) existing.qty = (existing.qty || 1) + 1;
        else items.push(incoming);
        save();
      },
      setQty(id, qty) {
        const it = items.find((i) => i.id === id);
        if (!it) return;
        if (qty <= 0) this.remove(id);
        else { it.qty = qty; save(); }
      },
      remove(id) {
        items = items.filter((i) => i.id !== id);
        save();
      },
      clear() { items = []; save(); },
      onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    };
  })();

  function readProductFromButton(btn) {
    // Prefer explicit data-* attributes; fall back to nearest <article>
    const ds = btn.dataset || {};
    const article = btn.closest('article');
    const dsFromArticle = article ? article.dataset : {};
    const get = (key) => ds[key] || dsFromArticle[key] || '';
    const name = get('name');
    if (!name) return null;
    const price = parseInt(get('price'), 10) || 0;
    const id = get('id') || (name + '-' + get('size')).toLowerCase().replace(/\s+/g, '-');
    return {
      id,
      name,
      cat: get('cat') || '',
      size: get('size') || '',
      price,
      img: get('img') || (article ? article.querySelector('img')?.src : '') || '',
    };
  }

  function bumpCartCount() {
    document.querySelectorAll('.cart-count').forEach((el) => {
      el.classList.remove('bump');
      // Force reflow so animation can replay
      void el.offsetWidth;
      el.classList.add('bump');
    });
  }

  function showToast(text) {
    let toast = document.getElementById('cartToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cartToast';
      toast.className = 'cart-toast';
      toast.innerHTML = '<span class="cart-toast-dot"></span><span class="cart-toast-text"></span>';
      document.body.appendChild(toast);
    }
    toast.querySelector('.cart-toast-text').textContent = text;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function initCart() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    const closeBtn = document.getElementById('cartClose');
    const continueBtn = document.getElementById('cartContinue');
    const checkoutBtn = document.querySelector('.cart-checkout');
    if (!drawer || !overlay) return;

    function openCart() {
      drawer.hidden = false;
      overlay.hidden = false;
      // force reflow before class toggle so transition runs
      void drawer.offsetWidth;
      drawer.classList.add('open');
      overlay.classList.add('show');
      document.body.classList.add('cart-open');
      renderCartNow();
      // Refresh any [data-cursor] inside the freshly-rendered drawer
      const cursor = document.getElementById('cursor');
      if (cursor && !window.matchMedia('(hover: none)').matches) {
        drawer.querySelectorAll('[data-cursor]').forEach((el) => {
          el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
          el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        });
      }
    }
    function closeCart() {
      drawer.classList.remove('open');
      overlay.classList.remove('show');
      document.body.classList.remove('cart-open');
      // visibility:hidden kicks in after the transform transition completes
      // (handled in CSS via transition-delay), so we don't need a timer.
    }
    // Expose for category page re-renders
    initCart.open = openCart;
    initCart.close = closeCart;

    // Use delegated listener on document so dynamically-rendered
    // .nav-cart elements (category page nav) are auto-handled AND so
    // we never miss a click that some other handler accidentally stops.
    function wireOpeners() {
      if (wireOpeners._installed) return;
      wireOpeners._installed = true;
      document.addEventListener('click', (e) => {
        const opener = e.target && e.target.closest && e.target.closest('.nav-cart');
        if (!opener) return;
        e.preventDefault();
        e.stopPropagation();
        openCart();
      });
      // Pointer-down fallback for any environment where click is suppressed
      document.addEventListener('pointerdown', (e) => {
        const opener = e.target && e.target.closest && e.target.closest('.nav-cart');
        if (!opener) return;
        e.preventDefault();
        openCart();
      });
    }

    closeBtn && closeBtn.addEventListener('click', closeCart);
    continueBtn && continueBtn.addEventListener('click', (e) => { e.preventDefault(); closeCart(); });
    overlay.addEventListener('click', closeCart);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) closeCart();
    });

    // Delegate item actions
    const body = document.getElementById('cartBody');
    if (body) {
      body.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const item = btn.closest('.cart-item');
        if (!item) return;
        const id = item.getAttribute('data-id');
        const it = Cart.items.find((x) => x.id === id);
        if (!it) return;
        const act = btn.getAttribute('data-act');
        if (act === 'inc') Cart.setQty(id, (it.qty || 1) + 1);
        else if (act === 'dec') Cart.setQty(id, (it.qty || 1) - 1);
        else if (act === 'rm') Cart.remove(id);
      });
    }

    // Empty-state "Shop bestsellers" link should close drawer + jump
    document.addEventListener('click', (e) => {
      const a = e.target.closest('.cart-empty a[href^="#"]');
      if (!a) return;
      if (document.body.classList.contains('is-category')) {
        e.preventDefault();
        window.location.hash = '';
        setTimeout(() => {
          const target = document.querySelector(a.getAttribute('href'));
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      closeCart();
    });

    // Checkout stub
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (Cart.count === 0) return;
        showToast('Checkout coming soon — your bag is saved ✓');
        setTimeout(() => Cart.clear(), 1200);
        setTimeout(closeCart, 800);
      });
    }

    // Subscribe to cart changes
    Cart.onChange(renderCartNow);

    // Re-wire openers every time category page re-renders (the new nav has its own .nav-cart)
    window.addEventListener('hashchange', () => setTimeout(wireOpeners, 0));

    wireOpeners();
    renderCartNow();
  }

  /* ================================================================
     13. Category Page — hash router + render
     ================================================================ */
  function initCategoryRouter() {
    const CATEGORIES = {
      'modern-minimal': {
        name: 'Modern Minimal',
        slug: 'modern-minimal',
        total: 24,
        heroImg: 'images/featured-3.jpg',
        titleHTML: 'Rugs for <em>quiet</em> rooms.',
        desc: 'Hand-knotted and hand-loomed in muted palettes — bone, oat, sand. Built for the room where you do your best thinking.',
        meta: [['Hand-knotted', 'Wool · Linen · Hemp'], ['Origin', 'Jaipur · Kathmandu'], ['Lead time', '6–10 weeks']],
        products: [
          { name: 'The Aria',         price: 1890, img: 'images/featured-1.jpg', rating: 5, reviews: 214, badge: 'NEW',        cat: 'Modern Minimal', size: "8'×10'" },
          { name: 'The Linen Field',  price: 1420, img: 'images/featured-3.jpg', rating: 5, reviews: 146, badge: 'LIMITED',    cat: 'Modern Minimal', size: "8'×10'" },
          { name: 'The Cloud',        price: 1640, img: 'images/lifestyle-1.jpg', rating: 5, reviews: 89,  badge: '',           cat: 'Modern Minimal', size: "9'×12'" },
          { name: 'The Dune',         price: 980,  img: 'images/hero.jpg',        rating: 5, reviews: 121, badge: '',           cat: 'Modern Minimal', size: "5'×8'" },
        ],
      },
      'heritage': {
        name: 'Heritage',
        slug: 'heritage',
        total: 18,
        heroImg: 'images/featured-2.jpg',
        titleHTML: 'Heirlooms you can <em>stand on.</em>',
        desc: 'Hand-knotted in wool and silk, with patterns traced back to the palaces of Rajasthan and the courts of Persia. Made to outlive trends.',
        meta: [['Knot density', '200 KPSI'], ['Materials', 'Wool · Silk · Cotton'], ['Lead time', '10–14 weeks']],
        products: [
          { name: 'The Maison',  price: 2640, img: 'images/featured-2.jpg', rating: 5, reviews: 508, badge: 'BESTSELLER', cat: 'Heritage', size: "9'×12'" },
          { name: 'The Estate',  price: 3240, img: 'images/hero.jpg',        rating: 5, reviews: 312, badge: '',          cat: 'Heritage', size: "10'×14'" },
          { name: 'The Atlas',   price: 2940, img: 'images/featured-2.jpg', rating: 5, reviews: 187, badge: '',          cat: 'Heritage', size: "9'×12'" },
          { name: 'The Jaipur',  price: 1890, img: 'images/lifestyle-1.jpg', rating: 5, reviews: 245, badge: '',          cat: 'Heritage', size: "8'×10'" },
        ],
      },
      'natural-fiber': {
        name: 'Natural Fiber',
        slug: 'natural-fiber',
        total: 32,
        heroImg: 'images/product-3.jpg',
        titleHTML: 'Jute, hemp, <em>honest.</em>',
        desc: 'Undyed plant fibers, hand-braided and hand-loomed. Cool underfoot in summer, warm in winter, and kind to the planet year-round.',
        meta: [['Fibers', 'Jute · Hemp · Sisal'], ['Dye', 'Plant-based only'], ['Lead time', '4–6 weeks']],
        products: [
          { name: 'The Hallway Runner',  price: 420, img: 'images/product-1.jpg', rating: 5, reviews: 312, badge: 'BESTSELLER', cat: 'Natural Fiber', size: "2'×6'" },
          { name: 'The Natural Jute',    price: 640, img: 'images/product-3.jpg', rating: 5, reviews: 274, badge: '',           cat: 'Natural Fiber', size: "8'×10'" },
          { name: 'The Aria Geometric',  price: 980, img: 'images/product-2.jpg', rating: 5, reviews: 186, badge: '',           cat: 'Natural Fiber', size: "5'×8'" },
          { name: 'The Dune',            price: 720, img: 'images/lifestyle-1.jpg', rating: 5, reviews: 98, badge: '',          cat: 'Natural Fiber', size: "4'×6'" },
        ],
      },
      'geometric': {
        name: 'Geometric',
        slug: 'geometric',
        total: 14,
        heroImg: 'images/product-4.jpg',
        titleHTML: 'Lines that <em>hold</em> a room.',
        desc: 'Bold patterns, hand-tufted in soft New Zealand wool. For the room that wants to be remembered.',
        meta: [['Pattern', 'Hand-tufted'], ['Materials', '100% Wool'], ['Lead time', '5–7 weeks']],
        products: [
          { name: 'The Spectrum',     price: 720,  img: 'images/product-4.jpg', rating: 5, reviews: 98,  badge: 'BESTSELLER', cat: 'Geometric', size: "4'×6'" },
          { name: 'The Lattice',      price: 1180, img: 'images/product-4.jpg', rating: 5, reviews: 142, badge: '',           cat: 'Geometric', size: "5'×8'" },
          { name: 'The Spectrum Mini',price: 540,  img: 'images/product-2.jpg', rating: 5, reviews: 76,  badge: '',           cat: 'Geometric', size: "3'×5'" },
          { name: 'The Spectrum Max', price: 1640, img: 'images/product-4.jpg', rating: 5, reviews: 64,  badge: 'LIMITED',    cat: 'Geometric', size: "8'×10'" },
        ],
      },
      'all': {
        name: 'All Categories',
        slug: 'all',
        total: 88,
        heroImg: 'images/hero.jpg',
        titleHTML: 'Every <em>floor,</em> in one place.',
        desc: 'Browse the full collection. Filter by style, size, fiber or lead time. Or just keep scrolling — every rug is hand-knotted, fair-trade, and shipped free worldwide.',
        meta: [['Total rugs', '88'], ['Materials', 'Wool · Linen · Hemp · Silk'], ['Shipping', 'Free over $500']],
        products: [],   // populated below from the 4 sub-categories
      },
    };

    // Aggregate 'all' from the 4 sub-categories (4 sub × 4 each = 16)
    ['modern-minimal', 'heritage', 'natural-fiber', 'geometric'].forEach((slug) => {
      CATEGORIES[slug].products.forEach((p) => {
        CATEGORIES['all'].products.push({ ...p });
      });
    });
    CATEGORIES['all'].total = CATEGORIES['all'].products.length;

    const container = document.getElementById('categoryPage');
    if (!container) return;

    function escHTML(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function renderCategory(slug) {
      const cat = CATEGORIES[slug];
      if (!cat) {
        // Unknown slug — fall back to home
        showHome();
        return;
      }

      // Build toolbar
      const sortOptions = ['Featured', 'Newest', 'Price ↑', 'Price ↓', 'Most loved'];
      const toolbarHTML = `
        <div class="cat-page-toolbar">
          <div class="cat-page-toolbar-left">
            <strong>${cat.total} rugs</strong>
            <span>in ${escHTML(cat.name)}</span>
          </div>
          <div class="cat-page-toolbar-right">
            ${sortOptions.map((opt, i) => `<button data-sort="${i}" class="${i === 0 ? 'active' : ''}">${opt}</button>`).join('')}
          </div>
        </div>
      `;

      // Build product cards
      const cardsHTML = cat.products.map((p) => {
        const badge = p.badge ? `<span class="featured-badge">${escHTML(p.badge)}</span>` : '';
        const rating = '★'.repeat(p.rating) + `<em>(${p.reviews})</em>`;
        const productId = (p.name + '-' + p.size).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return `
          <article class="product-card" data-cursor="view"
            data-id="${escHTML(productId)}" data-name="${escHTML(p.name)}"
            data-cat="${escHTML(p.cat)}" data-size="${escHTML(p.size)}"
            data-price="${p.price}" data-img="${escHTML(p.img)}">
            <div class="product-img">
              <img src="${escHTML(p.img)}" alt="${escHTML(p.name)} — ${escHTML(p.cat)} rug" />
              ${badge}
              <button class="quick-add" data-cursor="link"
                data-id="${escHTML(productId)}" data-name="${escHTML(p.name)}"
                data-cat="${escHTML(p.cat)}" data-size="${escHTML(p.size)}"
                data-price="${p.price}" data-img="${escHTML(p.img)}">+ Quick add</button>
            </div>
            <div class="product-info">
              <span class="rating">${rating}</span>
              <h3>${escHTML(p.name)}</h3>
              <p>${escHTML(p.cat)} · ${escHTML(p.size)}</p>
              <div class="product-foot">
                <span class="price">$${p.price.toLocaleString()}</span>
                <a href="#" class="link-arrow" data-cursor="link">Details →</a>
              </div>
            </div>
          </article>
        `;
      }).join('');

      // Build meta strip
      const metaHTML = cat.meta.map(([k, v]) => `<div><strong>${escHTML(v)}</strong><br/>${escHTML(k)}</div>`).join('');

      // Build hero
      const heroHTML = `
        <nav class="cat-page-nav">
          <a href="#hero" class="nav-logo" data-cursor="link" data-back>
            <span class="logo-mark">L<span>&amp;</span>L</span>
            <span class="logo-text">Lumen &amp; Loom</span>
          </a>
          <ul class="nav-menu">
            <li><a href="#hero" data-back data-cursor="link">Home</a></li>
            <li><a href="#/category/all" data-cursor="link">All</a></li>
            <li><a href="#/category/modern-minimal" data-cursor="link">Modern Minimal</a></li>
            <li><a href="#/category/heritage" data-cursor="link">Heritage</a></li>
            <li><a href="#/category/natural-fiber" data-cursor="link">Natural Fiber</a></li>
            <li><a href="#/category/geometric" data-cursor="link">Geometric</a></li>
          </ul>
          <div class="nav-actions">
            <a href="#" class="nav-cart" data-cursor="link"><span>Bag</span><span class="cart-count">0</span></a>
          </div>
        </nav>
        <section class="cat-page-hero">
          <div class="cat-page-bg" style="background-image:url('${escHTML(cat.heroImg)}')"></div>
          <div class="cat-page-hero-inner">
            <div class="cat-breadcrumb">
              <a href="#hero" data-back>Home</a>
              <span class="sep">/</span>
              <a href="#/category/all" data-cursor="link">Categories</a>
              <span class="sep">/</span>
              <span class="current">${escHTML(cat.name)}</span>
            </div>
            <h1 class="cat-page-title">${cat.titleHTML}</h1>
            <p class="cat-page-desc">${escHTML(cat.desc)}</p>
            <div class="cat-page-meta">${metaHTML}</div>
          </div>
        </section>
        ${toolbarHTML}
        <div class="cat-page-grid">${cardsHTML}</div>
        <footer class="footer">
          <div class="footer-top">
            <div class="footer-brand">
              <div class="footer-logo">L&nbsp;&amp;&nbsp;L</div>
              <p>Hand-knotted rugs, designed for the modern home. Shipped from our studio in Jaipur to 36 countries.</p>
              <div class="footer-socials">
                <a href="#" data-cursor="link">Instagram</a>
                <a href="#" data-cursor="link">Pinterest</a>
                <a href="#" data-cursor="link">TikTok</a>
                <a href="#" data-cursor="link">YouTube</a>
              </div>
            </div>
            <div class="footer-cols">
              <div>
                <h4>Shop</h4>
                <a href="#">All Rugs</a>
                <a href="#">New Arrivals</a>
                <a href="#">Best Sellers</a>
                <a href="#">Runners</a>
                <a href="#">Samples</a>
              </div>
              <div>
                <h4>Care</h4>
                <a href="#">Rug Care Guide</a>
                <a href="#">Shipping &amp; Returns</a>
                <a href="#">FAQ</a>
                <a href="#">Trade Program</a>
              </div>
              <div>
                <h4>About</h4>
                <a href="#">Our Story</a>
                <a href="#">The Artisans</a>
                <a href="#">Journal</a>
                <a href="#">Press</a>
              </div>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© 2024 Lumen &amp; Loom. All rights reserved.</span>
            <span>Privacy · Terms · Accessibility</span>
          </div>
        </footer>
      `;

      container.innerHTML = heroHTML;
      container.hidden = false;
      document.body.classList.add('is-category');

      // Wire up "back" links (anything marked data-back goes to #hero = home)
      container.querySelectorAll('[data-back]').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.hash = '';
          showHome();
        });
      });

      // Wire up toolbar sort buttons (visual only for the demo)
      container.querySelectorAll('.cat-page-toolbar-right button').forEach((btn) => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.cat-page-toolbar-right button').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });

      // Note: .quick-add is event-delegated at document level by initQuickAdd,
      // so we don't need to bind here. We do, however, want the cart-drawer
      // to know the new .nav-cart exists, so re-render to sync counts.
      renderCartNow();

      // Wire up cursor
      const cursor = document.getElementById('cursor');
      if (cursor && !window.matchMedia('(hover: none)').matches) {
        container.querySelectorAll('[data-cursor]').forEach((el) => {
          el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
          el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        });
        container.querySelectorAll('[data-cursor="view"]').forEach((el) => {
          el.addEventListener('mouseenter', () => { cursor.classList.add('view'); cursor.classList.remove('hover'); });
          el.addEventListener('mouseleave', () => cursor.classList.remove('view'));
        });
      }

      // Reset scroll
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
    }

    function showHome() {
      container.hidden = true;
      container.innerHTML = '';
      document.body.classList.remove('is-category');
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
    }

    function router() {
      const hash = window.location.hash || '';
      const match = hash.match(/^#\/category\/([\w-]+)$/);
      if (match) {
        renderCategory(match[1]);
      } else {
        showHome();
      }
    }

    window.addEventListener('hashchange', router);
    // Initial route
    router();
  }

})();
