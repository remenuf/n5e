const INITIAL_DATA = {
  name: '',
  imgUrl: '',
  classe: '',
  subclasse: '',
  nivel: 0,
  proficiencia: 0,
  cla: '',
  vila: '',
  equipe: '',
  antecedente: '',
  xp: 0, xpMax: 0,
  afinidade: '',
  atributos: { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
  salvaguardas: { for: false, des: false, con: false, int: false, sab: false, car: false },
  pvMax: 0, pvAtual: 0, pvTemp: 0,
  pcMax: 0, pcAtual: 0, pcTemp: 0,
  caProfBonus: 0, caOutros: 0, caAtrib: 'des', iniciativa: 0, iniciativaExtra: 0, deslocamento: 0, deslocamentoBase: 0, deslocamentoBonus: 0, impulso: 0, vontadeFogo: 0,
  sucessoMorte: 0, falhaMorte: 0,
  habilidades: {
    acrobacia: { prof: '', base: 0, attr: 'des' },
    adestrar_animais: { prof: '', base: 0, attr: 'sab' },
    artes_marciais: { prof: '', base: 0, attr: 'for' },
    atletismo: { prof: '', base: 0, attr: 'for' },
    construir: { prof: '', base: 0, attr: 'int' },
    controle_chakra: { prof: '', base: 0, attr: 'con' },
    enganacao: { prof: '', base: 0, attr: 'car' },
    furtividade: { prof: '', base: 0, attr: 'des' },
    historia: { prof: '', base: 0, attr: 'int' },
    ilusao: { prof: '', base: 0, attr: 'sab' },
    intimidacao: { prof: '', base: 0, attr: 'car' },
    intuicao: { prof: '', base: 0, attr: 'sab' },
    investigacao: { prof: '', base: 0, attr: 'int' },
    medicina: { prof: '', base: 0, attr: 'sab' },
    natureza: { prof: '', base: 0, attr: 'int' },
    ninshou: { prof: '', base: 0, attr: 'int' },
    percepcao: { prof: '', base: 0, attr: 'sab' },
    performance: { prof: '', base: 0, attr: 'car' },
    persuasao: { prof: '', base: 0, attr: 'car' },
    prestidigitacao: { prof: '', base: 0, attr: 'des' },
    sobrevivencia: { prof: '', base: 0, attr: 'sab' }
  },
  ataques: { ninjutsu: { bonus: 0, cd: 0 }, genjutsu: { bonus: 0, cd: 0 }, taijutsu: { bonus: 0, cd: 0 } },
  armas: [],
  proficiencias: '',
  maestrias: '',
  recursos: { tdi: { ganho: 0, gasto: 0, atual: 0 }, exp: { ganho: 0, gasto: 0, atual: 0 }, ryo: { ganho: 0, gasto: 0, atual: 0 } },
  concentracao: [
    { nome: '', custoConjuracao: '', custoTurno: '', duracao: '' },
    { nome: '', custoConjuracao: '', custoTurno: '', duracao: '' }
  ],
  condicoes: {
    fisicas: ['Ferida','Cambaleante','Sangramento','Lacerado','Desnorteado','Agarrado','Derrubado','Restringido','Enfraquecido','Fúria','Encantado','Concussão','Confuso','Desmoralizado','Lento','Selado'].map(n => ({ nome: n, ativo: false, rank: 1 })),
    elementais: ['Queimado','Resfriado','Corroído','Chocado','Envenenado'].map(n => ({ nome: n, ativo: false, rank: 1 })),
    sensoriais: ['Invisível','Ofuscado','Surdo','Cego'].map(n => ({ nome: n, ativo: false, rank: 1 })),
    mentais: ['Atordoado','Enfraquecido'].map(n => ({ nome: n, ativo: false, rank: 1 })),
    variadas: ['Morrendo','Incapacitado','Exaustão','Inconsciente','Petrificado'].map(n => ({ nome: n, ativo: false, rank: 1 }))
  },
  tracos: { cla: [], classe: [], subclasse: [], talentos: [] },
  aparencia: { idade: '', altura: '', peso: '', genero: '', cabelos: '', olhos: '', pele: '', aura: '', roupas: '', tamanho: '', marcas: '' },
  idiomas: '', tracoAntecedente: '', motivacao: '', meta: '', medos: '', historia: '',
  missoes: { d: 0, c: 0, b: 0, a: 0, s: 0, sp: 0 },
  inventario: [],
  armadura: { nome: '', bonusCA: 0, mod: '', tipo: '', peso: 0 },
  ryo: 0,
  vidaTurno: { salvo: [false,false,false,false,false,false,false,false], maisPV: [], menosPV: [], maisPVT: [], menosPVT: [] },
  chakraTurno: { salvo: [false,false,false,false,false,false,false,false], maisPC: [], menosPC: [], maisPCT: [], menosPCT: [] },
  acoesHabilidade: '',
  activeTab: 'tab-p'
};

class SyncManager {
  constructor() {
    this.apiUrl = '';
    this.apiKey = '';
    this.charId = null;
    this.password = null;
    this.isNew = false;
  }

  async init() {
    try {
      const res = await fetch('config.json');
      const cfg = await res.json();
      this.apiUrl = cfg.apiUrl || '';
      this.apiKey = cfg.apiKey || '';
    } catch {
      this.apiUrl = '';
      this.apiKey = '';
    }
    const params = new URLSearchParams(window.location.search);
    this.charId = params.get('id') || null;
    this.isNew = params.has('new');
    if (this.isNew) {
      const pw = params.get('pw');
      if (pw) this.password = pw;
    }
    const importKey = params.get('import');
    if (importKey) {
      const raw = localStorage.getItem(importKey);
      if (raw) {
        try { this.importData = JSON.parse(raw); } catch {}
        localStorage.removeItem(importKey);
      }
    }
  }

  get isOnline() {
    return this.apiUrl && this.apiKey;
  }

  async apiFetch(path, opts = {}) {
    const res = await fetch(this.apiUrl + path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...(opts.headers || {}),
      },
    });
    return res.json();
  }

  async loadCharacter() {
    if (!this.charId || !this.isOnline) return null;
    try {
      const result = await this.apiFetch('/api/characters/' + this.charId);
      if (result.error) throw new Error(result.error);
      return result.data;
    } catch (e) {
      console.warn('Failed to load from API:', e);
      return null;
    }
  }

  async saveCharacter(data) {
    if (!this.isOnline) return { ok: false, reason: 'offline' };

    const pw = await this._getPassword();
    if (!pw) return { ok: false, reason: 'no-password' };

    try {
      if (this.charId) {
        const result = await this.apiFetch('/api/characters/' + this.charId, {
          method: 'PUT',
          body: JSON.stringify({ data, password: pw }),
        });
        if (result.error) throw new Error(result.error);
        return { ok: true };
      } else {
        const result = await this.apiFetch('/api/characters', {
          method: 'POST',
          body: JSON.stringify({ data, password: pw }),
        });
        if (result.error) throw new Error(result.error);
        this.charId = result.id;
        const url = new URL(window.location);
        url.searchParams.set('id', this.charId);
        window.history.replaceState({}, '', url);
        return { ok: true };
      }
    } catch (e) {
      console.warn('Failed to save to API:', e);
      return { ok: false, reason: e.message };
    }
  }

  async _getPassword() {
    if (this.password) return this.password;
    return this._promptPassword();
  }

  async _promptPassword() {
    const modal = document.getElementById('pw-modal');
    const input = document.getElementById('pw-input');
    if (!modal || !input) return null;

    return new Promise(resolve => {
      input.value = '';
      modal.style.display = 'flex';
      input.focus();

      const cleanup = () => { modal.style.display = 'none'; };

      document.getElementById('pw-modal-ok').onclick = () => {
        const pw = input.value;
        if (!pw) { input.focus(); return; }
        this.password = pw;
        cleanup();
        resolve(pw);
      };

      document.getElementById('pw-modal-cancel').onclick = () => {
        cleanup();
        resolve(null);
      };

      modal.onclick = e => {
        if (e.target === modal) { cleanup(); resolve(null); }
      };

      input.onkeydown = e => {
        if (e.key === 'Enter') document.getElementById('pw-modal-ok').click();
      };
    });
  }
}

