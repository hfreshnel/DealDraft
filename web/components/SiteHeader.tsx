import { SITE } from "../data/site";

export function SiteHeader() {
    return (
        <header className="site-header">
            <div className="wrap header-row">
                <a className="wordmark" href="#top">
                    <span className="wordmark-mark" aria-hidden="true" />
                    {SITE.name}
                </a>
                <nav className="header-nav" aria-label="Sections">
                    <a href="#etude">L'étude complète</a>
                    <a href="#fiabilite">Fiabilité</a>
                    <a href="#installation">Installation</a>
                    {SITE.repoUrl && (
                        <a className="header-cta" href={SITE.repoUrl}>
                            Code source
                        </a>
                    )}
                </nav>
            </div>
        </header>
    );
}
