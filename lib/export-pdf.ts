import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Evaluation } from '@/types'

export async function exportPdfReport(
  result: Evaluation,
  _isUnlocked: boolean,
  canvasElement: HTMLElement,
): Promise<void> {
  const originalFontFamily = canvasElement.style.fontFamily

  // Force a Chinese-compatible font stack before capturing so html2canvas
  // does not pick a Latin-only webfont and render tofu/garbage.
  canvasElement.style.fontFamily =
    "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'Hiragino Sans GB', 'WenQuanYi Micro Hei', system-ui, sans-serif"

  try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 12
    const contentWidth = pageWidth - margin * 2
    const contentHeight = pageHeight - margin * 2

    const canvas = await html2canvas(canvasElement, {
      scale: 1.5,
      backgroundColor: '#0a0a0a',
      useCORS: true,
      logging: false,
    })

    const imgWidth = contentWidth
    const pageCanvasHeight = (canvas.width * contentHeight) / imgWidth
    let sourceY = 0
    let pageCount = 0
    const maxPages = 10

    while (sourceY < canvas.height && pageCount < maxPages) {
      if (pageCount > 0) {
        pdf.addPage()
      }

      const sliceHeight = Math.min(pageCanvasHeight, canvas.height - sourceY)
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = Math.max(1, Math.floor(sliceHeight))

      const ctx = sliceCanvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#0a0a0a'
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
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

      const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.85)
      const sliceDisplayHeight = (sliceCanvas.height * imgWidth) / canvas.width

      pdf.addImage(sliceData, 'JPEG', margin, margin, imgWidth, sliceDisplayHeight)

      sourceY += pageCanvasHeight
      pageCount++
    }

    pdf.save(`tikworth-${result.username}-report.pdf`)
  } finally {
    canvasElement.style.fontFamily = originalFontFamily
  }
}
