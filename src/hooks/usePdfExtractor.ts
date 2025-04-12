
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extracts text from a PDF file buffer
 */
export const extractTextFromPDF = async (pdfBuffer: ArrayBuffer): Promise<string> => {
  try {
    const typedArray = new Uint8Array(pdfBuffer);
    
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
    return "";
  }
};
