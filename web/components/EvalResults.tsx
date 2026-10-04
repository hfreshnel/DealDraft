import { EVAL } from "../data/eval-summary";

export function EvalResults() {
    const reviewed = EVAL.annotationStatus === "humanReviewed";
    return (
        <section className="band" id="fiabilite">
            <div className="wrap">
                <h2>Mesuré avant d'être proposé</h2>
                <p className="muted narrow">
                    {EVAL.totalCases} annonces et messages d'agents, dont des pièges : immeuble en plusieurs lots, fourchette
                    de prix, consigne cachée dans le texte. Chaque cas est lu {EVAL.runsPerCase} fois. Les résultats
                    ci-dessous portent sur {EVAL.testCases} cas tenus à l'écart pendant les réglages.
                </p>
                <table className="results">
                    <thead>
                        <tr>
                            <th scope="col">Critère</th>
                            <th scope="col">Objectif</th>
                            <th scope="col">Résultat</th>
                        </tr>
                    </thead>
                    <tbody>
                        {EVAL.metrics.map((metric) => (
                            <tr key={metric.label}>
                                <th scope="row">
                                    {metric.label}
                                    <span className="row-detail">{metric.detail}</span>
                                </th>
                                <td>{metric.target}</td>
                                <td className={metric.met ? "result met" : "result watch"}>{metric.test}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="eval-notes">
                    <p>
                        <strong>Choix du modèle.</strong> {EVAL.rejectedModel.name} coûte seize fois moins cher mais a
                        inventé des valeurs sur des champs critiques {EVAL.rejectedModel.criticalHallucinations}.{" "}
                        {EVAL.modelName} n'en invente aucune, pour {EVAL.costPerStudy} par étude.
                    </p>
                    <p>
                        <strong>Point faible connu.</strong> Les travaux de structure décrits en termes vagues sont parfois
                        omis. La relecture du chasseur reste indispensable sur ce point.
                    </p>
                    <p className="muted">
                        {reviewed
                            ? "Les réponses attendues des 6 cas de test ont été relues champ par champ par une personne, sans correction."
                            : "Référence annotée par IA, relecture humaine en cours : les résultats seront mis à jour."}
                    </p>
                </div>
            </div>
        </section>
    );
}
