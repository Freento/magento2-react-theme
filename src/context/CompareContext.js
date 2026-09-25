import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  GET_COMPARE_LIST,
  CREATE_COMPARE_LIST,
  ADD_PRODUCTS_TO_COMPARE_LIST,
  REMOVE_PRODUCTS_FROM_COMPARE_LIST,
} from '../queries/compare';

const STORAGE_KEY = 'compareListUid';

const CompareContext = createContext();

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};

export const CompareProvider = ({ children }) => {
  const [uid, setUid] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const clearLastAction = useCallback(() => setLastAction(null), []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUid(stored);
    } catch { /* storage unavailable */ }
  }, []);

  const storeUid = useCallback((value) => {
    setUid(value);
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* storage unavailable */ }
  }, []);

  const { data, loading, refetch } = useQuery(GET_COMPARE_LIST, {
    variables: { uid },
    skip: !uid,
    onError: (err) => {
      if (err?.graphQLErrors?.length) storeUid(null);
    },
  });

  const [createCompareList] = useMutation(CREATE_COMPARE_LIST);
  const [addProductsToCompareList] = useMutation(ADD_PRODUCTS_TO_COMPARE_LIST);
  const [removeProductsFromCompareList] = useMutation(REMOVE_PRODUCTS_FROM_COMPARE_LIST);

  const compareList = data?.compareList || null;
  const compareItems = compareList?.items || [];

  const isInCompare = useCallback(
    (productId) => compareItems.some((item) => String(item.product?.id) === String(productId)),
    [compareItems]
  );

  const notify = useCallback((type, list, productId) => {
    const name = (list?.items || []).find((i) => String(i.product?.id) === String(productId))?.product?.name;
    setLastAction({ type, name, at: Date.now() });
  }, []);

  const notice = useCallback((message) => {
    setLastAction({ type: 'notice', message, at: Date.now() });
  }, []);

  const notifyError = useCallback((err) => {
    const message = err?.graphQLErrors?.[0]?.message || 'Something went wrong — please try again.';
    setLastAction({ type: 'error', message, at: Date.now() });
  }, []);

  const addToCompare = useCallback(async (productId) => {
    try {
      if (!uid) {
        const result = await createCompareList({ variables: { products: [String(productId)] } });
        const created = result.data?.createCompareList;
        if (created?.uid) storeUid(created.uid);
        notify('added', created, productId);
        return;
      }
      try {
        const result = await addProductsToCompareList({ variables: { uid, products: [String(productId)] } });
        notify('added', result.data?.addProductsToCompareList, productId);
      } catch (err) {
        const gone = err?.graphQLErrors?.some((e) => /find a compare list/i.test(e.message || ''));
        if (!gone) throw err;
        const result = await createCompareList({ variables: { products: [String(productId)] } });
        const created = result.data?.createCompareList;
        if (created?.uid) storeUid(created.uid);
        notify('added', created, productId);
      }
    } catch (err) {
      notifyError(err);
      throw err;
    }
  }, [uid, createCompareList, addProductsToCompareList, storeUid, notify, notifyError]);

  const removeFromCompare = useCallback(async (productId) => {
    if (!uid) return;
    const name = compareItems.find((i) => String(i.product?.id) === String(productId))?.product?.name;
    try {
      await removeProductsFromCompareList({ variables: { uid, products: [String(productId)] } });
    } catch (err) {
      notifyError(err);
      throw err;
    }
    setLastAction({ type: 'removed', name, at: Date.now() });
  }, [uid, compareItems, removeProductsFromCompareList, notifyError]);

  const toggleCompare = useCallback(async (productId) => {
    if (isInCompare(productId)) await removeFromCompare(productId);
    else await addToCompare(productId);
  }, [isInCompare, addToCompare, removeFromCompare]);

  const clearCompare = useCallback(async () => {
    if (!uid || !compareItems.length) return;
    try {
      await removeProductsFromCompareList({
        variables: { uid, products: compareItems.map((item) => String(item.product.id)) },
      });
    } catch (err) {
      notifyError(err);
      throw err;
    }
    setLastAction({ type: 'cleared', at: Date.now() });
  }, [uid, compareItems, removeProductsFromCompareList, notifyError]);

  const value = {
    compareList,
    compareItems,
    compareCount: compareList?.item_count || 0,
    loading,
    isInCompare,
    addToCompare,
    removeFromCompare,
    toggleCompare,
    clearCompare,
    refetch,
    notice,
    lastAction,
    clearLastAction,
  };

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
};
