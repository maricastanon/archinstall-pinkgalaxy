/* ═══════════════════════════════════════════════
   PINK GALAXY — ARCH INSTALL GUIDE
   app.js v1.0
═══════════════════════════════════════════════ */

const STATE_KEY = 'pinkgalaxy_arch_v1';
const NOTES_KEY = 'pinkgalaxy_notes_v1';
const NB_KEY = 'pinkgalaxy_notebook_v1';
const POSTITS_KEY = 'pinkgalaxy_postits_v1';
const ALT_KEY = 'pinkgalaxy_altpaths_v1';

let state = {};
let notes = {};
let notebook = [];
let postits = [];
let altPaths = {};
let currentChapter = 0;
let dragPostit = null, dragOffX = 0, dragOffY = 0;

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  loadAll();
  renderSidebar();
  showChapter(currentChapter);
  bindTopbar();
  bindNotebook();
  bindFab();
  renderPostits();
  updateGlobalProgress();
});

function loadAll() {
  try { state = JSON.parse(localStorage.getItem(STATE_KEY)) || {}; } catch(e) { state = {}; }
  try { notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; } catch(e) { notes = {}; }
  try { notebook = JSON.parse(localStorage.getItem(NB_KEY)) || []; } catch(e) { notebook = []; }
  try { postits = JSON.parse(localStorage.getItem(POSTITS_KEY)) || []; } catch(e) { postits = []; }
  try { altPaths = JSON.parse(localStorage.getItem(ALT_KEY)) || {}; } catch(e) { altPaths = {}; }
}

function saveState() { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
function saveNotes() { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); }
function saveNotebook() { localStorage.setItem(NB_KEY, JSON.stringify(notebook)); }
function savePostits() { localStorage.setItem(POSTITS_KEY, JSON.stringify(postits)); }
function saveAltPaths() { localStorage.setItem(ALT_KEY, JSON.stringify(altPaths)); }

// ═══ PILL EXPANDABLES ═══
function togglePill(element) {
  element.classList.toggle('expanded');
  saveState();
}

function expandAllPills() {
  document.querySelectorAll('.pill').forEach(pill => {
    pill.classList.add('expanded');
  });
  saveState();
}

function collapseAllPills() {
  document.querySelectorAll('.pill').forEach(pill => {
    pill.classList.remove('expanded');
  });
  saveState();
}

// ── CHAPTERS ──
function showChapter(idx) {
  document.querySelectorAll('.chapter').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.chapter-item').forEach(c => c.classList.remove('active'));
  const ch = document.querySelectorAll('.chapter')[idx];
  const si = document.querySelectorAll('.chapter-item')[idx];
  if (ch) ch.classList.add('active');
  if (si) si.classList.add('active');
  currentChapter = idx;
  applyStateToChapter();
  applyNotesToChapter();
  applyAltPaths();
  updateChapterProgress();
}

function applyStateToChapter() {
  document.querySelectorAll('.step').forEach(step => {
    const id = step.dataset.id;
    if (!id) return;
    const chk = step.querySelector('.step-checkbox');
    if (state[id]) {
      chk.classList.add('checked');
      step.classList.add('done');
    } else {
      chk.classList.remove('checked');
      step.classList.remove('done');
    }
  });
}

function applyNotesToChapter() {
  document.querySelectorAll('.step-notes-area textarea').forEach(ta => {
    const id = ta.dataset.noteid;
    if (id && notes[id]) ta.value = notes[id];
  });
}

function applyAltPaths() {
  document.querySelectorAll('.alt-path-selector').forEach(sel => {
    const id = sel.dataset.altid;
    const saved = altPaths[id];
    if (saved) {
      sel.querySelectorAll('.alt-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.alt === saved);
      });
      sel.querySelectorAll('.alt-content').forEach(c => {
        c.classList.toggle('active', c.dataset.alt === saved);
      });
    } else {
      // activate first by default
      const firstTab = sel.querySelector('.alt-tab');
      const firstContent = sel.querySelector('.alt-content');
      if (firstTab) firstTab.classList.add('active');
      if (firstContent) firstContent.classList.add('active');
    }
  });
}