const sync = new SyncManager();

function calcMod(v) { return Math.floor((Number(v) - 10) / 2); }

class Sheet {
  constructor() {
    this.data = this._load();
    this.render();
    this._listen();
    this._initSync();
  }

  async _initSync() {
    await sync.init();
    if (sync.importData) {
      this.data = this._merge(JSON.parse(JSON.stringify(INITIAL_DATA)), sync.importData);
      this._save();
      this.render();
      return;
    }
    if (sync.charId && sync.isOnline) {
      const status = document.getElementById('sync-status');
      if (status) status.textContent = 'Carregando...';
      const remote = await sync.loadCharacter();
      if (remote) {
        this.data = this._merge(JSON.parse(JSON.stringify(INITIAL_DATA)), remote);
        this._save();
        this.render();
        if (status) status.textContent = '';
      } else {
        if (status) status.textContent = 'Falha ao carregar do servidor';
      }
    }
  }

  _load() {
    try {
      const s = localStorage.getItem('ficha5e');
      if (s) {
        const d = JSON.parse(JSON.stringify(INITIAL_DATA));
        const saved = JSON.parse(s);
        const merged = this._merge(d, saved);
        if (merged.habilidades) {
          for (const k in merged.habilidades) {
            const prof = merged.habilidades[k].prof;
            if (prof === 0) merged.habilidades[k].prof = '';
            else if (prof === 1) merged.habilidades[k].prof = '1';
            else if (prof === 2) merged.habilidades[k].prof = 'm';
          }
        }
        return merged;
      }
    } catch {}
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  _merge(a, b) {
    for (const k in b) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) {
        if (!a[k]) a[k] = {};
        this._merge(a[k], b[k]);
      } else if (b[k] !== undefined) a[k] = b[k];
    }
    return a;
  }

  _save() { try { localStorage.setItem('ficha5e', JSON.stringify(this.data)); } catch {} }

  _auto() { clearTimeout(this._t); this._t = setTimeout(() => this._save(), 400); }

  async syncSave() {
    const status = document.getElementById('sync-status');
    if (!sync.isOnline) {
      if (status) status.textContent = 'Modo offline — salvo localmente';
      setTimeout(() => { if (status) status.textContent = ''; }, 2000);
      return;
    }
    if (status) status.textContent = 'Salvando...';
    const result = await sync.saveCharacter(this.data);
    if (result.ok) {
      if (status) status.textContent = sync.charId ? 'Salvo no servidor' : 'Criado no servidor';
      setTimeout(() => { if (status) status.textContent = ''; }, 2000);
    } else if (result.reason === 'no-password') {
      if (status) status.textContent = '';
    } else {
      if (status) status.textContent = 'Erro: ' + (result.reason || 'desconhecido');
      setTimeout(() => { if (status) status.textContent = ''; }, 3000);
    }
  }

  mod(a) { return calcMod(this.data.atributos[a]); }

  profBonus() { return Number(this.data.proficiencia) || 2; }

  saveBonus(a) {
    let b = this.mod(a);
    if (this.data.salvaguardas[a]) b += this.profBonus();
    return b;
  }

  skillMod(k) {
    const s = this.data.habilidades[k];
    if (!s) return 0;
    return this.mod(s.attr) + this.skillProfBonus(k) + Number(s.base || 0);
  }

  skillProfBonus(k) {
    const s = this.data.habilidades[k];
    if (!s) return 0;
    const p = String(s.prof || '');
    const pb = this.profBonus();
    if (p === 'h') return Math.floor(pb * 0.5);
    if (p === '1') return pb;
    if (p === 'm') return pb * 2;
    if (p === 'm1') return pb + 2;
    if (p === 'm2') return pb + 4;
    if (p === 'm3') return pb + 6;
    return 0;
  }

  $(id, v) {
    const el = document.getElementById(id);
    if (!el) return null;
    if (v !== undefined) {
      if (el.type === 'checkbox') el.checked = !!v;
      else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') el.value = v ?? '';
      else el.textContent = v ?? '';
    }
    return el;
  }

  render() {
    this._header();
    this._attrs();
    this._combat();
    this._skills();
    this._passives();
    this._nin();
    this._weapons();
    this._profs();
    this._resources();
    this._features();
    this._conc();
    this._death();
    this._conditions();
    this._turnos();
    this._aparencia();
    this._armor();
    this._inventory();
    this._missoes();
    this._traits();
    this._restoreTab();
  }

  _restoreTab() {
    const id = this.data.activeTab || 'tab-p';
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
    document.querySelectorAll('.tabc').forEach(x => x.classList.remove('on'));
    const btn = document.querySelector(`.tab[data-tab="${id}"]`);
    const tab = document.getElementById(id);
    if (btn) btn.classList.add('on');
    if (tab) {
      tab.classList.add('on');
      tab.querySelectorAll('.inv-ta, .wp-ta').forEach(ta => this._autoGrow(ta));
    }
  }

  _header() {
    const d = this.data;
    this.$('char-nome', d.name); this.$('char-classe', d.classe); this.$('char-subclasse', d.subclasse);
    this.$('char-nivel', d.nivel); this.$('char-prof', d.proficiencia); this.$('char-cla', d.cla);
    this.$('char-vila', d.vila); this.$('char-equipe', d.equipe); this.$('char-antecedente', d.antecedente);
    this.$('char-xp', d.xp); this.$('char-xp-max', d.xpMax); this.$('char-afinidade', d.afinidade);
  }

  _attrs() {
    ['for','des','con','int','sab','car'].forEach(a => {
      const v = this.data.atributos[a];
      this.$('attr-val-'+a, v);
      this.$('attr-mod-'+a, (this.mod(a) >= 0 ? '+' : '') + this.mod(a));
      this.$('save-bonus-'+a, (this.saveBonus(a) >= 0 ? '+' : '') + this.saveBonus(a));
      const b = this.$('save-prof-'+a);
      if (b) { b.textContent = this.data.salvaguardas[a] ? 'P' : '—'; b.classList.toggle('p', this.data.salvaguardas[a]); }
    });
  }

  _calcCA() {
    const d = this.data;
    const armadura = d.armadura ? Number(d.armadura.bonusCA || 0) : 0;
    const total = 10 + armadura + Number(d.caProfBonus || 0) + this.mod(d.caAtrib || 'des') + Number(d.caOutros || 0);
    this.$('ca-total', total);
    this.$('ca-natural', 10);
    this.$('ca-armadura', armadura);
    this.$('ca-prof-val', d.caProfBonus || 0);
    this.$('ca-atrib', d.caAtrib || 'des');
    this.$('ca-outros', d.caOutros);
  }

  _combat() {
    const d = this.data;
    this.$('pv-max', d.pvMax); this.$('pv-atual', d.pvAtual); this.$('pv-temp', d.pvTemp);
    this.$('pc-max', d.pcMax); this.$('pc-atual', d.pcAtual); this.$('pc-temp', d.pcTemp);
    this.$('iniciativa-valor', d.iniciativa); this.$('iniciativa-extra', d.iniciativaExtra);
    this.$('deslocamento-valor', d.deslocamento); this.$('deslocamento-base', d.deslocamentoBase); this.$('deslocamento-bonus', d.deslocamentoBonus);
    [1.5, 2, 3].forEach((m, i) => { const cb = this.$('impulso-'+(i+1)); if (cb) cb.checked = d.impulso === m; });
    this.$('vontade-fogo', d.vontadeFogo);
    this._calcCA();
  }

  _death() {
    for (let i = 0; i < 3; i++) {
      const s = this.$('death-success-'+i);
      if (s) s.classList.toggle('ok', i < this.data.sucessoMorte);
      const f = this.$('death-fail-'+i);
      if (f) f.classList.toggle('ok', i < this.data.falhaMorte);
    }
  }

  _skills() {
    const keys = Object.keys(this.data.habilidades);
    const profLabels = { '': '—', 'h': 'h', '1': 'P', 'm': 'M', 'm1': 'M₁', 'm2': 'M₂', 'm3': 'M₃' };
    keys.forEach(k => {
      const s = this.data.habilidades[k];
      const b = this.skillMod(k);
      const am = this.mod(s.attr);
      const pb = this.skillProfBonus(k);
      this.$('skill-bonus-'+k, (b >= 0 ? '+' : '') + b);
      this.$('skill-attr-'+k, (am >= 0 ? '+' : '') + am);
      this.$('skill-prof-val-'+k, pb === 0 ? '+0' : (pb > 0 ? '+' : '') + pb);
      this.$('skill-base-'+k, s.base || 0);
      const tog = this.$('skill-prof-'+k);
      if (tog) {
        const p = String(s.prof || '');
        tog.classList.toggle('p', p === '1');
        tog.classList.toggle('m', p === 'm');
        tog.classList.toggle('h', p === 'h');
        tog.classList.toggle('m1', p === 'm1');
        tog.classList.toggle('m2', p === 'm2');
        tog.classList.toggle('m3', p === 'm3');
        tog.textContent = profLabels[p] || '—';
      }
    });
  }

  _passives() {
    ['percepcao','investigacao','intuicao','furtividade'].forEach(p => {
      const el = this.$(p+'-passiva');
      if (el) el.textContent = 10 + this.skillMod(p);
    });
  }

  _nin() {
    const a = this.data.ataques;
    this.$('ninjutsu-bonus', a.ninjutsu.bonus); this.$('ninjutsu-cd', a.ninjutsu.cd);
    this.$('genjutsu-bonus', a.genjutsu.bonus); this.$('genjutsu-cd', a.genjutsu.cd);
    this.$('taijutsu-bonus', a.taijutsu.bonus); this.$('taijutsu-cd', a.taijutsu.cd);
    const base = this.$('ataque-base');
    if (base) base.textContent = `FOR ${this.mod('for') >= 0 ? '+' : ''}${this.mod('for')} + Prof ${this.profBonus()}`;
  }

  _weapons() {
    const c = this.$('weapons-list');
    if (!c) return;
    const h = c.querySelector('.wp-row');
    c.innerHTML = '';
    if (h) c.appendChild(h.cloneNode(true));
    this.data.armas.forEach((w, i) => {
      const r = document.createElement('div'); r.className = 'wp-row';
      r.innerHTML = `<input type="text" class="wi" value="${this._e(w.nome)}" data-idx="${i}" data-f="nome"><input type="text" class="wi" value="${this._e(w.dano)}" data-idx="${i}" data-f="dano"><input type="text" class="wi" value="${this._e(w.tipo)}" data-idx="${i}" data-f="tipo"><textarea class="wi wp-ta" data-idx="${i}" data-f="propriedades">${this._e(w.propriedades)}</textarea><button class="rm" data-idx="${i}">&times;</button>`;
      c.appendChild(r);
    });
    c.querySelectorAll('.wp-ta').forEach(ta => this._autoGrow(ta));
  }

  _profs() {
    this.$('prof-textarea', this.data.proficiencias); this.$('maestria-textarea', this.data.maestrias);
  }

  _resources() {
    const r = this.data.recursos;
    this.$('tdi-ganho', r.tdi.ganho); this.$('tdi-gasto', r.tdi.gasto); this.$('tdi-atual', r.tdi.atual);
    this.$('exp-ganho', r.exp.ganho); this.$('exp-gasto', r.exp.gasto); this.$('exp-atual', r.exp.atual);
    this.$('ryo-ganho', r.ryo.ganho); this.$('ryo-gasto', r.ryo.gasto); this.$('ryo-atual', r.ryo.atual);
  }

  _features() {
    const t = this.data.tracos;
    ['cla', 'classe', 'subclasse', 'talentos'].forEach(k => {
      const list = this.$('feature-'+k+'-list');
      if (!list) return;
      list.innerHTML = '';
      const items = Array.isArray(t[k]) ? t[k] : (t[k] ? [{nome: t[k], detalhes: ''}] : []);
      items.forEach((item, i) => {
        const nome = typeof item === 'string' ? item : (item.nome || '');
        const row = document.createElement('div');
        row.className = 'feat-item';
        row.innerHTML = `<input type="text" class="feat-input" id="feat-${k}-${i}" value="${this._e(nome)}" data-key="${k}" data-idx="${i}" data-field="nome"><button class="btn btn-sm feat-detail-btn" data-key="${k}" data-idx="${i}">Detalhes</button><button class="rm" data-key="${k}" data-idx="${i}">&times;</button>`;
        list.appendChild(row);
      });
    });
    this.$('acao-habilidade', this.data.acoesHabilidade);
  }

  addFeature(key) {
    if (!this.data.tracos[key]) this.data.tracos[key] = [];
    if (!Array.isArray(this.data.tracos[key])) this.data.tracos[key] = [{nome: this.data.tracos[key], detalhes: ''}];
    this.data.tracos[key].push({nome: '', detalhes: ''});
    this._save(); this._features();
  }

  openFeatureDetail(key, idx) {
    const item = this.data.tracos[key]?.[idx];
    if (!item) return;
    const modal = this.$('feat-modal');
    const textarea = this.$('feat-modal-textarea');
    const title = this.$('feat-modal-title');
    if (!modal || !textarea) return;
    const nomes = {cla: 'Clã', classe: 'Classe', subclasse: 'Sub-Classe', talentos: 'Talentos'};
    title.textContent = nomes[key] || key;
    textarea.value = typeof item === 'string' ? '' : (item.detalhes || '');
    textarea.dataset.key = key;
    textarea.dataset.idx = idx;
    modal.style.display = 'flex';
  }

  saveFeatureDetail() {
    const textarea = this.$('feat-modal-textarea');
    const modal = this.$('feat-modal');
    if (!textarea || !modal) return;
    const key = textarea.dataset.key;
    const idx = parseInt(textarea.dataset.idx);
    if (this.data.tracos[key]?.[idx] && typeof this.data.tracos[key][idx] === 'object') {
      this.data.tracos[key][idx].detalhes = textarea.value;
    }
    this._save();
    modal.style.display = 'none';
  }

  removeFeature(key, idx) {
    if (this.data.tracos[key]) {
      this.data.tracos[key].splice(idx, 1);
      this._save(); this._features();
    }
  }

  _conc() {
    for (let i = 0; i < 2; i++) {
      const c = this.data.concentracao[i] || {};
      this.$('conc-nome-'+i, c.nome); this.$('conc-custo-'+i, c.custoConjuracao);
      this.$('conc-turno-'+i, c.custoTurno); this.$('conc-duracao-'+i, c.duracao);
    }
  }

  _conditions() {
    ['fisicas','elementais','sensoriais','mentais','variadas'].forEach(g => {
      (this.data.condicoes[g] || []).forEach((c, i) => {
        const cb = this.$('cond-'+g+'-'+i);
        if (cb) cb.checked = c.ativo;
        const r = this.$('cond-rank-'+g+'-'+i);
        if (r) r.value = c.rank || 1;
      });
    });
  }

  _turnos() {
    ['vida','chakra'].forEach(t => {
      const pref = t === 'vida' ? 'vt' : 'ct';
      const p = t === 'vida' ? 'PV' : 'PC';
      const dados = this.data[t+'Turno'];
      if (!dados) return;
      for (let i = 0; i < 8; i++) {
        const cb = this.$(pref+'-salvo-'+i);
        if (cb) cb.checked = dados.salvo[i] || false;
        this.$(pref+'-mais'+p+'-'+i, dados['mais'+p]?.[i] || 0);
        this.$(pref+'-menos'+p+'-'+i, dados['menos'+p]?.[i] || 0);
        this.$(pref+'-mais'+p+'T-'+i, dados['mais'+p+'T']?.[i] || 0);
        this.$(pref+'-menos'+p+'T-'+i, dados['menos'+p+'T']?.[i] || 0);
      }
    });
  }

  _aparencia() {
    const ap = this.data.aparencia;
    if (ap) Object.keys(ap).forEach(k => this.$('ap-'+k, ap[k]));
    this.$('char-idiomas', this.data.idiomas);
  }

  _armor() {
    const a = this.data.armadura;
    if (a) {
      this.$('armor-nome', a.nome); this.$('armor-bonus', a.bonusCA);
      this.$('armor-mod', a.mod); this.$('armor-tipo', a.tipo); this.$('armor-peso', a.peso);
    }
    this.$('ryo-valor', this.data.ryo);
  }

  _inventory() {
    const c = this.$('inventory-list');
    if (!c) return;
    const h = c.querySelector('.inv-row');
    c.innerHTML = '';
    if (h) c.appendChild(h.cloneNode(true));
    (this.data.inventario || []).forEach((item, i) => {
      const r = document.createElement('div'); r.className = 'inv-row';
      r.innerHTML = `<input type="text" class="ii" value="${this._e(item.nome||'')}" data-idx="${i}" data-f="nome"><input type="number" class="ii" value="${item.quantidade||1}" data-idx="${i}" data-f="quantidade"><textarea class="ii inv-ta" data-idx="${i}" data-f="efeito">${this._e(item.efeito||'')}</textarea><input type="number" class="ii" value="${item.peso||0}" data-idx="${i}" data-f="peso"><button class="rm" data-idx="${i}">&times;</button>`;
      c.appendChild(r);
    });
    c.querySelectorAll('.inv-ta').forEach(ta => this._autoGrow(ta));
  }

  _missoes() {
    ['d','c','b','a','s','sp'].forEach(r => this.$('missoes-'+r, this.data.missoes[r]));
  }

  _traits() {
    this.$('char-traco', this.data.tracoAntecedente);
    this.$('char-motivacao', this.data.motivacao);
    this.$('char-meta', this.data.meta);
    this.$('char-medos', this.data.medos);
    this.$('char-historia', this.data.historia);
  }

  _e(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  _autoGrow(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  _handle(el, id, val) {
    const num = parseFloat(val);
    const isN = !isNaN(num) && val !== '' && el.type !== 'text';

    if (id.startsWith('char-')) this._setChar(id, val, isN, num);
    else if (id.startsWith('attr-val-')) { this.data.atributos[id.replace('attr-val-','')] = isN ? num : 0; this._attrs(); this._skills(); this._passives(); this._nin(); this._calcCA(); }
    else if (id.startsWith('pv-') || id.startsWith('pc-') || id === 'iniciativa-valor' || id === 'iniciativa-extra' || id === 'deslocamento-base' || id === 'deslocamento-bonus') this._setCombat(id, isN, num);
    else if (id === 'ca-armadura') { this.data.caArmadura = isN ? num : 0; this._calcCA(); this._save(); }
    else if (id === 'ca-outros') { this.data.caOutros = isN ? num : 0; this._calcCA(); this._save(); }
    else if (id === 'ca-atrib') { this.data.caAtrib = el.value; this._calcCA(); this._save(); }
    else if (id === 'ca-prof-val') { this.data.caProfBonus = isN ? num : 0; this._calcCA(); this._save(); }
    else if (id.startsWith('skill-base-')) { const k = id.replace('skill-base-',''); if (this.data.habilidades[k]) { this.data.habilidades[k].base = isN ? num : 0; this._skills(); this._passives(); } }
    else if (id.startsWith('ninjutsu-') || id.startsWith('genjutsu-') || id.startsWith('taijutsu-')) this._setAtk(id, isN, num);
    else if (id.startsWith('cond-')) this._setCond(id, el.type === 'checkbox' ? el.checked : val);
    else if (id.startsWith('feat-') && el.dataset.field) this._setFeat(id, val, el);
    else if (id.startsWith('prof-') || id.startsWith('maestria-')) this._setProf(id, val);
    else if (id.startsWith('tdi-') || id.startsWith('exp-') || id.startsWith('ryo-')) this._setRes(id, isN, num);
    else if (id.startsWith('ap-')) { this.data.aparencia[id.replace('ap-','')] = val; }
    else if (id.startsWith('missoes-')) { const m = id.replace('missoes-',''); if (m in this.data.missoes) this.data.missoes[m] = isN ? num : 0; }
    else if (id.startsWith('vt-') || id.startsWith('ct-')) this._setTurn(id, el.checked !== undefined ? el.checked : val);
    else if (id.startsWith('armor-')) this._setArmor(id, val, isN, num);
    else if (id.startsWith('conc-')) this._setConc(id, val);
    else if (id === 'ryo-valor') { this.data.ryo = isN ? num : 0; }
    else if (id === 'acao-habilidade') { this.data.acoesHabilidade = val; }
    else if (id.startsWith('wi') || id.startsWith('ii')) this._setListItem(el);
    else if (id.startsWith('impulso-')) { this.data.impulso = el.checked ? parseFloat(el.dataset.mult) : 0; this._calcDesl(); }
    else if (id === 'vontade-fogo') { this.data.vontadeFogo = isN ? num : 0; }

    this._auto();
  }

  _setChar(id, val, isN, num) {
    const f = id.replace('char-','');
    const map = { nome: 'name', classe: 'classe', subclasse: 'subclasse', cla: 'cla', vila: 'vila', equipe: 'equipe', antecedente: 'antecedente', afinidade: 'afinidade', idiomas: 'idiomas', traco: 'tracoAntecedente', motivacao: 'motivacao', meta: 'meta', medos: 'medos', historia: 'historia' };
    if (map[f]) this.data[map[f]] = val;
    else if (f === 'nivel') this.data.nivel = isN ? num : val;
    else if (f === 'prof') this.data.proficiencia = isN ? num : val;
    else if (f === 'xp') this.data.xp = isN ? num : val;
    else if (f === 'xp-max') this.data.xpMax = isN ? num : val;
    this._attrs(); this._skills(); this._passives(); this._nin(); this._calcCA();
  }

  _setCombat(id, isN, num) {
    const map = { 'pv-max': 'pvMax', 'pv-atual': 'pvAtual', 'pv-temp': 'pvTemp', 'pc-max': 'pcMax', 'pc-atual': 'pcAtual', 'pc-temp': 'pcTemp', 'iniciativa-valor': 'iniciativa', 'iniciativa-extra': 'iniciativaExtra', 'deslocamento-base': 'deslocamentoBase', 'deslocamento-bonus': 'deslocamentoBonus' };
    if (map[id]) { this.data[map[id]] = isN ? num : 0; this._calcDesl(); }
  }

  _calcDesl() {
    const base = this.data.deslocamentoBase + this.data.deslocamentoBonus;
    const mult = this.data.impulso || 1;
    this.data.deslocamento = Math.round(base * mult);
    this.$('deslocamento-valor', this.data.deslocamento);
  }

  _setAtk(id, isN, num) {
    const parts = id.split('-');
    const t = parts[0], f = parts[1];
    const map = { ninjutsu: 'ninjutsu', genjutsu: 'genjutsu', taijutsu: 'taijutsu' };
    if (map[t] && this.data.ataques[map[t]]) this.data.ataques[map[t]][f] = isN ? num : 0;
  }

  _setCond(id, val) {
    const parts = id.split('-');
    if (parts[1] === 'rank') {
      const g = parts[2], i = parseInt(parts[3]);
      if (this.data.condicoes[g]?.[i] !== undefined) this.data.condicoes[g][i].rank = parseInt(val) || 1;
    } else {
      const g = parts[1], i = parseInt(parts[2]);
      if (this.data.condicoes[g]?.[i] !== undefined) this.data.condicoes[g][i].ativo = !!val;
    }
  }

  _setFeat(id, val, el) {
    if (el && el.dataset.key && el.dataset.idx !== undefined) {
      const key = el.dataset.key;
      const idx = parseInt(el.dataset.idx);
      if (this.data.tracos[key]?.[idx]) {
        if (typeof this.data.tracos[key][idx] === 'object') {
          this.data.tracos[key][idx].nome = val;
        } else {
          this.data.tracos[key][idx] = val;
        }
      }
    }
  }

  _setProf(id, val) {
    if (id === 'prof-textarea') this.data.proficiencias = val;
    else if (id === 'maestria-textarea') this.data.maestrias = val;
  }

  _setRes(id, isN, num) {
    const parts = id.split('-');
    if (this.data.recursos[parts[0]]) this.data.recursos[parts[0]][parts[1]] = isN ? num : 0;
  }

  _setTurn(id, val) {
    const parts = id.split('-');
    const type = parts[0], field = parts[1], idx = parseInt(parts[2]);
    if (isNaN(idx) || idx < 0 || idx > 7) return;
    const target = type === 'vt' ? this.data.vidaTurno : this.data.chakraTurno;
    if (!target) return;
    if (field === 'salvo') target.salvo[idx] = !!val;
    else target[field][idx] = parseInt(val) || 0;
  }

  _setArmor(id, val, isN, num) {
    if (!this.data.armadura) this.data.armadura = {};
    const f = id.replace('armor-','');
    if (f === 'nome' || f === 'mod' || f === 'tipo') this.data.armadura[f] = val;
    else if (f === 'bonus') this.data.armadura.bonusCA = isN ? num : 0;
    else if (f === 'peso') this.data.armadura.peso = isN ? num : 0;
    this._calcCA();
  }

  _setConc(id, val) {
    const parts = id.split('-');
    const idx = parseInt(parts[2]), field = parts[1] === 'nome' ? 'nome' : parts[1] === 'custo' ? 'custoConjuracao' : parts[1] === 'turno' ? 'custoTurno' : 'duracao';
    if (!isNaN(idx) && idx < 2) {
      if (!this.data.concentracao[idx]) this.data.concentracao[idx] = {};
      this.data.concentracao[idx][field] = val;
    }
  }

  _setListItem(el) {
    const idx = parseInt(el.dataset.idx);
    const f = el.dataset.f;
    if (isNaN(idx)) return;
    const parent = el.closest('#weapons-list, #inventory-list');
    if (!parent) return;
    const isWp = parent.id === 'weapons-list';
    const arr = isWp ? this.data.armas : this.data.inventario;
    if (!arr[idx]) arr[idx] = {};
    const val = el.type === 'number' ? parseFloat(el.value) || 0 : el.value;
    arr[idx][f] = val;
    if (el.tagName === 'TEXTAREA') this._autoGrow(el);
  }

  openProfMenu(k, el) {
    const s = this.data.habilidades[k];
    if (!s) return;
    const menu = document.getElementById('prof-menu');
    if (!menu) return;
    if (this._profClose) {
      document.removeEventListener('click', this._profClose);
      this._profClose = null;
    }
    menu.querySelectorAll('.prof-menu-item').forEach(item => {
      item.classList.toggle('selected', String(s.prof || '') === item.dataset.val);
    });
    const rect = el.getBoundingClientRect();
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.classList.remove('hidden');
    menu.dataset.skill = k;
    this._profClose = (e) => {
      if (!menu.contains(e.target) && e.target !== el) {
        menu.classList.add('hidden');
        document.removeEventListener('click', this._profClose);
        this._profClose = null;
      }
    };
    setTimeout(() => document.addEventListener('click', this._profClose), 0);
  }

  toggleSave(a) {
    this.data.salvaguardas[a] = !this.data.salvaguardas[a];
    this._save(); this._attrs();
  }

  toggleDeath(el) {
    const ok = el.dataset.type === 'success';
    const idx = parseInt(el.dataset.idx);
    if (isNaN(idx)) return;
    if (ok) this.data.sucessoMorte = this.data.sucessoMorte === idx + 1 ? idx : idx + 1;
    else this.data.falhaMorte = this.data.falhaMorte === idx + 1 ? idx : idx + 1;
    this._save(); this._death();
  }

  addWeapon() { this.data.armas.push({ nome: '', dano: '', tipo: '', propriedades: '' }); this._save(); this._weapons(); }
  addItem() { if (!this.data.inventario) this.data.inventario = []; this.data.inventario.push({ nome: '', quantidade: 1, efeito: '', peso: 0 }); this._save(); this._inventory(); }

  exportJSON() {
    const b = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = u; a.download = (this.data.name || 'personagem') + '_ficha.json'; a.click();
    URL.revokeObjectURL(u);
  }

  importJSON(file) {
    const r = new FileReader();
    r.onload = e => {
      try {
        this.data = this._merge(JSON.parse(JSON.stringify(INITIAL_DATA)), JSON.parse(e.target.result));
        this._save(); this.render(); alert('Importado!');
      } catch { alert('Erro: arquivo inválido.'); }
    };
    r.readAsText(file);
  }

  reset() {
    if (confirm('Apagar todos os dados?')) {
      localStorage.removeItem('ficha5e');
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
      this.render();
    }
  }

  _listen() {
    document.addEventListener('input', e => {
      const t = e.target;
      const id = t.id;
      if (id) { this._handle(t, id, t.value); }
      else if (t.classList.contains('ii') || t.classList.contains('wi')) { this._setListItem(t); this._auto(); }
      if (t.tagName === 'TEXTAREA') this._autoGrow(t);
    });
    document.addEventListener('change', e => { const id = e.target.id; if (id && e.target.type === 'checkbox') this._handle(e.target, id, e.target.checked); });

    document.addEventListener('click', e => {
      const t = e.target;
      if (t.classList.contains('stog')) { this.openProfMenu(t.dataset.skill, t); return; }
      if (t.closest('.save-row') && t.tagName === 'BUTTON') { this.toggleSave(t.dataset.attr); return; }
      if (t.classList.contains('dot')) { this.toggleDeath(t); return; }
      if (t.classList.contains('rm')) {
        const idx = parseInt(t.dataset.idx);
        if (isNaN(idx)) return;
        const p = t.closest('#weapons-list, #inventory-list');
        if (p) {
          if (p.id === 'weapons-list') this.data.armas.splice(idx, 1);
          else if (this.data.inventario) this.data.inventario.splice(idx, 1);
          this._save(); this._weapons(); this._inventory();
        } else if (t.dataset.key) {
          this.removeFeature(t.dataset.key, idx);
        }
      }
      if (t.classList.contains('feat-detail-btn')) {
        this.openFeatureDetail(t.dataset.key, parseInt(t.dataset.idx));
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.sheet = new Sheet();

  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
    document.querySelectorAll('.tabc').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    const t = document.getElementById(b.dataset.tab);
    if (t) t.classList.add('on');
    window.sheet.data.activeTab = b.dataset.tab;
    window.sheet._save();
    t.querySelectorAll('.inv-ta, .wp-ta').forEach(ta => window.sheet._autoGrow(ta));
  }));

  document.getElementById('btn-add-weapon')?.addEventListener('click', () => window.sheet.addWeapon());
  document.getElementById('btn-add-item')?.addEventListener('click', () => window.sheet.addItem());
  document.getElementById('btn-export')?.addEventListener('click', () => window.sheet.exportJSON());
  document.getElementById('btn-save')?.addEventListener('click', () => window.sheet.syncSave());
  document.getElementById('btn-import')?.addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file')?.addEventListener('change', e => { if (e.target.files[0]) window.sheet.importJSON(e.target.files[0]); e.target.value = ''; });
  document.getElementById('btn-reset')?.addEventListener('click', () => window.sheet.reset());

  const imgBox = document.getElementById('char-img-box');
  const imgModal = document.getElementById('img-modal');
  const imgInput = document.getElementById('img-url-input');
  const imgEl = document.getElementById('char-img');
  const imgPlaceholder = document.querySelector('.img-placeholder');

  function updateImg() {
    if (window.sheet.data.imgUrl) {
      imgEl.src = window.sheet.data.imgUrl;
      imgEl.style.display = 'block';
      imgPlaceholder.style.display = 'none';
    } else {
      imgEl.style.display = 'none';
      imgPlaceholder.style.display = '';
    }
  }
  updateImg();

  imgBox?.addEventListener('click', () => {
    imgInput.value = window.sheet.data.imgUrl || '';
    imgModal.style.display = 'flex';
    imgInput.focus();
  });

  document.getElementById('img-modal-ok')?.addEventListener('click', () => {
    window.sheet.data.imgUrl = imgInput.value.trim();
    window.sheet._save();
    updateImg();
    imgModal.style.display = 'none';
  });

  document.getElementById('img-modal-cancel')?.addEventListener('click', () => {
    imgModal.style.display = 'none';
  });

  imgModal?.addEventListener('click', e => {
    if (e.target === imgModal) imgModal.style.display = 'none';
  });

  imgInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      window.sheet.data.imgUrl = imgInput.value.trim();
      window.sheet._save();
      updateImg();
      imgModal.style.display = 'none';
    }
  });

  const featModal = document.getElementById('feat-modal');
  document.getElementById('feat-modal-ok')?.addEventListener('click', () => window.sheet.saveFeatureDetail());
  document.getElementById('feat-modal-cancel')?.addEventListener('click', () => { featModal.style.display = 'none'; });
  featModal?.addEventListener('click', e => { if (e.target === featModal) featModal.style.display = 'none'; });

  const profMenu = document.getElementById('prof-menu');
  profMenu?.addEventListener('click', e => {
    const item = e.target.closest('.prof-menu-item');
    if (!item) return;
    const k = profMenu.dataset.skill;
    if (k && window.sheet.data.habilidades[k]) {
      window.sheet.data.habilidades[k].prof = item.dataset.val;
      window.sheet._save();
      window.sheet._skills();
      window.sheet._passives();
    }
    profMenu.classList.add('hidden');
  });
});
