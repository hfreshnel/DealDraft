export const EVAL = {
    model: "gpt-4o-2024-08-06",
    promptVersion: "df0c52c9b4fb",
    annotationStatus: "humanReviewed" as "claudeDraft" | "humanReviewed",
    testCases: 6,
    totalCases: 20,
    runsPerCase: 3,
    headline: [
        { label: "de valeurs justes", value: "98,5 %" },
        { label: "valeur inventée sur le prix, la surface ou le loyer", value: "0" },
        { label: "par étude, en coût d'IA", value: "< 0,01 $" },
    ],
    metrics: [
        { label: "Valeurs justes", target: "90 % au moins", test: "98,5 %", detail: "198 valeurs sur 201", met: true },
        { label: "Valeurs inventées sur prix, surface, loyer, état", target: "aucune", test: "aucune", detail: "18 lectures", met: true },
        { label: "Citations retrouvées mot pour mot", target: "toutes", test: "237 sur 237", detail: "contrôlées par le code", met: true },
        { label: "Réponse exploitable dès la première lecture", target: "95 % au moins", test: "100 %", detail: "18 lectures sur 18", met: true },
        { label: "Pièges déjoués", target: "tous", test: "3 sur 3", detail: "consigne cachée, fourchette de prix, copropriété", met: true },
        { label: "Postes de travaux repérés", target: "suivi", test: "79 %", detail: "45 postes sur 57", met: false },
    ],
    modelName: "gpt-4o",
    costPerStudy: "moins d'un centime de dollar",
    rejectedModel: { name: "gpt-4o-mini", criticalHallucinations: "9 fois sur 60 lectures" },
};
