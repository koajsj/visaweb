(() => {
  const localOverride = localStorage.getItem('visa_data_override_v1');
  if (localOverride) {
    try {
      const parsed = JSON.parse(localOverride);
      if (Array.isArray(parsed)) window.VISA_DATA = parsed;
    } catch (error) {
      console.warn('本地签证数据覆盖解析失败，已使用默认数据。', error);
    }
  }

  const data = Array.isArray(window.VISA_DATA) ? window.VISA_DATA : [];
  const byCountry = (country) => data.find((item) => item.country === country);
  const isPolicyPage = location.pathname.toLowerCase().includes('/policy/');
  const flagBase = isPolicyPage ? '../assets/flags/' : './assets/flags/';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeCountry = new URLSearchParams(location.search).get('country') || data[0]?.country || '';

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const listHtml = (items = []) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

  const flagHtml = (item) => {
    if (!item?.flagCode) return '';
    const country = escapeHtml(item.country);
    return `<img class="flag-icon" src="${flagBase}${escapeHtml(item.flagCode)}.svg" alt="${country}国旗" loading="lazy" decoding="async" />`;
  };

  const initReveal = () => {
    const items = Array.from(document.querySelectorAll('.reveal'));
    if (!items.length) return;
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      items.forEach((item) => item.classList.add('show'));
      return;
    }
    items.forEach((item, index) => item.style.setProperty('--reveal-delay', `${Math.min(index * 34, 170)}ms`));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -34px 0px' });
    items.forEach((item) => observer.observe(item));
  };

  const fillSelect = (selector, placeholder = '请选择国家') => {
    const select = document.querySelector(selector);
    if (!select) return;
    select.innerHTML = `<option value="">${placeholder}</option>` +
      data.map((item) => `<option value="${escapeHtml(item.country)}">${escapeHtml(item.country)}</option>`).join('');
  };

  const renderHomeCards = () => {
    const target = document.querySelector('#homeCards');
    if (!target) return;
    target.innerHTML = data.slice(0, 6).map((item, index) => `
      <a class="card card-link country-card" style="--card-index:${index}" href="./policy/index.html?country=${encodeURIComponent(item.country)}">
        <div class="country-card-top">
          <h3>${flagHtml(item)}${escapeHtml(item.country)}</h3>
          <span class="status-pill ${item.visaRequiredCN ? 'need' : 'free'}">${item.visaRequiredCN ? '需签证' : '免签'}</span>
        </div>
        <p><strong>规则：</strong>${escapeHtml(item.entryRuleCN)}</p>
        <p><strong>停留：</strong>${escapeHtml(item.stay)}</p>
        <p><strong>准备：</strong>${escapeHtml(item.leadTime)}</p>
        <span class="card-more">查看材料与风险</span>
      </a>
    `).join('');
  };

  const getFilteredCountries = () => {
    const keyword = (document.querySelector('#policySearch')?.value || '').trim().toLowerCase();
    const region = document.querySelector('#policyRegion')?.value || '全部';
    return data.filter((item) => {
      const matchRegion = region === '全部' || item.region === region;
      const searchable = [item.country, item.region, item.visaType, item.entryRuleCN, item.stay].join(' ').toLowerCase();
      return matchRegion && (!keyword || searchable.includes(keyword));
    });
  };

  const renderPolicy = () => {
    const listEl = document.querySelector('#policyCountryList');
    const detailEl = document.querySelector('#policyDetailPane');
    const metaEl = document.querySelector('#policyMeta');
    if (!listEl || !detailEl) return;

    const filtered = getFilteredCountries();
    if (!filtered.some((item) => item.country === activeCountry)) activeCountry = filtered[0]?.country || data[0]?.country || '';
    const current = byCountry(activeCountry);

    if (metaEl) {
      metaEl.textContent = `共 ${filtered.length} 个匹配目的地。当前数据面向中国大陆普通护照，出行前仍需以官方公告为准。`;
    }

    listEl.innerHTML = filtered.map((item) => `
      <button class="country-item ${item.country === activeCountry ? 'active' : ''}" data-country="${escapeHtml(item.country)}" type="button">
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
          '入境时建议携带已获签护照、往返机票、住宿信息和行程说明。',
          '边检可能询问出行目的与停留计划，回答口径需与申请材料一致。',
          `重点关注：${current.riskTips?.[0] || '材料真实完整'}。`
        ]
      : [
          '免签不等于无条件入境，边检仍有最终裁量权。',
          '建议准备离境机票、住宿信息、行程安排和基础资金证明。',
          `重点关注：${current.riskTips?.[0] || '停留天数限制'}。`
        ];

    const officialUrl = current.officialRefs?.[0] || '';
    detailEl.innerHTML = `
      <div class="detail-title-row">
        <h3>${flagHtml(current)}${escapeHtml(current.country)} · ${escapeHtml(current.visaType)}</h3>
        <span class="status-pill ${current.visaRequiredCN ? 'need' : 'free'}">${current.visaRequiredCN ? '需签证' : '免签'}</span>
      </div>
      <div class="detail-cta-row">
        ${officialUrl ? `<a class="btn btn-solid" href="${escapeHtml(officialUrl)}" target="_blank" rel="noopener noreferrer">打开官方入口</a>` : ''}
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
      <p><strong>核心材料：</strong>${escapeHtml((current.coreDocs || []).join('、'))}</p>
      <p><strong>补充材料：</strong>${escapeHtml((current.extraDocs || []).join('、'))}</p>
      <p><strong>官方路径：</strong>${escapeHtml(current.officialStep)}</p>
      <h4>入境提示</h4>
      <ul class="risk-list">${listHtml(entryTips)}</ul>
      <h4>高频风险</h4>
      <ul class="risk-list">${listHtml(current.riskTips)}</ul>
      <h4>常见细节问题</h4>
      <ul class="risk-list">${listHtml(current.communityIssues)}</ul>
      <h4>官方参考链接</h4>
      <ul class="risk-list official-links">${(current.officialRefs || []).map((url) => `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></li>`).join('')}</ul>
      <p class="tip-muted">提示：签证规则会变化，最终以目的地官方移民、外交或使领馆公告为准。</p>
    `;
  };

  const bindPolicy = () => {
    const listEl = document.querySelector('#policyCountryList');
    if (!listEl) return;
    listEl.addEventListener('click', (event) => {
      const button = event.target.closest('.country-item');
      if (!button?.dataset.country) return;
      activeCountry = button.dataset.country;
      history.replaceState(null, '', `?country=${encodeURIComponent(activeCountry)}`);
      renderPolicy();
      if (window.matchMedia('(max-width: 980px)').matches) {
        document.querySelector('#policyDetailPane')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
    ['#policySearch', '#policyRegion'].forEach((selector) => {
      document.querySelector(selector)?.addEventListener('input', renderPolicy);
      document.querySelector(selector)?.addEventListener('change', renderPolicy);
    });
    document.querySelector('#policyReset')?.addEventListener('click', () => {
      const search = document.querySelector('#policySearch');
      const region = document.querySelector('#policyRegion');
      if (search) search.value = '';
      if (region) region.value = '全部';
      activeCountry = data[0]?.country || '';
      history.replaceState(null, '', location.pathname);
      renderPolicy();
    });
    renderPolicy();
  };

  const initEval = () => {
    const form = document.querySelector('#visaEvalForm');
    if (!form) return;
    const docRange = document.querySelector('#evalDocs');
    const docValue = document.querySelector('#evalDocsValue');
    const result = {
      rate: document.querySelector('#evalRate'),
      level: document.querySelector('#evalLevel'),
      advice: document.querySelector('#evalAdvice'),
      breakdown: document.querySelector('#evalBreakdown')
    };
    const get = (id) => document.querySelector(id)?.value || '';
    const checked = (id) => Boolean(document.querySelector(id)?.checked);
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const scoreText = (value) => `${value > 0 ? '+' : ''}${value}`;
    const countryDifficulty = {
      美国: -11,
      英国: -7,
      加拿大: -7,
      '法国（申根）': -5,
      '德国（申根）': -5,
      澳大利亚: -6,
      新西兰: -5,
      日本: 2,
      韩国: 1,
      新加坡: 12,
      泰国: 12
    };
    const countryFocus = {
      美国: ['DS-160 与面签口径一致', '国内约束力证明', '旅行目的清晰'],
      英国: ['资金来源解释', '访问目的合理', '按期离境证明'],
      加拿大: ['生物信息预约', '资金与访问目的一致', '补件响应'],
      澳大利亚: ['Genuine Visitor 真实访问意图', '资金与收入闭环', '临时访问目的'],
      新西兰: ['真实访问意图', '生活资金覆盖', '离境计划'],
      '法国（申根）': ['保险覆盖申根要求', '主停留国一致', '机酒交通匹配'],
      '德国（申根）': ['翻译件规范', '资金流水解释', '行程衔接'],
      日本: ['在职/在读证明', '日程表与资金匹配', '材料信息一致'],
      韩国: ['照片与表格规格', '资产/收入证明', '行程真实性'],
      新加坡: ['SG Arrival Card', '护照有效期', '离境机票与住宿'],
      泰国: ['护照有效期', '返程机票', '停留天数限制']
    };

    const updateRange = () => {
      if (docRange && docValue) docValue.textContent = `${docRange.value}%`;
    };
    docRange?.addEventListener('input', updateRange);
    updateRange();

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const country = get('#evalCountry');
      const selected = byCountry(country);
      if (!selected) {
        result.rate.textContent = '通过率：--';
        result.level.textContent = '风险等级：--';
        result.advice.textContent = '请先选择目标国家。';
        result.breakdown.innerHTML = '<li>选择国家后显示分项评分。</li>';
        return;
      }

      const values = {
        profile: get('#evalProfile'),
        income: get('#evalIncome'),
        travel: get('#evalTravel'),
        refusal: get('#evalRefusal'),
        passport: get('#evalPassport'),
        fund: get('#evalFund'),
        fundSource: get('#evalFundSource'),
        plan: get('#evalPlan'),
        booking: get('#evalBooking'),
        docLegal: get('#evalDocLegal'),
        procedure: get('#evalProcedure'),
        ties: get('#evalTies'),
        consistency: get('#evalConsistency'),
        stayDays: get('#evalStayDays'),
        docs: Number(get('#evalDocs')),
        job: checked('#evalJob')
      };

      const parts = [];
      const weak = [];
      let score = selected.visaRequiredCN ? 48 : 63;
      const add = (label, value, weakText) => {
        parts.push({ label, value });
        score += value;
        if (value < 0 && weakText) weak.push(weakText);
      };

      const maps = {
        profile: { employee: 8, student: 5, owner: 5, retired: 4, freelance: -1, unemployed: -9 },
        income: { low: -4, mid: 6, high: 10 },
        travel: { none: -6, asia: 2, some: 8, many: 12 },
        passport: { weak: -18, normal: 3, strong: 6 },
        fund: { weak: -10, normal: 6, strong: 12 },
        fundSource: { weak: -9, normal: 5, strong: 10 },
        plan: { basic: 1, clear: 6, strong: 10 },
        booking: { none: -8, basic: 4, strong: 9 },
        docLegal: { no: -6, part: 3, yes: 8 },
        procedure: { weak: -6, normal: 3, strong: 7 },
        ties: { weak: -8, normal: 5, strong: 10 },
        consistency: { weak: -9, normal: 5, strong: 10 },
        stayDays: { short: 5, mid: 1, long: -7 }
      };

      add('身份稳定性', maps.profile[values.profile] ?? 0, '身份稳定性证明偏弱');
      add('收入水平', maps.income[values.income] ?? 0, '收入证明偏弱');
      add('出境记录', maps.travel[values.travel] ?? 0, '出境记录较少');
      add('拒签历史', values.refusal === 'yes' ? -16 : 5, '需解释拒签原因和后续变化');
      add('护照有效期', maps.passport[values.passport] ?? 0, '护照有效期不足');
      add('停留时长', maps.stayDays[values.stayDays] ?? 0, '停留时间偏长');
      add('资金覆盖', maps.fund[values.fund] ?? 0, '资金覆盖不足');
      add('资金来源', maps.fundSource[values.fundSource] ?? 0, '资金来源解释不清');
      add('行程真实性', maps.plan[values.plan] ?? 0, '行程说明偏弱');
      add('机酒/邀请材料', maps.booking[values.booking] ?? 0, '缺少住宿、交通或邀请安排');
      add('翻译/公证', maps.docLegal[values.docLegal] ?? 0, '翻译或公证准备不足');
      add('流程准备', maps.procedure[values.procedure] ?? 0, '未确认保险、生物信息或面谈要求');
      add('国内约束力', maps.ties[values.ties] ?? 0, '国内约束力证明偏弱');
      add('表格/口径一致性', maps.consistency[values.consistency] ?? 0, '表格、行程和证明材料尚未核对');
      add('材料完整度', Math.round((values.docs - 70) * 0.45), '材料完整度偏低');
      add('工作/在读证明', values.job ? 5 : -6, '稳定工作或在读证明不足');
      add('目的地难度', countryDifficulty[selected.country] ?? 0);

      if (!selected.visaRequiredCN) {
        if (values.passport === 'weak') add('免签硬性核查', -18, '免签目的地仍通常要求护照有效期充足');
        if (values.booking === 'none') add('入境材料', -10, '免签入境仍建议携带离境机票和住宿信息');
      }

      const finalScore = clamp(Math.round(score), selected.visaRequiredCN ? 18 : 35, 97);
      const level = finalScore >= 82 ? '低' : finalScore >= 63 ? '中' : '高';
      const label = selected.visaRequiredCN ? '通过准备度' : '入境准备度';
      const advice = finalScore >= 82
        ? '准备质量较高，重点保持材料真实、一致，并按官方流程递交或入境核查。'
        : finalScore >= 63
          ? '具备推进基础，但建议优先补齐资金、行程、口径一致性或目的地专项要求。'
          : '当前风险偏高，建议先补强核心材料、解释信和官方流程准备，暂缓仓促递交。';
      const focus = countryFocus[selected.country] || ['材料真实一致', '资金覆盖行程', '按官方流程递交'];

      result.rate.textContent = `${label}：${finalScore}%`;
      result.level.textContent = `风险等级：${level}`;
      result.advice.textContent = advice;
      result.breakdown.innerHTML = `
        <li><strong>重点核查：</strong>${focus.join('；')}</li>
        <li><strong>分项评分：</strong>${parts.map((part) => `${part.label} ${scoreText(part.value)}`).join('；')}</li>
        ${weak.length ? `<li><strong>优先补强：</strong>${weak.slice(0, 6).join('；')}</li>` : '<li><strong>优先补强：</strong>当前没有明显短板，保持材料一致性。</li>'}
      `;
    });
  };

  const bindCountdown = () => {
    const button = document.querySelector('#countBtn');
    if (!button) return;
    const dayMs = 24 * 60 * 60 * 1000;
    const formatDate = (date) => date.toISOString().slice(0, 10);
    const addDays = (date, days) => new Date(date.getTime() + days * dayMs);
    const daysBetween = (from, to) => Math.ceil((to.getTime() - from.getTime()) / dayMs);
    const planByCountry = {
      美国: { ideal: 90, latest: 45, review: 21, buffer: 14, type: '面签预约', focus: 'DS-160、缴费、预约和面谈材料口径' },
      英国: { ideal: 60, latest: 28, review: 15, buffer: 10, type: '在线申请', focus: '资金来源、访问目的和离境意图' },
      加拿大: { ideal: 75, latest: 35, review: 20, buffer: 14, type: '在线申请 + 生物信息', focus: '生物信息预约、补件响应和资金来源' },
      澳大利亚: { ideal: 65, latest: 30, review: 18, buffer: 12, type: '在线申请', focus: '真实访问意图、资金闭环和临时访问说明' },
      新西兰: { ideal: 65, latest: 30, review: 18, buffer: 12, type: '在线申请', focus: '资金、离境计划和真实访问意图' },
      '法国（申根）': { ideal: 60, latest: 25, review: 14, buffer: 10, type: '申根预约', focus: '保险、主停留国、机酒交通一致性' },
      '德国（申根）': { ideal: 60, latest: 25, review: 14, buffer: 10, type: '申根预约', focus: '保险、翻译件、资金流水和交通衔接' },
      日本: { ideal: 45, latest: 18, review: 9, buffer: 7, type: '材料递交', focus: '在职/在读证明、日程表和资金证明' },
      韩国: { ideal: 40, latest: 16, review: 8, buffer: 7, type: '材料递交', focus: '照片规格、资产证明和行程真实性' }
    };
    const defaultVisa = { ideal: 55, latest: 24, review: 12, buffer: 8, type: '签证申请', focus: '资金、行程和材料一致性' };
    const defaultFree = { ideal: 7, latest: 3, review: 2, buffer: 1, type: '免签入境核查', focus: '护照、离境机票、住宿和停留限制' };
    const renderStep = (date, title, desc, tone = '') => `
      <div class="timeline-step ${tone}">
        <time>${formatDate(date)}</time>
        <div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(desc)}</span></div>
      </div>
    `;

    button.addEventListener('click', () => {
      const country = document.querySelector('#countCountry')?.value;
      const departValue = document.querySelector('#departDate')?.value;
      const readiness = document.querySelector('#countReadiness')?.value || 'partial';
      const urgency = document.querySelector('#countUrgency')?.value || 'normal';
      const output = document.querySelector('#countResult');
      const item = byCountry(country);
      if (!output) return;
      if (!item || !departValue) {
        output.innerHTML = '<p class="tip-muted">请选择国家和出发日期后生成时间线。</p>';
        return;
      }

      const depart = new Date(`${departValue}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const base = item.visaRequiredCN ? (planByCountry[item.country] || defaultVisa) : defaultFree;
      const readinessPenalty = readiness === 'none' ? 10 : readiness === 'partial' ? 4 : 0;
      const urgencyBuffer = urgency === 'peak' ? 10 : urgency === 'urgent' ? -7 : 0;
      const plan = {
        ...base,
        ideal: Math.max(base.latest + 3, base.ideal + readinessPenalty + urgencyBuffer),
        latest: Math.max(base.review + 2, base.latest + Math.max(0, readinessPenalty - 4))
      };
      const idealDate = addDays(depart, -plan.ideal);
      const latestDate = addDays(depart, -plan.latest);
      const reviewDate = addDays(depart, -plan.review);
      const finalDate = addDays(depart, -plan.buffer);
      const remaining = daysBetween(today, depart);
      const isLate = today > latestDate;
      const isTight = today > idealDate && today <= latestDate;
      const status = isLate ? 'high' : isTight ? 'medium' : 'low';
      const statusText = isLate ? '时间偏紧' : isTight ? '仍可推进' : '时间充足';
      const primaryAdvice = isLate
        ? '建议立刻确认预约/递交通道，并准备调整行程的备选方案。'
        : isTight
          ? '建议本周内完成材料核对和预约，避免补料压缩行程。'
          : '可以按稳妥节奏准备，先做材料闭环，再预约或递交。';

      output.innerHTML = `
        <div class="count-summary ${status}">
          <strong>${escapeHtml(item.country)} · ${escapeHtml(plan.type)}</strong>
          <span>${statusText}，距出发 ${remaining} 天。${primaryAdvice}</span>
        </div>
        <div class="timeline">
          ${renderStep(idealDate, '稳妥启动', `开始整理材料。重点：${plan.focus}。`, 'soft')}
          ${renderStep(latestDate, item.visaRequiredCN ? '建议最晚递交/预约' : '最晚完成入境材料核查', item.visaRequiredCN ? '晚于此日期会压缩补料、预约和出签缓冲。' : '免签目的地仍需完成护照、离境机票、住宿和入境卡核查。', isLate ? 'danger' : 'strong')}
          ${renderStep(reviewDate, '补料与结果缓冲', item.visaRequiredCN ? '预留补料、行政处理、快递或取件时间。' : '再次确认停留天数、住宿和离境安排。')}
          ${renderStep(finalDate, '出发前最终核查', '检查护照、签证/入境许可、机票、住宿、保险、资金证明和官方最新公告。')}
        </div>
      `;
    });
  };

  const renderFaq = (country) => {
    const box = document.querySelector('#smartFaq');
    if (!box) return;
    const item = byCountry(country);
    if (!item) {
      box.innerHTML = '<p class="tip-muted">请选择国家查看常见问题。</p>';
      return;
    }
    box.innerHTML = `
      <details><summary>${escapeHtml(item.country)} 对大陆护照是否需要签证？</summary><p>${escapeHtml(item.entryRuleCN)}</p></details>
      <details><summary>建议提前多久准备材料？</summary><p>${escapeHtml(item.leadTime)}。旺季或首次办理建议再提前 1-2 周。</p></details>
      <details><summary>常见材料短板是什么？</summary><p>${escapeHtml((item.riskTips || []).join('；'))}。</p></details>
      <details><summary>哪些情况容易被补材料？</summary><p>${escapeHtml((item.communityIssues || []).slice(0, 2).join('；'))}。</p></details>
      <details><summary>资金证明怎么准备更稳妥？</summary><p>通常建议提供 3-6 个月稳定流水，余额与行程预算匹配，避免临时大额转入无法解释。</p></details>
      <details><summary>免签国家还需要准备什么？</summary><p>仍建议准备护照有效期证明、返程机票、住宿信息和基础资金证明，避免入境问询时材料不足。</p></details>
    `;
  };

  const bindFaq = () => {
    const select = document.querySelector('#faqCountry');
    if (!select) return;
    renderFaq('');
    select.addEventListener('change', (event) => renderFaq(event.target.value));
  };

  const init = () => {
    initReveal();
    renderHomeCards();
    bindPolicy();
    fillSelect('#evalCountry');
    fillSelect('#countCountry');
    fillSelect('#faqCountry');
    initEval();
    bindCountdown();
    bindFaq();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
