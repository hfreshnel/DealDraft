// Generates the film soundtrack from the same timeline as the picture: node scripts/synth-audio.ts
// Pure DSP, no dependency: 120 BPM groove in A minor plus sound design, rendered to a 48 kHz stereo WAV.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
    BAR,
    BEAT,
    BRAND,
    CHECK,
    COMPUTE,
    DECIDE,
    END,
    FPS,
    mulberry32,
    NOISE,
    NOISE_BUBBLES,
    PASTE,
    PROOF,
    READ,
    REPORT,
    SCENES,
    TOTAL_FRAMES,
    type SceneKey,
} from "../src/timeline.ts";

const SR = 48000;
const DURATION = TOTAL_FRAMES / FPS;
const LENGTH = Math.round(DURATION * SR);
const TAU = Math.PI * 2;
const random = mulberry32(90210);

type Bus = { left: Float32Array; right: Float32Array };

function makeBus(): Bus {
    return { left: new Float32Array(LENGTH), right: new Float32Array(LENGTH) };
}

const drums = makeBus();
const music = makeBus();
const fx = makeBus();
const send = makeBus();
const kickTimes: number[] = [];

function sec(scene: SceneKey, localFrame: number): number {
    return (SCENES[scene].from + localFrame) / FPS;
}

function barTime(bar: number): number {
    return (bar * BAR) / FPS;
}

const BEAT_SEC = BEAT / FPS;

function write(bus: Bus, index: number, value: number, pan: number, reverb = 0): void {
    if (index < 0 || index >= LENGTH) {
        return;
    }
    const angle = ((pan + 1) * Math.PI) / 4;
    const left = value * Math.cos(angle);
    const right = value * Math.sin(angle);
    bus.left[index] += left;
    bus.right[index] += right;
    if (reverb > 0) {
        send.left[index] += left * reverb;
        send.right[index] += right * reverb;
    }
}

function noise(): number {
    return random() * 2 - 1;
}

// RBJ biquad, coefficients can be updated while running for sweeps.
function biquad() {
    let b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    const set = (type: "lowpass" | "highpass" | "bandpass", frequency: number, q: number) => {
        const w = (TAU * Math.min(frequency, SR * 0.45)) / SR;
        const cos = Math.cos(w);
        const alpha = Math.sin(w) / (2 * q);
        const a0 = 1 + alpha;
        if (type === "lowpass") {
            b0 = (1 - cos) / 2 / a0; b1 = (1 - cos) / a0; b2 = b0;
        } else if (type === "highpass") {
            b0 = (1 + cos) / 2 / a0; b1 = -(1 + cos) / a0; b2 = b0;
        } else {
            b0 = alpha / a0; b1 = 0; b2 = -alpha / a0;
        }
        a1 = (-2 * cos) / a0;
        a2 = (1 - alpha) / a0;
    };
    const run = (x: number) => {
        const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        x2 = x1; x1 = x; y2 = y1; y1 = y;
        return y;
    };
    return { set, run };
}

function polyBlep(phase: number, step: number): number {
    if (phase < step) {
        const t = phase / step;
        return t + t - t * t - 1;
    }
    if (phase > 1 - step) {
        const t = (phase - 1) / step;
        return t * t + t + t + 1;
    }
    return 0;
}

// ------------------------------------------------------------------ instruments

function kick(time: number, gain = 0.9, dull = false): void {
    kickTimes.push(time);
    const start = Math.round(time * SR);
    const length = Math.round(0.45 * SR);
    let phase = 0;
    for (let i = 0; i < length; i += 1) {
        const t = i / SR;
        const frequency = 46 + (dull ? 70 : 115) * Math.exp(-t / 0.03);
        phase += (TAU * frequency) / SR;
        const body = Math.sin(phase) * Math.exp(-t / 0.24) * Math.min(1, t / 0.0015);
        const click = dull ? 0 : noise() * Math.exp(-t / 0.0025) * 0.35;
        write(drums, start + i, (body + click) * gain, 0);
    }
}

function hat(time: number, gain: number, open: boolean, pan: number): void {
    const start = Math.round(time * SR);
    const decay = open ? 0.085 : 0.022;
    const length = Math.round(decay * 6 * SR);
    const filter = biquad();
    filter.set("highpass", 7200, 0.8);
    for (let i = 0; i < length; i += 1) {
        const t = i / SR;
        write(drums, start + i, filter.run(noise()) * Math.exp(-t / decay) * gain, pan, 0.05);
    }
}

