import * as THREE from 'three';
import type { PlanetData, PlanetId, SurfaceBuildingKind, SurfaceBuildingRecord } from '../types/game';
import {
  createModelGraphicOverlayTexture,
  createSoftGlowTexture,
  createSurfaceSkyTexture,
  createTerrainDetailTexture,
} from './proceduralTextures';

export function planetGroundHeightAt(planetId: PlanetId, x: number, z: number): number {
  const seed =
    planetId === 'mercury'
      ? 0.7
      : planetId === 'luna'
        ? 1.1
        : planetId === 'mars'
          ? 2.3
          : planetId === 'aurora'
            ? 3.7
            : planetId === 'solaris'
              ? 4.9
              : planetId === 'aetheris'
                ? 6.1
                : planetId === 'uranus'
                  ? 8.2
                  : planetId === 'neptune'
                    ? 9.5
                    : 7.4;

  const distFromPad = Math.hypot(x, z);
  const padFlatten = THREE.MathUtils.smoothstep(distFromPad, 9, 24);

  // Subtle playable regolith undulation
  const plainHills =
    Math.sin(x * 0.052 + seed) * Math.cos(z * 0.052 - seed) * 1.65 +
    Math.sin((x + z) * 0.028 + seed * 1.7) * 1.15 +
    Math.cos(x * 0.13 - z * 0.11) * 0.35;

  // Natural continuous crater-rim mountain peaks surrounding the valley (r = 76..165)
  const rimBlend = THREE.MathUtils.smoothstep(distFromPad, 74, 152);
  const angle = Math.atan2(z, x);
  const ridgeProfile =
    0.58 +
    0.42 * Math.sin(angle * 3 + seed * 1.4) +
    0.26 * Math.cos(angle * 5 - seed * 0.8) +
    0.14 * Math.sin(angle * 9 + seed * 2.1);
  const mountains = rimBlend * Math.max(0.18, ridgeProfile) * 32;

  return plainHills * padFlatten + mountains;
}

export interface RoverRig {
  root: THREE.Group;
  wheels: THREE.Mesh[];
  frontSteerPivots: THREE.Group[];
  rearSteerPivots: THREE.Group[];
  mastHead: THREE.Group;
  headLight: THREE.SpotLight;
  dispose: () => void;
}

