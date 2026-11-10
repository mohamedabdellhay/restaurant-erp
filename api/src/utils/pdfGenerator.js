import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Arabic translations for all static invoice labels
const AR = {
    invoice: "فاتورة مطعم",
    invoiceNum: "رقم الفاتورة",
    date: "التاريخ",
    orderInfo: "معلومات الطلب",
    orderNum: "رقم الطلب",
    table: "الطاولة",
    customer: "العميل",
    staff: "الموظف",
    item: "الصنف",
    qty: "الكمية",
    price: "السعر",
    total: "الإجمالي",
    subtotal: "المجموع الفرعي",
    tax: "الضريبة",
    service: "رسوم الخدمة",
    grandTotal: "الإجمالي الكلي",
    thankYou: "شكراً لزيارتكم!",
    erpSystem: "نظام إدارة المطعم",
    note: "ملاحظة",
};

// Helper: Check if text contains Arabic characters
const containsArabic = (text) => /[\u0600-\u06FF]/.test(text);

// Helper: PDFKit renders LTR, so for Arabic text we must reverse word order
const prepareText = (text) => {
    if (!text) return String(text ?? "");
    if (containsArabic(String(text))) {
        return String(text).trim().split(/\s+/).reverse().join(" ");
    }
    return String(text);
};

