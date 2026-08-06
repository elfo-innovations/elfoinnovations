import { createContext, useContext, useState, type ReactNode } from "react";
import { InquiryModal } from "@/components/inquiry/InquiryModal";

const Ctx = createContext<{ open: () => void; close: () => void }>({ open: () => {}, close: () => {} });

export function InquiryProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  return (
    <Ctx.Provider value={{ open: () => setOpen(true), close: () => setOpen(false) }}>
      {children}
      <InquiryModal open={isOpen} onClose={() => setOpen(false)} />
    </Ctx.Provider>
  );
}

export const useInquiry = () => useContext(Ctx);
