import { SITE } from "../data/site";

const REQUIREMENTS = [
    {
        title: "Un poste ou un serveur avec Docker",
        text: "L'automatisation et le moteur de calcul tournent chez vous, accessibles uniquement en local.",
    },
    {
        title: "Un compte Google Workspace",
        text: "Les fiches sont rangées dans Drive, le suivi tient dans un Google Sheet, les envois partent en brouillon Gmail.",
    },
    {
        title: "Une clé OpenAI",
        text: "Seul le texte du message est envoyé pour la lecture. Coût mesuré : moins d'un centime de dollar par étude.",
    },
];

export function Deployment() {
    return (
        <div>
            <div className="requirements">
                {REQUIREMENTS.map((item) => (
                    <div key={item.title} className="requirement">
                        <h3>{item.title}</h3>
                        <p>{item.text}</p>
                    </div>
                ))}
            </div>
            <div className="install">
                <pre className="terminal" aria-label="Commandes d'installation">
                    <code>{`cp .env.example .env
docker compose up -d
# importer les workflows, connecter le compte Google
# ouvrir le formulaire : http://localhost:5678`}</code>
                </pre>
                <p className="muted">
                    Le guide détaille chaque étape, de la clé de chiffrement à la connexion Google.
                    {SITE.repoUrl && (
                        <>
                            {" "}
                            <a href={SITE.repoUrl}>Lire le guide d'installation</a>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}
