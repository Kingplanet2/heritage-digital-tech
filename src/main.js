/* ═══════════════════════════════════════════════
   HERITAGE DIGITAL TECH — main.js
   Full interactivity, 3D, animations & effects
   ═══════════════════════════════════════════════ */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/* ─────────────────────────────────────────────
   1. CUSTOM CURSOR
───────────────────────────────────────────── */
const cursorGlow  = document.getElementById('cursor-glow');
const cursorTrail = document.getElementById('cursor-trail');

let mouseX = 0, mouseY = 0;
let trailX = 0, trailY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  gsap.set(cursorGlow, {
    x: mouseX,
    y: mouseY,
  });
});

// Smooth lagging trail
function animateTrail() {
  trailX += (mouseX - trailX) * 0.1;
  trailY += (mouseY - trailY) * 0.1;
  gsap.set(cursorTrail, { x: trailX, y: trailY });
  requestAnimationFrame(animateTrail);
}
animateTrail();

// Cursor grows on hover over interactive elements
document.querySelectorAll('a, button, .flip-card, .social-icon, .project-card')
  .forEach(el => {
    el.addEventListener('mouseenter', () => {
      gsap.to(cursorGlow, { width: 70, height: 70, duration: 0.3 });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(cursorGlow, { width: 40, height: 40, duration: 0.3 });
    });
  });

/* ─────────────────────────────────────────────
   2. DARK MODE TOGGLE
───────────────────────────────────────────── */
const themeToggle = document.getElementById('theme-toggle');
const html        = document.documentElement;
let isDark = true;

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  html.setAttribute('data-theme', isDark ? 'dark' : 'light');
  themeToggle.textContent = isDark ? '🌙' : '☀️';
  gsap.fromTo('body',
    { opacity: 0.7 },
    { opacity: 1, duration: 0.5, ease: 'power2.out' }
  );
});

