'use server'

import { createSafeActionClient } from "next-safe-action"
import type { ActionResponse } from "./types/actions"
import { schema } from "./schema"
import { extractTextFromFile, getSignedUrl, uploadFileToMistral } from "@/lib/ocr-extractor"

const action = createSafeActionClient()

export const processFile = action
  .schema(schema)
  .action(async ({ parsedInput }): Promise<ActionResponse> => {
    try {
      const file = parsedInput.file
      
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });

      const result = await uploadFileToMistral(file.name, blob);
      
      const url = await getSignedUrl(result.id);

      const ocrResult = await extractTextFromFile(url, file.type === 'application/pdf' ? 'pdf' : 'image');

      return {
        success: true,
        data: {
          filename: file.name,
          size: file.size,
          type: file.type,
          result: ocrResult,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process file"
      }
    }
  })
