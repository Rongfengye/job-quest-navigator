
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
  onFileChange: (file: File | null) => void;
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
        onFileChange(file);
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
