// Shared helpers for cart line items.

// Price of one unit after discount.
export const unitPrice = (item) => {
  const discount = Number(item.discount) || 0;
  return (Number(item.price) || 0) * (1 - discount / 100);
};

// Two sizes are the same when the standard size matches, or when both are
// Custom with identical measurements and photos. Comparing only `type`
// would merge different custom measurements into one line and lose data.
export const isSameSize = (a, b) => {
  if (a?.type === 'Custom' || b?.type === 'Custom') {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return a === b;
};

export const isSameLine = (item, { id, color, customizations, shape, size }) =>
  item.id === id &&
  item.color === color &&
  item.customizations === customizations &&
  item.shape === shape &&
  isSameSize(item.size, size);

// Design code shown to customers, e.g. "HM-001". Uses the code the admin set,
// otherwise one derived from the product id (seed ids "1","2" → HM-001, HM-002).
export const productCode = (product) => {
  const custom = String(product?.code || '').trim();
  if (custom) return custom.toUpperCase();
  const id = String(product?.id || '0');
  return `HM-${id.length <= 3 ? id.padStart(3, '0') : id.slice(-4)}`;
};

// Order number shared by the Instagram message and the PDF, e.g. "HOM-261107-4821".
export const makeOrderNumber = (date = new Date()) => {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `HOM-${yy}${mm}${dd}-${rand}`;
};
