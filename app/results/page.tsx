"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useOCRStore } from "@/lib/store";

const ResultPage = () => {
  const router = useRouter();
  const { data, isLoading, error } = useOCRStore();
  const [currentPage, setCurrentPage] = useState(0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="p-6">
          <p>Loading...</p>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen space-y-4">
        <Card className="p-6">
          <h1 className="text-xl font-bold text-red-500">Error</h1>
          <p>{error || "No data available. Please upload a file first."}</p>
        </Card>
        <Button 
          onClick={() => router.push("/")}
          variant="outline"
        >
          ← Back to Upload
        </Button>
      </div>
    );
  }

  const totalPages = data.pages.length;
  const currentPageData = data.pages[currentPage];

  // Function to process text and render LaTeX
  const renderMathInText = (text: string) => {
    try {
      // Split text into parts, preserving LaTeX expressions
      const parts = text.split(/(\$(?:[^$]|\$[^$])*\$)/g);
      return parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();
          console.log('Processing LaTeX:', math); // Debug log
          try {
            // Handle both inline and block math
            if (math.startsWith('\\left[\\begin{array}') || math.includes('\\\\')) {
              return (
                <BlockMath 
                  key={index} 
                  math={math} 
                  errorColor="#f00"
                  renderError={(error) => {
                    console.error('BlockMath Error:', error);
                    return <code className="text-red-500">{math}</code>;
                  }}
                />
              );
            }
            return (
              <InlineMath 
                key={index} 
                math={math} 
                errorColor="#f00"
                renderError={(error) => {
                  console.error('InlineMath Error:', error);
                  return <code className="text-red-500">{math}</code>;
                }}
              />
            );
          } catch (error) {
            console.error('LaTeX Render Error:', error, '\nExpression:', math);
            return <code key={index} className="text-red-500">{part}</code>;
          }
        }
        return part;
      });
    } catch (error) {
      console.error('Text Processing Error:', error, '\nText:', text);
      return text;
    }
  };

  // Function to process React children and find text nodes with LaTeX
  const processChildren = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, child => {
      if (typeof child === 'string') {
        return renderMathInText(child);
      }
      if (React.isValidElement(child)) {
        const props = child.props as { children?: React.ReactNode };
        if (props.children) {
          return React.cloneElement(child as React.ReactElement<any>, {
            children: processChildren(props.children)
          });
        }
      }
      return child;
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Button 
          onClick={() => router.push("/")}
          variant="outline"
        >
          ← Back to Upload
        </Button>
        {totalPages > 1 && (
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              variant="outline"
            >
              Previous
            </Button>
            <span>
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
              variant="outline"
            >
              Next
            </Button>
          </div>
        )}
      </div>
      
      <Card className="p-6">
        <div className="text-base leading-7 [&>*]:mb-4 [&>h1]:text-2xl [&>h1]:font-bold [&>h2]:text-xl [&>h2]:font-semibold [&>h3]:text-lg [&>h3]:font-medium [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>blockquote]:pl-4 [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:italic [&>pre]:bg-gray-100 [&>pre]:p-4 [&>pre]:rounded [&>code]:bg-gray-100 [&>code]:px-1 [&>code]:rounded">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Handle images
              img: ({src, alt}) => {
                const match = src?.match(/img-(\d+)\.jpeg/);
                if (match && currentPageData.images) {
                  const index = parseInt(match[1]);
                  const imageData = currentPageData.images[index];
                  if (imageData) {
                    return <img src={imageData.imageBase64} alt={alt || `Image ${index}`} className="max-w-full h-auto" />;
                  }
                }
                return <img src={src || ''} alt={alt || ''} className="max-w-full h-auto" />;
              },
              // Handle any component that might contain math
              p: ({children}) => <p>{processChildren(children)}</p>,
              span: ({children}) => <span>{processChildren(children)}</span>,
              strong: ({children}) => <strong>{processChildren(children)}</strong>,
              em: ({children}) => <em>{processChildren(children)}</em>,
              // Handle code blocks that might contain math
              code: ({children, className}) => {
                const text = String(children).trim();
                if (text.startsWith('$$') && text.endsWith('$$')) {
                  try {
                    return <BlockMath math={text.slice(2, -2)} errorColor="#f00" />;
                  } catch (error) {
                    console.error('LaTeX Error:', error);
                    return <code className="text-red-500">{text}</code>;
                  }
                }
                return <code className={className}>{children}</code>;
              }
            }}
          >
            {currentPageData.markdown}
          </ReactMarkdown>
        </div>
      </Card>
    </div>
  );
};

export default ResultPage;
