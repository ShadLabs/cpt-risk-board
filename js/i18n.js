// English and Arabic text for the CPT Risk Board.
// Static page text uses data-i18n keys; dynamic text uses the functions below.
const L = v => `<bdi dir="ltr">${v}</bdi>`; // keeps times and numbers like -12 readable in Arabic

const I18N = {
  en: {
    pageTitle: 'CPT Risk Board',
    title: 'CPT Risk Board',
    subtitle: 'Live outbound departure tracker · sample data only',
    langBtn: 'العربية',
    clockLabel: 'Now',
    dock: 'Dock screen',
    exitDock: 'Exit dock screen',
    exportCsv: 'Export CSV',
    reset: 'Reset to sample',

    // overview
    s0: 'Shift at a glance',
    seeBoard: 'See full board ↓',
    vNoneTitle: 'No upcoming CPTs',
    vNone: 'Add departures in the CPT schedule to start tracking.',
    vOkTitle: 'All CPTs on track',
    vOk: n => `All ${n} upcoming ${n === 1 ? 'CPT' : 'CPTs'} can be cleared at the current pack rate.`,
    vWatchTitle: 'Watch closely',
    vWatch: (n, name, m) => `${n} ${n === 1 ? 'CPT is' : 'CPTs are'} on watch. The tightest is <b>${name}</b> with only ${L(m)} min of buffer.`,
    vRiskTitle: 'CPT at risk',
    vRisk: (n, units, name) => `${n} ${n === 1 ? 'CPT' : 'CPTs'} will miss at the current rate, putting <b>${units}</b> units at risk. First at risk: <b>${name}</b>.`,
    vMissed: n => `${n} ${n === 1 ? 'CPT has' : 'CPTs have'} already departed with units left behind.`,
    actionsTitle: 'Top actions',

    kNext: 'Next CPT',
    kNextSub: (name, time) => `<b>${name}</b> at ${L(time)}`,
    kNone: 'none upcoming',
    kRisk: 'CPTs at risk',
    kRiskSub: w => `${w} more on watch`,
    kUnits: 'Units at risk',
    kUnitsSub: total => `of ${total} units still to pack`,
    kHc: 'Packers needed',
    kHcSub: cur => `${cur} on the line now`,
    kHcNa: 'adding packers cannot save every CPT',

    actAdd: (n, name, time) => `Add <b>${n}</b> ${n === 1 ? 'packer' : 'packers'} now to clear <b>${name}</b> before loading at ${L(time)}.`,
    actEscalate: (units, name) => `If you can't add people, <b>${units}</b> units on <b>${name}</b> will miss. Alert transportation now about a late departure or a split load.`,
    actLate: name => `<b>${name}</b> is already inside its load window with units left. Load what is ready and escalate the rest now.`,
    actWatch: (name, m) => `Watch <b>${name}</b>: only ${L(m)} min of buffer. Recheck units in 15 minutes.`,

    // board
    s1: 'Live board',
    s1hint: 'CPTs are worked earliest first, so each one waits for the volume of earlier CPTs. Update units left as volume moves to keep the board accurate.',
    thRoute: 'Route / carrier',
    thCpt: 'CPT',
    thLeft: 'Time left',
    thUnits: 'Units left',
    thFinish: 'Projected finish',
    thBuffer: 'Buffer',
    thStatus: 'Status',
    noCpts: 'Add a departure in the CPT schedule to start.',
    min: 'min',
    stSafe: 'Safe',
    stWatch: 'Watch',
    stRisk: 'Miss risk',
    stMissed: 'Missed',
    stDeparted: 'Departed',
    stReady: 'Ready',

    // setup
    s2: 'Line setup',
    s2hint: 'Packing capacity is shared across all CPTs. The load buffer is the time needed to load the truck, so volume must be packed that many minutes before the CPT.',
    packers: 'Packers on line',
    rate: 'Rate per packer (UPH)',
    loadBuf: 'Load buffer before CPT (min)',
    watchMin: 'Watch threshold (min)',
    capLine: (hr, mn) => `Line capacity: <b>${hr}</b> units per hour (${mn} per minute)`,

    // schedule
    s3: 'CPT schedule',
    s3hint: 'Enter each departure and the units still to pack for it. CPTs more than 6 hours in the past are treated as tomorrow.',
    thUnitsEdit: 'Units left to pack',
    addCpt: '+ Add departure',
    newRoute: 'New route',
    unnamed: 'Unnamed',
    removeCpt: 'Remove departure',

    howTitle: 'How the risk is calculated',
    howList: `
      <li><b>Line capacity</b> = packers × rate per packer. All CPTs share it.</li>
      <li>CPTs are worked <b>earliest first</b>, so the line must finish all earlier CPTs' units before a later one is done.</li>
      <li><b>Pack deadline</b> = CPT time − load buffer</li>
      <li><b>Projected finish</b> = now + (units for this CPT and all earlier CPTs ÷ line capacity)</li>
      <li><b>Buffer</b> = pack deadline − projected finish. Negative means the CPT will miss at the current rate.</li>
      <li><b>Status</b>: Miss risk if buffer is below 0, Watch if it is below the watch threshold, otherwise Safe.</li>
      <li><b>Units at risk</b> = units that cannot be packed before the pack deadline at the current rate.</li>
      <li><b>Packers needed</b> = the most packers any upcoming CPT needs to finish its volume, and all earlier volume, before its pack deadline.</li>`,
    builtBy: 'Built by',
    footerNote: 'All figures are illustrative sample data, not from any real site.',

    // dock
    dockSummary: (risk, watch, units) => `<b>${risk}</b> at risk · <b>${watch}</b> on watch · <b>${units}</b> units at risk`,
    dockUnits: 'Units',
    dockBuffer: 'Buffer',

    // CSV
    csvHeader: ['Route / carrier', 'CPT', 'Minutes left', 'Units left', 'Projected finish', 'Buffer (min)', 'Units at risk', 'Status'],
    csvFile: 'cpt-risk-board.csv'
  },

  ar: {
    pageTitle: 'لوحة مخاطر مواعيد الشحن',
    title: 'لوحة مخاطر مواعيد الشحن (CPT)',
    subtitle: 'متابعة مباشرة لمغادرات الشحن الصادر · بيانات تجريبية فقط',
    langBtn: 'English',
    clockLabel: 'الآن',
    dock: 'شاشة الرصيف',
    exitDock: 'إغلاق شاشة الرصيف',
    exportCsv: 'تصدير CSV',
    reset: 'استعادة البيانات التجريبية',

    s0: 'الوردية في لمحة',
    seeBoard: 'عرض اللوحة كاملة ↓',
    vNoneTitle: 'لا توجد مواعيد قادمة',
    vNone: 'أضف المغادرات في جدول المواعيد لبدء المتابعة.',
    vOkTitle: 'جميع المواعيد ضمن الخطة',
    vOk: n => `يمكن إنجاز جميع المواعيد القادمة (${n}) بمعدل التغليف الحالي.`,
    vWatchTitle: 'تحت المراقبة',
    vWatch: (n, name, m) => `عدد المواعيد تحت المراقبة: ${n}. أضيقها <b>${name}</b> بهامش ${L(m)} دقيقة فقط.`,
    vRiskTitle: 'موعد في خطر',
    vRisk: (n, units, name) => `عدد المواعيد التي ستفوت بالمعدل الحالي: ${n}، مما يعرّض <b>${units}</b> وحدة للخطر. أول موعد في خطر: <b>${name}</b>.`,
    vMissed: n => `عدد المواعيد التي غادرت مع بقاء وحدات لم تُشحن: ${n}.`,
    actionsTitle: 'أهم الإجراءات',

    kNext: 'الموعد القادم',
    kNextSub: (name, time) => `<b>${name}</b> الساعة ${L(time)}`,
    kNone: 'لا توجد مواعيد قادمة',
    kRisk: 'مواعيد في خطر',
    kRiskSub: w => `${w} أخرى تحت المراقبة`,
    kUnits: 'وحدات في خطر',
    kUnitsSub: total => `من أصل ${total} وحدة متبقية للتغليف`,
    kHc: 'المغلّفون المطلوبون',
    kHcSub: cur => `${cur} على الخط حاليًا`,
    kHcNa: 'إضافة مغلّفين لا تكفي لإنقاذ جميع المواعيد',

    actAdd: (n, name, time) => `أضف <b>${n}</b> ${n === 1 ? 'مغلّفًا' : 'مغلّفين'} الآن لإنجاز <b>${name}</b> قبل بدء التحميل الساعة ${L(time)}.`,
    actEscalate: (units, name) => `إذا تعذّرت إضافة عاملين، ستفوت <b>${units}</b> وحدة على <b>${name}</b>. أبلغ إدارة النقل الآن لتأخير المغادرة أو تقسيم الحمولة.`,
    actLate: name => `<b>${name}</b> دخل وقت التحميل مع بقاء وحدات. حمّل الجاهز وصعّد الباقي الآن.`,
    actWatch: (name, m) => `راقب <b>${name}</b>: الهامش ${L(m)} دقيقة فقط. أعد التحقق من الوحدات بعد 15 دقيقة.`,

    s1: 'اللوحة المباشرة',
    s1hint: 'يتم العمل على المواعيد الأقرب أولًا، لذلك ينتظر كل موعد إنجاز وحدات المواعيد التي قبله. حدّث الوحدات المتبقية مع تقدم العمل لتبقى اللوحة دقيقة.',
    thRoute: 'المسار / الناقل',
    thCpt: 'الموعد',
    thLeft: 'الوقت المتبقي',
    thUnits: 'الوحدات المتبقية',
    thFinish: 'الإنجاز المتوقع',
    thBuffer: 'الهامش',
    thStatus: 'الحالة',
    noCpts: 'أضف مغادرة في جدول المواعيد للبدء.',
    min: 'دقيقة',
    stSafe: 'آمن',
    stWatch: 'مراقبة',
    stRisk: 'خطر التفويت',
    stMissed: 'فات',
    stDeparted: 'غادر',
    stReady: 'جاهز',

    s2: 'إعداد الخط',
    s2hint: 'طاقة التغليف مشتركة بين جميع المواعيد. هامش التحميل هو الوقت اللازم لتحميل الشاحنة، لذا يجب إنهاء التغليف قبل الموعد بهذا العدد من الدقائق.',
    packers: 'عدد المغلّفين على الخط',
    rate: 'معدل المغلّف (UPH)',
    loadBuf: 'هامش التحميل قبل الموعد (دقيقة)',
    watchMin: 'حد المراقبة (دقيقة)',
    capLine: (hr, mn) => `طاقة الخط: <b>${hr}</b> وحدة في الساعة (${mn} في الدقيقة)`,

    s3: 'جدول المواعيد',
    s3hint: 'أدخل كل مغادرة والوحدات المتبقية لتغليفها. المواعيد التي مضى عليها أكثر من 6 ساعات تُعامل كمواعيد الغد.',
    thUnitsEdit: 'الوحدات المتبقية للتغليف',
    addCpt: '+ إضافة مغادرة',
    newRoute: 'مسار جديد',
    unnamed: 'بدون اسم',
    removeCpt: 'حذف المغادرة',

    howTitle: 'طريقة حساب المخاطر',
    howList: `
      <li><b>طاقة الخط</b> = عدد المغلّفين × معدل المغلّف. وهي مشتركة بين جميع المواعيد.</li>
      <li>يتم العمل على <b>المواعيد الأقرب أولًا</b>، لذا يجب إنهاء وحدات المواعيد السابقة قبل إنجاز الموعد اللاحق.</li>
      <li><b>موعد إنهاء التغليف</b> = وقت الموعد − هامش التحميل</li>
      <li><b>الإنجاز المتوقع</b> = الآن + (وحدات هذا الموعد وجميع المواعيد السابقة ÷ طاقة الخط)</li>
      <li><b>الهامش</b> = موعد إنهاء التغليف − الإنجاز المتوقع. القيمة السالبة تعني أن الموعد سيفوت بالمعدل الحالي.</li>
      <li><b>الحالة</b>: خطر التفويت إذا كان الهامش أقل من صفر، ومراقبة إذا كان أقل من حد المراقبة، وإلا فهو آمن.</li>
      <li><b>الوحدات في خطر</b> = الوحدات التي لا يمكن تغليفها قبل موعد إنهاء التغليف بالمعدل الحالي.</li>
      <li><b>المغلّفون المطلوبون</b> = أكبر عدد من المغلّفين يحتاجه أي موعد قادم لإنهاء وحداته ووحدات ما قبله قبل موعد إنهاء التغليف.</li>`,
    builtBy: 'إعداد',
    footerNote: 'جميع الأرقام بيانات تجريبية للتوضيح وليست من أي موقع حقيقي.',

    dockSummary: (risk, watch, units) => `<b>${risk}</b> في خطر · <b>${watch}</b> تحت المراقبة · <b>${units}</b> وحدة في خطر`,
    dockUnits: 'الوحدات',
    dockBuffer: 'الهامش',

    csvHeader: ['المسار / الناقل', 'الموعد', 'الدقائق المتبقية', 'الوحدات المتبقية', 'الإنجاز المتوقع', 'الهامش (دقيقة)', 'الوحدات في خطر', 'الحالة'],
    csvFile: 'cpt-risk-board-ar.csv'
  }
};