function clap(time: number, gain: number): void {
    const start = Math.round(time * SR);
    const length = Math.round(0.3 * SR);
    const filter = biquad();
    filter.set("bandpass", 1250, 0.9);
    for (let i = 0; i < length; i += 1) {
        const t = i / SR;
        const bursts = [0, 0.011, 0.022].reduce((sum, offset) => sum + (t >= offset ? Math.exp(-(t - offset) / 0.007) : 0), 0);
        const env = bursts * 0.6 + Math.exp(-t / 0.11) * 0.55;
        write(drums, start + i, filter.run(noise()) * env * gain, 0, 0.25);
    }
}

function bassNote(time: number, frequency: number, length: number, gain: number): void {
    const start = Math.round(time * SR);
    const samples = Math.round(length * SR);
    let phase = 0;
    for (let i = 0; i < samples + 0.06 * SR; i += 1) {
        const t = i / SR;
        phase += (TAU * frequency) / SR;
        const env = Math.min(1, t / 0.006) * (i < samples ? 1 : Math.exp(-(t - length) / 0.02));
        const value = Math.tanh((Math.sin(phase) + 0.28 * Math.sin(phase * 2)) * 1.4) * env * gain;
        write(music, start + i, value, 0);
    }
}

function pad(time: number, length: number, notes: number[], gain: number, cutoff = 1500): void {
    const start = Math.round(time * SR);
    const samples = Math.round((length + 0.5) * SR);
    const voices = notes.flatMap((note) => [-7, 7].map((cents) => ({ frequency: note * Math.pow(2, cents / 1200), phase: random() })));
    const filters = [biquad(), biquad()];
    for (let i = 0; i < samples; i += 1) {
        const t = i / SR;
        if (i % 64 === 0) {
            const sweep = cutoff * (0.75 + 0.35 * Math.sin(TAU * 0.08 * (time + t)));
            filters.forEach((filter) => filter.set("lowpass", sweep, 0.7));
        }
        const env = Math.min(1, t / 0.35) * (t > length ? Math.exp(-(t - length) / 0.18) : 1);
        let left = 0;
        let right = 0;
        voices.forEach((voice, index) => {
            const step = voice.frequency / SR;
            voice.phase += step;
            if (voice.phase >= 1) {
                voice.phase -= 1;
            }
            const value = 2 * voice.phase - 1 - polyBlep(voice.phase, step);
            if (index % 2 === 0) {
                left += value;
            } else {
                right += value;
            }
        });
        const scale = (env * gain) / voices.length;
        const l = filters[0].run(left) * scale;
        const r = filters[1].run(right) * scale;
        if (start + i < LENGTH) {
            music.left[start + i] += l;
            music.right[start + i] += r;
            send.left[start + i] += l * 0.5;
            send.right[start + i] += r * 0.5;
        }
    }
}

// Karplus-Strong plucked string.
function pluck(time: number, frequency: number, gain: number, pan: number, decay = 0.996): void {
    const start = Math.round(time * SR);
    const period = Math.max(2, Math.round(SR / frequency));
    const buffer = new Float32Array(period);
    for (let i = 0; i < period; i += 1) {
        buffer[i] = noise();
    }
    let index = 0;
    const length = Math.round(1.4 * SR);
    const tone = biquad();
    tone.set("lowpass", 4200, 0.7);
    for (let i = 0; i < length; i += 1) {
        const next = (index + 1) % period;
        const value = buffer[index];
        buffer[index] = (value + buffer[next]) * 0.5 * decay;
        index = next;
        write(music, start + i, tone.run(value) * gain, pan, 0.35);
    }
}

function bell(time: number, frequency: number, gain: number, pan: number, length = 2.2): void {
    const start = Math.round(time * SR);
    const samples = Math.round(length * SR);
    let carrier = 0;
    let modulator = 0;
    for (let i = 0; i < samples; i += 1) {
        const t = i / SR;
        modulator += (TAU * frequency * 1.4) / SR;
        const index = 3.2 * Math.exp(-t / 0.35) + 0.4;
        carrier += (TAU * frequency) / SR;
        const env = Math.min(1, t / 0.002) * Math.exp(-t / (length * 0.32));
        write(fx, start + i, Math.sin(carrier + index * Math.sin(modulator)) * env * gain, pan, 0.45);
    }
}

function ping(time: number, frequency: number, gain: number, pan: number): void {
    const start = Math.round(time * SR);
    const samples = Math.round(0.5 * SR);
    for (let i = 0; i < samples; i += 1) {
        const t = i / SR;
        const env = Math.min(1, t / 0.003) * Math.exp(-t / 0.12);
        const value = (Math.sin(TAU * frequency * t) + 0.5 * Math.sin(TAU * frequency * 1.5 * t)) * env * gain;
        write(fx, start + i, value, pan, 0.3);
    }
}

