import * as THREE from 'three';
import type { SpaceWeather } from '../types/game';

export interface WeatherShaderUniforms {
  uTime: number;
  uIntensity: number;
  uWeatherType: number; // 0 = clear, 1 = solar_flare, 2 = asteroid_squall, 3 = ion_storm
  uSpeed: number;
  uPrimaryColor: THREE.Color;
  uSecondaryColor: THREE.Color;
}

export interface WeatherShaderHandle {
  group: THREE.Group;
  update: (
    elapsed: number,
    dt: number,
    weather: SpaceWeather,
    anchorPos: THREE.Vector3,
    anchorRot: THREE.Euler,
    shipSpeed: number,
    isPlanetSurface: boolean,
    surfaceTintHex?: string
  ) => {
    intensity: number;
    radiationSievert: number;
    dustDensityPct: number;
  };
  dispose: () => void;
}

const WEATHER_TYPE_INDEX: Record<SpaceWeather, number> = {
  clear: 0,
  solar_flare: 1,
  asteroid_squall: 2,
  ion_storm: 3,
};

const _targetPrimary = new THREE.Color();
const _targetSecondary = new THREE.Color();

export function createDynamicWeatherShaderSystem(): WeatherShaderHandle {
  const group = new THREE.Group();

  // 1. Volumetric Hazard Field Tunnel (GLSL FBM Plasma / Radiation / Dust Curtain)
  const fieldGeo = new THREE.CylinderGeometry(36, 36, 150, 32, 1, true);
  fieldGeo.rotateX(Math.PI / 2);

  const fieldMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0.08 },
      uWeatherType: { value: 0 },
      uSpeed: { value: 1.0 },
      uPrimaryColor: { value: new THREE.Color('#38bdf8') },
      uSecondaryColor: { value: new THREE.Color('#818cf8') },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vLocalPos;
      void main() {
        vUv = uv;
        vLocalPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uIntensity;
      uniform float uWeatherType;
      uniform float uSpeed;
      uniform vec3 uPrimaryColor;
      uniform vec3 uSecondaryColor;
      varying vec2 vUv;
      varying vec3 vLocalPos;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 4; i++) {
          v += amp * noise(p);
          p *= 2.04;
          amp *= 0.5;
        }
        return v;
      }

      void main() {
        float zFade = smoothstep(-75.0, -18.0, vLocalPos.z) * (1.0 - smoothstep(18.0, 75.0, vLocalPos.z));
        float radialWrap = vUv.x * 6.28318;
        float flow = uTime * (0.45 + uSpeed * 0.035);

        vec2 p1 = vec2(sin(radialWrap) * 2.2 + cos(radialWrap) * 1.4, vUv.y * 5.0 - flow);
        float n1 = fbm(p1 + vec2(uTime * 0.12, 0.0));
        float n2 = fbm(p1 * 1.8 - vec2(0.0, flow * 1.4));

        // Ion storm arcs vs solar flare waves vs dust squall turbulence
        float ionArc = pow(max(0.0, 1.0 - abs(n1 - n2) * 5.2), 3.0);
        float solarRibbon = smoothstep(0.42, 0.85, n1 * 0.7 + n2 * 0.5);
        float dustCloud = smoothstep(0.32, 0.88, n1 * 0.6 + n2 * 0.45);

        float isSolar = 1.0 - abs(sign(uWeatherType - 1.0));
        float isDust = 1.0 - abs(sign(uWeatherType - 2.0));
        float isIon = 1.0 - abs(sign(uWeatherType - 3.0));

        float pattern = mix(n1 * 0.25, solarRibbon, isSolar);
        pattern = mix(pattern, dustCloud * 0.85, isDust);
        pattern = mix(pattern, max(solarRibbon * 0.5, ionArc * 1.4), isIon);

        vec3 col = mix(uPrimaryColor, uSecondaryColor, clamp(n2 * 1.2, 0.0, 1.0));
        float alpha = pattern * zFade * uIntensity * 0.16;
        if (alpha < 0.005) discard;
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
  });

  const fieldMesh = new THREE.Mesh(fieldGeo, fieldMat);
  fieldMesh.frustumCulled = false;
  group.add(fieldMesh);

  // 2. GPU-Simulated Hazard & Dust Particle Cloud (1,400 particles computed in vertex shader)
  const particleCount = 1400;
  const positions = new Float32Array(particleCount * 3);
  const seeds = new Float32Array(particleCount);
  const sizes = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 140;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 90;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 160;
    seeds[i] = Math.random();
    sizes[i] = 0.65 + Math.random() * 1.9;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  particleGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const particleMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0.15 },
      uWeatherType: { value: 0 },
      uSpeed: { value: 1.0 },
      uPrimaryColor: { value: new THREE.Color('#bae6fd') },
      uSecondaryColor: { value: new THREE.Color('#38bdf8') },
      uSurfaceMode: { value: 0.0 },
    },
    vertexShader: `
      attribute float aSeed;
      attribute float aSize;
      uniform float uTime;
      uniform float uIntensity;
      uniform float uWeatherType;
      uniform float uSpeed;
      uniform float uSurfaceMode;
      varying float vAlpha;
      varying float vSeed;

      void main() {
        vSeed = aSeed;
        vec3 pos = position;

        float swirlRate = 0.35 + uWeatherType * 0.25;
        float driftZ = mod(pos.z + uTime * (4.0 + uSpeed * 0.65 + uIntensity * 22.0) + 80.0, 160.0) - 80.0;
        float driftX = pos.x + sin(uTime * swirlRate + aSeed * 18.0) * (1.8 + uIntensity * 5.2);
        float driftY = pos.y + cos(uTime * swirlRate * 0.8 + aSeed * 14.0) * (1.4 + uIntensity * 3.8);

        if (uSurfaceMode > 0.5) {
          driftY = mod(pos.y * 0.35 + uTime * 0.6 + 18.0, 26.0) - 3.0;
        }

        vec4 mvPosition = modelViewMatrix * vec4(driftX, driftY, driftZ, 1.0);
        float dist = max(1.0, -mvPosition.z);
        gl_PointSize = clamp(aSize * (0.85 + uIntensity * 0.9) * (150.0 / dist), 1.0, 8.5);
        vAlpha = smoothstep(82.0, 48.0, abs(driftZ)) * (0.04 + uIntensity * 0.36);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uPrimaryColor;
      uniform vec3 uSecondaryColor;
      uniform float uWeatherType;
      varying float vAlpha;
      varying float vSeed;

      void main() {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        float r = dot(cxy, cxy);
        if (r > 1.0) discard;

        float core = exp(-r * 3.2);
        float spark = step(1.5, uWeatherType) * step(0.75, vSeed) * exp(-r * 6.5);
        vec3 col = mix(uPrimaryColor, uSecondaryColor, vSeed);
        gl_FragColor = vec4(col, (core * 0.75 + spark * 0.5) * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });

  const particlePoints = new THREE.Points(particleGeo, particleMat);
  particlePoints.frustumCulled = false;
  group.add(particlePoints);

  let smoothedIntensity = 0.12;
  let smoothedType = 0;

  return {
    group,
    update(
      elapsed,
      dt,
      weather,
      anchorPos,
      anchorRot,
      shipSpeed,
      isPlanetSurface,
      surfaceTintHex
    ) {
      group.position.copy(anchorPos);
      group.rotation.copy(anchorRot);

      let targetIntensity = 0.12;
      let targetRad = 0.14;
      let targetDust = 4;

      if (isPlanetSurface) {
        targetIntensity = 0.24;
        targetRad = 0.45;
        targetDust = 48;
        _targetPrimary.set(surfaceTintHex || '#fb923c');
        _targetSecondary.set('#fde68a');
        fieldMesh.visible = false;
      } else {
        fieldMesh.visible = weather !== 'clear';
        if (weather === 'solar_flare') {
          targetIntensity = 0.65;
          targetRad = 5.4 + Math.sin(elapsed * 2.3) * 0.45;
          targetDust = 26;
          _targetPrimary.set('#f97316');
          _targetSecondary.set('#fde047');
        } else if (weather === 'asteroid_squall') {
          targetIntensity = 0.58;
          targetRad = 0.65;
          targetDust = 82 + Math.sin(elapsed * 1.7) * 8;
          _targetPrimary.set('#cbd5e1');
          _targetSecondary.set('#d97706');
        } else if (weather === 'ion_storm') {
          targetIntensity = 0.62;
          targetRad = 3.8 + Math.cos(elapsed * 3.1) * 0.5;
          targetDust = 34;
          _targetPrimary.set('#22d3ee');
          _targetSecondary.set('#a855f7');
        } else {
          targetIntensity = 0.04;
          targetRad = 0.12 + Math.sin(elapsed * 0.8) * 0.02;
          targetDust = 4;
          _targetPrimary.set('#38bdf8');
          _targetSecondary.set('#818cf8');
        }
      }

      const alpha = 1 - Math.exp(-3.2 * dt);
      smoothedIntensity = THREE.MathUtils.lerp(smoothedIntensity, targetIntensity, alpha);
      smoothedType = THREE.MathUtils.lerp(smoothedType, WEATHER_TYPE_INDEX[weather], alpha);

      fieldMat.uniforms.uTime.value = elapsed;
      fieldMat.uniforms.uIntensity.value = smoothedIntensity;
      fieldMat.uniforms.uWeatherType.value = smoothedType;
      fieldMat.uniforms.uSpeed.value = shipSpeed;
      (fieldMat.uniforms.uPrimaryColor.value as THREE.Color).lerp(_targetPrimary, alpha);
      (fieldMat.uniforms.uSecondaryColor.value as THREE.Color).lerp(_targetSecondary, alpha);

      particleMat.uniforms.uTime.value = elapsed;
      particleMat.uniforms.uIntensity.value = smoothedIntensity;
      particleMat.uniforms.uWeatherType.value = smoothedType;
      particleMat.uniforms.uSpeed.value = shipSpeed;
      particleMat.uniforms.uSurfaceMode.value = isPlanetSurface ? 1.0 : 0.0;
      (particleMat.uniforms.uPrimaryColor.value as THREE.Color).lerp(_targetPrimary, alpha);
      (particleMat.uniforms.uSecondaryColor.value as THREE.Color).lerp(_targetSecondary, alpha);

      return {
        intensity: smoothedIntensity,
        radiationSievert: Number(targetRad.toFixed(2)),
        dustDensityPct: Math.round(targetDust),
      };
    },
    dispose() {
      fieldGeo.dispose();
      fieldMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    },
  };
}
