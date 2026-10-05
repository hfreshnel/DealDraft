import type { ComponentType } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ChapterTag } from "./components/ChapterTag";
import { FontGate } from "./components/FontGate";
import { Grain } from "./components/Grain";
import { MotionBlurDefs } from "./components/Odometer";
import { clamp01 } from "./lib/motion";
import { BrandScene } from "./scenes/BrandScene";
import { CheckScene } from "./scenes/CheckScene";
import { ComputeScene } from "./scenes/ComputeScene";
import { DecideScene } from "./scenes/DecideScene";
import { EndScene } from "./scenes/EndScene";
import { NoiseScene } from "./scenes/NoiseScene";
import { PasteScene } from "./scenes/PasteScene";
import { ProofScene } from "./scenes/ProofScene";
import { ReadScene } from "./scenes/ReadScene";
import { ReportScene } from "./scenes/ReportScene";
import { CHECK, READ, SCENE_ORDER, SCENES, type SceneKey } from "./timeline";
import { COLORS } from "./theme";

export const SCENE_COMPONENTS: Record<SceneKey, ComponentType> = {
    noise: NoiseScene,
    brand: BrandScene,
    paste: PasteScene,
    read: ReadScene,
    check: CheckScene,
    compute: ComputeScene,
    report: ReportScene,
    decide: DecideScene,
    proof: ProofScene,
    end: EndScene,
};

// Grain lives on the dark sets only: the opening, the validation and the proof.
function grainOpacity(frame: number): number {
    const fade = (start: number, end: number) => clamp01((frame - start) / 20) * (1 - clamp01((frame - end) / 20));
    const checkEnd = SCENES.check.from + CHECK.irisStart + 30;
    return Math.max(
        fade(SCENES.noise.from, SCENES.noise.from + SCENES.noise.duration - 30) * 0.5,
        fade(SCENES.read.from + READ.zoomStart + 60, checkEnd) * 0.4,
        fade(SCENES.proof.from - 20, SCENES.proof.from + SCENES.proof.duration - 40) * 0.45,
    );
}

export function DealDraftFilm({ withAudio = true }: { withAudio?: boolean }) {
    const frame = useCurrentFrame();
    return (
        <FontGate>
            <AbsoluteFill style={{ background: COLORS.night }}>
                <MotionBlurDefs />
                {SCENE_ORDER.map((key) => {
                    const slot = SCENES[key];
                    const Scene = SCENE_COMPONENTS[key];
                    return (
                        <Sequence key={key} from={slot.from} durationInFrames={slot.duration} name={key}>
                            <Scene />
                        </Sequence>
                    );
                })}
                <ChapterTag frame={frame} />
                <Grain frame={frame} opacity={grainOpacity(frame)} />
                {withAudio ? <Audio src={staticFile("audio/soundtrack.wav")} /> : null}
            </AbsoluteFill>
        </FontGate>
    );
}
