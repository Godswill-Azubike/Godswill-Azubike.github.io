
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {
  setupMenu();
  setFooterYear();
  setupGallery();
});

/* ---------- Mobile menu ---------- */
function setupMenu() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  const label = toggle.querySelector('.nav-toggle__text');

  function setMenuOpen(isOpen) {
    nav.classList.toggle('is-open', isOpen);
    toggle.classList.toggle('is-open', isOpen);
    label.textContent = isOpen ? 'Close' : 'Menu';
  }

  // Click the button to open or close the menu
  toggle.addEventListener('click', function () {
    const isOpen = nav.classList.contains('is-open');
    setMenuOpen(!isOpen);
  });

  // Close the menu after choosing a link
  nav.addEventListener('click', function (event) {
    if (event.target.closest('a')) setMenuOpen(false);
  });

  // Reset the menu when the screen gets wide enough for the full navigation
  const wideScreen = window.matchMedia('(min-width: 768px)');
  wideScreen.addEventListener('change', function (event) {
    if (event.matches) setMenuOpen(false);
  });
}

/* ---------- Footer year ---------- */
function setFooterYear() {
  const year = new Date().getFullYear();
  document.querySelectorAll('[data-year]').forEach(function (element) {
    element.textContent = year;
  });
}

/* ---------- Photo gallery (About page) ---------- */
function setupGallery() {
  const gallery = document.querySelector('.gallery');
  if (!gallery) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const track = gallery.querySelector('.gallery__track');
  const photos = Array.from(track.children);

  photos.forEach(function (photo) {
    const copy = photo.cloneNode(true);
    copy.querySelector('img').alt = '';
    track.appendChild(copy);
  });

  gallery.classList.add('is-looping');
}