function click(time: number, gain: number, pan = 0, frequency = 3200): void {
    const start = Math.round(time * SR);
    const samples = Math.round(0.03 * SR);
    const filter = biquad();
    filter.set("bandpass", frequency, 1.4);
    for (let i = 0; i < samples; i += 1) {
        const t = i / SR;
        const value = filter.run(noise()) * Math.exp(-t / 0.004) + Math.sin(TAU * frequency * 0.6 * t) * Math.exp(-t / 0.002) * 0.4;
        write(fx, start + i, value * gain, pan);
    }
}

function thump(time: number, gain: number, high = 110, low = 52): void {
    const start = Math.round(time * SR);
    const samples = Math.round(0.25 * SR);
    let phase = 0;
    for (let i = 0; i < samples; i += 1) {
        const t = i / SR;
        phase += (TAU * (low + (high - low) * Math.exp(-t / 0.03))) / SR;
        write(fx, start + i, Math.sin(phase) * Math.exp(-t / 0.08) * gain, 0, 0.15);
    }
}

function whoosh(time: number, length: number, gain: number, from: number, to: number, panFrom = 0, panTo = 0): void {
    const start = Math.round(time * SR);
    const samples = Math.round(length * SR);
    const filter = biquad();
    for (let i = 0; i < samples; i += 1) {
        const progress = i / samples;
        if (i % 32 === 0) {
            filter.set("bandpass", from * Math.pow(to / from, progress), 1.1);
        }
        const env = Math.pow(Math.sin(Math.PI * progress), 1.6);
        write(fx, start + i, filter.run(noise()) * env * gain, panFrom + (panTo - panFrom) * progress, 0.2);
    }
}

function riser(time: number, end: number, gain: number): void {
    const start = Math.round(time * SR);
    const samples = Math.round((end - time) * SR);
    const filter = biquad();
    let phase = 0;
    for (let i = 0; i < samples; i += 1) {
        const progress = i / samples;
        if (i % 32 === 0) {
            filter.set("bandpass", 260 * Math.pow(30, progress), 1.6);
        }
        phase += (TAU * (180 * Math.pow(4, progress))) / SR;
        const env = Math.pow(progress, 2.2);
        write(fx, start + i, (filter.run(noise()) * 0.9 + Math.sin(phase) * 0.12) * env * gain, Math.sin(progress * 9) * 0.3, 0.3);
    }
}

function impact(time: number, gain: number): void {
    const start = Math.round(time * SR);
    const samples = Math.round(1.6 * SR);
    const filter = biquad();
    filter.set("lowpass", 900, 0.7);
    let phase = 0;
    for (let i = 0; i < samples; i += 1) {
        const t = i / SR;
        phase += (TAU * (36 + 30 * Math.exp(-t / 0.08))) / SR;
        const sub = Math.sin(phase) * Math.exp(-t / 0.55);
        const crack = filter.run(noise()) * Math.exp(-t / 0.09) * 0.8;
        write(fx, start + i, (sub + crack) * gain, 0, 0.35);
    }
}

function crash(time: number, gain: number): void {
    const start = Math.round(time * SR);
    const samples = Math.round(2 * SR);
    const filter = biquad();
    filter.set("highpass", 4200, 0.7);
    for (let i = 0; i < samples; i += 1) {
        const t = i / SR;
        write(fx, start + i, filter.run(noise()) * Math.exp(-t / 0.55) * gain, (random() - 0.5) * 0.6, 0.4);
    }
}

function squeak(time: number, length: number, gain: number): void {
    const start = Math.round(time * SR);
    const samples = Math.round(length * SR);
    const filter = biquad();
    for (let i = 0; i < samples; i += 1) {
        const progress = i / samples;
        if (i % 32 === 0) {
            filter.set("bandpass", 2300 + 700 * progress + 120 * Math.sin(progress * 40), 5);
        }
        write(fx, start + i, filter.run(noise()) * Math.sin(Math.PI * progress) * gain, 0.2);
    }
}

function blip(time: number, frequency: number, length: number, gain: number, pan = 0): void {
    const start = Math.round(time * SR);
    const samples = Math.round(length * SR);
    for (let i = 0; i < samples; i += 1) {
        const t = i / SR;
        write(fx, start + i, Math.sin(TAU * frequency * t) * Math.min(1, t / 0.002) * Math.exp(-t / (length * 0.3)) * gain, pan, 0.2);
    }
}

