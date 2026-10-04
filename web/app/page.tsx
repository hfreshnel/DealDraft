import { ContactBand } from "../components/ContactBand";
import { Details } from "../components/Details";
import { Hero } from "../components/Hero";
import { ResultsStrip } from "../components/ResultsStrip";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { SourceTrace } from "../components/SourceTrace";
import { ThreeSteps } from "../components/ThreeSteps";
import { TrustPoints } from "../components/TrustPoints";

export default function HomePage() {
    return (
        <>
            <SiteHeader />
            <main>
                <Hero />
                <ThreeSteps />
                <TrustPoints />
                <section className="band tinted" id="essayez">
                    <div className="wrap">
                        <h2>D'où vient chaque chiffre ?</h2>
                        <p className="muted section-lead">Survolez ou touchez une ligne de la fiche : sa phrase d'origine s'allume dans le message.</p>
                        <SourceTrace />
                    </div>
                </section>
                <ResultsStrip />
                <Details />
                <ContactBand />
            </main>
            <SiteFooter />
        </>
    );
}
