(() => {
  const local = localStorage.getItem('visa_data_override_v1');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) window.VISA_DATA = parsed;
    } catch (error) {
      console.warn('本地覆盖数据解析失败，已回退默认数据。', error);
    }
  }

  const data = Array.isArray(window.VISA_DATA) ? window.VISA_DATA : [];
  const byCountry = (country) => data.find((item) => item.country === country);
  const isPolicyPage = location.pathname.toLowerCase().includes('/policy/');
  const flagBase = isPolicyPage ? '../assets/flags/' : './assets/flags/';

  const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const flagHtml = (item) => {
    if (!item?.flagCode) return '';
    const code = String(item.flagCode).toLowerCase();
    const country = escapeHtml(item.country);
    return `<img class="flag-icon" src="${flagBase}${code}.svg" alt="${country}国旗" loading="lazy" decoding="async" />`;
  };

  const listHtml = (items) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

  const fillSelect = (selector, placeholder = '请选择国家') => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.innerHTML = `<option value="">${placeholder}</option>` +
      data.map((item) => `<option value="${escapeHtml(item.country)}">${escapeHtml(item.country)}</option>`).join('');
  };

  const renderHomeCards = () => {
    const homeCards = document.querySelector('#homeCards');
    if (!homeCards) return;

    homeCards.innerHTML = data.slice(0, 6).map((item, index) => `
      <a class="card card-link country-card" style="--card-index:${index}" href="./policy/index.html?country=${encodeURIComponent(item.country)}">
        <div class="country-card-top">
          <h3>${flagHtml(item)}${escapeHtml(item.country)}</h3>
          <span class="status-pill ${item.visaRequiredCN ? 'need' : 'free'}">${item.visaRequiredCN ? '需签证' : '免签'}</span>
        </div>
        <p><strong>适用：</strong>中国大陆普通护照</p>
        <p><strong>规则：</strong>${escapeHtml(item.entryRuleCN)}</p>
        <p><strong>停留：</strong>${escapeHtml(item.stay)}</p>
        <span class="card-more">查看材料与风险</span>
      </a>
    `).join('');
  };

  const getFilteredCountries = () => {
    const keyword = (document.querySelector('#policySearch')?.value || '').trim().toLowerCase();
    const region = document.querySelector('#policyRegion')?.value || '全部';

    return data.filter((item) => {
      const matchRegion = region === '全部' || item.region === region;
      const matchKeyword = !keyword ||
        item.country.toLowerCase().includes(keyword) ||
        item.visaType.toLowerCase().includes(keyword) ||
        item.entryRuleCN.toLowerCase().includes(keyword);
      return matchRegion && matchKeyword;
    });
  };

  const renderCountryListAndDetail = () => {
    const listEl = document.querySelector('#policyCountryList');
    const detailEl = document.querySelector('#policyDetailPane');
    const metaEl = document.querySelector('#policyMeta');
    if (!listEl || !detailEl) return;

    const filtered = getFilteredCountries();
    const queryCountry = new URLSearchParams(location.search).get('country');
    const fallback = filtered[0]?.country || data[0]?.country;
    const current = byCountry(window.__activeCountry || queryCountry || fallback);

    if (metaEl) {
      metaEl.textContent = `共 ${filtered.length} 个匹配国家，当前数据仅适用于中国大陆普通护照。`;
    }

    listEl.innerHTML = filtered.map((item) => `
      <button class="country-item ${current?.country === item.country ? 'active' : ''}" data-country="${escapeHtml(item.country)}" type="button">
        <strong>${flagHtml(item)}${escapeHtml(item.country)}</strong>
        <span>${escapeHtml(item.entryRuleCN)} · ${escapeHtml(item.stay)}</span>
      </button>
    `).join('') || '<p class="tip-muted">没有匹配的国家。</p>';

    if (!current) {
      detailEl.innerHTML = '<p class="tip-muted">请选择国家查看详情。</p>';
      return;
    }

    const entryTips = current.visaRequiredCN
      ? [
          '入境时建议携带已获签护照、往返机票和住宿信息。',
          '边检可能询问出行目的与停留计划，口径需与申请材料一致。',
          `重点关注：${current.riskTips?.[0] || '材料真实完整'}。`
        ]
      : [
          '免签不等于无条件入境，边检仍有最终裁量权。',
          '建议准备返程/离境机票、住宿证明与基础资金证明。',
          `重点关注：${current.riskTips?.[0] || '遵守停留天数限制'}。`
        ];

    const officialVisaUrl = current.officialRefs?.[0] || '';
    window.__activeCountry = current.country;

    detailEl.innerHTML = `
      <div class="detail-title-row">
        <h3>${flagHtml(current)}${escapeHtml(current.country)} · ${escapeHtml(current.visaType)}</h3>
        <span class="status-pill ${current.visaRequiredCN ? 'need' : 'free'}">${current.visaRequiredCN ? '需签证' : '免签'}</span>
      </div>
      <div class="detail-cta-row">
        ${officialVisaUrl ? `<a class="btn btn-solid" href="${escapeHtml(officialVisaUrl)}" target="_blank" rel="noopener noreferrer">签证官网</a>` : ''}
      </div>

      <div class="detail-summary">
        <p><strong>适用人群</strong><span>中国大陆普通护照</span></p>
        <p><strong>签证规则</strong><span>${escapeHtml(current.entryRuleCN)}</span></p>
        <p><strong>停留规则</strong><span>${escapeHtml(current.stay)}</span></p>
        <p><strong>办理时长</strong><span>${escapeHtml(current.processing)}</span></p>
        <p><strong>费用参考</strong><span>${escapeHtml(current.fee)}</span></p>
        <p><strong>建议提交</strong><span>${escapeHtml(current.leadTime)}</span></p>
      </div>

      <h4>材料清单</h4>
      <p><strong>核心材料：</strong>${escapeHtml(current.coreDocs.join('、'))}</p>
      <p><strong>补充材料：</strong>${escapeHtml(current.extraDocs.join('、'))}</p>
      <p><strong>官方路径：</strong>${escapeHtml(current.officialStep)}</p>

      <h4>入境提示</h4>
      <ul class="risk-list">${listHtml(entryTips)}</ul>

      <h4>高频风险</h4>
      <ul class="risk-list">${listHtml(current.riskTips || [])}</ul>

      <h4>常见细节问题</h4>
      <ul class="risk-list">${listHtml(current.communityIssues || [])}</ul>

      <h4>官方参考链接</h4>
      <ul class="risk-list official-links">${(current.officialRefs || []).map((url) => `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></li>`).join('')}</ul>
      <p class="tip-muted">提示：规则以各国移民、外交或使领馆最新公告为准。</p>
    `;
  };

  const bindPolicyPage = () => {
    const listEl = document.querySelector('#policyCountryList');
    if (!listEl) return;

    listEl.addEventListener('click', (event) => {
      const target = event.target.closest('.country-item');
      if (!target?.dataset.country) return;
      window.__activeCountry = target.dataset.country;
      history.replaceState(null, '', `?country=${encodeURIComponent(target.dataset.country)}`);
      renderCountryListAndDetail();
      if (window.matchMedia('(max-width: 980px)').matches) {
        document.querySelector('#policyDetailPane')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    ['#policySearch', '#policyRegion'].forEach((selector) => {
      document.querySelector(selector)?.addEventListener('input', renderCountryListAndDetail);
      document.querySelector(selector)?.addEventListener('change', renderCountryListAndDetail);
    });

    document.querySelector('#policyReset')?.addEventListener('click', () => {
      const search = document.querySelector('#policySearch');
      const region = document.querySelector('#policyRegion');
      if (search) search.value = '';
      if (region) region.value = '全部';
      window.__activeCountry = '';
      history.replaceState(null, '', location.pathname);
      renderCountryListAndDetail();
    });

    renderCountryListAndDetail();
  };

  const bindCountdown = () => {
    const dayMs = 24 * 60 * 60 * 1000;
    const formatDate = (date) => date.toISOString().slice(0, 10);
    const addDays = (date, days) => new Date(date.getTime() + days * dayMs);
    const daysBetween = (from, to) => Math.ceil((to.getTime() - from.getTime()) / dayMs);
    const getPlan = (item, readiness, urgency) => {
      const countryPlans = {
        '美国': { ideal: 90, latest: 45, review: 21, buffer: 14, type: '面签预约', focus: 'DS-160、缴费、预约和面谈材料口径' },
        '英国': { ideal: 60, latest: 28, review: 15, buffer: 10, type: '在线申请', focus: '资金来源、访问目的和离境意图' },
        '法国（申根）': { ideal: 60, latest: 25, review: 14, buffer: 10, type: '申根预约', focus: '保险、主停留国、机酒交通一致性' },
        '德国（申根）': { ideal: 60, latest: 25, review: 14, buffer: 10, type: '申根预约', focus: '保险、翻译件、资金流水和交通衔接' },
        '加拿大': { ideal: 75, latest: 35, review: 20, buffer: 14, type: '在线申请+生物信息', focus: '生物信息预约、补料响应和资金来源' },
        '澳大利亚': { ideal: 65, latest: 30, review: 18, buffer: 12, type: '在线申请', focus: '真实访客意图、资金闭环和临时访问说明' },
        '新西兰': { ideal: 65, latest: 30, review: 18, buffer: 12, type: '在线申请', focus: '资金、离境计划和真实访问意图' },
        '日本': { ideal: 45, latest: 18, review: 9, buffer: 7, type: '材料递交', focus: '在职/在读证明、日程表和资金证明' },
        '韩国': { ideal: 40, latest: 16, review: 8, buffer: 7, type: '材料递交', focus: '照片规格、资产证明和行程真实性' }
      };
      const visaFreePlans = {
        '新加坡': { ideal: 7, latest: 3, review: 2, buffer: 1, type: '免签入境核查', focus: 'SG Arrival Card、护照有效期、离境机票和住宿' },
        '泰国': { ideal: 7, latest: 3, review: 2, buffer: 1, type: '免签入境核查', focus: '护照有效期、返程机票、住宿和停留天数' }
      };
      const base = item.visaRequiredCN
        ? (countryPlans[item.country] || { ideal: 55, latest: 24, review: 12, buffer: 8, type: '签证申请', focus: '资金、行程和材料一致性' })
        : (visaFreePlans[item.country] || { ideal: 7, latest: 3, review: 2, buffer: 1, type: '免签入境核查', focus: '护照、离境机票、住宿和停留限制' });

      const readinessPenalty = readiness === 'none' ? 10 : readiness === 'partial' ? 4 : 0;
      const urgencyBuffer = urgency === 'peak' ? 10 : urgency === 'urgent' ? -7 : 0;
      const ideal = Math.max(base.latest + 3, base.ideal + readinessPenalty + urgencyBuffer);
      const latest = Math.max(base.review + 2, base.latest + Math.max(0, readinessPenalty - 4));
      return { ...base, ideal, latest };
    };
    const renderStep = (date, title, desc, tone = '') => `
      <div class="timeline-step ${tone}">
        <time>${formatDate(date)}</time>
        <div><strong>${title}</strong><span>${desc}</span></div>
      </div>
    `;

    document.querySelector('#countBtn')?.addEventListener('click', () => {
      const country = document.querySelector('#countCountry')?.value;
      const date = document.querySelector('#departDate')?.value;
      const readiness = document.querySelector('#countReadiness')?.value || 'partial';
      const urgency = document.querySelector('#countUrgency')?.value || 'normal';
      const out = document.querySelector('#countResult');
      const item = byCountry(country);
      if (!out) return;
      if (!item || !date) {
        out.innerHTML = '<p class="tip-muted">请选择国家和出发日期后生成时间线。</p>';
        return;
      }

      const depart = new Date(`${date}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const remaining = daysBetween(today, depart);
      const plan = getPlan(item, readiness, urgency);
      const idealDate = addDays(depart, -plan.ideal);
      const latestDate = addDays(depart, -plan.latest);
      const reviewDate = addDays(depart, -plan.review);
      const finalDate = addDays(depart, -plan.buffer);
      const isLate = today > latestDate;
      const isTight = today > idealDate && today <= latestDate;
      const status = isLate ? 'high' : isTight ? 'medium' : 'low';
      const statusText = isLate ? '时间偏紧' : isTight ? '仍可推进' : '时间充足';
      const primaryAdvice = isLate
        ? '建议立刻确认预约/递交通道，并优先补齐硬性材料；如预约不可控，需准备调整行程。'
        : isTight
          ? '建议本周内完成材料核对和预约，避免补料或预约紧张压缩行程。'
          : '可以按稳妥节奏准备，先完成材料闭环，再递交或预约。';

      out.innerHTML = `
        <div class="count-summary ${status}">
          <strong>${item.country} · ${plan.type}</strong>
          <span>${statusText}，距离出发 ${remaining} 天。${primaryAdvice}</span>
        </div>
        <div class="timeline">
          ${renderStep(idealDate, '稳妥启动', `开始整理材料。重点：${plan.focus}。`, 'soft')}
          ${renderStep(latestDate, item.visaRequiredCN ? '建议最晚递交/预约' : '最晚完成入境材料核查', item.visaRequiredCN ? '晚于此日期会明显压缩补料、预约和出签缓冲。' : '免签目的地仍需完成护照、离境机票、住宿和入境卡核查。', isLate ? 'danger' : 'strong')}
          ${renderStep(reviewDate, '补料与结果缓冲', item.visaRequiredCN ? '预留补料、行政处理、快递或取件时间。' : '再次确认停留天数、住宿和离境安排。')}
          ${renderStep(finalDate, '出发前最终核查', '检查护照、签证/入境许可、机票、住宿、保险、资金证明和官方最新公告。')}
        </div>
      `;
    });
  };

  const renderFaq = (country) => {
    const box = document.querySelector('#smartFaq');
    const item = byCountry(country);
    if (!box) return;

    if (!item) {
      box.innerHTML = '<p class="tip-muted">请选择国家查看常见问题。</p>';
      return;
    }

    box.innerHTML = `
      <details><summary>${escapeHtml(item.country)} 对大陆护照是否需要签证？</summary><p>${escapeHtml(item.entryRuleCN)}</p></details>
      <details><summary>建议提前多久准备材料？</summary><p>${escapeHtml(item.leadTime)}。旺季或首次办理建议再提前 1-2 周。</p></details>
      <details><summary>常见材料短板是什么？</summary><p>${escapeHtml(item.riskTips.join('；'))}。</p></details>
      <details><summary>哪些情况容易被补材料？</summary><p>${escapeHtml(item.communityIssues.slice(0, 2).join('；'))}。</p></details>
      <details><summary>资金证明怎么准备更稳妥？</summary><p>通常建议提供 3-6 个月稳定流水，余额与行程预算匹配，避免临时大额转入无法解释。</p></details>
      <details><summary>免签国家还需要准备什么？</summary><p>仍建议准备护照有效期证明、返程机票、住宿信息和基础资金证明，避免入境问询时材料不足。</p></details>
    `;
  };

  const bindFaq = () => {
    const faqSelect = document.querySelector('#faqCountry');
    if (!faqSelect) return;
    renderFaq('');
    faqSelect.addEventListener('change', (event) => {
      renderFaq(event.target.value);
    });
  };

  renderHomeCards();
  bindPolicyPage();
  ['#evalCountry', '#countCountry', '#faqCountry'].forEach((selector) => fillSelect(selector));
  bindCountdown();
  bindFaq();
})();
