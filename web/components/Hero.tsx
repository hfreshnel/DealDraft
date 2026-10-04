import { SITE } from "../data/site";
import { SourceTrace } from "./SourceTrace";

export function Hero() {
    return (
        <section className="hero" id="top">
            <div className="wrap">
                <div className="hero-copy">
                    <h1>L'agent envoie un message. Votre chasseur reçoit une étude de rendement à relire.</h1>
                    <p className="lead">
                        {SITE.name} lit les annonces, les messages d'agents et les notes de visite, relève chaque information
                        avec sa phrase d'origine et prépare le brouillon d'étude dans votre Google Drive. Les montants sont
                        calculés par un code vérifié, jamais par l'IA. Rien ne part chez le client sans validation.
                    </p>
                    <div className="actions">
                        <a className="button" href="#etude">
                            Parcourir une étude
                        </a>
                        {SITE.videoUrl ? (
                            <a className="button secondary" href={SITE.videoUrl}>
                                Regarder la vidéo (3 min)
                            </a>
                        ) : (
                            <a className="button secondary" href="#installation">
                                Voir l'installation
                            </a>
                        )}
                    </div>
                </div>
                <SourceTrace />
            </div>
        </section>
    );
}
