export const SITE = {
    name: "DealDraft",
    description:
        "DealDraft transforme le message d'un agent immobilier en brouillon d'étude de rendement, relu et validé par votre chasseur.",
    repoUrl: "",
    youtubeId: "",
    contactEmail: "hfreshnel@gmail.com",
    contactSubject: "Démo DealDraft",
    footerNote: "Annonces de démonstration fictives.",
};

export const CONTACT_HREF = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(SITE.contactSubject)}`;
