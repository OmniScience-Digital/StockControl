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
import { Component } from "@/types/form.types";
import { useState } from "react";

interface ComponentItemProps {
  component: Component;
  availableKeys: string[];
  usedKeys: string[];
  onUpdate: (component: Component) => void;
  onRemove: () => void;
  isRemovable: boolean;
  onAddNewKey?: (newKey: string) => void; // New prop for adding keys
}

export default function ComponentItem({
  component,
  availableKeys,
  usedKeys,
  onUpdate,
  onRemove,
  isRemovable,
  onAddNewKey
}: ComponentItemProps) {
  const [isAddingNewKey, setIsAddingNewKey] = useState<string | null>(null);
  const [newKeyInput, setNewKeyInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const updateComponentName = (name: string) => {
    onUpdate({ ...component, name });
  };

  const addSubComponent = () => {
    const newSubComponent = {
      id: `${component.id}-${Date.now()}`,
      key: "",
      value: 0,
      isWithdrawal: false
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
    const numValue = parseFloat(value) || 0;
    onUpdate({
      ...component,
      subComponents: component.subComponents.map((sub) =>
        sub.id === subComponentId ? { ...sub, value: numValue } : sub
      )
    });
  };

  const toggleWithdrawal = (subComponentId: string) => {
    onUpdate({
      ...component,
      subComponents: component.subComponents.map((sub) =>
        sub.id === subComponentId
          ? { ...sub, isWithdrawal: !sub.isWithdrawal }
          : sub
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
    if (newKeyInput.trim() && onAddNewKey) {
      onAddNewKey(newKeyInput.trim());
      updateSubComponentKey(subComponentId, newKeyInput.trim());
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

  // Filter available keys based on search term
  const filteredKeys = availableKeys.filter(key =>
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unused keys for the "Add new" suggestions
  const unusedKeys = availableKeys.filter(key => !usedKeys.includes(key));

  return (
    <div className="p-4 border rounded-lg space-y-4 bg-background shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            value={component.name}
            onChange={(e) => updateComponentName(e.target.value)}
            placeholder="Component name (e.g., Speed Sensor)"
            className="w-full"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRemove}
          disabled={!isRemovable}
          className="shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 pl-6 border-l-2 border-blue-200">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-700">Subcomponents</h4>
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
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newKeyInput}
                      onChange={(e) => setNewKeyInput(e.target.value)}
                      placeholder="Enter new key name..."
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
                    <SelectValue placeholder="Select or add subcomponent" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {/* Search Input */}
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Search keys..."
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

                    {/* Available Keys */}
                    {filteredKeys.map((key) => (
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
                    ))}

                    {/* Add New Option - Always visible */}
                    <div className="border-t mt-1 pt-1">
                      <SelectItem 
                        value="__add_new__"
                        className="text-blue-600 font-medium flex items-center gap-2 cursor-pointer"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Add New Key...
                      </SelectItem>
                    </div>

                    {/* Empty State */}
                    {filteredKeys.length === 0 && searchTerm && (
                      <div className="p-2 text-center text-gray-500 text-sm">
                        No keys found matching "{searchTerm}"
                        <div className="mt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startAddingNewKey(subComponent.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <PlusCircle className="h-3 w-3 mr-1" />
                            Add "{searchTerm}" as new key
                          </Button>
                        </div>
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex-1">
              <Input
                type="number"
                step="0.01"
                value={subComponent.value}
                onChange={(e) => updateSubComponentValue(subComponent.id, e.target.value)}
                placeholder="Enter value"
                className="w-full"
              />
            </div>

            <Button
              type="button"
              variant={subComponent.isWithdrawal ? "destructive" : "outline"}
          className={`cursor-pointer ${
                subComponent.isWithdrawal 
                  ? "" 
                  : "border-green-500 text-green-600 hover:bg-green-50"
              }`}

              size="icon"
              onClick={() => toggleWithdrawal(subComponent.id)}
              title={subComponent.isWithdrawal ? "Withdrawal" : "Addition"}
            >
              {subComponent.isWithdrawal ? (
                <Minus className="h-4 w-4" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
            </Button>

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