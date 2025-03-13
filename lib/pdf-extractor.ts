"use server";

import { Mistral } from "@mistralai/mistralai";
import { OCRResponse } from "@mistralai/mistralai/models/components";

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey });

export async function extractTextFromPDF(
  fileName: string,
  base64Data: string
): Promise<OCRResponse> {
  const response = await client.ocr.process({
    model: "mistral-ocr-latest",
    document: {
      documentName: fileName,
      documentUrl: `data:application/pdf;base64,${base64Data}`,
    },
    includeImageBase64: true,
  });
  console.log(response);
  return response;
}