function buzz(time: number, gain: number): void {
    const start = Math.round(time * SR);
    const samples = Math.round(0.34 * SR);
    const filter = biquad();
    filter.set("lowpass", 1500, 0.8);
    for (let i = 0; i < samples; i += 1) {
        const t = i / SR;
        const gate = t < 0.13 || (t > 0.18 && t < 0.31) ? 1 : 0;
        const square = Math.sign(Math.sin(TAU * 110 * t)) + Math.sign(Math.sin(TAU * 116.5 * t));
        write(fx, start + i, filter.run(square) * gate * gain * 0.5, 0);
    }
}

function ticks(start: number, end: number, count: number, gain: number): void {
    for (let index = 0; index < count; index += 1) {
        const progress = index / count;
        const time = start + (end - start) * (1 - Math.pow(1 - progress, 0.45));
        click(time, gain * (1 - progress * 0.5), (random() - 0.5) * 0.4, 4200);
    }
}

function drone(time: number, end: number, gain: number): void {
    const start = Math.round(time * SR);
    const samples = Math.round((end - time) * SR);
    const air = biquad();
    air.set("lowpass", 420, 0.7);
    for (let i = 0; i < samples; i += 1) {
        const t = i / SR;
        const progress = i / samples;
        const swell = Math.min(1, t / 1.2) * (0.5 + 0.5 * progress);
        const value = Math.sin(TAU * 55 * t) * 0.55 + Math.sin(TAU * 82.41 * t + Math.sin(t * 0.7)) * 0.35 + air.run(noise()) * 0.5;
        write(music, start + i, value * swell * gain, Math.sin(t * 0.4) * 0.2, 0.3);
    }
}

// ------------------------------------------------------------------ arrangement

const CHORDS = [
    { root: 55, notes: [220, 261.63, 329.63], arp: [440, 523.25, 659.25, 880] },
    { root: 43.65, notes: [174.61, 220, 261.63], arp: [349.23, 440, 523.25, 698.46] },
    { root: 65.41, notes: [196, 261.63, 329.63], arp: [392, 523.25, 659.25, 783.99] },
    { root: 49, notes: [196, 246.94, 293.66], arp: [392, 493.88, 587.33, 783.99] },
];

type Groove = { kick: "none" | "half" | "four"; dull?: boolean; hats: "none" | "closed" | "open"; clap: boolean; bass: "none" | "half" | "eighths"; arp: boolean; pad: number };

// Energy per section, keyed by the first bar of each scene.
const GROOVES: { fromBar: number; groove: Groove }[] = [
    { fromBar: 0, groove: { kick: "none", hats: "none", clap: false, bass: "none", arp: false, pad: 0 } },
    { fromBar: 4, groove: { kick: "none", hats: "none", clap: false, bass: "none", arp: false, pad: 0.21 } },
    { fromBar: 6, groove: { kick: "none", hats: "closed", clap: false, bass: "none", arp: false, pad: 0.2 } },
    { fromBar: 7, groove: { kick: "half", hats: "closed", clap: false, bass: "half", arp: false, pad: 0.14 } },
    { fromBar: 11, groove: { kick: "four", hats: "open", clap: true, bass: "eighths", arp: false, pad: 0.12 } },
    { fromBar: 18, groove: { kick: "four", dull: true, hats: "none", clap: false, bass: "half", arp: false, pad: 0.1 } },
    { fromBar: 23, groove: { kick: "four", hats: "open", clap: true, bass: "eighths", arp: false, pad: 0.12 } },
    { fromBar: 29, groove: { kick: "half", hats: "closed", clap: false, bass: "half", arp: true, pad: 0.16 } },
    { fromBar: 34, groove: { kick: "half", hats: "closed", clap: false, bass: "half", arp: false, pad: 0.13 } },
    { fromBar: 35, groove: { kick: "four", hats: "closed", clap: false, bass: "half", arp: false, pad: 0.13 } },
    { fromBar: 39, groove: { kick: "four", hats: "open", clap: true, bass: "eighths", arp: true, pad: 0.13 } },
    { fromBar: 43, groove: { kick: "none", hats: "none", clap: false, bass: "none", arp: false, pad: 0 } },
];

function grooveForBar(bar: number): Groove {
    let current = GROOVES[0].groove;
    for (const entry of GROOVES) {
        if (bar >= entry.fromBar) {
            current = entry.groove;
        }
    }
    return current;
}

// Drum breaks: the punch line of the reading scene and the decision silence.
const BREAKS: [number, number][] = [
    [sec("read", READ.headlineOut), sec("read", READ.punchMark + 50)],
    [sec("decide", DECIDE.approachSend[0]), sec("decide", SCENES.decide.duration)],
    [sec("compute", COMPUTE.fraction[0]), sec("compute", COMPUTE.drop)],
];

