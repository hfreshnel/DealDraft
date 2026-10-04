const EURO = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const PERCENT = new Intl.NumberFormat("fr-FR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Intl uses a narrow no-break space that some web fonts lack; a regular no-break space renders everywhere.
const NARROW_NBSP = / /g;

export function formatEuro(value: number | null): string {
    return value === null ? "non chiffré" : EURO.format(value).replace(NARROW_NBSP, " ");
}

export function formatPercent(value: number | null): string {
    return value === null ? "non calculé" : PERCENT.format(value).replace(NARROW_NBSP, " ");
}
