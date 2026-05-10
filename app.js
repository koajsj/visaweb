(() => {
  const revealElements = Array.from(document.querySelectorAll('.reveal'));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const showElement = (el) => el.classList.add('show');

  if (revealElements.length) {
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      revealElements.forEach(showElement);
    } else {
      revealElements.forEach((el, index) => {
        el.style.setProperty('--reveal-delay', `${Math.min(index * 38, 180)}ms`);
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            showElement(entry.target);
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -36px 0px' }
      );

      revealElements.forEach((el) => observer.observe(el));
    }
  }

  const initEval = () => {
    const form = document.querySelector('#visaEvalForm');
    if (!form) return;

    const countrySelect = document.querySelector('#evalCountry');
    const rateEl = document.querySelector('#evalRate');
    const levelEl = document.querySelector('#evalLevel');
    const adviceEl = document.querySelector('#evalAdvice');
    const breakdownEl = document.querySelector('#evalBreakdown');
    const docRange = document.querySelector('#evalDocs');

    const data = Array.isArray(window.VISA_DATA) ? window.VISA_DATA : [];

    if (countrySelect && data.length) {
      countrySelect.innerHTML = '<option value="">请选择国家</option>' +
        data.map((d) => `<option value="${d.country}">${d.country}</option>`).join('');
    }

    const updateDocLabel = () => {
      const holder = document.querySelector('#evalDocsValue');
      if (holder && docRange) holder.textContent = `${docRange.value}%`;
    };
    docRange?.addEventListener('input', updateDocLabel);
    updateDocLabel();

    const countryRisk = {
      '美国': -8,
      '英国': -4,
      '法国（申根）': -3,
      '德国（申根）': -3,
      '日本': 3,
      '韩国': 2,
      '新加坡': 3,
      '泰国': 4
    };

    const addPart = (parts, label, value) => {
      const mark = value > 0 ? '+' : '';
      parts.push(`${label}：${mark}${value}`);
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const country = document.querySelector('#evalCountry').value;
      const purpose = document.querySelector('#evalPurpose').value;
      const income = document.querySelector('#evalIncome').value;
      const travel = document.querySelector('#evalTravel').value;
      const stayDays = document.querySelector('#evalStayDays').value;
      const refusal = document.querySelector('#evalRefusal').value;
      const fund = document.querySelector('#evalFund').value;
      const plan = document.querySelector('#evalPlan').value;
      const docLegal = document.querySelector('#evalDocLegal').value;
      const docs = Number(document.querySelector('#evalDocs').value);
      const hasJob = document.querySelector('#evalJob').checked;
      const selected = data.find((d) => d.country === country);

      if (!selected) {
        rateEl.textContent = '通过率：--';
        levelEl.textContent = '风险等级：--';
        adviceEl.textContent = '请先选择目标国家。';
        breakdownEl.innerHTML = '<li>选择国家后显示分项评分。</li>';
        return;
      }

      if (selected.visaRequiredCN === false) {
        rateEl.textContent = '通过率：99%（免签入境）';
        levelEl.textContent = '风险等级：低';
        adviceEl.textContent = '当前对中国大陆普通护照免签。仍建议核查护照有效期、返程机票、住宿信息和停留天数限制。';
        breakdownEl.innerHTML = [
          '入境政策：免签，不代表无条件入境',
          `停留规则：${selected.stay}`,
          '建议：随身准备离境机票、住宿或行程信息',
          `重点风险：${selected.riskTips.slice(0, 2).join('；')}`
        ].map((p) => `<li>${p}</li>`).join('');
        return;
      }

      const parts = [];
      const weak = [];
      let score = 45;

      const countryPart = countryRisk[country] || 0;
      score += countryPart;
      addPart(parts, '国家难度', countryPart);

      const purposePart = purpose === 'business' ? 4 : purpose === 'visit' ? 2 : 0;
      score += purposePart;
      addPart(parts, '出行目的', purposePart);

      const incomePart = income === 'high' ? 12 : income === 'mid' ? 7 : 0;
      score += incomePart;
      addPart(parts, '收入水平', incomePart);
      if (income === 'low') weak.push('收入证明偏弱');

      const travelPart = travel === 'many' ? 12 : travel === 'some' ? 7 : 0;
      score += travelPart;
      addPart(parts, '出境记录', travelPart);
      if (travel === 'none') weak.push('出境记录较少');

      const stayPart = stayDays === 'short' ? 5 : stayDays === 'mid' ? 1 : -6;
      score += stayPart;
      addPart(parts, '停留时长', stayPart);
      if (stayDays === 'long') weak.push('停留时间偏长');

      const refusalPart = refusal === 'yes' ? -12 : 6;
      score += refusalPart;
      addPart(parts, '拒签历史', refusalPart);
      if (refusal === 'yes') weak.push('存在拒签史');

      const fundPart = fund === 'strong' ? 12 : fund === 'normal' ? 6 : -8;
      score += fundPart;
      addPart(parts, '资金覆盖', fundPart);
      if (fund === 'weak') weak.push('资金覆盖不足');

      const planPart = plan === 'strong' ? 10 : plan === 'clear' ? 6 : 1;
      score += planPart;
      addPart(parts, '行程真实性', planPart);
      if (plan === 'basic') weak.push('行程证明偏弱');

      const legalPart = docLegal === 'yes' ? 8 : docLegal === 'part' ? 3 : -6;
      score += legalPart;
      addPart(parts, '翻译/公证', legalPart);
      if (docLegal === 'no') weak.push('翻译或公证准备不足');

      const docPart = Math.round((docs - 60) * 0.5);
      score += docPart;
      addPart(parts, '材料完整度', docPart);
      if (docs < 70) weak.push('材料完整度偏低');

      const jobPart = hasJob ? 8 : -5;
      score += jobPart;
      addPart(parts, '稳定证明', jobPart);
      if (!hasJob) weak.push('稳定工作或在读证明不足');

      if (country === '美国' && travel === 'none') {
        score -= 6;
        parts.push('美国首次出境：-6');
      }

      const passRate = Math.max(20, Math.min(96, score));
      let level = '中';
      let advice = '建议补强资金覆盖、行程证据和材料一致性，再安排递交。';
      if (passRate >= 80) {
        level = '低';
        advice = '条件较好。重点检查材料真实性、一致性和预约时间。';
      } else if (passRate < 60) {
        level = '高';
        advice = '建议先优化资金证明、行程证据和解释信，降低被补料或拒签风险。';
      }
      if (weak.length) {
        advice += ` 当前薄弱项：${weak.slice(0, 3).join('、')}。`;
      }

      rateEl.textContent = `通过率：${passRate}%`;
      levelEl.textContent = `风险等级：${level}`;
      adviceEl.textContent = advice;
      breakdownEl.innerHTML = parts.map((p) => `<li>${p}</li>`).join('');
    });
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initEval, { once: true });
  } else {
    initEval();
  }
})();