function inBreak(time: number): boolean {
    return BREAKS.some(([start, end]) => time >= start && time < end);
}

function arrange(): void {
    for (let bar = 0; bar < 45; bar += 1) {
        const groove = grooveForBar(bar);
        const chord = CHORDS[bar % 4];
        const barStart = barTime(bar);
        if (groove.pad > 0) {
            pad(barStart, BAR / FPS, chord.notes, groove.pad, bar >= 29 && bar < 34 ? 1900 : 1400);
        }
        for (let step = 0; step < 8; step += 1) {
            const time = barStart + step * (BEAT_SEC / 2);
            if (inBreak(time)) {
                continue;
            }
            const onBeat = step % 2 === 0;
            const beatIndex = step / 2;
            if (groove.kick === "four" && onBeat) {
                kick(time, groove.dull ? 0.7 : 0.9, groove.dull);
            }
            if (groove.kick === "half" && (step === 0 || step === 4)) {
                kick(time, 0.8);
            }
            if (groove.clap && (step === 2 || step === 6)) {
                clap(time, 0.32);
            }
            if (groove.hats === "closed") {
                hat(time, onBeat ? 0.05 : 0.09, false, step % 4 === 1 ? 0.25 : -0.2);
            }
            if (groove.hats === "open") {
                hat(time, onBeat ? 0.06 : 0.11, !onBeat, onBeat ? -0.2 : 0.25);
            }
            if (groove.bass === "eighths") {
                bassNote(time, chord.root * (step === 7 ? 2 : 1), 0.2, 0.3);
            }
            if (groove.bass === "half" && (step === 0 || step === 4)) {
                bassNote(time, chord.root, 0.9, 0.3);
            }
            if (groove.arp) {
                const pattern = [0, 1, 2, 1, 3, 2, 1, 2];
                pluck(time, chord.arp[pattern[step]], 0.11, beatIndex % 2 === 0 ? -0.35 : 0.35);
            }
        }
    }
}

