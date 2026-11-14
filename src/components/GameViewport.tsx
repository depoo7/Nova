import { useEffect, useRef, useState } from 'react';
import { spaceAudio } from '../audio/spaceAudio';
import { SHIP_LIVERIES } from '../data/novaData';
import { registerEngineBridge, useGameStore } from '../store/gameStore';
import { NovaViewportEngine } from '../three/NovaViewportEngine';
import type { InteriorStationId } from '../types/game';

export function GameViewport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<NovaViewportEngine | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const sceneEnv = useGameStore((s) => s.sceneEnv);
  const screen = useGameStore((s) => s.screen);
  const lang = useGameStore((s) => s.lang);
  const activePlanet = useGameStore((s) => s.activePlanet);
  const character = useGameStore((s) => s.character);
  const suitO2 = useGameStore((s) => s.resources.suitO2);
  const shipConfig = useGameStore((s) => s.shipConfig);
  const shipMetrics = useGameStore((s) => s.shipMetrics);
  const discoveredPlanets = useGameStore((s) => s.discoveredPlanets);
  const collectedSampleIds = useGameStore((s) => s.collectedSampleIds);
  const discoveredCraterIds = useGameStore((s) => s.discoveredCraterIds);
  const completedScienceSiteIds = useGameStore((s) => s.completedScienceSiteIds);
  const scannedCreatureIds = useGameStore((s) => s.scannedCreatureIds);
  const surfaceBuildings = useGameStore((s) => s.surfaceBuildings);
  const virtualInput = useGameStore((s) => s.virtualInput);
  const shadowsEnabled = useGameStore((s) => s.shadowsEnabled);
  const settings = useGameStore((s) => s.settings);
  const tabletOpen = useGameStore((s) => s.tabletOpen);
  const mapOpen = useGameStore((s) => s.mapOpen);
  const guideOpen = useGameStore((s) => s.guideOpen);
  const pitchDeckOpen = useGameStore((s) => s.pitchDeckOpen);
  const telescopeLabOpen = useGameStore((s) => s.telescopeLabOpen);
  const dashboardOpen = useGameStore((s) => s.dashboardOpen);
  const mode2dOpen = useGameStore((s) => s.mode2dOpen);
  const mccOpen = useGameStore((s) => s.mccOpen);
  const systemsLabOpen = useGameStore((s) => s.systemsLabOpen);
  const whatIfOpen = useGameStore((s) => s.whatIfOpen);
  const reportOpen = useGameStore((s) => s.reportOpen);
  const digitalTwinState = useGameStore((s) => s.digitalTwinState);
  const specialists = useGameStore((s) => s.specialists);
  const personnelEffects = useGameStore((s) => s.personnelEffects);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const initialState = useGameStore.getState();
    const initialLivery =
      SHIP_LIVERIES.find((l) => l.id === initialState.shipConfig.liveryId) ||
      SHIP_LIVERIES[0];

    const handleStationInteract = (stationId: InteriorStationId) => {
      const s = useGameStore.getState();
      if (stationId === 'main_dashboard') s.setDashboardOpen(true);
      else if (stationId === 'control_2d') s.setMode2dOpen(true, 'space2d');
      else if (stationId === 'helm') s.boardShipAndLaunch();
      else if (stationId === 'nav') s.openMissionViz(s.missionVizTargetPlanet);
      else if (stationId === 'science_lab') s.setTelescopeLabOpen(true);
      else if (stationId === 'bio_bay') s.harvestBioBay();
      else if (stationId === 'lounge') s.takeLoungeBreak();
      else if (stationId === 'med_bay') s.runMedBayScan();
      else if (stationId === 'engineering') s.setTabletOpen(true, 'builder');
      else if (stationId === 'cargo_bay') s.inspectCargoBay();
      else if (stationId === 'comms_desk') s.talkCommsOfficer();
      else if (stationId === 'airlock') s.landOnPlanet(s.activePlanet);
    };

    const engine = new NovaViewportEngine(
      el,
      {
        onInteriorTelemetry: (snap) => useGameStore.getState().updateInteriorTelemetry(snap),
        onSpaceTelemetry: (snap) => useGameStore.getState().updateSpaceTelemetry(snap),
        onSurfaceTelemetry: (snap) => useGameStore.getState().updateSurfaceTelemetry(snap),
        onRingPassed: () => useGameStore.getState().onRingPassed(),
        onAsteroidMined: () => useGameStore.getState().onAsteroidMined(),
        onAsteroidHit: () => useGameStore.getState().onAsteroidHit(),
        onBarrelRoll: () => useGameStore.getState().onBarrelRollPerformed(),
        onOrbitArrived: (pId) => useGameStore.getState().onOrbitArrived(pId),
        onWeatherChanged: (w) => useGameStore.getState().onWeatherChanged(w),
        onRoverToggled: (inR) => useGameStore.getState().onRoverToggled(inR),
        onSampleCollected: (id, pId) => useGameStore.getState().onSampleCollected(id, pId),
        onCraterDiscovered: (id) => useGameStore.getState().onCraterDiscovered(id),
        onScienceSiteCompleted: (id, mb) =>
          useGameStore.getState().onScienceSiteCompleted(id, mb),
        onMonolithInspected: () => useGameStore.getState().onMonolithInspected(),
        onCreatureScanned: (id, name) => useGameStore.getState().onCreatureScanned(id, name),
        onPickupCollected: (id, pType) => useGameStore.getState().onPickupCollected(id, pType),
        onAlienDisturbed: (nameEn, nameAr) => useGameStore.getState().onAlienDisturbed(nameEn, nameAr),
        onAlienAttack: (nameEn, nameAr, inRover) =>
          useGameStore.getState().onAlienAttack(nameEn, nameAr, inRover),
        onSpacecraftRefuel: () => useGameStore.getState().onSpacecraftRefuel(true),
        onInteriorStationInteract: handleStationInteract,
        onRequestReturnBridge: () => useGameStore.getState().returnToBridge(),
        onRequestLandPlanet: (pId) => useGameStore.getState().landOnPlanet(pId),
        onLaserFire: () => spaceAudio.playLaser(),
        onBoostStart: () => spaceAudio.playBoost(),
        onRoverDriveAudio: (speedAbs, steerAbs, active) =>
          spaceAudio.updateRoverDrive(speedAbs, steerAbs, active),
        onContextLost: (lost) => setContextLost(lost),
        onMouseLockChanged: (locked) => useGameStore.getState().setMouseLockedState(locked),
      },
      initialState.character,
      initialLivery,
      initialState.shipMetrics,
      initialState.settings
    );

    engineRef.current = engine;

    registerEngineBridge({
      enterInteriorBridge: () => engine.enterInteriorBridge(),
      walkToInteriorStation: (stationId) => engine.walkToInteriorStation(stationId),
      launchToSpace: (fromP) => engine.launchToSpace(fromP),
      landOnPlanet: (pId) => engine.landOnPlanet(pId),
      setTargetPlanet: (pId, auto) => engine.setTargetPlanet(pId, auto),
      setAutopilot: (active) => engine.setAutopilot(active),
      triggerBarrelRoll: () => engine.triggerBarrelRoll(),
      fireOrScan: () => engine.fireOrScan(),
      toggleRover: () => engine.toggleRover(),
      cycleWeather: () => engine.cycleWeather(),
      setWeather: (w) => engine.setWeather(w),
      setCameraMode: (m) => engine.setCameraMode(m),
      resetSpaceShipNearHome: () => engine.resetSpaceShipNearHome(),
      setMissionVizState: (t, pId) => engine.setMissionVizState(t, pId),
      setMouseLocked: (locked) => engine.setMouseLocked(locked),
      toggleMouseLock: () => engine.toggleMouseLock(),
      applySettings: (nextSettings) => engine.applySettings(nextSettings),
      buildSurfaceStructure: (kind) => engine.buildSurfaceStructure(kind),
      setSuitO2: (o2) => engine.setSuitO2(o2),
      setDigitalTwinState: (twin) => engine.setDigitalTwinState(twin),
    });
    engine.setDigitalTwinState(initialState.digitalTwinState);

    return () => {
      registerEngineBridge(null);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setSceneEnv(sceneEnv, activePlanet);
  }, [sceneEnv, activePlanet]);

  useEffect(() => {
    const isPaused =
      screen !== 'playing' ||
      tabletOpen ||
      mapOpen ||
      guideOpen ||
      pitchDeckOpen ||
      telescopeLabOpen ||
      dashboardOpen ||
      mode2dOpen ||
      mccOpen ||
      systemsLabOpen ||
      whatIfOpen ||
      reportOpen;
    engineRef.current?.setPaused(isPaused && sceneEnv !== 'builder');
  }, [
    screen,
    tabletOpen,
    mapOpen,
    guideOpen,
    pitchDeckOpen,
    telescopeLabOpen,
    dashboardOpen,
    mode2dOpen,
    mccOpen,
    systemsLabOpen,
    whatIfOpen,
    reportOpen,
    sceneEnv,
  ]);

  useEffect(() => {
    engineRef.current?.setDigitalTwinState(digitalTwinState);
  }, [digitalTwinState]);

  useEffect(() => {
    engineRef.current?.setCharacterAppearance(character);
  }, [character]);

  useEffect(() => {
    engineRef.current?.setShipLiveryAndMetrics(shipConfig.liveryId, shipMetrics);
  }, [shipConfig.liveryId, shipMetrics]);

  useEffect(() => {
    engineRef.current?.setPersonnelEffects(personnelEffects);
  }, [personnelEffects]);

  useEffect(() => {
    engineRef.current?.setSpecialists(specialists);
  }, [specialists]);

  useEffect(() => {
    engineRef.current?.setDiscoveredPlanets(discoveredPlanets);
  }, [discoveredPlanets]);

  useEffect(() => {
    engineRef.current?.setSurfaceProgress(
      collectedSampleIds,
      discoveredCraterIds,
      completedScienceSiteIds,
      scannedCreatureIds,
      surfaceBuildings
    );
  }, [
    collectedSampleIds,
    discoveredCraterIds,
    completedScienceSiteIds,
    scannedCreatureIds,
    surfaceBuildings,
  ]);

  useEffect(() => {
    engineRef.current?.setVirtualInput(virtualInput);
  }, [virtualInput]);

  useEffect(() => {
    engineRef.current?.setShadowsEnabled(shadowsEnabled);
  }, [shadowsEnabled]);

  useEffect(() => {
    engineRef.current?.applySettings(settings);
  }, [settings]);

  useEffect(() => {
    engineRef.current?.setSuitO2(suitO2);
    spaceAudio.updateOxygenAlarm(suitO2, sceneEnv === 'planet' && screen === 'playing');
  }, [suitO2, sceneEnv, screen]);

  useEffect(() => {
    const ambientActive = screen === 'playing' || screen === 'paused';
    spaceAudio.updateAmbientState(sceneEnv, ambientActive);
  }, [sceneEnv, screen]);

  useEffect(() => {
    const unlockAudio = () => {
      spaceAudio.unlock();
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      spaceAudio.updateAmbientState('builder', false);
      spaceAudio.updateRoverDrive(0, 0, false);
      spaceAudio.updateOxygenAlarm(100, false);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      useGameStore.getState().simulationTick(1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#040710]">
      <div ref={containerRef} className="h-full w-full" />
      {contextLost && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 px-4 text-center">
          <div className="nova-panel max-w-md rounded-2xl p-6">
            <p className="text-base font-bold text-amber-300">
              {lang === 'ar'
                ? 'تم إعادة تهيئة عارض الرسوميات ثلاثية الأبعاد...'
                : 'Restoring 3D WebGL Viewport...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