/* ─────────────────────────────────────────────
   3. THREE.JS — Shared scene builder
   (Creates floating 3D shapes for each section)
───────────────────────────────────────────── */
function buildThreeScene(canvasId, shapeType = 'mixed') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    canvas.offsetWidth / canvas.offsetHeight,
    0.1,
    100
  );
  camera.position.z = 5;

  // Gold wireframe material
  const wireMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    wireframe: true,
    transparent: true,
    opacity: 0.18
  });

  // Solid glowing material
  const solidMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    transparent: true,
    opacity: 0.07,
    roughness: 0.3,
    metalness: 0.8
  });

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xFFD700, 2, 20);
  pointLight.position.set(4, 4, 4);
  scene.add(pointLight);

  // Shape geometries
  const geometries = {
    torus:       new THREE.TorusGeometry(1, 0.35, 16, 60),
    torusKnot:   new THREE.TorusKnotGeometry(0.8, 0.25, 120, 16),
    icosa:       new THREE.IcosahedronGeometry(1, 1),
    octa:        new THREE.OctahedronGeometry(1, 0),
    sphere:      new THREE.SphereGeometry(0.8, 32, 32),
    box:         new THREE.BoxGeometry(1.2, 1.2, 1.2),
    cone:        new THREE.ConeGeometry(0.7, 1.5, 6),
    tetra:       new THREE.TetrahedronGeometry(1, 0)
  };

  const shapeKeys = Object.keys(geometries);

  // Pick shapes based on section type
  const picks = {
    hero:     ['torusKnot', 'icosa', 'torus'],
    about:    ['sphere',    'octa',  'box'],
    skills:   ['icosa',     'tetra', 'cone'],
    projects: ['torus',     'box',   'sphere'],
    contact:  ['octa',      'torus', 'icosa'],
    mixed:    shapeKeys
  };

  const chosen = picks[shapeType] || picks.mixed;
  const meshes = [];

  for (let i = 0; i < 7; i++) {
    const geoKey = chosen[i % chosen.length];
    const geo    = geometries[geoKey];
    const useWire = i % 2 === 0;
    const mesh   = new THREE.Mesh(geo, useWire ? wireMat.clone() : solidMat.clone());

    // Random positions spread across scene
    mesh.position.set(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 7,
      (Math.random() - 0.5) * 3
    );

    // Random scale
    const s = 0.3 + Math.random() * 0.8;
    mesh.scale.set(s, s, s);

    // Store random rotation speeds
    mesh.userData.rotX = (Math.random() - 0.5) * 0.008;
    mesh.userData.rotY = (Math.random() - 0.5) * 0.01;
    mesh.userData.floatSpeed = 0.4 + Math.random() * 0.6;
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;

    scene.add(mesh);
    meshes.push(mesh);
  }

  // Mouse parallax
  let targetRotX = 0, targetRotY = 0;
  canvas.closest('section')?.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    targetRotX = ((e.clientY - rect.top)  / rect.height - 0.5) * 0.4;
    targetRotY = ((e.clientX - rect.left) / rect.width  - 0.5) * 0.4;
  });

  // Animation loop
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    meshes.forEach((mesh, i) => {
      mesh.rotation.x += mesh.userData.rotX;
      mesh.rotation.y += mesh.userData.rotY;
      // Floating bob
      mesh.position.y += Math.sin(
        t * mesh.userData.floatSpeed + mesh.userData.floatOffset
      ) * 0.002;
    });

    // Gentle scene parallax from mouse
    scene.rotation.x += (targetRotX - scene.rotation.x) * 0.03;
    scene.rotation.y += (targetRotY - scene.rotation.y) * 0.03;

    renderer.render(scene, camera);
  }
  animate();

  // Resize handler
  window.addEventListener('resize', () => {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  return { scene, camera, renderer };
}

// Build a Three.js scene for every section
buildThreeScene('hero-canvas',     'hero');
buildThreeScene('about-canvas',    'about');
buildThreeScene('skills-canvas',   'skills');
buildThreeScene('projects-canvas', 'projects');
buildThreeScene('contact-canvas',  'contact');

/* ─────────────────────────────────────────────
   4. HERO — Entrance animations
───────────────────────────────────────────── */
gsap.from('.nav-logo', {
  y: -40, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.2
});
gsap.from('.nav-links li', {
  y: -30, opacity: 0, duration: 0.8,
  stagger: 0.1, ease: 'power3.out', delay: 0.4
});

/* ─────────────────────────────────────────────
   5. SECTION BANNER REVEAL (scroll-triggered)
───────────────────────────────────────────── */
document.querySelectorAll('.banner-text').forEach(el => {
  // Copy text into data-text for the CSS clip animation
  el.setAttribute('data-text', el.textContent);

  ScrollTrigger.create({
    trigger: el,
    start: 'top 80%',
    onEnter: () => el.classList.add('revealed')
  });
});

/* ─────────────────────────────────────────────
   6. ABOUT SECTION — scroll animations
───────────────────────────────────────────── */
gsap.from('.about-image-wrap', {
  scrollTrigger: {
    trigger: '#about',
    start: 'top 70%'
  },
  x: -80, opacity: 0, duration: 1.1, ease: 'power3.out'
});

gsap.from('.about-text', {
  scrollTrigger: {
    trigger: '#about',
    start: 'top 70%'
  },
  x: 80, opacity: 0, duration: 1.1, ease: 'power3.out', delay: 0.2
});

gsap.from('.stat', {
  scrollTrigger: {
    trigger: '.about-stats',
    start: 'top 85%'
  },
  y: 30, opacity: 0, duration: 0.7,
  stagger: 0.15, ease: 'back.out(1.5)'
});

/* ─────────────────────────────────────────────
   7. SKILLS — Flip card tilt effect
───────────────────────────────────────────── */
document.querySelectorAll('.flip-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect   = card.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width  - 0.5;
    const yRatio = (e.clientY - rect.top)  / rect.height - 0.5;

    // Only tilt if not mid-flip
    if (!card.matches(':hover .flip-card-inner[style*="rotateY(180deg)"]')) {
      gsap.to(card, {
        rotateY:  xRatio * 15,
        rotateX: -yRatio * 15,
        duration: 0.4,
        ease: 'power2.out',
        transformPerspective: 800
      });
    }
  });

  card.addEventListener('mouseleave', () => {
    gsap.to(card, {
      rotateX: 0, rotateY: 0,
      duration: 0.6, ease: 'elastic.out(1, 0.5)'
    });
  });
});

// Stagger flip cards in on scroll
gsap.from('.flip-card', {
  scrollTrigger: {
    trigger: '#skills',
    start: 'top 70%'
  },
  y: 60, opacity: 0, duration: 0.8,
  stagger: 0.12, ease: 'power3.out'
});

/* ─────────────────────────────────────────────
   8. PROJECTS — 3D Carousel
───────────────────────────────────────────── */

// Project cards entrance
gsap.from('.project-card', {
  scrollTrigger: {
    trigger: '#projects',
    start: 'top 70%'
  },
  y: 80, opacity: 0, duration: 0.9,
  stagger: 0.15, ease: 'power3.out'
});