export function buildSixWheelRover(isSoftwareGl: boolean): RoverRig {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const frontSteerPivots: THREE.Group[] = [];
  const rearSteerPivots: THREE.Group[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: '#cfd6de',
    metalness: 0.08,
    roughness: 0.86,
    envMapIntensity: 0.15,
  });
  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: '#b88635',
    metalness: 0.24,
    roughness: 0.68,
    envMapIntensity: 0.18,
  });
  const chassisMat = new THREE.MeshStandardMaterial({
    color: '#202630',
    metalness: 0.14,
    roughness: 0.84,
    envMapIntensity: 0.14,
  });
  const solarMat = new THREE.MeshStandardMaterial({
    color: '#1b355c',
    metalness: 0.18,
    roughness: 0.72,
    envMapIntensity: 0.16,
  });
  const cabGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#122130',
    metalness: 0.06,
    roughness: 0.28,
    transparent: true,
    opacity: 0.78,
    envMapIntensity: 0.2,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: '#161a22',
    metalness: 0.04,
    roughness: 0.94,
    envMapIntensity: 0.1,
  });
  const beaconMat = new THREE.MeshBasicMaterial({ color: '#7dd3fc' });
  const roverDecalTex = createModelGraphicOverlayTexture('ROVER // MK-IV');
  const roverDecalMat = new THREE.MeshBasicMaterial({
    map: roverDecalTex,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  });
  const roverWireMat = new THREE.LineBasicMaterial({
    color: '#93c5fd',
    transparent: true,
    opacity: 0.18,
  });

  const frameGeo = new THREE.BoxGeometry(1.9, 0.28, 3.2);
  const frame = new THREE.Mesh(frameGeo, chassisMat);
  frame.position.set(0, 0.75, 0);
  frame.castShadow = !isSoftwareGl;
  root.add(frame);

  const coreGeo = new THREE.BoxGeometry(1.55, 0.58, 2.35);
  const core = new THREE.Mesh(coreGeo, goldFoilMat);
  core.position.set(0, 1.15, -0.05);
  core.castShadow = !isSoftwareGl;
  root.add(core);

  // Photo 3 Armored Rover Forward Cab + Sloped Windshield + Top Lightbar
  const cabGeo = new THREE.BoxGeometry(1.58, 0.62, 0.95);
  const cab = new THREE.Mesh(cabGeo, chassisMat);
  cab.position.set(0, 1.38, 1.02);
  cab.castShadow = !isSoftwareGl;
  const cabGlassGeo = new THREE.PlaneGeometry(1.36, 0.42);
  const cabGlass = new THREE.Mesh(cabGlassGeo, cabGlassMat);
  cabGlass.position.set(0, 1.44, 1.505);
  cabGlass.rotation.x = -0.18;
  root.add(cab, cabGlass);

  // Graphic decal plates & transparent wireframe scan mesh on rover core
  const decalGeo = new THREE.PlaneGeometry(1.45, 0.46);
  const decalL = new THREE.Mesh(decalGeo, roverDecalMat);
  decalL.position.set(-0.79, 1.16, -0.05);
  decalL.rotation.y = -Math.PI / 2;
  const decalR = new THREE.Mesh(decalGeo, roverDecalMat);
  decalR.position.set(0.79, 1.16, -0.05);
  decalR.rotation.y = Math.PI / 2;
  const coreWireGeo = new THREE.EdgesGeometry(coreGeo);
  const coreWire = new THREE.LineSegments(coreWireGeo, roverWireMat);
  coreWire.position.copy(core.position);
  coreWire.scale.setScalar(1.015);
  root.add(decalL, decalR, coreWire);

  const deckGeo = new THREE.BoxGeometry(1.85, 0.12, 2.6);
  const deck = new THREE.Mesh(deckGeo, bodyMat);
  deck.position.set(0, 1.48, -0.05);
  deck.castShadow = !isSoftwareGl;
  root.add(deck);

  const solarGeo = new THREE.BoxGeometry(2.5, 0.05, 1.3);
  const solar = new THREE.Mesh(solarGeo, solarMat);
  solar.position.set(0, 1.56, -0.45);
  root.add(solar);

  const mastNeckGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.9, 8);
  const mastNeck = new THREE.Mesh(mastNeckGeo, chassisMat);
  mastNeck.position.set(0, 1.9, 0.92);
  root.add(mastNeck);

  const mastHead = new THREE.Group();
  mastHead.position.set(0, 2.38, 0.92);
  const headGeo = new THREE.BoxGeometry(0.46, 0.24, 0.34);
  const headMesh = new THREE.Mesh(headGeo, bodyMat);
  const lensGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 10);
  lensGeo.rotateX(Math.PI / 2);
  const lensL = new THREE.Mesh(lensGeo, beaconMat);
  lensL.position.set(-0.12, 0, 0.18);
  const lensR = new THREE.Mesh(lensGeo, beaconMat);
  lensR.position.set(0.12, 0, 0.18);
  mastHead.add(headMesh, lensL, lensR);
  root.add(mastHead);

  const headLight = new THREE.SpotLight('#e0f2fe', 3.0, 45, 0.45, 0.5);
  headLight.position.set(0, 1.35, 1.55);
  const targetObj = new THREE.Object3D();
  targetObj.position.set(0, 0.3, 14);
  root.add(targetObj);
  headLight.target = targetObj;
  root.add(headLight);

  const wheelGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.34, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.38, 10);
  hubGeo.rotateZ(Math.PI / 2);

  const zOffsets = [1.22, 0, -1.22];
  const xOffsets = [-1.14, 1.14];

  zOffsets.forEach((zOff, axleIdx) => {
    xOffsets.forEach((xOff) => {
      const steerPivot = new THREE.Group();
      steerPivot.position.set(xOff, 0.46, zOff);

      const wheelMesh = new THREE.Mesh(wheelGeo, tireMat);
      wheelMesh.castShadow = !isSoftwareGl;
      const hubMesh = new THREE.Mesh(hubGeo, goldFoilMat);
      wheelMesh.add(hubMesh);

      steerPivot.add(wheelMesh);
      root.add(steerPivot);
      wheels.push(wheelMesh);

      if (axleIdx === 0) frontSteerPivots.push(steerPivot);
      if (axleIdx === 2) rearSteerPivots.push(steerPivot);
    });
  });

  const disposables: Array<{ dispose: () => void }> = [
    bodyMat,
    goldFoilMat,
    chassisMat,
    solarMat,
    cabGlassMat,
    tireMat,
    beaconMat,
    roverDecalTex,
    roverDecalMat,
    roverWireMat,
    frameGeo,
    coreGeo,
    cabGeo,
    cabGlassGeo,
    decalGeo,
    coreWireGeo,
    deckGeo,
    solarGeo,
    mastNeckGeo,
    headGeo,
    lensGeo,
    wheelGeo,
    hubGeo,
  ];

  return {
    root,
    wheels,
    frontSteerPivots,
    rearSteerPivots,
    mastHead,
    headLight,
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}

