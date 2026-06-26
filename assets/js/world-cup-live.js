(function () {
  'use strict';

  const root = document.querySelector('[data-world-cup-live]');
  if (!root) return;

  const lang = root.dataset.lang || (document.documentElement.lang || 'en').slice(0, 2);
  const rtl = lang === 'ar';
  const labels = {
    en: {
      loading: 'Loading World Cup 2026 live stats…',
      unavailable: 'Live stats are ready, but the data feed is not connected yet.',
      seeded: 'World Cup 2026 schedule data',
      api: 'World Cup 2026 live API',
      error: 'Could not load live stats right now.',
      updated: 'Last updated',
      liveNow: 'Live now',
      upcoming: 'Upcoming fixtures',
      recent: 'Recent results',
      standings: 'Group standings',
      noLive: 'No World Cup matches are live right now.',
      noFixtures: 'Fixtures will appear here once the feed returns them.',
      noStandings: 'Standings will appear here after groups are available.',
      ht: 'HT',
      ft: 'FT',
      tbd: 'TBD',
      pts: 'Pts',
      p: 'P',
      gd: 'GD'
    },
    ar: {
      loading: 'جارٍ تحميل إحصاءات كأس العالم 2026…',
      unavailable: 'مركز الإحصاءات جاهز، لكن مصدر البيانات لم يتم ربطه بعد.',
      seeded: 'بيانات جدول كأس العالم 2026',
      api: 'واجهة نتائج كأس العالم 2026 المباشرة',
      error: 'تعذر تحميل الإحصاءات الحية الآن.',
      updated: 'آخر تحديث',
      liveNow: 'مباشر الآن',
      upcoming: 'المباريات القادمة',
      recent: 'آخر النتائج',
      standings: 'ترتيب المجموعات',
      noLive: 'لا توجد مباريات مباشرة في كأس العالم الآن.',
      noFixtures: 'ستظهر المباريات هنا عند توفرها من مصدر البيانات.',
      noStandings: 'سيظهر الترتيب هنا بعد توفر المجموعات.',
      ht: 'استراحة',
      ft: 'نهاية',
      tbd: 'يُحدد لاحقًا',
      pts: 'نقطة',
      p: 'لعب',
      gd: 'فارق'
    }
  }[rtl ? 'ar' : 'en'];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function formatDate(value) {
    if (!value) return labels.tbd;
    try {
      return new Intl.DateTimeFormat(rtl ? 'ar' : 'en', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(value));
    } catch {
      return value;
    }
  }

  function score(match) {
    const h = match.home?.goals;
    const a = match.away?.goals;
    return h === null || h === undefined || a === null || a === undefined ? 'vs' : `${h}–${a}`;
  }

  function statusText(match) {
    const short = match.status?.short || '';
    if (short === 'FT') return labels.ft;
    if (short === 'HT') return labels.ht;
    if (match.status?.elapsed) return `${match.status.elapsed}′`;
    return match.status?.long || formatDate(match.date);
  }

  function team(team) {
    const logo = team.logo ? `<img src="${escapeHtml(team.logo)}" alt="" loading="lazy">` : '';
    return `<span class="wc-team">${logo}<span>${escapeHtml(team.name || labels.tbd)}</span></span>`;
  }

  function matchCard(match, live) {
    return `<article class="wc-match-card${live ? ' is-live' : ''}">
      <div class="wc-match-meta"><span>${escapeHtml(match.round || 'World Cup 2026')}</span><span>${escapeHtml(statusText(match))}</span></div>
      <div class="wc-scoreline">${team(match.home)}<strong>${escapeHtml(score(match))}</strong>${team(match.away)}</div>
      ${match.venue ? `<div class="wc-venue">${escapeHtml(match.venue)}</div>` : ''}
    </article>`;
  }

  function matchList(items, empty, live) {
    if (!items || !items.length) return `<p class="wc-empty">${escapeHtml(empty)}</p>`;
    return `<div class="wc-match-grid">${items.map((item) => matchCard(item, live)).join('')}</div>`;
  }

  function standings(groups) {
    if (!groups || !groups.length) return `<p class="wc-empty">${escapeHtml(labels.noStandings)}</p>`;
    return `<div class="wc-standings">${groups.map((group, index) => `
      <section class="wc-table-wrap">
        <h3>${rtl ? 'المجموعة' : 'Group'} ${index + 1}</h3>
        <table class="wc-table">
          <thead><tr><th>#</th><th>${rtl ? 'المنتخب' : 'Team'}</th><th>${labels.p}</th><th>${labels.gd}</th><th>${labels.pts}</th></tr></thead>
          <tbody>${group.map((row) => `<tr><td>${row.rank ?? ''}</td><td>${team(row.team)}</td><td>${row.played ?? 0}</td><td>${row.goalsDiff ?? 0}</td><td><strong>${row.points ?? 0}</strong></td></tr>`).join('')}</tbody>
        </table>
      </section>`).join('')}</div>`;
  }

  function render(data) {
    const ok = data.status === 'ok' || data.status === 'seeded';
    const title = data.status === 'seeded' ? labels.seeded : (data.status === 'ok' ? labels.api : labels.unavailable);
    const updated = data.updatedAt ? `${labels.updated}: ${formatDate(data.updatedAt)}` : '';
    root.innerHTML = `
      <div class="wc-live-status ${ok ? 'ok' : 'pending'}">
        <span>${ok ? '●' : '○'}</span>
        <div><strong>${escapeHtml(title)}</strong>${updated ? `<small>${escapeHtml(updated)}</small>` : ''}</div>
      </div>
      ${!ok && data.message ? `<p class="wc-feed-note">${escapeHtml(data.message)}</p>` : ''}
      <section class="wc-live-section"><h2>${labels.liveNow}</h2>${matchList(data.live, labels.noLive, true)}</section>
      <section class="wc-live-section"><h2>${labels.upcoming}</h2>${matchList(data.fixtures, labels.noFixtures, false)}</section>
      <section class="wc-live-section"><h2>${labels.recent}</h2>${matchList(data.recent, labels.noFixtures, false)}</section>
      <section class="wc-live-section"><h2>${labels.standings}</h2>${standings(data.standings)}</section>
    `;
  }

  root.innerHTML = `<p class="wc-empty">${escapeHtml(labels.loading)}</p>`;
  fetch('/api/world-cup-2026.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    })
    .then(render)
    .catch(() => {
      root.innerHTML = `<p class="wc-empty">${escapeHtml(labels.error)}</p>`;
    });
})();
