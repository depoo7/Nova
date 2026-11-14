import * as THREE from 'three';
import type {
  InteriorStationId,
  Language,
  ShuttleRoomId,
  ShuttleSpecialist,
  SpecialistId,
} from '../types/game';
import { buildAstronautGroup, type AstronautRig } from './characterMesh';
import {
  createAerospaceHullTextures,
  createAtriumDashboardTexture,
  createCockpitConsoleTexture,
  createDeckFloorTextures,
  createRoomHeaderTexture,
} from './proceduralTextures';

export interface InteriorStation {
  id: InteriorStationId;
  label: Record<Language, string>;
  shortName: Record<Language, string>;
  position: THREE.Vector3;
  walkTarget: THREE.Vector3;
  radius: number;
}

export interface InteriorWorldHandle {
  group: THREE.Group;
  stations: InteriorStation[];
  holoPlanet: THREE.Mesh;
  holoRing: THREE.Mesh;
  coffeeSteamLight: THREE.PointLight;
  reactorRing: THREE.Mesh;
  syncSpecialists: (specialists: ShuttleSpecialist[]) => void;
  updateNpcs: (elapsed: number) => void;
  dispose: () => void;
}

/**
 * Builds the massive 36m x 34m Multi-Room Space Shuttle Orbiter Complex:
 * - PBR aerospace bulkhead walls & treaded anti-slip deck plates (bump + roughness maps)
 * - Overhead structural Atrium arches with glowing skylight bay revealing deep-space stars
 * - Armored corridor observation windows peering into the Hydroponics, Reactor & Lab rooms
 * - Main Central Atrium with Master Telemetry Dashboard & 2D Tactical Mode Console
 * - 10 enclosed rooms across Port, Center, and Starboard wings, each with glowing doorway signage
 * - 10 dedicated animated 3D Specialist Crew Members — relocatable across all 10 rooms!
 */