// ── STEP TOGGLE ──
window.toggleStep = function(stepEl) {
  const id = stepEl.dataset.id;
  if (!id) return;
  const chk = stepEl.querySelector('.step-checkbox');
  const isDone = !chk.classList.contains('checked');
  if (isDone) {
    chk.classList.add('checked');
    stepEl.classList.add('done');
    state[id] = true;
  } else {
    chk.classList.remove('checked');
    stepEl.classList.remove('done');
    delete state[id];
  }
  saveState();
  updateChapterProgress();
  updateGlobalProgress();
  updateSidebarChapter();
};

window.toggleStepDetail = function(btn) {
  const detail = btn.closest('.step').querySelector('.step-detail');
  const icon = btn.querySelector('.step-expand');
  if (detail.classList.contains('open')) {
    detail.classList.remove('open');
    if(icon) icon.classList.remove('open');
  } else {
    detail.classList.add('open');
    if(icon) icon.classList.add('open');
  }
};

// ── NOTES ──
window.toggleStepNotes = function(btn) {
  const area = btn.nextElementSibling;
  area.classList.toggle('open');
  btn.textContent = area.classList.contains('open') ? '📝 Hide notes' : '📝 Add note';
};

window.saveStepNote = function(ta) {
  const id = ta.dataset.noteid;
  notes[id] = ta.value;
  saveNotes();
  const saved = ta.closest('.step-notes-area').querySelector('.step-notes-saved');
  if (saved) { saved.style.display = 'block'; setTimeout(() => saved.style.display = 'none', 1500); }
};

// ── PROGRESS ──
function updateChapterProgress() {
  const ch = document.querySelectorAll('.chapter')[currentChapter];
  if (!ch) return;
  const steps = ch.querySelectorAll('.step[data-id]');
  const done = ch.querySelectorAll('.step[data-id].done').length;
  const total = steps.length;
  const pct = total > 0 ? Math.round(done / total * 100) : 0;
  const fill = ch.querySelector('.cp-fill');
  const pctEl = ch.querySelector('.cp-pct');
  if (fill) fill.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
}

function updateGlobalProgress() {
  const allSteps = document.querySelectorAll('.step[data-id]');
  const doneSteps = document.querySelectorAll('.step[data-id].done');
  const total = allSteps.length;
  const done = doneSteps.length;
  const pct = total > 0 ? Math.round(done / total * 100) : 0;
  const fill = document.getElementById('global-bar-fill');
  const pctEl = document.getElementById('global-pct');
  const doneEl = document.getElementById('stat-done');
  const remEl = document.getElementById('stat-rem');
  if (fill) fill.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
  if (doneEl) doneEl.textContent = done;
  if (remEl) remEl.textContent = total - done;
}

function getChapterProgress(idx) {
  const chapters = document.querySelectorAll('.chapter');
  const ch = chapters[idx];
  if (!ch) return { done:0, total:0, pct:0 };
  const total = ch.querySelectorAll('.step[data-id]').length;
  const done = [...ch.querySelectorAll('.step[data-id]')].filter(s => state[s.dataset.id]).length;
  const pct = total > 0 ? Math.round(done / total * 100) : 0;
  return { done, total, pct };
}

// ── SIDEBAR ──
function renderSidebar() {
  const list = document.getElementById('chapter-list');
  if (!list) return;
  // Items are rendered in HTML; just bind clicks
  list.querySelectorAll('.chapter-item').forEach((item, idx) => {
    item.addEventListener('click', () => {
      showChapter(idx);
      // Close sidebar on mobile
      if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.remove('mobile-open');
      }
    });
  });
}

function updateSidebarChapter() {
  document.querySelectorAll('.chapter-item').forEach((item, idx) => {
    const { pct } = getChapterProgress(idx);
    const pctEl = item.querySelector('.ch-pct');
    const chk = item.querySelector('.ch-check');
    if (pctEl) pctEl.textContent = pct > 0 ? pct + '%' : '';
    if (chk) {
      if (pct === 100) {
        item.classList.add('completed');
      }
    }
  });
}

