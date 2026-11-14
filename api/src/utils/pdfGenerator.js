import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COPY = {
  en: {
    invoice: "INVOICE",
    number: "No.",
    billTo: "Bill to",
    order: "Order",
    guest: "Guest",
    item: "Item",
    qty: "Qty",
    price: "Price",
    total: "Total",
    subtotal: "Subtotal",
    discount: "Discount",
    tax: "Tax",
    service: "Service",
    grandTotal: "Grand total",
    thankYou: "Thank you for visiting.",
    poweredBy: "Powered by",
    vat: "VAT",
    cr: "CR",
    table: "Table",
    servedBy: "Served by",
    dineIn: "Dine in",
    takeaway: "Takeaway",
    delivery: "Delivery",
    paid: "Paid",
    unpaid: "Unpaid",
    pending: "Pending",
    cash: "Cash",
    card: "Card",
    online: "Online",
    wallet: "Wallet",
    invoiceTo: "INVOICE TO",
    shipTo: "SHIP TO",
    date: "DATE",
    invoiceNo: "INVOICE NO",
    description: "ITEM DESCRIPTION",
    totalDue: "TOTAL DUE",
    paymentInfo: "Payment Info",
    terms: "Order",
    policy: "Terms & Condition",
    information: "Information",
    questions: "Questions?",
    emailUs: "Email us at",
    callUs: "or call us at",
  },
  ar: {
    invoice: "فاتورة",
    number: "رقم",
    billTo: "فاتورة إلى",
    order: "الطلب",
    guest: "زائر",
    item: "الصنف",
    qty: "الكمية",
    price: "السعر",
    total: "الإجمالي",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    tax: "الضريبة",
    service: "رسوم الخدمة",
    grandTotal: "الإجمالي الكلي",
    thankYou: "شكراً لزيارتكم",
    poweredBy: "بدعم من",
    vat: "الرقم الضريبي",
    cr: "السجل التجاري",
    table: "طاولة",
    servedBy: "قدمه",
    dineIn: "داخل المطعم",
    takeaway: "سفري",
    delivery: "توصيل",
    paid: "مدفوعة",
    unpaid: "غير مدفوعة",
    pending: "قيد الانتظار",
    cash: "نقداً",
    card: "بطاقة",
    online: "إلكتروني",
    wallet: "محفظة",
    invoiceTo: "فاتورة إلى",
    shipTo: "الشحن إلى",
    date: "التاريخ",
    invoiceNo: "رقم الفاتورة",
    description: "وصف الصنف",
    totalDue: "المبلغ المستحق",
    paymentInfo: "معلومات الدفع",
    terms: "الطلب",
    policy: "الشروط والأحكام",
    information: "معلومات",
    questions: "استفسارات؟",
    emailUs: "راسلنا على",
    callUs: "أو اتصل على",
  },
};

const containsArabic = (text) => /[\u0600-\u06FF]/.test(String(text || ""));