export function buildSpacecraftInterior(
  isSoftwareGl: boolean,
  maxAniso = 4
): InteriorWorldHandle {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const wallPbr = createAerospaceHullTextures('#1b2538', maxAniso);
  [wallPbr.map, wallPbr.bumpMap, wallPbr.roughnessMap].forEach((t) => t.repeat.set(12, 10));

  const deckPbr = createDeckFloorTextures(maxAniso);
  [deckPbr.map, deckPbr.bumpMap, deckPbr.roughnessMap].forEach((t) => t.repeat.set(14, 14));

  const helmScreenTex = createCockpitConsoleTexture('SHUTTLE FLIGHT DECK', '#38bdf8');
  const engScreenTex = createCockpitConsoleTexture('MDL & FUSION REACTOR', '#f59e0b');
  const bioScreenTex = createCockpitConsoleTexture('BOTANY & LIFE SUPPORT', '#34d399');
  const medScreenTex = createCockpitConsoleTexture('BIOMED & RADIATION', '#f43f5e');
  const commsScreenTex = createCockpitConsoleTexture('DSN DEEP SPACE UPLINK', '#a855f7');
  const console2dTex = createCockpitConsoleTexture('2D TACTICAL MODE HUB', '#22d3ee');
  const atriumDashTex = createAtriumDashboardTexture();

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallPbr.map,
    bumpMap: wallPbr.bumpMap,
    bumpScale: 0.015,
    roughnessMap: wallPbr.roughnessMap,
    color: '#64748b',
    metalness: 0.12,
    roughness: 0.86,
    envMapIntensity: 0.15,
  });
  const deckMat = new THREE.MeshStandardMaterial({
    map: deckPbr.map,
    bumpMap: deckPbr.bumpMap,
    bumpScale: 0.018,
    roughnessMap: deckPbr.roughnessMap,
    color: '#475569',
    metalness: 0.1,
    roughness: 0.9,
    envMapIntensity: 0.14,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: '#161e2b',
    metalness: 0.18,
    roughness: 0.82,
    envMapIntensity: 0.15,
  });
  const woodWarmMat = new THREE.MeshStandardMaterial({
    color: '#78350f',
    metalness: 0.04,
    roughness: 0.86,
    envMapIntensity: 0.12,
  });
  const fabricMat = new THREE.MeshStandardMaterial({
    color: '#1e3a5f',
    metalness: 0.04,
    roughness: 0.92,
    envMapIntensity: 0.1,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#b87624',
    metalness: 0.24,
    roughness: 0.66,
    envMapIntensity: 0.16,
  });
  const solarMat = new THREE.MeshStandardMaterial({
    color: '#0c4a6e',
    emissive: '#0284c7',
    emissiveIntensity: 0.1,
    metalness: 0.18,
    roughness: 0.72,
    envMapIntensity: 0.16,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#bae6fd',
    transparent: true,
    opacity: 0.08,
    roughness: 0.26,
    metalness: 0.04,
    clearcoat: 0.08,
    envMapIntensity: 0.16,
    side: THREE.DoubleSide,
  });
  const cyanStripMat = new THREE.MeshBasicMaterial({ color: '#0e7490' });
  const amberStripMat = new THREE.MeshBasicMaterial({ color: '#92400e' });
  const emeraldStripMat = new THREE.MeshBasicMaterial({ color: '#059669' });
  const plasmaMat = new THREE.MeshBasicMaterial({
    color: '#ea580c',
    transparent: true,
    opacity: 0.56,
  });
  const bioMat = new THREE.MeshStandardMaterial({
    color: '#2b8c69',
    emissive: '#065f46',
    emissiveIntensity: 0.2,
    roughness: 0.86,
    metalness: 0.04,
  });

  disposables.push(
    wallPbr.map,
    wallPbr.bumpMap,
    wallPbr.roughnessMap,
    deckPbr.map,
    deckPbr.bumpMap,
    deckPbr.roughnessMap,
    helmScreenTex,
    engScreenTex,
    bioScreenTex,
    medScreenTex,
    commsScreenTex,
    console2dTex,
    atriumDashTex,
    wallMat,
    deckMat,
    trimMat,
    woodWarmMat,
    fabricMat,
    brassMat,
    solarMat,
    glassMat,
    cyanStripMat,
    amberStripMat,
    emeraldStripMat,
    plasmaMat,
    bioMat
  );

  // ==============================================================
  // 1. MASSIVE 36m x 34m SHUTTLE DECK HULL + SKYLIGHT ATRIUM ROOF
  // ==============================================================
  const floorGeo = new THREE.BoxGeometry(36, 0.32, 34);
  const floor = new THREE.Mesh(floorGeo, deckMat);
  floor.position.set(0, -0.16, 0.5);
  floor.receiveShadow = !isSoftwareGl;
  group.add(floor);

  // Wing ceilings over Port and Starboard rooms + open glass skylight over Center Atrium!
  const wingCeilingGeo = new THREE.BoxGeometry(11.6, 0.32, 28);
  const portCeiling = new THREE.Mesh(wingCeilingGeo, trimMat);
  portCeiling.position.set(-12.2, 4.9, 3.2);
  const stbdCeiling = new THREE.Mesh(wingCeilingGeo, trimMat);
  stbdCeiling.position.set(12.2, 4.9, 3.2);
  const skylightGeo = new THREE.PlaneGeometry(12.8, 28);
  skylightGeo.rotateX(Math.PI / 2);
  const skylight = new THREE.Mesh(skylightGeo, glassMat);
  skylight.position.set(0, 4.9, 3.2);
  group.add(portCeiling, stbdCeiling, skylight);

  // Overhead Atrium Structural Ribs + Subtle Recessed Trim
  const archBeamGeo = new THREE.BoxGeometry(13.2, 0.26, 0.34);
  const archLedGeo = new THREE.BoxGeometry(11.4, 0.04, 0.08);
  [-11.8, -5.8, 0.2, 6.2, 12.2].forEach((z, idx) => {
    const beam = new THREE.Mesh(archBeamGeo, trimMat);
    beam.position.set(0, 4.82, z);
    const led = new THREE.Mesh(archLedGeo, idx % 2 === 0 ? cyanStripMat : amberStripMat);
    led.position.set(0, 4.67, z);
    group.add(beam, led);
  });

  // Main Atrium Subtle Floor Corridor Guides
  const spineStripGeo = new THREE.BoxGeometry(0.08, 0.015, 28);
  const stripL = new THREE.Mesh(spineStripGeo, cyanStripMat);
  stripL.position.set(-4.2, 0.01, 0.5);
  const stripR = new THREE.Mesh(spineStripGeo, cyanStripMat);
  stripR.position.set(4.2, 0.01, 0.5);
  group.add(stripL, stripR);

  const crossStripGeo = new THREE.BoxGeometry(31, 0.015, 0.07);
  [-10.2, -0.2, 10.2].forEach((z) => {
    const cs = new THREE.Mesh(crossStripGeo, amberStripMat);
    cs.position.set(0, 0.01, z);
    group.add(cs);
  });

  // Outer Shuttle Hull Walls
  const sideWallGeo = new THREE.BoxGeometry(0.45, 5.0, 34);
  const leftOuterWall = new THREE.Mesh(sideWallGeo, wallMat);
  leftOuterWall.position.set(-17.8, 2.4, 0.5);
  const rightOuterWall = new THREE.Mesh(sideWallGeo, wallMat);
  rightOuterWall.position.set(17.8, 2.4, 0.5);
  const backWallGeo = new THREE.BoxGeometry(36, 5.0, 0.45);
  const backWall = new THREE.Mesh(backWallGeo, wallMat);
  backWall.position.set(0, 2.4, 17.3);
  group.add(leftOuterWall, rightOuterWall, backWall);

  // ==============================================================
  // 2. ENCLOSED ROOM ARCHITECTURE + OBSERVATION WINDOWS + SIGNAGE
  // ==============================================================
  const wingDividerGeo = new THREE.BoxGeometry(11.4, 4.4, 0.28);
  [-5.0, 5.0].forEach((z) => {
    const divL = new THREE.Mesh(wingDividerGeo, wallMat);
    divL.position.set(-12.1, 2.2, z);
    const divR = new THREE.Mesh(wingDividerGeo, wallMat);
    divR.position.set(12.1, 2.2, z);
    group.add(divL, divR);
  });

  // Corridor walls along X = ±6.5 feature lower bulkhead sill + armored observation glass + upper lintel
  const segSillGeo = new THREE.BoxGeometry(0.28, 1.15, 3.3);
  const segTopGeo = new THREE.BoxGeometry(0.28, 1.2, 3.3);
  const segWindowGeo = new THREE.PlaneGeometry(3.2, 2.15);
  segWindowGeo.rotateY(Math.PI / 2);
  const lintelGeo = new THREE.BoxGeometry(0.32, 1.35, 3.6);
  const signGeo = new THREE.PlaneGeometry(3.2, 0.8);

  disposables.push(
    floorGeo,
    wingCeilingGeo,
    skylightGeo,
    archBeamGeo,
    archLedGeo,
    spineStripGeo,
    crossStripGeo,
    sideWallGeo,
    backWallGeo,
    wingDividerGeo,
    segSillGeo,
    segTopGeo,
    segWindowGeo,
    lintelGeo,
    signGeo
  );

  const roomDoorHeaders: Array<{
    side: -1 | 1;
    zCenter: number;
    code: string;
    title: string;
    specialist: string;
    accent: string;
  }> = [
    { side: -1, zCenter: -10.2, code: 'ROOM 03', title: 'TELESCOPE & CUBESAT LAB', specialist: 'Dr. Elena Vance', accent: '#38bdf8' },
    { side: -1, zCenter: -0.2, code: 'ROOM 04', title: 'HYDROPONICS BIO-DOME', specialist: 'Dr. Omar Farouk', accent: '#34d399' },
    { side: -1, zCenter: 10.2, code: 'ROOM 05', title: 'CREW GALLEY & QUARTERS', specialist: 'Maya Lin', accent: '#fbbf24' },
    { side: 1, zCenter: -10.2, code: 'ROOM 07', title: 'MDL & FUSION REACTOR', specialist: 'Marcus Chen', accent: '#f97316' },
    { side: 1, zCenter: -0.2, code: 'ROOM 08', title: 'CARGO BAY & 6x6 ROVER', specialist: 'Sgt. Devon Brooks', accent: '#f59e0b' },
    { side: 1, zCenter: 10.2, code: 'ROOM 09', title: 'DEEP SPACE NETWORK DSN', specialist: 'Lt. Aria Sato', accent: '#a855f7' },
  ];

  [-6.5, 6.5].forEach((x) => {
    [-13.6, -6.8, -3.5, 3.2, 6.8, 13.7].forEach((zPos) => {
      const sill = new THREE.Mesh(segSillGeo, wallMat);
      sill.position.set(x, 0.58, zPos);
      const top = new THREE.Mesh(segTopGeo, wallMat);
      top.position.set(x, 3.85, zPos);
      const win = new THREE.Mesh(segWindowGeo, glassMat);
      win.position.set(x, 2.22, zPos);
      group.add(sill, top, win);
    });
  });

  roomDoorHeaders.forEach((hdr) => {
    const xPos = hdr.side * 6.5;
    const lintel = new THREE.Mesh(lintelGeo, trimMat);
    lintel.position.set(xPos, 3.9, hdr.zCenter);
    group.add(lintel);

    const signTex = createRoomHeaderTexture(hdr.code, hdr.title, hdr.specialist, hdr.accent);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    disposables.push(signTex, signMat);

    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(xPos - hdr.side * 0.18, 3.85, hdr.zCenter);
    sign.rotation.y = hdr.side === -1 ? Math.PI / 2 : -Math.PI / 2;
    group.add(sign);
  });

  // Forward Shuttle Panoramic Windshield at z = -16.2
  const sillGeo = new THREE.BoxGeometry(36, 1.05, 0.7);
  const sill = new THREE.Mesh(sillGeo, trimMat);
  sill.position.set(0, 0.52, -16.2);
  const headerGeo = new THREE.BoxGeometry(36, 0.9, 0.7);
  const header = new THREE.Mesh(headerGeo, trimMat);
  header.position.set(0, 4.65, -16.2);
  const paneGeo = new THREE.PlaneGeometry(34.8, 3.3);
  const pane = new THREE.Mesh(paneGeo, glassMat);
  pane.position.set(0, 2.7, -16.2);
  const ribGeo = new THREE.BoxGeometry(0.32, 4.9, 0.45);
  [-17.2, -11.5, -5.8, 5.8, 11.5, 17.2].forEach((x) => {
    const rib = new THREE.Mesh(ribGeo, trimMat);
    rib.position.set(x, 2.45, -15.4);
    group.add(rib);
  });
  group.add(sill, header, pane);
  disposables.push(sillGeo, headerGeo, paneGeo, ribGeo);

  // ==============================================================
  // 3. SHUTTLE COMPLEX LIGHTING
  // ==============================================================
  const atriumLight = new THREE.PointLight('#ffedd5', 1.75, 40);
  atriumLight.position.set(0, 4.4, -1.5);
  const fwdLight = new THREE.PointLight('#38bdf8', 1.2, 20);
  fwdLight.position.set(0, 2.8, -13.2);
  const portLight = new THREE.PointLight('#34d399', 1.25, 22);
  portLight.position.set(-12.0, 3.2, -0.2);
  const loungeLampLight = new THREE.PointLight('#fbbf24', 1.45, 18);
  loungeLampLight.position.set(-12.0, 2.8, 10.2);
  const stbdEngLight = new THREE.PointLight('#f97316', 1.35, 20);
  stbdEngLight.position.set(12.2, 2.9, -10.2);
  const stbdCargoLight = new THREE.PointLight('#e0f2fe', 1.25, 20);
  stbdCargoLight.position.set(12.2, 3.2, 2.0);
  group.add(atriumLight, fwdLight, portLight, loungeLampLight, stbdEngLight, stbdCargoLight);

  const scrGeo = new THREE.PlaneGeometry(1.4, 0.68);
  disposables.push(scrGeo);

  // ==============================================================
  // MAIN CENTRAL ATRIUM (OUTSIDE THE ROOMS): MASTER DASHBOARD + 2D MODE HUB
  // ==============================================================
  const masterFrameGeo = new THREE.BoxGeometry(3.8, 2.55, 0.24);
  const masterFrame = new THREE.Mesh(masterFrameGeo, trimMat);
  masterFrame.position.set(-3.4, 1.55, -4.4);
  masterFrame.rotation.y = 0.34;
  const masterScreenGeo = new THREE.PlaneGeometry(3.55, 1.9);
  const masterScreenMat = new THREE.MeshBasicMaterial({ map: atriumDashTex });
  const masterScreen = new THREE.Mesh(masterScreenGeo, masterScreenMat);
  masterScreen.position.set(-3.34, 1.65, -4.26);
  masterScreen.rotation.y = 0.34;
  const masterPedGeo = new THREE.BoxGeometry(2.8, 0.88, 0.9);
  const masterPed = new THREE.Mesh(masterPedGeo, wallMat);
  masterPed.position.set(-3.2, 0.44, -4.0);
  masterPed.rotation.y = 0.34;
  group.add(masterFrame, masterScreen, masterPed);

  const termDeskGeo = new THREE.BoxGeometry(2.6, 0.92, 1.15);
  const termDesk = new THREE.Mesh(termDeskGeo, trimMat);
  termDesk.position.set(3.4, 0.46, -4.2);
  termDesk.rotation.y = -0.34;
  const termMat = new THREE.MeshBasicMaterial({ map: console2dTex });
  const termScrGeo = new THREE.PlaneGeometry(2.2, 1.15);
  const termScr = new THREE.Mesh(termScrGeo, termMat);
  termScr.position.set(3.45, 1.52, -4.35);
  termScr.rotation.y = -0.34;
  const termHeaderTex = createRoomHeaderTexture('2D MODE', '2D TACTICAL CONSOLE', 'LIVE SIM', '#22d3ee');
  const termHeaderMat = new THREE.MeshBasicMaterial({ map: termHeaderTex });
  const termHeaderGeo = new THREE.PlaneGeometry(2.4, 0.6);
  const termHeader = new THREE.Mesh(termHeaderGeo, termHeaderMat);
  termHeader.position.set(3.45, 2.48, -4.35);
  termHeader.rotation.y = -0.34;
  group.add(termDesk, termScr, termHeader);

  disposables.push(
    masterFrameGeo,
    masterScreenGeo,
    masterScreenMat,
    masterPedGeo,
    termDeskGeo,
    termMat,
    termScrGeo,
    termHeaderGeo,
    termHeaderTex,
    termHeaderMat
  );

  // ==============================================================
  // ROOM 1: FORWARD FLIGHT DECK / COCKPIT (0, 0, -13.6)
  // ==============================================================
  const helmDeskGeo = new THREE.BoxGeometry(5.6, 0.98, 1.45);
  const helmDesk = new THREE.Mesh(helmDeskGeo, trimMat);
  helmDesk.position.set(0, 0.49, -14.8);
  group.add(helmDesk);

  const helmMat = new THREE.MeshBasicMaterial({ map: helmScreenTex });
  [-1.7, 0, 1.7].forEach((x, idx) => {
    const scr = new THREE.Mesh(scrGeo, helmMat);
    scr.position.set(x, 1.28, -14.5);
    scr.rotation.x = -0.35;
    scr.rotation.y = idx === 0 ? 0.2 : idx === 2 ? -0.2 : 0;
    group.add(scr);
  });

  const chairBaseGeo = new THREE.CylinderGeometry(0.32, 0.42, 0.45, 12);
  const chairSeatGeo = new THREE.BoxGeometry(0.84, 0.16, 0.8);
  const chairBackGeo = new THREE.BoxGeometry(0.82, 1.15, 0.16);
  [-1.2, 1.2].forEach((x) => {
    const cGrp = new THREE.Group();
    cGrp.position.set(x, 0, -13.1);
    const b = new THREE.Mesh(chairBaseGeo, trimMat);
    b.position.y = 0.22;
    const s = new THREE.Mesh(chairSeatGeo, fabricMat);
    s.position.y = 0.52;
    const bk = new THREE.Mesh(chairBackGeo, fabricMat);
    bk.position.set(0, 1.06, 0.34);
    bk.rotation.x = -0.14;
    cGrp.add(b, s, bk);
    group.add(cGrp);
  });
  disposables.push(helmDeskGeo, helmMat, chairBaseGeo, chairSeatGeo, chairBackGeo);

  // ==============================================================
  // ROOM 2: GMAT HOLOGRAPHIC NAVIGATION BAY (0, 0, -8.5)
  // ==============================================================
  const tablePedGeo = new THREE.CylinderGeometry(1.3, 1.55, 0.9, 24);
  const tablePed = new THREE.Mesh(tablePedGeo, trimMat);
  tablePed.position.set(0, 0.45, -8.5);
  group.add(tablePed);

  const holoPlanetGeo = new THREE.SphereGeometry(0.46, 20, 16);
  const holoPlanetMat = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    wireframe: true,
    transparent: true,
    opacity: 0.85,
  });
  const holoPlanet = new THREE.Mesh(holoPlanetGeo, holoPlanetMat);
  holoPlanet.position.set(0, 1.54, -8.5);

  const holoRingGeo = new THREE.TorusGeometry(0.95, 0.025, 8, 36);
  const holoRingMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
  const holoRing = new THREE.Mesh(holoRingGeo, holoRingMat);
  holoRing.position.set(0, 1.54, -8.5);
  holoRing.rotation.x = Math.PI / 2.4;

  const holoArcGeo = new THREE.TorusGeometry(1.16, 0.02, 8, 40, Math.PI * 1.25);
  const holoArcMat = new THREE.MeshBasicMaterial({ color: '#22d3ee' });
  const holoArc = new THREE.Mesh(holoArcGeo, holoArcMat);
  holoArc.position.set(0, 1.54, -8.5);
  holoArc.rotation.set(0.55, 0.4, 0.25);

  group.add(holoPlanet, holoRing, holoArc);
  disposables.push(tablePedGeo, holoPlanetGeo, holoPlanetMat, holoRingGeo, holoRingMat, holoArcGeo, holoArcMat);

  // ==============================================================
  // ROOM 3 (PORT FWD): ASTROPHYSICS & TELESCOPE LAB (-12.5, 0, -10.2)
  // ==============================================================
  const labBenchGeo = new THREE.BoxGeometry(3.6, 0.98, 1.45);
  const labBench = new THREE.Mesh(labBenchGeo, trimMat);
  labBench.position.set(-13.8, 0.49, -11.4);
  const scopeTubeGeo = new THREE.CylinderGeometry(0.28, 0.34, 1.65, 16);
  const scopeTube = new THREE.Mesh(scopeTubeGeo, brassMat);
  scopeTube.position.set(-12.9, 1.48, -11.4);
  scopeTube.rotation.x = Math.PI / 3;
  const cubeSatGeo = new THREE.BoxGeometry(0.45, 0.72, 0.45);
  const cubeSatMat = new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    emissive: '#0284c7',
    emissiveIntensity: 0.25,
    metalness: 0.22,
    roughness: 0.68,
  });
  const cubeSat = new THREE.Mesh(cubeSatGeo, cubeSatMat);
  cubeSat.position.set(-14.6, 1.36, -11.2);
  const cubeWingGeo = new THREE.BoxGeometry(1.25, 0.04, 0.34);
  const cubeWings = new THREE.Mesh(cubeWingGeo, solarMat);
  cubeWings.position.set(-14.6, 1.44, -11.2);
  group.add(labBench, scopeTube, cubeSat, cubeWings);
  disposables.push(labBenchGeo, scopeTubeGeo, cubeSatGeo, cubeSatMat, cubeWingGeo);

  // ==============================================================
  // ROOM 4 (PORT MID): HYDROPONICS BOTANY BIO-DOME (-12.5, 0, -0.2)
  // ==============================================================
  const hydroPotGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.78, 16);
  const leafGeo = new THREE.DodecahedronGeometry(0.52, 0);
  const bioTankGeo = new THREE.CylinderGeometry(0.72, 0.72, 2.7, 18);
  const bioCapGeo = new THREE.TorusGeometry(0.72, 0.05, 8, 24);
  bioCapGeo.rotateX(Math.PI / 2);
  [-2.0, 0.0, 2.0].forEach((dz) => {
    const pot = new THREE.Mesh(hydroPotGeo, wallMat);
    pot.position.set(-15.2, 0.39, dz);
    const foliage = new THREE.Mesh(leafGeo, bioMat);
    foliage.position.set(-15.2, 1.25, dz);
    const tank = new THREE.Mesh(bioTankGeo, glassMat);
    tank.position.set(-15.2, 1.38, dz);
    const cap = new THREE.Mesh(bioCapGeo, emeraldStripMat);
    cap.position.set(-15.2, 2.72, dz);
    group.add(pot, foliage, tank, cap);
  });
  const bioScrMat = new THREE.MeshBasicMaterial({ map: bioScreenTex });
  const bioScr = new THREE.Mesh(scrGeo, bioScrMat);
  bioScr.position.set(-17.4, 1.85, -0.2);
  bioScr.rotation.y = Math.PI / 2;
  group.add(bioScr);
  disposables.push(hydroPotGeo, leafGeo, bioTankGeo, bioCapGeo, bioScrMat);

  // ==============================================================
  // ROOM 5 (PORT AFT): CREW GALLEY, COFFEE & SLEEP BUNKS (-12.5, 0, 10.2)
  // ==============================================================
  const sofaGeo = new THREE.BoxGeometry(1.3, 0.6, 3.6);
  const sofa = new THREE.Mesh(sofaGeo, fabricMat);
  sofa.position.set(-15.6, 0.3, 10.2);
  const tableTopGeo = new THREE.CylinderGeometry(0.76, 0.76, 0.09, 18);
  const sideTable = new THREE.Mesh(tableTopGeo, woodWarmMat);
  sideTable.position.set(-13.2, 0.66, 10.2);
  const legGeo = new THREE.CylinderGeometry(0.09, 0.13, 0.64, 10);
  const tableLeg = new THREE.Mesh(legGeo, trimMat);
  tableLeg.position.set(-13.2, 0.32, 10.2);
  const mugGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.18, 12);
  const mugMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.2 });
  const mug = new THREE.Mesh(mugGeo, mugMat);
  mug.position.set(-13.1, 0.78, 10.4);
  const lampStemGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.56, 8);
  const lampShadeGeo = new THREE.ConeGeometry(0.24, 0.24, 12);
  const lampMat = new THREE.MeshBasicMaterial({ color: '#fde68a' });
  const lampStem = new THREE.Mesh(lampStemGeo, brassMat);
  lampStem.position.set(-13.4, 0.94, 9.95);
  const lampShade = new THREE.Mesh(lampShadeGeo, lampMat);
  lampShade.position.set(-13.4, 1.24, 9.95);
  const bunkGeo = new THREE.BoxGeometry(2.8, 0.22, 1.25);
  const bunk1 = new THREE.Mesh(bunkGeo, fabricMat);
  bunk1.position.set(-12.6, 0.58, 15.6);
  const bunk2 = new THREE.Mesh(bunkGeo, fabricMat);
  bunk2.position.set(-12.6, 1.85, 15.6);
  group.add(sofa, sideTable, tableLeg, mug, lampStem, lampShade, bunk1, bunk2);
  disposables.push(sofaGeo, tableTopGeo, legGeo, mugGeo, mugMat, lampStemGeo, lampShadeGeo, lampMat, bunkGeo);

  // ==============================================================
  // ROOM 6 (CENTER POD): MEDICAL & RADIATION BAY (0, 0, 5.2)
  // ==============================================================
  const medPartitionGeo = new THREE.BoxGeometry(4.4, 2.2, 0.18);
  const medWallBack = new THREE.Mesh(medPartitionGeo, wallMat);
  medWallBack.position.set(0, 1.1, 7.2);
  const medBedGeo = new THREE.BoxGeometry(1.25, 0.7, 2.35);
  const medBed = new THREE.Mesh(medBedGeo, wallMat);
  medBed.position.set(0, 0.35, 5.2);
  const medPadGeo = new THREE.BoxGeometry(1.0, 0.12, 2.1);
  const medPad = new THREE.Mesh(medPadGeo, fabricMat);
  medPad.position.set(0, 0.76, 5.2);
  const medMat = new THREE.MeshBasicMaterial({ map: medScreenTex });
  const medScr = new THREE.Mesh(scrGeo, medMat);
  medScr.position.set(0, 1.72, 7.05);
  medScr.rotation.y = Math.PI;
  group.add(medWallBack, medBed, medPad, medScr);
  disposables.push(medPartitionGeo, medBedGeo, medPadGeo, medMat);

  // ==============================================================
  // ROOM 7 (STBD FWD): NASA MDL & FUSION REACTOR ROOM (12.5, 0, -10.2)
  // ==============================================================
  const engDeskGeo = new THREE.BoxGeometry(1.5, 1.05, 4.2);
  const engDesk = new THREE.Mesh(engDeskGeo, trimMat);
  engDesk.position.set(15.6, 0.52, -10.2);
  const engMat = new THREE.MeshBasicMaterial({ map: engScreenTex });
  const engScr = new THREE.Mesh(scrGeo, engMat);
  engScr.position.set(14.7, 1.46, -10.2);
  engScr.rotation.y = -Math.PI / 2;
  engScr.rotation.x = -0.2;
  const reactorCoreGeo = new THREE.CylinderGeometry(0.55, 0.55, 3.2, 18);
  const plasmaBeamGeo = new THREE.CylinderGeometry(0.18, 0.18, 3.0, 12);
  const reactorRingGeo = new THREE.TorusGeometry(0.92, 0.1, 10, 26);
  const reactorRingMat = new THREE.MeshBasicMaterial({ color: '#f97316' });
  const reactorCore = new THREE.Mesh(reactorCoreGeo, glassMat);
  reactorCore.position.set(14.8, 1.7, -13.2);
  const plasmaBeam = new THREE.Mesh(plasmaBeamGeo, plasmaMat);
  plasmaBeam.position.set(14.8, 1.7, -13.2);
  const reactorRing = new THREE.Mesh(reactorRingGeo, reactorRingMat);
  reactorRing.position.set(14.8, 1.7, -13.2);
  reactorRing.rotation.x = Math.PI / 2;
  const reactorRing2 = new THREE.Mesh(reactorRingGeo, cyanStripMat);
  reactorRing2.position.set(14.8, 1.7, -13.2);
  reactorRing2.rotation.set(Math.PI / 3, 0.4, 0);
  group.add(engDesk, engScr, reactorCore, plasmaBeam, reactorRing, reactorRing2);
  disposables.push(engDeskGeo, engMat, reactorCoreGeo, plasmaBeamGeo, reactorRingGeo, reactorRingMat);

  // ==============================================================
  // ROOM 8 (STBD MID): PAYLOAD CARGO BAY & 6x6 ROVER HANGAR (12.5, 0, -0.2)
  // ==============================================================
  const cargoFrameGeo = new THREE.BoxGeometry(3.2, 0.22, 4.2);
  const cargoPad = new THREE.Mesh(cargoFrameGeo, trimMat);
  cargoPad.position.set(14.2, 0.11, -0.2);
  const miniRoverBodyGeo = new THREE.BoxGeometry(1.3, 0.54, 1.9);
  const miniRover = new THREE.Mesh(miniRoverBodyGeo, brassMat);
  miniRover.position.set(14.2, 0.62, -0.2);
  const armBeamGeo = new THREE.CylinderGeometry(0.09, 0.09, 2.8, 10);
  const armBeam = new THREE.Mesh(armBeamGeo, wallMat);
  armBeam.position.set(15.6, 1.85, -0.2);
  armBeam.rotation.z = 0.45;
  group.add(cargoPad, miniRover, armBeam);
  disposables.push(cargoFrameGeo, miniRoverBodyGeo, armBeamGeo);

  // ==============================================================
  // ROOM 9 (STBD AFT): DEEP SPACE NETWORK COMMS ROOM (12.5, 0, 10.2)
  // ==============================================================
  const commsDeskGeo = new THREE.BoxGeometry(1.5, 1.02, 3.6);
  const commsDesk = new THREE.Mesh(commsDeskGeo, trimMat);
  commsDesk.position.set(15.6, 0.51, 10.2);
  const commsMat = new THREE.MeshBasicMaterial({ map: commsScreenTex });
  const commsScr = new THREE.Mesh(scrGeo, commsMat);
  commsScr.position.set(14.7, 1.44, 10.2);
  commsScr.rotation.y = -Math.PI / 2;
  commsScr.rotation.x = -0.18;
  group.add(commsDesk, commsScr);
  disposables.push(commsDeskGeo, commsMat);

  // ==============================================================
  // ROOM 10 (AFT CENTER): PLANETARY AIRLOCK CHAMBER (0, 0, 14.5)
  // ==============================================================
  const hatchRingGeo = new THREE.TorusGeometry(1.85, 0.22, 10, 28);
  const hatchRing = new THREE.Mesh(hatchRingGeo, brassMat);
  hatchRing.position.set(0, 2.05, 16.9);
  const hatchDoorGeo = new THREE.CylinderGeometry(1.72, 1.72, 0.28, 24);
  hatchDoorGeo.rotateX(Math.PI / 2);
  const hatchDoor = new THREE.Mesh(hatchDoorGeo, wallMat);
  hatchDoor.position.set(0, 2.05, 16.95);
  group.add(hatchRing, hatchDoor);
  disposables.push(hatchRingGeo, hatchDoorGeo);

  // ==============================================================
  // 10 ANIMATED 3D SPECIALISTS — RELOCATABLE ACROSS ALL 10 ROOMS!
  // ==============================================================
  const roomNpcAnchors: Record<
    ShuttleRoomId,
    { base: [number, number, number]; yaw: number; stepX: number; stepZ: number }
  > = {
    helm: { base: [1.8, 0, -13.6], yaw: Math.PI * 0.9, stepX: -1.1, stepZ: 0.4 },
    nav: { base: [1.9, 0, -8.5], yaw: -Math.PI * 0.45, stepX: 0, stepZ: 1.05 },
    science_lab: { base: [-11.5, 0, -10.5], yaw: Math.PI * 0.72, stepX: -1.0, stepZ: 0.85 },
    bio_bay: { base: [-12.2, 0, 0.4], yaw: Math.PI * 0.55, stepX: 0.85, stepZ: -1.0 },
    lounge: { base: [-11.6, 0, 10.6], yaw: Math.PI * 0.4, stepX: -0.95, stepZ: -0.85 },
    med_bay: { base: [1.6, 0, 5.2], yaw: -Math.PI * 0.55, stepX: -0.9, stepZ: 0.9 },
    engineering: { base: [12.4, 0, -10.2], yaw: -Math.PI * 0.58, stepX: -0.95, stepZ: 0.9 },
    cargo_bay: { base: [11.6, 0, -0.2], yaw: -Math.PI * 0.5, stepX: 0.9, stepZ: 0.95 },
    comms_desk: { base: [12.4, 0, 10.2], yaw: -Math.PI * 0.52, stepX: -0.95, stepZ: -0.9 },
    airlock: { base: [-1.8, 0, 14.5], yaw: Math.PI * 0.25, stepX: 1.15, stepZ: -0.35 },
  };

  const npcDefs: Array<{
    id: SpecialistId;
    rig: AstronautRig;
    pos: [number, number, number];
    yaw: number;
    phase: number;
  }> = [
    {
      id: 'ryan',
      rig: buildAstronautGroup(
        {
          name: 'Capt. Ryan Miller',
          gender: 'male',
          specialization: 'Flight Commander',
          suitModel: 'Vanguard EVA',
          primaryColor: '#0284c7',
          visorColor: '#38bdf8',
          helmetEquipped: false,
        },
        isSoftwareGl
      ),
      pos: [1.8, 0, -13.6],
      yaw: Math.PI * 0.9,
      phase: 0.1,
    },
    {
      id: 'nadia',
      rig: buildAstronautGroup(
        {
          name: 'Dr. Nadia Karim',
          gender: 'female',
          specialization: 'Aerospace Engineer',
          suitModel: 'Horizon Science',
          primaryColor: '#0ea5e9',
          visorColor: '#bae6fd',
          helmetEquipped: false,
        },
        isSoftwareGl
      ),
      pos: [1.9, 0, -8.5],
      yaw: -Math.PI * 0.45,
      phase: 0.9,
    },
    {
      id: 'elena',
      rig: buildAstronautGroup(
        {
          name: 'Dr. Elena Vance',
          gender: 'female',
          specialization: 'Astrobiologist',
          suitModel: 'Horizon Science',
          primaryColor: '#10b981',
          visorColor: '#38bdf8',
          helmetEquipped: false,
        },
        isSoftwareGl
      ),
      pos: [-11.5, 0, -10.5],
      yaw: Math.PI * 0.72,
      phase: 1.4,
    },
    {
      id: 'omar',
      rig: buildAstronautGroup(
        {
          name: 'Dr. Omar Farouk',
          gender: 'male',
          specialization: 'Astrobiologist',
          suitModel: 'Horizon Science',
          primaryColor: '#059669',
          visorColor: '#a7f3d0',
          helmetEquipped: false,
        },
        isSoftwareGl
      ),
      pos: [-12.2, 0, 0.4],
      yaw: Math.PI * 0.55,
      phase: 2.1,
    },
    {
      id: 'maya',
      rig: buildAstronautGroup(
        {
          name: 'Maya Lin',
          gender: 'female',
          specialization: 'Flight Commander',
          suitModel: 'Vanguard EVA',
          primaryColor: '#d97706',
          visorColor: '#fde68a',
          helmetEquipped: false,
        },
        isSoftwareGl
      ),
      pos: [-11.6, 0, 10.6],
      yaw: Math.PI * 0.4,
      phase: 2.7,
    },
    {
      id: 'sophia',
      rig: buildAstronautGroup(
        {
          name: 'Dr. Sophia Patel',
          gender: 'female',
          specialization: 'Astrobiologist',
          suitModel: 'Horizon Science',
          primaryColor: '#e11d48',
          visorColor: '#fecdd3',
          helmetEquipped: false,
        },
        isSoftwareGl
      ),
      pos: [1.6, 0, 5.2],
      yaw: -Math.PI * 0.55,
      phase: 3.3,
    },
    {
      id: 'marcus',
      rig: buildAstronautGroup(
        {
          name: 'Marcus Chen',
          gender: 'male',
          specialization: 'Aerospace Engineer',
          suitModel: 'Aegis Mk-IV',
          primaryColor: '#f59e0b',
          visorColor: '#fbbf24',
          helmetEquipped: false,
        },
        isSoftwareGl
      ),
      pos: [12.4, 0, -10.2],
      yaw: -Math.PI * 0.58,
      phase: 3.9,
    },
    {
      id: 'devon',
      rig: buildAstronautGroup(
        {
          name: 'Sgt. Devon Brooks',
          gender: 'male',
          specialization: 'Aerospace Engineer',
          suitModel: 'Aegis Mk-IV',
          primaryColor: '#ea580c',
          visorColor: '#fed7aa',
          helmetEquipped: false,
        },
        isSoftwareGl
      ),
      pos: [11.6, 0, -0.2],
      yaw: -Math.PI * 0.5,
      phase: 4.5,
    },
    {
      id: 'aria',
      rig: buildAstronautGroup(
        {
          name: 'Lt. Aria Sato',
          gender: 'female',
          specialization: 'Flight Commander',
          suitModel: 'Vanguard EVA',
          primaryColor: '#9333ea',
          visorColor: '#e9d5ff',
          helmetEquipped: false,
        },
        isSoftwareGl
      ),
      pos: [12.4, 0, 10.2],
      yaw: -Math.PI * 0.52,
      phase: 5.1,
    },
    {
      id: 'leo',
      rig: buildAstronautGroup(
        {
          name: 'Cmdr. Leo Vance',
          gender: 'male',
          specialization: 'Flight Commander',
          suitModel: 'Aegis Mk-IV',
          primaryColor: '#334155',
          visorColor: '#fbbf24',
          helmetEquipped: true,
        },
        isSoftwareGl
      ),
      pos: [-1.8, 0, 14.5],
      yaw: Math.PI * 0.25,
      phase: 5.7,
    },
  ];

  npcDefs.forEach((n) => {
    n.rig.root.position.set(...n.pos);
    n.rig.root.rotation.y = n.yaw;
    group.add(n.rig.root);
  });

  // ==============================================================
  // 12 INTERACTIVE SHUTTLE STATIONS (MAIN ATRIUM + 10 SPECIALIST ROOMS)
  // ==============================================================
  const stations: InteriorStation[] = [
    {
      id: 'main_dashboard',
      shortName: { ar: 'الداش بورد الرئيسية', en: 'Atrium Dashboard' },
      label: {
        ar: 'الداش بورد المركزية بالبهو — عرض تفاصيل المكوك والطاقم [E]',
        en: 'Main Atrium Master Dashboard — View Shuttle Systems [E]',
      },
      position: new THREE.Vector3(-3.2, 0, -4.0),
      walkTarget: new THREE.Vector3(-2.0, 0, -2.1),
      radius: 2.9,
    },
    {
      id: 'control_2d',
      shortName: { ar: 'تحويل اللعبة 2D', en: '2D Game Mode' },
      label: {
        ar: 'محطة التحويل إلى وضع 2D التفاعلي الكامل [E]',
        en: '2D Operations Dashboard — Play Full 2D Mode [E]',
      },
      position: new THREE.Vector3(3.4, 0, -4.0),
      walkTarget: new THREE.Vector3(2.0, 0, -2.1),
      radius: 2.9,
    },
    {
      id: 'helm',
      shortName: { ar: 'قمرة القيادة (رايان)', en: 'Flight Deck (Ryan)' },
      label: {
        ar: 'الكابتن رايان • قمرة قيادة المكوك — أقلع للفضاء [E]',
        en: 'Capt. Ryan • Flight Deck — Take Helm & Launch [E]',
      },
      position: new THREE.Vector3(0, 0, -13.6),
      walkTarget: new THREE.Vector3(0, 0, -11.6),
      radius: 3.1,
    },
    {
      id: 'nav',
      shortName: { ar: 'الملاحة GMAT (نادية)', en: 'GMAT Nav (Nadia)' },
      label: {
        ar: 'د. نادية • غرفة الملاحة GMAT وتصور المدارات 3D [E]',
        en: 'Dr. Nadia • GMAT Trajectory & 3D Mission Viz [E]',
      },
      position: new THREE.Vector3(0, 0, -8.5),
      walkTarget: new THREE.Vector3(0, 0, -6.2),
      radius: 2.8,
    },
    {
      id: 'science_lab',
      shortName: { ar: 'التلسكوب (إيلينا)', en: 'Telescope (Elena)' },
      label: {
        ar: 'د. إيلينا فانس • غرفة مختبر التلسكوب و CubeSat [E]',
        en: 'Dr. Elena Vance • Telescope & CubeSat Room [E]',
      },
      position: new THREE.Vector3(-12.2, 0, -10.2),
      walkTarget: new THREE.Vector3(-9.4, 0, -10.2),
      radius: 3.4,
    },
    {
      id: 'bio_bay',
      shortName: { ar: 'الزراعة (عمر)', en: 'Hydroponics (Omar)' },
      label: {
        ar: 'د. عمر فاروق • غرفة الزراعة المائية والأكسجين [E]',
        en: 'Dr. Omar Farouk • Hydroponics Bio-Room [E]',
      },
      position: new THREE.Vector3(-12.5, 0, -0.2),
      walkTarget: new THREE.Vector3(-9.4, 0, -0.2),
      radius: 3.4,
    },
    {
      id: 'lounge',
      shortName: { ar: 'الاستراحة (مايا)', en: 'Galley (Maya)' },
      label: {
        ar: 'مايا لين • غرفة الاستراحة والقهوة والنوم [E]',
        en: 'Maya Lin • Crew Galley & Sleep Quarters [E]',
      },
      position: new THREE.Vector3(-12.4, 0, 10.2),
      walkTarget: new THREE.Vector3(-9.4, 0, 10.2),
      radius: 3.4,
    },
    {
      id: 'med_bay',
      shortName: { ar: 'العيادة (صوفيا)', en: 'Med Bay (Sophia)' },
      label: {
        ar: 'د. صوفيا • غرفة العيادة الطبية والفحص الإشعاعي [E]',
        en: 'Dr. Sophia Patel • Medical & Radiation Room [E]',
      },
      position: new THREE.Vector3(0, 0, 5.2),
      walkTarget: new THREE.Vector3(0, 0, 2.8),
      radius: 2.9,
    },
    {
      id: 'engineering',
      shortName: { ar: 'المفاعل MDL (ماركوس)', en: 'Reactor (Marcus)' },
      label: {
        ar: 'المهندس ماركوس • غرفة المفاعل والهندسة MDL [E]',
        en: 'Marcus Chen • NASA MDL & Reactor Room [E]',
      },
      position: new THREE.Vector3(12.5, 0, -10.2),
      walkTarget: new THREE.Vector3(9.4, 0, -10.2),
      radius: 3.4,
    },
    {
      id: 'cargo_bay',
      shortName: { ar: 'عنبر الروفر (ديفون)', en: 'Cargo Bay (Devon)' },
      label: {
        ar: 'ديفون بروكس • غرفة عنبر الحمولة والروفر 6×6 [E]',
        en: 'Sgt. Devon • Cargo & 6x6 Rover Hangar Room [E]',
      },
      position: new THREE.Vector3(12.5, 0, -0.2),
      walkTarget: new THREE.Vector3(9.4, 0, -0.2),
      radius: 3.4,
    },
    {
      id: 'comms_desk',
      shortName: { ar: 'اتصالات DSN (آريا)', en: 'DSN Comms (Aria)' },
      label: {
        ar: 'الملازم آريا • غرفة البث الفضائي العميق DSN [E]',
        en: 'Lt. Aria Sato • Deep Space Comms Room [E]',
      },
      position: new THREE.Vector3(12.5, 0, 10.2),
      walkTarget: new THREE.Vector3(9.4, 0, 10.2),
      radius: 3.4,
    },
    {
      id: 'airlock',
      shortName: { ar: 'بوابة الكوكب (ليو)', en: 'Airlock (Leo)' },
      label: {
        ar: 'القائد ليو • غرفة بوابة الهبوط الكوكبي [E]',
        en: 'Cmdr. Leo • Planetary Airlock Chamber [E]',
      },
      position: new THREE.Vector3(0, 0, 14.5),
      walkTarget: new THREE.Vector3(0, 0, 12.2),
      radius: 3.2,
    },
  ];

  return {
    group,
    stations,
    holoPlanet,
    holoRing,
    coffeeSteamLight: loungeLampLight,
    reactorRing,
    syncSpecialists(specialists: ShuttleSpecialist[]) {
      const roomCounts: Partial<Record<ShuttleRoomId, number>> = {};
      for (const sp of specialists) {
        const npc = npcDefs.find((n) => n.id === sp.id);
        if (!npc) continue;
        const slotIndex = roomCounts[sp.assignedRoomId] || 0;
        roomCounts[sp.assignedRoomId] = slotIndex + 1;
        const anchor = roomNpcAnchors[sp.assignedRoomId];
        if (!anchor) continue;
        const row = Math.floor(slotIndex / 2);
        const col = slotIndex % 2;
        const px = anchor.base[0] + col * anchor.stepX;
        const pz = anchor.base[2] + (row > 0 ? row * anchor.stepZ : col * anchor.stepZ * 0.35);
        npc.pos = [px, 0, pz];
        npc.yaw = anchor.yaw;
        npc.rig.root.position.set(px, 0, pz);
        npc.rig.root.rotation.y = anchor.yaw;
      }
    },
    updateNpcs(elapsed: number) {
      holoArc.rotation.y = elapsed * 0.65;
      reactorRing2.rotation.y = -elapsed * 1.1;
      npcDefs.forEach((n) => {
        n.rig.setWalkCycle(0, false, elapsed + n.phase);
        n.rig.root.rotation.y = n.yaw + Math.sin(elapsed * 0.7 + n.phase) * 0.14;
      });
    },
    dispose() {
      npcDefs.forEach((n) => n.rig.dispose());
      disposables.forEach((d) => d.dispose());
    },
  };
}
