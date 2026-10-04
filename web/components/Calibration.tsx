const SETTINGS = [
    {
        title: "Votre définition du rendement",
        text: "Sur budget d'acquisition et travaux, ou sur budget total avec vos frais. Tant qu'elle n'est pas fixée, la fiche affiche les deux.",
    },
    {
        title: "Votre grille de prix des travaux",
        text: "Prix au m² par état du bien et prix par poste, dans un fichier simple à tenir à jour. La grille fournie est un exemple et chaque fiche l'indique.",
    },
    {
        title: "Vos frais de notaire et de financement",
        text: "Aucune valeur par défaut : vous les saisissez à chaque étude, ou vous fixez les vôtres une fois pour toutes.",
    },
    {
        title: "Votre gabarit de fiche",
        text: "Rubriques, mentions et formulations tiennent dans un seul fichier de mise en page, à aligner sur l'étude que vos clients reçoivent déjà.",
    },
];

export function Calibration() {
    return (
        <dl className="never-list">
            {SETTINGS.map((item) => (
                <div key={item.title} className="never-item">
                    <dt>{item.title}</dt>
                    <dd>{item.text}</dd>
                </div>
            ))}
        </dl>
    );
}
