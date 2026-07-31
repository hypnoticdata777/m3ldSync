import assert from "node:assert/strict";
import test from "node:test";
import { deflateSync } from "node:zlib";
import { parsePropertyMeldPdfText } from "../src/domain.js";
import { extractTextFromImages } from "../src/pdfOcr.js";
import { extractPdfTextFromSource } from "../src/pdfText.js";

const pdfTableHeader = [
  "Meld Number",
  "Unit",
  "Property Name",
  "Work Category",
  "Work Type",
  "Description",
  "Priority",
  "Meld Status",
  "Meld creation date",
  "Meld completion date",
  "Total Labor Hours"
].join("\t");

const pdfTableRow = [
  "PDF-1001",
  "10A",
  "PDF Towers",
  "Plumbing",
  "Resident Request",
  "Leaking sink from text-based PDF export",
  "Medium",
  "Pending vendor acceptance",
  "07/01/2026 09:00",
  "",
  "0"
].join("\t");

test("parses text-based PDF table exports into import rows", () => {
  const rows = parsePropertyMeldPdfText(`${pdfTableHeader}\n${pdfTableRow}`);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, "PDF-1001");
  assert.equal(rows[0].property, "PDF Towers");
  assert.equal(rows[0].sourceStatus, "Pending vendor acceptance");
  assert.equal(rows[0].completedDate, null);
});

test("extracts simple text streams from uncompressed PDFs", async () => {
  const source = `%PDF-1.4
1 0 obj
<< /Length 120 >>
stream
BT
(${escapePdfLiteral(pdfTableHeader)}) Tj
T*
(${escapePdfLiteral(pdfTableRow)}) Tj
ET
endstream
endobj`;
  const text = await extractPdfTextFromSource(source);
  const rows = parsePropertyMeldPdfText(text);

  assert.match(text, /Meld Number/);
  assert.equal(rows[0].id, "PDF-1001");
});

test("extracts compressed text streams from FlateDecode PDFs", async () => {
  const stream = `BT
(${escapePdfLiteral(pdfTableHeader)}) Tj
T*
(${escapePdfLiteral(pdfTableRow)}) Tj
ET`;
  const compressedStream = deflateSync(Buffer.from(stream, "latin1")).toString("latin1");
  const source = `%PDF-1.4
1 0 obj
<< /Filter /FlateDecode /Length ${compressedStream.length} >>
stream
${compressedStream}
endstream
endobj`;
  const text = await extractPdfTextFromSource(source);
  const rows = parsePropertyMeldPdfText(text);

  assert.match(text, /Meld Number/);
  assert.equal(rows[0].id, "PDF-1001");
});

test("image-only or unreadable PDFs fail with OCR guidance", async () => {
  await assert.rejects(
    () => extractPdfTextFromSource("<< /Filter /DCTDecode >>\nstream\nimage-bytes\nendstream"),
    /OCR/
  );
});

test("OCR image text feeds the Property Meld import parser", async () => {
  const worker = {
    calls: 0,
    async recognize() {
      this.calls += 1;
      return {
        data: {
          text: `${pdfTableHeader}\n${pdfTableRow}`
        }
      };
    },
    async terminate() {
      this.terminated = true;
    }
  };
  const text = await extractTextFromImages(["data:image/png;base64,scan"], { worker });
  const rows = parsePropertyMeldPdfText(text);

  assert.equal(worker.calls, 1);
  assert.equal(worker.terminated, true);
  assert.equal(rows[0].id, "PDF-1001");
});

test("parses noisy OCR table text when headers are partially recovered", () => {
  const ocrText = `Synthetic Property Meld OCR Import

Meld Number |Unit|Property Name |Work Category|Work Type|Description|Priority|Meld Status|Meld creation date|Meld completion dz

QA-9001|12A|QA Towers|Plumbing|Resident Request|Synthetic faucet scan test|Medium|Pending vendor acceptance|@7/30/2026 ©9:00]|`;
  const rows = parsePropertyMeldPdfText(ocrText);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, "QA-9001");
  assert.equal(rows[0].createdDate, new Date(2026, 6, 30, 9, 0).toISOString());
  assert.equal(rows[0].totalLaborHours, 0);
});

test("OCR rejects rendered scans with no readable text", async () => {
  await assert.rejects(
    () =>
      extractTextFromImages(["data:image/png;base64,blank"], {
        worker: {
          async recognize() {
            return { data: { text: "" } };
          },
          async terminate() {}
        }
      }),
    /OCR did not find readable text/
  );
});

function escapePdfLiteral(value) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