function soundDesign(): void {
    // 1. Noise: pings for the visible bubbles, drone, riser, slash and the brand impact.
    drone(0, sec("noise", NOISE.whipEnd), 0.17);
    const PENTATONIC = [880, 1046.5, 1174.66, 1318.51, 1567.98];
    let lastPing = -1;
    for (const bubble of NOISE_BUBBLES) {
        const time = bubble.frame / FPS;
        if (bubble.layer > 1 || time - lastPing < 0.06) {
            continue;
        }
        lastPing = time;
        ping(time, PENTATONIC[bubble.index % PENTATONIC.length], bubble.layer === 0 ? 0.11 : 0.06, ((bubble.x - 960) / 960) * 0.8);
    }
    // A pulse that tightens as the messages pile up: ticking hats from bar 2, a muffled heartbeat in bar 3.
    for (let step = 0; step < 32; step += 1) {
        const time = barTime(2) + step * (BEAT_SEC / 4);
        hat(time, 0.015 + 0.05 * (step / 32), false, step % 2 === 0 ? -0.3 : 0.3);
    }
    for (let beatIndex = 0; beatIndex < 4; beatIndex += 1) {
        kick(barTime(3) + beatIndex * BEAT_SEC, 0.32 + beatIndex * 0.08, true);
    }
    riser(sec("noise", NOISE.titleIn[2]), sec("noise", NOISE.whipStart + 4), 0.18);
    squeak(sec("noise", NOISE.markTitle), 0.2, 0.05);
    whoosh(sec("noise", NOISE.whipStart - 4), 0.42, 0.42, 500, 5200, -0.8, 0.8);

    // 2. Brand.
    impact(sec("brand", 0), 0.75);
    crash(sec("brand", 0), 0.12);
    bell(sec("brand", BRAND.outlineEnd), 659.25, 0.12, -0.2);
    bell(sec("brand", BRAND.slideEnd - 10), 987.77, 0.08, 0.2);
    squeak(sec("brand", BRAND.markTagline), 0.22, 0.05);
    whoosh(sec("brand", BRAND.glyphTravelStart), 0.8, 0.12, 2500, 900, 0, 0.5);

    // 3. Paste.
    click(sec("paste", PASTE.keyCtrl), 0.22, 0.3, 1600);
    click(sec("paste", PASTE.keyV), 0.22, 0.35, 1800);
    thump(sec("paste", PASTE.paste), 0.25, 160, 80);
    whoosh(sec("paste", PASTE.paste), 0.3, 0.1, 1800, 5000, 0.2, 0.4);
    PASTE.rentDigits.forEach((frame) => click(sec("paste", frame), 0.2, -0.2, 2600));
    click(sec("paste", PASTE.notaryDigit), 0.2, 0.2, 2600);
    click(sec("paste", PASTE.click), 0.3, 0.4, 1400);
    thump(sec("paste", PASTE.click), 0.2, 140, 70);
    whoosh(sec("paste", PASTE.whipStart - 6), 0.62, 0.5, 400, 6000, 0.9, -0.9);

    // 4. Read: one plucked note per highlight, empty fields as soft low blips, the punch line.
    const MARK_NOTES = [880, 1046.5, 1318.51, 1174.66, 1046.5, 880, 783.99, 1318.51, 1567.98, 1318.51, 1760];
    READ.marks.forEach((mark, index) => {
        pluck(sec("read", mark.frame), MARK_NOTES[index % MARK_NOTES.length], 0.16, index % 2 === 0 ? -0.3 : 0.3);
        squeak(sec("read", mark.frame), 0.16, 0.035);
        blip(sec("read", mark.frame + 18), 1760, 0.08, 0.025, 0.4);
    });
    READ.empties.forEach((frame, index) => blip(sec("read", frame), 196 - index * 15, 0.35, 0.16));
    impact(sec("read", READ.punchIn[0]), 0.35);
    impact(sec("read", READ.punchIn[1] + 10), 0.5);
    squeak(sec("read", READ.punchMark), 0.24, 0.05);
    riser(sec("read", READ.zoomStart), sec("read", READ.zoomEnd), 0.2);

    // 5. Check: scans, ticks, refusal, retry, acceptance.
    [CHECK.scanOne, CHECK.scanTwo].forEach(([start, end]) => {
        whoosh(sec("check", start), (end - start) / FPS, 0.06, 300, 1600);
        for (let row = 0; row < 12; row += 1) {
            blip(sec("check", start + ((end - start) * row) / 11), 1318.51, 0.06, 0.03, 0.2);
        }
    });
    CHECK.verdictsOne.slice(0, 2).forEach((frame) => blip(sec("check", frame), 1567.98, 0.1, 0.05, 0.5));
    buzz(sec("check", CHECK.errorAt), 0.16);
    thump(sec("check", CHECK.stampOne), 0.55, 120, 45);
    click(sec("check", CHECK.stampOne), 0.35, 0, 900);
    whoosh(sec("check", CHECK.loopStart), (CHECK.loopEnd - CHECK.loopStart) / FPS, 0.14, 4000, 600, 0.5, -0.5);
    click(sec("check", CHECK.flip), 0.18, 0.5, 2200);
    CHECK.verdictsTwo.forEach((frame) => blip(sec("check", frame), 1567.98, 0.1, 0.05, 0.5));
    thump(sec("check", CHECK.stampTwo), 0.5, 120, 45);
    [523.25, 659.25, 783.99, 1046.5].forEach((note, index) => bell(sec("check", CHECK.stampTwo) + index * 0.07, note, 0.09, -0.3 + index * 0.2));
    riser(sec("check", CHECK.irisStart - 60), sec("check", CHECK.irisEnd), 0.16);
    whoosh(sec("check", CHECK.irisStart), (CHECK.irisEnd - CHECK.irisStart) / FPS, 0.25, 600, 5000);

    // 6. Compute: rows land, counters tick, build-up to the drop on 13,50 %.
    COMPUTE.rows.forEach((frame, index) => {
        pluck(sec("compute", frame), [659.25, 783.99, 880, 1046.5][index], 0.14, -0.2 + index * 0.13);
        ticks(sec("compute", frame + 2), sec("compute", frame + 36), 14, 0.06);
    });
    squeak(sec("compute", COMPUTE.sumRule), 0.3, 0.04);
    ticks(sec("compute", COMPUTE.totalRoll[0]), sec("compute", COMPUTE.totalRoll[1]), 30, 0.08);
    pluck(sec("compute", COMPUTE.totalRoll[1]), 1318.51, 0.16, 0);
    ticks(sec("compute", COMPUTE.rentRow + 2), sec("compute", COMPUTE.rentRow + 36), 14, 0.06);
    riser(sec("compute", COMPUTE.fraction[0]), sec("compute", COMPUTE.drop), 0.3);
    for (let step = 0; step < 16; step += 1) {
        const span = COMPUTE.drop - COMPUTE.fraction[0];
        const time = sec("compute", COMPUTE.fraction[0]) + (span / FPS) * (1 - Math.pow(1 - step / 16, 1.6));
        clap(time, 0.08 + step * 0.012);
    }
    impact(sec("compute", COMPUTE.drop), 0.85);
    crash(sec("compute", COMPUTE.drop), 0.16);
    ticks(sec("compute", COMPUTE.yieldRoll[0]), sec("compute", COMPUTE.yieldRoll[1]), 34, 0.09);
    squeak(sec("compute", COMPUTE.yieldMark), 0.3, 0.05);
    COMPUTE.chips.forEach((frame, index) => blip(sec("compute", frame), [987.77, 1174.66][index], 0.18, 0.08, index ? 0.3 : -0.3));
    whoosh(sec("compute", COMPUTE.exitStart), (COMPUTE.exitEnd - COMPUTE.exitStart) / FPS, 0.2, 3000, 500, 0, 0);

    // 7. Report: airy fly-over, highlight passes, flip, filing.
    whoosh(sec("report", REPORT.flyStart), (REPORT.flyEnd - REPORT.flyStart) / FPS, 0.06, 300, 1200, -0.4, 0.4);
    REPORT.passes.forEach((frame) => squeak(sec("report", frame), 0.2, 0.035));
    whoosh(sec("report", REPORT.flipStart + 18), 0.5, 0.22, 900, 4500, -0.5, 0.5);
    thump(sec("report", REPORT.drop[1]), 0.3, 150, 70);
    click(sec("report", REPORT.rowSlide), 0.16, 0.5, 2400);
    blip(sec("report", REPORT.statusChip), 1174.66, 0.16, 0.07, 0.5);
    whoosh(sec("report", REPORT.whipStart - 4), 0.75, 0.48, 400, 6200, 0, 0);

    // 8. Decide: buttons, hovers, click, envelope, tension, then silence before the title.
    DECIDE.buttons.forEach((frame, index) => thump(sec("decide", frame + 6), 0.22, 140, 66 + index * 6));
    blip(sec("decide", DECIDE.hoverRevise), 1046.5, 0.08, 0.04, 0);
    blip(sec("decide", DECIDE.hoverReject), 1174.66, 0.08, 0.04, 0.4);
    click(sec("decide", DECIDE.clickApprove), 0.32, -0.4, 1400);
    thump(sec("decide", DECIDE.clickApprove), 0.22, 140, 70);
    whoosh(sec("decide", DECIDE.envelope[0] + 14), 0.4, 0.14, 2000, 4500, -0.2, 0.2);
    whoosh(sec("decide", DECIDE.draft[0]), 0.6, 0.16, 600, 3000, 0, 0);
    riser(sec("decide", DECIDE.approachSend[0] - 20), sec("decide", DECIDE.silence[0]), 0.2);
    impact(sec("decide", DECIDE.finalTitle), 0.55);
    [220, 329.63, 440].forEach((note, index) => bell(sec("decide", DECIDE.finalTitle) + index * 0.05, note * 2, 0.06, -0.2 + index * 0.2, 2.6));

    // 9. Proof: hard cut on the beat, one impact per card, the hidden instruction denied.
    impact(sec("proof", 0), 0.8);
    crash(sec("proof", 0), 0.12);
    PROOF.cards.forEach((frame, index) => {
        if (index > 0) {
            impact(sec("proof", frame), 0.45);
        }
        if (index !== 1) {
            ticks(sec("proof", frame + 4), sec("proof", frame + 44), 24, 0.07);
        }
    });
    blip(sec("proof", PROOF.lockFrame), 233.08, 0.3, 0.16);
    blip(sec("proof", PROOF.lockFrame + 8), 174.61, 0.4, 0.16);
    squeak(sec("proof", PROOF.finalMark), 0.24, 0.05);
    riser(sec("proof", PROOF.exitStart - 40), sec("proof", PROOF.exitEnd), 0.22);
    whoosh(sec("proof", PROOF.exitStart), (PROOF.exitEnd - PROOF.exitStart) / FPS, 0.3, 500, 5200);

    // 10. End: final hit, a long chord and a bell when the name lands.
    impact(sec("end", 0), 0.8);
    pad(sec("end", 0), 3.4, [220, 261.63, 329.63, 493.88], 0.2, 1800);
    bassNote(sec("end", 0), 55, 3.2, 0.26);
    bell(sec("end", END.wordmarkIn + 30), 880, 0.1, 0, 3);
    bell(sec("end", END.taglineIn + 34), 1318.51, 0.06, 0.3, 3);
}