const ARABIC_FORMS = {
  "\u0621": ["\uFE80"],
  "\u0622": ["\uFE81", "\uFE82"],
  "\u0623": ["\uFE83", "\uFE84"],
  "\u0624": ["\uFE85", "\uFE86"],
  "\u0625": ["\uFE87", "\uFE88"],
  "\u0626": ["\uFE89", "\uFE8A", "\uFE8B", "\uFE8C"],
  "\u0627": ["\uFE8D", "\uFE8E"],
  "\u0628": ["\uFE8F", "\uFE90", "\uFE91", "\uFE92"],
  "\u0629": ["\uFE93", "\uFE94"],
  "\u062A": ["\uFE95", "\uFE96", "\uFE97", "\uFE98"],
  "\u062B": ["\uFE99", "\uFE9A", "\uFE9B", "\uFE9C"],
  "\u062C": ["\uFE9D", "\uFE9E", "\uFE9F", "\uFEA0"],
  "\u062D": ["\uFEA1", "\uFEA2", "\uFEA3", "\uFEA4"],
  "\u062E": ["\uFEA5", "\uFEA6", "\uFEA7", "\uFEA8"],
  "\u062F": ["\uFEA9", "\uFEAA"],
  "\u0630": ["\uFEAB", "\uFEAC"],
  "\u0631": ["\uFEAD", "\uFEAE"],
  "\u0632": ["\uFEAF", "\uFEB0"],
  "\u0633": ["\uFEB1", "\uFEB2", "\uFEB3", "\uFEB4"],
  "\u0634": ["\uFEB5", "\uFEB6", "\uFEB7", "\uFEB8"],
  "\u0635": ["\uFEB9", "\uFEBA", "\uFEBB", "\uFEBC"],
  "\u0636": ["\uFEBD", "\uFEBE", "\uFEBF", "\uFEC0"],
  "\u0637": ["\uFEC1", "\uFEC2", "\uFEC3", "\uFEC4"],
  "\u0638": ["\uFEC5", "\uFEC6", "\uFEC7", "\uFEC8"],
  "\u0639": ["\uFEC9", "\uFECA", "\uFECB", "\uFECC"],
  "\u063A": ["\uFECD", "\uFECE", "\uFECF", "\uFED0"],
  "\u0641": ["\uFED1", "\uFED2", "\uFED3", "\uFED4"],
  "\u0642": ["\uFED5", "\uFED6", "\uFED7", "\uFED8"],
  "\u0643": ["\uFED9", "\uFEDA", "\uFEDB", "\uFEDC"],
  "\u0644": ["\uFEDD", "\uFEDE", "\uFEDF", "\uFEE0"],
  "\u0645": ["\uFEE1", "\uFEE2", "\uFEE3", "\uFEE4"],
  "\u0646": ["\uFEE5", "\uFEE6", "\uFEE7", "\uFEE8"],
  "\u0647": ["\uFEE9", "\uFEEA", "\uFEEB", "\uFEEC"],
  "\u0648": ["\uFEED", "\uFEEE"],
  "\u0649": ["\uFEEF", "\uFEF0"],
  "\u064A": ["\uFEF1", "\uFEF2", "\uFEF3", "\uFEF4"],
};

const LAM_ALEF = {
  "\u0644\u0627": ["\uFEFB", "\uFEFC"],
  "\u0644\u0623": ["\uFEF9", "\uFEFA"],
  "\u0644\u0625": ["\uFEF7", "\uFEF8"],
  "\u0644\u0622": ["\uFEF5", "\uFEF6"],
};

const joinsForward = (char) => (ARABIC_FORMS[char]?.length || 0) >= 4;

const reshapeArabic = (text) => {
  const chars = Array.from(text);
  let shaped = "";
  for (let index = 0; index < chars.length; index += 1) {
    const current = chars[index];
    const forms = ARABIC_FORMS[current];
    if (!forms) {
      shaped += current;
      continue;
    }
    const previous = chars[index - 1];
    const next = chars[index + 1];
    const ligature = next ? LAM_ALEF[current + next] : null;
    const previousJoins = joinsForward(previous);
    if (ligature) {
      shaped += previousJoins ? ligature[1] : ligature[0];
      index += 1;
      continue;
    }
    const nextJoins = Boolean(ARABIC_FORMS[next]);
    let form = 0;
    if (previousJoins && nextJoins && forms.length >= 4) form = 3;
    else if (previousJoins && forms.length >= 2) form = 1;
    else if (nextJoins && forms.length >= 4) form = 2;
    shaped += forms[form] || forms[0];
  }
  return shaped;
};

const DEJAVU = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
const DEJAVU_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
const arabicImageCache = new Map();

