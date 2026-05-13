(() => {
  const storageKey = 'visa_data_override_v1';
  const localOverride = localStorage.getItem(storageKey);

  if (localOverride) {
    try {
      const parsed = JSON.parse(localOverride);
      if (Array.isArray(parsed)) window.VISA_DATA = parsed;
    } catch (error) {
      console.warn('本地签证数据覆盖解析失败，已使用默认数据。', error);
    }
  }

  const data = Array.isArray(window.VISA_DATA) ? window.VISA_DATA : [];
  if (!data.length) return;

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

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const listHtml = (items = []) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const paragraphHtml = (text) => escapeHtml(text).replaceAll('\n', '<br />');

  const flagHtml = (item) => {
    if (!item?.flagCode) return '';
    const country = escapeHtml(item.country);
    return `<img class="flag-icon" src="${flagBase}${escapeHtml(item.flagCode)}.svg" alt="${country} 国旗" loading="lazy" decoding="async" />`;
  };

  const joinList = (items = [], separator = '、') => items.filter(Boolean).join(separator);

  const renderHeroFacts = () => {
    const target = document.querySelector('.hero-facts');
    if (!target) return;

    const total = data.length;
    const visaRequired = data.filter((item) => item.visaRequiredCN).length;
    const visaFree = total - visaRequired;

    target.innerHTML = `
      <div><strong>${total}</strong><span>目的地</span></div>
      <div><strong>${visaRequired}</strong><span>需要签证</span></div>
      <div><strong>${visaFree}</strong><span>免签入境</span></div>
    `;
  };

  const initReveal = () => {
    const items = Array.from(document.querySelectorAll('.reveal'));
    if (!items.length) return;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      items.forEach((item) => item.classList.add('show'));
      return;
    }

    items.forEach((item, index) => item.style.setProperty('--reveal-delay', `${Math.min(index * 42, 210)}ms`));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

    items.forEach((item) => observer.observe(item));
  };

  const fillSelect = (selector, placeholder = '请选择国家') => {
    const select = document.querySelector(selector);
    if (!select) return;
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` + data
      .map((item) => `<option value="${escapeHtml(item.country)}">${escapeHtml(item.country)}</option>`)
      .join('');
  };

  const renderHomeCards = () => {
    const target = document.querySelector('#homeCards');
    if (!target) return;

    target.innerHTML = data.slice(0, 6).map((item, index) => `
      <a class="card card-link country-card" style="--card-index:${index}" href="./policy/index.html?country=${encodeURIComponent(item.country)}">
        <div class="country-card-top">
          <div>
            <p class="tip-muted">${escapeHtml(item.region)} · ${escapeHtml(item.visaRequiredCN ? '需签证' : '免签')}</p>
            <h3>${flagHtml(item)}${escapeHtml(item.country)}</h3>
          </div>
          <span class="status-pill ${item.visaRequiredCN ? 'need' : 'free'}">${item.visaRequiredCN ? '需签证' : '免签'}</span>
        </div>
        <p><strong>规则：</strong>${escapeHtml(item.entryRuleCN)}</p>
        <p><strong>停留：</strong>${escapeHtml(item.stay)}</p>
        <p><strong>节奏：</strong>${escapeHtml(item.leadTime)}</p>
        <span class="card-more">查看材料、风险与官方链接</span>
      </a>
    `).join('');
  };

  const getFilteredCountries = () => {
    const keyword = (document.querySelector('#policySearch')?.value || '').trim().toLowerCase();
    const region = document.querySelector('#policyRegion')?.value || '全部';

    return data.filter((item) => {
      const matchRegion = region === '全部' || item.region === region;
      const searchable = [item.country, item.region, item.visaType, item.entryRuleCN, item.stay, item.processing, item.leadTime]
        .join(' ')
        .toLowerCase();
      return matchRegion && (!keyword || searchable.includes(keyword));
    });
  };

  const buildEntryTips = (item) => {
    if (item.visaRequiredCN) {
      return [
        `按 ${item.processing} 和 ${item.leadTime} 预留时间，避免预约和补件挤到最后。`,
        `出发前把 ${joinList(item.coreDocs)} 与 ${joinList(item.extraDocs)} 对齐到同一套口径。`,
        `提交前重点核对行程、资金来源、护照有效期和申请表一致性。`
      ];
    }

    return [
      '免签不等于无条件入境，边检仍可能核对护照有效期、返程/离境机票和住宿信息。',
      `建议提前准备 ${joinList(item.coreDocs)}，并把停留目的说清楚。`,
      '如果是转机、家庭出行或多次进出，最好再核对官方入境说明。'
    ];
  };

  const buildPrepSteps = (item) => {
    if (item.visaRequiredCN) {
      return [
        `先确认官方入口与递交路径：${item.officialStep}。`,
        `整理核心材料：${joinList(item.coreDocs)}。`,
        item.extraDocs?.length ? `补齐辅助材料：${joinList(item.extraDocs)}。` : '补齐与行程一致的辅助说明、翻译或证明。',
        '递交前统一申请表、资金流水、行程与口头解释口径。'
      ];
    }

    return [
      `先确认免签规则和停留限制：${item.entryRuleCN}。`,
      `准备护照、离境机票、住宿信息和行程说明，至少把 ${joinList(item.coreDocs)} 准备齐。`,
      '核对护照有效期、转机条件和入境问询时的回答口径。',
      '出发前再次检查官方公告，避免临时规则调整。'
    ];
  };

  const buildRiskItems = (item) => {
    const combined = [...(item.riskTips || []), ...(item.communityIssues || [])].filter(Boolean);
    const deduped = [];
    combined.forEach((entry) => {
      if (!deduped.includes(entry)) deduped.push(entry);
    });
    return deduped.slice(0, 5);
  };

  const buildFaq = (item) => [
    {
      question: `${item.country} 需要签证吗？`,
      answer: item.visaRequiredCN
        ? `当前页面整理为“${item.entryRuleCN}”。建议按 ${item.leadTime} 预留准备时间，最终递交和解释以官方入口为准。`
        : `当前页面整理为“${item.entryRuleCN}”。但免签不等于无条件入境，仍要准备护照、离境安排、住宿和停留说明。`
    },
    {
      question: '最关键的材料是什么？',
      answer: `先把核心材料准备齐：${joinList(item.coreDocs)}。${item.extraDocs?.length ? `如果材料链条还不够完整，再补 ${joinList(item.extraDocs)}。` : '如果官方要求额外证明，再按使领馆通知补充。'}`
    },
    {
      question: '这类申请最容易卡在哪里？',
      answer: `${joinList(item.riskTips)}。常见的实际问题还包括：${joinList((item.communityIssues || []).slice(0, 2))}。`
    },
    {
      question: '应该提前多久开始准备？',
      answer: `建议按“${item.leadTime}”倒推。若是旺季、首次办理或补件概率较高，最好再往前多留一周到两周。`
    },
    {
      question: '如果临时改行程怎么办？',
      answer: '先统一申请表、酒店、机票、资金证明和口头解释，再提交变更后的版本。最忌讳的是材料已经改了，但解释口径还停留在旧行程。'
    },
    {
      question: '最终以什么为准？',
      answer: `以 ${item.officialStep} 和 ${joinList(item.officialRefs || [], '；')} 为准。社区经验只适合做前期准备，不能替代官方要求。`
    }
  ];

  const buildGeneralFaq = () => [
    {
      question: '这个站点适合怎么用？',
      answer: '先看政策库确认国家规则，再用材料评估器检查自己的短板，最后用时间倒推器把准备动作排进日程。'
    },
    {
      question: '评分是审批概率吗？',
      answer: '不是。评分只是材料准备度和口径一致性的提示，目的是帮你发现明显短板，不是替代官方审批。'
    },
    {
      question: '官方和社区经验冲突时怎么办？',
      answer: '优先看官方入口、使领馆和签证中心公告。社区经验只能帮助理解流程，不应该覆盖官方要求。'
    },
    {
      question: '数据多久更新一次？',
      answer: '页面显示的是整理后的静态数据，规则如果有变化，最终还是要回到官方公告逐条核对。'
    }
  ];

  const renderPolicy = () => {
    const listEl = document.querySelector('#policyCountryList');
    const detailEl = document.querySelector('#policyDetailPane');
    const metaEl = document.querySelector('#policyMeta');
    if (!listEl || !detailEl) return;

    const filtered = getFilteredCountries();
    if (!filtered.some((item) => item.country === activeCountry)) {
      activeCountry = filtered[0]?.country || data[0]?.country || '';
    }

    const current = byCountry(activeCountry);

    if (metaEl) {
      metaEl.textContent = `共 ${filtered.length} 个匹配国家。先看规则，再看材料和风险，最后点开官方入口复核。`;
    }

    listEl.innerHTML = filtered.map((item) => `
      <button class="country-item ${item.country === activeCountry ? 'active' : ''}" data-country="${escapeHtml(item.country)}" type="button">
        <strong>${flagHtml(item)}${escapeHtml(item.country)}</strong>
        <span>${escapeHtml(item.entryRuleCN)} · ${escapeHtml(item.stay)} · ${escapeHtml(item.processing)}</span>
      </button>
    `).join('') || '<p class="tip-muted">没有匹配结果，换个关键词或地区再试。</p>';

    if (!current) {
      detailEl.innerHTML = '<p class="tip-muted">请选择国家查看详情。</p>';
      return;
    }

    const officialUrl = current.officialRefs?.[0] || '';
    const prepSteps = buildPrepSteps(current);
    const riskItems = buildRiskItems(current);
    const entryTips = buildEntryTips(current);

    detailEl.innerHTML = `
      <div class="detail-title-row">
        <h3>${flagHtml(current)}${escapeHtml(current.country)} · ${escapeHtml(current.visaType)}</h3>
        <span class="status-pill ${current.visaRequiredCN ? 'need' : 'free'}">${current.visaRequiredCN ? '需签证' : '免签'}</span>
      </div>
      <p class="tip-muted">${escapeHtml(current.entryRuleCN)}。${escapeHtml(current.visaRequiredCN ? '材料、预约和口径一致性是核心。' : '重点是停留天数、护照有效期和入境解释。')}</p>
      <div class="detail-cta-row">
        ${officialUrl ? `<a class="btn btn-solid" href="${escapeHtml(officialUrl)}" target="_blank" rel="noopener noreferrer">打开官方入口</a>` : ''}
      </div>
      <div class="detail-summary">
        <p><strong>停留规则</strong><span>${escapeHtml(current.stay)}</span></p>
        <p><strong>办理时长</strong><span>${escapeHtml(current.processing)}</span></p>
        <p><strong>费用参考</strong><span>${escapeHtml(current.fee)}</span></p>
        <p><strong>建议提前</strong><span>${escapeHtml(current.leadTime)}</span></p>
        <p><strong>更新日期</strong><span>${escapeHtml(current.updatedAt || '未标注')}</span></p>
        <p><strong>面谈/核验</strong><span>${escapeHtml(current.interview || '以官方要求为准')}</span></p>
      </div>
      <h4>准备顺序</h4>
      <ul class="risk-list">${listHtml(prepSteps)}</ul>
      <h4>高频风险</h4>
      <ul class="risk-list">${listHtml(riskItems)}</ul>
      <h4>入境提示</h4>
      <ul class="risk-list">${listHtml(entryTips)}</ul>
      <h4>官方参考链接</h4>
      <ul class="risk-list official-links">${(current.officialRefs || []).map((url) => `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></li>`).join('')}</ul>
      <p class="tip-muted">提示：任何签证或入境规则都可能临时调整，递交前请以目的地官方公告和使领馆页面为最终依据。</p>
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
      美国: ['DS-160 与面签口径一致', '回国约束力与资金解释', '行程目的清晰具体'],
      英国: ['资金来源解释', '访问目的合理', '按期离境证明'],
      加拿大: ['生物信息预约', '资金与访问目的一致', '补件及时响应'],
      '法国（申根）': ['保险符合申根要求', '主停留国与行程一致', '机票酒店一一对应'],
      '德国（申根）': ['翻译件和材料格式', '资金流水解释', '行程交通衔接'],
      澳大利亚: ['Genuine Visitor 论证', '资金闭环', '临时访问目的'],
      新西兰: ['资金覆盖', '行程完整性', '回国约束力'],
      日本: ['在职/在读证明', '日程与资金匹配', '材料信息一致'],
      韩国: ['照片规格和表格填写', '资产或收入证明', '行程真实可核验'],
      新加坡: ['护照有效期', '离境机票与住宿', '停留说明'],
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
        if (result.rate) result.rate.textContent = '准备度：--';
        if (result.level) result.level.textContent = '风险等级：--';
        if (result.advice) result.advice.textContent = '请先选择目标国家。';
        if (result.breakdown) result.breakdown.innerHTML = '<li>选择国家后会显示分项评分与补强建议。</li>';
        return;
      }

      const values = {
        purpose: get('#evalPurpose'),
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
      let score = selected.visaRequiredCN ? 46 : 64;

      const add = (label, value, weakText) => {
        parts.push({ label, value });
        score += value;
        if (value < 0 && weakText) weak.push(weakText);
      };

      const maps = {
        purpose: { tourism: 6, business: 3, visit: 4 },
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

      add('出行目的', maps.purpose[values.purpose] ?? 0, '出行目的需要和行程与邀请材料对齐');
      add('身份稳定性', maps.profile[values.profile] ?? 0, '身份材料要能解释你为什么会按期回国');
      add('收入水平', maps.income[values.income] ?? 0, '收入证明偏弱');
      add('出境记录', maps.travel[values.travel] ?? 0, '出境记录较少');
      add('拒签历史', values.refusal === 'yes' ? -16 : 5, '拒签史需要解释原因和后续变化');
      add('护照有效期', maps.passport[values.passport] ?? 0, '护照有效期不足');
      add('停留时长', maps.stayDays[values.stayDays] ?? 0, '停留时间偏长');
      add('资金覆盖', maps.fund[values.fund] ?? 0, '资金覆盖不足');
      add('资金来源', maps.fundSource[values.fundSource] ?? 0, '资金来源解释不清');
      add('行程完整性', maps.plan[values.plan] ?? 0, '行程说明偏弱');
      add('机酒/邀请', maps.booking[values.booking] ?? 0, '缺少住宿、交通或邀请材料');
      add('翻译/公证', maps.docLegal[values.docLegal] ?? 0, '翻译或公证准备不足');
      add('流程准备', maps.procedure[values.procedure] ?? 0, '未确认保险、生物信息或面谈要求');
      add('国内约束力', maps.ties[values.ties] ?? 0, '国内约束力证明偏弱');
      add('表格一致性', maps.consistency[values.consistency] ?? 0, '表格、行程和证明材料未对齐');
      add('材料完整度', Math.round((values.docs - 70) * 0.45), '材料完整度偏低');
      add('工作/在读证明', values.job ? 5 : -6, '稳定工作或在读证明不足');
      add('国家难度', countryDifficulty[selected.country] ?? 0, null);

      if (!selected.visaRequiredCN) {
        if (values.passport === 'weak') add('免签硬性要求', -18, '免签目的地仍通常要求护照有效期充足');
        if (values.booking === 'none') add('入境材料', -10, '免签入境仍建议准备返程票和住宿信息');
      }

      const finalScore = clamp(Math.round(score), 20, 97);
      const level = finalScore >= 82 ? '较稳' : finalScore >= 64 ? '中等' : '偏高';
      const label = selected.visaRequiredCN ? '通过准备度' : '入境准备度';
      const advice = finalScore >= 82
        ? '主线已经比较完整，接下来重点是保持材料一致、减少临时波动，并按官方流程提交。'
        : finalScore >= 64
          ? '当前有可推进基础，但建议优先补齐资金来源解释、行程闭环或补件材料。'
          : '当前短板较多，先把护照、证明、资金和行程四条主线补齐，再考虑递交。';
      const focus = countryFocus[selected.country] || ['材料真实一致', '资金覆盖行程', '按官方流程递交'];

      if (result.rate) result.rate.textContent = `${label}：${finalScore}/100`;
      if (result.level) result.level.textContent = `风险等级：${level}`;
      if (result.advice) result.advice.textContent = advice;
      if (result.breakdown) {
        result.breakdown.innerHTML = `
          <li><strong>优先核查：</strong>${focus.join('、')}</li>
          <li><strong>分项得分：</strong>${parts.map((part) => `${part.label} ${scoreText(part.value)}`).join('；')}</li>
          <li><strong>当前短板：</strong>${weak.length ? weak.slice(0, 4).join('、') : '暂时没有明显短板，但仍要保持材料一致性。'}</li>
        `;
      }
    });
  };

  const bindCountdown = () => {
    const button = document.querySelector('#countBtn');
    if (!button) return;

    const dayMs = 24 * 60 * 60 * 1000;
    const addDays = (date, days) => new Date(date.getTime() + days * dayMs);
    const daysBetween = (from, to) => Math.ceil((to.getTime() - from.getTime()) / dayMs);

    const planByCountry = {
      美国: { ideal: 90, latest: 45, review: 21, buffer: 14, type: '面签预约', focus: 'DS-160、资金证明、行程口径和面签回答' },
      英国: { ideal: 60, latest: 28, review: 15, buffer: 10, type: '在线申请', focus: '资金来源、访问目的和回国约束力' },
      加拿大: { ideal: 75, latest: 35, review: 20, buffer: 14, type: '在线申请 + 生物信息', focus: '生物信息预约、补件响应和资金来源' },
      澳大利亚: { ideal: 65, latest: 30, review: 18, buffer: 12, type: '在线申请', focus: 'Genuine Visitor 论证、资金闭环和真实行程' },
      新西兰: { ideal: 65, latest: 30, review: 18, buffer: 12, type: '在线申请', focus: '资金覆盖、行程完整性和回国约束力' },
      '法国（申根）': { ideal: 60, latest: 25, review: 14, buffer: 10, type: '申根预约', focus: '保险、主停留国和机酒交通一致性' },
      '德国（申根）': { ideal: 60, latest: 25, review: 14, buffer: 10, type: '申根预约', focus: '保险、翻译件、资金流水和行程衔接' },
      日本: { ideal: 45, latest: 18, review: 9, buffer: 7, type: '材料递交', focus: '在职/在读证明、行程表和资金证明' },
      韩国: { ideal: 40, latest: 16, review: 8, buffer: 7, type: '材料递交', focus: '照片规格、表格填写和资产/收入证明' },
      新加坡: { ideal: 7, latest: 3, review: 2, buffer: 1, type: '入境核查', focus: '护照、离境机票、住宿和停留说明' },
      泰国: { ideal: 7, latest: 3, review: 2, buffer: 1, type: '入境核查', focus: '护照、返程机票、住宿和停留天数限制' }
    };

    const defaultVisa = { ideal: 55, latest: 24, review: 12, buffer: 8, type: '签证申请', focus: '资金、行程和材料一致性' };
    const defaultFree = { ideal: 7, latest: 3, review: 2, buffer: 1, type: '免签入境核查', focus: '护照、离境机票、住宿与停留说明' };

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
      depart.setHours(0, 0, 0, 0);

      const base = item.visaRequiredCN ? (planByCountry[item.country] || defaultVisa) : defaultFree;
      const readinessPenalty = readiness === 'none' ? 10 : readiness === 'partial' ? 4 : 0;
      const urgencyOffset = urgency === 'peak' ? 10 : urgency === 'urgent' ? -7 : 0;
      const plan = {
        ...base,
        ideal: Math.max(base.latest + 3, base.ideal + readinessPenalty + urgencyOffset),
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
      const statusText = isLate ? '时间偏紧' : isTight ? '进入冲刺' : '时间充足';
      const primaryAdvice = isLate
        ? '建议立刻确认预约或递交通道，并准备备选方案。'
        : isTight
          ? '建议本周内完成材料核对和预约，避免补件压缩行程。'
          : '可以按节奏准备，先把材料主线收拢，再进入预约或递交。';
      const latestLabel = item.visaRequiredCN ? '最晚递交/预约' : '最晚完成入境核查';
      const reviewLabel = item.visaRequiredCN ? '补件与信息复核' : '入境材料复核';

      output.innerHTML = `
        <div class="count-summary ${status}">
          <strong>${escapeHtml(item.country)} · ${escapeHtml(plan.type)}</strong>
          <span>${statusText}，距离出发还有 ${remaining} 天。${escapeHtml(primaryAdvice)}</span>
        </div>
        <div class="timeline">
          ${renderStep(idealDate, '稳妥启动', `开始整理材料，重心是 ${plan.focus}。`, 'soft')}
          ${renderStep(latestDate, latestLabel, item.visaRequiredCN ? '超过这天会明显压缩预约、补件和递交缓冲。' : '超过这天会压缩入境材料核查和改票空间。', isLate ? 'danger' : 'strong')}
          ${renderStep(reviewDate, reviewLabel, item.visaRequiredCN ? '预留补件、翻译和递交确认的时间。' : '再次确认停留天数、住宿和离境安排。')}
          ${renderStep(finalDate, '出发前终检', '再检查护照、票据、住宿、保险和官方公告。')}
        </div>
      `;
    });
  };

  const renderFaq = (country) => {
    const box = document.querySelector('#smartFaq');
    if (!box) return;

    const item = byCountry(country);
    const faqs = item ? buildFaq(item) : buildGeneralFaq();
    box.innerHTML = faqs.map(({ question, answer }) => `
      <details>
        <summary>${escapeHtml(question)}</summary>
        <p>${paragraphHtml(answer)}</p>
      </details>
    `).join('');
  };

  const bindFaq = () => {
    const select = document.querySelector('#faqCountry');
    if (!select) return;
    if (data[0]) select.value = data[0].country;
    renderFaq(select.value || data[0]?.country || '');
    select.addEventListener('change', (event) => renderFaq(event.target.value));
  };

  const init = () => {
    initReveal();
    renderHeroFacts();
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