// Freeverb-style reverb: 8 damped combs and 4 allpasses per channel.
function reverb(input: Float32Array, spread: number): Float32Array {
    const scale = SR / 44100;
    const combSizes = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((size) => Math.round((size + spread) * scale));
    const allpassSizes = [556, 441, 341, 225].map((size) => Math.round((size + spread) * scale));
    const combs = combSizes.map((size) => ({ buffer: new Float32Array(size), index: 0, store: 0 }));
    const allpasses = allpassSizes.map((size) => ({ buffer: new Float32Array(size), index: 0 }));
    const feedback = 0.84 * 0.28 + 0.7;
    const damp = 0.25;
    const output = new Float32Array(input.length);
    for (let i = 0; i < input.length; i += 1) {
        const x = input[i] * 0.015;
        let sum = 0;
        for (const comb of combs) {
            const value = comb.buffer[comb.index];
            comb.store = value * (1 - damp) + comb.store * damp;
            comb.buffer[comb.index] = x + comb.store * feedback;
            comb.index = (comb.index + 1) % comb.buffer.length;
            sum += value;
        }
        for (const allpass of allpasses) {
            const buffered = allpass.buffer[allpass.index];
            allpass.buffer[allpass.index] = sum + buffered * 0.5;
            allpass.index = (allpass.index + 1) % allpass.buffer.length;
            sum = buffered - sum;
        }
        output[i] = sum;
    }
    return output;
}

