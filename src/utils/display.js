// Small helpers shared by the storefront UI.

// Stored images are either uploaded base64 data URLs or file names in /public.
export const imageSrc = (image) => {
  if (!image) return '';
  return image.startsWith('data:') || image.startsWith('/') || image.startsWith('http') ? image : `/${image}`;
};

// Image for a product in a given colour (falls back to the main image).
export const productImage = (product, color) =>
  imageSrc((product.colorImages && product.colorImages[color]) || product.image);

// Approximate swatch colours for common colour names typed by the admin.
const SWATCHES = {
  pink: '#f2c4cd', 'baby pink': '#f7d6dc', rose: '#d9a0a9', blush: '#f1d1cf',
  nude: '#e6c8b4', beige: '#e8d5bf', peach: '#f6c9ae', brown: '#8a5a44', mocha: '#7a5547',
  white: '#ffffff', ivory: '#fbf6ec', cream: '#f5ecd7', milky: '#f4efe9',
  black: '#1f1b1c', grey: '#9a9697', gray: '#9a9697',
  silver: '#c9c9cc', gold: '#d2b061', chrome: '#d7d8dc',
  red: '#b5202e', cherry: '#8e1a2a', wine: '#6d1d2c', maroon: '#6b2130', burgundy: '#6d1d2c',
  orange: '#e98a4b', coral: '#ef8a7a', yellow: '#efd26b',
  green: '#7fa37a', sage: '#a9b89d', mint: '#bfe3cf', olive: '#7d7a4a',
  blue: '#5b7fbf', 'baby blue': '#bcd6ef', navy: '#24345c', teal: '#3f8a8a',
  purple: '#8064a8', lilac: '#c8b6dd', lavender: '#cfc2e6', violet: '#7a4fa0',
  pearl: '#efe9e4', glitter: '#d9cfd6', transparent: '#f3eff0', clear: '#f3eff0',
};

export const swatchColor = (name = '') => {
  const key = name.trim().toLowerCase();
  if (SWATCHES[key]) return SWATCHES[key];
  const word = Object.keys(SWATCHES).find(k => key.includes(k));
  return word ? SWATCHES[word] : '#e7dfdc';
};

export const formatPrice = (value) => `₹${(Number(value) || 0).toFixed(2)}`;
