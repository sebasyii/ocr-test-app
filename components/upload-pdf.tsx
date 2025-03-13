"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import { useOCRStore } from "@/lib/store";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "./ui/form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { onSubmitAction } from "@/app/formSubmit";
import { Loader2, X } from "lucide-react";
import { fileSchema } from "@/app/fileSchema";

type FormData = z.infer<typeof fileSchema>;

const UploadPDF = () => {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(onSubmitAction, {
    message: "",
    issues: [],
  });

  const { setLoading, setData, setError } = useOCRStore();

  // Handle form submission state
  useEffect(() => {
    // Update loading state
    setLoading(isPending);

    // Handle response
    if (state?.data) {
      setData(state.data);
    }

    // Handle redirect
    if (state?.redirect) {
      router.push(state.redirect);
    }

    // Handle errors
    if (state?.issues?.length) {
      setError(state.issues[0]);
    }
  }, [state, isPending, router, setLoading, setData, setError]);

  const form = useForm<FormData>({
    resolver: zodResolver(fileSchema),
    defaultValues: {
      file: undefined,
    },
  });

  return (
    <div>
      <Form {...form}>
        {state?.message !== "" && !state.issues && (
          <div className="text-red-500">{state.message}</div>
        )}
        {state?.issues && (
          <div className="text-red-500">
            <ul>
              {state.issues.map((issue) => (
                <li key={issue} className="flex gap-1">
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
        <form action={formAction}>
          <FormField
            control={form.control}
            name="file"
            render={(
              { field: { onChange, value, ...fieldProps } }, // eslint-disable-line
            ) => (
              <FormItem>
                <FormLabel>Upload File</FormLabel>
                <FormControl>
                  <Input
                    {...fieldProps}
                    type="file"
                    onChange={(event) =>
                      onChange(event.target.files && event.target.files[0])
                    }
                  />
                </FormControl>
                <FormDescription>
                  Upload a PDF or image file (max 5MB)
                </FormDescription>
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 /> : null}Upload
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default UploadPDF;
