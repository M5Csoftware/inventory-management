/**
 * PDF Export utility using html2canvas and jsPDF for client-side document generation
 */

export async function downloadInvoicePdf(elementId: string, fileName: string = 'Tax-Invoice.pdf') {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element #${elementId} not found`);
    }

    // Capture at high resolution for razor-sharp text
    const canvas = await html2canvas(element, {
      scale: 3, // 3x high-DPI scaling
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentHeight = (canvas.height * pageWidth) / canvas.width;

    // Center or fit within A4 page
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, Math.min(pageHeight, contentHeight));
    
    // If contents exceed single A4 page height significantly, add additional page
    if (contentHeight > pageHeight + 5) {
      let heightLeft = contentHeight - pageHeight;
      let position = -pageHeight;
      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, contentHeight);
        position -= pageHeight;
        heightLeft -= pageHeight;
      }
    }

    pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
    return true;
  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw error;
  }
}