export interface SurfaceInteractableItem {
  id: string;
  kind: 'sample' | 'crater' | 'science' | 'monolith' | 'pickup';
  pickupType?: 'o2' | 'energy';
  label: { ar: string; en: string };
  position: THREE.Vector3;
  mesh?: THREE.Object3D;
  radius: number;
  dataMb?: number;
  collected?: boolean;
}

export interface SurfaceObstacle {
  x: number;
  y: number;
  z: number;
  radius: number;
  height: number;
  kind: 'rock' | 'ship' | 'structure';
}

export interface SurfaceWorldHandle {
  group: THREE.Group;
  interactables: SurfaceInteractableItem[];
  obstacles: SurfaceObstacle[];
  monolithRing?: THREE.Mesh;
  addBuilding: (rec: SurfaceBuildingRecord) => void;
  update: (elapsed: number) => void;
  markCollected: (id: string) => void;
  dispose: () => void;
}

function createFacetedBoulderGeometry(): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const hash = Math.sin(x * 7.3 + y * 11.7 + z * 5.9);
    const scale = 0.82 + hash * 0.22;
    pos.setXYZ(i, x * scale, y * scale * 0.72, z * scale * 1.08);
  }
  geo.computeVertexNormals();
  return geo;
}

export function buildPlanetSurfaceWorld(
  planet: PlanetData,
  collectedSampleIds: string[],
  discoveredCraterIds: string[],
  completedScienceIds: string[],
  isSoftwareGl: boolean,
  maxAniso = 4,
  buildings: SurfaceBuildingRecord[] = []
): SurfaceWorldHandle {
  const group = new THREE.Group();
  const interactables: SurfaceInteractableItem[] = [];
  const obstacles: SurfaceObstacle[] = [
    {
      x: 0,
      y: 0,
      z: 0,
      radius: 3.6,
      height: 4.5,
      kind: 'ship',
    },
  ];
  const disposables: Array<{ dispose: () => void }> = [];
  const pickupMeshes: THREE.Object3D[] = [];

  // 1. Starry Surface Sky Dome & Subtle Sun Disc
  const starStrength =
    planet.id === 'luna' || planet.id === 'mercury'
      ? 1.0
      : planet.id === 'solaris' || planet.id === 'aetheris' || planet.id === 'uranus' || planet.id === 'neptune'
        ? 0.72
        : planet.id === 'mars'
          ? 0.36
          : 0.22;

  const skyTex = createSurfaceSkyTexture(planet.skyColor, starStrength);
  const skyDomeGeo = new THREE.SphereGeometry(290, 32, 20);
  const skyDomeMat = new THREE.MeshBasicMaterial({
    map: skyTex,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  const skyDome = new THREE.Mesh(skyDomeGeo, skyDomeMat);
  group.add(skyDome);

  const glowTex = createSoftGlowTexture();
  const sunSpriteMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: planet.id === 'mars' ? '#fed7aa' : '#fff7ed',
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.5,
    fog: false,
  });
  const sunSprite = new THREE.Sprite(sunSpriteMat);
  sunSprite.position.set(135, 84, -150);
  sunSprite.scale.set(22, 22, 1);

  const sunCoreMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: '#ffffff',
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  const sunCore = new THREE.Sprite(sunCoreMat);
  sunCore.position.set(135, 84, -150);
  sunCore.scale.set(6, 6, 1);
  group.add(sunSprite, sunCore);
  disposables.push(skyTex, skyDomeGeo, skyDomeMat, glowTex, sunSpriteMat, sunCoreMat);

  // 2. Continuous Sculpted Cratered Terrain (including valley hills & mountain horizon)
  const size = 340;
  const segs = isSoftwareGl ? 96 : 156;
  const terrainGeo = new THREE.PlaneGeometry(size, size, segs, segs);
  terrainGeo.rotateX(-Math.PI / 2);
  const posAttr = terrainGeo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  const plainTint = new THREE.Color('#ffffff');
  const peakTint = new THREE.Color(planet.terrainAccent).lerp(new THREE.Color('#f1f5f9'), 0.45);
  const basinTint = new THREE.Color(planet.terrainColor).multiplyScalar(0.84);
  const tmpCol = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = planetGroundHeightAt(planet.id, x, z);
    posAttr.setY(i, y);

    if (y > 4) {
      const t = THREE.MathUtils.clamp((y - 4) / 24, 0, 1);
      tmpCol.copy(plainTint).lerp(peakTint, t * 0.35);
    } else {
      const t = THREE.MathUtils.clamp((y + 2.5) / 5.5, 0, 1);
      tmpCol.copy(basinTint).lerp(plainTint, 0.65 + t * 0.35);
    }
    colors[i * 3] = tmpCol.r;
    colors[i * 3 + 1] = tmpCol.g;
    colors[i * 3 + 2] = tmpCol.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const { map: detailTex, bumpMap: detailBump } = createTerrainDetailTexture(
    planet.terrainColor,
    planet.terrainAccent,
    maxAniso
  );
  const terrainMat = new THREE.MeshStandardMaterial({
    map: detailTex,
    bumpMap: detailBump,
    bumpScale: 0.34,
    vertexColors: true,
    roughness: 0.93,
    metalness: 0.03,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = !isSoftwareGl;
  group.add(terrainMesh);
  disposables.push(detailTex, detailBump, terrainGeo, terrainMat);

  // 3. Landing Pad Ring + 4 Perimeter Flood Beacons
  const padGeo = new THREE.CylinderGeometry(8.5, 9.2, 0.35, 32);
  const padMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    metalness: 0.68,
    roughness: 0.42,
  });
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.position.set(0, 0.12, 0);
  pad.receiveShadow = !isSoftwareGl;
  group.add(pad);

  const padRingGeo = new THREE.TorusGeometry(8.2, 0.11, 8, 40);
  padRingGeo.rotateX(Math.PI / 2);
  const padRingMat = new THREE.MeshBasicMaterial({ color: '#0891b2' });
  const padRing = new THREE.Mesh(padRingGeo, padRingMat);
  padRing.position.set(0, 0.33, 0);
  group.add(padRing);

  const postGeo = new THREE.CylinderGeometry(0.1, 0.14, 1.3, 8);
  const postCapGeo = new THREE.SphereGeometry(0.16, 8, 8);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const px = Math.cos(a) * 8.9;
    const pz = Math.sin(a) * 8.9;
    const post = new THREE.Mesh(postGeo, padMat);
    post.position.set(px, 0.65, pz);
    post.castShadow = !isSoftwareGl;
    const cap = new THREE.Mesh(postCapGeo, padRingMat);
    cap.position.set(px, 1.35, pz);
    group.add(post, cap);
  }
  disposables.push(padGeo, padMat, padRingGeo, padRingMat, postGeo, postCapGeo);

  // 4. Sculpted Landmark Craters
  const craterRimMat = new THREE.MeshStandardMaterial({
    color: planet.terrainAccent,
    roughness: 0.88,
  });
  const craterBeaconMat = new THREE.MeshBasicMaterial({
    color: '#f59e0b',
    transparent: true,
    opacity: 0.72,
  });
  disposables.push(craterRimMat, craterBeaconMat);

  planet.craters.forEach((c) => {
    const gy = planetGroundHeightAt(planet.id, c.x, c.z);
    const rimGeo = new THREE.TorusGeometry(c.radius * 0.65, 0.95, 8, 32);
    rimGeo.rotateX(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, craterRimMat);
    rim.position.set(c.x, gy + 0.05, c.z);
    rim.receiveShadow = !isSoftwareGl;
    group.add(rim);

    const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 5.2, 8);
    const pole = new THREE.Mesh(poleGeo, craterBeaconMat);
    pole.position.set(c.x, gy + 2.6, c.z);
    pole.visible = !discoveredCraterIds.includes(c.id);
    group.add(pole);

    disposables.push(rimGeo, poleGeo);
    interactables.push({
      id: c.id,
      kind: 'crater',
      label: c.name,
      position: new THREE.Vector3(c.x, gy, c.z),
      mesh: pole,
      radius: 9,
      collected: discoveredCraterIds.includes(c.id),
    });
  });

  // 5. Multi-Part Solar Relay & Science Survey Landers (Matte aerospace finishes)
  const stationHullMat = new THREE.MeshStandardMaterial({
    color: '#cfd6de',
    metalness: 0.1,
    roughness: 0.84,
    envMapIntensity: 0.15,
  });
  const stationGoldMat = new THREE.MeshStandardMaterial({
    color: '#b88635',
    metalness: 0.22,
    roughness: 0.68,
    envMapIntensity: 0.16,
  });
  const stationLegMat = new THREE.MeshStandardMaterial({
    color: '#2c3542',
    metalness: 0.16,
    roughness: 0.84,
    envMapIntensity: 0.14,
  });
  const stationSolarMat = new THREE.MeshStandardMaterial({
    color: '#1b355c',
    metalness: 0.18,
    roughness: 0.72,
    envMapIntensity: 0.16,
  });
  const dishMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
  disposables.push(stationHullMat, stationGoldMat, stationLegMat, stationSolarMat, dishMat);

  const busGeo = new THREE.BoxGeometry(1.45, 1.05, 1.45);
  const topCapGeo = new THREE.CylinderGeometry(0.75, 0.92, 0.28, 8);
  const strutGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.35, 8);
  const footGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.1, 10);
  const wingGeo = new THREE.BoxGeometry(1.8, 0.06, 0.72);
  const mastGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.25, 8);
  const beaconGeo = new THREE.SphereGeometry(0.26, 12, 10);
  disposables.push(busGeo, topCapGeo, strutGeo, footGeo, wingGeo, mastGeo, beaconGeo);

  planet.scienceSites.forEach((s) => {
    const gy = planetGroundHeightAt(planet.id, s.x, s.z);
    const stGroup = new THREE.Group();
    stGroup.position.set(s.x, gy, s.z);

    // 3 splayed lander struts + footpads flush on ground
    for (let l = 0; l < 3; l++) {
      const a = (l / 3) * Math.PI * 2;
      const strut = new THREE.Mesh(strutGeo, stationLegMat);
      strut.position.set(Math.cos(a) * 0.85, 0.56, Math.sin(a) * 0.85);
      strut.rotation.z = -Math.cos(a) * 0.42;
      strut.rotation.x = Math.sin(a) * 0.42;
      strut.castShadow = !isSoftwareGl;
      const foot = new THREE.Mesh(footGeo, stationLegMat);
      foot.position.set(Math.cos(a) * 1.15, 0.05, Math.sin(a) * 1.15);
      stGroup.add(strut, foot);
    }

    const bus = new THREE.Mesh(busGeo, stationGoldMat);
    bus.position.y = 1.25;
    bus.castShadow = !isSoftwareGl;

    const topCap = new THREE.Mesh(topCapGeo, stationHullMat);
    topCap.position.y = 1.9;
    topCap.castShadow = !isSoftwareGl;

    const wingL = new THREE.Mesh(wingGeo, stationSolarMat);
    wingL.position.set(-1.55, 1.38, 0);
    wingL.rotation.z = 0.2;
    wingL.castShadow = !isSoftwareGl;

    const wingR = new THREE.Mesh(wingGeo, stationSolarMat);
    wingR.position.set(1.55, 1.38, 0);
    wingR.rotation.z = -0.2;
    wingR.castShadow = !isSoftwareGl;

    const mast = new THREE.Mesh(mastGeo, stationLegMat);
    mast.position.y = 2.55;

    const beacon = new THREE.Mesh(beaconGeo, dishMat);
    beacon.position.y = 3.25;

    stGroup.add(bus, topCap, wingL, wingR, mast, beacon);
    group.add(stGroup);

    obstacles.push({
      x: s.x,
      y: gy,
      z: s.z,
      radius: 1.55,
      height: 3.6,
      kind: 'structure',
    });

    interactables.push({
      id: s.id,
      kind: 'science',
      label: s.name,
      position: new THREE.Vector3(s.x, gy, s.z),
      mesh: beacon,
      radius: 7,
      dataMb: s.dataYieldMb,
      collected: completedScienceIds.includes(s.id),
    });
  });

  // 6. Collectible Multi-Shard Mineral Crystal Clusters
  const crystalGeo = new THREE.OctahedronGeometry(0.62, 0);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: planet.atmosphereColor,
    emissive: new THREE.Color(planet.atmosphereColor),
    emissiveIntensity: 0.35,
    roughness: 0.2,
    metalness: 0.3,
  });
  disposables.push(crystalGeo, crystalMat);

  for (let i = 0; i < planet.sampleTarget + 2; i++) {
    const angle = (i / (planet.sampleTarget + 2)) * Math.PI * 2 + 0.6;
    const dist = 22 + (i % 3) * 18;
    const sx = Math.cos(angle) * dist;
    const sz = Math.sin(angle) * dist;
    const sy = planetGroundHeightAt(planet.id, sx, sz);
    const sampleId = `${planet.id}_sample_${i}`;
    const already = collectedSampleIds.includes(sampleId);

    const cluster = new THREE.Group();
    cluster.position.set(sx, sy, sz);
    const mainShard = new THREE.Mesh(crystalGeo, crystalMat);
    mainShard.position.set(0, 0.85, 0);
    mainShard.scale.set(0.85, 1.4, 0.85);
    mainShard.castShadow = !isSoftwareGl;
    const shardL = new THREE.Mesh(crystalGeo, crystalMat);
    shardL.position.set(-0.42, 0.5, 0.22);
    shardL.rotation.z = 0.42;
    shardL.scale.set(0.45, 0.82, 0.45);
    const shardR = new THREE.Mesh(crystalGeo, crystalMat);
    shardR.position.set(0.38, 0.48, -0.2);
    shardR.rotation.z = -0.36;
    shardR.scale.set(0.4, 0.75, 0.4);
    cluster.add(mainShard, shardL, shardR);
    cluster.visible = !already;
    group.add(cluster);

    interactables.push({
      id: sampleId,
      kind: 'sample',
      label: planet.resourceName,
      position: new THREE.Vector3(sx, sy, sz),
      mesh: cluster,
      radius: 4.5,
      collected: already,
    });
  }

  // 7. Crisp Faceted Angular Regolith Boulders & Pebbles (Shadowed & Grounded)
  const rockGeo = createFacetedBoulderGeometry();
  const rockMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.92,
    metalness: 0.04,
    flatShading: true,
  });
  const rockCount = 115;
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rocks.castShadow = !isSoftwareGl;
  rocks.receiveShadow = !isSoftwareGl;
  const dummy = new THREE.Object3D();
  const rockBase = new THREE.Color(planet.terrainColor).lerp(new THREE.Color('#cbd5e1'), 0.28);
  const rockAlt = new THREE.Color(planet.terrainAccent).lerp(new THREE.Color('#475569'), 0.35);
  const rockMix = new THREE.Color();

  for (let i = 0; i < rockCount; i++) {
    const angle = i * 2.39996 + 0.4;
    const r = 13 + ((i * 23) % 108);
    let rx = Math.cos(angle) * r;
    let rz = Math.sin(angle) * r;
    // Keep clear of rover spawn (10, 9) and player spawn (0, 16)
    if (Math.hypot(rx - 10, rz - 9) < 4.5 || Math.hypot(rx, rz - 16) < 4.0) {
      rx += 5.5;
      rz += 4.5;
    }
    const ry = planetGroundHeightAt(planet.id, rx, rz);
    const isHero = i % 11 === 0;
    const scale = isHero ? 1.85 + (i % 3) * 0.55 : 0.42 + (i % 5) * 0.24;
    dummy.position.set(rx, ry + scale * 0.28, rz);
    dummy.rotation.set(i * 0.37, i * 1.15, i * 0.23);
    dummy.scale.set(scale * (1 + (i % 3) * 0.14), scale * 0.82, scale);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);

    obstacles.push({
      x: rx,
      y: ry,
      z: rz,
      radius: scale * (1 + (i % 3) * 0.07) * 0.96,
      height: scale * 1.05,
      kind: 'rock',
    });

    rockMix.copy(rockBase).lerp(rockAlt, (i % 6) * 0.16);
    rocks.setColorAt(i, rockMix);
  }
  rocks.instanceMatrix.needsUpdate = true;
  if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
  rocks.computeBoundingSphere();
  group.add(rocks);
  disposables.push(rockGeo, rockMat);

  // 8. Subtle Atmospheric Sunlit Dust Motes
  const dustCount = isSoftwareGl ? 45 : 90;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 160;
    dustPos[i * 3 + 1] = 1.2 + Math.random() * 14;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 160;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    map: glowTex,
    color: planet.atmosphereColor,
    size: 0.35,
    transparent: true,
    opacity: planet.id === 'luna' ? 0.08 : 0.18,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  group.add(dustPoints);
  disposables.push(dustGeo, dustMat);

  // 9. 2089 Alien Signal Monolith
  let monolithRing: THREE.Mesh | undefined;
  if (planet.hasMonolith) {
    const mx = 0;
    const mz = -62;
    const my = planetGroundHeightAt(planet.id, mx, mz);
    const monoGroup = new THREE.Group();
    monoGroup.position.set(mx, my, mz);

    const obeliskGeo = new THREE.BoxGeometry(2.2, 8.5, 1.1);
    const obeliskMat = new THREE.MeshStandardMaterial({
      color: '#16171d',
      metalness: 0.25,
      roughness: 0.68,
      emissive: new THREE.Color('#6d28d9'),
      emissiveIntensity: 0.28,
      envMapIntensity: 0.16,
    });
    const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
    obelisk.position.y = 4.25;
    obelisk.castShadow = !isSoftwareGl;
    monoGroup.add(obelisk);

    const mRingGeo = new THREE.TorusGeometry(3.2, 0.12, 10, 48);
    const mRingMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    monolithRing = new THREE.Mesh(mRingGeo, mRingMat);
    monolithRing.position.y = 4.5;
    monoGroup.add(monolithRing);

    const mLight = new THREE.PointLight('#a855f7', 6, 32);
    mLight.position.y = 4.8;
    monoGroup.add(mLight);

    group.add(monoGroup);
    disposables.push(obeliskGeo, obeliskMat, mRingGeo, mRingMat);

    obstacles.push({
      x: mx,
      y: my,
      z: mz,
      radius: 1.9,
      height: 8.5,
      kind: 'structure',
    });

    interactables.push({
      id: `${planet.id}_monolith_2089`,
      kind: 'monolith',
      label: { ar: 'مسلّة إشارة 2089 الغامضة', en: '2089 Signal Monolith' },
      position: new THREE.Vector3(mx, my, mz),
      mesh: monoGroup,
      radius: 8,
    });
  }

  // 10. Survival Supply Pods (O2 Canisters & Energy Cells merged from Lunar Odyssey)
  const podGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.92, 12);
  const o2PodMat = new THREE.MeshStandardMaterial({
    color: '#3489a8',
    emissive: new THREE.Color('#0284c7'),
    emissiveIntensity: 0.22,
    roughness: 0.72,
    metalness: 0.12,
    envMapIntensity: 0.14,
  });
  const energyPodMat = new THREE.MeshStandardMaterial({
    color: '#c48332',
    emissive: new THREE.Color('#b45309'),
    emissiveIntensity: 0.22,
    roughness: 0.72,
    metalness: 0.12,
    envMapIntensity: 0.14,
  });
  disposables.push(podGeo, o2PodMat, energyPodMat);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.35;
    const dist = 16 + (i % 3) * 14;
    const px = Math.cos(a) * dist;
    const pz = Math.sin(a) * dist;
    const py = planetGroundHeightAt(planet.id, px, pz);
    const isO2 = i % 2 === 0;
    const podId = `${planet.id}_pickup_${i}`;
    const already = collectedSampleIds.includes(podId);

    const podGroup = new THREE.Group();
    podGroup.position.set(px, py + 0.65, pz);
    const podMesh = new THREE.Mesh(podGeo, isO2 ? o2PodMat : energyPodMat);
    podMesh.castShadow = !isSoftwareGl;
    podGroup.add(podMesh);
    podGroup.visible = !already;
    group.add(podGroup);
    pickupMeshes.push(podGroup);

    interactables.push({
      id: podId,
      kind: 'pickup',
      pickupType: isO2 ? 'o2' : 'energy',
      label: isO2
        ? { ar: 'كبسولة أكسجين احتياطية [F]', en: 'Reserve O2 Canister [F]' }
        : { ar: 'خلية طاقة شمسية [F]', en: 'Reserve Energy Cell [F]' },
      position: new THREE.Vector3(px, py, pz),
      mesh: podGroup,
      radius: 3.6,
      collected: already,
    });
  }

  // 11. Buildable Surface Outpost Structures (Habitat Dome, Solar Relay, Science Beacon)
  const bMetalMat = new THREE.MeshStandardMaterial({
    color: '#bcc5d0',
    metalness: 0.15,
    roughness: 0.82,
    envMapIntensity: 0.15,
  });
  const bDomeMat = new THREE.MeshPhysicalMaterial({
    color: '#9fc5de',
    roughness: 0.3,
    metalness: 0.05,
    transparent: true,
    opacity: 0.56,
    envMapIntensity: 0.18,
  });
  const bSolarMat = new THREE.MeshStandardMaterial({
    color: '#1b355c',
    emissive: new THREE.Color('#0369a1'),
    emissiveIntensity: 0.14,
    metalness: 0.18,
    roughness: 0.72,
    envMapIntensity: 0.15,
  });
  const bBeaconMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
  disposables.push(bMetalMat, bDomeMat, bSolarMat, bBeaconMat);

  const spawnBuildingMesh = (kind: SurfaceBuildingKind, bx: number, bz: number) => {
    const gy = planetGroundHeightAt(planet.id, bx, bz);
    const bg = new THREE.Group();
    bg.position.set(bx, gy, bz);

    if (kind === 'habitat') {
      const baseGeo = new THREE.CylinderGeometry(3.2, 3.5, 0.45, 20);
      const base = new THREE.Mesh(baseGeo, bMetalMat);
      base.position.y = 0.22;
      const domeGeo = new THREE.SphereGeometry(2.9, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const dome = new THREE.Mesh(domeGeo, bDomeMat);
      dome.position.y = 0.4;
      const light = new THREE.PointLight('#38bdf8', 5, 16);
      light.position.y = 1.8;
      bg.add(base, dome, light);
      disposables.push(baseGeo, domeGeo);
    } else if (kind === 'solar_relay') {
      const mastGeo = new THREE.CylinderGeometry(0.18, 0.26, 3.6, 10);
      const mast = new THREE.Mesh(mastGeo, bMetalMat);
      mast.position.y = 1.8;
      const panelGeo = new THREE.BoxGeometry(4.2, 0.08, 1.8);
      const panel = new THREE.Mesh(panelGeo, bSolarMat);
      panel.position.y = 3.4;
      panel.rotation.x = 0.35;
      bg.add(mast, panel);
      disposables.push(mastGeo, panelGeo);
    } else {
      const pedGeo = new THREE.CylinderGeometry(0.65, 0.9, 1.4, 12);
      const ped = new THREE.Mesh(pedGeo, bMetalMat);
      ped.position.y = 0.7;
      const spireGeo = new THREE.CylinderGeometry(0.08, 0.14, 3.2, 8);
      const spire = new THREE.Mesh(spireGeo, bMetalMat);
      spire.position.y = 2.8;
      const orbGeo = new THREE.SphereGeometry(0.32, 12, 10);
      const orb = new THREE.Mesh(orbGeo, bBeaconMat);
      orb.position.y = 4.6;
      const light = new THREE.PointLight('#10b981', 4, 14);
      light.position.y = 4.6;
      bg.add(ped, spire, orb, light);
      disposables.push(pedGeo, spireGeo, orbGeo);
    }
    group.add(bg);
    obstacles.push({
      x: bx,
      y: gy,
      z: bz,
      radius: kind === 'habitat' ? 3.2 : 0.95,
      height: kind === 'habitat' ? 3.2 : 4.2,
      kind: 'structure',
    });
  };

  buildings
    .filter((b) => b.planetId === planet.id)
    .forEach((b) => spawnBuildingMesh(b.kind, b.x, b.z));

  return {
    group,
    interactables,
    obstacles,
    monolithRing,
    addBuilding(rec: SurfaceBuildingRecord) {
      if (rec.planetId === planet.id) {
        spawnBuildingMesh(rec.kind, rec.x, rec.z);
      }
    },
    update(elapsed: number) {
      dustPoints.rotation.y = elapsed * 0.012;
      for (const pm of pickupMeshes) {
        if (pm.visible) {
          pm.rotation.y = elapsed * 1.8;
        }
      }
    },
    markCollected(id: string) {
      const item = interactables.find((x) => x.id === id);
      if (item) {
        item.collected = true;
        if (item.mesh && item.kind !== 'science' && item.kind !== 'monolith') {
          item.mesh.visible = false;
        }
      }
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}
