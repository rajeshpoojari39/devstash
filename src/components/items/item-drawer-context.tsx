"use client";

import * as React from "react";
import { ItemDrawer } from "@/components/items/item-drawer";

interface ItemDrawerContextValue {
  isOpen: boolean;
  selectedItemId: string | null;
  openDrawer: (id: string) => void;
  closeDrawer: () => void;
}

const ItemDrawerContext = React.createContext<ItemDrawerContextValue | null>(
  null,
);

export function ItemDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(
    null,
  );

  const openDrawer = React.useCallback((id: string) => {
    setSelectedItemId(id);
    setIsOpen(true);
  }, []);

  const closeDrawer = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      isOpen,
      selectedItemId,
      openDrawer,
      closeDrawer,
    }),
    [isOpen, selectedItemId, openDrawer, closeDrawer],
  );

  return (
    <ItemDrawerContext.Provider value={contextValue}>
      {children}
      <ItemDrawer />
    </ItemDrawerContext.Provider>
  );
}

export function useItemDrawer() {
  const context = React.useContext(ItemDrawerContext);
  if (!context) {
    throw new Error("useItemDrawer must be used within an ItemDrawerProvider");
  }
  return context;
}