// ── TOPBAR ──
function bindTopbar() {
  const toggle = document.getElementById('sidebar-toggle');
  if (toggle) toggle.addEventListener('click', () => {
    const sb = document.getElementById('sidebar');
    if (window.innerWidth < 768) {
      sb.classList.toggle('mobile-open');
    } else {
      sb.classList.toggle('hidden');
      document.getElementById('content').classList.toggle('full-width');
    }
  });

  document.getElementById('btn-notebook')?.addEventListener('click', toggleNotebook);
  document.getElementById('btn-focus')?.addEventListener('click', () => {
    document.body.classList.toggle('focus-mode');
    const btn = document.getElementById('btn-focus');
    btn.textContent = document.body.classList.contains('focus-mode') ? '🌟 Exit Focus' : '🎯 Focus';
  });
  document.getElementById('btn-save')?.addEventListener('click', () => {
    saveState(); saveNotes(); saveNotebook(); savePostits();
    const btn = document.getElementById('btn-save');
    const orig = btn.textContent;
    btn.textContent = '✅ Saved!';
    btn.style.color = 'var(--ok)';
    setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 1500);
  });
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    if (confirm('Reset ALL progress? This cannot be undone.')) {
      state = {};
      localStorage.removeItem(STATE_KEY);
      document.querySelectorAll('.step').forEach(s => {
        s.classList.remove('done');
        s.querySelector('.step-checkbox')?.classList.remove('checked');
      });
      updateChapterProgress();
      updateGlobalProgress();
    }
  });
}

// ── NOTEBOOK ──
function bindNotebook() {
  const panel = document.getElementById('notebook-panel');
  document.getElementById('nb-close')?.addEventListener('click', () => panel.classList.remove('open'));
  document.getElementById('nb-add-btn')?.addEventListener('click', addNotebookEntry);
  renderNotebook();
}

function toggleNotebook() {
  document.getElementById('notebook-panel')?.classList.toggle('open');
  renderNotebook();
}

function addNotebookEntry() {
  const ta = document.getElementById('nb-input');
  const text = ta.value.trim();
  if (!text) return;
  notebook.unshift({ id: Date.now(), text, ts: new Date().toLocaleString(), chapter: currentChapter });
  saveNotebook();
  ta.value = '';
  renderNotebook();
}

function renderNotebook() {
  const body = document.getElementById('nb-body');
  if (!body) return;
  if (notebook.length === 0) {
    body.innerHTML = '<div class="nb-empty">📖 No entries yet.<br>Add thoughts, insights, commands to remember!</div>';
    return;
  }
  body.innerHTML = notebook.map(e => `
    <div class="nb-entry" data-id="${e.id}">
      <div class="nb-entry-text">${escHtml(e.text)}</div>
      <div class="nb-entry-meta">
        <span>${e.ts}</span>
        <button class="nb-entry-del" onclick="deleteNbEntry(${e.id})">✕</button>
      </div>
    </div>
  `).join('');
}

window.deleteNbEntry = function(id) {
  notebook = notebook.filter(e => e.id !== id);
  saveNotebook();
  renderNotebook();
};

// ── POST-ITS ──
function bindFab() {
  document.getElementById('fab-postit')?.addEventListener('click', addPostit);
  // drag
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchmove', onTouchMove, {passive:false});
  document.addEventListener('touchend', onDragEnd);
}

function addPostit() {
  const id = Date.now();
  postits.push({ id, text:'', x:100+Math.random()*200, y:100+Math.random()*200, color:'#FFEB3B', minimized:false });
  savePostits();
  renderPostits();
}

