import { ArrowLeft, ArrowRight, Check, Globe, Rocket, Shield, UserCheck } from 'lucide-react';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { UI_COPY } from '../data/i18n';
import { useGameStore } from '../store/gameStore';
import { detectSoftwareGl } from '../three/NovaViewportEngine';
import { buildAstronautGroup, type AstronautRig } from '../three/characterMesh';
import type { Specialization, SuitModel } from '../types/game';

const SPECIALIZATIONS: Array<{ id: Specialization; ar: string; en: string }> = [
  { id: 'Flight Commander', ar: 'قائد الطيران الفضائي', en: 'Flight Commander' },
  { id: 'Aerospace Engineer', ar: 'مهندس الدفع والطاقة', en: 'Aerospace Engineer' },
  { id: 'Astrobiologist', ar: 'عالم الأحياء الكوكبية', en: 'Astrobiologist' },
];

const SUIT_MODELS: SuitModel[] = ['Vanguard EVA', 'Aegis Mk-IV', 'Horizon Science'];
const PRIMARY_COLORS = ['#e2e6ec', '#9e2a2b', '#d97736', '#4a8ca8', '#528f78', '#7e6ea8'];
const VISOR_COLORS = ['#0d1520', '#253d56', '#8f7236', '#3c6e85', '#3e6e5c'];

