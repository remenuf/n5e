(async function () {
  let API_URL = '';
  let API_KEY = '';

  try {
    const res = await fetch('config.json');
    const cfg = await res.json();
    API_URL = cfg.apiUrl;
    API_KEY = cfg.apiKey;
  } catch {
    document.getElementById('list-status').textContent = 'Erro: config.json inválido.';
    return;
  }

  const grid = document.getElementById('char-grid');
  const status = document.getElementById('list-status');
  const newModal = document.getElementById('new-modal');
  const newName = document.getElementById('new-name');
  const newPw = document.getElementById('new-password');

  async function apiFetch(path, opts = {}) {
    const res = await fetch(API_URL + path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        ...(opts.headers || {}),
      },
    });
    return res.json();
  }

  async function loadCharacters() {
    try {
      const chars = await apiFetch('/api/characters');
      if (chars.error) throw new Error(chars.error);
      renderList(chars);
    } catch (e) {
      status.textContent = 'Erro ao carregar: ' + e.message;
      grid.innerHTML = '';
    }
  }

  function renderList(chars) {
    grid.innerHTML = '';
    if (!chars.length) {
      grid.innerHTML = '<div class="list-empty">Nenhum personagem ainda. Crie um novo!</div>';
      return;
    }
    chars.forEach(c => {
      const card = document.createElement('div');
      card.className = 'char-card';
      card.innerHTML = `
        <div class="char-card-name">${esc(c.name || 'Sem nome')}</div>
        <div class="char-card-class">${esc(c.classe || '—')}</div>
        <div class="char-card-id">${c.id}</div>
      `;
      card.addEventListener('click', () => {
        window.location.href = 'ficha.html?id=' + c.id;
      });
      grid.appendChild(card);
    });
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  document.getElementById('btn-new').addEventListener('click', () => {
    newName.value = '';
    newPw.value = '';
    newModal.style.display = 'flex';
    newName.focus();
  });

  document.getElementById('new-modal-ok').addEventListener('click', async () => {
    const name = newName.value.trim();
    const pw = newPw.value;
    if (!name) { newName.focus(); return; }
    if (!pw) { newPw.focus(); return; }

    try {
      const result = await apiFetch('/api/characters', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            name: name,
            imgUrl: '',
            classe: '',
            subclasse: '',
            nivel: 0,
            proficiencia: 0,
          },
          password: pw,
        }),
      });
      if (result.error) throw new Error(result.error);
      window.location.href = 'ficha.html?id=' + result.id + '&pw=' + encodeURIComponent(pw);
    } catch (e) {
      status.textContent = 'Erro ao criar: ' + e.message;
    }
  });

  document.getElementById('new-modal-cancel').addEventListener('click', () => {
    newModal.style.display = 'none';
  });

  newModal.addEventListener('click', e => {
    if (e.target === newModal) newModal.style.display = 'none';
  });

  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  document.getElementById('import-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        const key = 'ficha5e_imported_' + Date.now();
        localStorage.setItem(key, JSON.stringify(data));
        window.location.href = 'ficha.html?import=' + key;
      } catch {
        alert('Arquivo JSON inválido.');
      }
    };
    r.readAsText(file);
    e.target.value = '';
  });

  loadCharacters();
})();
