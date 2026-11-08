import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { unitPrice, productCode } from './cart';
import { INSTAGRAM_HANDLE } from './instagram';

/* ------------------------------------------------------------------
   Order receipt PDF — calm, minimal layout matching the website.
   jsPDF's built-in fonts can't draw "₹", so amounts use "Rs.".
   ------------------------------------------------------------------ */

// Palette (same as the site)
const C = {
  text: [42, 33, 36],
  muted: [123, 111, 114],
  faint: [170, 160, 162],
  accent: [168, 86, 106],
  accentDark: [142, 68, 88],
  accentSoft: [246, 234, 237],
  border: [235, 227, 223],
  panel: [250, 247, 245],
  white: [255, 255, 255],
};

const PAGE_W = 210;
const PAGE_H = 297;
const M = 16;                 // side margin
const CONTENT_W = PAGE_W - M * 2;
const FOOTER_Y = PAGE_H - 12;
const BOTTOM_LIMIT = PAGE_H - 24;

const money = (v) => `Rs. ${(Number(v) || 0).toFixed(2)}`;

// Loads any image (file path or data URL, incl. webp) and returns a
// square, centre-cropped JPEG data URL that jsPDF can always embed.
const loadSquareImage = (src, px = 360) => new Promise((resolve) => {
  if (!src) return resolve(null);
  const url = src.startsWith('data:') || src.startsWith('http') || src.startsWith('/') ? src : `/${src}`;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = px;
      canvas.height = px;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, px, px);
      ctx.drawImage(img, sx, sy, side, side, 0, 0, px, px);
      resolve(canvas.toDataURL('image/jpeg', 0.86));
    } catch (err) {
      console.warn('Could not prepare image for PDF', err);
      resolve(null);
    }
  };
  img.onerror = () => resolve(null);
  img.src = url;
});

const set = (doc, { size, style = 'normal', color = C.text, font = 'helvetica' }) => {
  doc.setFont(font, style);
  if (size) doc.setFontSize(size);
  doc.setTextColor(...color);
};

// Small uppercase, letter-spaced label
const label = (doc, text, x, y, color = C.accent) => {
  set(doc, { size: 7, style: 'bold', color });
  doc.text(text.toUpperCase(), x, y, { charSpace: 0.6 });
};

const hLine = (doc, y, x1 = M, x2 = PAGE_W - M, color = C.border, width = 0.25) => {
  doc.setDrawColor(...color);
  doc.setLineWidth(width);
  doc.line(x1, y, x2, y);
};

const sizeSummary = (item) => {
  if (item.size?.type !== 'Custom') return `Size ${item.size || '-'}`;
  const m = item.size.measurements || {};
  if (Object.values(m).some(Boolean)) {
    return `Custom size (mm): Thumb ${m.thumb || '-'} · Index ${m.index || '-'} · Middle ${m.middle || '-'} · Ring ${m.ring || '-'} · Little ${m.little || '-'}`;
  }
  const n = item.size.images?.length || 0;
  return `Custom size: ${n} hand photo${n === 1 ? '' : 's'} (shown below)`;
};

/**
 * Builds and downloads the order receipt.
 * @param {object} customer  name, phone, address, pincode
 * @param {Array}  cart      cart items
 * @param {number} total     order total
 * @param {object} [extra]   { orderNumber, notes }
 */