function renderPostits() {
  const container = document.getElementById('postits-container');
  if (!container) return;
  container.innerHTML = postits.map(p => `
    <div class="postit${p.minimized?' minimized':''}" data-pid="${p.id}"
         style="left:${p.x}px;top:${p.y}px;background:${p.color};"
         onmousedown="startDrag(event,${p.id})"
         ontouchstart="startTouchDrag(event,${p.id})">
      <div class="postit-header">
        <span class="postit-drag-handle">✦ note</span>
        <button class="postit-minimize" onclick="togglePostitMin(event,${p.id})">${p.minimized?'▽':'△'}</button>
        <button class="postit-close" onclick="deletePostit(event,${p.id})">✕</button>
      </div>
      <div class="postit-body">
        <textarea placeholder="Type here..." onchange="savePostitText(${p.id},this.value)"
          onmousedown="event.stopPropagation()">${escHtml(p.text)}</textarea>
        <div class="postit-colors">
          ${['#FFEB3B','#F48FB1','#A5D6A7','#80D8FF','#CE93D8'].map(c=>`
            <div class="postit-color${p.color===c?' active':''}" style="background:${c}"
              onclick="changePostitColor(event,${p.id},'${c}')"></div>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

window.togglePostitMin = function(e, id) {
  e.stopPropagation();
  const p = postits.find(p=>p.id===id);
  if(p) { p.minimized=!p.minimized; savePostits(); renderPostits(); }
};
window.deletePostit = function(e, id) {
  e.stopPropagation();
  postits = postits.filter(p=>p.id!==id);
  savePostits(); renderPostits();
};
window.savePostitText = function(id, val) {
  const p = postits.find(p=>p.id===id);
  if(p) { p.text=val; savePostits(); }
};
window.changePostitColor = function(e, id, color) {
  e.stopPropagation();
  const p = postits.find(p=>p.id===id);
  if(p) { p.color=color; savePostits(); renderPostits(); }
};

window.startDrag = function(e, id) {
  if (e.target.tagName==='TEXTAREA'||e.target.tagName==='BUTTON'||e.target.classList.contains('postit-color')) return;
  dragPostit = id;
  const el = document.querySelector(`[data-pid="${id}"]`);
  const rect = el.getBoundingClientRect();
  dragOffX = e.clientX - rect.left;
  dragOffY = e.clientY - rect.top;
  e.preventDefault();
};
window.startTouchDrag = function(e, id) {
  if (e.target.tagName==='TEXTAREA'||e.target.tagName==='BUTTON') return;
  dragPostit = id;
  const el = document.querySelector(`[data-pid="${id}"]`);
  const rect = el.getBoundingClientRect();
  dragOffX = e.touches[0].clientX - rect.left;
  dragOffY = e.touches[0].clientY - rect.top;
};
function onDragMove(e) {
  if (!dragPostit) return;
  const p = postits.find(p=>p.id===dragPostit);
  if (!p) return;
  p.x = e.clientX - dragOffX;
  p.y = e.clientY - dragOffY;
  const el = document.querySelector(`[data-pid="${dragPostit}"]`);
  if (el) { el.style.left=p.x+'px'; el.style.top=p.y+'px'; }
}
function onTouchMove(e) {
  if (!dragPostit) return;
  const p = postits.find(p=>p.id===dragPostit);
  if (!p) return;
  p.x = e.touches[0].clientX - dragOffX;
  p.y = e.touches[0].clientY - dragOffY;
  const el = document.querySelector(`[data-pid="${dragPostit}"]`);
  if (el) { el.style.left=p.x+'px'; el.style.top=p.y+'px'; }
  e.preventDefault();
}
function onDragEnd() {
  if (dragPostit) { savePostits(); dragPostit = null; }
}

// ── ALT PATHS ──
window.selectAlt = function(selectorEl, altId, tabEl) {
  const id = selectorEl.dataset.altid;
  altPaths[id] = altId;
  saveAltPaths();
  selectorEl.querySelectorAll('.alt-tab').forEach(t => t.classList.toggle('active', t.dataset.alt===altId));
  selectorEl.querySelectorAll('.alt-content').forEach(c => c.classList.toggle('active', c.dataset.alt===altId));
};

// ── COPY ──
window.copyCmd = function(btn) {
  const block = btn.closest('.cmd');
  const text = block.innerText.replace('Copy','').replace('Copied!','').trim();
  navigator.clipboard?.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
  });
};

// ── CHAPTER NAV BUTTONS ──
window.nextChapter = function() {
  const total = document.querySelectorAll('.chapter').length;
  if (currentChapter < total-1) showChapter(currentChapter+1);
};
window.prevChapter = function() {
  if (currentChapter > 0) showChapter(currentChapter-1);
};

// ── UTILS ──
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
  if (e.target.tagName==='TEXTAREA'||e.target.tagName==='INPUT') return;
  if (e.key==='ArrowRight'||e.key==='l') nextChapter();
  if (e.key==='ArrowLeft'||e.key==='h') prevChapter();
  if (e.key==='n') toggleNotebook();
  if (e.key==='f') document.getElementById('btn-focus')?.click();
});
