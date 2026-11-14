import * as THREE from 'three';
import type { Language, PlanetId } from '../types/game';
import { planetGroundHeightAt, type SurfaceObstacle } from './surfaceWorld';

export type CreatureAnatomy = 'mite' | 'strider' | 'ray' | 'drake' | 'jelly' | 'sentinel';

export interface PlanetCreatureSpec {
  speciesId: string;
  name: Record<Language, string>;
  anatomy: CreatureAnatomy;
  colorHex: string;
  accentHex: string;
  count: number;
  scale: number;
  speed: number;
  flyHeight: number;
}

export const PLANET_CREATURE_SPECS: Record<PlanetId, PlanetCreatureSpec> = {
  luna: {
    speciesId: 'lunar_mite',
    name: { ar: 'كائن القمر البلوري', en: 'Lunar Crystal Mite' },
    anatomy: 'mite',
    colorHex: '#94a3b8',
    accentHex: '#38bdf8',
    count: 6,
    scale: 1.0,
    speed: 4.1,
    flyHeight: 0,
  },
  mars: {
    speciesId: 'martian_strider',
    name: { ar: 'سائر المريخ المدرّع', en: 'Martian Dune Strider' },
    anatomy: 'strider',
    colorHex: '#b45309',
    accentHex: '#fbbf24',
    count: 6,
    scale: 1.2,
    speed: 4.8,
    flyHeight: 0,
  },
  aurora: {
    speciesId: 'aurora_ray',
    name: { ar: 'مُحلّق الشفق الأرضي', en: 'Earth Atmospheric Ray' },
    anatomy: 'ray',
    colorHex: '#0ea5e9',
    accentHex: '#34d399',
    count: 7,
    scale: 1.15,
    speed: 6.4,
    flyHeight: 2.3,
  },
  solaris: {
    speciesId: 'solar_drake',
    name: { ar: 'تنين الزهرة الحراري', en: 'Venusian Ember Drake' },
    anatomy: 'drake',
    colorHex: '#dc2626',
    accentHex: '#fde047',
    count: 6,
    scale: 1.28,
    speed: 6.0,
    flyHeight: 2.0,
  },
  aetheris: {
    speciesId: 'aether_jelly',
    name: { ar: 'قنديل محيط أوروبا المضيء', en: 'Europa Biolume Jelly' },
    anatomy: 'jelly',
    colorHex: '#0ea5e9',
    accentHex: '#fde047',
    count: 7,
    scale: 1.18,
    speed: 3.9,
    flyHeight: 1.9,
  },
  obsidian: {
    speciesId: 'obsidian_sentinel',
    name: { ar: 'حارس تيتان الميثاني', en: 'Titan Ring Sentinel' },
    anatomy: 'sentinel',
    colorHex: '#78350f',
    accentHex: '#fde68a',
    count: 6,
    scale: 1.25,
    speed: 4.6,
    flyHeight: 1.6,
  },
  mercury: {
    speciesId: 'mercury_crawler',
    name: { ar: 'كائن عطارد المعدني', en: 'Mercurian Iron Strider' },
    anatomy: 'mite',
    colorHex: '#78716c',
    accentHex: '#f59e0b',
    count: 6,
    scale: 1.05,
    speed: 4.5,
    flyHeight: 0,
  },
  uranus: {
    speciesId: 'uranus_glider',
    name: { ar: 'منزلق الميثان الأوراني', en: 'Uranian Cryo Glider' },
    anatomy: 'ray',
    colorHex: '#06b6d4',
    accentHex: '#a5f3fc',
    count: 6,
    scale: 1.2,
    speed: 5.5,
    flyHeight: 2.1,
  },
  neptune: {
    speciesId: 'neptune_jelly',
    name: { ar: 'قنديل تريتون القطبي', en: 'Triton Supersonic Jelly' },
    anatomy: 'jelly',
    colorHex: '#1d4ed8',
    accentHex: '#93c5fd',
    count: 7,
    scale: 1.22,
    speed: 4.2,
    flyHeight: 1.8,
  },
};

