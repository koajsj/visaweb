(() => {
  const local = localStorage.getItem('visa_data_override_v1');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) window.VISA_DATA = parsed;
    } catch {}
  }

  const data = Array.isArray(window.VISA_DATA) ? window.VISA_DATA : [];
  const byCountry = (c) => data.find((d) => d.country === c);
  const fillSelect = (id, placeholder = '请选择国家') => {
    const el = document.querySelector(id);
    if (!el) return;
    el.innerHTML = `<option value="">${placeholder}</option>` + data.map((d) => `<option value="${d.country}">${d.country}</option>`).join('');
  };

  const homeCards = document.querySelector('#homeCards');
  if (homeCards) {
    homeCards.innerHTML = data.slice(0, 6).map((item) => `
      <a class="card card-link" href="./policy/index.html?country=${encodeURIComponent(item.country)}">
        <h3>${item.country} · ${item.visaType}</h3>
        <p><strong>大陆护照：</strong>${item.entryRuleCN}</p>
        <p><strong>停留：</strong>${item.stay}</p>
        <p><strong>更新：</strong>${item.updatedAt || '-'}</p>
        <span>${item.visaRequiredCN ? '点击查看完整材料与风险' : '点击查看免签入境细则'}</span>
      </a>`).join('');
  }

  const renderCountryListAndDetail = () => {
    const listEl = document.querySelector('#policyCountryList');
    const detailEl = document.querySelector('#policyDetailPane');
    if (!listEl || !detailEl) return;

    const kw = (document.querySelector('#policySearch')?.value || '').trim().toLowerCase();
    const region = document.querySelector('#policyRegion')?.value || '全部';
    const filtered = data.filter((d) => {
      const m1 = region === '全部' || d.region === region;
      const m2 = !kw || d.country.toLowerCase().includes(kw);
      return m1 && m2;
    });

    const qsCountry = new URLSearchParams(location.search).get('country');
    const current = byCountry(window.__activeCountry || qsCountry || (filtered[0] && filtered[0].country));

    listEl.innerHTML = filtered.map((d) => `
      <button class="country-item ${current && current.country === d.country ? 'active' : ''}" data-country="${d.country}">
        <strong>${d.country}</strong>
        <span>${d.entryRuleCN}</span>
      </button>
    `).join('') || '<p class="tip-muted">无匹配国家。</p>';

    if (!current) {
      detailEl.innerHTML = '<p class="tip-muted">请选择国家查看详情。</p>';
      return;
    }

    window.__activeCountry = current.country;
    detailEl.innerHTML = `
      <h3>${current.country} · ${current.visaType}</h3>
      <p><strong>适用人群：</strong>仅中国大陆普通护照</p>
      <p><strong>签证规则：</strong>${current.entryRuleCN}</p>
      <p><strong>停留规则：</strong>${current.stay}</p>
      <p><strong>办理时长：</strong>${current.processing}</p>
      <p><strong>费用参考：</strong>${current.fee}</p>
      <p><strong>有效性：</strong>${current.validity}</p>
      <p><strong>面试要求：</strong>${current.interview}</p>
      <p><strong>建议递交时间：</strong>${current.leadTime}</p>
      <p><strong>官方申请路径：</strong>${current.officialStep}</p>
      <p><strong>核心材料：</strong>${current.coreDocs.join('、')}</p>
      <p><strong>建议补充材料：</strong>${current.extraDocs.join('、')}</p>
      <p><strong>官方规则更新时间：</strong>${current.updatedAt || '-'}</p>
      <h4>高频拒签/入境风险</h4>
      <ul class="risk-list">${current.riskTips.map((x) => `<li>${x}</li>`).join('')}</ul>
      <h4>社区高频问题与细节</h4>
      <ul class="risk-list">${current.communityIssues.map((x) => `<li>${x}</li>`).join('')}</ul>
      <h4>官方参考链接</h4>
      <ul class="risk-list">${current.officialRefs.map((x) => `<li><a href="${x}" target="_blank" rel="noopener noreferrer">${x}</a></li>`).join('')}</ul>
      <p class="tip-muted">提示：社区问题来自公开经验总结，官方规则以各国移民/使领馆最新公告为准。</p>
    `;

    listEl.querySelectorAll('.country-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.__activeCountry = btn.dataset.country;
        history.replaceState(null, '', `?country=${encodeURIComponent(btn.dataset.country)}`);
        renderCountryListAndDetail();
      });
    });
  };

  ['#policySearch', '#policyRegion'].forEach((id) => {
    document.querySelector(id)?.addEventListener('input', renderCountryListAndDetail);
    document.querySelector(id)?.addEventListener('change', renderCountryListAndDetail);
  });
  document.querySelector('#policyReset')?.addEventListener('click', () => {
    const s = document.querySelector('#policySearch'); if (s) s.value = '';
    const r = document.querySelector('#policyRegion'); if (r) r.value = '全部';
    window.__activeCountry = '';
    history.replaceState(null, '', location.pathname);
    renderCountryListAndDetail();
  });
  renderCountryListAndDetail();

  ['#evalCountry','#compareA','#compareB','#compareC','#countCountry','#faqCountry'].forEach((id) => fillSelect(id));

  document.querySelector('#compareBtn')?.addEventListener('click', () => {
    const names = ['#compareA','#compareB','#compareC'].map((id) => document.querySelector(id)?.value).filter(Boolean);
    const table = document.querySelector('#compareTable');
    if (!table) return;
    if (!names.length) { table.innerHTML = '<p class="tip-muted">请至少选择 1 个国家。</p>'; return; }
    const rows = names.map((n) => byCountry(n)).filter(Boolean);
    table.innerHTML = `<table><thead><tr><th>国家</th><th>签证规则</th><th>停留</th><th>时长</th><th>面试</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${r.country}</td><td>${r.entryRuleCN}</td><td>${r.stay}</td><td>${r.processing}</td><td>${r.interview}</td></tr>`).join('')}</tbody></table>`;
  });

  document.querySelector('#countBtn')?.addEventListener('click', () => {
    const c = document.querySelector('#countCountry')?.value;
    const d = document.querySelector('#departDate')?.value;
    const out = document.querySelector('#countResult');
    const item = byCountry(c);
    if (!item || !d || !out) return;
    if (!item.visaRequiredCN) {
      out.textContent = `${item.country}当前为免签入境，建议仍在出发前 3-7 天核查护照有效期、返程票和住宿信息。`;
      return;
    }
    const depart = new Date(d + 'T00:00:00');
    const latest = new Date(depart);
    const safe = new Date(depart);
    latest.setDate(latest.getDate() - 20);
    safe.setDate(safe.getDate() - 45);
    out.textContent = `针对${item.country}：最晚建议提交 ${latest.toISOString().slice(0,10)}；稳妥提交 ${safe.toISOString().slice(0,10)}。`;
  });

  const renderFaq = (c) => {
    const box = document.querySelector('#smartFaq');
    const item = byCountry(c);
    if (!box) return;
    if (!item) { box.innerHTML = '<p class="tip-muted">请选择国家获取推荐问题。</p>'; return; }
    box.innerHTML = `
      <details><summary>${item.country} 对大陆护照是否需要签证？</summary><p>${item.entryRuleCN}</p></details>
      <details><summary>建议提前多久开始准备 ${item.country} 出行材料？</summary><p>${item.leadTime}。如果旺季或首次办理，建议再提前 1-2 周。</p></details>
      <details><summary>${item.country} 常见材料短板是什么？</summary><p>${item.riskTips.join('；')}。</p></details>
      <details><summary>${item.country} 办理中最容易被补件的是哪类内容？</summary><p>${item.communityIssues.slice(0,2).join('；')}。</p></details>
      <details><summary>资金证明一般怎么准备更稳妥？</summary><p>通常建议提供 3-6 个月稳定流水，余额与行程预算匹配，避免临时大额转入无法解释。</p></details>
      <details><summary>行程单怎么写更容易通过审核？</summary><p>按日期列出城市、交通、住宿与目的，和机酒订单保持一致，不要出现时间冲突。</p></details>
      <details><summary>如果是免签国家，还需要准备什么？</summary><p>仍建议准备护照有效期证明、返程机票、住宿信息和基础资金证明，避免入境问询时材料不足。</p></details>`;
  };
  document.querySelector('#faqCountry')?.addEventListener('change', (e) => renderFaq(e.target.value));
})();
