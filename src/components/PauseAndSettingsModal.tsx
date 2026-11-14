import {
  Bot,
  Cog,
  Gauge,
  Globe,
  Home,
  Keyboard,
  Monitor,
  MousePointer,
  Play,
  Save,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  Waves,
} from 'lucide-react';
import { spaceAudio } from '../audio/spaceAudio';
import { UI_COPY } from '../data/i18n';
import { useGameStore } from '../store/gameStore';
import type { QualityPreset } from '../types/game';

function StatusBadge({ active, muted }: { active: boolean; muted?: boolean }) {
  return (
    <span
      className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider ${
        muted
          ? 'border-white/10 bg-white/5 text-slate-400'
          : active
            ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300'
            : 'border-white/15 bg-white/5 text-slate-400'
      }`}
    >
      {active ? 'ON' : 'OFF'}
    </span>
  );
}

const QUALITY_PRESETS: Array<{ id: QualityPreset; ar: string; en: string }> = [
  { id: 'low', ar: 'منخفضة (أداء)', en: 'Low' },
  { id: 'medium', ar: 'متوسطة', en: 'Medium' },
  { id: 'high', ar: 'عالية', en: 'High' },
  { id: 'ultra', ar: 'فائقة (Ultra)', en: 'Ultra' },
];

const RESOLUTION_SCALES = [0.75, 1, 1.25, 1.5, 2];

const SPEED_TIERS: Array<{ value: number; ar: string; en: string }> = [
  { value: 1.0, ar: 'عادي (1.0x)', en: 'Normal (1.0x)' },
  { value: 1.35, ar: 'سريع (1.35x)', en: 'Fast (1.35x)' },
  { value: 1.75, ar: 'تيربو (1.75x)', en: 'Turbo (1.75x)' },
];

export function PauseAndSettingsModal() {
  const lang = useGameStore((s) => s.lang);
  const toggleLang = useGameStore((s) => s.toggleLang);
  const setScreen = useGameStore((s) => s.setScreen);
  const saveProgress = useGameStore((s) => s.saveProgress);
  const showToast = useGameStore((s) => s.showToast);
  const audioMuted = useGameStore((s) => s.audioMuted);
  const ambientHumEnabled = useGameStore((s) => s.ambientHumEnabled);
  const roverAudioEnabled = useGameStore((s) => s.roverAudioEnabled);
  const speechEnabled = useGameStore((s) => s.speechEnabled);
  const shadowsEnabled = useGameStore((s) => s.shadowsEnabled);
  const settings = useGameStore((s) => s.settings);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const toggleAmbientHum = useGameStore((s) => s.toggleAmbientHum);
  const toggleRoverAudio = useGameStore((s) => s.toggleRoverAudio);
  const toggleSpeech = useGameStore((s) => s.toggleSpeech);
  const toggleShadows = useGameStore((s) => s.toggleShadows);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const applyQualityPreset = useGameStore((s) => s.applyQualityPreset);

  const handleAudioToggle = (action: () => void) => {
    spaceAudio.unlock();
    action();
  };

  const hotkeyRows =
    lang === 'ar'
      ? [
          ['1 – 5', 'التنقل الفوري بين المكوك والفضاء والكواكب وGMAT'],
          ['WASD / الأسهم + Shift', 'الحركة والقيادة + التسارع الفائق (Sprint / Boost)'],
          ['Q / Z (فضاء)', 'رفع وخفض مقدمة المكوك في الطيران'],
          ['E / F', 'تفاعل وهبوط [E] • إطلاق بلازما / مسح الكائنات والعينات [F]'],
          ['R / Space', 'دوران 360° / ركوب الروفر [R] • نفاث القفز [Space]'],
          ['X / H / C', 'طيار آلي [X] • الطقس [H] • الكاميرا [C]'],
          ['B / Tab / M / T / N / K / Y', 'بناء قاعدة [B] • التابلت [Tab] • الخريطة [M] • التلسكوب [T] • البهو [N] • 2D [K] • سكاي [Y]'],
          ['Alt / V / Esc / P', 'دمج الماوس [Alt/V] • إغلاق أو إعدادات [Esc/P]'],
        ]
      : [
          ['1 – 5', 'Instant switch: Shuttle / Spaceflight / GMAT / Surface / Hangar'],
          ['WASD / Arrows + Shift', 'Move & Steer + Turbo Sprint / Boost'],
          ['Q / Z (Spaceflight)', 'Pitch Nose Up / Down cleanly'],
          ['E / F', 'Interact & Land [E] • Fire Plasma / Scan Aliens & Samples [F]'],
          ['R / Space', 'Barrel Roll / 6x6 Rover [R] • Low-G Jetpack Jump [Space]'],
          ['X / H / C', 'Autopilot [X] • Cycle Weather [H] • Camera View [C]'],
          ['B / Tab / M / T / N / K / Y', 'Outpost [B] • Tablet [Tab] • Map [M] • Scope [T] • Atrium [N] • 2D [K] • Sky [Y]'],
          ['Alt / V / Esc / P', 'Lock Mouse Look [Alt/V] • Close / Pause Settings [Esc/P]'],
        ];

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/78 p-4">
      <div className="nova-panel max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="font-display text-xl font-bold text-white">
            {lang === 'ar' ? 'الإعدادات والجودة وسرعة اللعب' : 'Settings, Graphics & Controls'}
          </h2>
          <button
            onClick={() => setScreen('playing')}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 transition hover:brightness-110"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{lang === 'ar' ? 'استئناف [Esc]' : 'Resume [Esc]'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* LEFT: Graphics Quality, Resolution & Display */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-cyan-300 uppercase">
              <Monitor className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'الجودة والدقة 3D' : 'Graphics Quality & Resolution'}</span>
            </div>

            {/* Quality Preset */}
            <div>
              <div className="mb-1.5 text-xs font-semibold text-slate-300">
                {lang === 'ar' ? 'مستوى الجودة العام' : 'Quality Preset'}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {QUALITY_PRESETS.map((q) => {
                  const active = settings.qualityPreset === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => applyQualityPreset(q.id)}
                      className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold whitespace-nowrap transition ${
                        active
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      {lang === 'ar' ? q.ar : q.en}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resolution Scale */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>{lang === 'ar' ? 'دقة العرض (Resolution Scale)' : 'Resolution Scale'}</span>
                <span className="font-mono text-cyan-300">{Math.round(settings.resolutionScale * 100)}%</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {RESOLUTION_SCALES.map((scale) => {
                  const active = Math.abs(settings.resolutionScale - scale) < 0.02;
                  return (
                    <button
                      key={scale}
                      onClick={() => updateSettings({ resolutionScale: scale })}
                      className={`rounded-lg border py-1.5 font-mono text-[11px] font-bold transition ${
                        active
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      {scale}x
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FOV Slider */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>{lang === 'ar' ? 'زاوية الرؤية (FOV)' : 'Field of View (FOV)'}</span>
                <span className="font-mono text-cyan-300">{settings.fov}°</span>
              </div>
              <input
                type="range"
                min={55}
                max={90}
                step={1}
                value={settings.fov}
                onChange={(e) => updateSettings({ fov: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Bloom & Shadows */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={toggleShadows}
                className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                <span className="flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span>{lang === 'ar' ? 'الظلال' : 'Shadows'}</span>
                </span>
                <StatusBadge active={shadowsEnabled} />
              </button>

              <button
                onClick={() => updateSettings({ bloomEnabled: !settings.bloomEnabled })}
                className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                  <span>{lang === 'ar' ? 'توهج Bloom' : 'Bloom'}</span>
                </span>
                <StatusBadge active={settings.bloomEnabled} />
              </button>
            </div>

            {/* Language */}
            <button
              onClick={toggleLang}
              className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              <span className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                {lang === 'ar' ? 'لغة الواجهة والكتابة' : 'UI Text Language'}
              </span>
              <span className="font-bold text-cyan-300">{UI_COPY.langToggle[lang]}</span>
            </button>
          </div>

          {/* RIGHT: Gameplay Speed, Controls & Audio */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-amber-300 uppercase">
              <Gauge className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'سرعة اللعب والتحكم' : 'Gameplay Speed & Controls'}</span>
            </div>

            {/* Speed Tier */}
            <div>
              <div className="mb-1.5 text-xs font-semibold text-slate-300">
                {lang === 'ar' ? 'سرعة الحركة والطيران والروفر' : 'Movement, Flight & Rover Speed'}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {SPEED_TIERS.map((tier) => {
                  const active = Math.abs(settings.gameplaySpeed - tier.value) < 0.05;
                  return (
                    <button
                      key={tier.value}
                      onClick={() => updateSettings({ gameplaySpeed: tier.value })}
                      className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold whitespace-nowrap transition ${
                        active
                          ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      {lang === 'ar' ? tier.ar : tier.en}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mouse Sensitivity + Invert Y */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <MousePointer className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{lang === 'ar' ? 'حساسية الماوس' : 'Mouse Sensitivity'}</span>
                </span>
                <span className="font-mono text-cyan-300">{settings.mouseSensitivity.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.05}
                value={settings.mouseSensitivity}
                onChange={(e) => updateSettings({ mouseSensitivity: Number(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>

            <button
              onClick={() => updateSettings({ invertY: !settings.invertY })}
              className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              <span>{lang === 'ar' ? 'عكس محور النظر Y' : 'Invert Mouse / Flight Y-Axis'}</span>
              <StatusBadge active={settings.invertY} />
            </button>

            {/* Master Volume Slider */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  {audioMuted ? (
                    <VolumeX className="h-3.5 w-3.5 text-rose-400" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
                  )}
                  <span>{lang === 'ar' ? 'مستوى الصوت العام' : 'Master Volume'}</span>
                </span>
                <span className="font-mono text-cyan-300">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.masterVolume}
                onChange={(e) => {
                  spaceAudio.unlock();
                  updateSettings({ masterVolume: Number(e.target.value) });
                }}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* 4 Audio Toggles Compact Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleAudioToggle(toggleMute)}
                className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-2.5 py-2 text-[11px] font-semibold text-white transition hover:bg-white/10"
              >
                <span className="flex items-center gap-1.5">
                  {audioMuted ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-cyan-400" />}
                  <span>{lang === 'ar' ? 'المؤثرات' : 'SFX'}</span>
                </span>
                <StatusBadge active={!audioMuted} />
              </button>

              <button
                onClick={() => handleAudioToggle(toggleAmbientHum)}
                className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-2.5 py-2 text-[11px] font-semibold text-white transition hover:bg-white/10"
              >
                <span className="flex items-center gap-1.5">
                  <Waves className="h-3.5 w-3.5 text-sky-400" />
                  <span>{lang === 'ar' ? 'الأجواء' : 'Ambient'}</span>
                </span>
                <StatusBadge active={ambientHumEnabled} muted={audioMuted} />
              </button>

              <button
                onClick={() => handleAudioToggle(toggleRoverAudio)}
                className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-2.5 py-2 text-[11px] font-semibold text-white transition hover:bg-white/10"
              >
                <span className="flex items-center gap-1.5">
                  <Cog className="h-3.5 w-3.5 text-amber-400" />
                  <span>{lang === 'ar' ? 'الروفر' : 'Rover'}</span>
                </span>
                <StatusBadge active={roverAudioEnabled} muted={audioMuted} />
              </button>

              <button
                onClick={() => handleAudioToggle(toggleSpeech)}
                className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-2.5 py-2 text-[11px] font-semibold text-white transition hover:bg-white/10"
              >
                <span className="flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5 text-violet-400" />
                  <span>{lang === 'ar' ? 'سكاي AI' : 'Sky Voice'}</span>
                </span>
                <StatusBadge active={speechEnabled} muted={audioMuted} />
              </button>
            </div>
          </div>
        </div>

        {/* Hotkeys Cheat Sheet */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
            <Keyboard className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'الاختصارات السريعة (Hotkeys)' : 'Fast Gameplay Hotkeys'}</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5 text-[11px] sm:grid-cols-2">
            {hotkeyRows.map(([k, desc]) => (
              <div
                key={k}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/35 px-2.5 py-1.5"
              >
                <span className="font-mono font-bold text-cyan-300 whitespace-nowrap">{k}</span>
                <span className="text-end text-slate-300">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <button
            onClick={() => {
              saveProgress();
              showToast(lang === 'ar' ? 'تم حفظ التقدم بنجاح ✓' : 'Mission Progress Saved ✓');
              setScreen('playing');
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/15 py-2.5 text-xs font-bold text-cyan-200 transition hover:bg-cyan-500/25"
          >
            <Save className="h-4 w-4" />
            <span>{lang === 'ar' ? 'حفظ المهمة' : 'Save Progress'}</span>
          </button>

          <button
            onClick={() => setScreen('playing')}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-xs font-bold text-slate-950 transition hover:brightness-110"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>{lang === 'ar' ? 'استئناف اللعب' : 'Resume'}</span>
          </button>

          <button
            onClick={() => setScreen('menu')}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-300 transition hover:text-white"
          >
            <Home className="h-4 w-4" />
            <span>{lang === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
