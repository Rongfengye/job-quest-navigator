
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker properly
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface FileUploadProps {
  id: string;
  label: string;
  required?: boolean;
  onFileChange: (file: File | null, text: string) => void;
  currentFile: File | null;
}

const FileUpload: React.FC<FileUploadProps> = ({
  id,
  label,
  required = false,
  onFileChange,
  currentFile,
}) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  // Function to extract text from PDF
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      console.log(`Starting text extraction from ${file.name}...`);
      const arrayBuffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: typedArray });
      const pdfDocument = await loadingTask.promise;
      
      console.log(`PDF loaded successfully. Total pages: ${pdfDocument.numPages}`);
      
      // Extract text from all pages
      let fullText = "";
      const maxPages = pdfDocument.numPages;
      
      for (let i = 1; i <= maxPages; i++) {
        console.log(`Processing page ${i} of ${maxPages}...`);
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
        
        // Limit text extraction if it's getting too large
        if (fullText.length > 100000) {
          console.log("Text extraction reached 100000 characters, stopping...");
          break;
        }
      }
      
      // Clean the extracted text - remove PDF artifacts and normalize whitespace
      let cleanedText = fullText
        .replace(/(\r\n|\n|\r)/gm, " ")  // Replace line breaks with spaces
        .replace(/\s+/g, " ")            // Replace multiple spaces with single space
        .trim();                          // Trim whitespace
      
      // Limit to 5000 characters to prevent token overusage
      const truncatedText = cleanedText.substring(0, 5000);
      console.log(`Text extraction complete. Total characters: ${cleanedText.length}, truncated to 5000 characters.`);
      console.log("Text preview:", truncatedText.substring(0, 100) + "...");
      
      return truncatedText;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      toast({
        title: "Error parsing PDF",
        description: "There was an issue extracting text from your PDF. Please try another file.",
        variant: "destructive",
      });
      return "";
    }
  };

  const processFile = async (file: File) => {
    console.log(`File selected: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    try {
      const extractedText = await extractTextFromPDF(file);
      onFileChange(file, extractedText);
    } catch (e) {
      console.error("Error in file processing:", e);
      toast({
        title: "File processing error",
        description: "There was an error processing your file.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-interview-primary font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div 
        className={`border ${isDragging ? 'border-interview-primary bg-blue-50' : 'border-gray-300'} 
                  border-dashed rounded-md p-6 transition-colors duration-200 ease-in-out
                  ${isDragging ? 'ring-2 ring-interview-primary' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex items-center justify-center flex-col">
          <input
            id={id}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          {currentFile ? (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="bg-green-100 text-green-800 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="font-medium text-sm mb-1">{currentFile.name}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(id)?.click()}
                className="text-xs"
              >
                Change File
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-3 p-2 rounded-full bg-gray-100">
                <Upload className="h-6 w-6 text-gray-500" />
              </div>
              <p className="text-sm text-center mb-2">
                <span className="font-medium">Drag & drop your file here</span> or click to browse
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById(id)?.click()}
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload PDF
              </Button>
            </>
          )}
          <p className="text-xs text-gray-500 mt-2">Only PDF files are supported</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
