(() => {
  const revealElements = Array.from(document.querySelectorAll('.reveal'));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (revealElements.length) {
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      revealElements.forEach((el) => el.classList.add('show'));
    } else {
      revealElements.forEach((el, index) => {
        el.style.setProperty('--reveal-delay', `${Math.min(index * 45, 220)}ms`);
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('show');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
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

    const data = Array.isArray(window.VISA_DATA) ? window.VISA_DATA : [];
    if (countrySelect && data.length) {
      countrySelect.innerHTML = '<option value="">请选择国家</option>' +
        data.map((d) => `<option value="${d.country}">${d.country}</option>`).join('');
    }

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

      if (selected && selected.visaRequiredCN === false) {
        rateEl.textContent = '通过率：99%（免签）';
        levelEl.textContent = '风险等级：低';
        adviceEl.textContent = '该目的地当前对中国普通护照为免签入境。请重点核查：护照有效期、返程票、住宿信息与停留天数限制。';
        if (breakdownEl) {
          breakdownEl.innerHTML = [
            '入境政策：免签（非签证审批）',
            `停留规则：${selected.stay}`,
            '建议：遵守停留天数与入境材料要求',
            `高频风险：${selected.riskTips.slice(0, 2).join('、')}`
          ].map((p) => `<li>${p}</li>`).join('');
        }
        return;
      }

      const parts = [];
      const weak = [];
      let score = 45;
      const countryPart = countryRisk[country] || 0;
      score += countryPart;
      parts.push(`国家难度：${countryPart >= 0 ? '+' : ''}${countryPart}`);

      let purposePart = 0;
      if (purpose === 'business') purposePart = 4;
      if (purpose === 'visit') purposePart = 2;
      score += purposePart;
      parts.push(`出行目的：+${purposePart}`);

      const incomePart = income === 'high' ? 12 : income === 'mid' ? 7 : 0;
      score += incomePart;
      parts.push(`收入水平：+${incomePart}`);

      const travelPart = travel === 'many' ? 12 : travel === 'some' ? 7 : 0;
      score += travelPart;
      parts.push(`出境记录：+${travelPart}`);
      if (travel === 'none') weak.push('出境记录较少');

      const stayPart = stayDays === 'short' ? 5 : stayDays === 'mid' ? 1 : -6;
      score += stayPart;
      parts.push(`停留时长：${stayPart >= 0 ? '+' : ''}${stayPart}`);
      if (stayDays === 'long') weak.push('停留时长偏长');

      const refusalPart = refusal === 'yes' ? -12 : 6;
      score += refusalPart;
      parts.push(`拒签历史：${refusalPart >= 0 ? '+' : ''}${refusalPart}`);

      const fundPart = fund === 'strong' ? 12 : fund === 'normal' ? 6 : -8;
      score += fundPart;
      parts.push(`资金覆盖：${fundPart >= 0 ? '+' : ''}${fundPart}`);
      if (fund === 'weak') weak.push('资金覆盖不足');

      const planPart = plan === 'strong' ? 10 : plan === 'clear' ? 6 : 1;
      score += planPart;
      parts.push(`行程真实性：+${planPart}`);
      if (plan === 'basic') weak.push('行程证明偏弱');

      const legalPart = docLegal === 'yes' ? 8 : docLegal === 'part' ? 3 : -6;
      score += legalPart;
      parts.push(`翻译/公证：${legalPart >= 0 ? '+' : ''}${legalPart}`);
      if (docLegal === 'no') weak.push('翻译公证准备不足');

      const docPart = Math.round((docs - 60) * 0.5);
      score += docPart;
      parts.push(`材料完整度：${docPart >= 0 ? '+' : ''}${docPart}`);
      if (docs < 70) weak.push('材料完整度偏低');

      const jobPart = hasJob ? 8 : -5;
      score += jobPart;
      parts.push(`稳定证明：${jobPart >= 0 ? '+' : ''}${jobPart}`);
      if (!hasJob) weak.push('稳定证明不足');

      if (country === '美国' && travel === 'none') {
        score -= 6;
        parts.push('美国首次出境：-6');
      }

      const passRate = Math.max(20, Math.min(96, score));
      let level = '中';
      let advice = '建议补强资金覆盖和行程可核验性，优先优化最弱分项。';
      if (passRate >= 80) {
        level = '低';
        advice = '条件较好，重点保证材料真实一致，按预约时间提交即可。';
      } else if (passRate < 60) {
        level = '高';
        advice = '建议先优化资金证明、行程证据和解释信，再安排递交。';
      }
      if (weak.length) {
        advice += ` 当前薄弱项：${weak.slice(0, 3).join('、')}。`;
      }

      rateEl.textContent = `通过率：${passRate}%`;
      levelEl.textContent = `风险等级：${level}`;
      adviceEl.textContent = advice;
      if (breakdownEl) {
        breakdownEl.innerHTML = parts.map((p) => `<li>${p}</li>`).join('');
      }
    });
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initEval, { once: true });
  } else {
    initEval();
  }
})();
