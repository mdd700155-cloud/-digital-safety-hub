export function buildIncidentText(summary: {
  category: string;
  date?: string;
  amount?: string;
  platform?: string;
  description?: string;
  steps?: string[];
}) {
  const lines = [] as string[];
  lines.push('INCIDENT SUMMARY (Local)');
  lines.push('Date Generated: ' + new Date().toLocaleString());
  lines.push('');
  lines.push(`Category: ${summary.category}`);
  lines.push(`Incident Date: ${summary.date || 'Not provided'}`);
  lines.push(`Platform / Identifier: ${summary.platform || 'Not provided'}`);
  lines.push(`Amount / Loss: ${summary.amount || 'None/Not provided'}`);
  lines.push('');
  lines.push('Description:');
  lines.push(summary.description || 'No description provided.');
  lines.push('');
  if (summary.steps && summary.steps.length > 0) {
    lines.push('Suggested Immediate Steps:');
    summary.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push('');
  }
  lines.push('--');
  lines.push('This summary is generated locally for your convenience. It is not submitted to any authority by Digital Safety Hub.');
  return lines.join('\n');
}

export function downloadBlob(filename: string, content: Blob) {
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  downloadBlob(filename, blob);
}

export async function buildZip(
  files: { name: string; blob: Blob }[],
  filename: string
) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  files.forEach((file) => zip.file(file.name, file.blob));
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(filename, blob);
}

export function downloadJsonFile(filename: string, obj: unknown) {
  let json = '';
  try {
    json = JSON.stringify(obj, null, 2);
  } catch (e) {
    // Fallback to string conversion if object is not JSON-serializable
    try {
      json = String(obj as unknown);
    } catch {
      json = '{}';
    }
  }
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(filename, blob);
}

export async function renderSummaryAsPng(summaryText: string, options?: { width?: number; padding?: number; bg?: string; fg?: string; }) {
  const width = options?.width || 800;
  const padding = options?.padding || 20;
  const bg = options?.bg || '#ffffff';
  const fg = options?.fg || '#000000';

  // Simple canvas text rendering (no external deps)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Segoe UI Mono", monospace';
  const lines = summaryText.split('\n');
  const lineHeight = 18;
  const height = padding * 2 + lines.length * lineHeight;
  canvas.width = width;
  canvas.height = height;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = fg;
  ctx.textBaseline = 'top';
  let y = padding;
  for (const line of lines) {
    // wrap long lines
    const maxWidth = width - padding * 2;
    if (ctx.measureText(line).width <= maxWidth) {
      ctx.fillText(line, padding, y);
      y += lineHeight;
    } else {
      // naive wrap
      let remaining = line;
      while (remaining.length > 0) {
        let fit = remaining;
        while (ctx.measureText(fit).width > maxWidth && fit.length > 0) {
          fit = fit.slice(0, -1);
        }
        ctx.fillText(fit, padding, y);
        y += lineHeight;
        remaining = remaining.slice(fit.length);
      }
    }
  }

  return new Promise<string>((resolve) => {
    resolve(canvas.toDataURL('image/png'));
  });
}

type LoadedImage = {
  image: HTMLImageElement;
  objectUrl: string;
};

async function loadImageFromUrl(url: string): Promise<LoadedImage> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Unable to load an evidence image for export.");
  }

  const objectUrl = URL.createObjectURL(await response.blob());
  const image = new Image();
  image.src = objectUrl;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Unable to read an evidence image for export."));
  });

  return { image, objectUrl };
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];

  for (const line of text.split("\n")) {
    if (!line) {
      lines.push("");
      continue;
    }

    let remaining = line;
    while (remaining.length > 0) {
      let fit = remaining;
      while (fit.length > 0 && ctx.measureText(fit).width > maxWidth) {
        fit = fit.slice(0, -1);
      }
      lines.push(fit);
      remaining = remaining.slice(fit.length);
    }
  }

  return lines;
}

export async function renderSummaryWithImagesAsPng(text: string, imageUrls: string[]) {
  const width = 800;
  const padding = 24;
  const imageGap = 16;
  const lineHeight = 20;
  const maxImageWidth = (width - padding * 2) * 0.65;
  const loadedImages: LoadedImage[] = [];

  try {
    for (const url of imageUrls) {
      loadedImages.push(await loadImageFromUrl(url));
    }

    const measureCanvas = document.createElement("canvas");
    const measureContext = measureCanvas.getContext("2d");
    if (!measureContext) throw new Error("Unable to create image export.");

    measureContext.font = '14px ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Segoe UI Mono", monospace';
    const lines = wrapCanvasText(measureContext, text, maxImageWidth);
    const imagesHeight = loadedImages.reduce((total, { image }) => {
      return total + (image.height * Math.min(1, maxImageWidth / image.width)) + imageGap;
    }, 0);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = Math.ceil(padding * 2 + imagesHeight + lines.length * lineHeight);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to create image export.");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    let y = padding;

    for (const { image } of loadedImages) {
      const scale = Math.min(1, maxImageWidth / image.width);
      const imageWidth = image.width * scale;
      const imageHeight = image.height * scale;
      context.drawImage(image, padding, y, imageWidth, imageHeight);
      y += imageHeight + imageGap;
    }

    context.font = measureContext.font;
    context.fillStyle = "#000000";
    context.textBaseline = "top";
    for (const line of lines) {
      context.fillText(line, padding, y);
      y += lineHeight;
    }

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Unable to create image export."));
      }, "image/png");
    });
  } finally {
    loadedImages.forEach(({ objectUrl }) => URL.revokeObjectURL(objectUrl));
  }
}

export async function buildSummaryPdf(text: string, imageUrls: string[], filename: string) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ format: "a4", unit: "mm" });
  const margin = 15;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const maxImageWidth = contentWidth * 0.65;
  const bottom = pageHeight - margin;
  let y = margin;
  const loadedImages: LoadedImage[] = [];

  const addPageIfNeeded = (height: number) => {
    if (y + height > bottom && y > margin) {
      pdf.addPage();
      y = margin;
    }
  };

  try {
    for (const url of imageUrls) {
      loadedImages.push(await loadImageFromUrl(url));
    }

    for (const { image } of loadedImages) {
      const scale = Math.min(1, maxImageWidth / image.width);
      const imageWidth = image.width * scale;
      const imageHeight = image.height * scale;

      if (imageHeight > bottom - margin) {
        const pageScale = (bottom - margin) / imageHeight;
        addPageIfNeeded(bottom - margin);
        pdf.addImage(image, "PNG", margin, y, imageWidth * pageScale, imageHeight * pageScale);
        y += imageHeight * pageScale + 6;
      } else {
        addPageIfNeeded(imageHeight);
        pdf.addImage(image, "PNG", margin, y, imageWidth, imageHeight);
        y += imageHeight + 6;
      }
    }

    pdf.setFont("courier", "normal");
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(text, contentWidth);
    const lineHeight = 5;
    for (const line of lines) {
      addPageIfNeeded(lineHeight);
      pdf.text(line, margin, y);
      y += lineHeight;
    }

    downloadBlob(filename, pdf.output("blob"));
  } finally {
    loadedImages.forEach(({ objectUrl }) => URL.revokeObjectURL(objectUrl));
  }
}
