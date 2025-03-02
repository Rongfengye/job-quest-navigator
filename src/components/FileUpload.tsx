
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

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
      const arrayBuffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: typedArray });
      const pdfDocument = await loadingTask.promise;
      
      // Extract text from all pages
      let fullText = "";
      const maxPages = pdfDocument.numPages;
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
        
        // Limit text extraction if it's getting too large
        if (fullText.length > 10000) {
          break;
        }
      }
      
      // Limit to 3000 characters to prevent token overusage
      return fullText.substring(0, 3000);
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
      
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        return;
      }

      const extractedText = await extractTextFromPDF(file);
      onFileChange(file, extractedText);
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
