
import { useState } from 'react';
import { ConfigItem, SubcategoryItem, SectionItem, ClassItem, CampusItem } from '@/contexts/types';

export function useLocalStorageInitialization<T>(key: string, initialValue: T): T {
  return useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  })[0];
}