/* ─────────────────────────────────────────────
   9. CONTACT FORM — interactions
───────────────────────────────────────────── */
const form = document.getElementById('contact-form');

// Animate form in on scroll
gsap.from('.contact-form-wrap', {
  scrollTrigger: {
    trigger: '#contact',
    start: 'top 70%'
  },
  y: 60, opacity: 0, duration: 1, ease: 'power3.out'
});

gsap.from('.contact-info', {
  scrollTrigger: {
    trigger: '#contact',
    start: 'top 70%'
  },
  x: 60, opacity: 0, duration: 1, delay: 0.2, ease: 'power3.out'
});

// Animate social icons
gsap.from('.social-icon', {
  scrollTrigger: {
    trigger: '.social-icons',
    start: 'top 90%'
  },
  scale: 0, opacity: 0, duration: 0.5,
  stagger: 0.1, ease: 'back.out(2)'
});

// Form submit
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  btn.textContent = '✅ Message Sent!';
  btn.style.background = '#2ecc71';

  gsap.from(btn, { scale: 0.95, duration: 0.3, ease: 'back.out(2)' });

  setTimeout(() => {
    btn.textContent = 'Send Message 🚀';
    btn.style.background = '';
    form.reset();
  }, 3000);
});

/* ─────────────────────────────────────────────
   10. PARTICLES
───────────────────────────────────────────── */
const particleContainer = document.getElementById('particles-container');

function spawnParticle() {
  const p   = document.createElement('div');
  p.classList.add('particle');

  const size  = 2 + Math.random() * 5;
  const dur   = 6 + Math.random() * 8;
  const delay = Math.random() * 4;
  const left  = Math.random() * 100;

  p.style.cssText = `
    width:${size}px;
    height:${size}px;
    left:${left}vw;
    bottom:-10px;
    --dur:${dur}s;
    --delay:${delay}s;
  `;

  particleContainer.appendChild(p);
  setTimeout(() => p.remove(), (dur + delay) * 1000);
}

// Spawn a new particle every 400ms
setInterval(spawnParticle, 400);

/* ─────────────────────────────────────────────
   11. NAVBAR — shrink + hide on scroll down
───────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const current = window.scrollY;

  if (current > 80) {
    navbar.style.padding = '0.7rem 4rem';
    navbar.style.boxShadow = '0 4px 30px rgba(0,0,0,0.5)';
  } else {
    navbar.style.padding = '1.2rem 4rem';
    navbar.style.boxShadow = 'none';
  }

  // Hide navbar when scrolling down fast, show when going up
  if (current > lastScroll + 5 && current > 200) {
    gsap.to(navbar, { y: -100, duration: 0.4, ease: 'power2.in' });
  } else if (current < lastScroll - 5) {
    gsap.to(navbar, { y: 0, duration: 0.4, ease: 'power2.out' });
  }

  lastScroll = current;
});

/* ─────────────────────────────────────────────
   12. SMOOTH SCROLL for nav links
───────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      gsap.to(window, {
        scrollTo: target,
        duration: 1.2,
        ease: 'power3.inOut'
      });
    }
  });
});

/* ─────────────────────────────────────────────
   13. FOOTER — fade in
───────────────────────────────────────────── */
gsap.from('#footer', {
  scrollTrigger: {
    trigger: '#footer',
    start: 'top 95%'
  },
  y: 30, opacity: 0, duration: 0.8, ease: 'power2.out'
});

console.log('🌟 Heritage Digital Tech — Loaded & Alive');

/* ─────────────────────────────────────────────
   14. LOADING SCREEN
───────────────────────────────────────────── */
const loader = document.getElementById('loader');

window.addEventListener('load', () => {
  setTimeout(() => {
    loader.classList.add('hidden');
  }, 1900);
});

/* ─────────────────────────────────────────────
   15. ACTIVE NAV LINK on scroll
───────────────────────────────────────────── */
const sections  = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navAnchors.forEach(a => a.classList.remove('active'));
      const active = document.querySelector(
        `.nav-links a[href="#${entry.target.id}"]`
      );
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => navObserver.observe(s));

/* ─────────────────────────────────────────────
   16. SECTION FADE-IN on scroll
───────────────────────────────────────────── */
document.querySelectorAll('section').forEach(s => {
  s.classList.add('fade-section');
});

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-section')
  .forEach(el => fadeObserver.observe(el));