"use client";

import { useState } from "react";
import demo from "../data/demo.json";
import { formatEuro, formatPercent } from "../data/format";

const TABS = ["Contrôles", "Calcul", "Fiche", "Décision"];

const FIELD_NAMES: Record<string, string> = {
    roomCount: "nombre de pièces",
    livingAreaSqm: "surface",
    askingPrice: "prix",
};

export function ReplayDemo() {
    const [tab, setTab] = useState(0);
    const { analysis, attempts, assumptions } = demo;
    const rejected = attempts.filter((item) => item.problems.length > 0);
    const notaryPercent = Math.round(assumptions.notaryFeeRate * 100);

    return (
        <section className="band" id="etude">
            <div className="wrap">
                <h2>Une étude complète, pas à pas</h2>
                <p className="muted narrow">
                    Le studio du haut de page, traité de bout en bout par {demo.meta.model}. Ce sont les sorties réelles du
                    système, figées pour la démonstration.
                </p>

                <div className="tabs" role="tablist" aria-label="Étapes de l'étude">
                    {TABS.map((label, index) => (
                        <button
                            key={label}
                            type="button"
                            role="tab"
                            id={`tab-${index}`}
                            aria-selected={tab === index}
                            aria-controls={`panel-${index}`}
                            className={tab === index ? "tab active" : "tab"}
                            onClick={() => setTab(index)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="tab-panel" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
                    {tab === 0 && (
                        <div className="panel-grid">
                            <div>
                                <h3>Trois vérifications avant d'accepter la lecture de l'IA</h3>
                                <ul className="plain-list">
                                    <li>La réponse respecte le format attendu, champ par champ, sans clé en trop.</li>
                                    <li>Chaque citation se retrouve mot pour mot dans le message.</li>
                                    <li>Une valeur renseignée a sa citation ; une valeur vide n'en a pas.</li>
                                </ul>
                            </div>
                            <ol className="attempts">
                                {rejected.map((item) => (
                                    <li key={item.attempt} className="attempt rejected">
                                        <strong>Lecture {item.attempt} refusée</strong>
                                        {item.problems.map((problem) => {
                                            const field = String(problem.location[problem.location.length - 1]);
                                            return (
                                                <span key={field}>
                                                    Le {FIELD_NAMES[field] ?? field} était renseigné sans citation à l'appui.
                                                </span>
                                            );
                                        })}
                                    </li>
                                ))}
                                <li className="attempt accepted">
                                    <strong>Lecture {attempts.length} acceptée</strong>
                                    <span>
                                        Toutes les citations sont retrouvées. Après trois refus, l'étude n'est pas créée et
                                        l'erreur est consignée dans le journal.
                                    </span>
                                </li>
                            </ol>
                        </div>
                    )}

                    {tab === 1 && (
                        <div className="panel-grid">
                            <table className="ledger">
                                <tbody>
                                    <tr>
                                        <th>Prix d'achat</th>
                                        <td>{formatEuro(analysis.purchasePrice)}</td>
                                        <td className="source">relevé dans le message</td>
                                    </tr>
                                    <tr>
                                        <th>Frais de notaire</th>
                                        <td>{formatEuro(analysis.notaryFees)}</td>
                                        <td className="source">{notaryPercent} %, saisi par le chasseur</td>
                                    </tr>
                                    <tr>
                                        <th>Travaux</th>
                                        <td>{formatEuro(analysis.worksCost)}</td>
                                        <td className="source">32 m² à 656,25 € pour une rénovation complète</td>
                                    </tr>
                                    <tr>
                                        <th>Ameublement</th>
                                        <td>{formatEuro(analysis.furnitureCost)}</td>
                                        <td className="source">saisi par le chasseur</td>
                                    </tr>
                                    <tr className="sum">
                                        <th>Budget tout compris</th>
                                        <td>{formatEuro(analysis.totalBudget)}</td>
                                        <td />
                                    </tr>
                                    <tr>
                                        <th>Loyer annuel</th>
                                        <td>{formatEuro(analysis.annualRent)}</td>
                                        <td className="source">{formatEuro(assumptions.expectedMonthlyRent)} par mois sur 12 mois</td>
                                    </tr>
                                    <tr className="sum">
                                        <th>Rendement brut</th>
                                        <td>{formatPercent(analysis.primaryYield)}</td>
                                        <td className="source">loyer annuel divisé par le budget</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div>
                                <h3>Ce que la fiche signale</h3>
                                <ul className="plain-list">
                                    <li>
                                        Les quatre postes repérés (fenêtres, peinture, sols, salle de bains) n'ont pas de
                                        métrés : les travaux sont estimés au m² selon l'état général, et la fiche le dit.
                                    </li>
                                    <li>Durée de chantier estimée : {String(analysis.estimatedWorksDurationMonths).replace(".", ",")} mois.</li>
                                    <li>DPE, charges de copropriété et taxe foncière sont à demander à l'agent.</li>
                                    <li>
                                        Ce bien est reconstitué d'après une étude publiée qui annonçait 13,5 % : le calcul
                                        retombe sur le même chiffre.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {tab === 2 && (
                        <div>
                            <p className="muted narrow">
                                La fiche telle qu'elle arrive dans Google Drive, avec ses sources, ses avertissements et la
                                trace du modèle et du prompt utilisés.
                            </p>
                            <iframe className="report-frame" title="Fiche d'étude de rendement générée" src="/demo/report.html" />
                        </div>
                    )}

                    {tab === 3 && (
                        <div className="decisions">
                            <div className="decision">
                                <h3>Valider</h3>
                                <p>
                                    Un brouillon Gmail est préparé pour le client : budget, loyer, rendement et lien vers la
                                    fiche. Le chasseur le relit et l'envoie lui-même.
                                </p>
                            </div>
                            <div className="decision">
                                <h3>Corriger une hypothèse</h3>
                                <p>
                                    Le chasseur change le loyer ou le taux de notaire : la fiche est recalculée sans relancer
                                    l'IA, au même lien, avec un numéro de révision.
                                </p>
                            </div>
                            <div className="decision">
                                <h3>Rejeter</h3>
                                <p>
                                    L'étude passe au statut rejeté dans le tableau de suivi, avec la remarque du chasseur. Le
                                    journal garde la trace de chaque décision.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