export interface CreatureEntity {
  id: string;
  spec: PlanetCreatureSpec;
  root: THREE.Group;
  body: THREE.Mesh;
  limbs: THREE.Object3D[];
  beacon: THREE.Mesh;
  accentMat: THREE.MeshStandardMaterial;
  beaconMat: THREE.MeshBasicMaterial;
  x: number;
  y: number;
  z: number;
  yaw: number;
  homeX: number;
  homeZ: number;
  targetX: number;
  targetZ: number;
  stateTimer: number;
  animPhase: number;
  scanned: boolean;
  behaviorState: 'roaming' | 'agitated' | 'attacking';
  aggroTimer: number;
  telegraphTimer: number;
  attackCooldown: number;
  lungeTimer: number;
}

function buildCreatureMesh(
  spec: PlanetCreatureSpec,
  isSoftwareGl: boolean,
  disposables: Array<{ dispose: () => void }>
): {
  root: THREE.Group;
  body: THREE.Mesh;
  limbs: THREE.Object3D[];
  beacon: THREE.Mesh;
  accentMat: THREE.MeshStandardMaterial;
  beaconMat: THREE.MeshBasicMaterial;
} {
  const root = new THREE.Group();
  const limbs: THREE.Object3D[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(spec.colorHex),
    roughness: 0.84,
    metalness: 0.06,
    envMapIntensity: 0.14,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(spec.accentHex),
    emissive: new THREE.Color(spec.accentHex),
    emissiveIntensity: 0.26,
    roughness: 0.72,
    metalness: 0.08,
    envMapIntensity: 0.14,
  });
  const beaconMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(spec.accentHex),
    transparent: true,
    opacity: 0.78,
  });

  const bodyGeo =
    spec.anatomy === 'jelly'
      ? new THREE.SphereGeometry(0.65, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.65)
      : spec.anatomy === 'sentinel'
        ? new THREE.OctahedronGeometry(0.68, 0)
        : new THREE.SphereGeometry(0.55, 14, 12);

  if (spec.anatomy === 'strider' || spec.anatomy === 'drake') {
    bodyGeo.scale(0.85, 0.75, 1.45);
  } else if (spec.anatomy === 'ray') {
    bodyGeo.scale(1.3, 0.32, 1.1);
  }

  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = spec.flyHeight > 0 ? 0 : 0.75;
  body.castShadow = !isSoftwareGl;
  root.add(body);

  // Glowing eyes / crest
  const eyeGeo = new THREE.SphereGeometry(0.09, 8, 8);
  [-0.2, 0.2].forEach((ex) => {
    const eye = new THREE.Mesh(eyeGeo, accentMat);
    eye.position.set(ex, body.position.y + 0.14, 0.46);
    root.add(eye);
  });

  // Anatomy limbs / wings / tentacles / orbital ring
  if (spec.anatomy === 'mite' || spec.anatomy === 'strider') {
    const legGeo = new THREE.CylinderGeometry(0.055, 0.035, 0.78, 8);
    const pairs = spec.anatomy === 'mite' ? 3 : 2;
    for (let p = 0; p < pairs; p++) {
      const zOff = (p - (pairs - 1) / 2) * 0.42;
      [-1, 1].forEach((side) => {
        const legPivot = new THREE.Group();
        legPivot.position.set(side * 0.42, 0.56, zOff);
        const leg = new THREE.Mesh(legGeo, accentMat);
        leg.position.set(side * 0.14, -0.28, 0);
        leg.rotation.z = side * -0.32;
        legPivot.add(leg);
        root.add(legPivot);
        limbs.push(legPivot);
      });
    }
    disposables.push(legGeo);
  } else if (spec.anatomy === 'ray' || spec.anatomy === 'drake') {
    const wingGeo = new THREE.BoxGeometry(1.15, 0.06, 0.62);
    [-1, 1].forEach((side) => {
      const wingPivot = new THREE.Group();
      wingPivot.position.set(side * 0.42, 0.05, 0);
      const wing = new THREE.Mesh(wingGeo, accentMat);
      wing.position.set(side * 0.56, 0, 0);
      wingPivot.add(wing);
      root.add(wingPivot);
      limbs.push(wingPivot);
    });
    disposables.push(wingGeo);
  } else if (spec.anatomy === 'jelly') {
    const tentGeo = new THREE.CylinderGeometry(0.04, 0.02, 0.95, 6);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const t = new THREE.Mesh(tentGeo, accentMat);
      t.position.set(Math.cos(a) * 0.28, -0.45, Math.sin(a) * 0.28);
      root.add(t);
      limbs.push(t);
    }
    disposables.push(tentGeo);
  } else {
    const ringGeo = new THREE.TorusGeometry(0.95, 0.06, 8, 24);
    const ring = new THREE.Mesh(ringGeo, accentMat);
    root.add(ring);
    limbs.push(ring);
    disposables.push(ringGeo);
  }

  const beaconGeo = new THREE.OctahedronGeometry(0.18, 0);
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = body.position.y + 1.1;
  root.add(beacon);

  root.scale.setScalar(spec.scale);
  disposables.push(bodyMat, accentMat, beaconMat, bodyGeo, eyeGeo, beaconGeo);

  return { root, body, limbs, beacon, accentMat, beaconMat };
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

