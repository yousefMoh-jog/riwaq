/**
 * certificate.ts
 * Generates a printable Arabic certificate in a new browser window.
 * No external dependencies — pure HTML/CSS rendered by the browser.
 *
 * Usage:
 *   downloadCertificate({ studentName, courseTitle, completionDate });
 */

interface CertificateOptions {
  studentName: string;
  courseTitle: string;
  completionDate?: Date;
}

export function downloadCertificate({
  studentName,
  courseTitle,
  completionDate = new Date(),
}: CertificateOptions): void {
  const dateStr = completionDate.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = /* html */ `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>شهادة إتمام دورة — ${courseTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Cairo', 'Segoe UI', Arial, sans-serif;
      background: #f0f2f5;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
    }

    .page {
      width: 900px;
      max-width: 100%;
      background: #fff;
      position: relative;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }

    /* Outer gold border */
    .outer-border {
      position: absolute;
      inset: 0;
      border: 8px solid #c9a84c;
    }

    /* Inner thin border */
    .inner-border {
      position: absolute;
      inset: 14px;
      border: 2px solid #c9a84c;
      pointer-events: none;
    }

    .cert-body {
      padding: 60px 70px;
      text-align: center;
      position: relative;
      z-index: 1;
    }

    /* Corner ornaments */
    .corner {
      position: absolute;
      width: 50px;
      height: 50px;
      border-color: #c9a84c;
      border-style: solid;
    }
    .corner.tl { top: 22px; right: 22px; border-width: 3px 0 0 3px; }
    .corner.tr { top: 22px; left: 22px; border-width: 3px 3px 0 0; }
    .corner.bl { bottom: 22px; right: 22px; border-width: 0 0 3px 3px; }
    .corner.br { bottom: 22px; left: 22px; border-width: 0 3px 3px 0; }

    /* Background watermark */
    .watermark {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 200px;
      color: rgba(201,168,76,0.04);
      font-weight: 900;
      pointer-events: none;
      user-select: none;
      z-index: 0;
      overflow: hidden;
    }

    /* Platform name */
    .platform {
      font-size: 13px;
      letter-spacing: 4px;
      color: #9b7a2e;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    /* Horizontal divider with diamond */
    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 18px auto;
      max-width: 400px;
    }
    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(to left, transparent, #c9a84c);
    }
    .divider::after {
      background: linear-gradient(to right, transparent, #c9a84c);
    }
    .diamond {
      width: 8px;
      height: 8px;
      background: #c9a84c;
      transform: rotate(45deg);
      flex-shrink: 0;
    }

    .cert-label {
      font-size: 11px;
      letter-spacing: 6px;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .cert-title {
      font-size: 42px;
      font-weight: 900;
      color: #1a1a2e;
      margin-bottom: 4px;
    }

    .cert-subtitle {
      font-size: 13px;
      color: #666;
      margin-bottom: 32px;
    }

    .presented-to {
      font-size: 14px;
      color: #888;
      margin-bottom: 6px;
    }

    .student-name {
      font-size: 46px;
      font-weight: 900;
      color: #1a1a2e;
      margin-bottom: 6px;
      line-height: 1.2;
    }

    .completed-text {
      font-size: 14px;
      color: #555;
      margin-bottom: 8px;
    }

    .course-name {
      font-size: 24px;
      font-weight: 700;
      color: #9b7a2e;
      background: linear-gradient(135deg, #9b7a2e, #c9a84c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 36px;
      padding: 0 20px;
    }

    .footer-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e8d99a;
    }

    .footer-item {
      text-align: center;
    }

    .footer-label {
      font-size: 10px;
      color: #aaa;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 6px;
      display: block;
    }

    .footer-value {
      font-size: 13px;
      color: #444;
      font-weight: 600;
    }

    .signature-line {
      width: 120px;
      height: 1px;
      background: #c9a84c;
      margin: 0 auto 4px;
    }

    /* Medal icon */
    .medal {
      font-size: 52px;
      margin-bottom: 8px;
      display: block;
    }

    /* Print button (hidden when printing) */
    .print-btn {
      display: block;
      margin: 24px auto 0;
      padding: 12px 32px;
      background: linear-gradient(135deg, #9b7a2e, #c9a84c);
      color: white;
      border: none;
      border-radius: 8px;
      font-family: inherit;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(201,168,76,0.4);
      transition: opacity 0.2s;
    }
    .print-btn:hover { opacity: 0.9; }

    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; width: 100%; }
      .print-btn { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="outer-border"></div>
    <div class="inner-border"></div>
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>
    <div class="watermark">✦</div>

    <div class="cert-body">
      <div class="platform">RIWAQ · رِواق</div>

      <span class="medal">🏆</span>

      <div class="cert-label">CERTIFICATE OF COMPLETION</div>
      <div class="cert-title">شهادة إتمام</div>
      <div class="cert-subtitle">تُمنح هذه الشهادة تقديراً لإتمام متطلبات الدورة بنجاح</div>

      <div class="divider"><div class="diamond"></div></div>

      <div class="presented-to">يُشهد بأن الطالب/ة</div>
      <div class="student-name">${escapeHtml(studentName)}</div>

      <div class="divider"><div class="diamond"></div></div>

      <div class="completed-text">قد أتم/أتمت بنجاح متطلبات دورة</div>
      <div class="course-name">${escapeHtml(courseTitle)}</div>

      <div class="footer-row">
        <div class="footer-item">
          <span class="footer-label">التاريخ</span>
          <div class="footer-value">${dateStr}</div>
        </div>

        <div class="footer-item">
          <div class="signature-line"></div>
          <span class="footer-label">توقيع المنصة</span>
          <div class="footer-value">منصة رِواق التعليمية</div>
        </div>

        <div class="footer-item">
          <span class="footer-label">الحالة</span>
          <div class="footer-value" style="color:#22c55e">✓ مكتملة بنجاح</div>
        </div>
      </div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">
    🖨️ &nbsp; طباعة / حفظ كـ PDF
  </button>

  <script>
    // Auto-focus window so Ctrl+P works immediately
    window.focus();
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=980,height=780');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// Escape HTML to prevent XSS in certificate content
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