export const generateOrderPDF = async (customer, cart, total, extra = {}) => {
  const { orderNumber = '', notes = '' } = extra;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // Prepare images up front
  const productImages = await Promise.all(cart.map(item =>
    loadSquareImage((item.colorImages && item.colorImages[item.color]) || item.image)));
  const sizePhotos = await Promise.all(cart.map(item =>
    item.size?.type === 'Custom' && item.size.images?.length
      ? Promise.all(item.size.images.map(src => loadSquareImage(src, 300)))
      : Promise.resolve([])));

  /* ---------------- Header ---------------- */
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, PAGE_W, 2.2, 'F');

  set(doc, { size: 24, font: 'times', style: 'normal' });
  doc.text('Haus of ManiCure', M, 22);
  set(doc, { size: 8.5, color: C.muted });
  doc.text(`Handcrafted press-on nails  ·  ${INSTAGRAM_HANDLE}`, M, 28.5);

  const rx = PAGE_W - M;
  label(doc, 'Order receipt', rx - doc.getTextWidth('ORDER RECEIPT') - 4, 17);
  set(doc, { size: 11, style: 'bold' });
  doc.text(orderNumber || '—', rx, 23, { align: 'right' });
  set(doc, { size: 8.5, color: C.muted });
  doc.text(`${dateStr}, ${timeStr}`, rx, 28.5, { align: 'right' });

  hLine(doc, 35);

  /* ---------------- Customer + order cards ---------------- */
  const cardY = 41;
  const gap = 6;
  const cardW = (CONTENT_W - gap) / 2;

  set(doc, { size: 9 });
  const addressLines = doc.splitTextToSize(
    `${customer.address || ''}${customer.pincode ? `, ${customer.pincode}` : ''}`, cardW - 12);
  const itemCount = cart.reduce((n, i) => n + i.quantity, 0);
  const cardH = Math.max(36, 25 + addressLines.length * 4.2);

  const card = (x) => {
    doc.setFillColor(...C.panel);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, cardY, cardW, cardH, 2.5, 2.5, 'FD');
  };

  // Deliver to
  card(M);
  label(doc, 'Deliver to', M + 6, cardY + 8);
  set(doc, { size: 10.5, style: 'bold' });
  doc.text(customer.name || '-', M + 6, cardY + 15);
  set(doc, { size: 9, color: C.muted });
  doc.text(customer.phone || '-', M + 6, cardY + 20.5);
  doc.text(addressLines, M + 6, cardY + 26);

  // Order details
  const ox = M + cardW + gap;
  card(ox);
  label(doc, 'Order details', ox + 6, cardY + 8);
  const rows = [
    ['Order no.', orderNumber || '-'],
    ['Date', dateStr],
    ['Items', `${itemCount} set${itemCount === 1 ? '' : 's'}`],
    ['Payment', 'Pending — QR on WhatsApp'],
  ];
  rows.forEach(([k, v], i) => {
    const y = cardY + 15 + i * 5.4;
    set(doc, { size: 8.5, color: C.muted });
    doc.text(k, ox + 6, y);
    set(doc, { size: 8.5, style: i === 0 ? 'bold' : 'normal' });
    doc.text(v, ox + cardW - 6, y, { align: 'right' });
  });

  /* ---------------- Items table ---------------- */
  const IMG_COL = 26;
  const QTY_COL = 14;
  const PRICE_COL = 25;
  const AMT_COL = 27;
  const ITEM_COL = CONTENT_W - IMG_COL - QTY_COL - PRICE_COL - AMT_COL;
  const PAD = 3.5;
  const LINE_H = 4.3; // matches the 10.5pt row font used for sizing

  // Pre-build each item's text block as styled lines
  const itemBlocks = cart.map((item) => {
    const block = [];
    const push = (text, style) => {
      set(doc, style);
      doc.splitTextToSize(text, ITEM_COL - PAD * 2).forEach(t => block.push({ t, style }));
    };
    push(item.name, { size: 10.5, style: 'bold' });
    push(`Design code ${productCode(item)}`, { size: 7.5, style: 'bold', color: C.accent });
    push(`Colour: ${item.color || '-'}   ·   Shape: ${item.shape || 'Standard'}`, { size: 8.5, color: C.muted });
    push(sizeSummary(item), { size: 8.5, color: C.muted });
    if (item.customizations) push(`Note: “${item.customizations}”`, { size: 8.5, style: 'italic', color: C.muted });
    return block;
  });

  const body = cart.map((item, i) => {
    const price = unitPrice(item);
    const priceText = item.discount > 0 ? `${money(price)}\n${money(item.price)}` : money(price);
    return [
      '',
      itemBlocks[i].map(l => l.t).join('\n'),
      String(item.quantity),
      priceText,
      money(price * item.quantity),
    ];
  });

  autoTable(doc, {
    startY: cardY + cardH + 10,
    margin: { left: M, right: M, top: 18, bottom: 24 },
    head: [['', 'Item', 'Qty', 'Price', 'Amount']],
    body,
    theme: 'plain',
    showHead: 'everyPage',
    styles: {
      font: 'helvetica',
      fontSize: 10.5,
      textColor: C.text,
      cellPadding: { top: PAD, bottom: PAD, left: PAD, right: PAD },
      valign: 'top',
      overflow: 'visible',
      minCellHeight: IMG_COL - 2,
    },
    headStyles: {
      fillColor: C.accentSoft,
      textColor: C.accentDark,
      fontStyle: 'bold',
      fontSize: 7.5,
      minCellHeight: 8,
      valign: 'middle',
      cellPadding: { top: 2.5, bottom: 2.5, left: PAD, right: PAD },
    },
    columnStyles: {
      0: { cellWidth: IMG_COL },
      1: { cellWidth: ITEM_COL },
      2: { cellWidth: QTY_COL, halign: 'center', fontSize: 9.5 },
      3: { cellWidth: PRICE_COL, halign: 'right', fontSize: 9.5 },
      4: { cellWidth: AMT_COL, halign: 'right', fontSize: 9.5, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'head') {
        data.cell.text = data.cell.text.map(t => t.toUpperCase());
        if (data.column.index >= 3) data.cell.styles.halign = 'right';
        if (data.column.index === 2) data.cell.styles.halign = 'center';
      }
    },
    willDrawCell: (data) => {
      // Item text and strike-through prices are drawn by hand in didDrawCell
      if (data.section === 'body' && (data.column.index === 1 || data.column.index === 3)) {
        data.cell.__lines = data.cell.text;
        data.cell.text = [];
      }
    },
    didDrawCell: (data) => {
      const { cell, row, column, section } = data;

      if (section === 'head' && column.index === 0) {
        // rounded look for the header band
        return;
      }
      if (section !== 'body') return;

      // Thin divider under each row
      if (column.index === 0) {
        hLine(doc, cell.y + cell.height, M, PAGE_W - M);
      }

      // Product photo
      if (column.index === 0) {
        const img = productImages[row.index];
        const size = IMG_COL - PAD * 2;
        if (img) {
          try {
            doc.addImage(img, 'JPEG', cell.x + PAD, cell.y + PAD, size, size);
          } catch (err) {
            console.warn('Could not add product image', err);
          }
        } else {
          doc.setFillColor(...C.panel);
          doc.rect(cell.x + PAD, cell.y + PAD, size, size, 'F');
        }
      }

      // Item details with mixed styles
      if (column.index === 1) {
        let y = cell.y + PAD + 3.6;
        itemBlocks[row.index].forEach(({ t, style }, i) => {
          set(doc, style);
          if (i === 1) y += 0.4;
          doc.text(t, cell.x + PAD, y);
          y += style.size >= 10 ? LINE_H : 3.9;
        });
      }

      // Price (with original price struck through when discounted)
      if (column.index === 3) {
        const item = cart[row.index];
        const xr = cell.x + cell.width - PAD;
        set(doc, { size: 9.5 });
        doc.text(money(unitPrice(item)), xr, cell.y + PAD + 3.6, { align: 'right' });
        if (item.discount > 0) {
          set(doc, { size: 7.5, color: C.faint });
          const old = money(item.price);
          const y = cell.y + PAD + 8;
          doc.text(old, xr, y, { align: 'right' });
          const w = doc.getTextWidth(old);
          doc.setDrawColor(...C.faint);
          doc.setLineWidth(0.2);
          doc.line(xr - w, y - 1, xr, y - 1);
        }
      }
    },
  });

  let y = doc.lastAutoTable.finalY + 8;

  const ensureSpace = (h) => {
    if (y + h > BOTTOM_LIMIT) {
      doc.addPage();
      y = 22;
    }
  };

  /* ---------------- Notes + totals ---------------- */
  const totalsW = 74;
  const totalsX = PAGE_W - M - totalsW;
  const subtotal = cart.reduce((s, i) => s + unitPrice(i) * i.quantity, 0);
  const savings = cart.reduce((s, i) => s + ((Number(i.price) || 0) - unitPrice(i)) * i.quantity, 0);

  set(doc, { size: 8.5 });
  const noteLines = notes && notes.trim() ? doc.splitTextToSize(notes.trim(), CONTENT_W - totalsW - 18) : [];
  const totalsRows = [['Subtotal', money(subtotal)]];
  if (savings > 0.004) totalsRows.push(['You saved', `– ${money(savings)}`]);
  totalsRows.push(['Shipping', 'Confirmed on WhatsApp']);
  const totalsH = totalsRows.length * 6 + 16;
  ensureSpace(Math.max(totalsH, noteLines.length * 4 + 16));

  if (noteLines.length) {
    const nw = CONTENT_W - totalsW - 8;
    const nh = noteLines.length * 4 + 14;
    doc.setFillColor(...C.panel);
    doc.roundedRect(M, y, nw, nh, 2.5, 2.5, 'F');
    label(doc, 'Notes', M + 5, y + 7);
    set(doc, { size: 8.5, color: C.muted });
    doc.text(noteLines, M + 5, y + 12.5);
  }

  let ty = y + 4;
  totalsRows.forEach(([k, v]) => {
    set(doc, { size: 9, color: C.muted });
    doc.text(k, totalsX, ty);
    set(doc, { size: 9, color: k === 'You saved' ? C.accent : C.text });
    doc.text(v, PAGE_W - M, ty, { align: 'right' });
    ty += 6;
  });
  hLine(doc, ty - 2, totalsX, PAGE_W - M);
  doc.setFillColor(...C.accentSoft);
  doc.roundedRect(totalsX - 3, ty + 1, totalsW + 3, 11, 2, 2, 'F');
  set(doc, { size: 10, style: 'bold', color: C.accentDark });
  doc.text('Total', totalsX + 1, ty + 8.2);
  set(doc, { size: 12.5, style: 'bold', color: C.accentDark });
  doc.text(money(total), PAGE_W - M - 3, ty + 8.4, { align: 'right' });

  y = Math.max(ty + 12, y + noteLines.length * 4 + 14) + 12;

  /* ---------------- Sizing photos ---------------- */
  const photoItems = cart
    .map((item, i) => ({ item, i, photos: sizePhotos[i].filter(Boolean) }))
    .filter(p => p.photos.length);

  if (photoItems.length) {
    const ph = 28;
    // keep the heading together with the first row of photos
    ensureSpace(9 + 3 + ph + 8);
    label(doc, 'Sizing photos', M, y);
    hLine(doc, y + 2.5);
    y += 9;
    photoItems.forEach(({ item, i, photos }) => {
      ensureSpace(ph + 10);
      const title = `${i + 1}. ${item.name}`;
      set(doc, { size: 8.5, style: 'bold' });
      doc.text(title, M, y);
      const titleW = doc.getTextWidth(title); // measured in the bold font it was drawn in
      set(doc, { size: 8, color: C.muted });
      doc.text(`·  ${productCode(item)}`, M + titleW + 2, y);
      y += 3;
      photos.forEach((src, k) => {
        try {
          doc.addImage(src, 'JPEG', M + k * (ph + 4), y, ph, ph);
        } catch (err) {
          console.warn('Could not add sizing photo', err);
        }
      });
      y += ph + 8;
    });
  }

  /* ---------------- Next steps ---------------- */
  const steps = [
    'Tap Send on the WhatsApp message with your order details.',
    'We confirm the details and share the payment QR code.',
    'Your set is handcrafted and shipped to you with care.',
  ];
  const stepsH = 12 + steps.length * 6;
  ensureSpace(stepsH + 4);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(M, y, CONTENT_W, stepsH, 2.5, 2.5, 'S');
  label(doc, 'What happens next', M + 6, y + 8);
  steps.forEach((s, i) => {
    const sy = y + 14.5 + i * 6;
    doc.setFillColor(...C.accentSoft);
    doc.circle(M + 8.2, sy - 1.2, 2.3, 'F');
    set(doc, { size: 7.5, style: 'bold', color: C.accentDark });
    doc.text(String(i + 1), M + 8.2, sy - 0.1, { align: 'center' });
    set(doc, { size: 9, color: C.text });
    doc.text(s, M + 13, sy);
  });
  y += stepsH + 10;

  ensureSpace(10);
  set(doc, { size: 13, font: 'times', style: 'italic', color: C.accent });
  doc.text('Thank you for choosing handmade.', PAGE_W / 2, y, { align: 'center' });

  /* ---------------- Footer on every page ---------------- */
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    hLine(doc, FOOTER_Y - 5);
    set(doc, { size: 7.5, color: C.faint });
    doc.text(`Haus of ManiCure  ·  instagram.com/${INSTAGRAM_HANDLE.replace('@', '')}`, M, FOOTER_Y);
    doc.text(`${orderNumber ? `${orderNumber}  ·  ` : ''}Page ${p} of ${pages}`, PAGE_W - M, FOOTER_Y, { align: 'right' });
  }

  const filename = `HausOfManiCure_${orderNumber || Date.now()}.pdf`;
  if (extra.returnDoc) return doc;
  doc.save(filename);
  return filename;
};