export class SurfaceCreatureManager {
  readonly group = new THREE.Group();
  entities: CreatureEntity[] = [];
  private planetId: PlanetId = 'luna';
  private disposables: Array<{ dispose: () => void }> = [];

  spawnForPlanet(planetId: PlanetId, scannedIds: string[], isSoftwareGl: boolean) {
    this.clear();
    this.planetId = planetId;
    const spec = PLANET_CREATURE_SPECS[planetId];

    for (let i = 0; i < spec.count; i++) {
      const angle = (i / spec.count) * Math.PI * 2 + 0.5;
      const dist = 22 + ((i * 15) % 44);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const gy = planetGroundHeightAt(planetId, x, z);
      const id = `${planetId}_${spec.speciesId}_${i}`;
      const scanned = scannedIds.includes(id);

      const built = buildCreatureMesh(spec, isSoftwareGl, this.disposables);
      built.root.position.set(x, gy + spec.flyHeight, z);
      built.beacon.visible = !scanned;
      this.group.add(built.root);

      this.entities.push({
        id,
        spec,
        root: built.root,
        body: built.body,
        limbs: built.limbs,
        beacon: built.beacon,
        accentMat: built.accentMat,
        beaconMat: built.beaconMat,
        x,
        y: gy + spec.flyHeight,
        z,
        yaw: angle + Math.PI,
        homeX: x,
        homeZ: z,
        targetX: x + Math.cos(angle + 1.1) * 10,
        targetZ: z + Math.sin(angle + 1.1) * 10,
        stateTimer: 2 + i * 1.1,
        animPhase: i * 1.6,
        scanned,
        behaviorState: 'roaming',
        aggroTimer: 0,
        telegraphTimer: 0,
        attackCooldown: 0,
        lungeTimer: 0,
      });
    }
  }

  markScanned(id: string) {
    const found = this.entities.find((e) => e.id === id);
    if (found) {
      found.scanned = true;
      if (found.behaviorState === 'roaming') {
        found.beacon.visible = false;
      }
    }
  }