const arabicImage = (text, size, color, maxWidth, bold = false) => {
  const key = JSON.stringify([text, size, color, maxWidth, bold]);
  if (arabicImageCache.has(key)) return arabicImageCache.get(key);
  const fontPath = bold && fs.existsSync(DEJAVU_BOLD) ? DEJAVU_BOLD : DEJAVU;
  const result = spawnSync(
    "python3",
    [
      "-c",
      [
        "from PIL import Image, ImageDraw, ImageFont",
        "import sys",
        "text, size, color, font_path, max_width = sys.argv[1:]",
        "size = float(size)",
        "max_width = max(20.0, float(max_width))",
        "font = ImageFont.truetype(font_path, size)",
        "lines = []",
        "for paragraph in text.split('\\n'):",
        "    words = paragraph.split(' ')",
        "    current = ''",
        "    for word in words:",
        "        trial = word if not current else current + ' ' + word",
        "        if current and font.getlength(trial, direction='rtl', language='ar') > max_width:",
        "            lines.append(current)",
        "            current = word",
        "        else:",
        "            current = trial",
        "    lines.append(current)",
        "if not lines:",
        "    lines = ['']",
        "boxes = []",
        "for line in lines:",
        "    boxes.append(font.getbbox(line, direction='rtl', language='ar') if line else None)",
        "gap = max(2, int(size * 0.3))",
        "pad = 1",
        "content_w = max((box[2] - box[0]) if box else 1 for box in boxes)",
        "heights = [(box[3] - box[1]) if box else int(size) for box in boxes]",
        "width = pad * 2 + int(content_w)",
        "height = pad * 2 + sum(heights) + gap * max(0, len(lines) - 1)",
        "image = Image.new('RGBA', (max(width, 1), max(height, 1)), (0, 0, 0, 0))",
        "draw = ImageDraw.Draw(image)",
        "cursor = pad",
        "for line, box, line_h in zip(lines, boxes, heights):",
        "    if box:",
        "        draw.text((width - pad - box[2], cursor - box[1]), line, font=font, fill=color, direction='rtl', language='ar')",
        "    cursor += line_h + gap",
        "image.save(sys.stdout.buffer, 'PNG')",
      ].join("\n"),
      String(text ?? ""),
      String(size),
      color,
      fontPath,
      String(maxWidth || 400),
    ],
    { maxBuffer: 8 * 1024 * 1024 },
  );
  const buffer = result.status === 0 && result.stdout?.length >= 24 ? result.stdout : null;
  const image = buffer
    ? { buffer, width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
    : { buffer: Buffer.alloc(0), width: 0, height: size };
  arabicImageCache.set(key, image);
  return image;
};

const toVisual = (text) => {
  const shaped = reshapeArabic(String(text ?? ""));
  const tokens = [];
  let index = 0;
  while (index < shaped.length) {
    const latin = shaped.slice(index).match(/^\+?[A-Za-z0-9]+(?:[.@:+#%\-_/][A-Za-z0-9]+)*/);
    if (latin) {
      tokens.push({ kind: "ltr", value: latin[0] });
      index += latin[0].length;
      continue;
    }
    const space = shaped.slice(index).match(/^\s+/);
    if (space) {
      tokens.push({ kind: "space", value: space[0] });
      index += space[0].length;
      continue;
    }
    let end = index + 1;
    while (end < shaped.length && !/\s/.test(shaped[end]) && !/^[A-Za-z0-9+]/.test(shaped.slice(end))) end += 1;
    tokens.push({ kind: "rtl", value: shaped.slice(index, end) });
    index = end;
  }
  return tokens
    .reverse()
    .map((token) => (token.kind === "rtl" ? Array.from(token.value).reverse().join("") : token.value))
    .join("");
};

function localFile(value) {
  if (!value || typeof value !== "string") return null;
  let pathname = value.trim();
  if (!pathname) return null;
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    try {
      pathname = new URL(pathname).pathname;
    } catch {
      return null;
    }
  }
  const relative = pathname.replace(/^\/+/, "");
  const full = path.resolve(__dirname, "../..", relative);
  const uploadsRoot = path.resolve(__dirname, "../../uploads");
  if (!full.startsWith(uploadsRoot) && !full.startsWith(path.resolve(__dirname, "../assets"))) {
    return null;
  }
  return fs.existsSync(full) ? full : null;
}

function rasterBuffer(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(extension)) return null;

  const result = spawnSync(
    "python3",
    [
      "-c",
      [
        "import sys",
        "from PIL import Image",
        "image = Image.open(sys.argv[1]).convert('RGBA')",
        "alpha = image.getchannel('A')",
        "low, high = alpha.getextrema()",
        "if low < 250:",
        "    visible = [pixel for pixel in image.getdata() if pixel[3] > 20]",
        "    if visible:",
        "        light = sum(1 for r, g, b, a in visible if (r + g + b) / 3 > 200) / len(visible)",
        "        if light > 0.65:",
        "            pad = max(12, image.width // 10)",
        "            plate = Image.new('RGBA', (image.width + pad * 2, image.height + pad * 2), (17, 24, 39, 255))",
        "            plate.paste(image, (pad, pad), image)",
        "            image = plate",
        "image.save(sys.stdout.buffer, 'PNG')",
      ].join("\n"),
      filePath,
    ],
    { maxBuffer: 8 * 1024 * 1024 },
  );
  if (result.status !== 0 || !result.stdout?.length) {
    return [".png", ".jpg", ".jpeg"].includes(extension) ? fs.readFileSync(filePath) : null;
  }
  return result.stdout;
}

function logoSource(value) {
  const filePath = localFile(value);
  return filePath ? rasterBuffer(filePath) : null;
}

function businessLogo(restaurant) {
  return logoSource(restaurant?.logo) || logoSource(restaurant?.settings?.theme?.logo);
}

function invoicePrefs(restaurant) {
  const raw = restaurant?.settings?.invoice;
  const prefs = raw && typeof raw === "object" ? raw : {};
  const accent = typeof prefs.accentColor === "string" && /^#[0-9a-fA-F]{6}$/.test(prefs.accentColor)
    ? prefs.accentColor
    : "#111111";
  return {
    slogan: String(prefs.slogan || "").trim().slice(0, 80),
    policy: String(prefs.policy || "").trim().slice(0, 500),
    note: String(prefs.note || "").trim().slice(0, 400),
    accent,
    showLogo: prefs.showLogo !== false,
    showVat: prefs.showVat !== false,
    showCr: prefs.showCr !== false,
  };
}

const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const SYMBOLS = { USD: "$", EUR: "€", GBP: "£" };

export const generateInvoicePDF = (invoice, restaurant, platform = {}) => {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const arabicFontPath = path.join(__dirname, "../assets/fonts/NotoSansArabic-Regular.ttf");
  const hasArabicFont = fs.existsSync(arabicFontPath);
  if (hasArabicFont) doc.registerFont("Arabic", arabicFontPath);

  const platformName = platform?.name || "Restaurant ERP";
  const platformLogo = fs.readFileSync(path.join(__dirname, "../assets/platform-logo.png"));
  const currency = restaurant?.currency || "USD";
  const language = restaurant?.settings?.invoiceLanguage === "ar" ? "ar" : "en";
  const arabic = language === "ar";
  const copy = COPY[language];
  const prefs = invoicePrefs(restaurant);
  const ink = "#111111";
  const muted = "#6b7280";
  const line = "#d1d5db";
  const panel = "#f4f4f5";
  const left = 48;
  const right = doc.page.width - 48;
  const width = right - left;

  const textWidth = (text, size, bold = false) => {
    if (containsArabic(text)) return arabicImage(text, size, "#000000", 2000, bold).width;
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size);
    return doc.widthOfString(String(text ?? ""));
  };
  const draw = (text, x, y, options = {}) => {
    const value = String(text ?? "");
    const size = options.size || 10;
    const bold = Boolean(options.bold);
    if (containsArabic(value)) {
      const box = options.width || 400;
      const image = arabicImage(value, size, options.color || ink, box, bold);
      const align = options.align || "right";
      const dx = align === "right" ? x + box - image.width : x;
      if (image.buffer.length) doc.image(image.buffer, dx, y, { width: image.width, height: image.height });
      return image.height;
    }
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).fillColor(options.color || ink)
      .text(value, x, y, {
        width: options.width,
        align: options.align || "left",
        lineBreak: false,
      });
    return size;
  };
  const paragraphHeight = (text, boxWidth, size = 8) => {
    const value = String(text ?? "");
    if (!value) return 0;
    if (containsArabic(value)) return arabicImage(value, size, "#000000", boxWidth, false).height;
    doc.font("Helvetica").fontSize(size);
    return doc.heightOfString(value, { width: boxWidth });
  };
  const drawParagraph = (text, x, y, boxWidth, options = {}) => {
    const value = String(text ?? "");
    const size = options.size || 8;
    const color = options.color || muted;
    const align = options.align || "left";
    if (containsArabic(value)) return draw(value, x, y, { ...options, width: boxWidth, size, color, align });
    doc.font("Helvetica").fontSize(size).fillColor(color)
      .text(value, x, y, { width: boxWidth, align });
    return doc.heightOfString(value, { width: boxWidth });
  };
  const money = (amount) => {
    const formatted = Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return SYMBOLS[currency] ? `${SYMBOLS[currency]}${formatted}` : `${formatted} ${currency}`;
  };

  const issued = new Date(invoice.createdAt);
  const validDate = !Number.isNaN(issued.getTime());
  const headerDate = validDate
    ? `${String(issued.getMonth() + 1).padStart(2, "0")}.${String(issued.getDate()).padStart(2, "0")}.${issued.getFullYear()}`
    : "";
  const longDate = validDate
    ? (arabic
      ? `${issued.getDate()} ${AR_MONTHS[issued.getMonth()]} ${issued.getFullYear()}`
      : `${issued.getDate()} ${MONTHS[issued.getMonth()]} ${issued.getFullYear()}`)
    : "";
  const invoiceNo = String(invoice._id || invoice.id || "").slice(-6).toUpperCase();
  const customer = invoice.customer;
  const order = invoice.order;
  const businessMark = prefs.showLogo ? businessLogo(restaurant) : null;
  const accent = prefs.accent;

  doc.page.margins.left = 0;
  doc.page.margins.right = 0;
  doc.page.margins.bottom = 0;
  let y = 46;
  const logoSize = 34;
  const logoX = arabic ? right - logoSize : left;
  const nameWidth = 210;
  const nameX = arabic
    ? (prefs.showLogo ? logoX - 8 - nameWidth : right - nameWidth)
    : (prefs.showLogo ? left + 44 : left);
  const nameAlign = arabic ? "right" : "left";
  if (prefs.showLogo) {
    if (businessMark) {
      try {
        doc.image(businessMark, logoX, y, { fit: [logoSize, logoSize] });
      } catch {
        doc.rect(logoX, y, logoSize, logoSize).fill(accent);
      }
    } else {
      doc.rect(logoX, y, logoSize, logoSize).fill(accent);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(16)
        .text(String(restaurant?.name || "R").trim().charAt(0).toUpperCase(), logoX, y + 8, {
          width: logoSize,
          align: "center",
          lineBreak: false,
        });
    }
  }

  draw(String(restaurant?.name || "Restaurant").toUpperCase(), nameX, y + 2, {
    width: nameWidth,
    size: 13,
    bold: true,
    align: nameAlign,
  });
  const legal = [
    prefs.showVat && restaurant?.vatNumber ? `${copy.vat} ${restaurant.vatNumber}` : "",
    prefs.showCr && restaurant?.crNumber ? `${copy.cr} ${restaurant.crNumber}` : "",
  ].filter(Boolean);
  const headerLines = [];
  if (prefs.slogan) headerLines.push(prefs.slogan);
  if (!prefs.slogan && restaurant?.phone) headerLines.push(String(restaurant.phone));
  headerLines.push(...legal);
  headerLines.slice(0, 3).forEach((line, index) => {
    let size = 8;
    while (size > 6 && textWidth(line, size) > nameWidth) size -= 0.5;
    draw(line, nameX, y + 20 + index * 11, { width: nameWidth, size, color: muted, align: nameAlign });
  });

  const titleX = arabic ? left : right - 210;
  const titleAlign = arabic ? "left" : "right";
  draw(copy.invoice, titleX, y, { width: 200, size: 26, bold: true, color: accent, align: titleAlign });
  draw(`${copy.date}. ${headerDate}`, titleX, y + 44, { width: 200, size: 9, align: titleAlign });

  y = 124;
  doc.rect(left, y, width, 112).fill(panel);
  const colW = width / 2 - 28;
  const blockAlign = arabic ? "right" : "left";
  const block = (title, lines, x) => {
    draw(title, x, y + 16, { width: colW, size: 9, bold: true, align: blockAlign });
    lines.filter(Boolean).slice(0, 4).forEach((row, index) => {
      draw(row, x, y + 36 + index * 14, {
        width: colW,
        size: index === 0 ? 10 : 9,
        bold: index === 0,
        color: index === 0 ? ink : muted,
        align: blockAlign,
      });
    });
  };
  const shipLines = order?.type === "delivery"
    ? [customer?.name || copy.guest, order.deliveryAddress || customer?.address || "", customer?.phone || ""]
    : [restaurant?.name || "", restaurant?.address || "", invoice.table?.number ? `${copy.table} ${invoice.table.number}` : copy[order?.type] || ""];
  const invoiceToX = arabic ? left + width / 2 + 8 : left + 22;
  const shipToX = arabic ? left + 22 : left + width / 2 + 8;
  block(copy.invoiceTo, [
    customer?.name || copy.guest,
    customer?.address || restaurant?.address || "",
    customer?.phone || "",
  ], invoiceToX);
  block(copy.shipTo, shipLines, shipToX);

  y = 252;
  draw(`${copy.date}: ${longDate}`, arabic ? left + width / 2 : left, y, {
    width: width / 2,
    size: 9,
    align: arabic ? "right" : "left",
  });
  draw(`${copy.invoiceNo}: ${invoiceNo}`, arabic ? left : left + width / 2, y, {
    width: width / 2,
    size: 9,
    bold: true,
    align: arabic ? "left" : "right",
  });

  y += 18;
  doc.moveTo(left, y).lineTo(right, y).strokeColor(accent).lineWidth(1).stroke();
  y += 8;
  const columns = arabic
    ? [
        { key: "total", x: left, w: 78, align: "right" },
        { key: "qty", x: left + 90, w: 64, align: "right" },
        { key: "price", x: left + 166, w: 78, align: "right" },
        { key: "description", x: left + 256, w: width - 256 - 40, align: "right" },
        { key: "no", x: right - 32, w: 32, align: "right" },
      ]
    : [
        { key: "no", x: left, w: 28, align: "left" },
        { key: "description", x: left + 36, w: 210, align: "left" },
        { key: "price", x: left + 250, w: 80, align: "right" },
        { key: "qty", x: left + 336, w: 70, align: "right" },
        { key: "total", x: left + 410, w: width - 410, align: "right" },
      ];
  const headings = {
    no: arabic ? copy.number : "NO",
    description: copy.description,
    price: arabic ? copy.price : copy.price.toUpperCase(),
    qty: arabic ? copy.qty : copy.qty.toUpperCase(),
    total: arabic ? copy.total : copy.total.toUpperCase(),
  };
  columns.forEach((column) => {
    draw(headings[column.key], column.x, y, { width: column.w, align: column.align, size: 8, bold: true });
  });
  y += 16;
  doc.moveTo(left, y).lineTo(right, y).strokeColor(line).lineWidth(0.6).stroke();
  y += 10;

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const columnByKey = Object.fromEntries(columns.map((column) => [column.key, column]));
  items.forEach((item, index) => {
    const name = item.product?.name || copy.item;
    const noColumn = columnByKey.no;
    doc.font("Helvetica").fontSize(9).fillColor(ink)
      .text(`${index + 1}.`, noColumn.x, y, { width: noColumn.w, align: noColumn.align, lineBreak: false });
    draw(name, columnByKey.description.x, y, { width: columnByKey.description.w, size: 9, align: columnByKey.description.align });
    doc.font("Helvetica").fontSize(9).fillColor(ink)
      .text(money(item.price), columnByKey.price.x, y, { width: columnByKey.price.w, align: "right", lineBreak: false })
      .text(String(item.quantity ?? 0), columnByKey.qty.x, y, { width: columnByKey.qty.w, align: "right", lineBreak: false })
      .text(money(item.total), columnByKey.total.x, y, { width: columnByKey.total.w, align: "right", lineBreak: false });
    y += 22;
  });

  y += 4;
  doc.moveTo(left, y).lineTo(right, y).strokeColor(accent).lineWidth(1.2).stroke();
  y += 18;

  const dueX = arabic ? right - 190 : left;
  draw(copy.totalDue, dueX, y, { width: 180, size: 10, bold: true, color: accent, align: arabic ? "right" : "left" });
  doc.rect(dueX, y + 18, 190, 48).fill(panel);
  doc.fillColor(ink).font("Helvetica-Bold").fontSize(22)
    .text(money(invoice.grandTotal), dueX + 12, y + 32, {
      width: 166,
      align: arabic ? "right" : "left",
      lineBreak: false,
    });

  const taxAmount = (Number(invoice.subTotal) * Number(invoice.taxPercent || 0)) / 100;
  const serviceAmount = (Number(invoice.subTotal) * Number(invoice.serviceChargePercent || 0)) / 100;
  const totals = [
    [copy.subtotal, money(invoice.subTotal)],
    [copy.tax, money(taxAmount)],
  ];
  if (Number(invoice.serviceChargePercent) > 0) totals.push([copy.service, money(serviceAmount)]);
  if (Number(invoice.discount) > 0) totals.push([copy.discount, money(invoice.discount)]);
  totals.push([copy.grandTotal, money(invoice.grandTotal)]);
  let totalY = y;
  totals.forEach(([label, value], index) => {
    const last = index === totals.length - 1;
    if (arabic) {
      draw(`${label}: \u2066${value}\u2069`, left, totalY, { width: 260, size: 9, bold: last, align: "right" });
    } else {
      draw(`${label}:`, right - 210, totalY, { width: 110, size: 9, bold: last, align: "right" });
      doc.font("Helvetica-Bold").fontSize(9).fillColor(ink)
        .text(value, right - 90, totalY, { width: 90, align: "right", lineBreak: false });
    }
    totalY += last ? 20 : 16;
  });

  y = Math.max(y + 84, totalY + 16);
  const infoW = width / 3 - 12;
  const status = copy[invoice.paymentStatus] || invoice.paymentStatus || copy.unpaid;
  const method = invoice.paymentMethod ? (copy[invoice.paymentMethod] || invoice.paymentMethod) : "";
  const orderBits = [
    copy[order?.type] || "",
    invoice.table?.number ? `${copy.table} ${invoice.table.number}` : "",
    [invoice.notes, order?.notes].find((note) => note && !String(note).startsWith("[demo]")) || "",
  ].filter(Boolean);
  const infoColumns = [
    [copy.paymentInfo, [status, method].filter(Boolean).join(" · ")],
    [prefs.policy ? copy.policy : copy.terms, prefs.policy || orderBits.join("\n")],
    [copy.servedBy, invoice.issuedBy?.name || ""],
  ];
  let blockHeight = 0;
  infoColumns.forEach(([title, body], index) => {
    const x = arabic ? right - (index + 1) * (width / 3) : left + index * (width / 3);
    const align = arabic ? "right" : "left";
    draw(title, x, y, { width: infoW, size: 9, bold: true, align });
    const bodyHeight = Math.max(paragraphHeight(body, infoW, 8), drawParagraph(body, x, y + 16, infoW, { size: 8, color: muted, align }));
    blockHeight = Math.max(blockHeight, bodyHeight);
  });

  y += 28 + blockHeight;
  draw(copy.questions, arabic ? right - 220 : left, y, {
    width: 220,
    size: 10,
    bold: true,
    align: arabic ? "right" : "left",
  });
  const contacts = [
    restaurant?.email ? [copy.emailUs, restaurant.email] : null,
    restaurant?.phone ? [copy.callUs, restaurant.phone] : null,
  ].filter(Boolean);
  contacts.forEach(([label, value], index) => {
    const rowY = y + 18 + index * 16;
    if (arabic) {
      draw(`${label} ${value}`, right - 280, rowY, { width: 280, size: 8, color: muted, align: "right" });
    } else {
      doc.font("Helvetica").fontSize(8).fillColor(muted)
        .text(`${label} ${value}`, left, rowY, { lineBreak: false });
    }
  });
  if (prefs.note) {
    const noteY = y + (contacts.length ? 18 + contacts.length * 14 + 8 : 22);
    const noteX = arabic ? right - width : left;
    draw(copy.information, noteX, noteY, { width, size: 10, bold: true, align: arabic ? "right" : "left" });
    drawParagraph(prefs.note, noteX, noteY + 16, width, { size: 8, color: muted, align: arabic ? "right" : "left" });
  }

  const footerY = doc.page.height - 36;
  doc.moveTo(left, footerY).lineTo(right, footerY).strokeColor(line).lineWidth(0.6).stroke();
  draw(restaurant?.address || "", arabic ? right - 280 : left, footerY + 8, {
    width: 280,
    size: 7,
    color: muted,
    align: arabic ? "right" : "left",
  });
  doc.font("Helvetica").fontSize(7);
  const platformWidth = doc.widthOfString(platformName);
  const poweredImage = arabic ? arabicImage(copy.poweredBy, 7, muted, 80, false) : null;
  const poweredWidth = poweredImage ? poweredImage.width : doc.widthOfString(copy.poweredBy);
  if (arabic) {
    let markX = left;
    doc.font("Helvetica").fontSize(7).fillColor(muted)
      .text(platformName, markX, footerY + 8, { lineBreak: false });
    markX += platformWidth + 4;
    if (poweredImage.buffer.length) doc.image(poweredImage.buffer, markX, footerY + 6, { width: poweredImage.width, height: poweredImage.height });
    markX += poweredWidth + 4;
    try {
      doc.image(platformLogo, markX, footerY + 6, { fit: [12, 12] });
    } catch {
      // The name still identifies the platform.
    }
  } else {
    const groupX = right - (12 + 4 + poweredWidth + 4 + platformWidth);
    try {
      doc.image(platformLogo, groupX, footerY + 6, { fit: [12, 12] });
    } catch {
      // The name still identifies the platform.
    }
    doc.font("Helvetica").fontSize(7).fillColor(muted)
      .text(copy.poweredBy, groupX + 16, footerY + 8, { lineBreak: false });
    doc.font("Helvetica").fontSize(7).fillColor(muted)
      .text(platformName, groupX + 16 + poweredWidth + 4, footerY + 8, { lineBreak: false });
  }

  doc.end();
  return doc;
};

