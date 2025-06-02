import { SubcategoryItem, ConfigItem } from './types';

export const categoryService = {
  async fetchCategories(clientId: string): Promise<ConfigItem[]> {
    // Mock implementation
    return Promise.resolve([
      { id: '1', name: 'Category 1' },
      { id: '2', name: 'Category 2' }
    ]);
  },

  async fetchSubcategories(categoryId: string): Promise<SubcategoryItem[]> {
    // Mock implementation
    return Promise.resolve([
      { id: '1', name: 'Subcategory 1', categoryId: categoryId },
      { id: '2', name: 'Subcategory 2', categoryId: categoryId }
    ]);
  }
};
