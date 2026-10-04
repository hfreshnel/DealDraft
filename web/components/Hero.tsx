import { SITE } from "../data/site";
import { VideoFrame } from "./VideoFrame";

export function Hero() {
    return (
        <section className="hero" id="top">
            <div className="wrap">
                <h1>Collez une annonce. Recevez l'étude de rendement.</h1>
                <p className="lead">
                    Annonce, message d'un agent immobilier ou notes de visite : {SITE.name} prépare le brouillon chiffré
                    en quelques secondes. Vous relisez, vous validez.
                </p>
                <VideoFrame youtubeId={SITE.youtubeId} />
            </div>
        </section>
    );
}
