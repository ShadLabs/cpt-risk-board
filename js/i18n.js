// English and Arabic text for the CPT Risk Board (main page and dock screen).
// Static page text uses data-i18n keys; dynamic text uses the functions below.
const L = v => `<bdi dir="ltr">${v}</bdi>`; // keeps times and numbers like -12 readable in Arabic

const I18N = {
  en: {
    pageTitle: 'CPT Risk Board',
    dockPageTitle: 'CPT Dock Screen',
    title: 'CPT Risk Board',
    subtitle: 'Live outbound CPT tracker for one facility · sample data only',
    langBtn: 'العربية',
    clockLabel: 'Now',
    dock: 'Open dock screen ↗',
    exportCsv: 'Export CSV',
    reset: 'Reset to sample',
    shiftDay: 'Day shift',
    shiftNight: 'Night shift',
    shiftLabel: 'Shift',

    // overview
    s0: 'Shift at a glance',
    seeBoard: 'See full board ↓',
    vNoneTitle: 'No CPTs left this shift',
    vNone: 'Every CPT for this shift has departed or has no volume. Add CPT times in the schedule to keep tracking.',
    vOkTitle: 'All CPTs on track',
    vOk: n => `All ${n} remaining ${n === 1 ? 'CPT' : 'CPTs'} can be cleared at the current pack rate.`,
    vWatchTitle: 'Watch closely',
    vWatch: (label, m) => `<b>${label}</b> has only ${L(m)} min of buffer. Keep the line at full rate.`,
    vRiskTitle: 'CPT at risk',
    vRisk: (n, units, label) => `${n} ${n === 1 ? 'CPT' : 'CPTs'} will miss at the current rate, putting <b>${units}</b> units at risk. First at risk: <b>${label}</b>.`,
    vMissed: n => `${n} ${n === 1 ? 'CPT has' : 'CPTs have'} already departed with units left behind.`,
    progress: (c, n, p, tot) => `Shift progress: <b>${c}</b> of <b>${n}</b> CPTs cleared · <b>${p}</b> of <b>${tot}</b> units packed`,
    actionsTitle: 'Top actions',

    kNext: 'Next CPT',
    kNextSub: (label, rem) => `<b>${label}</b> · ${rem} units left`,
    kNone: 'none left this shift',
    kRisk: 'CPTs at risk',
    kRiskSub: w => `${w} more on watch`,
    kUnits: 'Units at risk',
    kUnitsSub: total => `of ${total} units still to pack`,
    kHc: 'Packers needed',
    kHcSub: cur => `${cur} on the line now`,
    kHcNa: 'adding packers cannot save every CPT',

    actAdd: (n, label, time) => `Add <b>${n}</b> ${n === 1 ? 'packer' : 'packers'} now to clear <b>${label}</b> before loading starts at ${L(time)}.`,
    actEscalate: (units, label) => `If you can't add people, <b>${units}</b> units on <b>${label}</b> will miss. Alert transportation now about a late departure or a split load.`,
    actLate: label => `<b>${label}</b> is already in its loading window with units left. Load what is ready and escalate the rest now.`,
    actWatch: (label, m) => `Watch <b>${label}</b>: only ${L(m)} min of buffer. Recheck units in 15 minutes.`,

    // board
    s1: 'Live board',
    s1hint: 'CPTs are worked earliest first, so each one waits for the volume of earlier CPTs. Packed units count up live while the line is working.',
    thCpt: 'CPT',
    thLeft: 'Time left',
    thTotal: 'Total units',
    thPacked: 'Packed',
    thRemain: 'Remaining',
    thFinish: 'Projected finish',
    thBuffer: 'Buffer',
    thStatus: 'Status',
    noCpts: 'Add a CPT time in the schedule to start.',
    min: 'min',
    cptLabel: (n, time) => `CPT ${n} · ${L(time)}`,
    stSafe: 'Safe',
    stWatch: 'Watch',
    stRisk: 'Miss risk',
    stMissed: 'CPT missed',
    stCleared: 'CPT cleared',
    stPacked: 'All packed',
    stReady: 'No volume',

    // setup
    s2: 'Facility & line setup',
    s2hint: 'Packing capacity is shared across all CPTs. The load buffer is the time needed to load the truck, so volume must be packed that many minutes before the CPT.',
    facility: 'Facility / warehouse',
    shiftStart: 'Shift start time',
    packers: 'Packers on line',
    rate: 'Rate per packer (UPH)',
    loadBuf: 'Load buffer before CPT (min)',
    watchMin: 'Watch threshold (min)',
    autoCount: 'Auto-count packed units',
    autoHint: 'When on, "Packed so far" grows every second at packers × rate × pace, earliest CPT first. Type the real count from your system at any time to correct it.',
    pace: 'Actual pace (% of planned rate)',
    speed: 'Demo speed',
    speed1: 'Real time',
    speed10: '10× (demo)',
    speed60: '60× (demo)',
    speedBadge: n => `Demo speed ${n}×`,
    packingNow: 'Packing now',
    capLine: (hr, mn, pace) => `Line output at ${L(pace + '%')} pace: <b>${hr}</b> units per hour (${mn} per minute)`,

    // schedule
    s3: 'CPT schedule',
    s3hint: (shift) => `CPT times for the ${shift}. Each shift starts with 4 CPTs. Add or remove times as needed. Times earlier than the shift start count as the next morning.`,
    thTime: 'CPT time',
    thTotalEdit: 'Total units to clear',
    thPackedEdit: 'Packed so far',
    markCleared: 'Mark cleared ✓',
    addCpt: '+ Add CPT time',
    removeCpt: 'Remove CPT',

    howTitle: 'How the risk is calculated',
    howList: `
      <li><b>Packed so far</b> counts up live at packers × rate per packer × actual pace. The line packs the earliest CPT first. When a CPT's pack deadline passes, its leftover units miss and the line moves on. Typing a real count resets the count from that number.</li>
      <li><b>Remaining units</b> = total units to clear − packed so far</li>
      <li><b>Line output</b> = packers × rate per packer × actual pace. All CPTs share it.</li>
      <li>CPTs are worked <b>earliest first</b>, so the line must finish all earlier CPTs' remaining units before a later one is done.</li>
      <li><b>Pack deadline</b> = CPT time − load buffer</li>
      <li><b>Projected finish</b> = now + (remaining units for this CPT and all earlier CPTs ÷ line capacity)</li>
      <li><b>Buffer</b> = pack deadline − projected finish. Negative means the CPT will miss at the current rate.</li>
      <li><b>Status</b> before the CPT time: All packed when every unit is packed, Miss risk if buffer is below 0, Watch if it is below the watch threshold, otherwise Safe.</li>
      <li><b>Result</b> once the CPT time is up: <b>CPT cleared</b> if every unit was packed, otherwise <b>CPT missed</b> with the units left behind.</li>
      <li><b>Packers needed</b> = the most packers any upcoming CPT needs to finish its own and all earlier remaining volume before its pack deadline.</li>`,
    builtBy: 'Built by',
    footerNote: 'All figures are illustrative sample data, not from any real site.',

    // dock
    dockSummary: (c, n, risk, watch) => `<b>${c}/${n}</b> cleared · <b>${risk}</b> at risk · <b>${watch}</b> on watch`,
    dockLeft: 'Left',
    unitsRemaining: 'units remaining',
    currentCpt: 'Current CPT',
    otherCpts: 'Rest of the shift',
    toCptShort: 'to CPT',
    heroPacked: (p, tot) => `${p} of ${tot} packed`,
    heroFinish: 'Projected finish',
    heroLoad: 'Packing deadline',
    heroBuffer: 'Buffer',
    heroDone: 'Shift complete',
    toCpt: time => `${L(time)} to CPT`,
    loadingNow: time => `Ready to load · ${L(time)} to CPT`,
    shipped: n => `${n} units shipped on time`,
    leftBehind: (n, total) => `${n} of ${total} units left behind`,
    dockBuffer: 'Buffer',
    dockOf: (p, t) => `${p} / ${t} packed`,
    soundOn: '🔊 Sound on',
    soundOff: '🔇 Sound off',
    soundEnable: '🔊 Tap to enable sound',
    fullscreen: '⛶ Full screen',
    dockHint: 'This screen updates live from the main board.',
    backToBoard: '← Back to board',

    // celebration
    congratsTitle: label => `${label} cleared!`,
    congratsMsg: (units, mins) => `${units} units packed with ${L(mins)} min to spare.`,
    congratsCheer: 'Great work, team! 🎉',
    congratsLast: 'That\'s every CPT for this shift. Outstanding! 🏆',

    // CSV
    csvHeader: ['Facility', 'Shift', 'CPT', 'Minutes left', 'Total units', 'Packed', 'Remaining', 'Projected finish', 'Buffer (min)', 'Units at risk', 'Status'],
    csvFile: 'cpt-risk-board.csv'
  },

  ar: {
    pageTitle: 'لوحة مخاطر مواعيد الشحن',
    dockPageTitle: 'شاشة الرصيف',
    title: 'لوحة مخاطر مواعيد الشحن (CPT)',
    subtitle: 'متابعة مباشرة لمواعيد الشحن الصادر لمنشأة واحدة · بيانات تجريبية فقط',
    langBtn: 'English',
    clockLabel: 'الآن',
    dock: 'فتح شاشة الرصيف ↗',
    exportCsv: 'تصدير CSV',
    reset: 'استعادة البيانات التجريبية',
    shiftDay: 'الوردية الصباحية',
    shiftNight: 'الوردية الليلية',
    shiftLabel: 'الوردية',

    s0: 'الوردية في لمحة',
    seeBoard: 'عرض اللوحة كاملة ↓',
    vNoneTitle: 'لا توجد مواعيد متبقية في هذه الوردية',
    vNone: 'غادرت جميع مواعيد هذه الوردية أو لا يوجد لها حجم. أضف مواعيد في الجدول لمتابعة العمل.',
    vOkTitle: 'جميع المواعيد ضمن الخطة',
    vOk: n => `يمكن إنجاز جميع المواعيد المتبقية (${n}) بمعدل التغليف الحالي.`,
    vWatchTitle: 'تحت المراقبة',
    vWatch: (label, m) => `<b>${label}</b> لديه هامش ${L(m)} دقيقة فقط. حافظ على الخط بكامل طاقته.`,
    vRiskTitle: 'موعد في خطر',
    vRisk: (n, units, label) => `عدد المواعيد التي ستفوت بالمعدل الحالي: ${n}، مما يعرّض <b>${units}</b> وحدة للخطر. أول موعد في خطر: <b>${label}</b>.`,
    vMissed: n => `عدد المواعيد التي غادرت مع بقاء وحدات لم تُشحن: ${n}.`,
    progress: (c, n, p, tot) => `تقدم الوردية: تم إنجاز <b>${c}</b> من <b>${n}</b> مواعيد · تم تغليف <b>${p}</b> من <b>${tot}</b> وحدة`,
    actionsTitle: 'أهم الإجراءات',

    kNext: 'الموعد القادم',
    kNextSub: (label, rem) => `<b>${label}</b> · متبقي ${rem} وحدة`,
    kNone: 'لا توجد مواعيد متبقية',
    kRisk: 'مواعيد في خطر',
    kRiskSub: w => `${w} أخرى تحت المراقبة`,
    kUnits: 'وحدات في خطر',
    kUnitsSub: total => `من أصل ${total} وحدة متبقية للتغليف`,
    kHc: 'المغلّفون المطلوبون',
    kHcSub: cur => `${cur} على الخط حاليًا`,
    kHcNa: 'إضافة مغلّفين لا تكفي لإنقاذ جميع المواعيد',

    actAdd: (n, label, time) => `أضف <b>${n}</b> ${n === 1 ? 'مغلّفًا' : 'مغلّفين'} الآن لإنجاز <b>${label}</b> قبل بدء التحميل الساعة ${L(time)}.`,
    actEscalate: (units, label) => `إذا تعذّرت إضافة عاملين، ستفوت <b>${units}</b> وحدة على <b>${label}</b>. أبلغ إدارة النقل الآن لتأخير المغادرة أو تقسيم الحمولة.`,
    actLate: label => `<b>${label}</b> دخل وقت التحميل مع بقاء وحدات. حمّل الجاهز وصعّد الباقي الآن.`,
    actWatch: (label, m) => `راقب <b>${label}</b>: الهامش ${L(m)} دقيقة فقط. أعد التحقق من الوحدات بعد 15 دقيقة.`,

    s1: 'اللوحة المباشرة',
    s1hint: 'يتم العمل على المواعيد الأقرب أولًا، لذلك ينتظر كل موعد إنجاز وحدات المواعيد التي قبله. تزداد الوحدات المغلّفة مباشرة أثناء عمل الخط.',
    thCpt: 'الموعد',
    thLeft: 'الوقت المتبقي',
    thTotal: 'إجمالي الوحدات',
    thPacked: 'تم تغليفه',
    thRemain: 'المتبقي',
    thFinish: 'الإنجاز المتوقع',
    thBuffer: 'الهامش',
    thStatus: 'الحالة',
    noCpts: 'أضف موعدًا في الجدول للبدء.',
    min: 'دقيقة',
    cptLabel: (n, time) => `موعد ${n} · ${L(time)}`,
    stSafe: 'آمن',
    stWatch: 'مراقبة',
    stRisk: 'خطر التفويت',
    stMissed: 'فات الموعد',
    stCleared: 'تم إنجاز الموعد',
    stPacked: 'تم التغليف بالكامل',
    stReady: 'لا يوجد حجم',

    s2: 'إعداد المنشأة والخط',
    s2hint: 'طاقة التغليف مشتركة بين جميع المواعيد. هامش التحميل هو الوقت اللازم لتحميل الشاحنة، لذا يجب إنهاء التغليف قبل الموعد بهذا العدد من الدقائق.',
    facility: 'المنشأة / المستودع',
    shiftStart: 'وقت بدء الوردية',
    packers: 'عدد المغلّفين على الخط',
    rate: 'معدل المغلّف (UPH)',
    loadBuf: 'هامش التحميل قبل الموعد (دقيقة)',
    watchMin: 'حد المراقبة (دقيقة)',
    autoCount: 'العدّ التلقائي للوحدات المغلّفة',
    autoHint: 'عند التفعيل، يزداد "تم تغليفه" كل ثانية بمعدل عدد المغلّفين × المعدل × نسبة الأداء، بدءًا بالموعد الأقرب. يمكنك إدخال العدد الفعلي من النظام في أي وقت لتصحيحه.',
    pace: 'الأداء الفعلي (% من المعدل المخطط)',
    speed: 'سرعة العرض التجريبي',
    speed1: 'الوقت الفعلي',
    speed10: '10× (تجريبي)',
    speed60: '60× (تجريبي)',
    speedBadge: n => `سرعة تجريبية ${n}×`,
    packingNow: 'يتم تغليفه الآن',
    capLine: (hr, mn, pace) => `إنتاج الخط بأداء ${L(pace + '%')}: <b>${hr}</b> وحدة في الساعة (${mn} في الدقيقة)`,

    s3: 'جدول المواعيد',
    s3hint: (shift) => `مواعيد ${shift}. تبدأ كل وردية بأربعة مواعيد، ويمكنك الإضافة أو الحذف حسب الحاجة. المواعيد التي تسبق وقت بدء الوردية تُحسب لصباح اليوم التالي.`,
    thTime: 'وقت الموعد',
    thTotalEdit: 'إجمالي الوحدات المطلوب إنجازها',
    thPackedEdit: 'تم تغليفه حتى الآن',
    markCleared: 'تم الإنجاز ✓',
    addCpt: '+ إضافة موعد',
    removeCpt: 'حذف الموعد',

    howTitle: 'طريقة حساب المخاطر',
    howList: `
      <li><b>تم تغليفه</b> يزداد مباشرة بمعدل عدد المغلّفين × معدل المغلّف × نسبة الأداء الفعلي. يغلّف الخط الموعد الأقرب أولًا، وعند انتهاء موعد إنهاء التغليف تفوت الوحدات المتبقية وينتقل الخط إلى الموعد التالي. إدخال عدد فعلي يعيد العدّ من ذلك الرقم.</li>
      <li><b>الوحدات المتبقية</b> = إجمالي الوحدات المطلوب إنجازها − ما تم تغليفه</li>
      <li><b>إنتاج الخط</b> = عدد المغلّفين × معدل المغلّف × نسبة الأداء الفعلي. وهو مشترك بين جميع المواعيد.</li>
      <li>يتم العمل على <b>المواعيد الأقرب أولًا</b>، لذا يجب إنهاء الوحدات المتبقية للمواعيد السابقة قبل إنجاز الموعد اللاحق.</li>
      <li><b>موعد إنهاء التغليف</b> = وقت الموعد − هامش التحميل</li>
      <li><b>الإنجاز المتوقع</b> = الآن + (الوحدات المتبقية لهذا الموعد وجميع المواعيد السابقة ÷ طاقة الخط)</li>
      <li><b>الهامش</b> = موعد إنهاء التغليف − الإنجاز المتوقع. القيمة السالبة تعني أن الموعد سيفوت بالمعدل الحالي.</li>
      <li><b>الحالة</b> قبل وقت الموعد: تم التغليف بالكامل عند تغليف جميع الوحدات، وخطر التفويت إذا كان الهامش أقل من صفر، ومراقبة إذا كان أقل من حد المراقبة، وإلا فهو آمن.</li>
      <li><b>النتيجة</b> عند حلول وقت الموعد: <b>تم إنجاز الموعد</b> إذا تم تغليف جميع الوحدات، وإلا <b>فات الموعد</b> مع عدد الوحدات المتبقية.</li>
      <li><b>المغلّفون المطلوبون</b> = أكبر عدد من المغلّفين يحتاجه أي موعد قادم لإنهاء وحداته المتبقية ووحدات ما قبله قبل موعد إنهاء التغليف.</li>`,
    builtBy: 'إعداد',
    footerNote: 'جميع الأرقام بيانات تجريبية للتوضيح وليست من أي موقع حقيقي.',

    dockSummary: (c, n, risk, watch) => `تم إنجاز <b>${L(c + '/' + n)}</b> · <b>${risk}</b> في خطر · <b>${watch}</b> تحت المراقبة`,
    dockLeft: 'المتبقي',
    unitsRemaining: 'وحدة متبقية',
    currentCpt: 'الموعد الحالي',
    otherCpts: 'باقي مواعيد الوردية',
    toCptShort: 'حتى الموعد',
    heroPacked: (p, tot) => `تم تغليف ${p} من ${tot}`,
    heroFinish: 'الإنجاز المتوقع',
    heroLoad: 'موعد إنهاء التغليف',
    heroBuffer: 'الهامش',
    heroDone: 'انتهت الوردية',
    toCpt: time => `${L(time)} حتى الموعد`,
    loadingNow: time => `جاهز للتحميل · ${L(time)} حتى الموعد`,
    shipped: n => `تم شحن ${n} وحدة في الموعد`,
    leftBehind: (n, total) => `بقيت ${n} من ${total} وحدة دون شحن`,
    dockBuffer: 'الهامش',
    dockOf: (p, t) => `تم تغليف ${p} من ${t}`,
    soundOn: '🔊 الصوت مفعّل',
    soundOff: '🔇 الصوت متوقف',
    soundEnable: '🔊 اضغط لتفعيل الصوت',
    fullscreen: '⛶ ملء الشاشة',
    dockHint: 'تتحدث هذه الشاشة مباشرة من اللوحة الرئيسية.',
    backToBoard: '→ العودة إلى اللوحة',

    congratsTitle: label => `تم إنجاز ${label}!`,
    congratsMsg: (units, mins) => `تم تغليف ${units} وحدة قبل الموعد بـ ${L(mins)} دقيقة.`,
    congratsCheer: 'أحسنتم يا فريق! 🎉',
    congratsLast: 'تم إنجاز جميع مواعيد هذه الوردية. عمل رائع! 🏆',

    csvHeader: ['المنشأة', 'الوردية', 'الموعد', 'الدقائق المتبقية', 'إجمالي الوحدات', 'تم تغليفه', 'المتبقي', 'الإنجاز المتوقع', 'الهامش (دقيقة)', 'الوحدات في خطر', 'الحالة'],
    csvFile: 'cpt-risk-board-ar.csv'
  }
};
