import * as THREE from 'three';
import type { CharacterConfig } from '../types/game';
import {
  createAfroCurlTextures,
  createArmorShellTextures,
  createDcmModuleTexture,
  createEvaSuitTextures,
  createEyeIrisTexture,
  createHairStrandTextures,
  createModelGraphicOverlayTexture,
  createRealisticFaceTextures,
  createSoftGlowTexture,
} from './proceduralTextures';

export interface AstronautRig {
  root: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  jetpackGlow: THREE.PointLight;
  updateAppearance: (char: CharacterConfig) => void;
  setWalkCycle: (
    speedRatio: number,
    jetpacking: boolean,
    time: number,
    ballisticJump?: boolean
  ) => void;
  dispose: () => void;
}

const _hsl = { h: 0, s: 0, l: 0 };
const _neutralArmor = new THREE.Color('#e3e7ed');

/**
 * Balances selected primary armor tint so hard-shell EVA plates remain realistic
 * and grounded under studio & planetary lighting (matching the off-white/slate aesthetic).
 */
function blendBalancedArmorColor(hex: string, target = new THREE.Color()): THREE.Color {
  target.set(hex || '#e2e6ec');
  target.getHSL(_hsl);
  const clampedS = Math.min(0.55, _hsl.s);
  const clampedL = THREE.MathUtils.clamp(_hsl.l, 0.32, 0.88);
  target.setHSL(_hsl.h, clampedS, clampedL);
  if (_hsl.s < 0.18) {
    target.lerp(_neutralArmor, 0.3);
  } else {
    target.lerp(_neutralArmor, 0.12);
  }
  return target;
}

function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const hw = w / 2;
  const hh = h / 2;
  const rad = Math.min(r, hw * 0.9, hh * 0.9);
  const s = new THREE.Shape();
  s.moveTo(-hw + rad, -hh);
  s.lineTo(hw - rad, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + rad);
  s.lineTo(hw, hh - rad);
  s.quadraticCurveTo(hw, hh, hw - rad, hh);
  s.lineTo(-hw + rad, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - rad);
  s.lineTo(-hw, -hh + rad);
  s.quadraticCurveTo(-hw, -hh, -hw + rad, -hh);
  return s;
}

function createOctagonBackpackShape(w: number, h: number): THREE.Shape {
  const hw = w / 2;
  const hh = h / 2;
  const s = new THREE.Shape();
  s.moveTo(-hw * 0.68, -hh);
  s.lineTo(hw * 0.68, -hh);
  s.lineTo(hw * 0.94, -hh * 0.62);
  s.lineTo(hw, hh * 0.56);
  s.lineTo(hw * 0.72, hh);
  s.lineTo(-hw * 0.72, hh);
  s.lineTo(-hw, hh * 0.56);
  s.lineTo(-hw * 0.94, -hh * 0.62);
  s.closePath();
  return s;
}

function buildEvaHelmet(
  armorMat: THREE.Material,
  trimMat: THREE.Material,
  darkMat: THREE.Material,
  visorMat: THREE.Material,
  neckRingMat: THREE.Material,
  isSoftwareGl: boolean,
  disposables: Array<{ dispose: () => void }>
): THREE.Group {
  const g = new THREE.Group();

  // Main contoured pressure helmet shell
  const shellGeo = new THREE.SphereGeometry(0.258, 26, 20);
  shellGeo.scale(0.96, 1.03, 1.06);
  const shell = new THREE.Mesh(shellGeo, armorMat);
  shell.castShadow = !isSoftwareGl;
  shell.receiveShadow = !isSoftwareGl;
  g.add(shell);

  // Sculpted upper brow & forehead sensor fairing
  const browFairingGeo = new THREE.SphereGeometry(
    0.268,
    24,
    14,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.36
  );
  browFairingGeo.scale(0.97, 0.92, 1.09);
  const browFairing = new THREE.Mesh(browFairingGeo, trimMat);
  browFairing.rotation.x = 0.14;
  browFairing.position.set(0, 0.032, 0.015);
  browFairing.castShadow = !isSoftwareGl;
  g.add(browFairing);

  // Forehead optical sensor housing & twin micro-headlamps
  const crestShape = createRoundedRectShape(0.11, 0.045, 0.015);
  const crestGeo = new THREE.ExtrudeGeometry(crestShape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
  });
  crestGeo.center();
  const crest = new THREE.Mesh(crestGeo, darkMat);
  crest.position.set(0, 0.175, 0.195);
  crest.rotation.x = -0.52;
  g.add(crest);

  // Side communications & camera ear pods blended into helmet curve
  const earCapGeo = new THREE.CylinderGeometry(0.062, 0.072, 0.04, 16);
  earCapGeo.rotateZ(Math.PI / 2);
  const earL = new THREE.Mesh(earCapGeo, trimMat);
  earL.position.set(-0.242, 0.01, -0.01);
  const earR = new THREE.Mesh(earCapGeo, trimMat);
  earR.position.set(0.242, 0.01, -0.01);
  g.add(earL, earR);

  // Rear recessed helmet vent module (visible from back view)
  const rearVentShape = createRoundedRectShape(0.15, 0.13, 0.03);
  const rearVentGeo = new THREE.ExtrudeGeometry(rearVentShape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  rearVentGeo.center();
  const rearVent = new THREE.Mesh(rearVentGeo, trimMat);
  rearVent.position.set(0, 0.02, -0.258);
  rearVent.rotation.x = 0.08;

  const rearGrillGeo = new THREE.BoxGeometry(0.09, 0.075, 0.015);
  const rearGrill = new THREE.Mesh(rearGrillGeo, darkMat);
  rearGrill.position.set(0, 0.02, -0.275);
  g.add(rearVent, rearGrill);

  // Sculpted lower chin guard lip under visor
  const chinGuardGeo = new THREE.TorusGeometry(0.185, 0.036, 10, 20, Math.PI * 0.76);
  chinGuardGeo.rotateX(Math.PI / 2 + 0.18);
  chinGuardGeo.rotateZ(-Math.PI * 0.38);
  const chinGuard = new THREE.Mesh(chinGuardGeo, armorMat);
  chinGuard.position.set(0, -0.105, 0.085);
  g.add(chinGuard);

  // Deep dark glossy smoked polycarbonate wide oval visor
  const visorGeo = new THREE.SphereGeometry(
    0.244,
    24,
    18,
    -Math.PI * 0.44,
    Math.PI * 0.88,
    Math.PI * 0.23,
    Math.PI * 0.50
  );
  visorGeo.scale(0.98, 1.0, 1.06);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 0.012, 0.068);
  g.add(visor);

  // Segmented neck-disconnect collar ring & pressure gasket
  const rimGeo = new THREE.TorusGeometry(0.205, 0.032, 12, 24);
  rimGeo.rotateX(Math.PI / 2);
  const rim = new THREE.Mesh(rimGeo, neckRingMat);
  rim.position.y = -0.185;
  g.add(rim);

  const gasketGeo = new THREE.TorusGeometry(0.218, 0.018, 10, 24);
  gasketGeo.rotateX(Math.PI / 2);
  const gasket = new THREE.Mesh(gasketGeo, darkMat);
  gasket.position.y = -0.21;
  g.add(gasket);

  disposables.push(
    shellGeo,
    browFairingGeo,
    crestGeo,
    earCapGeo,
    rearVentGeo,
    rearGrillGeo,
    chinGuardGeo,
    visorGeo,
    rimGeo,
    gasketGeo
  );
  return g;
}

