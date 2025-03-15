import { OCRResponse } from "@mistralai/mistralai/models/components";

export interface ActionResponse {
  success: boolean;
  data?: {
    filename: string;
    size: number;
    type: string;
    result?: OCRResponse;
  };
  error?: string;
}
