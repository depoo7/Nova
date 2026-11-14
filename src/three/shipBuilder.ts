import * as THREE from 'three';
import type { DigitalTwinVisualState, ShipLivery } from '../types/game';
import {
  createAerospaceHullTextures,
  createMfdTelemetryTexture,
  createModelGraphicOverlayTexture,
} from './proceduralTextures';

export interface ProceduralShipRig {
  root: THREE.Group;
  hullMeshGroup: THREE.Group;
  thrusterFlames: THREE.Mesh[];
  thrusterLights: THREE.PointLight[];
  canopyMesh: THREE.Mesh;
  applyLivery: (livery: ShipLivery) => void;
  setThrustVisual: (thrustRatio: number, boosting: boolean) => void;
  setDigitalTwinState: (twin: DigitalTwinVisualState) => void;
  dispose: () => void;
}

/**
 * Builds an aerospace-realistic Space Shuttle Orbiter ("NOVA Orbiter") with full PBR maps:
 * - Ceramic thermal-tile fuselage + black RCC nose cone & heat-shield underbelly (bump + roughness maps)
 * - Stepped forward Flight Deck with multi-pane iridium-tinted cockpit glass + forward RCS pods
 * - Dorsal Payload Cargo Bay with radiator doors, docking collar, CubeSat payload & Canadarm
 * - Swept double-delta orbiter wings with black leading-edge thermal strips, elevons & nav strobes
 * - Tall vertical tail stabilizer + twin OMS pods + 3 RS-25 main engine bells + Mach-diamond plumes
 */