export function CharacterCreator() {
  const previewRef = useRef<HTMLDivElement>(null);
  const astroRef = useRef<AstronautRig | null>(null);

  const lang = useGameStore((s) => s.lang);
  const toggleLang = useGameStore((s) => s.toggleLang);
  const character = useGameStore((s) => s.character);
  const updateCharacter = useGameStore((s) => s.updateCharacter);
  const completeCharacterSetup = useGameStore((s) => s.completeCharacterSetup);
  const setScreen = useGameStore((s) => s.setScreen);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const isSoft = detectSoftwareGl();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#09101f');
    const camera = new THREE.PerspectiveCamera(42, el.clientWidth / Math.max(1, el.clientHeight), 0.1, 40);
    camera.position.set(0, 1.35, 3.6);
    camera.lookAt(0, 1.15, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !isSoft });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.setPixelRatio(isSoft ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.16;
    pmrem.dispose();

    const keyLight = new THREE.DirectionalLight('#fff8ee', 1.9);
    keyLight.position.set(3, 4, 4);
    const rimLight = new THREE.DirectionalLight('#93c5fd', 0.45);
    rimLight.position.set(-3, 2, -2);
    scene.add(new THREE.HemisphereLight('#cbd5e1', '#0f172a', 0.72), keyLight, rimLight);

    const pedGeo = new THREE.CylinderGeometry(1.05, 1.15, 0.16, 28);
    const pedMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.15, roughness: 0.85 });
    const ped = new THREE.Mesh(pedGeo, pedMat);
    ped.position.y = -0.08;
    scene.add(ped);

    const astro = buildAstronautGroup(useGameStore.getState().character, isSoft);
    astroRef.current = astro;
    scene.add(astro.root);

    let disposed = false;
    let frameId = 0;
    const clock = new THREE.Clock();

    const loop = () => {
      if (disposed) return;
      const t = clock.getElapsedTime();
      astro.root.rotation.y = t * 0.55;
      astro.setWalkCycle(0, false, t);
      renderer.render(scene, camera);
      if (isSoft) {
        frameId = window.setTimeout(loop, 80);
      } else {
        frameId = requestAnimationFrame(loop);
      }
    };
    loop();

    const onResize = () => {
      if (!el) return;
      camera.aspect = el.clientWidth / Math.max(1, el.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      if (isSoft) clearTimeout(frameId);
      else cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      astro.dispose();
      astroRef.current = null;
      pedGeo.dispose();
      pedMat.dispose();
      env.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    astroRef.current?.updateAppearance(character);
  }, [character]);

  return (
    <div className="relative z-20 flex h-full w-full items-center justify-center overflow-y-auto px-4 py-6">
      <div className="nova-panel w-full max-w-4xl rounded-3xl p-5 sm:p-8">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScreen('menu')}
              className="rounded-xl border border-white/15 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              title={UI_COPY.backToMenu[lang]}
            >
              {lang === 'ar' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            </button>
            <div>
              <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                {UI_COPY.creatorTitle[lang]}
              </h2>
              <p className="text-xs text-cyan-300/90">{UI_COPY.creatorSub[lang]}</p>
            </div>
          </div>

          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-500/20"
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">{UI_COPY.langToggle[lang]}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Live 3D Astronaut Viewport */}
          <div className="flex flex-col justify-between rounded-2xl border border-cyan-400/25 bg-[#09101f] p-3 md:col-span-5">
            <div ref={previewRef} className="h-64 w-full overflow-hidden rounded-xl sm:h-80" />
            <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
              <span className="font-semibold text-slate-300">
                {character.suitModel} ·{' '}
                {character.gender === 'female' ? UI_COPY.femaleLabel[lang] : UI_COPY.maleLabel[lang]}
              </span>
              <span className="font-bold text-cyan-300">
                {character.name.trim() || (lang === 'ar' ? 'قائد نوفا' : 'NOVA Commander')}
              </span>
            </div>
          </div>

          {/* Customization Controls */}
          <div className="space-y-4 md:col-span-7">
            {/* Male / Female Character Selection */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-300">
                {UI_COPY.genderLabel[lang]}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['male', 'female'] as const).map((g) => {
                  const active = (character.gender || 'male') === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => updateCharacter({ gender: g })}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-start transition cursor-pointer ${
                        active
                          ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-sm shadow-cyan-500/20'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <span className="text-xs font-bold">
                        {g === 'male' ? UI_COPY.maleLabel[lang] : UI_COPY.femaleLabel[lang]}
                      </span>
                      {active && <Check className="h-4 w-4 shrink-0 text-cyan-300" />}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Commander Name */}
            <div className="rounded-2xl border border-cyan-400/35 bg-cyan-500/10 p-3.5">
              <label className="mb-1.5 flex items-center gap-2 text-xs font-bold text-cyan-200">
                <UserCheck className="h-4 w-4 text-cyan-400" />
                <span>{UI_COPY.commanderNameLabel[lang]}</span>
              </label>
              <input
                type="text"
                maxLength={24}
                value={character.name}
                onChange={(e) => updateCharacter({ name: e.target.value })}
                placeholder={UI_COPY.commanderNamePlaceholder[lang]}
                className="w-full rounded-xl border border-white/20 bg-slate-950/90 px-4 py-2.5 text-sm font-semibold text-white placeholder-slate-500 outline-none focus:border-cyan-400"
              />
            </div>

            {/* Specialization */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-300">
                {UI_COPY.specializationLabel[lang]}
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {SPECIALIZATIONS.map((sp) => {
                  const active = character.specialization === sp.id;
                  return (
                    <button
                      key={sp.id}
                      onClick={() => updateCharacter({ specialization: sp.id })}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                        active
                          ? 'border-cyan-400 bg-cyan-500/20 text-white'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      {lang === 'ar' ? sp.ar : sp.en}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Suit Model */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-300">
                {UI_COPY.suitModelLabel[lang]}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SUIT_MODELS.map((m) => {
                  const active = character.suitModel === m;
                  return (
                    <button
                      key={m}
                      onClick={() => updateCharacter({ suitModel: m })}
                      className={`rounded-xl border px-2.5 py-2 text-xs font-bold transition ${
                        active
                          ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors & Helmet */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="mb-1.5 block text-xs font-bold text-slate-300">
                  {UI_COPY.primaryColorLabel[lang]}
                </span>
                <div className="flex items-center gap-2">
                  {PRIMARY_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateCharacter({ primaryColor: c })}
                      style={{ backgroundColor: c }}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${
                        character.primaryColor === c ? 'scale-110 border-white' : 'border-transparent opacity-75'
                      }`}
                    >
                      {character.primaryColor === c && <Check className="h-3.5 w-3.5 text-slate-950" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-bold text-slate-300">
                  {UI_COPY.visorColorLabel[lang]}
                </span>
                <div className="flex items-center gap-2">
                  {VISOR_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateCharacter({ visorColor: c })}
                      style={{ backgroundColor: c }}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${
                        character.visorColor === c ? 'scale-110 border-white' : 'border-transparent opacity-75'
                      }`}
                    >
                      {character.visorColor === c && <Check className="h-3.5 w-3.5 text-slate-950" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => updateCharacter({ helmetEquipped: !character.helmetEquipped })}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/10"
              >
                <Shield className="h-4 w-4 text-cyan-300" />
                <span>
                  {UI_COPY.helmetToggle[lang]}: {character.helmetEquipped ? (lang === 'ar' ? 'نعم' : 'ON') : (lang === 'ar' ? 'لا' : 'OFF')}
                </span>
              </button>

              <button
                onClick={completeCharacterSetup}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:brightness-110"
              >
                <Rocket className="h-4 w-4" />
                <span className="whitespace-nowrap">{UI_COPY.enterBridgeBtn[lang]}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
