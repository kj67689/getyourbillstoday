const PRICES = {350:20,600:35,750:50,1000:85,1500:100};
const PROMOS = new Set(["PROP10","FUN10","STACK10"]);

function totalFor(order) {
  const count = Number(order?.package);
  if (!(count in PRICES)) throw new Error("Invalid package.");
  let total = PRICES[count];
  if (PROMOS.has(String(order?.promo || "").trim().toUpperCase())) total *= 0.90;
  return Number(total.toFixed(2));
}
function validateOrder(order) {
  if (!order) throw new Error("Missing order.");
  for (const key of ["name","address1","city","state","zip","phone"]) {
    if (!String(order[key] || "").trim()) throw new Error(`Missing ${key}.`);
  }
  if (!order.denomination) throw new Error("Choose a denomination.");
  if (order.denomination === "mixed") {
    const total = Object.values(order.mixed || {}).reduce((a,b)=>a+(Number(b)||0),0);
    if (total !== Number(order.package)) throw new Error("Mixed bill quantities do not match the package.");
  }
}
module.exports={totalFor,validateOrder};