export function buildProceduralStarfighter(
  initialLivery: ShipLivery,
  isSoftwareGl: boolean,
  maxAniso = 4
): ProceduralShipRig {
  const root = new THREE.Group();
  const hullMeshGroup = new THREE.Group();
  root.add(hullMeshGroup);

  const hullPbr = createAerospaceHullTextures('#e8edf2', maxAniso);
  const tilePbr = createAerospaceHullTextures('#161b22', maxAniso);
  const hullGraphicTex = createModelGraphicOverlayTexture('ORBITER // ICPS');

  const hullMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialLivery.hullHex).lerp(new THREE.Color('#dfe4ea'), 0.25),
    map: hullPbr.map,
    bumpMap: hullPbr.bumpMap,
    bumpScale: 0.015,
    roughnessMap: hullPbr.roughnessMap,
    metalness: 0.08,
    roughness: 0.86,
    envMapIntensity: 0.16,
  });

  const heatShieldMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#181e26'),
    map: tilePbr.map,
    bumpMap: tilePbr.bumpMap,
    bumpScale: 0.02,
    roughnessMap: tilePbr.roughnessMap,
    metalness: 0.06,
    roughness: 0.94,
    envMapIntensity: 0.12,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#242d3a'),
    metalness: 0.16,
    roughness: 0.8,
    envMapIntensity: 0.16,
  });

  const bayMetalMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#bcc5d0'),
    metalness: 0.18,
    roughness: 0.76,
    envMapIntensity: 0.18,
  });

  const tankOrangeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#9c4b27'),
    metalness: 0.08,
    roughness: 0.84,
    envMapIntensity: 0.15,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialLivery.accentHex).lerp(new THREE.Color('#64748b'), 0.3),
    metalness: 0.12,
    roughness: 0.74,
    emissive: new THREE.Color(initialLivery.accentHex),
    emissiveIntensity: 0.04,
    envMapIntensity: 0.16,
  });

  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#101d2e'),
    metalness: 0.08,
    roughness: 0.24,
    transmission: isSoftwareGl ? 0 : 0.28,
    transparent: true,
    opacity: isSoftwareGl ? 0.82 : 0.9,
    ior: 1.46,
    clearcoat: 0.14,
    clearcoatRoughness: 0.24,
    envMapIntensity: 0.24,
  });

  const graphicDecalMat = new THREE.MeshBasicMaterial({
    map: hullGraphicTex,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  });

  const meshOverlayMat = new THREE.LineBasicMaterial({
    color: '#93c5fd',
    transparent: true,
    opacity: 0.16,
  });

  const flameMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(initialLivery.thrusterHex),
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const shockMat = new THREE.MeshBasicMaterial({
    color: '#bae6fd',
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const innerCoreMat = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.98,
  });

  // 1. Main Cylindrical-Boxed Orbiter Fuselage + Thermal Belly
  const mainBodyGeo = new THREE.CylinderGeometry(0.84, 0.92, 4.4, 20);
  mainBodyGeo.rotateX(Math.PI / 2);
  mainBodyGeo.scale(1.12, 0.88, 1);
  const mainBody = new THREE.Mesh(mainBodyGeo, hullMat);
  mainBody.position.set(0, 0.12, 0.35);
  mainBody.castShadow = !isSoftwareGl;
  hullMeshGroup.add(mainBody);

  // Forward Cabin & Nose Cone (Shuttle stepped profile) + Forward RCS Blister Pod
  const noseBlendGeo = new THREE.ConeGeometry(0.84, 2.2, 20);
  noseBlendGeo.rotateX(-Math.PI / 2);
  noseBlendGeo.scale(1.06, 0.82, 1);
  const noseBlend = new THREE.Mesh(noseBlendGeo, hullMat);
  noseBlend.position.set(0, 0.04, -2.75);
  hullMeshGroup.add(noseBlend);

  const noseCapGeo = new THREE.SphereGeometry(0.32, 16, 14);
  noseCapGeo.scale(1.0, 0.82, 1.45);
  const noseCap = new THREE.Mesh(noseCapGeo, heatShieldMat);
  noseCap.position.set(0, -0.02, -3.72);
  hullMeshGroup.add(noseCap);

  const rcsPodGeo = new THREE.BoxGeometry(0.54, 0.18, 0.42);
  const rcsPod = new THREE.Mesh(rcsPodGeo, darkTrimMat);
  rcsPod.position.set(0, 0.24, -3.15);
  hullMeshGroup.add(rcsPod);

  // Underside Thermal Protection Tiles Belly
  const bellyGeo = new THREE.BoxGeometry(1.74, 0.22, 4.95);
  const bellyTile = new THREE.Mesh(bellyGeo, heatShieldMat);
  bellyTile.position.set(0, -0.52, 0.05);
  hullMeshGroup.add(bellyTile);

  // 2. Stepped Forward Flight Deck + Wraparound Shuttle Windows + Dorsal Docking Collar
  const deckGeo = new THREE.BoxGeometry(1.22, 0.52, 1.45);
  const flightDeck = new THREE.Mesh(deckGeo, hullMat);
  flightDeck.position.set(0, 0.56, -1.62);
  hullMeshGroup.add(flightDeck);

  const canopyGeo = new THREE.BoxGeometry(1.16, 0.34, 0.74);
  const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
  canopyMesh.position.set(0, 0.66, -2.14);
  canopyMesh.rotation.x = 0.48;
  hullMeshGroup.add(canopyMesh);

  // Cockpit windshield vertical center mullion
  const mullionGeo = new THREE.BoxGeometry(0.05, 0.32, 0.76);
  const mullion = new THREE.Mesh(mullionGeo, darkTrimMat);
  mullion.position.set(0, 0.67, -2.15);
  mullion.rotation.x = 0.48;
  hullMeshGroup.add(mullion);

  const collarGeo = new THREE.TorusGeometry(0.36, 0.06, 10, 20);
  collarGeo.rotateX(Math.PI / 2);
  const dockingCollar = new THREE.Mesh(collarGeo, bayMetalMat);
  dockingCollar.position.set(0, 0.86, -1.16);
  hullMeshGroup.add(dockingCollar);

  const cabinGlow = new THREE.PointLight('#fbbf24', 1.05, 3.8);
  cabinGlow.position.set(0, 0.64, -1.9);
  hullMeshGroup.add(cabinGlow);

  // 3. Dorsal Payload Cargo Bay (Semi-open radiator doors + docked Probe + Canadarm)
  const bayFloorGeo = new THREE.BoxGeometry(1.24, 0.14, 2.55);
  const bayFloor = new THREE.Mesh(bayFloorGeo, darkTrimMat);
  bayFloor.position.set(0, 0.86, 0.45);
  hullMeshGroup.add(bayFloor);

  const bayDoorGeo = new THREE.BoxGeometry(0.62, 0.06, 2.48);
  const leftBayDoor = new THREE.Mesh(bayDoorGeo, bayMetalMat);
  leftBayDoor.position.set(-0.88, 1.02, 0.45);
  leftBayDoor.rotation.z = 0.92;
  const rightBayDoor = new THREE.Mesh(bayDoorGeo, bayMetalMat);
  rightBayDoor.position.set(0.88, 1.02, 0.45);
  rightBayDoor.rotation.z = -0.92;
  hullMeshGroup.add(leftBayDoor, rightBayDoor);

  // Docked Science Satellite inside Payload Bay + Canadarm
  const satGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.65, 14);
  satGeo.rotateX(Math.PI / 2);
  const satPayload = new THREE.Mesh(satGeo, accentMat);
  satPayload.position.set(0, 1.06, 0.45);
  hullMeshGroup.add(satPayload);

  const armGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.2, 8);
  armGeo.rotateX(Math.PI / 2);
  const canadarm = new THREE.Mesh(armGeo, bayMetalMat);
  canadarm.position.set(-0.46, 1.12, 0.25);
  canadarm.rotation.y = 0.22;
  hullMeshGroup.add(canadarm);

  // 4. Swept Double-Delta Shuttle Orbiter Wings + Black Leading Edges + Elevons
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0.75, 1.65);
  wingShape.lineTo(1.7, 0.5);
  wingShape.lineTo(3.9, -1.25);
  wingShape.lineTo(3.9, -2.05);
  wingShape.lineTo(0.78, -2.05);
  wingShape.closePath();

  const wingExtrude = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  wingExtrude.rotateX(Math.PI / 2);

  const rightWing = new THREE.Mesh(wingExtrude, hullMat);
  rightWing.position.set(0, -0.26, 0.45);
  hullMeshGroup.add(rightWing);

  const leftWing = new THREE.Mesh(wingExtrude, hullMat);
  leftWing.scale.x = -1;
  leftWing.position.set(0, -0.26, 0.45);
  hullMeshGroup.add(leftWing);

  // Photo 1 Secondary Detail: Exposed Open-Truss Cryo Propellant Bay + Muted Orange Tanks
  const cryoTankGeo = new THREE.SphereGeometry(0.24, 14, 12);
  const strutBarGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.72, 6);
  const cryoOffsets: Array<[number, number, number]> = [
    [-0.28, 1.04, 1.38],
    [0.28, 1.04, 1.38],
    [0, 1.12, 1.02],
  ];
  cryoOffsets.forEach(([tx, ty, tz]) => {
    const tank = new THREE.Mesh(cryoTankGeo, tankOrangeMat);
    tank.position.set(tx, ty, tz);
    hullMeshGroup.add(tank);
  });
  for (let s = 0; s < 6; s++) {
    const angle = (s / 6) * Math.PI * 2;
    const strut = new THREE.Mesh(strutBarGeo, darkTrimMat);
    strut.position.set(Math.cos(angle) * 0.46, 0.98, 1.2 + (s % 2) * 0.16);
    strut.rotation.z = Math.cos(angle) * 0.42;
    strut.rotation.x = 0.35;
    hullMeshGroup.add(strut);
  }

  // Photo 1 & 3 Graphic Overlay: Transparent Structural Wireframe Mesh + Hull Decal Stencils
  const hullWireGeo = new THREE.EdgesGeometry(mainBodyGeo, 24);
  const hullWire = new THREE.LineSegments(hullWireGeo, meshOverlayMat);
  hullWire.position.copy(mainBody.position);
  hullWire.scale.setScalar(1.015);
  hullMeshGroup.add(hullWire);

  const wingWireGeo = new THREE.EdgesGeometry(wingExtrude, 28);
  const rWingWire = new THREE.LineSegments(wingWireGeo, meshOverlayMat);
  rWingWire.position.copy(rightWing.position);
  rWingWire.position.y += 0.008;
  const lWingWire = new THREE.LineSegments(wingWireGeo, meshOverlayMat);
  lWingWire.scale.x = -1;
  lWingWire.position.copy(leftWing.position);
  lWingWire.position.y += 0.008;
  hullMeshGroup.add(rWingWire, lWingWire);

  const decalPlaneGeo = new THREE.PlaneGeometry(1.35, 0.62);
  const leftDecal = new THREE.Mesh(decalPlaneGeo, graphicDecalMat);
  leftDecal.position.set(-0.96, 0.15, -0.35);
  leftDecal.rotation.y = -Math.PI / 2;
  const rightDecal = new THREE.Mesh(decalPlaneGeo, graphicDecalMat);
  rightDecal.position.set(0.96, 0.15, -0.35);
  rightDecal.rotation.y = Math.PI / 2;
  hullMeshGroup.add(leftDecal, rightDecal);

  // Subtle Flight-Dynamics Reference Axis Lines (Photo 1 red/white/green vectors)
  const axisXGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-4.6, 0.1, 0),
    new THREE.Vector3(4.6, 0.1, 0),
  ]);
  const axisZGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.1, -4.4),
    new THREE.Vector3(0, 0.1, 4.4),
  ]);
  const axisXMat = new THREE.LineBasicMaterial({ color: '#f87171', transparent: true, opacity: 0.24 });
  const axisZMat = new THREE.LineBasicMaterial({ color: '#e2e8f0', transparent: true, opacity: 0.22 });
  hullMeshGroup.add(new THREE.Line(axisXGeo, axisXMat), new THREE.Line(axisZGeo, axisZMat));

  // Thermal Black Leading-Edge Strips, Elevons & Wing Accent Stripes
  const edgeGeo = new THREE.BoxGeometry(2.85, 0.1, 0.16);
  const rEdge = new THREE.Mesh(edgeGeo, heatShieldMat);
  rEdge.position.set(2.45, -0.3, 0.72);
  rEdge.rotation.y = -0.68;
  const lEdge = new THREE.Mesh(edgeGeo, heatShieldMat);
  lEdge.position.set(-2.45, -0.3, 0.72);
  lEdge.rotation.y = 0.68;
  hullMeshGroup.add(rEdge, lEdge);

  const elevonGeo = new THREE.BoxGeometry(2.4, 0.06, 0.24);
  const rElevon = new THREE.Mesh(elevonGeo, darkTrimMat);
  rElevon.position.set(2.25, -0.31, 2.52);
  const lElevon = new THREE.Mesh(elevonGeo, darkTrimMat);
  lElevon.position.set(-2.25, -0.31, 2.52);
  hullMeshGroup.add(rElevon, lElevon);

  const stripeGeo = new THREE.BoxGeometry(2.1, 0.04, 0.2);
  const rStripe = new THREE.Mesh(stripeGeo, accentMat);
  rStripe.position.set(2.1, -0.22, 1.88);
  const lStripe = new THREE.Mesh(stripeGeo, accentMat);
  lStripe.position.set(-2.1, -0.22, 1.88);
  hullMeshGroup.add(rStripe, lStripe);

  // Port & Starboard Wingtip Nav Strobe Lights
  const strobeGeo = new THREE.SphereGeometry(0.09, 8, 8);
  const portLightMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
  const stbdLightMat = new THREE.MeshBasicMaterial({ color: '#22c55e' });
  const portBeacon = new THREE.Mesh(strobeGeo, portLightMat);
  portBeacon.position.set(-3.92, -0.22, 2.05);
  const stbdBeacon = new THREE.Mesh(strobeGeo, stbdLightMat);
  stbdBeacon.position.set(3.92, -0.22, 2.05);
  hullMeshGroup.add(portBeacon, stbdBeacon);

  // 5. Tall Dorsal Vertical Tail Stabilizer
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(1.35, 0);
  tailShape.lineTo(1.65, 1.85);
  tailShape.lineTo(0.85, 1.85);
  tailShape.closePath();

  const tailExtrude = new THREE.ExtrudeGeometry(tailShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
  tailExtrude.rotateY(Math.PI / 2);
  const tailFin = new THREE.Mesh(tailExtrude, hullMat);
  tailFin.position.set(-0.06, 0.78, 2.55);
  hullMeshGroup.add(tailFin);

  const tailTipGeo = new THREE.BoxGeometry(0.14, 0.35, 0.72);
  const tailTip = new THREE.Mesh(tailTipGeo, accentMat);
  tailTip.position.set(0, 2.48, 2.18);
  hullMeshGroup.add(tailTip);

  // 6. Twin OMS Pods + 3 Triangular RS-25 Main Shuttle Engine Nozzles + Mach Plumes
  const omsGeo = new THREE.CylinderGeometry(0.28, 0.34, 1.45, 14);
  omsGeo.rotateX(Math.PI / 2);
  [-0.78, 0.78].forEach((x) => {
    const pod = new THREE.Mesh(omsGeo, hullMat);
    pod.position.set(x, 0.56, 2.15);
    hullMeshGroup.add(pod);
  });

  const thrusterFlames: THREE.Mesh[] = [];
  const thrusterLights: THREE.PointLight[] = [];

  const nozzleGeo = new THREE.CylinderGeometry(0.22, 0.35, 0.54, 16);
  nozzleGeo.rotateX(Math.PI / 2);

  const flameGeo = new THREE.ConeGeometry(0.26, 2.15, 14);
  flameGeo.rotateX(Math.PI / 2);
  flameGeo.translate(0, 0, 1.07);

  const shockGeo = new THREE.ConeGeometry(0.35, 2.55, 14);
  shockGeo.rotateX(Math.PI / 2);
  shockGeo.translate(0, 0, 1.25);

  const coreGeo = new THREE.ConeGeometry(0.12, 1.2, 10);
  coreGeo.rotateX(Math.PI / 2);
  coreGeo.translate(0, 0, 0.58);

  const engineCluster: Array<[number, number]> = [
    [0, 0.34],
    [-0.46, -0.14],
    [0.46, -0.14],
  ];

  engineCluster.forEach(([ex, ey]) => {
    const nozzle = new THREE.Mesh(nozzleGeo, darkTrimMat);
    nozzle.position.set(ex, ey, 2.68);
    hullMeshGroup.add(nozzle);

    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(ex, ey, 2.86);
    const core = new THREE.Mesh(coreGeo, innerCoreMat);
    const shock = new THREE.Mesh(shockGeo, shockMat);
    flame.add(core, shock);
    hullMeshGroup.add(flame);
    thrusterFlames.push(flame);
  });

  const engineGlow = new THREE.PointLight(new THREE.Color(initialLivery.thrusterHex), 3.2, 26, 2);
  engineGlow.position.set(0, 0.1, 3.8);
  hullMeshGroup.add(engineGlow);
  thrusterLights.push(engineGlow);

  // Under-wing Micro-Plasma Mining Emitters
  const cannonGeo = new THREE.CylinderGeometry(0.055, 0.075, 1.0, 8);
  cannonGeo.rotateX(Math.PI / 2);
  [-1.9, 1.9].forEach((xOffset) => {
    const cannon = new THREE.Mesh(cannonGeo, darkTrimMat);
    cannon.position.set(xOffset, -0.34, 0.25);
    hullMeshGroup.add(cannon);
  });

  // 7. Digital Twin Modular Hardware Groups (Solar Wings vs RTG, 3-Tier Dish, Thermal Armor, Science Beam)
  const pvPanelMat = new THREE.MeshStandardMaterial({
    color: '#1d4ed8',
    emissive: '#0c4a6e',
    emissiveIntensity: 0.25,
    metalness: 0.55,
    roughness: 0.28,
  });
  const rtgFinMat = new THREE.MeshStandardMaterial({
    color: '#334155',
    emissive: '#ea580c',
    emissiveIntensity: 0.35,
    metalness: 0.45,
    roughness: 0.55,
  });
  const dishMetalMat = new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    metalness: 0.35,
    roughness: 0.38,
    side: THREE.DoubleSide,
  });
  const armorPlateMat = new THREE.MeshStandardMaterial({
    color: '#475569',
    metalness: 0.65,
    roughness: 0.42,
  });
  const scienceBeamMat = new THREE.MeshBasicMaterial({
    color: '#22d3ee',
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const modeBeaconMat = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
  });

  const solarWingGroup = new THREE.Group();
  const solarPanelGeo = new THREE.BoxGeometry(2.3, 0.04, 0.95);
  const solarBoomGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8);
  solarBoomGeo.rotateZ(Math.PI / 2);
  [-1, 1].forEach((side) => {
    const boom = new THREE.Mesh(solarBoomGeo, darkTrimMat);
    boom.position.set(side * 1.65, 0.28, -0.35);
    const panel = new THREE.Mesh(solarPanelGeo, pvPanelMat);
    panel.position.set(side * 2.9, 0.28, -0.35);
    solarWingGroup.add(boom, panel);
  });
  hullMeshGroup.add(solarWingGroup);

  const rtgGroup = new THREE.Group();
  const rtgCoreGeo = new THREE.CylinderGeometry(0.16, 0.19, 1.05, 12);
  rtgCoreGeo.rotateX(Math.PI / 2);
  const rtgFinGeo = new THREE.BoxGeometry(0.38, 0.03, 0.92);
  [-0.95, 0.95].forEach((rx) => {
    const core = new THREE.Mesh(rtgCoreGeo, rtgFinMat);
    core.position.set(rx, 0.25, 1.45);
    const finA = new THREE.Mesh(rtgFinGeo, rtgFinMat);
    finA.position.set(rx, 0.25, 1.45);
    const finB = new THREE.Mesh(rtgFinGeo, rtgFinMat);
    finB.position.set(rx, 0.25, 1.45);
    finB.rotation.z = Math.PI / 2;
    rtgGroup.add(core, finA, finB);
  });
  rtgGroup.visible = false;
  hullMeshGroup.add(rtgGroup);

  const dishMastGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.55, 8);
  const dishSmallGeo = new THREE.ConeGeometry(0.24, 0.16, 16, 1, true);
  dishSmallGeo.rotateX(-Math.PI * 0.65);
  const dishMedGeo = new THREE.ConeGeometry(0.46, 0.24, 20, 1, true);
  dishMedGeo.rotateX(-Math.PI * 0.65);
  const dishLargeGeo = new THREE.ConeGeometry(0.76, 0.34, 24, 1, true);
  dishLargeGeo.rotateX(-Math.PI * 0.65);

  const dishPivot = new THREE.Group();
  dishPivot.position.set(0.48, 0.96, -0.55);
  const dishMast = new THREE.Mesh(dishMastGeo, darkTrimMat);
  dishMast.position.y = 0.22;
  const dishTier1 = new THREE.Mesh(dishSmallGeo, dishMetalMat);
  dishTier1.position.set(0, 0.48, -0.06);
  const dishTier2 = new THREE.Mesh(dishMedGeo, dishMetalMat);
  dishTier2.position.set(0, 0.52, -0.08);
  dishTier2.visible = false;
  const dishTier3 = new THREE.Mesh(dishLargeGeo, dishMetalMat);
  dishTier3.position.set(0, 0.58, -0.1);
  dishTier3.visible = false;

  const beaconSphereGeo = new THREE.SphereGeometry(0.07, 10, 10);
  const modeBeacon = new THREE.Mesh(beaconSphereGeo, modeBeaconMat);
  modeBeacon.position.set(0, 0.68, -0.12);
  dishPivot.add(dishMast, dishTier1, dishTier2, dishTier3, modeBeacon);
  hullMeshGroup.add(dishPivot);

  const thermalArmorGroup = new THREE.Group();
  const armorShieldGeo = new THREE.BoxGeometry(0.14, 0.52, 3.1);
  [-1.08, 1.08].forEach((ax) => {
    const plate = new THREE.Mesh(armorShieldGeo, armorPlateMat);
    plate.position.set(ax, 0.08, 0.2);
    thermalArmorGroup.add(plate);
  });
  thermalArmorGroup.visible = false;
  hullMeshGroup.add(thermalArmorGroup);

  const scanConeGeo = new THREE.ConeGeometry(1.15, 3.2, 20, 1, true);
  scanConeGeo.translate(0, -1.6, 0);
  const scienceScanCone = new THREE.Mesh(scanConeGeo, scienceBeamMat);
  scienceScanCone.position.set(0, -0.62, -1.35);
  scienceScanCone.visible = false;
  hullMeshGroup.add(scienceScanCone);

  const disposables: Array<{ dispose: () => void }> = [
    hullPbr.map,
    hullPbr.bumpMap,
    hullPbr.roughnessMap,
    tilePbr.map,
    tilePbr.bumpMap,
    tilePbr.roughnessMap,
    hullGraphicTex,
    hullMat,
    heatShieldMat,
    darkTrimMat,
    bayMetalMat,
    tankOrangeMat,
    accentMat,
    canopyMat,
    graphicDecalMat,
    meshOverlayMat,
    axisXMat,
    axisZMat,
    flameMat,
    shockMat,
    innerCoreMat,
    portLightMat,
    stbdLightMat,
    pvPanelMat,
    rtgFinMat,
    dishMetalMat,
    armorPlateMat,
    scienceBeamMat,
    modeBeaconMat,
    mainBodyGeo,
    noseBlendGeo,
    noseCapGeo,
    rcsPodGeo,
    bellyGeo,
    deckGeo,
    canopyGeo,
    mullionGeo,
    collarGeo,
    bayFloorGeo,
    bayDoorGeo,
    satGeo,
    armGeo,
    wingExtrude,
    cryoTankGeo,
    strutBarGeo,
    hullWireGeo,
    wingWireGeo,
    decalPlaneGeo,
    axisXGeo,
    axisZGeo,
    edgeGeo,
    elevonGeo,
    stripeGeo,
    strobeGeo,
    tailExtrude,
    tailTipGeo,
    omsGeo,
    nozzleGeo,
    flameGeo,
    shockGeo,
    coreGeo,
    cannonGeo,
    solarPanelGeo,
    solarBoomGeo,
    rtgCoreGeo,
    rtgFinGeo,
    dishMastGeo,
    dishSmallGeo,
    dishMedGeo,
    dishLargeGeo,
    beaconSphereGeo,
    armorShieldGeo,
    scanConeGeo,
  ];

  return {
    root,
    hullMeshGroup,
    thrusterFlames,
    thrusterLights,
    canopyMesh,
    applyLivery(livery: ShipLivery) {
      hullMat.color.set(livery.hullHex).lerp(new THREE.Color('#dfe4ea'), 0.25);
      accentMat.color.set(livery.accentHex).lerp(new THREE.Color('#64748b'), 0.3);
      accentMat.emissive.set(livery.accentHex);
      flameMat.color.set(livery.thrusterHex);
      thrusterLights.forEach((l) => l.color.set(livery.thrusterHex));
    },
    setThrustVisual(thrustRatio: number, boosting: boolean) {
      const lengthScale = boosting
        ? 2.05 + Math.random() * 0.42
        : 0.48 + thrustRatio * 0.95 + Math.random() * 0.1;
      const radialScale = boosting ? 1.3 : 0.84 + thrustRatio * 0.24;
      thrusterFlames.forEach((f) => {
        f.scale.set(radialScale, radialScale, lengthScale);
      });
      flameMat.opacity = boosting ? 0.82 : 0.42 + thrustRatio * 0.26;
      shockMat.opacity = boosting ? 0.34 : 0.12 + thrustRatio * 0.12;
      thrusterLights.forEach((l) => {
        l.intensity = boosting ? 3.8 : 1.1 + thrustRatio * 1.6;
      });
    },
    setDigitalTwinState(twin: DigitalTwinVisualState) {
      solarWingGroup.visible = !twin.hasRtg;
      solarWingGroup.scale.set(twin.solarScale, 1, twin.solarScale > 1.2 ? 1.2 : 1);
      rtgGroup.visible = twin.hasRtg;

      dishTier1.visible = twin.dishTier === 1;
      dishTier2.visible = twin.dishTier === 2;
      dishTier3.visible = twin.dishTier === 3;

      thermalArmorGroup.visible = twin.hasThermalArmor;
      scienceScanCone.visible = twin.activeScienceBeam;

      if (twin.hullIntegrity < 45 || twin.powerDeficit) {
        hullMat.emissive.set(twin.hullIntegrity < 45 ? '#ef4444' : '#f59e0b');
        hullMat.emissiveIntensity = twin.hullIntegrity < 45 ? 0.22 : 0.1;
      } else {
        hullMat.emissive.set('#000000');
        hullMat.emissiveIntensity = 0;
      }

      const modeHex =
        twin.operationalMode === 'safe'
          ? '#f59e0b'
          : twin.operationalMode === 'low_power'
            ? '#94a3b8'
            : twin.operationalMode === 'science_burst'
              ? '#34d399'
              : twin.operationalMode === 'comms_downlink'
                ? '#a855f7'
                : '#38bdf8';
      modeBeaconMat.color.set(modeHex);
      scienceBeamMat.color.set(twin.commsHealthy ? '#22d3ee' : '#f59e0b');
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}

export interface CockpitFrameRig {
  group: THREE.Group;
  updateStick: (pitchInput: number, yawInput: number) => void;
  dispose: () => void;
}

/**
 * Attached to the camera in Cockpit View for authentic Space Shuttle Flight Deck:
 * - Angled open V-frame canopy pillars with glowing green telemetry LEDs + overhead backlit annunciators
 * - Sculpted burgundy-titanium glare shield + holographic HUD combiner glass + avionics bezels
 * - 4 multi-function displays (Fuel/RCS, Orbital Radar/Apoapsis, Docking Reticle, Shuttle Wireframe)
 * - Right-hand 3D HOTAS flight stick that tilts dynamically with steering
 */
export function buildCockpitFrameRig(): CockpitFrameRig {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const strutMat = new THREE.MeshStandardMaterial({
    color: '#20242c',
    metalness: 0.14,
    roughness: 0.86,
    envMapIntensity: 0.15,
  });
  const burgundyTrimMat = new THREE.MeshStandardMaterial({
    color: '#4e2c30',
    metalness: 0.12,
    roughness: 0.88,
    envMapIntensity: 0.15,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: '#171c24',
    metalness: 0.18,
    roughness: 0.82,
    envMapIntensity: 0.16,
  });
  const combinerMat = new THREE.MeshPhysicalMaterial({
    color: '#7dd3fc',
    transparent: true,
    opacity: 0.1,
    roughness: 0.2,
    metalness: 0.05,
    clearcoat: 0.08,
    side: THREE.DoubleSide,
  });
  const ledGreenMat = new THREE.MeshBasicMaterial({ color: '#22c55e' });
  const ledCyanMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
  const redButtonMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });

  const leftTex = createMfdTelemetryTexture('left');
  const centerTex = createMfdTelemetryTexture('center');
  const rightTex = createMfdTelemetryTexture('right');
  const armTex = createMfdTelemetryTexture('armrest');

  const leftMat = new THREE.MeshBasicMaterial({ map: leftTex });
  const centerMat = new THREE.MeshBasicMaterial({ map: centerTex });
  const rightMat = new THREE.MeshBasicMaterial({ map: rightTex });
  const armMat = new THREE.MeshBasicMaterial({ map: armTex });

  disposables.push(
    strutMat,
    burgundyTrimMat,
    darkMetalMat,
    combinerMat,
    ledGreenMat,
    ledCyanMat,
    redButtonMat,
    leftTex,
    centerTex,
    rightTex,
    armTex,
    leftMat,
    centerMat,
    rightMat,
    armMat
  );

  // 1. Open V-Frame Shuttle Canopy Struts + Backlit Brow Switch Strip
  const strutGeo = new THREE.BoxGeometry(0.065, 1.55, 0.08);
  const leftStrut = new THREE.Mesh(strutGeo, strutMat);
  leftStrut.position.set(-0.58, 0.24, -0.78);
  leftStrut.rotation.set(0.36, 0.14, -0.44);

  const rightStrut = new THREE.Mesh(strutGeo, strutMat);
  rightStrut.position.set(0.58, 0.24, -0.78);
  rightStrut.rotation.set(0.36, -0.14, 0.44);

  const ledGeo = new THREE.BoxGeometry(0.014, 0.012, 0.012);
  [-1, 1].forEach((side) => {
    for (let i = 0; i < 4; i++) {
      const pip = new THREE.Mesh(ledGeo, ledGreenMat);
      pip.position.set(side * (0.48 + i * 0.032), 0.05 + i * 0.06, -0.73);
      group.add(pip);
    }
  });

  const browGeo = new THREE.BoxGeometry(1.5, 0.07, 0.14);
  const brow = new THREE.Mesh(browGeo, darkMetalMat);
  brow.position.set(0, 0.66, -0.64);
  group.add(leftStrut, rightStrut, brow);

  // Backlit overhead avionics indicator lights
  const browPipGeo = new THREE.BoxGeometry(0.036, 0.012, 0.014);
  for (let i = -3; i <= 3; i++) {
    const bp = new THREE.Mesh(browPipGeo, i % 2 === 0 ? ledCyanMat : ledGreenMat);
    bp.position.set(i * 0.075, 0.635, -0.57);
    group.add(bp);
  }

  // Holographic HUD Combiner Glass on top of Glare Shield
  const hudGlassGeo = new THREE.PlaneGeometry(0.36, 0.2);
  const hudGlass = new THREE.Mesh(hudGlassGeo, combinerMat);
  hudGlass.position.set(0, -0.02, -0.68);
  hudGlass.rotation.x = 0.28;
  group.add(hudGlass);

  // 2. Sculpted Glare Shield Coaming + Side Console Cowls
  const glareGeo = new THREE.BoxGeometry(1.48, 0.09, 0.34);
  const glareShield = new THREE.Mesh(glareGeo, burgundyTrimMat);
  glareShield.position.set(0, -0.17, -0.72);
  glareShield.rotation.x = 0.08;

  const sideWingGeo = new THREE.BoxGeometry(0.45, 0.18, 0.52);
  const leftCowl = new THREE.Mesh(sideWingGeo, burgundyTrimMat);
  leftCowl.position.set(-0.62, -0.34, -0.54);
  leftCowl.rotation.set(-0.18, 0.22, -0.15);
  const rightCowl = new THREE.Mesh(sideWingGeo, burgundyTrimMat);
  rightCowl.position.set(0.62, -0.34, -0.54);
  rightCowl.rotation.set(-0.18, -0.22, 0.15);

  const dashBodyGeo = new THREE.BoxGeometry(1.32, 0.34, 0.28);
  const dashBody = new THREE.Mesh(dashBodyGeo, darkMetalMat);
  dashBody.position.set(0, -0.36, -0.73);
  dashBody.rotation.x = -0.22;
  group.add(glareShield, leftCowl, rightCowl, dashBody);

  // 3. Three Main Front MFD Screens + Crisp Instrument Bezels
  const sideMfdGeo = new THREE.PlaneGeometry(0.18, 0.21);
  const sideBezelGeo = new THREE.BoxGeometry(0.205, 0.235, 0.02);
  const centerMfdGeo = new THREE.PlaneGeometry(0.46, 0.22);
  const centerBezelGeo = new THREE.BoxGeometry(0.49, 0.245, 0.02);

  const bezelLeft = new THREE.Mesh(sideBezelGeo, strutMat);
  bezelLeft.position.set(-0.37, -0.31, -0.598);
  bezelLeft.rotation.set(-0.22, 0.1, 0);
  const mfdLeft = new THREE.Mesh(sideMfdGeo, leftMat);
  mfdLeft.position.set(-0.37, -0.31, -0.585);
  mfdLeft.rotation.set(-0.22, 0.1, 0);

  const bezelCenter = new THREE.Mesh(centerBezelGeo, strutMat);
  bezelCenter.position.set(0, -0.31, -0.595);
  bezelCenter.rotation.x = -0.22;
  const mfdCenter = new THREE.Mesh(centerMfdGeo, centerMat);
  mfdCenter.position.set(0, -0.31, -0.582);
  mfdCenter.rotation.x = -0.22;

  const bezelRight = new THREE.Mesh(sideBezelGeo, strutMat);
  bezelRight.position.set(0.37, -0.31, -0.598);
  bezelRight.rotation.set(-0.22, -0.1, 0);
  const mfdRight = new THREE.Mesh(sideMfdGeo, rightMat);
  mfdRight.position.set(0.37, -0.31, -0.585);
  mfdRight.rotation.set(-0.22, -0.1, 0);

  group.add(bezelLeft, mfdLeft, bezelCenter, mfdCenter, bezelRight, mfdRight);

  // 4. Right Armrest Console + Shuttle Wireframe MFD + 3D HOTAS Flight Stick
  const armrestGeo = new THREE.BoxGeometry(0.32, 0.16, 0.44);
  const armrest = new THREE.Mesh(armrestGeo, strutMat);
  armrest.position.set(0.42, -0.44, -0.42);
  armrest.rotation.set(-0.25, -0.24, 0);
  group.add(armrest);

  const armMfdGeo = new THREE.PlaneGeometry(0.16, 0.14);
  const armMfd = new THREE.Mesh(armMfdGeo, armMat);
  armMfd.position.set(0.38, -0.355, -0.43);
  armMfd.rotation.set(-0.92, -0.22, -0.16);
  group.add(armMfd);

  const stickPivot = new THREE.Group();
  stickPivot.position.set(0.48, -0.36, -0.36);

  const stickBaseGeo = new THREE.CylinderGeometry(0.038, 0.05, 0.04, 12);
  const stickBase = new THREE.Mesh(stickBaseGeo, darkMetalMat);
  const stickGripGeo = new THREE.CylinderGeometry(0.022, 0.026, 0.17, 10);
  const stickGrip = new THREE.Mesh(stickGripGeo, strutMat);
  stickGrip.position.y = 0.085;
  stickGrip.rotation.x = 0.16;

  const stickHeadGeo = new THREE.BoxGeometry(0.048, 0.042, 0.055);
  const stickHead = new THREE.Mesh(stickHeadGeo, darkMetalMat);
  stickHead.position.set(0, 0.165, 0.015);

  const fireBtnGeo = new THREE.SphereGeometry(0.009, 8, 8);
  const fireBtn = new THREE.Mesh(fireBtnGeo, redButtonMat);
  fireBtn.position.set(-0.012, 0.18, 0.042);

  stickPivot.add(stickBase, stickGrip, stickHead, fireBtn);
  group.add(stickPivot);

  // Subtle cockpit interior illumination
  const dashGlow = new THREE.PointLight('#38bdf8', 0.52, 1.9);
  dashGlow.position.set(0, -0.18, -0.45);
  const warmSideGlow = new THREE.PointLight('#fbbf24', 0.3, 1.8);
  warmSideGlow.position.set(0.35, -0.2, -0.3);
  group.add(dashGlow, warmSideGlow);

  disposables.push(
    strutGeo,
    ledGeo,
    browGeo,
    browPipGeo,
    hudGlassGeo,
    glareGeo,
    sideWingGeo,
    dashBodyGeo,
    sideMfdGeo,
    sideBezelGeo,
    centerMfdGeo,
    centerBezelGeo,
    armrestGeo,
    armMfdGeo,
    stickBaseGeo,
    stickGripGeo,
    stickHeadGeo,
    fireBtnGeo
  );

  return {
    group,
    updateStick(pitchInput: number, yawInput: number) {
      stickPivot.rotation.x = THREE.MathUtils.clamp(-pitchInput * 0.24, -0.28, 0.28);
      stickPivot.rotation.z = THREE.MathUtils.clamp(yawInput * 0.26, -0.32, 0.32);
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}
