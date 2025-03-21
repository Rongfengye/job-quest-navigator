import React from 'react';
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
        if (fullText.length > 10000) {
          console.log("Text extraction reached 10000 characters, stopping...");
          break;
        }
      }
      
      // Limit to 5000 characters to prevent token overusage
      const truncatedText = fullText.substring(0, 5000);
      console.log(`Text extraction complete. Total characters: ${fullText.length}, truncated to 5000 characters.`);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-interview-primary font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="border border-dashed border-gray-300 rounded-md p-4">
        <div className="flex items-center justify-center flex-col">
          <input
            id={id}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(id)?.click()}
            className="w-full flex items-center justify-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {currentFile ? currentFile.name : 'Upload Document'}
          </Button>
          <p className="text-xs text-gray-500 mt-2">Only PDF files are supported</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
