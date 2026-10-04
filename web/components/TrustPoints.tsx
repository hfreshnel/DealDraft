const POINTS = [
    { title: "Chaque chiffre a sa source", text: "Une valeur sans phrase d'origine dans le message est refusée." },
    { title: "L'IA ne calcule rien", text: "Budget et rendement sortent d'un calcul vérifié, le loyer vient du chasseur." },
    { title: "Rien ne part sans vous", text: "DealDraft prépare un brouillon. L'envoi reste votre décision." },
];

export function TrustPoints() {
    return (
        <section className="band trust">
            <div className="wrap">
                <ul className="trust-list">
                    {POINTS.map((point) => (
                        <li key={point.title}>
                            <h3>{point.title}</h3>
                            <p>{point.text}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
