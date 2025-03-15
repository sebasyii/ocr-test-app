import { z } from "zod";
import { zfd } from "zod-form-data";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

export const schema = zfd.formData({
  file: zfd
    .file()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      "File size must be less than 5MB",
    )
    .refine(
      (file) => !file || ACCEPTED_FILE_TYPES.includes(file.type),
      "File type must be PDF, JPEG, JPG, or PNG",
    ),
});

export type FormData = z.infer<typeof schema>;
