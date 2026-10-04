import type { ReactNode } from "react";
import { Calibration } from "./Calibration";
import { Deployment } from "./Deployment";
import { EvalResults } from "./EvalResults";
import { Guarantees } from "./Guarantees";
import { ReplayDemo } from "./ReplayDemo";

const SECTIONS: { id: string; title: string; summary: string; content: ReactNode }[] = [
    { id: "etude", title: "Une étude complète, pas à pas", summary: "Contrôles, calcul, fiche et décision sur le studio de la démo.", content: <ReplayDemo /> },
    { id: "evaluation", title: "Résultats détaillés", summary: "Critères, objectifs, choix du modèle et limites connues.", content: <EvalResults /> },
    { id: "garde-fous", title: "Ce que l'IA ne fait jamais", summary: "Les cinq garde-fous qui protègent vos études.", content: <Guarantees /> },
    { id: "reglages", title: "Réglé sur vos chiffres", summary: "Rendement, grille de prix, frais et gabarit de fiche.", content: <Calibration /> },
    { id: "installation", title: "Installation", summary: "Ce qu'il faut pour faire tourner DealDraft chez vous.", content: <Deployment /> },
];

export function Details() {
    return (
        <section className="band tinted" id="details">
            <div className="wrap">
                <h2>Pour aller plus loin</h2>
                <div className="details-list">
                    {SECTIONS.map((section) => (
                        <details key={section.id} id={section.id} className="detail">
                            <summary>
                                <span className="detail-title">{section.title}</span>
                                <span className="detail-summary">{section.summary}</span>
                            </summary>
                            <div className="detail-body">{section.content}</div>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
