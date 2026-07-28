import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Evaluation } from '@/types'

export async function exportPdfReport(
  result: Evaluation,
  _isUnlocked: boolean,
  canvasElement: HTMLElement,
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 12
  const contentWidth = pageWidth - margin * 2
  const contentHeight = pageHeight - margin * 2

  const canvas = await html2canvas(canvasElement, {
    scale: 2,
    backgroundColor: '#0a0a0a',
    useCORS: true,
    logging: false,
  })

  const imgWidth = contentWidth
  const pageCanvasHeight = (canvas.width * contentHeight) / imgWidth
  let sourceY = 0
  let pageCount = 0

  while (sourceY < canvas.height) {
    if (pageCount > 0) {
      pdf.addPage()
    }

    const sliceHeight = Math.min(pageCanvasHeight, canvas.height - sourceY)
    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = canvas.width
    sliceCanvas.height = Math.max(1, Math.floor(sliceHeight))

    const ctx = sliceCanvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceCanvas.height,
        0,
        0,
        sliceCanvas.width,
        sliceCanvas.height,
      )
    }

    const sliceData = sliceCanvas.toDataURL('image/png')
    const sliceDisplayHeight = (sliceCanvas.height * imgWidth) / canvas.width

    pdf.addImage(sliceData, 'PNG', margin, margin, imgWidth, sliceDisplayHeight)

    sourceY += pageCanvasHeight
    pageCount++
  }

  pdf.save(`tikworth-${result.username}-report.pdf`)
}
