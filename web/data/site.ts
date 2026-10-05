export const SITE = {
    name: "DealDraft",
    description:
        "Collez une annonce, recevez l'étude de rendement. DealDraft prépare le brouillon chiffré, vous relisez et validez.",
    repoUrl: "https://github.com/hfreshnel/DealDraft",
    youtubeId: "w5VUyUtoOTI",
    contactEmail: "hfreshnel@gmail.com",
    contactSubject: "Démo DealDraft",
    footerNote: "Annonces de démonstration fictives.",
};

export const CONTACT_HREF = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(SITE.contactSubject)}`;
