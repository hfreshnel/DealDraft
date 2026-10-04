import { EVAL } from "../data/eval-summary";

export function ResultsStrip() {
    return (
        <section className="band" id="resultats">
            <div className="wrap">
                <h2>Testé avant d'être proposé</h2>
                <dl className="results-strip">
                    {EVAL.headline.map((item) => (
                        <div key={item.label}>
                            <dt>{item.label}</dt>
                            <dd>{item.value}</dd>
                        </div>
                    ))}
                </dl>
                <p className="muted section-lead">
                    Mesuré sur {EVAL.testCases} cas de test vérifiés par un ingénieur, tirés de {EVAL.totalCases} annonces
                    fictives dont des pièges. Le détail est plus bas.
                </p>
            </div>
        </section>
    );
}
