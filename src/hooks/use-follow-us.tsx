import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { FollowUsModal } from "@/components/site/FollowUsModal";

type Ctx = { open: () => void; close: () => void };
const FollowUsCtx = createContext<Ctx>({ open: () => {}, close: () => {} });

export function FollowUsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return (
    <FollowUsCtx.Provider value={{ open, close }}>
      {children}
      <FollowUsModal open={isOpen} onOpenChange={setIsOpen} />
    </FollowUsCtx.Provider>
  );
}

export const useFollowUs = () => useContext(FollowUsCtx);