export function buildAstronautGroup(
  char: CharacterConfig,
  isSoftwareGl: boolean,
  forceHelmet = false
): AstronautRig {
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const underSuitPbr = createEvaSuitTextures(4);
  const armorPbr = createArmorShellTextures(4);
  const hairPbr = createHairStrandTextures(4);
  const afroPbr = createAfroCurlTextures(4);
  const irisTex = createEyeIrisTexture();
  const dcmHudTex = createDcmModuleTexture();
  const patchOverlayTex = createModelGraphicOverlayTexture('EVA-04 // ISS');

  const blendedArmorColor = blendBalancedArmorColor(char.primaryColor);
  const trimArmorColor = blendedArmorColor.clone().multiplyScalar(0.84);
  const accentStripeColor = new THREE.Color('#64748b').lerp(blendedArmorColor, 0.28);

  // Hard-shell molded composite armor (white / off-white / tinted)
  const armorMat = new THREE.MeshStandardMaterial({
    color: blendedArmorColor,
    map: armorPbr.map,
    bumpMap: armorPbr.bumpMap,
    bumpScale: 0.018,
    roughnessMap: armorPbr.roughnessMap,
    metalness: 0.08,
    roughness: 0.54,
    envMapIntensity: 0.28,
  });

  // Secondary beveled armor trim (slightly darker panel contrast)
  const armorTrimMat = new THREE.MeshStandardMaterial({
    color: trimArmorColor,
    map: armorPbr.map,
    bumpMap: armorPbr.bumpMap,
    bumpScale: 0.016,
    roughnessMap: armorPbr.roughnessMap,
    metalness: 0.12,
    roughness: 0.62,
    envMapIntensity: 0.24,
  });

  // Soft ribbed charcoal-slate pressure under-suit
  const underSuitMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#444e5a'),
    map: underSuitPbr.map,
    bumpMap: underSuitPbr.bumpMap,
    bumpScale: 0.022,
    roughnessMap: underSuitPbr.roughnessMap,
    metalness: 0.04,
    roughness: 0.88,
    envMapIntensity: 0.14,
  });

  // Dark tactical joints, straps, soles, zipper track, mechanical vents
  const darkJointMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#232a33'),
    metalness: 0.16,
    roughness: 0.78,
    envMapIntensity: 0.16,
  });

  // Gunmetal latches, buckles, thruster nozzles, neck disconnect ring
  const metallicRingMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#7a8491'),
    metalness: 0.58,
    roughness: 0.42,
    envMapIntensity: 0.3,
  });

  // Brushed pearl-titanium for stud earrings, hair clip & precision buckles
  const pearlAccentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#cbd5e1'),
    metalness: 0.72,
    roughness: 0.24,
    envMapIntensity: 0.45,
  });

  const commsHudScreenMat = new THREE.MeshStandardMaterial({
    map: dcmHudTex,
    emissive: new THREE.Color('#38bdf8'),
    emissiveMap: dcmHudTex,
    emissiveIntensity: 0.42,
    roughness: 0.22,
    metalness: 0.12,
  });

  const commsLedMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#38bdf8'),
    emissive: new THREE.Color('#38bdf8'),
    emissiveIntensity: 0.95,
    roughness: 0.2,
  });

  const accentStripeMat = new THREE.MeshStandardMaterial({
    color: accentStripeColor,
    metalness: 0.1,
    roughness: 0.72,
    envMapIntensity: 0.16,
  });

  const visorColor = new THREE.Color(char.visorColor || '#0d1520').lerp(
    new THREE.Color('#091019'),
    0.55
  );
  const visorMat = new THREE.MeshPhysicalMaterial({
    color: visorColor,
    metalness: 0.22,
    roughness: 0.12,
    transparent: true,
    opacity: 0.84,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    envMapIntensity: 0.55,
    depthWrite: false,
  });

  const maleFacePbr = createRealisticFaceTextures('male', 4);
  const femaleFacePbr = createRealisticFaceTextures('female', 4);

  const skinMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#cfa084'),
    roughness: 0.62,
    metalness: 0.01,
    sheen: 0.28,
    sheenRoughness: 0.68,
    sheenColor: new THREE.Color('#e8a898'),
    envMapIntensity: 0.14,
  });

  const maleHeadMat = new THREE.MeshPhysicalMaterial({
    map: maleFacePbr.map,
    bumpMap: maleFacePbr.bumpMap,
    bumpScale: 0.008,
    roughnessMap: maleFacePbr.roughnessMap,
    roughness: 0.64,
    metalness: 0.01,
    sheen: 0.26,
    sheenRoughness: 0.7,
    sheenColor: new THREE.Color('#e8a898'),
    envMapIntensity: 0.14,
  });

  const femaleHeadMat = new THREE.MeshPhysicalMaterial({
    map: femaleFacePbr.map,
    bumpMap: femaleFacePbr.bumpMap,
    bumpScale: 0.006,
    roughnessMap: femaleFacePbr.roughnessMap,
    roughness: 0.56,
    metalness: 0.01,
    sheen: 0.34,
    sheenRoughness: 0.62,
    sheenColor: new THREE.Color('#f4b8aa'),
    envMapIntensity: 0.16,
  });

  const hairMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ffffff'),
    map: hairPbr.map,
    bumpMap: hairPbr.bumpMap,
    bumpScale: 0.01,
    roughnessMap: hairPbr.roughnessMap,
    roughness: 0.58,
    metalness: 0.04,
    sheen: 0.38,
    sheenRoughness: 0.44,
    sheenColor: new THREE.Color('#6b4d3e'),
    envMapIntensity: 0.22,
  });

  const afroMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ffffff'),
    map: afroPbr.map,
    bumpMap: afroPbr.bumpMap,
    bumpScale: 0.028,
    roughnessMap: afroPbr.roughnessMap,
    roughness: 0.88,
    metalness: 0.02,
    sheen: 0.22,
    sheenRoughness: 0.72,
    sheenColor: new THREE.Color('#4a372e'),
    envMapIntensity: 0.14,
  });

  const eyelashMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#16110f'),
    roughness: 0.68,
    metalness: 0.02,
  });

  const maleLipMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#a46a5d'),
    roughness: 0.55,
    metalness: 0.02,
    envMapIntensity: 0.14,
  });

  const femaleLipMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#b86464'),
    roughness: 0.38,
    metalness: 0.02,
    envMapIntensity: 0.2,
  });

  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#edf1f7'),
    roughness: 0.16,
    metalness: 0.02,
    envMapIntensity: 0.26,
  });
  const irisMat = new THREE.MeshStandardMaterial({
    map: irisTex,
    roughness: 0.18,
    metalness: 0.04,
    envMapIntensity: 0.32,
  });
  const pupilMat = new THREE.MeshBasicMaterial({ color: '#0c0e12' });
  const corneaMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ffffff'),
    transparent: true,
    opacity: 0.22,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    depthWrite: false,
  });

  const overlayDecalMat = new THREE.MeshBasicMaterial({
    map: patchOverlayTex,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });

  disposables.push(
    underSuitPbr.map,
    underSuitPbr.bumpMap,
    underSuitPbr.roughnessMap,
    armorPbr.map,
    armorPbr.bumpMap,
    armorPbr.roughnessMap,
    hairPbr.map,
    hairPbr.bumpMap,
    hairPbr.roughnessMap,
    afroPbr.map,
    afroPbr.bumpMap,
    afroPbr.roughnessMap,
    irisTex,
    dcmHudTex,
    maleFacePbr.map,
    maleFacePbr.bumpMap,
    maleFacePbr.roughnessMap,
    femaleFacePbr.map,
    femaleFacePbr.bumpMap,
    femaleFacePbr.roughnessMap,
    patchOverlayTex,
    armorMat,
    armorTrimMat,
    underSuitMat,
    darkJointMat,
    metallicRingMat,
    pearlAccentMat,
    commsHudScreenMat,
    commsLedMat,
    accentStripeMat,
    visorMat,
    skinMat,
    maleHeadMat,
    femaleHeadMat,
    hairMat,
    afroMat,
    eyelashMat,
    maleLipMat,
    femaleLipMat,
    eyeWhiteMat,
    irisMat,
    pupilMat,
    corneaMat,
    overlayDecalMat
  );

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  // Soft ground contact shadow
  const shadowTex = createSoftGlowTexture();
  const contactShadowGeo = new THREE.PlaneGeometry(1.15, 1.15);
  contactShadowGeo.rotateX(-Math.PI / 2);
  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    color: '#020617',
    transparent: true,
    opacity: 0.44,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
  contactShadow.position.y = 0.02;
  root.add(contactShadow);
  disposables.push(shadowTex, contactShadowGeo, contactShadowMat);

  // ==============================================================
  // 1. ORGANICALLY SCULPTED PRESSURE UNDER-SUIT TORSO & PELVIS (Lathe)
  // ==============================================================
  const torsoGroup = new THREE.Group();
  bodyPivot.add(torsoGroup);

  // Continuous anatomical ribcage -> waist -> hip curve (zero boxy seams)
  const torsoProfile = [
    new THREE.Vector2(0.001, 0.78),
    new THREE.Vector2(0.185, 0.80),
    new THREE.Vector2(0.228, 0.90),
    new THREE.Vector2(0.214, 1.03),
    new THREE.Vector2(0.224, 1.18),
    new THREE.Vector2(0.256, 1.36),
    new THREE.Vector2(0.262, 1.48),
    new THREE.Vector2(0.205, 1.57),
    new THREE.Vector2(0.155, 1.62),
    new THREE.Vector2(0.001, 1.63),
  ];
  const underTorsoGeo = new THREE.LatheGeometry(torsoProfile, 24);
  underTorsoGeo.scale(1.14, 1.0, 0.78);
  const underTorso = new THREE.Mesh(underTorsoGeo, underSuitMat);
  underTorso.castShadow = !isSoftwareGl;
  underTorso.receiveShadow = !isSoftwareGl;
  torsoGroup.add(underTorso);

  // Smooth rounded shoulder trapezius blend into neck seal
  const shoulderBlendGeo = new THREE.SphereGeometry(0.245, 20, 14);
  shoulderBlendGeo.scale(1.16, 0.44, 0.78);
  const shoulderBlend = new THREE.Mesh(shoulderBlendGeo, underSuitMat);
  shoulderBlend.position.set(0, 1.49, 0);
  torsoGroup.add(shoulderBlend);

  // Contoured hard-shell EVA Chest Vest / Cuirass (Beveled Extrude wrapping upper torso)
  const vestShape = createRoundedRectShape(0.42, 0.44, 0.11);
  const vestGeo = new THREE.ExtrudeGeometry(vestShape, {
    depth: 0.25,
    bevelEnabled: true,
    bevelThickness: 0.036,
    bevelSize: 0.032,
    bevelSegments: 4,
  });
  vestGeo.center();
  const chestVest = new THREE.Mesh(vestGeo, armorMat);
  chestVest.position.set(0, 1.29, 0.025);
  chestVest.scale.set(1.0, 1.0, 0.92);
  chestVest.castShadow = !isSoftwareGl;
  chestVest.receiveShadow = !isSoftwareGl;
  torsoGroup.add(chestVest);

  // Central vertical front zipper seam & storm flap (distinctive detail from reference)
  const zipperTrackGeo = new THREE.BoxGeometry(0.034, 0.47, 0.022);
  const zipperTrack = new THREE.Mesh(zipperTrackGeo, darkJointMat);
  zipperTrack.position.set(0, 1.28, 0.186);

  const zipperPullGeo = new THREE.BoxGeometry(0.016, 0.45, 0.012);
  const zipperPull = new THREE.Mesh(zipperPullGeo, metallicRingMat);
  zipperPull.position.set(0, 1.28, 0.195);
  torsoGroup.add(zipperTrack, zipperPull);

  // Twin contoured chest utility pouches (left & right chest, beveled ExtrudeGeometry)
  const pouchShape = createRoundedRectShape(0.115, 0.145, 0.028);
  const pouchGeo = new THREE.ExtrudeGeometry(pouchShape, {
    depth: 0.065,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.012,
    bevelSegments: 3,
  });
  pouchGeo.center();

  const pouchFlapShape = createRoundedRectShape(0.118, 0.045, 0.014);
  const pouchFlapGeo = new THREE.ExtrudeGeometry(pouchFlapShape, {
    depth: 0.072,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
  });
  pouchFlapGeo.center();

  [-1, 1].forEach((side) => {
    const pouch = new THREE.Mesh(pouchGeo, armorMat);
    pouch.position.set(side * 0.115, 1.19, 0.182);
    pouch.rotation.y = side * 0.22;
    pouch.castShadow = !isSoftwareGl;

    const flap = new THREE.Mesh(pouchFlapGeo, armorTrimMat);
    flap.position.set(side * 0.115, 1.245, 0.185);
    flap.rotation.y = side * 0.22;

    torsoGroup.add(pouch, flap);
  });

  // Contoured waist belt / pelvic harness bridging chest vest & thighs
  const waistBeltGeo = new THREE.TorusGeometry(0.222, 0.026, 10, 24);
  waistBeltGeo.rotateX(Math.PI / 2);
  waistBeltGeo.scale(1.14, 0.80, 1.0);
  const waistBelt = new THREE.Mesh(waistBeltGeo, darkJointMat);
  waistBelt.position.set(0, 1.03, 0.01);
  torsoGroup.add(waistBelt);

  // Segmented collar ring & corrugated shoulder umbilical tubes curving into back
  const neckSealGeo = new THREE.CylinderGeometry(0.155, 0.195, 0.11, 20);
  const neckSeal = new THREE.Mesh(neckSealGeo, darkJointMat);
  neckSeal.position.set(0, 1.60, 0);

  const collarRingGeo = new THREE.TorusGeometry(0.188, 0.026, 12, 24);
  collarRingGeo.rotateX(Math.PI / 2);
  const collarRing = new THREE.Mesh(collarRingGeo, armorTrimMat);
  collarRing.position.set(0, 1.57, 0.01);

  const collarTubeL = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, 1.44, 0.18),
    new THREE.Vector3(-0.18, 1.56, 0.08),
    new THREE.Vector3(-0.18, 1.54, -0.14),
    new THREE.Vector3(-0.14, 1.46, -0.22),
  ]);
  const collarTubeR = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.08, 1.44, 0.18),
    new THREE.Vector3(0.18, 1.56, 0.08),
    new THREE.Vector3(0.18, 1.54, -0.14),
    new THREE.Vector3(0.14, 1.46, -0.22),
  ]);
  const collarTubeGeoL = new THREE.TubeGeometry(collarTubeL, 16, 0.024, 10, false);
  const collarTubeGeoR = new THREE.TubeGeometry(collarTubeR, 16, 0.024, 10, false);

  torsoGroup.add(
    neckSeal,
    collarRing,
    new THREE.Mesh(collarTubeGeoL, armorTrimMat),
    new THREE.Mesh(collarTubeGeoR, armorTrimMat)
  );

  // Tailored Female Tactical Harness, Buckles, Telemetry Badge & Hip Utility Details
  const femaleSuitDetails = new THREE.Group();
  const harnessStrapCurveL = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.115, 1.50, 0.118),
    new THREE.Vector3(-0.154, 1.35, 0.182),
    new THREE.Vector3(-0.146, 1.15, 0.184),
    new THREE.Vector3(-0.152, 1.03, 0.138),
  ]);
  const harnessStrapCurveR = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.115, 1.50, 0.118),
    new THREE.Vector3(0.154, 1.35, 0.182),
    new THREE.Vector3(0.146, 1.15, 0.184),
    new THREE.Vector3(0.152, 1.03, 0.138),
  ]);
  const harnessStrapGeoL = new THREE.TubeGeometry(harnessStrapCurveL, 14, 0.012, 8, false);
  const harnessStrapGeoR = new THREE.TubeGeometry(harnessStrapCurveR, 14, 0.012, 8, false);
  const buckleRingGeo = new THREE.TorusGeometry(0.018, 0.0045, 8, 14);
  const chestBadgeGeo = new THREE.BoxGeometry(0.068, 0.036, 0.018);
  const chestLedGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.01, 10);
  chestLedGeo.rotateX(Math.PI / 2);
  const beltCarabinerGeo = new THREE.TorusGeometry(0.022, 0.005, 8, 14);
  const beltScannerGeo = new THREE.CylinderGeometry(0.024, 0.022, 0.088, 12);

  [-1, 1].forEach((side) => {
    const buckle = new THREE.Mesh(buckleRingGeo, pearlAccentMat);
    buckle.position.set(side * 0.153, 1.35, 0.189);
    buckle.rotation.y = side * 0.25;
    femaleSuitDetails.add(buckle);
  });

  const chestBadge = new THREE.Mesh(chestBadgeGeo, darkJointMat);
  chestBadge.position.set(0.092, 1.385, 0.184);
  chestBadge.rotation.y = 0.2;
  const chestLed = new THREE.Mesh(chestLedGeo, commsLedMat);
  chestLed.position.set(0.112, 1.385, 0.193);

  const beltCarabiner = new THREE.Mesh(beltCarabinerGeo, pearlAccentMat);
  beltCarabiner.position.set(0.245, 1.01, 0.06);
  beltCarabiner.rotation.y = Math.PI / 2;
  const beltScanner = new THREE.Mesh(beltScannerGeo, armorTrimMat);
  beltScanner.position.set(0.255, 0.945, 0.04);
  beltScanner.rotation.z = -0.08;

  femaleSuitDetails.add(
    new THREE.Mesh(harnessStrapGeoL, darkJointMat),
    new THREE.Mesh(harnessStrapGeoR, darkJointMat),
    chestBadge,
    chestLed,
    beltCarabiner,
    beltScanner
  );
  torsoGroup.add(femaleSuitDetails);

  // ==============================================================
  // 2. CONTOURED BEVELED PLSS BACKPACK + THRUSTERS (Matching Rear View)
  // ==============================================================
  const packGroup = new THREE.Group();

  const packShape = createOctagonBackpackShape(0.36, 0.50);
  const packGeo = new THREE.ExtrudeGeometry(packShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.038,
    bevelSize: 0.032,
    bevelSegments: 4,
  });
  packGeo.center();
  const packBody = new THREE.Mesh(packGeo, armorMat);
  packBody.position.set(0, 1.29, -0.22);
  packBody.castShadow = !isSoftwareGl;
  packBody.receiveShadow = !isSoftwareGl;

  // Curved upper neck shroud blending backpack smoothly behind collar
  const packShroudGeo = new THREE.CylinderGeometry(0.16, 0.21, 0.12, 16);
  packShroudGeo.scale(1.15, 1.0, 0.68);
  const packShroud = new THREE.Mesh(packShroudGeo, armorTrimMat);
  packShroud.position.set(0, 1.55, -0.19);

  // Recessed central spine vent slot & lower mechanical latch brackets (visible in rear ref)
  const spineSlotGeo = new THREE.BoxGeometry(0.038, 0.22, 0.025);
  const spineSlot = new THREE.Mesh(spineSlotGeo, darkJointMat);
  spineSlot.position.set(0, 1.38, -0.322);

  const latchBarGeo = new THREE.BoxGeometry(0.11, 0.026, 0.026);
  const latchTop = new THREE.Mesh(latchBarGeo, metallicRingMat);
  latchTop.position.set(0, 1.22, -0.322);
  const latchBot = new THREE.Mesh(latchBarGeo, metallicRingMat);
  latchBot.position.set(0, 1.15, -0.322);

  // Subtle EVA graphic decal
  const packDecalGeo = new THREE.PlaneGeometry(0.24, 0.12);
  const packDecal = new THREE.Mesh(packDecalGeo, overlayDecalMat);
  packDecal.position.set(0, 1.36, -0.33);
  packDecal.rotation.y = Math.PI;

  // Twin tapered thruster exhaust nozzles beneath lower backpack
  const nozzleProfile = [
    new THREE.Vector2(0.038, 0),
    new THREE.Vector2(0.044, 0.06),
    new THREE.Vector2(0.056, 0.13),
    new THREE.Vector2(0.045, 0.14),
  ];
  const nozzleGeo = new THREE.LatheGeometry(nozzleProfile, 14);
  nozzleGeo.rotateX(Math.PI);
  const nozL = new THREE.Mesh(nozzleGeo, darkJointMat);
  nozL.position.set(-0.11, 1.05, -0.22);
  nozL.rotation.x = 0.12;
  const nozR = new THREE.Mesh(nozzleGeo, darkJointMat);
  nozR.position.set(0.11, 1.05, -0.22);
  nozR.rotation.x = 0.12;

  const nozRingGeo = new THREE.TorusGeometry(0.048, 0.012, 8, 16);
  nozRingGeo.rotateX(Math.PI / 2);
  const nozRingL = new THREE.Mesh(nozRingGeo, metallicRingMat);
  nozRingL.position.set(-0.11, 0.99, -0.23);
  const nozRingR = new THREE.Mesh(nozRingGeo, metallicRingMat);
  nozRingR.position.set(0.11, 0.99, -0.23);

  packGroup.add(
    packBody,
    packShroud,
    spineSlot,
    latchTop,
    latchBot,
    packDecal,
    nozL,
    nozR,
    nozRingL,
    nozRingR
  );
  bodyPivot.add(packGroup);

  const jetpackGlow = new THREE.PointLight(new THREE.Color('#7dd3fc'), 0, 5.5);
  jetpackGlow.position.set(0, 0.85, -0.4);
  bodyPivot.add(jetpackGlow);

  // ==============================================================
  // 3. REALISTIC SCULPTED MALE & FEMALE HUMAN HEADS, FACES & HAIR
  // ==============================================================
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.81, 0);
  bodyPivot.add(headGroup);

  const neckGeo = new THREE.CylinderGeometry(0.068, 0.086, 0.13, 16);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.set(0, -0.155, -0.005);
  headGroup.add(neck);

  // Vertex-sculpted human cranium & facial bone structure (UV-aligned so u=0.5 faces +Z)
  const buildSculptedHeadGeo = (isFem: boolean) => {
    const geo = new THREE.SphereGeometry(0.158, 36, 28, -Math.PI * 0.5, Math.PI * 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let vx = pos.getX(i);
      let vy = pos.getY(i);
      let vz = pos.getZ(i);

      // Base cranium oval proportions
      vx *= isFem ? 0.86 : 0.90;
      vy *= isFem ? 1.05 : 1.08;
      vz *= isFem ? 0.96 : 0.98;

      if (vz > 0.02) {
        // Eye socket recesses
        const leftSock = Math.exp(-((vx + 0.048) ** 2 / 0.0009 + (vy - 0.022) ** 2 / 0.0005));
        const rightSock = Math.exp(-((vx - 0.048) ** 2 / 0.0009 + (vy - 0.022) ** 2 / 0.0005));
        vz -= (leftSock + rightSock) * 0.011;

        // Brow ridge
        const brow = Math.exp(-((vx * vx) / 0.006 + (vy - 0.056) ** 2 / 0.0004));
        vz += brow * (isFem ? 0.004 : 0.010);

        // Cheekbones
        const cheekL = Math.exp(-((vx + 0.072) ** 2 / 0.0012 + (vy + 0.012) ** 2 / 0.0009));
        const cheekR = Math.exp(-((vx - 0.072) ** 2 / 0.0012 + (vy + 0.012) ** 2 / 0.0009));
        vz += (cheekL + cheekR) * (isFem ? 0.011 : 0.008);
        vx += (cheekR - cheekL) * 0.006;

        // Chin & jawline contour
        if (vy < -0.02) {
          const lowerT = Math.min(1, (-vy - 0.02) / 0.13);
          const taper = isFem ? 1 - lowerT * 0.24 : 1 - lowerT * 0.12;
          vx *= taper;
          const chinProj = Math.exp(-((vx * vx) / 0.0018 + (vy + 0.115) ** 2 / 0.0012));
          vz += chinProj * (isFem ? 0.010 : 0.015);
          vy -= chinProj * 0.006;
        }
      }

      // Flatten slightly at back-of-neck base
      if (vy < -0.09 && vz < -0.02) {
        vz *= 0.86;
      }

      pos.setXYZ(i, vx, vy, vz);
    }
    geo.computeVertexNormals();
    return geo;
  };

  const maleFaceGeo = buildSculptedHeadGeo(false);
  const femaleFaceGeo = buildSculptedHeadGeo(true);
  const maleFaceMesh = new THREE.Mesh(maleFaceGeo, maleHeadMat);
  const femaleFaceMesh = new THREE.Mesh(femaleFaceGeo, femaleHeadMat);
  maleFaceMesh.castShadow = !isSoftwareGl;
  femaleFaceMesh.castShadow = !isSoftwareGl;
  headGroup.add(maleFaceMesh, femaleFaceMesh);

  // Sculpted 3D Nose (continuous nasal bridge + soft rounded tip + nostril wings)
  const noseBridgeProfile = [
    new THREE.Vector2(0.006, 0.042),
    new THREE.Vector2(0.012, 0.022),
    new THREE.Vector2(0.016, 0.0),
    new THREE.Vector2(0.018, -0.018),
    new THREE.Vector2(0.004, -0.026),
  ];
  const noseBridgeGeo = new THREE.LatheGeometry(noseBridgeProfile, 14);
  noseBridgeGeo.scale(0.85, 1.0, 1.35);
  const noseTipGeo = new THREE.SphereGeometry(0.016, 12, 10);
  noseTipGeo.scale(1.05, 0.85, 1.05);
  const nostrilGeo = new THREE.SphereGeometry(0.011, 10, 8);

  const noseGroup = new THREE.Group();
  noseGroup.position.set(0, -0.012, 0.145);
  const noseBridge = new THREE.Mesh(noseBridgeGeo, skinMat);
  noseBridge.rotation.x = -0.22;
  const noseTip = new THREE.Mesh(noseTipGeo, skinMat);
  noseTip.position.set(0, -0.016, 0.014);
  const nostrilL = new THREE.Mesh(nostrilGeo, skinMat);
  nostrilL.position.set(-0.013, -0.020, 0.004);
  const nostrilR = new THREE.Mesh(nostrilGeo, skinMat);
  nostrilR.position.set(0.013, -0.020, 0.004);
  noseGroup.add(noseBridge, noseTip, nostrilL, nostrilR);
  headGroup.add(noseGroup);

  // Realistic 3D Eyes (sclera + iris + pupil + glossy cornea + curved upper/lower eyelids)
  const eyeBallGeo = new THREE.SphereGeometry(0.0185, 14, 12);
  const irisGeo = new THREE.CircleGeometry(0.0098, 16);
  const pupilGeo = new THREE.CircleGeometry(0.0048, 14);
  const corneaGeo = new THREE.SphereGeometry(0.0192, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.45);
  corneaGeo.rotateX(Math.PI / 2);
  const eyelidArcGeo = new THREE.TorusGeometry(0.019, 0.0042, 8, 14, Math.PI * 0.92);

  [-0.048, 0.048].forEach((ex, idx) => {
    const eyeSocket = new THREE.Group();
    eyeSocket.position.set(ex, 0.022, 0.132);
    eyeSocket.rotation.y = idx === 0 ? -0.14 : 0.14;

    const eyeball = new THREE.Mesh(eyeBallGeo, eyeWhiteMat);
    const iris = new THREE.Mesh(irisGeo, irisMat);
    iris.position.set(0, 0, 0.0182);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(0, 0, 0.0186);
    const cornea = new THREE.Mesh(corneaGeo, corneaMat);

    const upperLid = new THREE.Mesh(eyelidArcGeo, skinMat);
    upperLid.position.set(0, 0.004, 0.005);
    upperLid.rotation.z = 0.04;
    const lowerLid = new THREE.Mesh(eyelidArcGeo, skinMat);
    lowerLid.position.set(0, -0.005, 0.004);
    lowerLid.rotation.z = Math.PI + 0.04;

    eyeSocket.add(eyeball, iris, pupil, cornea, upperLid, lowerLid);
    headGroup.add(eyeSocket);
  });

  // Sculpted 3D Lips (Cupid's bow upper lip + full lower lip)
  const upperLipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.028, -0.068, 0.134),
    new THREE.Vector3(-0.012, -0.062, 0.145),
    new THREE.Vector3(0.0, -0.064, 0.147),
    new THREE.Vector3(0.012, -0.062, 0.145),
    new THREE.Vector3(0.028, -0.068, 0.134),
  ]);
  const lowerLipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.025, -0.070, 0.134),
    new THREE.Vector3(-0.010, -0.075, 0.145),
    new THREE.Vector3(0.0, -0.076, 0.147),
    new THREE.Vector3(0.010, -0.075, 0.145),
    new THREE.Vector3(0.025, -0.070, 0.134),
  ]);
  const upperLipGeo = new THREE.TubeGeometry(upperLipCurve, 14, 0.0052, 8, false);
  const lowerLipGeo = new THREE.TubeGeometry(lowerLipCurve, 14, 0.0064, 8, false);
  const upperLipMesh = new THREE.Mesh(upperLipGeo, maleLipMat);
  const lowerLipMesh = new THREE.Mesh(lowerLipGeo, maleLipMat);
  headGroup.add(upperLipMesh, lowerLipMesh);

  // Sculpted 3D Ears on sides of head
  const earHelixGeo = new THREE.TorusGeometry(0.024, 0.007, 8, 14, Math.PI * 1.45);
  const earConchaGeo = new THREE.SphereGeometry(0.018, 10, 8);
  earConchaGeo.scale(0.45, 1.15, 0.8);
  [-1, 1].forEach((side) => {
    const ear = new THREE.Group();
    ear.position.set(side * 0.140, -0.005, -0.008);
    ear.rotation.y = side * (Math.PI / 2 - 0.18);
    const helix = new THREE.Mesh(earHelixGeo, skinMat);
    helix.rotation.z = -Math.PI * 0.22;
    const concha = new THREE.Mesh(earConchaGeo, skinMat);
    ear.add(helix, concha);
    headGroup.add(ear);
  });

  // --- MALE SCULPTED 3D AFRO HAIRSTYLE (Voluminous coiled crown + curl puffs + tapered sideburns) ---
  const maleHeadDetails = new THREE.Group();

  const afroCoreGeo = new THREE.SphereGeometry(1, 38, 28);
  const afroPos = afroCoreGeo.attributes.position;
  for (let i = 0; i < afroPos.count; i++) {
    const nx = afroPos.getX(i);
    const ny = afroPos.getY(i);
    const nz = afroPos.getZ(i);

    // Smoothly carve front face/brows/eyes clear while swelling into a full rounded afro halo
    const faceMask =
      THREE.MathUtils.smoothstep(nz, 0.20, 0.56) *
      (1 - THREE.MathUtils.smoothstep(ny, 0.08, 0.42));
    const napeTaper = 1 - THREE.MathUtils.smoothstep(-ny, 0.48, 0.92) * 0.24;
    const crownSwell = 1 + Math.max(0, ny) * 0.08;
    const baseRad = THREE.MathUtils.lerp(0.198 * crownSwell * napeTaper, 0.118, faceMask);
    const coilWave =
      Math.sin(nx * 34 + ny * 21) * Math.cos(nz * 32 - nx * 19) +
      0.5 * Math.sin(ny * 48 + nz * 38);
    const r = baseRad + coilWave * 0.009 * (1 - faceMask);

    afroPos.setXYZ(i, nx * r * 1.03, ny * r * 1.02 + 0.052, nz * r - 0.022);
  }
  afroCoreGeo.computeVertexNormals();
  const afroCore = new THREE.Mesh(afroCoreGeo, afroMat);
  afroCore.castShadow = !isSoftwareGl;
  afroCore.receiveShadow = !isSoftwareGl;
  maleHeadDetails.add(afroCore);

  // Outer Fibonacci curl puff tufts for authentic organic Afro silhouette
  const afroPuffGeo = new THREE.IcosahedronGeometry(0.028, 1);
  const puffPositions: Array<{ x: number; y: number; z: number; s: number; rx: number; ry: number }> = [];
  const totalCandidates = 135;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < totalCandidates; i++) {
    const ny = 1 - (i / (totalCandidates - 1)) * 2;
    const radXZ = Math.sqrt(Math.max(0, 1 - ny * ny));
    const theta = goldenAngle * i;
    const nx = Math.cos(theta) * radXZ;
    const nz = Math.sin(theta) * radXZ;

    // Skip face opening & bottom neck under-cut
    if (ny < -0.42) continue;
    if (nz > 0.24 && ny < 0.36) continue;
    // Also keep ear zone clean
    if (Math.abs(nx) > 0.78 && ny < 0.05 && nz > -0.25 && nz < 0.32) continue;

    const crownR = 0.194 * (1 + Math.max(0, ny) * 0.08);
    puffPositions.push({
      x: nx * crownR * 1.02,
      y: ny * crownR * 1.01 + 0.052,
      z: nz * crownR - 0.022,
      s: 0.78 + ((i * 37) % 10) * 0.042,
      rx: ((i * 19) % 10) * 0.3,
      ry: ((i * 23) % 10) * 0.3,
    });
  }
  const afroPuffs = new THREE.InstancedMesh(afroPuffGeo, afroMat, puffPositions.length);
  const puffDummy = new THREE.Object3D();
  puffPositions.forEach((p, idx) => {
    puffDummy.position.set(p.x, p.y, p.z);
    puffDummy.rotation.set(p.rx, p.ry, 0);
    puffDummy.scale.set(p.s * 1.08, p.s * 0.88, p.s * 1.08);
    puffDummy.updateMatrix();
    afroPuffs.setMatrixAt(idx, puffDummy.matrix);
  });
  afroPuffs.instanceMatrix.needsUpdate = true;
  afroPuffs.computeBoundingSphere();
  afroPuffs.frustumCulled = false;
  afroPuffs.castShadow = !isSoftwareGl;
  maleHeadDetails.add(afroPuffs);

  // Tapered afro sideburns blending down in front of ears toward facial stubble
  const sideburnCurveL = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.145, 0.058, 0.025),
    new THREE.Vector3(-0.138, 0.020, 0.036),
    new THREE.Vector3(-0.130, -0.024, 0.042),
  ]);
  const sideburnCurveR = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.145, 0.058, 0.025),
    new THREE.Vector3(0.138, 0.020, 0.036),
    new THREE.Vector3(0.130, -0.024, 0.042),
  ]);
  const sideburnGeoL = new THREE.TubeGeometry(sideburnCurveL, 10, 0.015, 7, false);
  const sideburnGeoR = new THREE.TubeGeometry(sideburnCurveR, 10, 0.015, 7, false);
  const sbMeshL = new THREE.Mesh(sideburnGeoL, afroMat);
  sbMeshL.scale.set(0.75, 1, 1);
  const sbMeshR = new THREE.Mesh(sideburnGeoR, afroMat);
  sbMeshR.scale.set(0.75, 1, 1);
  maleHeadDetails.add(sbMeshL, sbMeshR);

  headGroup.add(maleHeadDetails);

  // --- FEMALE SCULPTED CHIGNON / BUN HAIRSTYLE + HIGH-DETAIL ACCENTS ---
  const femaleHeadDetails = new THREE.Group();

  // Sleek pulled-back hair base hugging top & sides cleanly into the bun
  const femaleHairCapGeo = new THREE.SphereGeometry(
    0.163,
    28,
    20,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.54
  );
  femaleHairCapGeo.scale(0.89, 1.05, 1.00);
  const femaleHairCap = new THREE.Mesh(femaleHairCapGeo, hairMat);
  femaleHairCap.position.set(0, 0.018, -0.014);

  // Rear nape swept-up hair volume tapering toward bun base
  const femaleNapeHairGeo = new THREE.SphereGeometry(
    0.156,
    22,
    16,
    Math.PI * 0.56,
    Math.PI * 0.88,
    Math.PI * 0.32,
    Math.PI * 0.44
  );
  femaleNapeHairGeo.scale(0.86, 0.96, 0.96);
  const femaleNapeHair = new THREE.Mesh(femaleNapeHairGeo, hairMat);
  femaleNapeHair.position.set(0, -0.008, -0.022);
  femaleNapeHair.rotation.x = -0.14;
  femaleHeadDetails.add(femaleHairCap, femaleNapeHair);

  // Swept-back hair ridges pulling cleanly from hairline/temples into the bun
  const femalePulledCurves = [
    [
      new THREE.Vector3(-0.025, 0.142, 0.095),
      new THREE.Vector3(-0.045, 0.165, 0.01),
      new THREE.Vector3(-0.032, 0.145, -0.09),
      new THREE.Vector3(-0.012, 0.075, -0.152),
    ],
    [
      new THREE.Vector3(0.025, 0.142, 0.095),
      new THREE.Vector3(0.045, 0.165, 0.01),
      new THREE.Vector3(0.032, 0.145, -0.09),
      new THREE.Vector3(0.012, 0.075, -0.152),
    ],
    [
      new THREE.Vector3(-0.092, 0.105, 0.068),
      new THREE.Vector3(-0.128, 0.092, -0.02),
      new THREE.Vector3(-0.098, 0.076, -0.115),
      new THREE.Vector3(-0.026, 0.064, -0.156),
    ],
    [
      new THREE.Vector3(0.092, 0.105, 0.068),
      new THREE.Vector3(0.128, 0.092, -0.02),
      new THREE.Vector3(0.098, 0.076, -0.115),
      new THREE.Vector3(0.026, 0.064, -0.156),
    ],
    // Delicate temple face-framing wispy tendrils
    [
      new THREE.Vector3(-0.092, 0.096, 0.078),
      new THREE.Vector3(-0.112, 0.048, 0.088),
      new THREE.Vector3(-0.115, 0.005, 0.072),
    ],
    [
      new THREE.Vector3(0.092, 0.096, 0.078),
      new THREE.Vector3(0.112, 0.048, 0.088),
      new THREE.Vector3(0.115, 0.005, 0.072),
    ],
  ];
  const femaleStrandGeos: THREE.TubeGeometry[] = [];
  femalePulledCurves.forEach((pts, idx) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    const r = idx < 4 ? 0.016 : 0.0075;
    const tGeo = new THREE.TubeGeometry(curve, 16, r, 8, false);
    femaleStrandGeos.push(tGeo);
    const mesh = new THREE.Mesh(tGeo, hairMat);
    mesh.scale.set(1.0, 0.72, 0.94);
    femaleHeadDetails.add(mesh);
  });

  // Sculpted Twisted Hair Bun at upper-back crown
  const bunGroup = new THREE.Group();
  bunGroup.position.set(0, 0.068, -0.165);
  bunGroup.rotation.x = 0.28;

  const bunCoreGeo = new THREE.SphereGeometry(0.066, 22, 16);
  bunCoreGeo.scale(1.08, 1.0, 0.84);
  const bunCore = new THREE.Mesh(bunCoreGeo, hairMat);
  bunCore.position.set(0, 0, -0.022);
  bunCore.castShadow = !isSoftwareGl;

  const hairTieGeo = new THREE.TorusGeometry(0.052, 0.011, 10, 22);
  const hairTie = new THREE.Mesh(hairTieGeo, darkJointMat);
  hairTie.position.set(0, 0, 0.008);

  const hairBandTrimGeo = new THREE.TorusGeometry(0.054, 0.004, 8, 22);
  const hairBandTrim = new THREE.Mesh(hairBandTrimGeo, pearlAccentMat);
  hairBandTrim.position.set(0, 0, 0.003);

  // Spiraling twisted hair coils wrapped around bun dome
  const bunCoilGeos: THREE.TubeGeometry[] = [];
  for (let c = 0; c < 3; c++) {
    const phase = (c * Math.PI * 2) / 3;
    const coilPts: THREE.Vector3[] = [];
    for (let s = 0; s <= 14; s++) {
      const t = s / 14;
      const angle = phase + t * Math.PI * 2.15;
      const rad = 0.066 * (1 - t * 0.48);
      const zOff = -0.005 - t * 0.052;
      coilPts.push(new THREE.Vector3(Math.cos(angle) * rad, Math.sin(angle) * rad, zOff));
    }
    const coilCurve = new THREE.CatmullRomCurve3(coilPts);
    const coilGeo = new THREE.TubeGeometry(coilCurve, 20, 0.017, 8, false);
    bunCoilGeos.push(coilGeo);
    const coilMesh = new THREE.Mesh(coilGeo, hairMat);
    coilMesh.castShadow = !isSoftwareGl;
    bunGroup.add(coilMesh);
  }

  // Brushed titanium hairpin clip tucked smoothly at side of bun
  const hairpinGeo = new THREE.TorusGeometry(0.032, 0.0035, 6, 12, Math.PI * 0.65);
  const hairpin = new THREE.Mesh(hairpinGeo, pearlAccentMat);
  hairpin.position.set(0.044, 0.018, -0.016);
  hairpin.rotation.set(0.2, 0.85, -0.45);

  bunGroup.add(bunCore, hairTie, hairBandTrim, hairpin);
  femaleHeadDetails.add(bunGroup);

  // Delicate 3D curved upper eyelashes for expressive female eyes
  const lashArcCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.014, 0.002, 0.005),
    new THREE.Vector3(-0.004, 0.008, 0.015),
    new THREE.Vector3(0.007, 0.007, 0.014),
    new THREE.Vector3(0.016, 0.003, 0.006),
  ]);
  const femaleLashGeo = new THREE.TubeGeometry(lashArcCurve, 12, 0.0024, 6, false);
  [-0.048, 0.048].forEach((ex, idx) => {
    const lash = new THREE.Mesh(femaleLashGeo, eyelashMat);
    lash.position.set(ex, 0.028, 0.138);
    lash.rotation.y = idx === 0 ? -0.14 : 0.14;
    femaleHeadDetails.add(lash);
  });

  // Pearl-titanium stud earrings & slim commander micro-comms ear cuff
  const earringGeo = new THREE.SphereGeometry(0.0072, 10, 8);
  const commsCuffGeo = new THREE.TorusGeometry(0.025, 0.0045, 8, 14, Math.PI * 1.1);
  const commsBoomCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.148, -0.012, -0.004),
    new THREE.Vector3(-0.146, -0.044, 0.062),
    new THREE.Vector3(-0.102, -0.064, 0.122),
    new THREE.Vector3(-0.048, -0.070, 0.145),
  ]);
  const commsBoomGeo = new THREE.TubeGeometry(commsBoomCurve, 14, 0.0028, 6, false);
  const commsTipGeo = new THREE.SphereGeometry(0.0052, 8, 6);

  [-1, 1].forEach((side) => {
    const stud = new THREE.Mesh(earringGeo, pearlAccentMat);
    stud.position.set(side * 0.143, -0.027, -0.002);
    femaleHeadDetails.add(stud);
  });
  const commsCuff = new THREE.Mesh(commsCuffGeo, darkJointMat);
  commsCuff.position.set(-0.146, -0.003, -0.01);
  commsCuff.rotation.y = -Math.PI / 2 + 0.15;
  const commsBoom = new THREE.Mesh(commsBoomGeo, darkJointMat);
  const commsTip = new THREE.Mesh(commsTipGeo, commsLedMat);
  commsTip.position.set(-0.048, -0.070, 0.145);
  femaleHeadDetails.add(commsCuff, commsBoom, commsTip);

  headGroup.add(femaleHeadDetails);

  const wornHelmet = buildEvaHelmet(
    armorMat,
    armorTrimMat,
    darkJointMat,
    visorMat,
    metallicRingMat,
    isSoftwareGl,
    disposables
  );
  headGroup.add(wornHelmet);

  // ==============================================================
  // 4. BLENDED ARMS: PAULDRONS, RIBBED SLEEVES, VAMBRACES & GLOVES
  // ==============================================================
  const deltoidGeo = new THREE.SphereGeometry(0.112, 16, 14);
  deltoidGeo.scale(1.02, 1.12, 1.02);

  // Curved wrap-around hard-shell shoulder pauldron
  const pauldronGeo = new THREE.CylinderGeometry(
    0.118,
    0.128,
    0.20,
    18,
    1,
    false,
    -Math.PI * 0.45,
    Math.PI * 0.9
  );

  // Tapered organic upper arm under-suit
  const upperArmProfile = [
    new THREE.Vector2(0.072, -0.26),
    new THREE.Vector2(0.078, -0.18),
    new THREE.Vector2(0.088, -0.08),
    new THREE.Vector2(0.095, 0.0),
  ];
  const upperArmGeo = new THREE.LatheGeometry(upperArmProfile, 16);

  // Ribbed elbow accordion rings
  const bellowRingGeo = new THREE.TorusGeometry(0.076, 0.014, 8, 18);
  bellowRingGeo.rotateX(Math.PI / 2);

  // Tapered charcoal forearm + molded hard-shell vambrace gauntlet
  const forearmProfile = [
    new THREE.Vector2(0.058, -0.24),
    new THREE.Vector2(0.068, -0.14),
    new THREE.Vector2(0.076, -0.02),
    new THREE.Vector2(0.072, 0.02),
  ];
  const forearmGeo = new THREE.LatheGeometry(forearmProfile, 16);

  const vambraceGeo = new THREE.CylinderGeometry(
    0.081,
    0.069,
    0.18,
    16,
    1,
    false,
    -Math.PI * 0.55,
    Math.PI * 1.1
  );

  const wristCuffGeo = new THREE.TorusGeometry(0.064, 0.015, 10, 18);
  wristCuffGeo.rotateX(Math.PI / 2);

  // Sculpted glove: palm + finger cluster + angled thumb
  const palmShape = createRoundedRectShape(0.082, 0.095, 0.022);
  const palmGeo = new THREE.ExtrudeGeometry(palmShape, {
    depth: 0.042,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  palmGeo.center();

  const fingerBlockGeo = new THREE.CylinderGeometry(0.036, 0.03, 0.065, 10);
  fingerBlockGeo.scale(1.15, 1, 0.62);
  const thumbGeo = new THREE.CapsuleGeometry(0.014, 0.036, 4, 8);
  const sleeveDecalGeo = new THREE.PlaneGeometry(0.11, 0.065);

  const buildArm = (side: -1 | 1) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.33, 1.46, 0);

    const deltoid = new THREE.Mesh(deltoidGeo, underSuitMat);
    deltoid.castShadow = !isSoftwareGl;

    const pauldron = new THREE.Mesh(pauldronGeo, armorMat);
    pauldron.position.set(side * 0.018, -0.055, 0);
    pauldron.rotation.y = side * (Math.PI / 2);
    pauldron.rotation.z = side * -0.12;
    pauldron.castShadow = !isSoftwareGl;

    const uArm = new THREE.Mesh(upperArmGeo, underSuitMat);
    uArm.castShadow = !isSoftwareGl;

    const ring1 = new THREE.Mesh(bellowRingGeo, darkJointMat);
    ring1.position.set(0, -0.24, 0);
    const ring2 = new THREE.Mesh(bellowRingGeo, darkJointMat);
    ring2.position.set(0, -0.275, 0);
    const elbowPad = new THREE.Mesh(bellowRingGeo, armorTrimMat);
    elbowPad.position.set(0, -0.258, -0.008);
    elbowPad.scale.set(1.06, 1.06, 1.15);

    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(0, -0.26, 0);

    const fArm = new THREE.Mesh(forearmGeo, underSuitMat);
    fArm.position.set(0, -0.01, 0.01);
    fArm.rotation.x = -0.08;
    fArm.castShadow = !isSoftwareGl;

    const vambrace = new THREE.Mesh(vambraceGeo, armorMat);
    vambrace.position.set(side * 0.005, -0.125, 0.015);
    vambrace.rotation.y = side * (Math.PI / 2);
    vambrace.rotation.x = -0.08;
    vambrace.castShadow = !isSoftwareGl;

    const wristCuff = new THREE.Mesh(wristCuffGeo, metallicRingMat);
    wristCuff.position.set(0, -0.235, 0.025);

    const hand = new THREE.Group();
    hand.position.set(0, -0.29, 0.032);

    const palm = new THREE.Mesh(palmGeo, armorTrimMat);
    palm.rotation.y = Math.PI / 2;
    palm.castShadow = !isSoftwareGl;

    const fingers = new THREE.Mesh(fingerBlockGeo, darkJointMat);
    fingers.position.set(0, -0.055, 0.006);
    fingers.rotation.x = 0.22;

    const thumb = new THREE.Mesh(thumbGeo, darkJointMat);
    thumb.position.set(side * -0.018, -0.015, 0.042);
    thumb.rotation.set(0.45, 0, side * 0.35);

    hand.add(palm, fingers, thumb);

    const sleeveGraphic = new THREE.Mesh(sleeveDecalGeo, overlayDecalMat);
    sleeveGraphic.position.set(side * 0.088, -0.12, 0);
    sleeveGraphic.rotation.y = side * (Math.PI / 2);

    elbowPivot.add(fArm, vambrace, wristCuff, hand);
    arm.add(deltoid, pauldron, uArm, ring1, ring2, elbowPad, elbowPivot, sleeveGraphic);
    return { arm, elbowPivot, palm, fingers, thumb };
  };

  const { arm: leftArm, elbowPivot: leftElbow, palm: lPalm } = buildArm(-1);
  const { arm: rightArm, elbowPivot: rightElbow, palm: rPalm } = buildArm(1);

  // Female Tactical Forearm Biometric HUD / Mission Wrist Display on Left Vambrace
  const wristHudGroup = new THREE.Group();
  const wristHudCaseGeo = new THREE.BoxGeometry(0.022, 0.092, 0.062);
  const wristHudScreenGeo = new THREE.PlaneGeometry(0.052, 0.078);
  const wristHudCase = new THREE.Mesh(wristHudCaseGeo, darkJointMat);
  const wristHudScreen = new THREE.Mesh(wristHudScreenGeo, commsHudScreenMat);
  wristHudScreen.position.set(-0.012, 0, 0);
  wristHudScreen.rotation.y = -Math.PI / 2;
  wristHudGroup.add(wristHudCase, wristHudScreen);
  wristHudGroup.position.set(-0.082, -0.12, 0.014);
  wristHudGroup.rotation.x = -0.08;
  leftElbow.add(wristHudGroup);

  bodyPivot.add(leftArm);

  // Held EVA helmet under right arm when inside shuttle
  const heldHelmet = buildEvaHelmet(
    armorMat,
    armorTrimMat,
    darkJointMat,
    visorMat,
    metallicRingMat,
    isSoftwareGl,
    disposables
  );
  heldHelmet.scale.setScalar(0.84);
  heldHelmet.position.set(0.05, -0.17, 0.12);
  heldHelmet.rotation.set(0.25, -0.4, 0.25);
  rightElbow.add(heldHelmet);
  bodyPivot.add(rightArm);

  // ==============================================================
  // 5. BLENDED LEGS: THIGH PLATES, RIBBED KNEES, SHIN GREAVES, CANISTERS & BOOTS
  // ==============================================================
  const hipJoinGeo = new THREE.SphereGeometry(0.125, 16, 12);

  // Organic tapered charcoal pressure-suit thigh
  const thighProfile = [
    new THREE.Vector2(0.092, -0.34),
    new THREE.Vector2(0.104, -0.22),
    new THREE.Vector2(0.118, -0.08),
    new THREE.Vector2(0.122, 0.02),
  ];
  const thighGeo = new THREE.LatheGeometry(thighProfile, 18);

  // Molded white wrap-around thigh armor plate (outer & front face)
  const thighArmorGeo = new THREE.CylinderGeometry(
    0.124,
    0.106,
    0.25,
    18,
    1,
    false,
    -Math.PI * 0.52,
    Math.PI * 1.08
  );

  // Multi-ribbed knee bellows + curved armor knee cap
  const kneeRingGeo = new THREE.TorusGeometry(0.096, 0.016, 8, 18);
  kneeRingGeo.rotateX(Math.PI / 2);

  const kneeCapShape = createRoundedRectShape(0.12, 0.11, 0.042);
  const kneeCapGeo = new THREE.ExtrudeGeometry(kneeCapShape, {
    depth: 0.032,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.012,
    bevelSegments: 3,
  });
  kneeCapGeo.center();

  // Molded white shin greave shell wrapping lower leg
  const shinProfile = [
    new THREE.Vector2(0.082, -0.30),
    new THREE.Vector2(0.092, -0.18),
    new THREE.Vector2(0.098, -0.04),
    new THREE.Vector2(0.094, 0.02),
  ];
  const shinGeo = new THREE.LatheGeometry(shinProfile, 18);

  // Outer-calf tactical utility canister (distinctive silhouette detail from reference)
  const canisterShape = createRoundedRectShape(0.048, 0.16, 0.014);
  const canisterGeo = new THREE.ExtrudeGeometry(canisterShape, {
    depth: 0.036,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
  });
  canisterGeo.center();

  const calfStrapGeo = new THREE.TorusGeometry(0.092, 0.012, 8, 18);
  calfStrapGeo.rotateX(Math.PI / 2);

  // Realistic multi-part EVA Boot (ankle cuff + heel + ribbed tread sole + toe cap)
  const bootAnkleGeo = new THREE.CylinderGeometry(0.088, 0.096, 0.14, 16);
  const bootSoleShape = createRoundedRectShape(0.185, 0.28, 0.075);
  const bootSoleGeo = new THREE.ExtrudeGeometry(bootSoleShape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  bootSoleGeo.rotateX(Math.PI / 2);
  bootSoleGeo.center();

  const bootToeGeo = new THREE.SphereGeometry(0.09, 14, 12);
  bootToeGeo.scale(0.96, 0.64, 1.32);

  const buildLeg = (side: -1 | 1) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.142, 0.84, 0);

    const hip = new THREE.Mesh(hipJoinGeo, underSuitMat);
    const thigh = new THREE.Mesh(thighGeo, underSuitMat);
    thigh.castShadow = !isSoftwareGl;

    const thighArmor = new THREE.Mesh(thighArmorGeo, armorMat);
    thighArmor.position.set(side * 0.008, -0.175, 0.005);
    thighArmor.rotation.y = side * (Math.PI * 0.42);
    thighArmor.castShadow = !isSoftwareGl;

    const k1 = new THREE.Mesh(kneeRingGeo, darkJointMat);
    k1.position.set(0, -0.32, 0);
    const k2 = new THREE.Mesh(kneeRingGeo, darkJointMat);
    k2.position.set(0, -0.352, 0);
    const k3 = new THREE.Mesh(kneeRingGeo, darkJointMat);
    k3.position.set(0, -0.382, 0);

    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.35, 0);

    const kneeCap = new THREE.Mesh(kneeCapGeo, armorMat);
    kneeCap.position.set(0, 0.01, 0.096);
    kneeCap.castShadow = !isSoftwareGl;

    const shin = new THREE.Mesh(shinGeo, armorMat);
    shin.position.set(0, -0.02, 0);
    shin.castShadow = !isSoftwareGl;

    const strapUpper = new THREE.Mesh(calfStrapGeo, darkJointMat);
    strapUpper.position.set(0, -0.08, 0);
    const strapLower = new THREE.Mesh(calfStrapGeo, darkJointMat);
    strapLower.position.set(0, -0.22, 0);

    const canister = new THREE.Mesh(canisterGeo, armorTrimMat);
    canister.position.set(side * 0.098, -0.16, -0.01);
    canister.rotation.y = Math.PI / 2;
    canister.castShadow = !isSoftwareGl;

    const ankle = new THREE.Mesh(bootAnkleGeo, armorTrimMat);
    ankle.position.set(0, -0.34, 0);
    ankle.castShadow = !isSoftwareGl;

    const sole = new THREE.Mesh(bootSoleGeo, darkJointMat);
    sole.position.set(0, -0.45, 0.032);
    sole.castShadow = !isSoftwareGl;

    const toe = new THREE.Mesh(bootToeGeo, armorMat);
    toe.position.set(0, -0.405, 0.068);
    toe.castShadow = !isSoftwareGl;

    kneePivot.add(kneeCap, shin, strapUpper, strapLower, canister, ankle, sole, toe);
    leg.add(hip, thigh, thighArmor, k1, k2, k3, kneePivot);
    return { leg, kneePivot };
  };

  const { leg: leftLeg, kneePivot: leftKnee } = buildLeg(-1);
  const { leg: rightLeg, kneePivot: rightKnee } = buildLeg(1);
  bodyPivot.add(leftLeg, rightLeg);

  disposables.push(
    underTorsoGeo,
    shoulderBlendGeo,
    vestGeo,
    zipperTrackGeo,
    zipperPullGeo,
    pouchGeo,
    pouchFlapGeo,
    waistBeltGeo,
    neckSealGeo,
    collarRingGeo,
    collarTubeGeoL,
    collarTubeGeoR,
    packGeo,
    packShroudGeo,
    spineSlotGeo,
    latchBarGeo,
    packDecalGeo,
    nozzleGeo,
    nozRingGeo,
    neckGeo,
    maleFaceGeo,
    femaleFaceGeo,
    noseBridgeGeo,
    noseTipGeo,
    nostrilGeo,
    eyeBallGeo,
    irisGeo,
    pupilGeo,
    corneaGeo,
    eyelidArcGeo,
    upperLipGeo,
    lowerLipGeo,
    earHelixGeo,
    earConchaGeo,
    afroCoreGeo,
    afroPuffGeo,
    sideburnGeoL,
    sideburnGeoR,
    femaleHairCapGeo,
    femaleNapeHairGeo,
    ...femaleStrandGeos,
    bunCoreGeo,
    hairTieGeo,
    hairBandTrimGeo,
    ...bunCoilGeos,
    hairpinGeo,
    femaleLashGeo,
    earringGeo,
    commsCuffGeo,
    commsBoomGeo,
    commsTipGeo,
    harnessStrapGeoL,
    harnessStrapGeoR,
    buckleRingGeo,
    chestBadgeGeo,
    chestLedGeo,
    beltCarabinerGeo,
    beltScannerGeo,
    wristHudCaseGeo,
    wristHudScreenGeo,
    deltoidGeo,
    pauldronGeo,
    upperArmGeo,
    bellowRingGeo,
    forearmGeo,
    vambraceGeo,
    wristCuffGeo,
    palmGeo,
    fingerBlockGeo,
    thumbGeo,
    sleeveDecalGeo,
    hipJoinGeo,
    thighGeo,
    thighArmorGeo,
    kneeRingGeo,
    kneeCapGeo,
    shinGeo,
    canisterGeo,
    calfStrapGeo,
    bootAnkleGeo,
    bootSoleGeo,
    bootToeGeo
  );

  const applyCharacterState = (c: CharacterConfig) => {
    const showWorn = forceHelmet || c.helmetEquipped;
    wornHelmet.visible = showWorn;
    heldHelmet.visible = !showWorn;
    lPalm.material = showWorn ? armorTrimMat : skinMat;
    rPalm.material = showWorn ? armorTrimMat : skinMat;

    const isFemale = c.gender === 'female';
    maleFaceMesh.visible = !isFemale;
    femaleFaceMesh.visible = isFemale;
    maleHeadDetails.visible = !isFemale && !showWorn;
    femaleHeadDetails.visible = isFemale && !showWorn;
    femaleSuitDetails.visible = isFemale;
    wristHudGroup.visible = isFemale;

    skinMat.color.set(isFemale ? '#ddb399' : '#cfa084');
    upperLipMesh.material = isFemale ? femaleLipMat : maleLipMat;
    lowerLipMesh.material = isFemale ? femaleLipMat : maleLipMat;
    noseGroup.scale.setScalar(isFemale ? 0.88 : 1.0);
    upperLipMesh.scale.set(isFemale ? 0.96 : 1.0, 1, 1);
    lowerLipMesh.scale.set(isFemale ? 1.02 : 0.96, isFemale ? 1.08 : 1.0, 1);

    const modelScale =
      c.suitModel === 'Vanguard EVA' ? 1.03 : c.suitModel === 'Horizon Science' ? 0.97 : 1.0;
    const genderScaleX = isFemale ? 0.89 : 1.03;
    const genderScaleY = isFemale ? 0.985 : 1.0;
    const genderScaleZ = isFemale ? 0.91 : 1.02;
    torsoGroup.scale.set(
      modelScale * genderScaleX,
      genderScaleY,
      modelScale * genderScaleZ
    );

    const armX = isFemale ? 0.295 : 0.335;
    leftArm.position.x = -armX;
    rightArm.position.x = armX;
    leftLeg.position.x = isFemale ? -0.13 : -0.145;
    rightLeg.position.x = isFemale ? 0.13 : 0.145;

    const limbScale = isFemale ? 0.93 : 1.0;
    leftArm.scale.set(limbScale, 1, limbScale);
    rightArm.scale.set(limbScale, 1, limbScale);
    leftLeg.scale.set(limbScale, 1, limbScale);
    rightLeg.scale.set(limbScale, 1, limbScale);
  };
  applyCharacterState(char);

  return {
    root,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    jetpackGlow,
    updateAppearance(nextChar: CharacterConfig) {
      blendBalancedArmorColor(nextChar.primaryColor, armorMat.color);
      armorTrimMat.color.copy(armorMat.color).multiplyScalar(0.84);
      accentStripeMat.color.set('#64748b').lerp(armorMat.color, 0.28);

      visorMat.color
        .set(nextChar.visorColor || '#0d1520')
        .lerp(new THREE.Color('#091019'), 0.55);
      applyCharacterState(nextChar);
    },
    setWalkCycle(
      speedRatio: number,
      jetpacking: boolean,
      time: number,
      ballisticJump = false
    ) {
      if (jetpacking) {
        bodyPivot.rotation.x = ballisticJump ? 0.06 : 0.14 + Math.sin(time * 2.5) * 0.03;
        bodyPivot.position.y = ballisticJump ? 0 : Math.sin(time * 3.1) * 0.04;

        leftArm.rotation.x = -0.62 + Math.sin(time * 2.4) * 0.08;
        rightArm.rotation.x = -0.54 + Math.cos(time * 2.6) * 0.08;
        leftArm.rotation.z = -0.66 - Math.sin(time * 2.8) * 0.07;
        rightArm.rotation.z = 0.66 + Math.cos(time * 2.8) * 0.07;
        leftElbow.rotation.x = -0.44 - Math.sin(time * 3.0) * 0.08;
        rightElbow.rotation.x = -0.4 - Math.cos(time * 3.0) * 0.08;

        leftLeg.rotation.x = -0.14 + Math.sin(time * 2.4) * 0.06;
        rightLeg.rotation.x = -0.06 + Math.cos(time * 2.4) * 0.06;
        leftKnee.rotation.x = 0.62 + Math.sin(time * 3.2) * 0.08;
        rightKnee.rotation.x = 0.74 + Math.cos(time * 3.0) * 0.08;

        jetpackGlow.intensity = ballisticJump ? 0 : 2.2;
        contactShadow.scale.setScalar(0.65);
      } else if (speedRatio > 0.05) {
        bodyPivot.rotation.x = 0.03;
        bodyPivot.position.y = 0;
        const swing = Math.sin(time * 10.5) * 0.65 * Math.min(1, speedRatio);
        leftLeg.rotation.x = swing;
        rightLeg.rotation.x = -swing;
        leftKnee.rotation.x = Math.max(0, -swing * 0.45);
        rightKnee.rotation.x = Math.max(0, swing * 0.45);
        leftArm.rotation.x = -swing * 0.8;
        leftArm.rotation.z = -0.04;
        rightArm.rotation.x = heldHelmet.visible ? -0.18 + swing * 0.2 : swing * 0.8;
        rightArm.rotation.z = heldHelmet.visible ? 0.1 : 0.04;
        leftElbow.rotation.x = -0.1;
        rightElbow.rotation.x = heldHelmet.visible ? -0.2 : -0.1;
        jetpackGlow.intensity = 0;
        contactShadow.scale.setScalar(1);
      } else {
        bodyPivot.rotation.x = 0;
        bodyPivot.position.y = 0;
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
        leftKnee.rotation.x = 0;
        rightKnee.rotation.x = 0;
        leftArm.rotation.x = Math.sin(time * 1.6) * 0.04;
        leftArm.rotation.z = -0.04;
        rightArm.rotation.x = heldHelmet.visible ? -0.22 : -Math.sin(time * 1.6) * 0.04;
        rightArm.rotation.z = heldHelmet.visible ? 0.1 : 0.04;
        leftElbow.rotation.x = 0;
        rightElbow.rotation.x = heldHelmet.visible ? -0.18 : 0;
        jetpackGlow.intensity = 0;
        contactShadow.scale.setScalar(1);
      }
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}
