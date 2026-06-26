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
      groupStageResults: 'Group stage fixtures & results',
      noGroupResults: 'No confirmed group-stage results yet. Scheduled group matches are listed below.',
      openLive: 'Open live center',
      overview: 'Overview',
      matches: 'Matches',
      table: 'Table',
      knockout: 'Knockout',
      stats: 'Stats',
      players: 'Players',
      moreMatches: 'More matches',
      lessMatches: 'Show fewer',
      groupStage: 'Group Stage',
      knockoutStage: 'Knockout stage',
      allTimes: 'Times shown in your local timezone',
      verifiedSchedule: 'Verified schedule fallback',
      noVerifiedResults: 'Recent results will appear here only after the live API confirms them.',
      noStats: 'Player and team stats will appear here after the live API is connected.',
      startedAgo: 'Started {time} ago',
      minute: '1 min',
      minutes: '{count} min',
      hour: '1 hr',
      hours: '{count} hrs',
      noLive: 'No World Cup matches are live right now.',
      noFixtures: 'Fixtures will appear here once the feed returns them.',
      noStandings: 'Group table will appear here after groups are available.',
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
      groupStageResults: 'مباريات ونتائج دور المجموعات',
      noGroupResults: 'لا توجد نتائج مؤكدة لدور المجموعات حتى الآن. تظهر المباريات المجدولة أدناه.',
      openLive: 'افتح مركز النتائج',
      overview: 'نظرة عامة',
      matches: 'المباريات',
      table: 'الترتيب',
      knockout: 'الأدوار الإقصائية',
      stats: 'الإحصاءات',
      players: 'اللاعبون',
      moreMatches: 'مزيد من المباريات',
      lessMatches: 'عرض أقل',
      groupStage: 'دور المجموعات',
      knockoutStage: 'الأدوار الإقصائية',
      allTimes: 'الأوقات معروضة حسب توقيت جهازك المحلي',
      verifiedSchedule: 'جدول احتياطي موثّق',
      noVerifiedResults: 'ستظهر النتائج الأخيرة فقط بعد تأكيدها من واجهة البيانات المباشرة.',
      noStats: 'ستظهر إحصاءات اللاعبين والمنتخبات بعد ربط واجهة البيانات المباشرة.',
      startedAgo: 'بدأت قبل {time}',
      minute: 'دقيقة واحدة',
      minutes: '{count} دقيقة',
      hour: 'ساعة واحدة',
      hours: '{count} ساعات',
      noLive: 'لا توجد مباريات مباشرة في كأس العالم الآن.',
      noFixtures: 'ستظهر المباريات هنا عند توفرها من مصدر البيانات.',
      noStandings: 'سيظهر جدول المجموعات هنا بعد توفر البيانات.',
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

  function timeZoneName() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch {
      return '';
    }
  }

  function timeZoneNote() {
    const zone = timeZoneName();
    return zone ? `${labels.allTimes}: ${zone}` : labels.allTimes;
  }

  const flagByTeam = {
    Algeria: '🇩🇿',
    Argentina: '🇦🇷',
    Austria: '🇦🇹',
    Australia: '🇦🇺',
    Belgium: '🇧🇪',
    'Bosnia and Herzegovina': '🇧🇦',
    Brazil: '🇧🇷',
    Canada: '🇨🇦',
    'Cape Verde': '🇨🇻',
    Colombia: '🇨🇴',
    'Congo DR': '🇨🇩',
    Croatia: '🇭🇷',
    Curaçao: '🇨🇼',
    Czechia: '🇨🇿',
    Ecuador: '🇪🇨',
    Egypt: '🇪🇬',
    England: '🏴',
    France: '🇫🇷',
    Germany: '🇩🇪',
    Ghana: '🇬🇭',
    Haiti: '🇭🇹',
    Iran: '🇮🇷',
    Iraq: '🇮🇶',
    'Ivory Coast': '🇨🇮',
    Japan: '🇯🇵',
    Jordan: '🇯🇴',
    Mexico: '🇲🇽',
    Morocco: '🇲🇦',
    Netherlands: '🇳🇱',
    'New Zealand': '🇳🇿',
    Norway: '🇳🇴',
    Panama: '🇵🇦',
    Paraguay: '🇵🇾',
    Portugal: '🇵🇹',
    Qatar: '🇶🇦',
    'Saudi Arabia': '🇸🇦',
    Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    Senegal: '🇸🇳',
    'South Africa': '🇿🇦',
    'South Korea': '🇰🇷',
    Spain: '🇪🇸',
    Switzerland: '🇨🇭',
    Tunisia: '🇹🇳',
    Türkiye: '🇹🇷',
    Ukraine: '🇺🇦',
    Uruguay: '🇺🇾',
    USA: '🇺🇸',
    Uzbekistan: '🇺🇿'
  };

  const codeByTeam = {
    Algeria: 'ALG',
    Argentina: 'ARG',
    Austria: 'AUT',
    Australia: 'AUS',
    Belgium: 'BEL',
    'Bosnia and Herzegovina': 'BIH',
    Brazil: 'BRA',
    Canada: 'CAN',
    'Cape Verde': 'CPV',
    Colombia: 'COL',
    'Congo DR': 'COD',
    Croatia: 'CRO',
    Curaçao: 'CUW',
    Czechia: 'CZE',
    Ecuador: 'ECU',
    Egypt: 'EGY',
    England: 'ENG',
    France: 'FRA',
    Germany: 'GER',
    Ghana: 'GHA',
    Haiti: 'HAI',
    Iran: 'IRN',
    Iraq: 'IRQ',
    'Ivory Coast': 'CIV',
    Japan: 'JPN',
    Jordan: 'JOR',
    Mexico: 'MEX',
    Morocco: 'MAR',
    Netherlands: 'NED',
    'New Zealand': 'NZL',
    Norway: 'NOR',
    Panama: 'PAN',
    Paraguay: 'PAR',
    Portugal: 'POR',
    Qatar: 'QAT',
    'Saudi Arabia': 'KSA',
    Scotland: 'SCO',
    Senegal: 'SEN',
    'South Africa': 'RSA',
    'South Korea': 'KOR',
    Spain: 'ESP',
    Switzerland: 'SUI',
    Tunisia: 'TUN',
    Türkiye: 'TUR',
    Ukraine: 'UKR',
    Uruguay: 'URU',
    USA: 'USA',
    Uzbekistan: 'UZB'
  };

  const arabicTeamName = {
    Algeria: 'الجزائر',
    Argentina: 'الأرجنتين',
    Austria: 'النمسا',
    Australia: 'أستراليا',
    Belgium: 'بلجيكا',
    'Bosnia and Herzegovina': 'البوسنة والهرسك',
    Brazil: 'البرازيل',
    Canada: 'كندا',
    'Cape Verde': 'الرأس الأخضر',
    Colombia: 'كولومبيا',
    'Congo DR': 'الكونغو الديمقراطية',
    Croatia: 'كرواتيا',
    Curaçao: 'كوراساو',
    Czechia: 'التشيك',
    Ecuador: 'الإكوادور',
    Egypt: 'مصر',
    England: 'إنجلترا',
    France: 'فرنسا',
    Germany: 'ألمانيا',
    Ghana: 'غانا',
    Haiti: 'هايتي',
    Iran: 'إيران',
    Iraq: 'العراق',
    'Ivory Coast': 'كوت ديفوار',
    Japan: 'اليابان',
    Jordan: 'الأردن',
    Mexico: 'المكسيك',
    Morocco: 'المغرب',
    Netherlands: 'هولندا',
    'New Zealand': 'نيوزيلندا',
    Norway: 'النرويج',
    Panama: 'بنما',
    Paraguay: 'باراغواي',
    Portugal: 'البرتغال',
    Qatar: 'قطر',
    'Saudi Arabia': 'السعودية',
    Scotland: 'اسكتلندا',
    Senegal: 'السنغال',
    'South Africa': 'جنوب أفريقيا',
    'South Korea': 'كوريا الجنوبية',
    Spain: 'إسبانيا',
    Switzerland: 'سويسرا',
    Tunisia: 'تونس',
    Türkiye: 'تركيا',
    Ukraine: 'أوكرانيا',
    Uruguay: 'أوروغواي',
    USA: 'الولايات المتحدة',
    Uzbekistan: 'أوزبكستان'
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
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }).format(date);
    } catch {
      return value;
    }
  }

  function minutesSinceKickoff(match) {
    if (!match?.date) return null;
    const kickoff = new Date(match.date).getTime();
    if (Number.isNaN(kickoff)) return null;
    const minutes = Math.floor((Date.now() - kickoff) / 60000);
    return minutes >= 0 ? minutes : null;
  }

  function hasKickoffPassed(match) {
    return minutesSinceKickoff(match) !== null;
  }

  function relativeDuration(minutes) {
    if (minutes < 60) {
      return minutes === 1
        ? labels.minute
        : labels.minutes.replace('{count}', String(Math.max(minutes, 0)));
    }
    const hours = Math.floor(minutes / 60);
    return hours === 1
      ? labels.hour
      : labels.hours.replace('{count}', String(hours));
  }

  function startedAgo(match) {
    const minutes = minutesSinceKickoff(match);
    if (minutes === null) return null;
    return labels.startedAgo.replace('{time}', relativeDuration(minutes));
  }

  function statusText(match) {
    const short = match.status?.short || '';
    if (short === 'FT') return labels.ft;
    if (short === 'HT') return labels.ht;
    if (match.status?.elapsed) return `${match.status.elapsed}′`;
    if (short === 'NS') return startedAgo(match) || match.status?.long || labels.tbd;
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
    const active = live || hasKickoffPassed(match);
    return `<article class="wc-mini-match${live ? ' is-live' : ''}">
      <div class="wc-mini-code">${escapeHtml(teamCode(match.home))} <span>${score(match) === 'vs' ? 'vs' : score(match)}</span> ${escapeHtml(teamCode(match.away))}</div>
      <div class="wc-mini-time">${escapeHtml(active ? statusText(match) : compactDate(match.date))}</div>
      <div class="wc-mini-flags"><span>${escapeHtml(flag(match.home))}</span><span>${escapeHtml(flag(match.away))}</span></div>
    </article>`;
  }

  function renderCompact(data) {
    const live = Array.isArray(data.live) ? data.live : [];
    const upcoming = Array.isArray(data.fixtures) ? data.fixtures.slice(0, live.length ? 2 : 4) : [];
    const recent = data.status === 'ok' && Array.isArray(data.recent) ? data.recent.slice(0, 2) : [];
    const primary = live.length ? live : upcoming;
    const heading = live.length ? labels.liveNow : labels.upcoming;
    const liveHref = rtl ? '/ar/world-cup-2026-live.html' : '/en/world-cup-2026-live.html';
    root.innerHTML = `<section class="wc-mini-widget">
      <div class="wc-mini-head"><div><span class="category-badge">World Cup 2026</span><h2>${escapeHtml(heading)}</h2></div><a href="${liveHref}">${escapeHtml(labels.openLive)} →</a></div>
      <div class="wc-mini-list" role="list">${primary.length ? primary.map((item) => compactMatch(item, live.length > 0)).join('') : `<p class="wc-empty">${escapeHtml(labels.noFixtures)}</p>`}</div>
      <p class="wc-mini-zone">${escapeHtml(timeZoneNote())}</p>
      ${recent.length ? `<details class="wc-mini-recent"><summary>${escapeHtml(labels.recent)}</summary>${recent.map((item) => compactMatch(item, false)).join('')}</details>` : ''}
    </section>`;
  }

  function matchBoardCard(match, live) {
    const active = live || hasKickoffPassed(match);
    return `<article class="wc-google-match${active ? ' is-live' : ''}">
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

  function renderTabs(active, options = {}) {
    const tabs = [
      ['overview', labels.overview],
      ['matches', labels.matches],
      ['table', labels.table],
      ['knockout', labels.knockout]
    ].concat(options.hasStats ? [
      ['stats', labels.stats],
      ['players', labels.players]
    ] : []);
    return `<nav class="wc-google-tabs" aria-label="World Cup sections">${tabs.map(([id, label]) => `<a class="${active === id ? 'active' : ''}" href="#wc-${id}">${escapeHtml(label)}</a>`).join('')}</nav>`;
  }

  function cell(value) {
    return value === null || value === undefined ? '—' : value;
  }

  function renderGoogleTable(groups) {
    if (!groups || !groups.length) return `<p class="wc-empty">${escapeHtml(labels.noStandings)}</p>`;
    return groups.map((group, index) => {
      const rows = Array.isArray(group) ? group : (group.rows || []);
      const groupName = group.name || `${rtl ? 'المجموعة' : 'Group'} ${String.fromCharCode(65 + index)}`;
      return `<section class="wc-google-group">
      <h3>${escapeHtml(rtl ? groupName.replace('Group', 'المجموعة') : groupName)}</h3>
      <div class="wc-google-table-scroll"><table class="wc-google-table">
        <thead><tr><th>${rtl ? 'المنتخب' : 'Team'}</th><th>MP</th><th>W</th><th>D</th><th>L</th><th>Pts</th><th>GF</th><th>GA</th><th>GD</th></tr></thead>
        <tbody>${rows.map((row) => `<tr><td><span>${row.rank ?? ''}</span>${team(row.team)}</td><td>${cell(row.played)}</td><td>${cell(row.won)}</td><td>${cell(row.drawn)}</td><td>${cell(row.lost)}</td><td><strong>${cell(row.points)}</strong></td><td>${cell(row.goalsFor)}</td><td>${cell(row.goalsAgainst)}</td><td>${cell(row.goalsDiff)}</td></tr>`).join('')}</tbody>
      </table></div>
    </section>`;
    }).join('');
  }

  function renderStats(stats) {
    if (!stats) return '';
    const players = Array.isArray(stats.players) ? stats.players : [];
    if (!players.length) return '';
    return `<section id="wc-stats" class="wc-google-section"><h2>${escapeHtml(labels.stats)}</h2><div class="wc-google-table-scroll"><table class="wc-google-table">
      <thead><tr><th>${rtl ? 'اللاعب' : 'Player'}</th><th>${rtl ? 'المنتخب' : 'Team'}</th><th>${rtl ? 'الأهداف' : 'Goals'}</th></tr></thead>
      <tbody>${players.map((player) => `<tr><td>${escapeHtml(player.name)}</td><td>${escapeHtml(teamName(player.team || ''))}</td><td><strong>${cell(player.goals)}</strong></td></tr>`).join('')}</tbody>
    </table></div></section>`;
  }

  function groupLetter(round) {
    const match = String(round || '').match(/Group\s+([A-L])/i);
    return match ? match[1].toUpperCase() : labels.tbd;
  }

  function renderGroupStage(results, fixtures) {
    const confirmed = Array.isArray(results) ? results : [];
    const scheduled = Array.isArray(fixtures) ? fixtures : [];
    const combined = confirmed.concat(scheduled);
    if (!combined.length) return `<p class="wc-empty">${escapeHtml(labels.noFixtures)}</p>`;
    const groups = combined.reduce((map, item) => {
      const group = groupLetter(item.round);
      if (!map.has(group)) map.set(group, []);
      map.get(group).push(item);
      return map;
    }, new Map());
    return `<div class="wc-group-results">${Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([group, items]) => `
      <section class="wc-group-result">
        <h3>${rtl ? 'المجموعة' : 'Group'} ${escapeHtml(group)}</h3>
        <div class="wc-google-match-list">${items.map((item) => matchBoardCard(item, Boolean(item.status?.elapsed))).join('')}</div>
      </section>`).join('')}</div>`;
  }

  function bindMoreMatches() {
    const button = root.querySelector('[data-wc-more]');
    if (!button) return;
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      root.querySelectorAll('[data-wc-extra]').forEach((node) => {
        node.hidden = expanded;
      });
      button.setAttribute('aria-expanded', String(!expanded));
      button.textContent = expanded ? `${labels.moreMatches} ›` : `${labels.lessMatches} ↑`;
    });
  }

  function render(data) {
    const ok = data.status === 'ok' || data.status === 'seeded';
    const title = data.status === 'seeded' ? labels.verifiedSchedule : (data.status === 'ok' ? labels.api : labels.unavailable);
    const updated = data.updatedAt ? `${labels.updated}: ${formatDate(data.updatedAt)}` : '';
    const live = Array.isArray(data.live) ? data.live : [];
    const fixtures = Array.isArray(data.fixtures) ? data.fixtures : [];
    const recent = data.status === 'ok' && Array.isArray(data.recent) ? data.recent : [];
    const hasStats = Boolean(data.stats && Array.isArray(data.stats.players) && data.stats.players.length);
    const featuredMatches = live.length ? live : fixtures.slice(0, 6);
    const extraMatches = live.length ? [] : fixtures.slice(6);
    root.innerHTML = `<section class="wc-google-board">
      <header class="wc-google-hero">
        <div>
          <p>FIFA World Cup 2026™</p>
          <h1>${rtl ? 'كأس العالم 2026' : 'FIFA World Cup 2026™'}</h1>
        </div>
        <span class="${ok ? 'ok' : 'pending'}">${ok ? '●' : '○'} ${escapeHtml(title)}</span>
      </header>
      ${renderTabs('overview', { hasStats })}
      <small class="wc-google-updated">${escapeHtml(updated)}</small>
      <section id="wc-matches" class="wc-google-section">
        <h2>${escapeHtml(labels.matches)}</h2>
        <div class="wc-google-match-list">${featuredMatches.length ? featuredMatches.map((item) => matchBoardCard(item, live.length > 0)).join('') : `<p class="wc-empty">${escapeHtml(labels.noFixtures)}</p>`}${extraMatches.map((item) => `<div data-wc-extra hidden>${matchBoardCard(item, false)}</div>`).join('')}</div>
        ${extraMatches.length ? `<button class="wc-google-more" type="button" data-wc-more aria-expanded="false">${escapeHtml(labels.moreMatches)} ›</button>` : ''}
        <p class="wc-google-note">${escapeHtml(timeZoneNote())}</p>
      </section>
      <section id="wc-group-stage-results" class="wc-google-section">
        <h2>${escapeHtml(labels.groupStageResults)}</h2>
        ${recent.length ? '' : `<p class="wc-empty">${escapeHtml(labels.noGroupResults)}</p>`}
        ${renderGroupStage(recent, fixtures)}
      </section>
      <section id="wc-overview" class="wc-google-section"><h2>${escapeHtml(labels.recent)}</h2>${recent.length ? `<div class="wc-google-match-list recent">${recent.slice(0, 4).map((item) => matchBoardCard(item, false)).join('')}</div>` : `<p class="wc-empty">${escapeHtml(labels.noVerifiedResults)}</p>`}</section>
      <section id="wc-table" class="wc-google-section">
        <h2>${escapeHtml(labels.table)}</h2>
        <div class="wc-google-subtabs"><span class="active">${escapeHtml(labels.groupStage)}</span><span>${escapeHtml(labels.knockoutStage)}</span></div>
        ${renderGoogleTable(data.standings)}
      </section>
      <section id="wc-knockout" class="wc-google-section"><h2>${escapeHtml(labels.knockout)}</h2>${matchList(fixtures.slice(0, 4), labels.noFixtures, false)}</section>
      ${renderStats(data.stats)}
    </section>`;
    bindMoreMatches();
  }

  root.innerHTML = `<p class="wc-empty">${escapeHtml(labels.loading)}</p>`;
  function fetchJson(url) {
    return fetch(url, { cache: 'no-store' }).then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    });
  }

  const cacheBuster = `v=${Date.now()}`;
  const feedUrls = [
    `/api/world-cup-2026.json?${cacheBuster}`,
    `https://doyouknow.app/api/world-cup-2026.json?${cacheBuster}`
  ];
  let loadedData = null;

  feedUrls.reduce((promise, url) => promise.catch(() => fetchJson(url)), Promise.reject())
    .then((data) => {
      loadedData = data;
      compact ? renderCompact(data) : render(data);
      if (typeof window !== 'undefined') {
        window.setInterval(() => {
          if (!loadedData) return;
          compact ? renderCompact(loadedData) : render(loadedData);
        }, 60000);
      }
    })
    .catch(() => {
      root.innerHTML = `<p class="wc-empty">${escapeHtml(labels.error)}</p>`;
    });
})();
