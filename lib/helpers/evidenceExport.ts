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
