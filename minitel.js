// ===== HORLOGE EN TEMPS REEL =====
function startClock() {
  const el = document.getElementById('topbar-clock');
  if (!el) return;

  function tick() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    el.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  tick();
  setInterval(tick, 1000);
}

// ===== BOUTONS HARDWARE MINITEL =====
function bindHardwareButtons() {
  // SOMMAIRE → retour à l'accueil
  const btnSommaire = document.getElementById('btn-sommaire');
  if (btnSommaire) {
    btnSommaire.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  // FIN → retour à l'accueil (ou page précédente si pas sur index)
  const btnFin = document.getElementById('btn-fin');
  if (btnFin) {
    btnFin.addEventListener('click', () => {
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      if (currentPage === 'index.html') {
        // Si on est sur l'accueil, aller à la page de login (rechargement)
        window.location.href = 'index.html';
      } else {
        window.location.href = 'index.html';
      }
    });
  }

  // BOUTON ROUGE → rafraîchir la page actuelle
  const btnRouge = document.getElementById('btn-rouge');
  if (btnRouge) {
    btnRouge.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // ENVOI → scroll vers le bas (ou soumettre formulaire si présent)
  const btnEnvoi = document.getElementById('btn-envoi');
  if (btnEnvoi) {
    btnEnvoi.addEventListener('click', () => {
      const form = document.querySelector('form');
      if (form && form.id === 'minitwitt-form') {
        form.dispatchEvent(new Event('submit'));
      } else {
        window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
      }
    });
  }
}

// ===== NAVIGATION INTRA-PAGE (data-target, breadcrumb) =====
function initIntraPageNav(screens) {
  // Clics sur éléments avec data-target (menu items, breadcrumb)
  document.addEventListener('click', (e) => {
    const linkEl = e.target.closest('a.link, a[data-target]');
    if (linkEl && linkEl.dataset.target) {
      e.preventDefault();
      showScreen(linkEl.dataset.target, screens);
    }

    const menuItem = e.target.closest('.menu-item[data-target], .list-menu-item[data-target]');
    if (menuItem && menuItem.dataset.target) {
      showScreen(menuItem.dataset.target, screens);
    }
  });

  // Navigation clavier
  document.addEventListener('keydown', (e) => {
    const currentScreen = screens.find(id => {
      const el = document.getElementById(id);
      return el && !el.classList.contains('hidden');
    });

    if (!currentScreen) return;

    // Touche 0 : retour (comportement variable selon la page)
    if (e.key === '0' || e.key === 'Escape') {
      e.preventDefault();
      // Vérifier si c'est un menu principal
      if (currentScreen.includes('-menu')) {
        window.location.href = 'index.html';
      } else {
        // Retour au menu local de la page
        const menuScreenId = screens.find(id => id.endsWith('-menu'));
        if (menuScreenId && menuScreenId !== currentScreen) {
          showScreen(menuScreenId, screens);
        }
      }
    }

    // Touches 1-9 : navigation rapide sur menus
    if (e.key >= '1' && e.key <= '9') {
      const menuItems = document.querySelectorAll('.menu-item, .list-menu-item');
      const index = parseInt(e.key) - 1;
      if (menuItems[index]) {
        const target = menuItems[index].dataset.target;
        if (target) {
          e.preventDefault();
          showScreen(target, screens);
        }
      }
    }
  });
}

// Fonction utilitaire pour montrer/cacher les écrans
function showScreen(id, screens) {
  if (!screens || !Array.isArray(screens)) return;

  screens.forEach(screenId => {
    const el = document.getElementById(screenId);
    if (el) {
      el.classList.toggle('hidden', screenId !== id);
    }
  });

  window.scrollTo(0, 0);
}

// ===== AUTHENTIFICATION LEGERE (sessionStorage) =====
function checkAuth() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const isLoggedIn = sessionStorage.getItem('minitel-auth');

  // Laisser accès à index.html sans authentification
  if (currentPage !== 'index.html' && !isLoggedIn) {
    window.location.href = 'index.html';
  }
}

function setAuth() {
  sessionStorage.setItem('minitel-auth', 'ok');
}

function clearAuth() {
  sessionStorage.removeItem('minitel-auth');
}

// ===== NAVIGATION ENTRE PAGES (cross-file) =====
function navigateTo(page) {
  window.location.href = page;
}

// ===== ANIMATION METEOR CHARGEMENT =====
async function loadWeatherWithAnimation() {
  const loadingScreen = document.getElementById('meteo-loading');
  const contentScreen = document.getElementById('meteo-content');

  if (!loadingScreen || !contentScreen) return;

  // Afficher écran de chargement
  loadingScreen.classList.remove('hidden');
  contentScreen.classList.add('hidden');

  // Animer les nuages
  const cloudArt = document.getElementById('cloud-art');
  if (cloudArt) {
    const lines = cloudArt.textContent.split('\n');
    cloudArt.textContent = '';

    for (let i = 0; i < lines.length; i++) {
      await new Promise(resolve => {
        setTimeout(() => {
          const span = document.createElement('span');
          span.className = 'cloud-line';
          span.textContent = lines[i];
          span.style.animationDelay = '0s';
          cloudArt.appendChild(span);
          resolve();
        }, i * 180);
      });
    }
  }

  // Attendre le chargement météo
  await new Promise(resolve => setTimeout(resolve, 500));

  // Charger les données météo
  await loadWeatherData();

  // Transition vers contenu
  await new Promise(resolve => setTimeout(resolve, 500));
  loadingScreen.classList.add('hidden');
  contentScreen.classList.remove('hidden');
}

async function loadWeatherData() {
  const cities = [
    { id: 'paris', lat: 48.8566, lon: 2.3522 },
    { id: 'marseille', lat: 43.2965, lon: 5.3698 },
    { id: 'lyon', lat: 45.7640, lon: 4.8357 },
    { id: 'lille', lat: 50.6292, lon: 3.0573 },
    { id: 'bordeaux', lat: 44.8378, lon: -0.5792 },
    { id: 'strasbourg', lat: 48.5734, lon: 7.7521 }
  ];

  const wmoCodeMap = {
    0: 'Ciel dégagé', 1: 'Ciel clair', 2: 'Partiellement nuageux', 3: 'Nuageux',
    45: 'Brouillard', 48: 'Brouillard givrant', 51: 'Bruine légère', 53: 'Bruine modérée',
    55: 'Bruine intense', 61: 'Pluie légère', 63: 'Pluie modérée', 65: 'Pluie intense',
    71: 'Neige légère', 73: 'Neige modérée', 75: 'Neige intense', 80: 'Averses légères',
    81: 'Averses modérées', 82: 'Averses intenses', 85: 'Averses neige légère',
    86: 'Averses neige intense', 95: 'Orage', 96: 'Orage + neige', 99: 'Orage + grêle'
  };

  const promises = cities.map(async (city) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true`
      );
      const data = await response.json();
      const weather = data.current_weather;

      const tempEl = document.getElementById(`temp-${city.id}`);
      const descEl = document.getElementById(`desc-${city.id}`);

      if (tempEl && weather) {
        const temp = Math.round(weather.temperature);
        tempEl.textContent = `${temp > 0 ? '+' : ''}${temp}°C`;
        descEl.textContent = wmoCodeMap[weather.weathercode] || 'Variable';
      }
    } catch (err) {
      console.error(`Erreur météo ${city.id}:`, err);
    }
  });

  await Promise.all(promises);
}

// ===== INIT PRINCIPALE =====
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  bindHardwareButtons();
  checkAuth();
});
