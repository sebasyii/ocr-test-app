"use server";

import { Mistral } from "@mistralai/mistralai";
import { OCRResponse } from "@mistralai/mistralai/models/components";

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey });

export async function uploadFileToMistral(fileName: string, fileBuffer: Blob) {
  const result = await client.files.upload({
    file: {
      fileName: fileName,
      content: fileBuffer,
    },
    // @ts-expect-error Ignore the ts error here, it's a known issue with the Mistral SDK
    purpose: "ocr",
  });

  return result;
}

export async function getSignedUrl(fileId: string) {
  const result = await client.files.getSignedUrl({
    fileId: fileId,
  });

  return result.url;
}

export async function extractTextFromFile(fileUrl: string, fileType: "pdf" | "image"): Promise<OCRResponse> {
  let response: OCRResponse;
  if (fileType === 'pdf') {
    response = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        documentUrl: fileUrl,
      },
      includeImageBase64: true,
    });
  } else {
    response = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "image_url",
        imageUrl: fileUrl,
      },
      includeImageBase64: true,
    });
  }

  return response;
}
