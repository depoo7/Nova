import type { SceneEnv } from '../types/game';

interface AmbientSynthNodes {
  subOsc: OscillatorNode;
  fifthOsc: OscillatorNode;
  lfoOsc: OscillatorNode;
  lfoGain: GainNode;
  noiseSrc: AudioBufferSourceNode;
  noiseGain: GainNode;
  filter: BiquadFilterNode;
  masterGain: GainNode;
}

interface RoverSynthNodes {
  motorOsc: OscillatorNode;
  whineOsc: OscillatorNode;
  treadSrc: AudioBufferSourceNode;
  treadGain: GainNode;
  filter: BiquadFilterNode;
  masterGain: GainNode;
}

class SpaceAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private ambientHumEnabled = true;
  private roverAudioEnabled = true;
  private speechEnabled = true;
  private masterVolume = 0.85;

  private ambientNodes: AmbientSynthNodes | null = null;
  private ambientEnv: SceneEnv = 'builder';
  private ambientActive = false;

  private roverNodes: RoverSynthNodes | null = null;
  private roverActive = false;
  private roverSpeedAbs = 0;
  private roverSteerAbs = 0;

  private o2Active = false;
  private o2Level = 100;
  private o2LastTankCount = 5;
  private o2BeepTimer: number | null = null;
  private o2BreathTimer: number | null = null;

  private createNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      // Gentle brown/pink-ish smoothed noise for hull/tread rumble
      lastOut = (lastOut + 0.045 * white) / 1.045;
      data[i] = Math.max(-1, Math.min(1, lastOut * 2.8));
    }
    return buffer;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.ambientActive && this.ambientHumEnabled) {
      this.ensureAmbientNodes(ctx);
      this.syncAmbientParams();
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (!muted && this.ambientActive && this.ambientHumEnabled) {
      const ctx = this.ensureContext();
      if (ctx) this.ensureAmbientNodes(ctx);
    }
    this.syncAmbientParams();
    this.syncRoverParams();
    this.syncO2Timers();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setAmbientHumEnabled(enabled: boolean) {
    this.ambientHumEnabled = enabled;
    if (enabled && !this.muted && this.ambientActive) {
      const ctx = this.ensureContext();
      if (ctx) this.ensureAmbientNodes(ctx);
    }
    this.syncAmbientParams();
  }

  public isAmbientHumEnabled(): boolean {
    return this.ambientHumEnabled;
  }

  public setRoverAudioEnabled(enabled: boolean) {
    this.roverAudioEnabled = enabled;
    if (enabled && !this.muted && this.roverActive) {
      const ctx = this.ensureContext();
      if (ctx) this.ensureRoverNodes(ctx);
    }
    this.syncRoverParams();
  }

  public isRoverAudioEnabled(): boolean {
    return this.roverAudioEnabled;
  }

  public setSpeechEnabled(enabled: boolean) {
    this.speechEnabled = enabled;
    if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public isSpeechEnabled(): boolean {
    return this.speechEnabled;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.syncAmbientParams();
    this.syncRoverParams();
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  private ensureAmbientNodes(ctx: AudioContext): AmbientSynthNodes {
    if (this.ambientNodes) return this.ambientNodes;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 210;
    filter.Q.value = 0.8;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;

    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = 54;

    const fifthOsc = ctx.createOscillator();
    fifthOsc.type = 'triangle';
    fifthOsc.frequency.value = 81;

    const fifthGain = ctx.createGain();
    fifthGain.gain.value = 0.28;

    const lfoOsc = ctx.createOscillator();
    lfoOsc.type = 'sine';
    lfoOsc.frequency.value = 0.14;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 42;

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = this.createNoiseBuffer(ctx, 3);
    noiseSrc.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 185;
    noiseFilter.Q.value = 0.7;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.22;

    lfoOsc.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    subOsc.connect(filter);
    fifthOsc.connect(fifthGain);
    fifthGain.connect(filter);

    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(filter);

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    subOsc.start();
    fifthOsc.start();
    lfoOsc.start();
    noiseSrc.start();

    this.ambientNodes = {
      subOsc,
      fifthOsc,
      lfoOsc,
      lfoGain,
      noiseSrc,
      noiseGain,
      filter,
      masterGain,
    };
    return this.ambientNodes;
  }

  private syncAmbientParams() {
    if (!this.ctx || !this.ambientNodes) return;
    const now = this.ctx.currentTime;
    const nodes = this.ambientNodes;

    if (this.muted || !this.ambientHumEnabled || !this.ambientActive) {
      nodes.masterGain.gain.setTargetAtTime(0, now, 0.22);
      return;
    }

    let baseFreq = 54;
    let cutoff = 210;
    let targetGain = 0.026;
    let noiseLevel = 0.2;

    if (this.ambientEnv === 'interior') {
      baseFreq = 58;
      cutoff = 235;
      targetGain = 0.032;
      noiseLevel = 0.26;
    } else if (this.ambientEnv === 'spaceflight') {
      baseFreq = 48;
      cutoff = 175;
      targetGain = 0.028;
      noiseLevel = 0.16;
    } else if (this.ambientEnv === 'planet') {
      baseFreq = 62;
      cutoff = 290;
      targetGain = 0.024;
      noiseLevel = 0.34;
    } else if (this.ambientEnv === 'mission-viz') {
      baseFreq = 52;
      cutoff = 190;
      targetGain = 0.016;
      noiseLevel = 0.12;
    }

    nodes.subOsc.frequency.setTargetAtTime(baseFreq, now, 0.35);
    nodes.fifthOsc.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.35);
    nodes.filter.frequency.setTargetAtTime(cutoff, now, 0.35);
    nodes.noiseGain.gain.setTargetAtTime(noiseLevel, now, 0.35);
    nodes.masterGain.gain.setTargetAtTime(targetGain * this.masterVolume, now, 0.35);
  }

  public updateAmbientState(env: SceneEnv, active: boolean) {
    const changed = this.ambientEnv !== env || this.ambientActive !== active;
    this.ambientEnv = env;
    this.ambientActive = active;

    if (!this.muted && this.ambientHumEnabled && active) {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        this.ensureAmbientNodes(this.ctx);
      }
    }
    if (changed || !active) {
      this.syncAmbientParams();
    }
  }

  private ensureRoverNodes(ctx: AudioContext): RoverSynthNodes {
    if (this.roverNodes) return this.roverNodes;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 280;
    filter.Q.value = 1.1;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;

    const motorOsc = ctx.createOscillator();
    motorOsc.type = 'sawtooth';
    motorOsc.frequency.value = 64;

    const motorGain = ctx.createGain();
    motorGain.gain.value = 0.35;

    const whineOsc = ctx.createOscillator();
    whineOsc.type = 'triangle';
    whineOsc.frequency.value = 132;

    const whineGain = ctx.createGain();
    whineGain.gain.value = 0.25;

    const treadSrc = ctx.createBufferSource();
    treadSrc.buffer = this.createNoiseBuffer(ctx, 2);
    treadSrc.loop = true;

    const treadFilter = ctx.createBiquadFilter();
    treadFilter.type = 'lowpass';
    treadFilter.frequency.value = 140;

    const treadGain = ctx.createGain();
    treadGain.gain.value = 0.45;

    motorOsc.connect(motorGain);
    motorGain.connect(filter);

    whineOsc.connect(whineGain);
    whineGain.connect(filter);

    treadSrc.connect(treadFilter);
    treadFilter.connect(treadGain);
    treadGain.connect(filter);

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    motorOsc.start();
    whineOsc.start();
    treadSrc.start();

    this.roverNodes = {
      motorOsc,
      whineOsc,
      treadSrc,
      treadGain,
      filter,
      masterGain,
    };
    return this.roverNodes;
  }

  private syncRoverParams() {
    if (!this.ctx || !this.roverNodes) return;
    const now = this.ctx.currentTime;
    const nodes = this.roverNodes;

    if (this.muted || !this.roverAudioEnabled || !this.roverActive) {
      nodes.masterGain.gain.setTargetAtTime(0, now, 0.08);
      return;
    }

    const speedNorm = Math.min(1, this.roverSpeedAbs / 24);
    const steerNorm = Math.min(1, this.roverSteerAbs);

    const motorFreq = 58 + speedNorm * 115 + steerNorm * 12;
    const whineFreq = 128 + speedNorm * 220 + steerNorm * 26;
    const cutoff = 220 + speedNorm * 420;
    const treadLevel = 0.12 + speedNorm * 0.65;
    const targetGain = 0.006 + speedNorm * 0.036 + steerNorm * 0.004;

    nodes.motorOsc.frequency.setTargetAtTime(motorFreq, now, 0.06);
    nodes.whineOsc.frequency.setTargetAtTime(whineFreq, now, 0.06);
    nodes.filter.frequency.setTargetAtTime(cutoff, now, 0.08);
    nodes.treadGain.gain.setTargetAtTime(treadLevel, now, 0.08);
    nodes.masterGain.gain.setTargetAtTime(targetGain * this.masterVolume, now, 0.08);
  }

  public updateRoverDrive(speedAbs: number, steerAbs: number, active: boolean) {
    this.roverSpeedAbs = speedAbs;
    this.roverSteerAbs = steerAbs;
    this.roverActive = active;

    if (active && !this.muted && this.roverAudioEnabled) {
      const ctx = this.ensureContext();
      if (ctx) this.ensureRoverNodes(ctx);
    }
    this.syncRoverParams();
  }

  public playRoverLatch(entering: boolean) {
    if (this.muted || !this.roverAudioEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const v = this.masterVolume;
    const clunkOsc = ctx.createOscillator();
    const clunkGain = ctx.createGain();
    clunkOsc.type = 'triangle';
    clunkOsc.frequency.setValueAtTime(entering ? 135 : 175, now);
    clunkOsc.frequency.exponentialRampToValueAtTime(entering ? 58 : 72, now + 0.14);
    clunkGain.gain.setValueAtTime(0.09 * v, now);
    clunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    clunkOsc.connect(clunkGain);
    clunkGain.connect(ctx.destination);
    clunkOsc.start(now);
    clunkOsc.stop(now + 0.17);

    const servoOsc = ctx.createOscillator();
    const servoGain = ctx.createGain();
    servoOsc.type = 'sawtooth';
    servoOsc.frequency.setValueAtTime(entering ? 210 : 340, now + 0.06);
    servoOsc.frequency.exponentialRampToValueAtTime(entering ? 380 : 180, now + 0.22);
    servoGain.gain.setValueAtTime(0.032 * v, now + 0.06);
    servoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    servoOsc.connect(servoGain);
    servoGain.connect(ctx.destination);
    servoOsc.start(now + 0.06);
    servoOsc.stop(now + 0.25);
  }

  public playLaser() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.exponentialRampToValueAtTime(135, now + 0.16);
    gain.gain.setValueAtTime(0.09 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playBoost() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(290, now + 0.3);
    gain.gain.setValueAtTime(0.08 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.34);
  }

  public playRingPass() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.075 * this.masterVolume, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.25);
    });
  }

  public playExplosion() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(128, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.24);
    gain.gain.setValueAtTime(0.11 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playPlanetFanfare() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const chord = [392, 493.88, 587.33, 783.99];
    chord.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.08);
      gain.gain.setValueAtTime(0.075 * this.masterVolume, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.68);
    });
  }

  public playSkyChirp() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.085);
    gain.gain.setValueAtTime(0.045 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playWeatherAlert(kind: 'calm' | 'storm') {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = kind === 'storm' ? [330, 277.18, 220] : [392, 523.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = kind === 'storm' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.05 * this.masterVolume, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.24);
    });
  }

  /**
   * ALL voice narration/speech is strictly English (en-US/en-GB),
   * even when the UI writing/subtitles are displayed in Arabic.
   */
  public speakSky(englishText: string) {
    if (this.muted || !this.speechEnabled) return;
    this.playSkyChirp();
    if (!englishText.trim()) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(englishText);
      utter.lang = 'en-US';
      utter.rate = 1.04;
      utter.pitch = 1.04;
      utter.volume = Math.min(1, 0.82 * this.masterVolume);
      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices.filter((v) =>
        v.lang.toLowerCase().startsWith('en')
      );
      const preferred =
        englishVoices.find((v) =>
          /natural|neural|google us|samantha|aria|jenny|daniel/i.test(v.name)
        ) ||
        englishVoices.find((v) => v.lang.toLowerCase().includes('en-us')) ||
        englishVoices[0];

      if (preferred) utter.voice = preferred;
      window.speechSynthesis.speak(utter);
    } catch {
      // Ignore if speech synthesis is unavailable
    }
  }

  public updateOxygenAlarm(o2Level: number, active: boolean) {
    const clamped = Math.max(0, Math.min(100, o2Level));
    const prevTankCount = this.o2LastTankCount;
    const newTankCount = clamped <= 0 ? 0 : Math.ceil(clamped / 20);

    if (active && !this.muted && clamped > 0 && newTankCount < prevTankCount) {
      this.playTankDepletedTone(newTankCount);
    }

    this.o2Level = clamped;
    this.o2Active = active;
    this.o2LastTankCount = newTankCount;
    this.syncO2Timers();
  }

  private clearO2Timers() {
    if (this.o2BeepTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.o2BeepTimer);
      this.o2BeepTimer = null;
    }
    if (this.o2BreathTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.o2BreathTimer);
      this.o2BreathTimer = null;
    }
  }

  private syncO2Timers() {
    if (typeof window === 'undefined') return;

    const shouldBeep =
      this.o2Active && !this.muted && this.o2Level > 0 && this.o2Level <= 80;
    const shouldBreathe =
      this.o2Active && !this.muted && this.o2Level > 0 && this.o2Level <= 20;

    if (!shouldBeep && this.o2BeepTimer !== null) {
      window.clearTimeout(this.o2BeepTimer);
      this.o2BeepTimer = null;
    } else if (shouldBeep && this.o2BeepTimer === null) {
      this.scheduleNextO2Beep(120);
    }

    if (!shouldBreathe && this.o2BreathTimer !== null) {
      window.clearTimeout(this.o2BreathTimer);
      this.o2BreathTimer = null;
    } else if (shouldBreathe && this.o2BreathTimer === null) {
      this.scheduleNextBreath(180);
    }
  }

  private getO2BeepIntervalMs(o2: number): number {
    if (o2 > 60) {
      // 1st tank depleted -> slow beep (2.35s -> 1.95s)
      const t = (80 - o2) / 20;
      return 2350 - t * 400;
    }
    if (o2 > 40) {
      // 2nd tank depleted -> slow-medium (1.60s -> 1.25s)
      const t = (60 - o2) / 20;
      return 1600 - t * 350;
    }
    if (o2 > 20) {
      // 3rd tank depleted -> medium (1.00s -> 0.76s)
      const t = (40 - o2) / 20;
      return 1000 - t * 240;
    }
    // Last tank (0..20%) -> rapidly escalates from fast to really hard (580ms -> 190ms)
    const t = Math.max(0, Math.min(1, (20 - o2) / 20));
    return 580 - t * 390;
  }

  private scheduleNextO2Beep(delayMs?: number) {
    if (typeof window === 'undefined') return;
    if (!this.o2Active || this.muted || this.o2Level <= 0 || this.o2Level > 80) {
      this.o2BeepTimer = null;
      return;
    }
    const wait = delayMs ?? this.getO2BeepIntervalMs(this.o2Level);
    this.o2BeepTimer = window.setTimeout(() => {
      this.o2BeepTimer = null;
      if (!this.o2Active || this.muted || this.o2Level <= 0 || this.o2Level > 80) {
        return;
      }
      this.playO2WarningBeep(this.o2Level);
      this.scheduleNextO2Beep();
    }, wait);
  }

  private scheduleNextBreath(delayMs?: number) {
    if (typeof window === 'undefined') return;
    if (!this.o2Active || this.muted || this.o2Level <= 0 || this.o2Level > 20) {
      this.o2BreathTimer = null;
      return;
    }
    const t = Math.max(0, Math.min(1, (20 - this.o2Level) / 20));
    const cycleMs = 1950 - t * 380;
    const wait = delayMs ?? cycleMs;
    this.o2BreathTimer = window.setTimeout(() => {
      this.o2BreathTimer = null;
      if (!this.o2Active || this.muted || this.o2Level <= 0 || this.o2Level > 20) {
        return;
      }
      this.playHeavyBreathCycle(this.o2Level);
      this.scheduleNextBreath();
    }, wait);
  }

  private playTankDepletedTone(remainingTanks: number) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const baseFreq = remainingTanks <= 1 ? 920 : 660;
    [baseFreq, baseFreq * 0.78].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = remainingTanks <= 1 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);
      gain.gain.setValueAtTime(0.085 * this.masterVolume, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.15);
    });
  }

  private playO2WarningBeep(o2: number) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const v = this.masterVolume;

    let freq = 760;
    let gainAmp = 0.055;
    let duration = 0.085;
    let pulses = 1;
    let oscType: OscillatorType = 'sine';

    if (o2 <= 20) {
      const urgency = Math.max(0, Math.min(1, (20 - o2) / 20));
      freq = 1120 + urgency * 320;
      gainAmp = 0.09 + urgency * 0.055;
      duration = 0.065;
      pulses = urgency > 0.45 ? 2 : 1;
      oscType = 'square';
    } else if (o2 <= 40) {
      const t = (40 - o2) / 20;
      freq = 960 + t * 110;
      gainAmp = 0.075 + t * 0.015;
      duration = 0.075;
      pulses = 2;
      oscType = 'triangle';
    } else if (o2 <= 60) {
      const t = (60 - o2) / 20;
      freq = 840 + t * 90;
      gainAmp = 0.065;
      duration = 0.08;
      oscType = 'triangle';
    }

    for (let i = 0; i < pulses; i++) {
      const start = now + i * 0.082;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(gainAmp * v, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.01);
    }
  }

  private playHeavyBreathCycle(o2: number) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const v = this.masterVolume;
    const urgency = Math.max(0, Math.min(1, (20 - o2) / 20));
    const amp = (0.095 + urgency * 0.06) * v;

    // Synthesize helmet-muffled heavy inhale + strained exhale from smoothed noise
    const breathBuffer = this.createNoiseBuffer(ctx, 1.8);

    // 1. Heavy Inhale
    const inhaleSrc = ctx.createBufferSource();
    inhaleSrc.buffer = breathBuffer;
    const inhaleFilter = ctx.createBiquadFilter();
    inhaleFilter.type = 'bandpass';
    inhaleFilter.Q.value = 2.1;
    inhaleFilter.frequency.setValueAtTime(340, now);
    inhaleFilter.frequency.exponentialRampToValueAtTime(640 + urgency * 120, now + 0.52);

    const inhaleGain = ctx.createGain();
    inhaleGain.gain.setValueAtTime(0.001, now);
    inhaleGain.gain.linearRampToValueAtTime(amp, now + 0.16);
    inhaleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.62);

    inhaleSrc.connect(inhaleFilter);
    inhaleFilter.connect(inhaleGain);
    inhaleGain.connect(ctx.destination);
    inhaleSrc.start(now);
    inhaleSrc.stop(now + 0.65);

    // 2. Heavy Strained Exhale
    const exhaleStart = now + 0.72;
    const exhaleSrc = ctx.createBufferSource();
    exhaleSrc.buffer = breathBuffer;
    const exhaleFilter = ctx.createBiquadFilter();
    exhaleFilter.type = 'bandpass';
    exhaleFilter.Q.value = 1.65;
    exhaleFilter.frequency.setValueAtTime(520 + urgency * 90, exhaleStart);
    exhaleFilter.frequency.exponentialRampToValueAtTime(220, exhaleStart + 0.72);

    const exhaleGain = ctx.createGain();
    exhaleGain.gain.setValueAtTime(0.001, exhaleStart);
    exhaleGain.gain.linearRampToValueAtTime(amp * 1.15, exhaleStart + 0.14);
    exhaleGain.gain.exponentialRampToValueAtTime(0.001, exhaleStart + 0.78);

    exhaleSrc.connect(exhaleFilter);
    exhaleFilter.connect(exhaleGain);
    exhaleGain.connect(ctx.destination);
    exhaleSrc.start(exhaleStart);
    exhaleSrc.stop(exhaleStart + 0.82);
  }
}

export const spaceAudio = new SpaceAudioEngine();
