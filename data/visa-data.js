window.VISA_DATA = [
  {
    country: '日本', flagCode: 'jp', region: '亚洲', visaRequiredCN: true, entryRuleCN: '需签证', visaType: '短期旅游签证',
    stay: '常见 15-30 天', processing: '约 7-10 个工作日', fee: '约 300-500 元', expedited: true,
    updatedAt: '2026-05-05', validity: '常见 3 个月内入境有效', interview: '通常免面试', leadTime: '建议出发前 30-45 天提交',
    officialStep: '在华申请通常经指定代办机构提交', coreDocs: ['护照','照片','在职/在读证明','银行流水','行程单'],
    extraDocs: ['资产补充说明','户口本复印件'],
    riskTips: ['行程单与资金证明逻辑不一致','在职证明信息不完整','历史出境记录解释不足'],
    communityIssues: ['代办材料模板与个人实际不一致导致补件','行程写得过于笼统被要求补充细节','银行流水临时大额入账被重点关注'],
    officialRefs: ['https://www.mofa.go.jp/j_info/visit/visa/topics/china.html','https://www.cn.emb-japan.go.jp/itpr_ja/visa.html']
  },
  {
    country: '韩国', flagCode: 'kr', region: '亚洲', visaRequiredCN: true, entryRuleCN: '需签证', visaType: '短期访问签证',
    stay: '常见 30 天', processing: '约 5-10 个工作日', fee: '约 450-700 元', expedited: false,
    updatedAt: '2026-05-05', validity: '常见 3 个月内入境有效', interview: '通常免面试', leadTime: '建议出发前 30-45 天提交',
    officialStep: '通过韩国驻华使领馆体系或签证中心申请', coreDocs: ['护照','照片','在职/在读证明','资金证明','行程信息'],
    extraDocs: ['社保或纳税辅助材料'],
    riskTips: ['资产证明薄弱','在职材料与实际不符','行程真实性不足'],
    communityIssues: ['照片规格与尺寸问题导致反复提交','酒店/机票预订单信息不一致','工作证明盖章与公司信息不匹配'],
    officialRefs: ['https://www.visa.go.kr/','https://chinese.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=140769']
  },
  {
    country: '新加坡', flagCode: 'sg', region: '亚洲', visaRequiredCN: false, entryRuleCN: '免签（中国普通护照，单次不超过30天）', visaType: '免签入境',
    stay: '单次通常不超过 30 天', processing: '无需签证审批', fee: '签证费 0', expedited: false,
    updatedAt: '2026-05-05', validity: '按入境许可批注', interview: '无签证面试', leadTime: '出发前确认入境材料即可',
    officialStep: '持有效护照及入境所需材料入境', coreDocs: ['有效期 6 个月以上护照','返程/离境机票','住宿或行程信息'],
    extraDocs: ['足够旅行资金证明'],
    riskTips: ['将“免签”误解为“无条件入境”','护照有效期不足6个月','缺少离境机票或住宿信息'],
    communityIssues: ['入境问询时无法清晰说明停留安排','临时更改行程导致材料与口径不一致','忽略海关与入境官裁量'],
    officialRefs: ['https://shanghai.mfa.gov.sg/cn/consular-services/visa-information/','https://www.ica.gov.sg/enter-transit-depart/entering-singapore']
  },
  {
    country: '泰国', flagCode: 'th', region: '亚洲', visaRequiredCN: false, entryRuleCN: '免签（中国普通护照，单次不超过30天）', visaType: '免签入境',
    stay: '单次不超过 30 天（180天累计停留限制见官方）', processing: '无需签证审批', fee: '签证费 0', expedited: false,
    updatedAt: '2026-05-05', validity: '按入境许可批注', interview: '无签证面试', leadTime: '出发前确认入境材料即可',
    officialStep: '持有效护照及入境所需材料入境', coreDocs: ['有效期 6 个月以上护照','返程机票','住宿信息'],
    extraDocs: ['旅行资金证明'],
    riskTips: ['超期停留风险','往返机票与停留计划不匹配','误解免签停留与延期规则'],
    communityIssues: ['以为可无限次长期停留导致边检问询','没有准备返程票被要求补充说明','停留天数计算错误'],
    officialRefs: ['https://mfa.go.th/en/content/thcn280124?cate=5d5bcb4e15e39c306000683e','https://www.thailand.go.th/public/index.php/issue-focus-detail/001_01_224']
  },
  {
    country: '法国（申根）', flagCode: 'fr', region: '欧洲', visaRequiredCN: true, entryRuleCN: '需签证', visaType: '申根短期 C 签',
    stay: '180 天内累计 90 天', processing: '约 10-15 个工作日', fee: '约 90 欧元 + 服务费', expedited: false,
    updatedAt: '2026-05-05', validity: '常见按行程给有效期', interview: '可能补料/核验', leadTime: '建议出发前 45-60 天提交',
    officialStep: '按 France-Visas 指引预约并递交生物信息', coreDocs: ['护照','照片','旅行保险','行程单','资金证明'],
    extraDocs: ['酒店预订单','邀请函（如有）'],
    riskTips: ['保险不符合申根要求','行程与订单不一致','资金证明不足覆盖行程'],
    communityIssues: ['预约位紧张导致临近出行才提交','保险保额或覆盖区域不达标','多国行程主停留国填写错误'],
    officialRefs: ['https://www.france-visas.gouv.fr/en/short-stay-visa','https://www.france-visas.gouv.fr/en/visa-application-guidelines']
  },
  {
    country: '德国（申根）', flagCode: 'de', region: '欧洲', visaRequiredCN: true, entryRuleCN: '需签证', visaType: '申根短期 C 签',
    stay: '180 天内累计 90 天', processing: '约 10-15 个工作日', fee: '约 90 欧元 + 服务费', expedited: false,
    updatedAt: '2026-05-05', validity: '常见按行程给有效期', interview: '可能补料/核验', leadTime: '建议出发前 45-60 天提交',
    officialStep: '按德国驻华使领馆/签证中心流程递交', coreDocs: ['护照','照片','保险','在职证明','银行流水'],
    extraDocs: ['详细行程说明','资产辅助证明'],
    riskTips: ['资金流水解释不足','行程目的不清晰','翻译件质量不合格'],
    communityIssues: ['预约后补料时间紧','翻译格式不规范被要求重交','行程城市间交通证明缺失'],
    officialRefs: ['https://china.diplo.de/cn-de/service/visa-einreise','https://china.diplo.de/cn-de/service/visa-einreise/2703288-2703288']
  },
  {
    country: '英国', flagCode: 'gb', region: '欧洲', visaRequiredCN: true, entryRuleCN: '需签证', visaType: 'Standard Visitor',
    stay: '单次通常不超过 6 个月', processing: '约 15-25 个工作日', fee: '约 115 英镑起', expedited: true,
    updatedAt: '2026-05-05', validity: '常见 6 个月或更长多次', interview: '通常以材料审理为主', leadTime: '建议出发前 35-55 天提交',
    officialStep: 'GOV.UK 在线申请并按流程采集生物信息', coreDocs: ['护照','申请表','资金证明','在职/学习证明','行程说明'],
    extraDocs: ['关系证明','历史出境记录证明'],
    riskTips: ['资金来源解释不完整','行程目的与材料不一致','回国约束力证明不足'],
    communityIssues: ['材料很多但主线不清导致审理疑问','账户流水与工资记录对不上','旅行目的表述过于模板化'],
    officialRefs: ['https://www.gov.uk/standard-visitor/apply-standard-visitor-visa','https://www.gov.uk/government/publications/uk-visa-requirements-list-for-carriers/uk-visa-requirements-for-international-carriers']
  },
  {
    country: '美国', flagCode: 'us', region: '美洲', visaRequiredCN: true, entryRuleCN: '需签证', visaType: 'B1/B2 访问签证',
    stay: '单次常见不超过 6 个月', processing: '预约+面签，常见 1-4 周出结果', fee: '约 185 美元', expedited: false,
    updatedAt: '2026-05-05', validity: '常见 10 年多次', interview: '需面签', leadTime: '建议至少提前 2-3 个月准备',
    officialStep: 'DS-160、缴费、预约、面签；持10年签者需EVUS', coreDocs: ['护照','DS-160确认页','预约确认','照片','资产与在职材料'],
    extraDocs: ['详细行程与邀请说明'],
    riskTips: ['DS-160与面签口径不一致','回国约束力不足','旅行目的模糊'],
    communityIssues: ['DS-160细节前后矛盾','面签回答过长或偏离问题','忽略EVUS更新导致出行受阻'],
    officialRefs: ['https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html','https://www.cbp.gov/document/publications/electronic-visa-update-system-evus-advertisements','https://travel.state.gov/content/travel/en/us-visas/Visa-Reciprocity-and-Civil-Documents-by-Country/China.html']
  },
  {
    country: '加拿大', flagCode: 'ca', region: '美洲', visaRequiredCN: true, entryRuleCN: '需签证', visaType: 'Visitor Visa (TRV)',
    stay: '通常每次入境不超过 6 个月', processing: '约 3-8 周', fee: '约 100 加元 + 生物信息费', expedited: false,
    updatedAt: '2026-05-05', validity: '常见多次往返', interview: '通常无需面试，需生物信息', leadTime: '建议出发前 50-70 天提交',
    officialStep: 'IRCC 在线申请并按指引完成生物信息采集', coreDocs: ['护照','照片','资金证明','行程计划','工作/学习证明'],
    extraDocs: ['家庭关系证明','邀请函（探亲）'],
    riskTips: ['生物信息流程不熟悉','资金来源解释不足','行程与访问目的不一致'],
    communityIssues: ['BIL下发后预约采集时间没衔接好','补件通知未及时处理','上传材料命名混乱导致复核慢'],
    officialRefs: ['https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/apply-visitor-visa.html','https://ircc.canada.ca/english/visit/biometrics.asp']
  },
  {
    country: '澳大利亚', flagCode: 'au', region: '大洋洲', visaRequiredCN: true, entryRuleCN: '需签证', visaType: 'Visitor 600',
    stay: '常见 3/6/12 个月（按签发结果）', processing: '约 2-6 周', fee: '约 190 澳元起', expedited: false,
    updatedAt: '2026-05-05', validity: '常见 1 年内可用', interview: '通常无需面试，可能补料', leadTime: '建议出发前 40-60 天提交',
    officialStep: 'ImmiAccount 在线申请 Subclass 600', coreDocs: ['护照','照片','资金流水','在职证明','行程说明'],
    extraDocs: ['纳税或资产证明','家庭关系说明'],
    riskTips: ['Genuine Visitor 论证不足','资金与收入闭环不完整','行程解释过于简略'],
    communityIssues: ['申请被要求进一步证明临时入境意图','上传材料缺英文说明','处理时间超预期影响行程'],
    officialRefs: ['https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600','https://china.embassy.gov.au/bjng/dima0301.html']
  },
  {
    country: '新西兰', flagCode: 'nz', region: '大洋洲', visaRequiredCN: true, entryRuleCN: '需签证', visaType: 'Visitor Visa',
    stay: '常见单次不超过 6 个月', processing: '约 3-6 周', fee: '约 NZD 200-300（随通道浮动）', expedited: false,
    updatedAt: '2026-05-05', validity: '常见 1-2 年多次（按签发）', interview: '通常无需面试，可能补件',
    leadTime: '建议出发前 45-60 天提交', officialStep: 'Immigration New Zealand 在线申请',
    coreDocs: ['护照','照片','资金证明','在职/在读证明','行程计划'],
    extraDocs: ['关系证明','旅行历史说明'],
    riskTips: ['资金覆盖不足','行程计划不完整','回国约束力说明偏弱'],
    communityIssues: ['材料翻译质量不统一','解释信太简单导致补件','出行计划与资金证明不匹配'],
    officialRefs: ['https://www.immigration.govt.nz/new-zealand-visas/visas/visa/visitor-visa']
  }
];
