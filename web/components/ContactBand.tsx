import { CONTACT_HREF } from "../data/site";

export function ContactBand() {
    return (
        <section className="band contact">
            <div className="wrap contact-row">
                <h2>Voir DealDraft sur vos propres annonces</h2>
                <a className="button" href={CONTACT_HREF}>
                    Demander une démo en direct
                </a>
            </div>
        </section>
    );
}