  findNearestUnscanned(x: number, z: number, maxDist: number): CreatureEntity | null {
    let best: CreatureEntity | null = null;
    let bestD = maxDist;
    for (const c of this.entities) {
      if (c.scanned) continue;
      const d = Math.hypot(c.x - x, c.z - z);
      if (d <= bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  disturbNear(x: number, z: number, maxDist: number, onDisturbed?: (c: CreatureEntity) => void) {
    for (const c of this.entities) {
      const d = Math.hypot(c.x - x, c.z - z);
      if (d <= maxDist) {
        const wasRoaming = c.behaviorState === 'roaming';
        c.behaviorState = 'attacking';
        c.aggroTimer = 8.0;
        c.telegraphTimer = 0;
        if (wasRoaming) onDisturbed?.(c);
      }
    }
  }

  getNearestHostileDistance(playerX: number, playerZ: number): number | null {
    let best: number | null = null;
    for (const c of this.entities) {
      if (c.behaviorState !== 'roaming') {
        const d = Math.hypot(c.x - playerX, c.z - playerZ);
        if (best === null || d < best) best = d;
      }
    }
    return best;
  }

  update(
    dt: number,
    elapsed: number,
    playerX: number,
    playerZ: number,
    disturbanceLevel: number,
    inRover: boolean,
    obstacles: SurfaceObstacle[] = [],
    callbacks?: {
      onDisturbed?: (c: CreatureEntity) => void;
      onAttack?: (c: CreatureEntity) => void;
    }
  ) {
    const playerOnSafePad = Math.hypot(playerX, playerZ) <= 10.2;
    const disturbRadius = disturbanceLevel >= 2 ? 12.0 : disturbanceLevel === 1 ? 8.2 : 4.2;

    for (const c of this.entities) {
      c.stateTimer -= dt;
      if (c.attackCooldown > 0) c.attackCooldown -= dt;
      if (c.lungeTimer > 0) c.lungeTimer -= dt;

      const dxP = playerX - c.x;
      const dzP = playerZ - c.z;
      const distP = Math.hypot(dxP, dzP);

      // Disturbance detection: getting too close, bumping, sprinting/jetpacking/rover nearby
      if (!playerOnSafePad && distP < disturbRadius) {
        if (c.behaviorState === 'roaming') {
          c.behaviorState = distP < 3.4 ? 'attacking' : 'agitated';
          c.aggroTimer = 8.0;
          c.telegraphTimer = distP < 3.4 ? 0 : 0.65;
          callbacks?.onDisturbed?.(c);
        } else {
          c.aggroTimer = Math.max(c.aggroTimer, 6.5);
        }
      }

      if (c.behaviorState !== 'roaming') {
        c.aggroTimer -= dt;
        if (playerOnSafePad || distP > 32 || c.aggroTimer <= 0) {
          c.behaviorState = 'roaming';
          c.targetX = c.homeX;
          c.targetZ = c.homeZ;
          c.accentMat.color.set(c.spec.accentHex);
          c.accentMat.emissive.set(c.spec.accentHex);
          c.accentMat.emissiveIntensity = 0.26;
          c.beaconMat.color.set(c.spec.accentHex);
          c.beacon.visible = !c.scanned;
          c.beacon.scale.setScalar(1);
        } else {
          if (c.behaviorState === 'agitated') {
            c.telegraphTimer -= dt;
            if (c.telegraphTimer <= 0) c.behaviorState = 'attacking';
          }
          c.targetX = playerX;
          c.targetZ = playerZ;
          c.accentMat.color.set('#ef4444');
          c.accentMat.emissive.set('#dc2626');
          c.accentMat.emissiveIntensity = 0.85 + Math.sin(elapsed * 14) * 0.35;
          c.beaconMat.color.set('#ef4444');
          c.beacon.visible = true;
          c.beacon.scale.setScalar(1.45);
        }
      }

      let speed = c.spec.speed;
      if (c.behaviorState === 'agitated') {
        speed = c.spec.speed * 0.35;
        c.yaw = lerpAngle(c.yaw, Math.atan2(dxP, dzP), 1 - Math.exp(-10 * dt));
      } else if (c.behaviorState === 'attacking') {
        speed = c.spec.speed * 1.48;
        const strikeRange = inRover ? 3.2 : 2.35;
        if (distP <= strikeRange && c.attackCooldown <= 0) {
          c.attackCooldown = 1.65;
          c.lungeTimer = 0.3;
          callbacks?.onAttack?.(c);
        }
      } else {
        const toTarget = Math.hypot(c.targetX - c.x, c.targetZ - c.z);
        if (toTarget < 2 || c.stateTimer <= 0) {
          const rnd = Math.random() * Math.PI * 2;
          const r = 8 + Math.random() * 14;
          c.targetX = THREE.MathUtils.clamp(c.homeX + Math.cos(rnd) * r, -96, 96);
          c.targetZ = THREE.MathUtils.clamp(c.homeZ + Math.sin(rnd) * r, -96, 96);
          c.stateTimer = 3.2 + Math.random() * 2.5;
        }
      }

      const tx = c.targetX - c.x;
      const tz = c.targetZ - c.z;
      const td = Math.hypot(tx, tz);
      if (td > 0.45 && c.behaviorState !== 'agitated') {
        const vx = (tx / td) * speed;
        const vz = (tz / td) * speed;
        c.x += vx * dt;
        c.z += vz * dt;
        c.yaw = lerpAngle(c.yaw, Math.atan2(vx, vz), 1 - Math.exp(-6 * dt));
      }

      // Soft collision with large surface boulders & structures so aliens navigate around rocks
      const alienRadius = 0.85 * c.spec.scale;
      for (const obs of obstacles) {
        if (obs.radius < 0.7) continue;
        const odx = c.x - obs.x;
        const odz = c.z - obs.z;
        const minD = obs.radius + alienRadius;
        const dSq = odx * odx + odz * odz;
        if (dSq < minD * minD) {
          const d = Math.sqrt(dSq);
          if (d > 0.001) {
            const push = minD / d;
            c.x = obs.x + odx * push;
            c.z = obs.z + odz * push;
          } else {
            c.x = obs.x + minD;
          }
        }
      }

      // Keep clear of landing pad (safe zone around spacecraft r < 11)
      const rOrigin = Math.hypot(c.x, c.z);
      if (rOrigin < 11.0) {
        const push = 11.0 / Math.max(0.1, rOrigin);
        c.x *= push;
        c.z *= push;
      }

      const gy = planetGroundHeightAt(this.planetId, c.x, c.z);
      const bob =
        c.spec.flyHeight > 0
          ? Math.sin(elapsed * (c.behaviorState === 'attacking' ? 4.4 : 2.4) + c.animPhase) * 0.35
          : 0;
      const lungeLift = c.lungeTimer > 0 ? Math.sin((c.lungeTimer / 0.3) * Math.PI) * 0.55 : 0;
      c.y = gy + c.spec.flyHeight + bob + lungeLift;
      c.root.position.set(c.x, c.y, c.z);
      c.root.rotation.y = c.yaw;

      const animSpeed = c.behaviorState === 'attacking' ? 9.5 : 5.2;
      c.animPhase += dt * animSpeed;
      if (c.spec.anatomy === 'mite' || c.spec.anatomy === 'strider') {
        c.limbs.forEach((limb, idx) => {
          const sign = idx % 2 === 0 ? 1 : -1;
          limb.rotation.x = Math.sin(c.animPhase + idx * 0.8) * 0.45 * sign;
        });
      } else if (c.spec.anatomy === 'ray' || c.spec.anatomy === 'drake') {
        c.limbs.forEach((wing, idx) => {
          const side = idx === 0 ? -1 : 1;
          wing.rotation.z = Math.sin(c.animPhase * 0.9) * 0.42 * side;
        });
      } else if (c.spec.anatomy === 'jelly') {
        const pulse = 1 + Math.sin(c.animPhase * 0.8) * 0.12;
        c.body.scale.set(pulse, 1 / pulse, pulse);
      } else if (c.limbs[0]) {
        c.limbs[0].rotation.z += dt * (c.behaviorState === 'attacking' ? 3.8 : 1.8);
        c.limbs[0].rotation.x += dt * 0.9;
      }

      if (c.beacon.visible) {
        c.beacon.rotation.y = elapsed * (c.behaviorState === 'roaming' ? 2.2 : 5.5);
      }
    }
  }

  clear() {
    for (const c of this.entities) {
      this.group.remove(c.root);
    }
    this.entities = [];
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
