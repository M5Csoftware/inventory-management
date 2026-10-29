/**
 * PDF Export utility using html2canvas-pro and jsPDF for client-side document generation
 */

import { DEFAULT_M5C_LOGO_BASE64 } from './logo-data';

export async function downloadInvoicePdf(elementId: string, fileName: string = 'Tax-Invoice.pdf') {
  try {
    const html2canvasModule = await import('html2canvas-pro');
    const html2canvas = html2canvasModule.default || html2canvasModule;
    const { jsPDF } = await import('jspdf');

    const originalElement = document.getElementById(elementId);
    if (!originalElement) {
      throw new Error(`Element #${elementId} not found`);
    }

    // 1. Create a clean, off-screen unscaled sandbox wrapper
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '-10000px';
    container.style.width = '210mm';
    container.style.minHeight = '297mm';
    container.style.zIndex = '-9999';
    container.style.backgroundColor = '#ffffff';
    container.style.margin = '0';
    container.style.padding = '0';
    container.style.transform = 'none';

    // 2. Clone the element to isolate it from preview zoom scales
    const clonedNode = originalElement.cloneNode(true) as HTMLElement;
    clonedNode.id = 'tax-invoice-export-clone';
    clonedNode.style.transform = 'none';
    clonedNode.style.width = '210mm';
    clonedNode.style.minHeight = '297mm';
    clonedNode.style.boxSizing = 'border-box';
    clonedNode.style.margin = '0';
    clonedNode.style.boxShadow = 'none';

    // Replace image sources with inline base64 data to guarantee zero CORS/network delay
    const images = clonedNode.querySelectorAll('img');
    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (!src || src.includes('m5c-logo') || !src.startsWith('data:')) {
        img.src = DEFAULT_M5C_LOGO_BASE64;
      }
    });

    container.appendChild(clonedNode);
    document.body.appendChild(container);

    // Ensure all images are decoded
    await Promise.all(
      Array.from(clonedNode.querySelectorAll('img')).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((res) => {
          img.onload = () => res(true);
          img.onerror = () => res(false);
        });
      })
    );

    // Brief layout settle
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Capture at 2.5x high-DPI scaling for sharp print-grade quality
    const canvas = await (html2canvas as any)(clonedNode, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: clonedNode.scrollWidth || 794,
    });

    // Remove off-screen sandbox element
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }

    // Initialize strictly A4 PDF (210mm width x 297mm height)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = 210;
    const pdfHeight = 297;
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Calculate height of content scaled to 210mm width
    const contentHeightMm = (canvas.height * pdfWidth) / canvas.width;

    if (contentHeightMm <= pdfHeight + 3) {
      // Exactly 1 page: scale edge-to-edge into 210mm x 297mm
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    } else {
      // Multi-page document handling
      let heightLeft = contentHeightMm;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, contentHeightMm, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 5) {
        position -= pdfHeight;
        pdf.addPage('a4', 'portrait');
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, contentHeightMm, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
    }

    const cleanFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    pdf.save(cleanFileName);
    return true;
  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw error;
  }
}
