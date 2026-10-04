import { SITE } from "../data/site";

export function SiteFooter() {
    return (
        <footer className="site-footer">
            <div className="wrap footer-row">
                <span className="wordmark small">
                    <span className="wordmark-mark" aria-hidden="true" />
                    {SITE.name}
                </span>
                <p>{SITE.footerNote}</p>
                {SITE.repoUrl && <a href={SITE.repoUrl}>Code source</a>}
            </div>
        </footer>
    );
}
