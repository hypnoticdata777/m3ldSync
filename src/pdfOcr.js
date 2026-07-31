const DEFAULT_OCR_OPTIONS = {
  language: "eng",
  maxPages: 25,
  scale: 2,
  workerPath: "../node_modules/tesseract.js/dist/worker.min.js",
  corePath: "../node_modules/tesseract.js-core",
  langPath: "../node_modules/@tesseract.js-data/eng/4.0.0_best_int",
  pdfWorkerPath: "../node_modules/pdfjs-dist/build/pdf.worker.min.mjs"
};

export async function extractPdfTextWithOcrFromFile(file, options = {}) {
  return await extractPdfTextWithOcrFromBytes(new Uint8Array(await file.arrayBuffer()), options);
}

export async function extractPdfTextWithOcrFromBytes(bytes, options = {}) {
  const pageImages = await renderPdfPagesToImages(bytes, options);
  return await extractTextFromImages(pageImages, options);
}

export async function extractTextFromImages(images, options = {}) {
  if (!images.length) {
    throw new Error("OCR could not render any PDF pages.");
  }

  const worker = await createOcrWorker(options);
  const textParts = [];

  try {
    for (const image of images) {
      const result = await worker.recognize(image, {}, { text: true });
      const text = result?.data?.text?.trim();
      if (text) {
        textParts.push(text);
      }
    }
  } finally {
    await worker.terminate();
  }

  const text = textParts.join("\n").trim();
  if (!text) {
    throw new Error("OCR did not find readable text in this PDF.");
  }

  return text;
}

async function renderPdfPagesToImages(bytes, options = {}) {
  if (typeof document === "undefined") {
    throw new Error("OCR PDF rendering requires a browser canvas.");
  }

  const settings = { ...DEFAULT_OCR_OPTIONS, ...options };
  const pdfjs = await loadPdfjs();
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(settings.pdfWorkerPath, import.meta.url).href;

  const documentTask = pdfjs.getDocument({ data: bytes.slice().buffer });
  const pdfDocument = await documentTask.promise;
  const pageCount = Math.min(pdfDocument.numPages, settings.maxPages);
  const images = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: settings.scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });

    if (!context) {
      throw new Error("OCR PDF rendering could not create a canvas context.");
    }

    await page.render({ canvasContext: context, viewport }).promise;
    images.push(canvas.toDataURL("image/png"));
  }

  return images;
}

async function createOcrWorker(options = {}) {
  const settings = { ...DEFAULT_OCR_OPTIONS, ...options };
  if (settings.worker) {
    return settings.worker;
  }

  const Tesseract = await loadTesseract();
  const worker = await Tesseract.createWorker(settings.language, 1, {
    workerPath: new URL(settings.workerPath, import.meta.url).href,
    corePath: new URL(settings.corePath, import.meta.url).href,
    langPath: new URL(settings.langPath, import.meta.url).href,
    logger: settings.logger || (() => {})
  });

  await worker.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT
  });

  return worker;
}

async function loadPdfjs() {
  return await import("../node_modules/pdfjs-dist/build/pdf.min.mjs");
}

async function loadTesseract() {
  const module = await import("../node_modules/tesseract.js/dist/tesseract.esm.min.js");
  return module.default;
}
