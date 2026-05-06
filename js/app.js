/* ============================================
   OMKAR HEGDE — Site Interactions v2
   Dynamic features: video backgrounds,
   hover-to-play, generative PIV canvas,
   parallax scroll depth, scroll reveals,
   navigation, lightbox, filters
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =============================================
     1. SCROLL REVEAL
     ============================================= */
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => revealObserver.observe(el));

  /* =============================================
     2. NAVIGATION
     ============================================= */
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  const navToggle = document.querySelector('.nav__toggle');
  const navMobile = document.querySelector('.nav__mobile');
  const navMobileClose = document.querySelector('.nav__mobile-close');
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => {
      navMobile.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
    const closeNav = () => {
      navMobile.classList.remove('open');
      document.body.style.overflow = '';
    };
    if (navMobileClose) navMobileClose.addEventListener('click', closeNav);
    navMobile.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));
  }

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a, .nav__mobile a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* =============================================
     3. PARALLAX SCROLL DEPTH
     Hero text rises faster than the video.
     Elements with data-parallax="0.1" shift
     at 10% of scroll speed.
     ============================================= */
  if (!prefersReduced) {
    const parallaxEls = document.querySelectorAll('[data-parallax]');
    const heroSplit = document.querySelector('.hero__split') || document.querySelector('.hero__content');
    const heroPortrait = document.querySelector('.hero__portrait-wrap');
    const heroVideo = document.querySelector('.hero__video-wrap');

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const vh = window.innerHeight;

          // Parallax on hero text block
          if (heroSplit && scrollY < vh) {
            const ratio = scrollY / vh;
            heroSplit.style.transform = 'translateY(' + (scrollY * 0.3) + 'px)';
            heroSplit.style.opacity = Math.max(0, 1 - ratio * 1.2);
          }
          // Portrait moves slightly slower than text for depth
          if (heroPortrait && scrollY < vh) {
            heroPortrait.style.transform = 'translateY(' + (scrollY * -0.08) + 'px)';
          }
          // Video zooms subtly
          if (heroVideo && scrollY < vh) {
            heroVideo.style.transform = 'translateY(' + (scrollY * 0.15) + 'px) scale(' + (1 + scrollY * 0.0002) + ')';
          }

          parallaxEls.forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.1;
            const rect = el.getBoundingClientRect();
            if (rect.top < vh && rect.bottom > 0) {
              const offset = (rect.top - vh / 2) * speed;
              el.style.transform = 'translateY(' + offset + 'px)';
            }
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* =============================================
     4. SECTION VIDEO BACKGROUNDS
     Videos inside .section-video auto-play
     when visible and pause when not.
     ============================================= */
  const sectionVideos = document.querySelectorAll('.section-video');
  if (sectionVideos.length > 0) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('video');
        if (!video) return;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.15 });
    sectionVideos.forEach(el => videoObserver.observe(el));
  }

  /* =============================================
     5. HOVER-TO-PLAY VIDEO CARDS
     Any element with data-video-src will
     overlay a looping muted video on hover
     (desktop) or on scroll-into-view (mobile).
     ============================================= */
  const videoCards = document.querySelectorAll('[data-video-src]');
  const isTouchDevice = 'ontouchstart' in window;

  videoCards.forEach(card => {
    const videoSrc = card.dataset.videoSrc;
    const mediaEl = card.querySelector('.phenomenon-card__media, .update-card__image, .media-item') || card;
    let videoElement = null;

    const createVideo = () => {
      if (videoElement) return videoElement;
      videoElement = document.createElement('video');
      videoElement.src = videoSrc;
      videoElement.muted = true;
      videoElement.loop = true;
      videoElement.playsInline = true;
      videoElement.preload = 'none';
      videoElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;opacity:0;transition:opacity 0.6s ease;';
      mediaEl.style.position = 'relative';
      mediaEl.style.overflow = 'hidden';
      mediaEl.appendChild(videoElement);
      return videoElement;
    };

    if (isTouchDevice) {
      const touchObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const v = createVideo();
            v.play().then(() => { v.style.opacity = '1'; }).catch(() => {});
          } else if (videoElement) {
            videoElement.pause();
            videoElement.style.opacity = '0';
          }
        });
      }, { threshold: 0.5 });
      touchObs.observe(card);
    } else {
      card.addEventListener('mouseenter', () => {
        const v = createVideo();
        v.play().then(() => { v.style.opacity = '1'; }).catch(() => {});
      });
      card.addEventListener('mouseleave', () => {
        if (videoElement) {
          videoElement.style.opacity = '0';
          setTimeout(() => { if (videoElement) videoElement.pause(); }, 600);
        }
      });
    }
  });

  /* =============================================
     6. GENERATIVE PIV / FLOW-FIELD CANVAS
     Renders on any canvas with class
     "flow-canvas" or id "hero-particles".
     Modes: network, streamline, drift
     ============================================= */
  const flowCanvases = document.querySelectorAll('.flow-canvas, #hero-particles');

  if (!prefersReduced && flowCanvases.length > 0) {
    flowCanvases.forEach(canvas => {
      const ctx = canvas.getContext('2d');
      const cfg = {
        count: parseInt(canvas.dataset.particles) || 80,
        speed: parseFloat(canvas.dataset.speed) || 1,
        color: canvas.dataset.color || '0, 212, 170',
        connectDist: parseInt(canvas.dataset.connect) || 110,
        mode: canvas.dataset.mode || 'network'
      };

      let particles = [];
      let animId = null;
      let w, h;
      let time = 0;
      const NS = 0.003;

      const hash = (a, b) => {
        let h = (a * 2654435761 ^ b * 2246822519) & 0x7fffffff;
        h = ((h >> 13) ^ h) * 1274126177;
        return ((h >> 16) ^ h) / 0x7fffffff;
      };
      const smooth = (t) => t * t * (3 - 2 * t);
      const noise2D = (x, y) => {
        const ix = Math.floor(x), iy = Math.floor(y);
        const fx = smooth(x - ix), fy = smooth(y - iy);
        return hash(ix, iy) * (1 - fx) * (1 - fy) +
               hash(ix + 1, iy) * fx * (1 - fy) +
               hash(ix, iy + 1) * (1 - fx) * fy +
               hash(ix + 1, iy + 1) * fx * fy;
      };

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio, 2);
        w = canvas.offsetWidth;
        h = canvas.offsetHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      const createParticles = () => {
        particles = [];
        for (let i = 0; i < cfg.count; i++) {
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.3 * cfg.speed,
            vy: (Math.random() - 0.5) * 0.3 * cfg.speed,
            r: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.4 + 0.08,
            life: Math.random() * 200 + 100,
            age: Math.random() * 100,
            trail: []
          });
        }
      };

      const draw = () => {
        ctx.clearRect(0, 0, w, h);
        time += 0.004;

        particles.forEach(p => {
          p.age++;

          if (cfg.mode === 'streamline') {
            const angle = noise2D(p.x * NS + time, p.y * NS) * Math.PI * 4;
            p.vx = Math.cos(angle) * 0.8 * cfg.speed;
            p.vy = Math.sin(angle) * 0.8 * cfg.speed;
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 25) p.trail.shift();
            if (p.trail.length > 2) {
              ctx.beginPath();
              ctx.moveTo(p.trail[0].x, p.trail[0].y);
              for (let i = 1; i < p.trail.length; i++) ctx.lineTo(p.trail[i].x, p.trail[i].y);
              const ta = p.alpha * Math.max(0, 1 - p.age / p.life) * 0.5;
              ctx.strokeStyle = 'rgba(' + cfg.color + ', ' + ta + ')';
              ctx.lineWidth = p.r * 0.6;
              ctx.stroke();
            }
            if (p.age > p.life) {
              p.x = Math.random() * w;
              p.y = Math.random() * h;
              p.age = 0;
              p.trail = [];
            }
          } else if (cfg.mode === 'drift') {
            p.vy = -0.2 * cfg.speed - Math.random() * 0.1;
            p.vx = Math.sin(p.y * 0.01 + time * 2) * 0.3 * cfg.speed;
          } else {
            p.vx += (Math.random() - 0.5) * 0.015;
            p.vy += (Math.random() - 0.5) * 0.015;
            p.vx *= 0.99;
            p.vy *= 0.99;
          }

          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10;
          if (p.y > h + 10) p.y = -10;

          const fa = cfg.mode === 'streamline'
            ? p.alpha * Math.min(1, p.age / 20) * Math.max(0, 1 - p.age / p.life)
            : p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + cfg.color + ', ' + fa + ')';
          ctx.fill();
        });

        if (cfg.mode !== 'streamline') {
          for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
              const dx = particles[i].x - particles[j].x;
              const dy = particles[i].y - particles[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < cfg.connectDist) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = 'rgba(' + cfg.color + ', ' + (0.07 * (1 - dist / cfg.connectDist)) + ')';
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            }
          }
        }

        animId = requestAnimationFrame(draw);
      };

      const canvasObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!animId) { resize(); createParticles(); draw(); }
          } else {
            if (animId) { cancelAnimationFrame(animId); animId = null; }
          }
        });
      }, { threshold: 0.05 });
      canvasObs.observe(canvas);

      window.addEventListener('resize', () => { resize(); createParticles(); });
    });
  }

  /* =============================================
     7. LIGHTBOX
     ============================================= */
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lbContent = lightbox.querySelector('.lightbox__content');
    const lbCaption = lightbox.querySelector('.lightbox__caption');
    const lbClose = lightbox.querySelector('.lightbox__close');

    document.querySelectorAll('[data-lightbox]').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        const src = trigger.dataset.lightbox;
        const caption = trigger.dataset.caption || '';
        const isVideo = src.endsWith('.mp4') || src.endsWith('.webm');
        lbContent.innerHTML = isVideo
          ? '<video src="' + src + '" controls autoplay></video>'
          : '<img src="' + src + '" alt="' + caption + '">';
        lbCaption.textContent = caption;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    const closeLb = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      lbContent.innerHTML = '';
    };
    lbClose.addEventListener('click', closeLb);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLb(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLb();
    });
  }

  /* =============================================
     8. FILTER BUTTONS
     ============================================= */
  document.querySelectorAll('.filters').forEach(group => {
    const items = document.querySelectorAll(group.dataset.target);
    group.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        items.forEach(item => {
          if (f === 'all' || item.dataset.category === f) {
            item.style.display = '';
            item.style.opacity = '0';
            requestAnimationFrame(() => {
              item.style.transition = 'opacity 0.4s ease';
              item.style.opacity = '1';
            });
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  });

  /* =============================================
     9. EXPANDABLE SECTIONS
     ============================================= */
  document.querySelectorAll('[data-expand]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const target = document.getElementById(trigger.dataset.expand);
      if (!target) return;
      const isOpen = target.style.maxHeight && target.style.maxHeight !== '0px';
      target.style.maxHeight = isOpen ? '0px' : target.scrollHeight + 'px';
      target.style.opacity = isOpen ? '0' : '1';
      trigger.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* =============================================
     10. BLOG SEARCH
     ============================================= */
  const blogSearch = document.getElementById('blog-search');
  if (blogSearch) {
    blogSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.blog-card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  /* =============================================
     11. SMOOTH SCROLL
     ============================================= */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* =============================================
     12. ANIMATED TIMELINE DOTS
     ============================================= */
  const timeline = document.querySelector('.timeline');
  if (timeline && !prefersReduced) {
    const items = timeline.querySelectorAll('.timeline__item');
    const dotObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const dot = entry.target.querySelector('.timeline__dot');
          if (dot) dot.classList.add('timeline__dot--active');
        }
      });
    }, { threshold: 0.3 });
    items.forEach(item => dotObs.observe(item));
  }

  /* =============================================
     13. HERO VIDEO CAROUSEL + NOW PLAYING
     Crossfades videos, updates name label
     and pill-shaped dot indicators.
     ============================================= */
  const heroVideos = document.querySelectorAll('.hero__video');
  const heroDots = document.querySelectorAll('.hero__video-dot');
  const npDots = document.querySelectorAll('.hero__np-dot');
  const npName = document.getElementById('hero-video-name');

  // Derive display name from each video's <source> filename
  const videoNames = Array.from(heroVideos).map(v => {
    const s = v.querySelector('source');
    let src = s ? s.getAttribute('src') : '';
    try { src = decodeURIComponent(src); } catch (e) {}
    const file = (src.split('/').pop() || '').replace(/\.[^.]+$/, '');
    return file;
  });

  if (heroVideos.length > 1) {
    let currentVideo = 0;
    const CYCLE_INTERVAL = 8000;
    let cycleTimer = null;

    const switchTo = (index) => {
      heroVideos[currentVideo].classList.remove('active');
      heroDots[currentVideo]?.classList.remove('active');
      npDots[currentVideo]?.classList.remove('active');

      const outgoing = heroVideos[currentVideo];
      setTimeout(() => {
        if (!outgoing.classList.contains('active')) outgoing.pause();
      }, 1600);

      currentVideo = index;
      const incoming = heroVideos[currentVideo];
      incoming.currentTime = 0;
      incoming.play().catch(() => {});
      incoming.classList.add('active');
      heroDots[currentVideo]?.classList.add('active');
      npDots[currentVideo]?.classList.add('active');

      // Update name with fade
      if (npName) {
        npName.style.opacity = '0';
        setTimeout(() => {
          npName.textContent = videoNames[currentVideo] || '';
          npName.style.opacity = '1';
        }, 300);
      }

      // Sync typing phrase to the active video
      if (typeof window.heroSetPhrase === 'function') {
        window.heroSetPhrase(currentVideo);
      }
    };

    const nextVideo = () => switchTo((currentVideo + 1) % heroVideos.length);

    const startCycle = () => {
      if (cycleTimer) clearInterval(cycleTimer);
      cycleTimer = setInterval(nextVideo, CYCLE_INTERVAL);
    };

    heroVideos[0].play().catch(() => {});
    if (npName) npName.textContent = videoNames[0] || '';
    startCycle();

    // Click old dots
    heroDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        if (i !== currentVideo) { switchTo(i); startCycle(); }
      });
    });

    // Click new pill dots
    npDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        if (i !== currentVideo) { switchTo(i); startCycle(); }
      });
    });

    // Pause when not visible
    const heroEl = document.querySelector('.hero');
    if (heroEl) {
      const heroObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            if (cycleTimer) { clearInterval(cycleTimer); cycleTimer = null; }
            heroVideos.forEach(v => v.pause());
          } else {
            heroVideos[currentVideo].play().catch(() => {});
            startCycle();
          }
        });
      }, { threshold: 0.1 });
      heroObs.observe(heroEl);
    }
  }

  /* =============================================
     14. TYPING EFFECT
     Rotates through phrases with type/erase.
     ============================================= */
  const typingEl = document.getElementById('hero-typing');
  if (typingEl) {
    const phrases = [
      'From evaporation fronts to living condensates.',
      'Engineering chips that control biology.',
      'Seeing patterns before theory predicts them.',
      'Order emerging from a drying solvent.',
      'Mapping flow fields at the microscale.',
      'Drops that talk to each other through the air.',
      'Surface tension as a hidden engine.',
      'Where physics meets the logic of the living.',
      'Reading the velocity of the invisible.',
    ];
    let phraseIdx = 0;
    let charIdx = 0;
    let isErasing = false;
    let pauseTimer = null;
    let typingScheduled = false;

    const typeStep = () => {
      const current = phrases[phraseIdx];
      if (!isErasing) {
        charIdx++;
        typingEl.textContent = current.slice(0, charIdx);
        if (charIdx >= current.length) {
          // Reached end. Hold here. Do NOT auto-erase or auto-advance.
          // The carousel calls heroSetPhrase() when it is time to change.
          return;
        }
        setTimeout(typeStep, 45);
      }
    };

    // Allow the hero carousel to switch phrase in sync with the active video.
    // Erases current phrase and types the new one matched to videoIdx.
    window.heroSetPhrase = (videoIdx) => {
      if (videoIdx < 0 || videoIdx >= phrases.length) return;
      if (videoIdx === phraseIdx && charIdx === phrases[phraseIdx].length) return;
      if (pauseTimer) { clearTimeout(pauseTimer); pauseTimer = null; }
      const eraseAndType = () => {
        if (charIdx > 0) {
          charIdx--;
          typingEl.textContent = phrases[phraseIdx].slice(0, charIdx);
          setTimeout(eraseAndType, 25);
        } else {
          phraseIdx = videoIdx;
          isErasing = false;
          setTimeout(typeStep, 200);
        }
      };
      eraseAndType();
    };

    // Start after entrance animation
    setTimeout(typeStep, 1800);
  }

});
