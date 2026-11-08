import React, { createContext, useState, useContext, useEffect } from 'react';
import { getProducts, getDeals, getShapes, addShape, deleteShape, addProduct, updateProduct, deleteProduct, addDeal, deleteDeal } from '../api';

const StoreContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedProducts, fetchedDeals, fetchedShapes] = await Promise.all([
          getProducts(),
          getDeals(),
          getShapes()
        ]);
        setProducts(fetchedProducts);
        setDeals(fetchedDeals);
        setShapes(fetchedShapes);
      } catch (err) {
        console.error("Error fetching store data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const createProduct = async (data) => {
    const newProduct = await addProduct(data);
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  };

  const modifyProduct = async (updatedProduct) => {
    const updated = await updateProduct(updatedProduct);
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    return updated;
  };

  const removeProduct = async (id) => {
    await deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };
  
  const createDeal = async (data) => {
    const newDeal = await addDeal(data);
    setDeals(prev => [...prev, newDeal]);
    return newDeal;
  };

  const removeDeal = async (id) => {
    await deleteDeal(id);
    setDeals(prev => prev.filter(d => d.id !== id));
  };
  
  const createShape = async (data) => {
    const newShape = await addShape(data);
    setShapes(prev => [...prev, newShape]);
    return newShape;
  };

  const removeShape = async (id) => {
    await deleteShape(id);
    setShapes(prev => prev.filter(s => s.id !== id));
  };

  return (
    <StoreContext.Provider value={{
      products, deals, shapes, loading,
      createProduct, modifyProduct, removeProduct,
      createDeal, removeDeal,
      createShape, removeShape
    }}>
      {children}
    </StoreContext.Provider>
  );
};
