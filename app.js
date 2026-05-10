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

    const get = (id) => document.querySelector(id)?.value || '';
    const checked = (id) => Boolean(document.querySelector(id)?.checked);
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const scoreText = (value) => `${value > 0 ? '+' : ''}${value}`;
    const add = (parts, label, value, note = '') => {
      parts.push({ label, value, note });
      return value;
    };
    const list = (items) => items.map((item) => `<li>${item}</li>`).join('');

    if (countrySelect && data.length) {
      countrySelect.innerHTML = '<option value="">请选择国家</option>' +
        data.map((item) => `<option value="${item.country}">${item.country}</option>`).join('');
    }

    const updateDocLabel = () => {
      const holder = document.querySelector('#evalDocsValue');
      if (holder && docRange) holder.textContent = `${docRange.value}%`;
    };
    docRange?.addEventListener('input', updateDocLabel);
    updateDocLabel();

    const countryProfiles = {
      '美国': {
        base: -10,
        focus: ['DS-160 信息准确完整', '面谈口径和材料一致', '回国约束力能被清楚说明'],
        penalties: (v) => [
          v.travel === 'none' ? [-8, '美国首签且无出境记录，面谈不确定性更高'] : null,
          v.consistency === 'weak' ? [-10, 'DS-160/面谈口径未核对是高风险项'] : null,
          v.ties === 'weak' ? [-8, '回国约束力证明偏弱'] : null,
          v.purpose === 'visit' && v.booking !== 'strong' ? [-4, '探亲访友需补强邀请关系和停留安排'] : null
        ].filter(Boolean),
        boosts: (v) => [
          v.travel === 'many' ? [5, '良好出境记录有助于说明旅行可信度'] : null,
          v.consistency === 'strong' ? [6, '表格、材料、面谈口径已逐项核对'] : null,
          v.ties === 'strong' ? [5, '国内约束力证明完整'] : null
        ].filter(Boolean)
      },
      '英国': {
        base: -6,
        focus: ['资金来源能解释', '访问目的合理', '能证明会按期离境'],
        penalties: (v) => [
          v.fundSource === 'weak' ? [-10, '英国访客签证重点看资金来源和可支配性'] : null,
          v.ties === 'weak' ? [-6, '离境意图证明不足'] : null,
          v.booking === 'none' ? [-4, '住宿和访问安排不清晰'] : null
        ].filter(Boolean),
        boosts: (v) => [
          v.fundSource === 'strong' ? [7, '收入、余额和行程预算闭环清楚'] : null,
          v.ties === 'strong' ? [5, '国内约束力较完整'] : null
        ].filter(Boolean)
      },
      '法国（申根）': {
        base: -4,
        focus: ['旅行保险覆盖申根要求', '主停留国和行程一致', '机酒交通订单互相匹配'],
        penalties: (v) => [
          v.procedure !== 'strong' ? [-8, '申根短停需要重点确认保险、生物信息和预约流程'] : null,
          v.booking !== 'strong' ? [-7, '机酒交通或主停留国不一致会增加补料风险'] : null,
          v.plan === 'basic' ? [-5, '多国行程过于笼统'] : null
        ].filter(Boolean),
        boosts: (v) => [
          v.procedure === 'strong' ? [6, '保险和生物信息流程已按申根要求准备'] : null,
          v.booking === 'strong' ? [5, '行程订单一致性较好'] : null
        ].filter(Boolean)
      },
      '德国（申根）': {
        base: -4,
        focus: ['保险和翻译件规范', '资金流水解释', '行程目的和交通衔接'],
        penalties: (v) => [
          v.docLegal !== 'yes' ? [-6, '德国/申根材料对翻译和格式规范更敏感'] : null,
          v.fundSource === 'weak' ? [-7, '资金流水解释不足'] : null,
          v.booking !== 'strong' ? [-5, '城市间交通或住宿衔接不完整'] : null
        ].filter(Boolean),
        boosts: (v) => [
          v.docLegal === 'yes' ? [5, '翻译/公证准备完整'] : null,
          v.fundSource === 'strong' ? [5, '资金闭环较清晰'] : null
        ].filter(Boolean)
      },
      '加拿大': {
        base: -6,
        focus: ['生物信息预约', '资金与访问目的一致', '补料响应完整'],
        penalties: (v) => [
          v.procedure === 'weak' ? [-8, '未确认生物信息或补料流程'] : null,
          v.fundSource === 'weak' ? [-7, '资金来源解释不足'] : null,
          v.ties === 'weak' ? [-6, '返回约束力偏弱'] : null
        ].filter(Boolean),
        boosts: (v) => [
          v.procedure === 'strong' ? [5, '已按要求准备生物信息和补料流程'] : null,
          v.ties === 'strong' ? [5, '国内约束力说明充分'] : null
        ].filter(Boolean)
      },
      '澳大利亚': {
        base: -5,
        focus: ['Genuine Visitor 真实访客意图', '资金与收入闭环', '临时访问目的'],
        penalties: (v) => [
          v.ties === 'weak' ? [-8, '真实临时访问意图证明偏弱'] : null,
          v.fundSource === 'weak' ? [-7, '资金和收入闭环不足'] : null,
          v.plan === 'basic' ? [-4, '行程解释过于简略'] : null
        ].filter(Boolean),
        boosts: (v) => [
          v.ties === 'strong' ? [6, '临时访问和回国约束力较清楚'] : null,
          v.plan === 'strong' ? [4, '行程目的可核验'] : null
        ].filter(Boolean)
      },
      '新西兰': {
        base: -4,
        focus: ['真实访问意图', '足够生活资金', '离境计划'],
        penalties: (v) => [
          v.fund === 'weak' ? [-8, '新西兰访客签证要求证明有足够生活资金'] : null,
          v.booking === 'none' ? [-6, '离境计划或住宿安排不足'] : null,
          v.stayDays === 'long' && v.procedure !== 'strong' ? [-5, '长停留可能触发健康/更多材料核查'] : null
        ].filter(Boolean),
        boosts: (v) => [
          v.booking === 'strong' ? [5, '离境和住宿安排清晰'] : null,
          v.fund === 'strong' ? [5, '资金覆盖较充分'] : null
        ].filter(Boolean)
      },
      '日本': {
        base: 2,
        focus: ['在职/在读证明', '日程表和资金证明一致', '提交材料与个人情况匹配'],
        penalties: (v) => [
          v.job === false ? [-5, '缺少稳定工作/在读证明'] : null,
          v.plan === 'basic' ? [-4, '行程表过于笼统'] : null
        ].filter(Boolean),
        boosts: (v) => [
          v.job ? [4, '稳定证明完整'] : null,
          v.plan === 'strong' ? [4, '日程和资金逻辑较清楚'] : null
        ].filter(Boolean)
      },
      '韩国': {
        base: 1,
        focus: ['资产/收入证明', '照片和表格规格', '行程真实性'],
        penalties: (v) => [
          v.fund === 'weak' ? [-5, '资产证明偏弱'] : null,
          v.consistency === 'weak' ? [-4, '表格或照片规格未核对'] : null
        ].filter(Boolean),
        boosts: (v) => [
          v.fundSource === 'strong' ? [4, '收入和资金说明较完整'] : null
        ].filter(Boolean)
      }
    };

    const visaFreeProfiles = {
      '新加坡': {
        focus: ['护照 6 个月以上有效', 'SG Arrival Card 入境前提交', '离境机票、住宿和资金证明'],
        penalties: (v) => [
          v.passport === 'weak' ? [-25, '护照有效期不足 6 个月'] : null,
          v.procedure === 'weak' ? [-15, '未确认 SG Arrival Card 提交要求'] : null,
          v.booking === 'none' ? [-12, '缺少离境机票或住宿信息'] : null,
          v.fund === 'weak' ? [-8, '短期入境仍可能被要求说明资金'] : null
        ].filter(Boolean)
      },
      '泰国': {
        focus: ['护照有效期', '返程机票和住宿信息', '避免误解免签停留和延期规则'],
        penalties: (v) => [
          v.passport === 'weak' ? [-25, '护照有效期不足 6 个月'] : null,
          v.booking === 'none' ? [-12, '缺少返程机票或住宿信息'] : null,
          v.stayDays === 'long' ? [-10, '停留计划偏长，需要重点核对免签天数和延期规则'] : null,
          v.plan === 'basic' ? [-6, '入境问询时行程说明偏弱'] : null
        ].filter(Boolean)
      }
    };

    const buildValues = () => ({
      country: get('#evalCountry'),
      purpose: get('#evalPurpose'),
      stayDays: get('#evalStayDays'),
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
      docs: Number(get('#evalDocs')),
      job: checked('#evalJob')
    });

    const scoreCommon = (v, parts, weak) => {
      let score = 48;

      const profileScores = {
        employee: 8,
        student: 5,
        owner: 5,
        retired: 4,
        freelance: 0,
        unemployed: -9
      };
      score += add(parts, '身份稳定性', profileScores[v.profile] ?? 0);
      if (['freelance', 'unemployed'].includes(v.profile)) weak.push('身份稳定性说明需要补强');

      const incomeScores = { low: -4, mid: 6, high: 10 };
      score += add(parts, '收入水平', incomeScores[v.income] ?? 0);
      if (v.income === 'low') weak.push('收入证明偏弱');

      const travelScores = { none: -6, asia: 2, some: 8, many: 12 };
      score += add(parts, '出境记录', travelScores[v.travel] ?? 0);
      if (v.travel === 'none') weak.push('出境记录较少');

      const refusalScore = v.refusal === 'yes' ? -16 : 5;
      score += add(parts, '拒签历史', refusalScore);
      if (v.refusal === 'yes') weak.push('需要准备拒签原因解释和变化证明');

      const passportScores = { weak: -18, normal: 3, strong: 6 };
      score += add(parts, '护照有效期', passportScores[v.passport] ?? 0);
      if (v.passport === 'weak') weak.push('护照有效期不足是硬风险');

      const stayScores = { short: 5, mid: 1, long: -7 };
      score += add(parts, '停留时长', stayScores[v.stayDays] ?? 0);
      if (v.stayDays === 'long') weak.push('停留时间偏长，需要更强目的和资金证明');

      const fundScores = { weak: -10, normal: 6, strong: 12 };
      score += add(parts, '资金覆盖', fundScores[v.fund] ?? 0);
      if (v.fund === 'weak') weak.push('资金覆盖不足');

      const fundSourceScores = { weak: -9, normal: 5, strong: 10 };
      score += add(parts, '资金来源', fundSourceScores[v.fundSource] ?? 0);
      if (v.fundSource === 'weak') weak.push('资金来源解释不清');

      const planScores = { basic: 1, clear: 6, strong: 10 };
      score += add(parts, '行程真实性', planScores[v.plan] ?? 0);
      if (v.plan === 'basic') weak.push('行程证明偏弱');

      const bookingScores = { none: -8, basic: 4, strong: 9 };
      score += add(parts, '机酒/邀请材料', bookingScores[v.booking] ?? 0);
      if (v.booking === 'none') weak.push('缺少住宿、交通或邀请安排');

      const legalScores = { no: -6, part: 3, yes: 8 };
      score += add(parts, '翻译/公证', legalScores[v.docLegal] ?? 0);
      if (v.docLegal === 'no') weak.push('翻译或公证准备不足');

      const procedureScores = { weak: -6, normal: 3, strong: 7 };
      score += add(parts, '流程准备', procedureScores[v.procedure] ?? 0);
      if (v.procedure === 'weak') weak.push('未确认保险、生物信息或面谈要求');

      const tiesScores = { weak: -8, normal: 5, strong: 10 };
      score += add(parts, '国内约束力', tiesScores[v.ties] ?? 0);
      if (v.ties === 'weak') weak.push('国内约束力证明偏弱');

      const consistencyScores = { weak: -9, normal: 5, strong: 10 };
      score += add(parts, '表格/口径一致性', consistencyScores[v.consistency] ?? 0);
      if (v.consistency === 'weak') weak.push('申请表、行程和证明材料尚未核对');

      const docPart = Math.round((v.docs - 70) * 0.45);
      score += add(parts, '材料完整度', docPart);
      if (v.docs < 70) weak.push('材料完整度偏低');

      const jobPart = v.job ? 5 : -6;
      score += add(parts, '工作/在读证明', jobPart);
      if (!v.job) weak.push('稳定工作或在读证明不足');

      return score;
    };

    const renderResult = ({ title, score, level, advice, parts, weak, focus, special, required }) => {
      rateEl.textContent = title;
      levelEl.textContent = `风险等级：${level}`;
      adviceEl.textContent = advice;
      breakdownEl.innerHTML = `
        <li><strong>重点核查：</strong>${focus.join('；')}</li>
        ${special.length ? `<li><strong>国家专项：</strong>${special.map(([value, note]) => `${scoreText(value)} ${note}`).join('；')}</li>` : ''}
        <li><strong>分项评分：</strong>${parts.map((p) => `${p.label} ${scoreText(p.value)}`).join('；')}</li>
        ${weak.length ? `<li><strong>优先补强：</strong>${weak.slice(0, 5).join('；')}</li>` : '<li><strong>优先补强：</strong>当前没有明显短板，重点保持材料一致性。</li>'}
        ${required.length ? `<li><strong>建议补充：</strong>${required.join('；')}</li>` : ''}
      `;
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const v = buildValues();
      const selected = data.find((item) => item.country === v.country);
      if (!selected) {
        renderResult({
          title: '准备度：--',
          score: 0,
          level: '--',
          advice: '请先选择目标国家。',
          parts: [],
          weak: [],
          focus: ['选择国家后显示专项材料重点'],
          special: [],
          required: []
        });
        return;
      }

      const parts = [];
      const weak = [];
      const required = [];
      let score = scoreCommon(v, parts, weak);

      if (selected.visaRequiredCN === false) {
        const profile = visaFreeProfiles[selected.country] || {
          focus: ['护照有效期', '离境机票和住宿信息', '停留天数限制'],
          penalties: () => []
        };
        const special = profile.penalties(v);
        special.forEach(([value, note]) => {
          score += value;
          weak.push(note);
        });
        if (v.passport !== 'strong') required.push('确认护照有效期满足入境要求');
        if (v.booking !== 'strong') required.push('准备离境机票、住宿或行程信息');
        if (selected.country === '新加坡') required.push('入境前 3 天内提交 SG Arrival Card');

        const readiness = clamp(Math.round(score), 35, 98);
        const level = readiness >= 82 ? '低' : readiness >= 65 ? '中' : '高';
        const advice = readiness >= 82
          ? '免签入境准备较完整，出发前再次核对入境卡、护照有效期和离境安排。'
          : '免签不等于无条件入境，建议先补齐护照有效期、离境机票、住宿和资金说明。';

        renderResult({
          title: `入境准备度：${readiness}%`,
          score: readiness,
          level,
          advice,
          parts,
          weak,
          focus: profile.focus,
          special,
          required
        });
        return;
      }

      const profile = countryProfiles[selected.country] || {
        base: 0,
        focus: ['材料真实一致', '资金覆盖行程', '按官方流程递交'],
        penalties: () => [],
        boosts: () => []
      };

      score += add(parts, '国家基础难度', profile.base);
      const special = [...profile.penalties(v), ...profile.boosts(v)];
      special.forEach(([value, note]) => {
        score += value;
        if (value < 0) weak.push(note);
      });

      if (v.passport === 'weak') required.push('先换发或更新护照后再规划递交');
      if (v.fundSource !== 'strong') required.push('补充工资、纳税、资产或流水来源说明');
      if (v.consistency !== 'strong') required.push('逐项核对申请表、行程、资金和证明材料');
      if (['美国', '加拿大'].includes(selected.country) && v.procedure !== 'strong') required.push('确认面谈/生物信息预约与补料流程');
      if (selected.country.includes('申根') && v.procedure !== 'strong') required.push('确认申根旅行保险、生物信息和主停留国规则');
      if (['英国', '澳大利亚', '新西兰'].includes(selected.country) && v.ties !== 'strong') required.push('补强回国约束力和临时访问意图说明');

      const passRate = clamp(Math.round(score), 18, 96);
      const level = passRate >= 82 ? '低' : passRate >= 62 ? '中' : '高';
      let advice = '建议先补强薄弱项，再按官方要求递交。';
      if (passRate >= 82) {
        advice = '准备度较高，重点保持所有材料真实、一致，并按预约或在线流程提交。';
      } else if (passRate >= 62) {
        advice = '具备递交基础，但仍有若干短板，建议优先补齐资金、行程或国家专项要求。';
      } else {
        advice = '当前风险偏高，建议先补强核心材料、解释信和官方流程准备，暂缓递交。';
      }

      renderResult({
        title: `通过准备度：${passRate}%`,
        score: passRate,
        level,
        advice,
        parts,
        weak,
        focus: profile.focus,
        special,
        required
      });
    });
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initEval, { once: true });
  } else {
    initEval();
  }
})();
