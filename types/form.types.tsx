export interface Component {
  id: string;
  componentName: string;
  description?: string;
  primarySupplierId?: string;
  primarySupplier?: string;
  primarySupplierItemCode?: string;
  secondarySupplierId?: string;
  secondarySupplier?: string;
  secondarySupplierItemCode?: string;
  qtyExStock?: number;
  currentStock?: number;
  notes?: string;
  history?: string;
  subcategoryId: string;
  subcategory?: SubCategory;
  isWithdrawal: boolean;
  subComponents: SubComponent[]; // These are the "Components" in the UI
}

export interface SubComponent {
  id: string;
  key: string;
  value: string;
  componentId: string;
}

export interface Category {
  id: string;
  categoryName: string;
  subcategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  subcategoryName: string;
  categoryId: string;
  category?: Category;
  components: Component[];
}