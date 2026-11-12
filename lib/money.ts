export const money = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
