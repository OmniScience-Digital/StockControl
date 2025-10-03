"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Minus, PlusCircle, Plus, Search, X } from "lucide-react";
import { Component, Category, SubCategory } from "@/types/form.types";
import Loading from "../component_loading";

interface ComponentItemProps {
  component: Component;
  setComponentsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  componentsLoading: boolean;
  availableKeys: string[];
  usedKeys: string[];
  onUpdate: (component: Component) => void;
  onRemove: () => void;
  isRemovable: boolean;
  onAddNewKey?: (newKey: string) => void;
  allComponents?: Component[];
  categories?: Category[];
  subCategories?: SubCategory[];
  usedComponentIds?: string[];
}

export default function ComponentItem({
  component,
  availableKeys,
  usedKeys,
  onUpdate,
  onRemove,
  isRemovable,
  onAddNewKey,
  componentsLoading,
  setComponentsLoading,
  allComponents = [],
  categories = [],
  subCategories = [],
  usedComponentIds = []
}: ComponentItemProps) {
  const [isAddingNewKey, setIsAddingNewKey] = useState<string | null>(null);
  const [newKeyInput, setNewKeyInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [componentSearchTerm, setComponentSearchTerm] = useState("");
  const [isAddingNewComponent, setIsAddingNewComponent] = useState(false);
  const [newComponentInput, setNewComponentInput] = useState("");
  const [localAvailableKeys, setLocalAvailableKeys] = useState<string[]>(availableKeys);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  
  // New states for adding categories
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");

  // Sync local availableKeys with prop changes
  useEffect(() => {
    setLocalAvailableKeys(availableKeys);
  }, [availableKeys]);

  const getFilteredComponents = () => {
    return allComponents.filter(comp =>
      comp.componentName?.toLowerCase().includes(componentSearchTerm.toLowerCase())
    );
  };

  const getFilteredCategories = () => {
    return categories.filter(cat =>
      cat.categoryName?.toLowerCase().includes(categorySearchTerm.toLowerCase())
    );
  };

  const isComponentDisabled = (componentId: string) => {
    if (componentId === component.id) return false;
    return usedComponentIds.includes(componentId);
  };

  const updateComponentSelection = (componentId: string) => {
    if (componentId === "__add_new_component__") {
      setIsAddingNewComponent(true);
      setNewComponentInput("");
      setComponentSearchTerm("");
      return;
    }

    const selectedComponent = allComponents.find(comp => comp.id === componentId);
    if (selectedComponent) {
      onUpdate({
        ...selectedComponent,
        id: component.id,
        subComponents: component.subComponents.length > 0 ? component.subComponents : [
          { id: `${Date.now()}-1`, key: "", value: "", componentId: component.id }
        ]
      });
    }
  };

  const startAddingNewComponent = () => {
    setIsAddingNewComponent(true);
    setNewComponentInput("");
    setComponentSearchTerm("");
  };

  const cancelAddingNewComponent = () => {
    setIsAddingNewComponent(false);
    setNewComponentInput("");
    setComponentSearchTerm("");
  };

  const confirmNewComponent = () => {
    if (newComponentInput.trim() && selectedCategoryId) {
      const newComponent: Component = {
        id: `new-${Date.now()}`,
        componentName: newComponentInput.trim(),
        subcategoryId: selectedCategoryId,
        subComponents: component.subComponents.length > 0 ? component.subComponents : [
          { id: `${Date.now()}-1`, key: "", value: "", componentId: `new-${Date.now()}` }
        ],
        isWithdrawal: component.isWithdrawal,
        description: "",
        primarySupplierId: "",
        primarySupplier: "",
        primarySupplierItemCode: "",
        secondarySupplierId: "",
        secondarySupplier: "",
        secondarySupplierItemCode: "",
        qtyExStock: 0,
        currentStock: 0,
        notes: "",
        history: ""
      };

      onUpdate(newComponent);
    }
    cancelAddingNewComponent();
  };

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === "__add_new_category__") {
      setIsAddingNewCategory(true);
      setNewCategoryInput("");
      setCategorySearchTerm("");
      return;
    }

    setSelectedCategoryId(categoryId);
    
    // Also reset component selection when category changes
    if (component.componentName) {
      onUpdate({
        ...component,
        componentName: "",
        subcategoryId: ""
      });
    }
  };

  const startAddingNewCategory = () => {
    setIsAddingNewCategory(true);
    setNewCategoryInput("");
    setCategorySearchTerm("");
  };

  const cancelAddingNewCategory = () => {
    setIsAddingNewCategory(false);
    setNewCategoryInput("");
    setCategorySearchTerm("");
  };

  const confirmNewCategory = () => {
    if (newCategoryInput.trim()) {
      // Just update the local state - no DB interaction
      setSelectedCategoryId(`new-cat-${Date.now()}`);
    }
    cancelAddingNewCategory();
  };

  const addSubComponent = () => {
    const newSubComponent = {
      id: `${component.id}-${Date.now()}`,
      key: "",
      value: "",
      componentId: component.id
    };
    onUpdate({
      ...component,
      subComponents: [...component.subComponents, newSubComponent]
    });
  };

  const removeSubComponent = (subComponentId: string) => {
    if (component.subComponents.length > 1) {
      onUpdate({
        ...component,
        subComponents: component.subComponents.filter(
          (sub) => sub.id !== subComponentId
        )
      });
    }
  };

  const updateSubComponentKey = (subComponentId: string, key: string) => {
    onUpdate({
      ...component,
      subComponents: component.subComponents.map((sub) =>
        sub.id === subComponentId ? { ...sub, key } : sub
      )
    });
  };

  const updateSubComponentValue = (subComponentId: string, value: string) => {
    const stringValue = value || "";
    onUpdate({
      ...component,
      subComponents: component.subComponents.map((sub) =>
        sub.id === subComponentId ? { ...sub, value: stringValue } : sub
      )
    });
  };

  const startAddingNewKey = (subComponentId: string) => {
    setIsAddingNewKey(subComponentId);
    setNewKeyInput("");
    setSearchTerm("");
  };

  const cancelAddingNewKey = () => {
    setIsAddingNewKey(null);
    setNewKeyInput("");
    setSearchTerm("");
  };

  const confirmNewKey = (subComponentId: string) => {
    if (newKeyInput.trim()) {
      const trimmedKey = newKeyInput.trim();

      setLocalAvailableKeys(prev => {
        const newKeys = prev.includes(trimmedKey) ? prev : [...prev, trimmedKey];
        return newKeys;
      });

      if (onAddNewKey) {
        onAddNewKey(trimmedKey);
      }

      updateSubComponentKey(subComponentId, trimmedKey);
    }
    cancelAddingNewKey();
  };

  const handleKeySelect = (subComponentId: string, value: string) => {
    if (value === "__add_new__") {
      startAddingNewKey(subComponentId);
    } else {
      updateSubComponentKey(subComponentId, value);
    }
  };

  const filteredKeys = localAvailableKeys.filter(key =>
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unusedKeys = localAvailableKeys.filter(key => !usedKeys.includes(key));
  const filteredComponents = getFilteredComponents();
  const filteredCategories = getFilteredCategories();

  // Get components that belong to the selected category
  const availableComponents = filteredComponents.filter(comp => {
    const compSubcategory = subCategories.find(sub => sub.id === comp.subcategoryId);
    return compSubcategory?.categoryId === selectedCategoryId;
  });

  useEffect(() => {
    if (allComponents.length > 0 && categories.length > 0) {
      setComponentsLoading(false);
    }
  }, [allComponents, categories, setComponentsLoading]);

  return (
    <div className="p-4 border rounded-lg space-y-4 bg-background shadow-sm">
      {/* Category Selection with Add New and Remove Button */}
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Category</label>
          {isAddingNewCategory ? (
            <div className="space-y-1">
              <div className="flex gap-2">
                <Input
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  placeholder="Enter new category name..."
                  className="flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmNewCategory();
                    if (e.key === 'Escape') cancelAddingNewCategory();
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={cancelAddingNewCategory}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={confirmNewCategory}
                  disabled={!newCategoryInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search categories..."
                      value={categorySearchTerm}
                      onChange={(e) => setCategorySearchTerm(e.target.value)}
                      className="pl-8 pr-8 h-9"
                    />
                    {categorySearchTerm && (
                      <X
                        className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 cursor-pointer"
                        onClick={() => setCategorySearchTerm("")}
                      />
                    )}
                  </div>
                </div>

                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.categoryName}
                  </SelectItem>
                ))}

                <div className="border-t mt-1 pt-1">
                  <SelectItem
                    value="__add_new_category__"
                    className="text-blue-600 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add New Category...
                  </SelectItem>
                </div>
              </SelectContent>
            </Select>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRemove}
          disabled={!isRemovable}
          className="shrink-0 mt-6"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Subcategory Selection (this is the Component from database) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Subcategory</label>
        {isAddingNewComponent ? (
          <div className="space-y-1">
            <div className="flex gap-2">
              <Input
                value={newComponentInput}
                onChange={(e) => setNewComponentInput(e.target.value)}
                placeholder="Enter new subcategory name..."
                className="flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmNewComponent();
                  if (e.key === 'Escape') cancelAddingNewComponent();
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={cancelAddingNewComponent}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                onClick={confirmNewComponent}
                disabled={!newComponentInput.trim() || !selectedCategoryId}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              Subcategory will be added to selected category
            </div>
          </div>
        ) : (
          <Select
            value={component.id}
            onValueChange={updateComponentSelection}
            disabled={!selectedCategoryId}
          >
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Select a subcategory">
                {component.componentName || "Select a subcategory..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {componentsLoading ? (
                <Loading />
              ) : (
                <>
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search subcategories..."
                        value={componentSearchTerm}
                        onChange={(e) => setComponentSearchTerm(e.target.value)}
                        className="pl-8 pr-8 h-9"
                      />
                      {componentSearchTerm && (
                        <X
                          className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 cursor-pointer"
                          onClick={() => setComponentSearchTerm("")}
                        />
                      )}
                    </div>
                  </div>

                  {availableComponents.map((comp) => (
                    <SelectItem
                      key={comp.id}
                      value={comp.id}
                      disabled={isComponentDisabled(comp.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span>{comp.componentName}</span>
                      {isComponentDisabled(comp.id) && comp.id !== component.id && (
                        <span className="text-xs text-red-500 ml-2">(already used)</span>
                      )}
                    </SelectItem>
                  ))}

                  <div className="border-t mt-1 pt-1">
                    <SelectItem
                      value="__add_new_component__"
                      className="text-blue-600 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add New Subcategory...
                    </SelectItem>
                  </div>
                </>
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Transaction Type */}
      <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
        <span className="font-semibold text-sm">Transaction Type:</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={component.isWithdrawal ? "outline" : "default"}
            size="sm"
            onClick={() => onUpdate({ ...component, isWithdrawal: false })}
            className={`flex items-center gap-2 ${!component.isWithdrawal ? "bg-green-600 hover:bg-green-700" : ""}`}
          >
            <Plus className="h-3 w-3" />
            Intake
          </Button>
          <Button
            type="button"
            variant={component.isWithdrawal ? "default" : "outline"}
            size="sm"
            onClick={() => onUpdate({ ...component, isWithdrawal: true })}
            className={`flex items-center gap-2 ${component.isWithdrawal ? "bg-red-600 hover:bg-red-700" : ""}`}
          >
            <Minus className="h-3 w-3" />
            Withdrawal
          </Button>
        </div>
      </div>

      {/* Subcomponents Section */}
      <div className="space-y-4 pl-6 border-l-2 border-blue-200">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-600">Subcomponents</h4>
          <span className="text-sm text-gray-500 bg-background px-2 py-1 rounded">
            {component.subComponents.length} subcomponent(s)
          </span>
        </div>

        {component.subComponents.map((subComponent) => (
          <div
            key={subComponent.id}
            className="flex items-center gap-4 p-4 border rounded-lg bg-background"
          >
            <div className="flex-1 min-w-0">
              {isAddingNewKey === subComponent.id ? (
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <Input
                      value={newKeyInput}
                      onChange={(e) => setNewKeyInput(e.target.value)}
                      placeholder="Enter new subcomponent name..."
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmNewKey(subComponent.id);
                        if (e.key === 'Escape') cancelAddingNewKey();
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={cancelAddingNewKey}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => confirmNewKey(subComponent.id)}
                      disabled={!newKeyInput.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {unusedKeys.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Suggestions: {unusedKeys.slice(0, 3).join(", ")}
                      {unusedKeys.length > 3 && `... and ${unusedKeys.length - 3} more`}
                    </div>
                  )}
                </div>
              ) : (
                <Select
                  value={subComponent.key}
                  onValueChange={(value) => handleKeySelect(subComponent.id, value)}
                >
                  <SelectTrigger className="relative cursor-pointer">
                    <SelectValue placeholder="Select or add subcomponent">
                      {subComponent.key || "Select a subcomponent..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Search subcomponents..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 pr-8 h-9"
                        />
                        {searchTerm && (
                          <X
                            className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 cursor-pointer"
                            onClick={() => setSearchTerm("")}
                          />
                        )}
                      </div>
                    </div>

                    {filteredKeys.length > 0 ? (
                      filteredKeys.map((key) => (
                        <SelectItem
                          key={key}
                          value={key}
                          disabled={usedKeys.includes(key) && subComponent.key !== key}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <span>{key}</span>
                          {usedKeys.includes(key) && subComponent.key !== key && (
                            <span className="text-xs text-red-500 ml-2">(used)</span>
                          )}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-gray-500 text-sm">
                        No subcomponents available
                      </div>
                    )}

                    <div className="border-t mt-1 pt-1">
                      <SelectItem
                        value="__add_new__"
                        className="text-blue-600 font-medium flex items-center gap-2 cursor-pointer"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Add New Subcomponent...
                      </SelectItem>
                    </div>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex-1">
              <Input
                type="number"
                step="1"
                value={subComponent.value}
                onChange={(e) => updateSubComponentValue(subComponent.id, e.target.value)}
                placeholder="Enter value"
                className="w-full"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeSubComponent(subComponent.id)}
              disabled={component.subComponents.length === 1}
              className="shrink-0 hover:border-red-300 hover:text-red-600 cursor-pointer"
              title="Remove subcomponent"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addSubComponent}
          className="flex items-center gap-2 w-full border-dashed hover:border-solid cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          Add Subcomponent
        </Button>
      </div>
    </div>
  );
}