import { BookOpen, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export function GuideModal() {
  const lang = useGameStore((s) => s.lang);
  const guideOpen = useGameStore((s) => s.guideOpen);
  const setGuideOpen = useGameStore((s) => s.setGuideOpen);

  if (!guideOpen) return null;

  const items =
    lang === 'ar'
      ? [
          {
            title: '1. الاختصارات السريعة والتحكم بالماوس [Alt / V]',
            rows: [
              'التبديل الفوري بين المشاهد: [1] داخل المكوك • [2] قيادة الفضاء • [3] محاكاة GMAT • [4] سطح الكوكب والروفر • [5] معاينة السفينة.',
              'دمج الماوس للنظر 360° بـ [Alt] أو [V] • الإعدادات والجودة والدقة وسرعة اللعب بـ [Esc] أو [P].',
              'النوافذ السريعة: [Tab] التابلت • [M] الخريطة • [T] مختبر التلسكوب • [N] داش بورد البهو • [K] وضع 2D • [L] مصمم المهمات (1-4 لاعبين) • [Y] محادثة سكاي AI.',
            ],
          },
          {
            title: '2. المكوك العملاق (36م×34م) والطيران الفضائي السريع',
            rows: [
              'داخل المكوك: مشي سريع بـ WASD + [Shift] للركض • اضغط [E] عند أي محطة أو انتقل فوراً من الشريط السفلي.',
              'بالفضاء: [W/S] دفع • [A/D] توجيه • [Q/Z] رفع وخفض المقدمة • [Shift/Space] حرق تيربو • [F] إطلاق بلازما • [R] دوران 360° • [X] الطيار الآلي • [H] تغيير الطقس • [E] الهبوط عند الاقتراب من الكوكب.',
            ],
          },
          {
            title: '3. سطح الكواكب، الكائنات الفضائية، وبناء القواعد [B]',
            rows: [
              'تتجول على كل كوكب كائنات فضائية حية مختلفة: إذا اقتربت منها بسرعة أو أزعجتها تغضب وتطاردك وتُلحق ضرراً بصحة البدلة والأكسجين والتبريد (العودة للمركبة عند منصة الهبوط بـ [F] أو [E] تُعيد التزود 100%).',
              'الصخور والتضاريس صلبة ولا يمكن اختراقها — اقفز فوقها بالنفاث [Space]، واضغط [B] لبناء قباب أكسجين ومحطات طاقة!',
              'اضغط [R] لركوب أو ترك المركبة الجوالة 6×6 و[Space] للقفز بالنفاث في الجاذبية المنخفضة.',
            ],
          },
          {
            title: '4. حيل حل مهام البقاء 2D [K] ومحاكاة رائد الفضاء الحقيقي',
            rows: [
              'القطاعات و CML و VR: انقطاع الإشارة الأرضية دائماً في Ground Segment؛ التزم بتسلسل CML 2 (الجدوى) ثم CML 3 (المفاضلة)؛ وتحدي VR يجمع 4 أعمدة معاً.',
              'GMAT و MDL و Mission Viz: اضبط GMAT حول 870 m/s و 22° مع Perigee Burn؛ في MDL التبريد ~76% وسقف الدفع ~54%؛ وفي Mission Viz حرّك الزمن عند 0.64T (المؤشر البرتقالي).',
              'التلسكوب (3 مستويات) و CubeSat و CSA: L1 تحت الحمراء+مجزأة | L2 فوق بنفسجية+كوروناجراف | L3 X-Ray+مرايا متداخلة • CubeSat: ConOps ← Bus ← Launch ← RF • Canadarm: 77% و FGS 94%.',
              'رائد الفضاء الحقيقي: فعّل التنفس المسبق O2 (29.6 kPa)، نظّف CO2 إذا تجاوز 3.0، اضبط تبريد LCVG بين الشمس والظل، واستخدم الدفع العكسي في انعدام الجاذبية 0-G لإصلاح الهيكل (+15%).',
            ],
          },
        ]
      : [
          {
            title: '1. Fast Hotkeys & Mouse Look [Alt / V]',
            rows: [
              'Instant Scene Switch: [1] Shuttle Interior • [2] Spaceflight • [3] GMAT Trajectory • [4] Planet & Rover • [5] Ship Hangar.',
              'Toggle 360° Mouse Look with [Alt] or [V] • Open Quality, Resolution & Speed Settings anytime with [Esc] or [P].',
              'Quick Panels: [Tab] Tablet • [M] Tactical Map • [T] Telescope Lab • [N] Atrium Dashboard • [K] 2D Mode • [L] Mission Design Studio (1-4P) • [Y] Sky AI.',
            ],
          },
          {
            title: '2. Multi-Deck Shuttle & High-Speed Spaceflight',
            rows: [
              'Shuttle Interior: Move fast with WASD + [Shift] sprint • Press [E] near any room console or jump via the bottom directory.',
              'Spaceflight: [W/S] Thrust • [A/D] Yaw • [Q/Z] Pitch Up/Down • [Shift/Space] Turbo Burn • [F] Fire Plasma • [R] Barrel Roll • [X] Autopilot • [H] Weather • [E] Land at Orbit.',
            ],
          },
          {
            title: '3. Planet Surface: Alien Wildlife, Pickups & Outposts [B]',
            rows: [
              'Every planet hosts roaming alien creatures: crowding, sprinting, or disturbing them triggers hostile pursuit that drains Suit Health, O2, Power & Coolant — retreat to the Spacecraft Pad ([F] Refuel or [E] Board) to recharge 100%!',
              'All planet boulders & structures have solid collision (jump onto or over rocks with [Space] jetpack); press [B] to build Habitat O2 Domes or Solar Relays.',
              'Press [R] near the 6x6 Rover to drive or exit, and hold [Space] for high-thrust low-gravity jetpack jumps.',
            ],
          },
          {
            title: '4. Survival Missions [K]: Tips & Tricks + Real Astronaut Sim',
            rows: [
              'Segments, CML & VR: Earth receiver loss = Ground Segment; always pass CML 2 Feasibility + CML 3 Trades before CML 4; VR Challenge combines all 4 pillars.',
              'GMAT, MDL & Mission Viz: GMAT sweet spot is ~870 m/s, 22°, Perigee Burn; MDL needs ~76% cooling + ~54% propulsion cap; Mission Viz Eclipse lies at ~0.64T (Amber marker) + RTG Coast.',
              'Telescope (3 Levels), CubeSat & CSA: L1 IR+Segmented | L2 UV+Coronagraph | L3 X-Ray+Grazing • CubeSat order: ConOps → Bus → Launch → RF • CSA Canadarm ~77% + FGS ~94%.',
              'Real Astronaut Sim: Run O2 Pre-Breathe (29.6 kPa), purge CO2 past 3.0 mmHg, tune LCVG cooling between Orbital Day/Eclipse, and repair 3 0-G hull nodes with SAFER thrusters (+15% Hull).',
            ],
          },
        ];

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
      <div className="nova-panel max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-cyan-300">
            <BookOpen className="h-5 w-5" />
            <h2 className="font-display text-lg font-bold text-white">
              {lang === 'ar' ? 'دليل المركبة والطيران والروفر والقواعد' : 'NOVA Unified Command & Flight Guide'}
            </h2>
          </div>
          <button
            onClick={() => setGuideOpen(false)}
            className="rounded-xl border border-white/15 bg-white/5 p-2 text-slate-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {items.map((sec) => (
            <div key={sec.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-2 text-sm font-bold text-amber-300">{sec.title}</h3>
              <ul className="space-y-1.5 text-xs leading-relaxed text-slate-200">
                {sec.rows.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
