import { CONTACT_HREF, SITE } from "../data/site";

export function SiteHeader() {
    return (
        <header className="site-header">
            <div className="wrap header-row">
                <a className="wordmark" href="#top">
                    <span className="wordmark-mark" aria-hidden="true" />
                    {SITE.name}
                </a>
                <nav className="header-nav" aria-label="Sections">
                    <a href="#fonctionnement">Fonctionnement</a>
                    <a href="#resultats">Résultats</a>
                    <a className="header-cta" href={CONTACT_HREF}>
                        Demander une démo
                    </a>
                </nav>
            </div>
        </header>
    );
}
