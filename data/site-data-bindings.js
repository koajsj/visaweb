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

  const bindCompare = () => {
    document.querySelector('#compareBtn')?.addEventListener('click', () => {
      const names = ['#compareA', '#compareB', '#compareC']
        .map((selector) => document.querySelector(selector)?.value)
        .filter(Boolean);
      const table = document.querySelector('#compareTable');
      if (!table) return;
      if (!names.length) {
        table.innerHTML = '<p class="tip-muted">请至少选择 1 个国家。</p>';
        return;
      }

      const rows = names.map(byCountry).filter(Boolean);
      table.innerHTML = `
        <table>
          <thead><tr><th>国家</th><th>规则</th><th>停留</th><th>时长</th><th>面试</th></tr></thead>
          <tbody>${rows.map((item) => `
            <tr>
              <td>${flagHtml(item)}${escapeHtml(item.country)}</td>
              <td>${escapeHtml(item.entryRuleCN)}</td>
              <td>${escapeHtml(item.stay)}</td>
              <td>${escapeHtml(item.processing)}</td>
              <td>${escapeHtml(item.interview)}</td>
            </tr>`).join('')}</tbody>
        </table>`;
    });
  };

  const bindCountdown = () => {
    document.querySelector('#countBtn')?.addEventListener('click', () => {
      const country = document.querySelector('#countCountry')?.value;
      const date = document.querySelector('#departDate')?.value;
      const out = document.querySelector('#countResult');
      const item = byCountry(country);
      if (!item || !date || !out) return;

      if (!item.visaRequiredCN) {
        out.textContent = `${item.country} 当前为免签入境，建议仍在出发前 3-7 天核查护照有效期、返程机票和住宿信息。`;
        return;
      }

      const depart = new Date(`${date}T00:00:00`);
      const latest = new Date(depart);
      const safe = new Date(depart);
      latest.setDate(latest.getDate() - 20);
      safe.setDate(safe.getDate() - 45);
      out.textContent = `针对 ${item.country}：最晚建议 ${latest.toISOString().slice(0, 10)} 前提交；更稳妥的时间是 ${safe.toISOString().slice(0, 10)} 前。`;
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
  ['#evalCountry', '#compareA', '#compareB', '#compareC', '#countCountry', '#faqCountry'].forEach((selector) => fillSelect(selector));
  bindCompare();
  bindCountdown();
  bindFaq();
})();
