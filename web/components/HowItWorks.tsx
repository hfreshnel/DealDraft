const STEPS = [
    {
        actor: "Chasseur",
        title: "Colle le message",
        text: "Annonce, message d'agent ou notes de visite dictées, dans un formulaire. Il ajoute le loyer qu'il vise après travaux.",
    },
    {
        actor: "IA",
        title: "Relève les informations",
        text: "Prix, surface, occupation, état, travaux : chaque valeur est accompagnée de la phrase qui la justifie.",
    },
    {
        actor: "Contrôle",
        title: "Vérifie chaque extrait",
        text: "Une citation introuvable dans le message ou un champ sans source, et la réponse est renvoyée à l'IA avec l'erreur.",
    },
    {
        actor: "Calcul",
        title: "Chiffre l'opération",
        text: "Notaire, travaux selon votre grille, ameublement, budget total, rendement et durée de chantier.",
    },
    {
        actor: "Chasseur",
        title: "Relit et décide",
        text: "La fiche arrive dans Drive et dans le tableau de suivi. Il valide, corrige une hypothèse ou rejette.",
    },
];

export function HowItWorks() {
    return (
        <section className="band">
            <div className="wrap">
                <h2>Du message à la décision</h2>
                <ol className="steps">
                    {STEPS.map((step, index) => (
                        <li key={step.title} className="step-item">
                            <span className="step-number">{index + 1}</span>
                            <span className={`step-actor ${step.actor === "IA" ? "ai" : step.actor === "Chasseur" ? "human" : "code"}`}>
                                {step.actor}
                            </span>
                            <h3>{step.title}</h3>
                            <p>{step.text}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
