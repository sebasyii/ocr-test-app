"use server";

import { Mistral } from "@mistralai/mistralai";
import { fileSchema } from "./fileSchema";
import type { OCRResponse } from "@/lib/store";

export type FormState = {
  message: string;
  fields?: Record<string, string>;
  issues?: string[];
  data?: OCRResponse;
  redirect?: string;
};

export async function onSubmitAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return {
        message: "",
        issues: ["Please select a file"],
      };
    }

    // Validate with zod
    const result = await fileSchema.safeParseAsync({ file });
    console.log("Validation result:", result);

    if (!result.success) {
      return {
        message: "Invalid form data",
        issues: result.error.issues.map((err) => err.message),
      };
    }

    const mistral = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY,
    })

    const data = await file.arrayBuffer();

    const response = await mistral.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        documentName: file.name,
        documentUrl: "data:application/pdf;base64," + Buffer.from(data).toString("base64"),
      },
      includeImageBase64: true,
    })

    console.log("OCR response:", response.pages);

    // Return the OCR response data
    return {
      message: "File uploaded successfully",
      issues: [],
      data: response,
      redirect: "/results"
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      message: "",
      issues: ["An unexpected error occurred while uploading the file"],
    };
  }
}