export const generateInvoicePDF = (invoice, restaurant) => {
    const doc = new PDFDocument({ margin: 50 });

    // Register Arabic font for UTF-8 support
    const arabicFontPath = path.join(__dirname, "../assets/fonts/NotoSansArabic-Regular.ttf");
    const hasArabicFont = fs.existsSync(arabicFontPath);
    if (hasArabicFont) {
        try {
            doc.registerFont("NotoSansArabic", arabicFontPath);
        } catch (fontErr) {
            console.error("Could not register Arabic font:", fontErr.message);
        }
    }

    // Helper: set font based on text content
    const setFont = (text, bold = false) => {
        if (hasArabicFont && containsArabic(text)) {
            doc.font("NotoSansArabic");
        } else {
            doc.font(bold ? "Helvetica-Bold" : "Helvetica");
        }
    };

    // Helper: draw a bilingual label line — English on left, Arabic on right
    // x: starting X for English text; y: Y position; width of the row
    const bilingualRow = (enText, arText, x, y, opts = {}) => {
        const rowWidth = opts.rowWidth || 500;
        doc.font("Helvetica").fontSize(opts.fontSize || 10).fillColor(opts.color || "#444444")
            .text(enText, x, y, { width: rowWidth / 2 });

        if (hasArabicFont) {
            doc.font("NotoSansArabic").fontSize(opts.fontSize || 10).fillColor(opts.color || "#444444")
                .text(prepareText(arText), x + rowWidth / 2, y, { width: rowWidth / 2, align: "right" });
        }
    };

    // Helper: draw a bilingual label+value row
    // Shows:  "Label: Value"  on left | "القيمة: :التسمية" on right
    const bilingualLabelValue = (enLabel, arLabel, value, x, y, opts = {}) => {
        const rowWidth = opts.rowWidth || 500;
        const displayValue = prepareText(String(value || ""));

        doc.font("Helvetica").fontSize(10).fillColor("#555555")
            .text(`${enLabel}: `, x, y, { continued: true });
        doc.fillColor("#444444");
        setFont(String(value || ""));
        doc.text(String(value || ""));

        if (hasArabicFont) {
            const arLine = `${displayValue} :${prepareText(arLabel)}`;
            doc.font("NotoSansArabic").fontSize(10).fillColor("#444444")
                .text(arLine, x + rowWidth / 2, y, { width: rowWidth / 2, align: "right" });
        }
    };

    doc.font("Helvetica");

    // ── HEADER ──────────────────────────────────────────────────────────
    let headerY = 45;
    const logoX = 50;
    const headerTextX = 110;

    // Business logo (commented out in user edits — skipping safely)
    if (restaurant?.logo) {
        const logoPath = path.join(__dirname, "../..", restaurant.logo.replace(/^\//, ""));
        if (fs.existsSync(logoPath)) {
            try {
                doc.image(logoPath, logoX, headerY, { width: 50, height: 50, fit: [50, 50] });
            } catch (e) {
                console.error("Logo load error:", e.message);
            }
        }
    }

    // Business name — bilingual if available
    doc.fillColor("#444444");
    if (restaurant?.name) {
        const nameEn = restaurant.name;
        setFont(nameEn);
        doc.fontSize(15).text(prepareText(nameEn), headerTextX, headerY);
        headerY += 22;
    }

    // Invoice title bilingual
    doc.font("Helvetica").fontSize(13).fillColor("#444444")
        .text("RESTAURANT INVOICE", headerTextX, headerY, { continued: hasArabicFont });
    if (hasArabicFont) {
        doc.font("NotoSansArabic").fontSize(13)
            .text(`  |  ${prepareText(AR.invoice)}`);
    }
    headerY += 20;

    // Invoice number + date (right aligned)
    doc.font("Helvetica").fontSize(9).fillColor("#666666")
        .text(`Invoice #: ${invoice._id}`, 200, 47, { align: "right" })
        .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 200, 59, { align: "right" });

    if (hasArabicFont) {
        doc.font("NotoSansArabic").fontSize(9).fillColor("#666666")
            .text(`${prepareText(AR.invoiceNum)}: ${invoice._id}`, 200, 71, { align: "right" })
            .text(`${prepareText(AR.date)}: ${new Date(invoice.createdAt).toLocaleDateString()}`, 200, 83, { align: "right" });
    }

    // ── DIVIDER ──────────────────────────────────────────────────────────
    const lineY = Math.max(105, headerY + 12);
    doc.moveTo(50, lineY).lineTo(550, lineY).strokeColor("#cccccc").stroke();

    // ── ORDER INFORMATION ────────────────────────────────────────────────
    const infoY = lineY + 12;
    bilingualRow("Order Information", AR.orderInfo, 50, infoY, { fontSize: 11 });
    doc.moveTo(50, infoY + 16).lineTo(550, infoY + 16).strokeColor("#eeeeee").stroke();

    const orderNum = invoice.order?.orderNumber || "N/A";
    const tableNum = String(invoice.table?.number || "N/A");
    const customerName = invoice.customer?.name || "Guest";
    const staffName = invoice.issuedBy?.name || "N/A";

    bilingualLabelValue("Order #", AR.orderNum, orderNum, 50, infoY + 22);
    bilingualLabelValue("Table", AR.table, tableNum, 50, infoY + 36);
    bilingualLabelValue("Customer", AR.customer, customerName, 50, infoY + 50);
    bilingualLabelValue("Staff", AR.staff, staffName, 50, infoY + 64);

    // ── ITEMS TABLE HEADER ───────────────────────────────────────────────
    let y = infoY + 90;
    doc.fillColor("#333333");
    bilingualRow("Item", AR.item, 50, y);
    doc.font("Helvetica").fontSize(10).fillColor("#333333")
        .text("Qty", 280, y, { width: 30, align: "right" })
        .text("Price", 350, y, { width: 60, align: "right" })
        .text("Total", 450, y, { width: 100, align: "right" });

    if (hasArabicFont) {
        doc.font("NotoSansArabic").fontSize(9).fillColor("#333333")
            .text(prepareText(AR.qty), 280, y + 12, { width: 30, align: "right" })
            .text(prepareText(AR.price), 350, y + 12, { width: 60, align: "right" })
            .text(prepareText(AR.total), 450, y + 12, { width: 100, align: "right" });
        y += 12;
    }

    doc.moveTo(50, y + 14).lineTo(550, y + 14).strokeColor("#cccccc").stroke();
    y += 24;

    // ── ITEMS ────────────────────────────────────────────────────────────
    invoice.items.forEach((item) => {
        const productName = item.product?.name || "Product";
        setFont(productName);
        doc.fontSize(10).fillColor("#444444").text(prepareText(productName), 50, y);

        doc.font("Helvetica").fillColor("#444444")
            .text(item.quantity.toString(), 280, y, { width: 30, align: "right" })
            .text(item.price.toFixed(2), 350, y, { width: 60, align: "right" })
            .text(item.total.toFixed(2), 450, y, { width: 100, align: "right" });
        y += 16;

        // Modifiers
        if (item.modifiers && item.modifiers.length > 0) {
            item.modifiers.forEach((mod) => {
                doc.fontSize(8).fillColor("#777777");
                setFont(mod.name);
                doc.text(`+ ${prepareText(mod.name)} (${mod.price.toFixed(2)})`, 60, y);
                y += 12;
            });
        }

        // Notes
        if (item.notes) {
            doc.fontSize(8).fillColor("#555555");
            setFont(item.notes);
            doc.text(`${AR.note}: ${prepareText(item.notes)}  |  Note: ${item.notes}`, 60, y);
            y += 12;
        }

        doc.fillColor("#444444").fontSize(10);
        y += 6;
    });

    // ── SUMMARY ──────────────────────────────────────────────────────────
    y += 12;
    doc.moveTo(350, y).lineTo(550, y).strokeColor("#cccccc").stroke();
    y += 10;

    const summaryLine = (enLabel, arLabel, value, bold = false) => {
        const font = bold ? "Helvetica-Bold" : "Helvetica";
        doc.font(font).fontSize(bold ? 11 : 10).fillColor("#444444")
            .text(`${enLabel}:`, 350, y)
            .text(value, 450, y, { align: "right" });

        if (hasArabicFont) {
            doc.font("NotoSansArabic").fontSize(10).fillColor("#666666")
                .text(prepareText(arLabel), 350, y + (bold ? 13 : 12), { width: 100 });
        }
        y += hasArabicFont ? (bold ? 26 : 24) : (bold ? 16 : 20);
    };

    summaryLine("Subtotal", AR.subtotal, invoice.subTotal.toFixed(2));

    if (invoice.taxPercent) {
        const taxPct = parseFloat(invoice.taxPercent.toFixed(2));
        summaryLine(`Tax (${taxPct}%)`, AR.tax, (invoice.subTotal * (invoice.taxPercent / 100)).toFixed(2));
    }

    if (invoice.serviceChargePercent) {
        const svcPct = parseFloat(invoice.serviceChargePercent.toFixed(2));
        summaryLine(`Service (${svcPct}%)`, AR.service, (invoice.subTotal * (invoice.serviceChargePercent / 100)).toFixed(2));
    }

    summaryLine("Grand Total", AR.grandTotal, invoice.grandTotal.toFixed(2), true);

    // ── FOOTER ──────────────────────────────────────────────────────────
    const footerY = 720;
    doc.font("Helvetica").fontSize(10).fillColor("#888888")
        .text("Thank you for your business!", 50, footerY, { align: "center", width: 500 });

    if (hasArabicFont) {
        doc.font("NotoSansArabic").fontSize(10).fillColor("#888888")
            .text(prepareText(AR.thankYou), 50, footerY + 14, { align: "center", width: 500 });
        doc.font("NotoSansArabic").fontSize(8).fillColor("#aaaaaa")
            .text(prepareText(AR.erpSystem), 50, footerY + 30, { align: "center", width: 500 });
    }

    doc.font("Helvetica").fontSize(8).fillColor("#aaaaaa")
        .text("Restaurant ERP System", 50, footerY + (hasArabicFont ? 44 : 16), { align: "center", width: 500 });

    doc.end();
    return doc;
};
