import { AbsoluteFill, Composition, Folder, Still } from "remotion";
import { FontGate } from "./components/FontGate";
import { MotionBlurDefs } from "./components/Odometer";
import { DealDraftFilm, SCENE_COMPONENTS } from "./DealDraftFilm";
import { Poster } from "./Poster";
import { FPS, HEIGHT, SCENE_ORDER, SCENES, TOTAL_FRAMES, WIDTH } from "./timeline";

function SceneOnly({ sceneKey }: { sceneKey: string }) {
    const Scene = SCENE_COMPONENTS[sceneKey as keyof typeof SCENE_COMPONENTS];
    return (
        <FontGate>
            <AbsoluteFill>
                <MotionBlurDefs />
                {Scene ? <Scene /> : null}
            </AbsoluteFill>
        </FontGate>
    );
}

export function RemotionRoot() {
    return (
        <>
            <Composition id="DealDraftFilm" component={DealDraftFilm} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ withAudio: true }} />
            <Still id="Poster" component={Poster} width={WIDTH} height={HEIGHT} />
            <Folder name="Scenes">
                {SCENE_ORDER.map((key) => (
                    <Composition
                        key={key}
                        id={`Scene-${key}`}
                        component={SceneOnly}
                        durationInFrames={SCENES[key].duration}
                        fps={FPS}
                        width={WIDTH}
                        height={HEIGHT}
                        defaultProps={{ sceneKey: key }}
                    />
                ))}
            </Folder>
        </>
    );
}
