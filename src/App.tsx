import { useEffect } from 'react';
import { AtriumDashboardModal } from './components/AtriumDashboardModal';
import { CharacterCreator } from './components/CharacterCreator';
import { DialogAndChoiceModal } from './components/DialogAndChoiceModal';
import { FailureAndReportPanel } from './components/FailureAndReportPanel';
import { Game2DModeModal } from './components/Game2DModeModal';
import { GameViewport } from './components/GameViewport';
import { GuideModal } from './components/GuideModal';
import { HudOverlay } from './components/HudOverlay';
import { MainMenu } from './components/MainMenu';
import { MissionArchitectStudio } from './components/MissionArchitectStudio';
import { MissionControlCenterModal } from './components/MissionControlCenterModal';
import { MissionTablet } from './components/MissionTablet';
import { MissionVizOverlay } from './components/MissionVizOverlay';
import { PauseAndSettingsModal } from './components/PauseAndSettingsModal';
import { PitchPresentationModal } from './components/PitchPresentationModal';
import { ResultsScreen } from './components/ResultsScreen';
import { SkyPanel } from './components/SkyPanel';
import { StoryIntroModal } from './components/StoryIntroModal';
import { SystemsTechAndNasaPanel } from './components/SystemsTechAndNasaPanel';
import { TacticalMapModal } from './components/TacticalMapModal';
import { TelescopeAndCubeSatModal } from './components/TelescopeAndCubeSatModal';
import { WhatIfAndOrbitPanel } from './components/WhatIfAndOrbitPanel';
import { useGameStore } from './store/gameStore';

export default function App() {
  const lang = useGameStore((s) => s.lang);
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const s = useGameStore.getState();
      if (e.code === 'Escape' && s.pitchDeckOpen) {
        s.setPitchDeckOpen(false);
        return;
      }
      if (e.code === 'Escape' && s.architectOpen) {
        s.setArchitectOpen(false);
        return;
      }

      if (s.screen !== 'playing' && s.screen !== 'paused') return;

      if (e.code === 'Escape') {
        if (s.storyIntroOpen) s.setStoryIntroOpen(false);
        else if (s.mccOpen) s.setMccOpen(false);
        else if (s.systemsLabOpen) s.setSystemsLabOpen(false);
        else if (s.whatIfOpen) s.setWhatIfOpen(false);
        else if (s.reportOpen) s.setReportOpen(false);
        else if (s.mode2dOpen) s.setMode2dOpen(false);
        else if (s.dashboardOpen) s.setDashboardOpen(false);
        else if (s.telescopeLabOpen) s.setTelescopeLabOpen(false);
        else if (s.tabletOpen) s.setTabletOpen(false);
        else if (s.mapOpen) s.setMapOpen(false);
        else if (s.guideOpen) s.setGuideOpen(false);
        else if (s.skyOpen) s.setSkyOpen(false);
        else if (s.outpostMenuOpen) s.setOutpostMenuOpen(false);
        else s.setScreen(s.screen === 'paused' ? 'playing' : 'paused');
        return;
      }

      if (s.storyIntroOpen || s.architectOpen) return;

      if (e.code === 'KeyP') {
        s.setScreen(s.screen === 'paused' ? 'playing' : 'paused');
        return;
      }

      if (s.screen !== 'playing') return;

      if (e.code === 'Tab') {
        e.preventDefault();
        s.setTabletOpen(!s.tabletOpen);
      } else if (e.code === 'KeyM') {
        s.setMapOpen(!s.mapOpen);
      } else if (e.code === 'KeyG') {
        s.setGuideOpen(!s.guideOpen);
      } else if (e.code === 'KeyT') {
        s.setTelescopeLabOpen(!s.telescopeLabOpen);
      } else if (e.code === 'KeyN') {
        s.setDashboardOpen(!s.dashboardOpen);
      } else if (e.code === 'KeyK') {
        s.setMode2dOpen(!s.mode2dOpen, 'dashboard2d');
      } else if (e.code === 'KeyL') {
        s.setArchitectOpen(!s.architectOpen);
      } else if (e.code === 'KeyY') {
        s.setSkyOpen(!s.skyOpen);
      } else if (e.code === 'KeyB') {
        if (s.sceneEnv === 'planet') {
          s.setOutpostMenuOpen(!s.outpostMenuOpen);
        } else {
          s.setTabletOpen(!s.tabletOpen, 'builder');
        }
      } else if (e.code === 'KeyX') {
        if (s.sceneEnv === 'spaceflight') {
          s.setAutopilot(!s.spaceTelemetry.autopilotActive);
        }
      } else if (e.code === 'KeyH') {
        if (s.sceneEnv === 'spaceflight' || s.sceneEnv === 'interior') {
          s.cycleWeather();
        }
      } else if (e.code === 'Digit1') {
        s.returnToBridge();
      } else if (e.code === 'Digit2') {
        s.boardShipAndLaunch();
      } else if (e.code === 'Digit3') {
        s.openMissionViz();
      } else if (e.code === 'Digit4') {
        s.landOnPlanet(s.activePlanet);
      } else if (e.code === 'Digit5') {
        s.setSceneEnv('builder');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="relative h-screen w-screen overflow-hidden bg-[#07090e] text-[#eef2f9] select-none"
    >
      {/* Persistent 3D WebGL Viewport (Bridge / Spaceflight / GMAT Viz / Planet & Rover) */}
      <GameViewport />

      {/* Game Screens */}
      {screen === 'menu' && <MainMenu />}
      {screen === 'character' && <CharacterCreator />}
      {screen === 'results' && <ResultsScreen />}
      <MissionArchitectStudio />
      <PitchPresentationModal />

      {(screen === 'playing' || screen === 'paused') && (
        <>
          <HudOverlay />
          <MissionVizOverlay />
          <SkyPanel />
          <MissionTablet />
          <TacticalMapModal />
          <TelescopeAndCubeSatModal />
          <AtriumDashboardModal />
          <Game2DModeModal />
          <MissionControlCenterModal />
          <SystemsTechAndNasaPanel />
          <WhatIfAndOrbitPanel />
          <FailureAndReportPanel />
          <StoryIntroModal />
          <GuideModal />
          <DialogAndChoiceModal />
          {screen === 'paused' && <PauseAndSettingsModal />}
        </>
      )}
    </div>
  );
}
