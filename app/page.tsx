import UploadPDF from "@/components/upload-pdf";

export default function Home() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-12">
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          PDF Text Extractor
        </h1>
        <p className="text-muted-foreground md:text-xl">
          Upload your PDF document and extract the text content with our
          AI-powered tool.
        </p>
      </div>
      <div className="mt-12">
        <UploadPDF />
      </div>
    </main>
  );
}