function sidechainGain(): Float32Array {
    const gain = new Float32Array(LENGTH).fill(1);
    for (const time of kickTimes) {
        const start = Math.round(time * SR);
        const length = Math.round(0.32 * SR);
        for (let i = 0; i < length && start + i < LENGTH; i += 1) {
            const t = i / SR;
            const duck = 0.55 * (t < 0.01 ? t / 0.01 : Math.exp(-(t - 0.01) / 0.12));
            gain[start + i] = Math.min(gain[start + i], 1 - duck);
        }
    }
    return gain;
}

function master(): { left: Float32Array; right: Float32Array } {
    const duck = sidechainGain();
    const wetLeft = reverb(send.left, 0);
    const wetRight = reverb(send.right, 23);
    const left = new Float32Array(LENGTH);
    const right = new Float32Array(LENGTH);
    const silenceStart = sec("decide", DECIDE.silence[0]);
    const silenceEnd = sec("decide", DECIDE.finalTitle);
    const fadeStart = DURATION - 0.6;
    let peak = 0;
    for (let i = 0; i < LENGTH; i += 1) {
        const t = i / SR;
        let l = drums.left[i] + music.left[i] * duck[i] + fx.left[i] + wetLeft[i] * 2.6;
        let r = drums.right[i] + music.right[i] * duck[i] + fx.right[i] + wetRight[i] * 2.6;
        // The beat of total silence before the closing line of the decision scene.
        const silence = t >= silenceStart && t < silenceEnd ? Math.max(0, 1 - Math.min(t - silenceStart, silenceEnd - t) / 0.004) : 1;
        const fade = t > fadeStart ? Math.max(0, 1 - (t - fadeStart) / 0.6) : 1;
        l = Math.tanh(l * 1.1) * silence * fade;
        r = Math.tanh(r * 1.1) * silence * fade;
        left[i] = l;
        right[i] = r;
        peak = Math.max(peak, Math.abs(l), Math.abs(r));
    }
    const target = Math.pow(10, -1 / 20);
    const scale = peak > 0 ? target / peak : 1;
    for (let i = 0; i < LENGTH; i += 1) {
        left[i] *= scale;
        right[i] *= scale;
    }
    return { left, right };
}

function writeWav(file: string, left: Float32Array, right: Float32Array): void {
    const dataSize = left.length * 4;
    const buffer = Buffer.alloc(44 + dataSize);
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(2, 22);
    buffer.writeUInt32LE(SR, 24);
    buffer.writeUInt32LE(SR * 4, 28);
    buffer.writeUInt16LE(4, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(dataSize, 40);
    for (let i = 0; i < left.length; i += 1) {
        buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), 44 + i * 4);
        buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), 46 + i * 4);
    }
    writeFileSync(file, buffer);
}

try {
    const started = Date.now();
    arrange();
    soundDesign();
    const { left, right } = master();
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const output = path.join(root, "public", "audio", "soundtrack.wav");
    mkdirSync(path.dirname(output), { recursive: true });
    writeWav(output, left, right);
    console.log(`Wrote ${output}: ${DURATION.toFixed(2)} s, ${SR} Hz, ${((Date.now() - started) / 1000).toFixed(1)} s to render`);
} catch (error) {
    console.error("Soundtrack synthesis failed:", error);
    process.exit(1);
}
