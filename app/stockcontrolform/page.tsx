"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import ComponentItem from "./Components/form";
import { Component, Category, SubCategory } from "@/types/form.types";
import Navbar from "@/components/layout/navbar";
import ResponseModal from "@/components/widgets/response";
import { client } from "@/services/schema";
import Footer from "@/components/layout/footer";
import Loading from "@/components/widgets/loading";

export default function ComponentForm() {
  const [allComponents, setAllComponents] = useState<Component[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [displayedComponents, setDisplayedComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");

  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  // In parent component, add selectedCategoryIds state
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Record<string, string>>({});


  // Fetch categories, subcategories, and components
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setCategoriesLoading(true);

      try {
        // Fetch categories
        const { data: categoriesData, errors: categoriesErrors } =
          await client.models.Category.list();

        if (categoriesErrors) {
          console.error("Error fetching categories:", categoriesErrors);
          return;
        }

        // Fetch all subcategories
        const { data: subcategoriesData, errors: subcategoriesErrors } =
          await client.models.SubCategory.list();

        if (subcategoriesErrors) {
          console.error("Error fetching subcategories:", subcategoriesErrors);
          return;
        }

        // Fetch all components
        const { data: componentsData, errors: componentsErrors } =
          await client.models.Component.list();

        if (componentsErrors) {
          console.error("Error fetching components:", componentsErrors);
          return;
        }

        // Build categories with subcategories
        const categoriesWithSubs: Category[] = (categoriesData || []).map(category => ({
          id: category.id,
          categoryName: category.categoryName,
          subcategories: (subcategoriesData || [])
            .filter(sub => sub.categoryId === category.id)
            .map(sub => ({
              id: sub.id,
              subcategoryName: sub.subcategoryName,
              categoryId: sub.categoryId,
              components: (componentsData || [])
                .filter(comp => comp.subcategoryId === sub.id)
                .map(comp => ({
                  id: comp.id,
                  componentName: comp.componentName || "",
                  description: comp.description || "",
                  primarySupplierId: comp.primarySupplierId || "",
                  primarySupplier: comp.primarySupplier || "",
                  primarySupplierItemCode: comp.primarySupplierItemCode || "",
                  secondarySupplierId: comp.secondarySupplierId || "",
                  secondarySupplier: comp.secondarySupplier || "",
                  secondarySupplierItemCode: comp.secondarySupplierItemCode || "",
                  qtyExStock: comp.qtyExStock || 0,
                  currentStock: comp.currentStock || 0,
                  notes: comp.notes || "",
                  history: comp.history || "",
                  subcategoryId: comp.subcategoryId,
                  isWithdrawal: false,
                  subComponents: []
                }))
            }))
        }));

        // Flatten all components for easy access
        const allComponentsFlat: Component[] = categoriesWithSubs.flatMap(category =>
          category.subcategories.flatMap(sub => sub.components)
        );

        // Flatten all subcategories
        const allSubcategories: SubCategory[] = categoriesWithSubs.flatMap(category =>
          category.subcategories
        );

        setCategories(categoriesWithSubs);
        setSubCategories(allSubcategories);
        setAllComponents(allComponentsFlat);

        // Start with one empty component automatically AFTER data is loaded
        if (displayedComponents.length === 0) {
          addNewComponent();
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setCategoriesLoading(false);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update the updateComponent function to handle category changes
  const updateComponent = (id: string, updatedComponent: Component) => {
    setDisplayedComponents(
      displayedComponents.map((component) =>
        component.id === id ? updatedComponent : component
      )
    );
  };

  // Add proper type annotation
  const updateComponentCategory = (componentId: string, categoryId: string) => {
    setSelectedCategoryIds(prev => ({
      ...prev,
      [componentId]: categoryId
    }));
  };


  const getFilteredKeysForComponent = (componentName: string): string[] => {
    if (!componentName) return [];
    return availableKeys;
  };

  const getUsedComponentIds = (currentComponentId?: string): string[] => {
    return displayedComponents
      .filter(comp => comp.id !== currentComponentId && comp.componentName.trim() !== "")
      .map(comp => comp.id);
  };

  const addNewComponent = () => {
    const newComponent: Component = {
      id: Date.now().toString(),
      componentName: "",
      subcategoryId: "",
      isWithdrawal: false,
      subComponents: [
        {
          id: `${Date.now()}-1`,
          key: "",
          value: "",
          componentId: Date.now().toString()
        }
      ]
    };

    setDisplayedComponents([newComponent, ...displayedComponents]);
  };

  const removeComponent = (id: string) => {
    setDisplayedComponents(displayedComponents.filter((component) => component.id !== id));
  };


  const handleAddNewKey = (newKey: string) => {
    if (!availableKeys.includes(newKey)) {
      setAvailableKeys(prev => [...prev, newKey]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      setLoading(true);
      e.preventDefault();
      
      const savedUser = localStorage.getItem("user");

      console.log(displayedComponents);

      const result = displayedComponents.reduce((acc, component) => {
        if (component.componentName.trim() !== "" && component.categoryName) {
          const subAcc = component.subComponents.reduce((subAcc, sub) => {
            if (sub.key.trim() !== "") {
              subAcc[sub.key] = { value: sub.value };
            }
            return subAcc;
          }, {} as Record<string, { value: string }>);

          if (Object.keys(subAcc).length > 0) {
            if (!acc[component.categoryName]) {
              acc[component.categoryName] = {};
            }

            const subKey = component.subcategoryName || component.componentName;

            acc[component.categoryName][subKey] = {
              isWithdrawal: component.isWithdrawal,
              subComponents: subAcc
            };
          }
        }
        return acc;
      }, {} as Record<string, any>);


      console.log(result);

      //Your existing API call
      const res = await fetch("/api/click-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: savedUser,
          result: result
        }),
      });

      const resResponse = await res.json();

      setMessage(resResponse.message || "Successfully published to ClickUp");
      setShow(true);
      setSuccessful(resResponse.success);


      // Reset form
      setDisplayedComponents([
        {
          id: Date.now().toString(),
          componentName: "",
          subcategoryId: "",
          categoryName: "",
          subcategoryName: "",
          isWithdrawal: false,
          subComponents: [
            {
              id: `${Date.now()}-1`,
              key: "",
              value: "",
              componentId: Date.now().toString()
            }
          ]
        }
      ]);
      setAvailableKeys([]);

    } catch (error) {
      console.error(error);
      setSuccessful(false);
      setMessage("Failed to publish to ClickUp");
      setShow(true);
    } finally {
      setLoading(false);
    }
  };


  const handleAddNewSubcategory = async (categoryId: string, subcategoryName: string): Promise<string | null> => {
    const newSubcategory = {
      id: `new-sub-${Date.now()}`,
      subcategoryName: subcategoryName,
      categoryId: categoryId,
      components: []
    };

    setSubCategories(prev => [...prev, newSubcategory]);
    return Promise.resolve(newSubcategory.id); // Wrap in Promise.resolve
  };
  const getUsedKeys = () => {
    const usedKeys: string[] = [];
    displayedComponents.forEach(component => {
      component.subComponents.forEach(sub => {
        if (sub.key) usedKeys.push(sub.key);
      });
    });
    return usedKeys;
  };


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      {loading || categoriesLoading ? (
        <Loading />
      ) : (
        <main className="flex-1 p-6 mt-20 min-h-screen">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  Stock Control Form
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <form onSubmit={handleSubmit} className="space-y-6 min-w-[600px]">
                    {/* Add Subcategory Button */}
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addNewComponent}
                        className="cursor-pointer"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                      </Button>
                    </div>


                    {displayedComponents.map((component) => (
                      <ComponentItem
                        key={component.id}
                        componentsLoading={componentsLoading || categoriesLoading}
                        setComponentsLoading={setComponentsLoading}
                        component={component}
                        selectedCategoryId={selectedCategoryIds[component.id] || ""}
                        onCategoryChange={(categoryId) => updateComponentCategory(component.id, categoryId)}
                        availableKeys={getFilteredKeysForComponent(component.componentName)}
                        usedKeys={getUsedKeys()}
                        usedComponentIds={getUsedComponentIds(component.id)}
                        allComponents={allComponents}
                        categories={categories}
                        subCategories={subCategories}
                        onUpdate={(updatedComponent) => updateComponent(component.id, updatedComponent)}
                        onRemove={() => removeComponent(component.id)}
                        isRemovable={true}
                        onAddNewKey={handleAddNewKey}
                        onAddNewSubcategory={handleAddNewSubcategory}
                      />
                    ))}

                    {/* Submit Button */}
                    {displayedComponents.length > 0 && (
                      <div className="flex justify-end pt-4">
                        <Button type="submit" className="cursor-pointer" disabled={loading}>
                          Submit
                          {loading && (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          )}
                        </Button>
                      </div>
                    )}
                  </form>

                  {show && (
                    <ResponseModal
                      successful={successful}
                      message={message}
                      setShow={setShow}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      )}

      <Footer />
    </div>
  );
}