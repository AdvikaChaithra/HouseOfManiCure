/**
 * Mock API Database Service
 * This file serves as the abstraction layer for our application's data.
 * Currently, it uses localStorage to simulate a database.
 * In the future, you can swap these implementations with real
 * fetch/axios calls to a backend REST API or Firebase without changing the frontend UI.
 */

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const initialProducts = [
  {
    id: "1",
    name: "Classic French Pearl",
    price: 25.00,
    colors: ["Pink", "Nude", "White"],
    image: "nail_product_1_1776175995380.png",
    discount: 10,
    description: "Elegant and timeless french tips with a subtle pearl finish."
  },
  {
    id: "2",
    name: "Midnight Glam",
    price: 35.00,
    colors: ["Black", "Silver", "Gold"],
    image: "nail_product_2_1776176237339.png",
    discount: 0,
    description: "Stunning glossy black stiletto nails with silver rhinestones."
  }
];

const initialDeals = [
  {
    id: "1",
    title: "Festival Glam Sale!",
    description: "Get 20% off all rhinestone designs for this festival season.",
    image: "festival_deal_banner_1776176332234.png",
    active: true
  }
];

const initialShapes = [
  { id: "1", name: "Almond", image: "Almond_nails.webp" },
  { id: "2", name: "Coffin", image: "Coffin_shape.jpeg" },
  { id: "3", name: "Square", image: "square_nails.webp" }
];

// Orders are sent to this WhatsApp number with the message pre-typed
// (digits only, as required by wa.me links)
export const ADMIN_WHATSAPP = "917795041915";

// Instagram is used for design questions and the profile link
export const ADMIN_INSTAGRAM = "little_love_lately";

const readList = (key) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// localStorage has a ~5MB limit; uploaded base64 images can exceed it.
const saveList = (key, list) => {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    if (err?.name === 'QuotaExceededError') {
      throw new Error("Storage is full. Please use smaller images or delete some old items.", { cause: err });
    }
    throw err;
  }
};

// Ensure initial data exists
if (!localStorage.getItem('nails_products')) {
  saveList('nails_products', initialProducts);
}
if (!localStorage.getItem('nails_deals')) {
  saveList('nails_deals', initialDeals);
}
// Seed default shapes once (older installs stored an empty list).
// The flag stops shapes coming back after the admin deletes them all.
if (!localStorage.getItem('nails_shapes_seeded')) {
  if (readList('nails_shapes').length === 0) {
    saveList('nails_shapes', initialShapes);
  }
  localStorage.setItem('nails_shapes_seeded', '1');
}

// === Products API ===
export const getProducts = async () => {
  await delay(400); // Simulate network latency
  return readList('nails_products');
};

export const addProduct = async (product) => {
  await delay(400);
  const products = await getProducts();
  const newProduct = { ...product, id: Date.now().toString() };
  products.push(newProduct);
  saveList('nails_products', products);
  return newProduct;
};

export const updateProduct = async (updatedProduct) => {
  await delay(400);
  let products = await getProducts();
  const index = products.findIndex(p => p.id === updatedProduct.id);
  if (index !== -1) {
    products[index] = updatedProduct;
    saveList('nails_products', products);
  }
  return updatedProduct;
};

export const deleteProduct = async (id) => {
  await delay(400);
  const products = await getProducts();
  const filtered = products.filter(p => p.id !== id);
  saveList('nails_products', filtered);
  return true;
};

// === Deals API ===
export const getDeals = async () => {
  await delay(400);
  return readList('nails_deals');
};

export const addDeal = async (deal) => {
  await delay(400);
  const deals = await getDeals();
  const newDeal = { ...deal, id: Date.now().toString() };
  deals.push(newDeal);
  saveList('nails_deals', deals);
  return newDeal;
};

export const deleteDeal = async (id) => {
  await delay(400);
  const deals = await getDeals();
  const filtered = deals.filter(d => d.id !== id);
  saveList('nails_deals', filtered);
  return true;
};

// === Shapes API ===
export const getShapes = async () => {
  await delay(300);
  return readList('nails_shapes');
};

export const addShape = async (shape) => {
  await delay(300);
  const shapes = await getShapes();
  const newShape = { ...shape, id: Date.now().toString() };
  shapes.push(newShape);
  saveList('nails_shapes', shapes);
  return newShape;
};

export const deleteShape = async (id) => {
  await delay(300);
  const shapes = await getShapes();
  const filtered = shapes.filter(s => s.id !== id);
  saveList('nails_shapes', filtered);
  return true;
};

// === Auth API ===
export const loginUser = async (rawPhone, password) => {
  await delay(500);
  const phone = rawPhone.trim();
  // Hardcoded Admin logic
  if (phone === "7795041915" && password === "admin123") {
    const admin = { id: "0", name: "Admin", phone, role: "admin" };
    localStorage.setItem('nails_user', JSON.stringify(admin));
    return admin;
  }
  
  // Normal users
  const users = readList('nails_users');
  const user = users.find(u => u.phone === phone && u.password === password);
  if (user) {
    const userData = { id: user.id, name: user.name, phone: user.phone, role: "user", address: user.address };
    localStorage.setItem('nails_user', JSON.stringify(userData));
    return userData;
  }
  throw new Error("Invalid phone number or password");
};

export const signupUser = async (userData) => {
  await delay(500);
  userData = { ...userData, name: userData.name.trim(), phone: userData.phone.trim() };
  const users = readList('nails_users');
  if (userData.phone === "7795041915" || users.find(u => u.phone === userData.phone)) {
    throw new Error("Phone number already registered. Please login.");
  }
  
  const newUser = { ...userData, id: Date.now().toString(), role: "user" };
  users.push(newUser);
  saveList('nails_users', users);
  
  // Auto login after signup
  const returnUser = { id: newUser.id, name: newUser.name, phone: newUser.phone, role: "user", address: newUser.address };
  localStorage.setItem('nails_user', JSON.stringify(returnUser));
  return returnUser;
};

export const logoutUser = async () => {
  await delay(200);
  localStorage.removeItem('nails_user');
  return true;
};

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('nails_user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};
