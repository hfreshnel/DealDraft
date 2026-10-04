import { SITE } from "../data/site";
import { VideoFrame } from "./VideoFrame";

export function Hero() {
    return (
        <section className="hero" id="top">
            <div className="wrap">
                <h1>Le message de l'agent devient une étude de rendement.</h1>
                <p className="lead">
                    {SITE.name} prépare le brouillon chiffré en quelques secondes. Votre chasseur relit, puis valide.
                </p>
                <VideoFrame youtubeId={SITE.youtubeId} />
            </div>
        </section>
    );
}
