const NEVER = [
    {
        title: "Fixer un prix ou un loyer",
        text: "Le loyer après travaux, c'est vous qui le saisissez. Les prix de travaux viennent de votre grille, et un poste sans prix reste non chiffré.",
    },
    {
        title: "Faire un calcul",
        text: "Budget, frais de notaire et rendement sortent d'un code testé. L'IA ne fait que relever ce qui est écrit.",
    },
    {
        title: "Combler un vide",
        text: "Une information absente du message reste vide et apparaît dans la liste des données à obtenir auprès de l'agent immobilier.",
    },
    {
        title: "Envoyer quoi que ce soit",
        text: "Valider une étude crée un brouillon dans Gmail. C'est vous qui l'ouvrez, le relisez et l'envoyez.",
    },
    {
        title: "Suivre une consigne cachée dans un message",
        text: "Un texte transféré qui contient des instructions est lu comme une donnée. Le cas fait partie des tests.",
    },
];

export function Guarantees() {
    return (
        <dl className="never-list">
            {NEVER.map((item) => (
                <div key={item.title} className="never-item">
                    <dt>{item.title}</dt>
                    <dd>{item.text}</dd>
                </div>
            ))}
        </dl>
    );
}
