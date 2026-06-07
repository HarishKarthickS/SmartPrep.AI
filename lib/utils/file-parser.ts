export const parseFile = async (file: File): Promise<string> => {
  const fileType = file.type;

  if (fileType === 'application/pdf') {
    return parsePDF(file);
  } else if (fileType === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
    return parseText(file);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF, TXT, or MD file.');
  }
};

const parseText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const parsePDF = async (file: File): Promise<string> => {
  // Dynamic import to avoid SSR errors with DOMMatrix
  const pdfjs = await import('pdfjs-dist');
  
  // Ensure worker is set before processing
  if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = (textContent.items as any[])
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
};
