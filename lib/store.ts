import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OCRPage {
  index: number;
  markdown: string;
  images: any[];
  dimensions?: any | null;
}

export interface OCRResponse {
  pages: OCRPage[];
  model: string;
  usageInfo?: {
    pagesProcessed?: number | null;
    docSizeBytes?: number | null;
  };
}


interface OCRState {
  data: OCRResponse | null;
  isLoading: boolean;
  error: string | null;
  setData: (data: OCRResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useOCRStore = create<OCRState>()(
  persist(
    (set) => ({
      data: null,
      isLoading: false,
      error: null,
      setData: (data) => set({ data, error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
      reset: () => set({ data: null, isLoading: false, error: null }),
    }),
    {
      name: 'ocr-storage',
    }
  )
);
