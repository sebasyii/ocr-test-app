"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Check, FileText, Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { FormData, schema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField } from "@/components/ui/form";
import { toast } from "sonner";
import { processFile } from "./process-file-action";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { OCRImageObject } from "@mistralai/mistralai/models/components";

interface MarkdownImageProps {
  src?: string;
  alt?: string;
}

const MarkdownImage = ({ src, alt }: MarkdownImageProps) => {
  // Early return with null if src is undefined
  if (!src) return null;

  // For base64 images, use regular img tag since Next.js Image doesn't support data URLs well
  if (src.startsWith('data:')) {
    return (
        <img
          src={src}
          alt={alt || 'Document image'}
          className="mx-auto max-h-[600px] w-auto object-contain"
        />
    );
  }

  // For regular URLs, use Next.js Image component
  return (
      <Image
        src={src}
        alt={alt || 'Document image'}
        width={800}
        height={600}
        className="object-contain"
        priority={false}
        quality={75}
      />
  );
};


export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<string>("");
  const [activeTab, setActiveTab] = useState("upload");

  const { executeAsync, result, status } = useAction(processFile);

  const replaceImage = (
    markdown: string,
    arrOfImages: Array<OCRImageObject>,
  ) => {
    // markdown will have ![image](url) syntax.
    // We need to replace the url with data url. ![image](data:image/(filetype);base64,(data))
    const regex = /!\[(.*?)\]\((.*?)\)/g;
    
    let newMarkdown = markdown;
    let match;
    
    // Use exec to iterate through all matches while maintaining the lastIndex
    while ((match = regex.exec(markdown)) !== null) {
      const [fullMatch, altText, url] = match;
      const image = arrOfImages.find((img) => img.id === url);
      
      if (image?.imageBase64) {
        // Create the new markdown image syntax with the base64 data
        const replacement = `![${altText}](${image.imageBase64})`;
        
        // Replace only this specific occurrence
        newMarkdown = newMarkdown.replace(fullMatch, replacement);
      }
    }

    return newMarkdown;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  console.log(results)

  useEffect(() => {
    if (status === "hasSucceeded" && result) {
      // Simulate progress updates while processing
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            setProcessing(false);
            setActiveTab("results");
            if (result.data?.data?.result) {
              setResults(
                result.data?.data?.result?.pages
                  .map((page) => replaceImage(page.markdown, page.images))
                  .join("\n\n"),
              );
            }
          }
          return newProgress;
        });
      }, 300);
    } else if (status === "hasErrored") {
      const errorMessage = result?.serverError || "Failed to process file";
      toast.error(errorMessage);
      setProcessing(false);
    }
  }, [status, result]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
      "application/pdf": [".pdf"],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 1) {
        toast.error("Only one file is supported");
        return;
      }
      setFiles(acceptedFiles);
    },
  });

  const clearFiles = () => {
    setFiles([]);
    setResults("");
    setProgress(0);
    setActiveTab("upload");
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            OCR Document Scanner
          </h1>
          <p className="text-muted-foreground">
            Upload images or PDFs to extract text
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="processing" disabled={files.length === 0}>
              Processing
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!results}>
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <Form {...form}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (files.length === 0) return;

                  const file = files[0];
                  setProcessing(true);
                  setProgress(0);
                  setResults("");
                  setActiveTab("processing");

                  await executeAsync({ file });
                }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Files</CardTitle>
                    <CardDescription>
                      Drag and drop files or click to browse. Supported formats:
                      JPG, PNG, PDF
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="file"
                      render={() => (
                        <div
                          {...getRootProps()}
                          className={`cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
                            isDragActive
                              ? "border-primary bg-primary/5"
                              : "border-muted-foreground/25 hover:border-primary/50"
                          }`}
                        >
                          <input {...getInputProps()} />
                          <div className="flex flex-col items-center justify-center gap-4">
                            <Upload className="text-muted-foreground h-10 w-10" />
                            {isDragActive ? (
                              <p className="text-primary font-medium">
                                Drop the files here...
                              </p>
                            ) : (
                              <p className="text-muted-foreground">
                                Drag & drop files here, or click to select files
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    />
                    {files.length > 0 && (
                      <div className="mt-6 space-y-4">
                        <h3 className="font-medium">
                          Selected Files ({files.length})
                        </h3>
                        <div className="space-y-2">
                          {files.map((file, index) => (
                            <div
                              key={index}
                              className="bg-muted flex items-center gap-3 rounded-md p-3"
                            >
                              <FileText className="text-muted-foreground h-5 w-5" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {file.name}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {(file.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                              {file.type.startsWith("image/") && (
                                <div className="relative h-10 w-10 overflow-hidden rounded">
                                  <Image
                                    src={
                                      URL.createObjectURL(file) ||
                                      "/placeholder.svg"
                                    }
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={clearFiles}
                      disabled={files.length === 0}
                    >
                      Clear
                    </Button>
                    <Button type="submit" disabled={files.length === 0}>
                      Process Files
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="processing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Processing Files</CardTitle>
                <CardDescription>
                  Extracting text from your documents using OCR
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="flex items-center justify-center py-10">
                  {processing ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="text-primary h-10 w-10 animate-spin" />
                      <p className="text-muted-foreground">
                        Processing your documents...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <Check className="h-10 w-10 text-green-500" />
                      <p className="font-medium text-green-500">
                        Processing complete!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>OCR Results</CardTitle>
                <CardDescription>
                  Extracted text from your documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results ? (
                  <div className="bg-muted w-full rounded-md p-4 whitespace-pre-wrap">
                    <article className="prose prose-neutral prose-base">
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        // this is unsafe but im lazy
                        urlTransform={(value: string) => value}
                        components={{
                          img: ({ src, alt, ...props }) => {
                            console.log(alt)
                            console.log(props)
                            return <MarkdownImage src={src} alt={alt} />;
                          }
                        }}
                      >
                        {results}
                      </Markdown>
                    </article>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 py-10">
                    <AlertCircle className="text-muted-foreground h-10 w-10" />
                    <p className="text-muted-foreground">
                      No results available yet
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={clearFiles}>
                  Start Over
                </Button>
                {results && (
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(results);
                      // In a real app, you would show a toast notification here
                    }}
                  >
                    Copy Text
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
