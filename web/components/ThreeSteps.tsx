export function ThreeSteps() {
    return (
        <section className="band" id="fonctionnement">
            <div className="wrap">
                <h2>Comment ça marche</h2>
                <ol className="three-steps">
                    <li className="three-step">
                        <div className="mini mini-message" aria-hidden="true">
                            <span className="mini-line" />
                            <span className="mini-line short marked" />
                            <span className="mini-line" />
                            <span className="mini-line shorter" />
                        </div>
                        <h3>
                            <span className="three-number">1</span>Collez le message de l'agent
                        </h3>
                        <p>Annonce, message ou notes de visite, tels quels.</p>
                    </li>
                    <li className="three-step">
                        <div className="mini mini-sheet" aria-hidden="true">
                            <span className="mini-row">
                                <span>Budget</span>
                                <strong>50 680 €</strong>
                            </span>
                            <span className="mini-row">
                                <span>Loyer</span>
                                <strong>570 €</strong>
                            </span>
                            <span className="mini-row">
                                <span>Rendement</span>
                                <strong>13,50 %</strong>
                            </span>
                        </div>
                        <h3>
                            <span className="three-number">2</span>DealDraft prépare l'étude
                        </h3>
                        <p>Chaque chiffre est relié à la phrase dont il vient.</p>
                    </li>
                    <li className="three-step">
                        <div className="mini mini-decision" aria-hidden="true">
                            <span className="mini-button primary">Valider</span>
                            <span className="mini-button">Corriger</span>
                            <span className="mini-button">Rejeter</span>
                        </div>
                        <h3>
                            <span className="three-number">3</span>Vous décidez
                        </h3>
                        <p>Validée, l'étude devient un brouillon d'e-mail pour votre client.</p>
                    </li>
                </ol>
            </div>
        </section>
    );
}
