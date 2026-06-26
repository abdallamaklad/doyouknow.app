(function () {
  'use strict';

  const root = document.querySelector('[data-world-cup-live]');
  if (!root) return;

  const lang = root.dataset.lang || (document.documentElement.lang || 'en').slice(0, 2);
  const compact = root.dataset.widget === 'compact';
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
      openLive: 'Open live center',
      overview: 'Overview',
      matches: 'Matches',
      table: 'Table',
      knockout: 'Knockout',
      stats: 'Stats',
      players: 'Players',
      moreMatches: 'More matches',
      allTimes: 'All times are shown in your local time',
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
      openLive: 'افتح مركز النتائج',
      overview: 'نظرة عامة',
      matches: 'المباريات',
      table: 'الترتيب',
      knockout: 'الأدوار الإقصائية',
      stats: 'الإحصاءات',
      players: 'اللاعبون',
      moreMatches: 'مزيد من المباريات',
      allTimes: 'كل الأوقات حسب توقيت جهازك',
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

  const flagByTeam = {
    Algeria: '🇩🇿',
    Argentina: '🇦🇷',
    Austria: '🇦🇹',
    Belgium: '🇧🇪',
    'Cape Verde': '🇨🇻',
    Colombia: '🇨🇴',
    Egypt: '🇪🇬',
    France: '🇫🇷',
    Iran: '🇮🇷',
    Iraq: '🇮🇶',
    Jordan: '🇯🇴',
    Morocco: '🇲🇦',
    'New Zealand': '🇳🇿',
    Norway: '🇳🇴',
    Portugal: '🇵🇹',
    Qatar: '🇶🇦',
    'Saudi Arabia': '🇸🇦',
    Senegal: '🇸🇳',
    Spain: '🇪🇸',
    Tunisia: '🇹🇳',
    Uruguay: '🇺🇾'
  };

  const codeByTeam = {
    Algeria: 'ALG',
    Argentina: 'ARG',
    Austria: 'AUT',
    Belgium: 'BEL',
    'Cape Verde': 'CPV',
    Colombia: 'COL',
    Egypt: 'EGY',
    France: 'FRA',
    Iran: 'IRN',
    Iraq: 'IRQ',
    Jordan: 'JOR',
    Morocco: 'MAR',
    'New Zealand': 'NZL',
    Norway: 'NOR',
    Portugal: 'POR',
    Qatar: 'QAT',
    'Saudi Arabia': 'KSA',
    Senegal: 'SEN',
    Spain: 'ESP',
    Tunisia: 'TUN',
    Uruguay: 'URU'
  };

  const arabicTeamName = {
    Algeria: 'الجزائر',
    Argentina: 'الأرجنتين',
    Austria: 'النمسا',
    Belgium: 'بلجيكا',
    'Cape Verde': 'الرأس الأخضر',
    Colombia: 'كولومبيا',
    Egypt: 'مصر',
    France: 'فرنسا',
    Iran: 'إيران',
    Iraq: 'العراق',
    Jordan: 'الأردن',
    Morocco: 'المغرب',
    'New Zealand': 'نيوزيلندا',
    Norway: 'النرويج',
    Portugal: 'البرتغال',
    Qatar: 'قطر',
    'Saudi Arabia': 'السعودية',
    Senegal: 'السنغال',
    Spain: 'إسبانيا',
    Tunisia: 'تونس',
    Uruguay: 'أوروغواي'
  };

  function teamName(name) {
    return rtl ? (arabicTeamName[name] || name) : name;
  }

  function score(match) {
    const h = match.home?.goals;
    const a = match.away?.goals;
    return h === null || h === undefined || a === null || a === undefined ? 'vs' : `${h}–${a}`;
  }

  function compactDate(value) {
    if (!value) return labels.tbd;
    try {
      const date = new Date(value);
      return new Intl.DateTimeFormat(rtl ? 'ar' : 'en', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit'
      }).format(date);
    } catch {
      return value;
    }
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
    const name = team.name || labels.tbd;
    const flag = team.flag || flagByTeam[name] || '🏳️';
    return `<span class="wc-team">${logo || `<span class="wc-flag" aria-hidden="true">${escapeHtml(flag)}</span>`}<span>${escapeHtml(teamName(name))}</span></span>`;
  }

  function flag(team) {
    const name = team?.name || '';
    return team?.flag || flagByTeam[name] || '🏳️';
  }

  function teamCode(team) {
    const name = team?.name || '';
    return codeByTeam[name] || (name ? name.slice(0, 3).toUpperCase() : 'TBD');
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

  function compactMatch(match, live) {
    return `<article class="wc-mini-match${live ? ' is-live' : ''}">
      <div class="wc-mini-code">${escapeHtml(teamCode(match.home))} <span>${score(match) === 'vs' ? 'vs' : score(match)}</span> ${escapeHtml(teamCode(match.away))}</div>
      <div class="wc-mini-time">${escapeHtml(live ? statusText(match) : compactDate(match.date))}</div>
      <div class="wc-mini-flags"><span>${escapeHtml(flag(match.home))}</span><span>${escapeHtml(flag(match.away))}</span></div>
    </article>`;
  }

  function renderCompact(data) {
    const live = Array.isArray(data.live) ? data.live : [];
    const upcoming = Array.isArray(data.fixtures) ? data.fixtures.slice(0, live.length ? 2 : 4) : [];
    const recent = Array.isArray(data.recent) ? data.recent.slice(0, 2) : [];
    const primary = live.length ? live : upcoming;
    const heading = live.length ? labels.liveNow : labels.upcoming;
    const liveHref = rtl ? '/ar/world-cup-2026-live.html' : '/en/world-cup-2026-live.html';
    root.innerHTML = `<section class="wc-mini-widget">
      <div class="wc-mini-head"><div><span class="category-badge">World Cup 2026</span><h2>${escapeHtml(heading)}</h2></div><a href="${liveHref}">${escapeHtml(labels.openLive)} →</a></div>
      <div class="wc-mini-list" role="list">${primary.length ? primary.map((item) => compactMatch(item, live.length > 0)).join('') : `<p class="wc-empty">${escapeHtml(labels.noFixtures)}</p>`}</div>
      ${recent.length ? `<details class="wc-mini-recent"><summary>${escapeHtml(labels.recent)}</summary>${recent.map((item) => compactMatch(item, false)).join('')}</details>` : ''}
    </section>`;
  }

  function matchBoardCard(match, live) {
    return `<article class="wc-google-match${live ? ' is-live' : ''}">
      <div class="wc-google-round">${escapeHtml(match.round || 'World Cup 2026')}</div>
      <div class="wc-google-main">
        <div class="wc-google-teams">
          <div><span>${escapeHtml(flag(match.home))}</span><strong>${escapeHtml(teamName(match.home?.name || labels.tbd))}</strong></div>
          <div><span>${escapeHtml(flag(match.away))}</span><strong>${escapeHtml(teamName(match.away?.name || labels.tbd))}</strong></div>
        </div>
        <div class="wc-google-divider" aria-hidden="true"></div>
        <div class="wc-google-time"><strong>${escapeHtml(statusText(match))}</strong><span>${escapeHtml(compactDate(match.date))}</span></div>
      </div>
    </article>`;
  }

  function renderTabs(active) {
    const tabs = [
      ['overview', labels.overview],
      ['matches', labels.matches],
      ['table', labels.table],
      ['knockout', labels.knockout],
      ['stats', labels.stats],
      ['players', labels.players]
    ];
    return `<nav class="wc-google-tabs" aria-label="World Cup sections">${tabs.map(([id, label]) => `<a class="${active === id ? 'active' : ''}" href="#wc-${id}">${escapeHtml(label)}</a>`).join('')}</nav>`;
  }

  function renderGoogleTable(groups) {
    if (!groups || !groups.length) return `<p class="wc-empty">${escapeHtml(labels.noStandings)}</p>`;
    return groups.map((group, index) => `<section class="wc-google-group">
      <h3>${rtl ? 'المجموعة' : 'Group'} ${String.fromCharCode(65 + index)}</h3>
      <div class="wc-google-table-scroll"><table class="wc-google-table">
        <thead><tr><th>${rtl ? 'المنتخب' : 'Team'}</th><th>MP</th><th>W</th><th>D</th><th>L</th><th>Pts</th><th>GF</th><th>GA</th><th>GD</th></tr></thead>
        <tbody>${group.map((row) => `<tr><td><span>${row.rank ?? ''}</span>${team(row.team)}</td><td>${row.played ?? 0}</td><td>${row.won ?? 0}</td><td>${row.drawn ?? 0}</td><td>${row.lost ?? 0}</td><td><strong>${row.points ?? 0}</strong></td><td>${row.goalsFor ?? 0}</td><td>${row.goalsAgainst ?? 0}</td><td>${row.goalsDiff ?? 0}</td></tr>`).join('')}</tbody>
      </table></div>
    </section>`).join('');
  }

  function render(data) {
    const ok = data.status === 'ok' || data.status === 'seeded';
    const title = data.status === 'seeded' ? labels.seeded : (data.status === 'ok' ? labels.api : labels.unavailable);
    const updated = data.updatedAt ? `${labels.updated}: ${formatDate(data.updatedAt)}` : '';
    const live = Array.isArray(data.live) ? data.live : [];
    const fixtures = Array.isArray(data.fixtures) ? data.fixtures : [];
    const recent = Array.isArray(data.recent) ? data.recent : [];
    const featuredMatches = live.length ? live : fixtures.slice(0, 6);
    root.innerHTML = `<section class="wc-google-board">
      <header class="wc-google-hero">
        <div>
          <p>FIFA World Cup 2026™</p>
          <h1>${rtl ? 'كأس العالم 2026' : 'FIFA World Cup 2026™'}</h1>
        </div>
        <span class="${ok ? 'ok' : 'pending'}">${ok ? '●' : '○'} ${escapeHtml(title)}</span>
      </header>
      ${renderTabs('overview')}
      <small class="wc-google-updated">${escapeHtml(updated)}</small>
      <section id="wc-matches" class="wc-google-section">
        <h2>${escapeHtml(labels.matches)}</h2>
        <div class="wc-google-match-list">${featuredMatches.length ? featuredMatches.map((item) => matchBoardCard(item, live.length > 0)).join('') : `<p class="wc-empty">${escapeHtml(labels.noFixtures)}</p>`}</div>
        <a class="wc-google-more" href="#wc-table">${escapeHtml(labels.moreMatches)} ›</a>
        <p class="wc-google-note">${escapeHtml(labels.allTimes)}</p>
      </section>
      ${recent.length ? `<section id="wc-overview" class="wc-google-section"><h2>${escapeHtml(labels.recent)}</h2><div class="wc-google-match-list recent">${recent.slice(0, 4).map((item) => matchBoardCard(item, false)).join('')}</div></section>` : ''}
      <section id="wc-table" class="wc-google-section">
        <h2>${escapeHtml(labels.table)}</h2>
        <div class="wc-google-subtabs"><span class="active">${rtl ? 'دور المجموعات' : 'Group Stage'}</span><span>${rtl ? 'الأدوار الإقصائية' : 'Knockout stage'}</span></div>
        ${renderGoogleTable(data.standings)}
      </section>
      <section id="wc-knockout" class="wc-google-section"><h2>${escapeHtml(labels.knockout)}</h2>${matchList(fixtures.slice(0, 4), labels.noFixtures, false)}</section>
      <section id="wc-stats" class="wc-google-section"><h2>${escapeHtml(labels.stats)}</h2><p class="wc-empty">${rtl ? 'ستظهر إحصاءات اللاعبين عند ربط مصدر البيانات المباشر.' : 'Player stats will appear when the live data source is connected.'}</p></section>
    </section>`;
  }

  root.innerHTML = `<p class="wc-empty">${escapeHtml(labels.loading)}</p>`;
  fetch('/api/world-cup-2026.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    })
    .then((data) => compact ? renderCompact(data) : render(data))
    .catch(() => {
      root.innerHTML = `<p class="wc-empty">${escapeHtml(labels.error)}</p>`;
    });
})();
