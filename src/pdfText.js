export async function extractPdfTextFromFile(file) {
  return await extractPdfTextFromBytes(new Uint8Array(await file.arrayBuffer()));
}

export async function extractPdfTextFromBytes(bytes) {
  const source = bytesToBinaryString(bytes);
  return await extractPdfTextFromSource(source);
}

export async function extractPdfTextFromSource(source) {
  const { streams, compressedStreams, streamCount } = extractStreams(String(source ?? ""));
  const inflatedStreams = await inflateCompressedStreams(compressedStreams);
  const contentSources = [...streams, ...inflatedStreams];
  const fallbackSources = contentSources.length > 0 ? contentSources : streamCount === 0 ? [String(source ?? "")] : [];
  const text = normalizePdfText(fallbackSources.map(extractTextFromContentStream).join("\n"));

  if (text) {
    return text;
  }

  if (compressedStreams.length > 0) {
    throw new Error("PDF text could not be extracted from compressed streams. Export CSV or use OCR for image-only PDFs.");
  }

  throw new Error("PDF text could not be extracted. Export CSV or use OCR for image-only PDFs.");
}

function extractStreams(source) {
  const streams = [];
  const compressedStreams = [];
  let streamCount = 0;
  const pattern = /([\s\S]{0,800})stream\r?\n?([\s\S]*?)\r?\n?endstream/g;
  let match = pattern.exec(source);

  while (match) {
    streamCount += 1;
    const dictionary = match[1].slice(match[1].lastIndexOf("<<"));
    if (/\/Filter\s*(?:\/FlateDecode|\[[^\]]*\/FlateDecode)/.test(dictionary)) {
      compressedStreams.push(match[2].replace(/^\r?\n/, "").replace(/\r?\n$/, ""));
    } else {
      streams.push(match[2].replace(/^\r?\n/, "").replace(/\r?\n$/, ""));
    }
    match = pattern.exec(source);
  }

  return { streams, compressedStreams, streamCount };
}

async function inflateCompressedStreams(streams) {
  const inflatedStreams = [];

  for (const stream of streams) {
    const inflated = await inflateFlateDecodeStream(stream);
    if (inflated) {
      inflatedStreams.push(inflated);
    }
  }

  return inflatedStreams;
}

async function inflateFlateDecodeStream(stream) {
  if (typeof DecompressionStream !== "function") {
    return "";
  }

  for (const format of ["deflate", "deflate-raw"]) {
    const inflated = await inflateWithFormat(stream, format);
    if (inflated) {
      return inflated;
    }
  }

  return "";
}

async function inflateWithFormat(stream, format) {
  try {
    const input = latin1ToBytes(stream);
    const decompressor = new DecompressionStream(format);
    const writer = decompressor.writable.getWriter();
    const output = await withTimeout(
      (async () => {
        await writer.write(input);
        await writer.close();
        return await new Response(decompressor.readable).arrayBuffer();
      })(),
      3000
    );
    return new TextDecoder("latin1").decode(output);
  } catch {
    return "";
  }
}

async function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("PDF decompression timed out.")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

function latin1ToBytes(value) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }
  return bytes;
}

function bytesToBinaryString(bytes) {
  const chunkSize = 8192;
  const chunks = [];

  for (let index = 0; index < bytes.length; index += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.slice(index, index + chunkSize)));
  }

  return chunks.join("");
}

function extractTextFromContentStream(content) {
  const pieces = [];
  let index = 0;

  while (index < content.length) {
    const char = content[index];

    if (char === "(") {
      const { value, nextIndex } = readLiteralString(content, index + 1);
      pieces.push(value);
      index = nextIndex;
      continue;
    }

    if (char === "<" && content[index + 1] !== "<") {
      const { value, nextIndex } = readHexString(content, index + 1);
      pieces.push(value);
      index = nextIndex;
      continue;
    }

    if (isOperatorBreak(content, index)) {
      if (pieces.at(-1) !== "\n") {
        pieces.push("\n");
      }
      index += content[index] === "T" ? 2 : 1;
      continue;
    }

    index += 1;
  }

  return pieces.join("");
}

function readLiteralString(content, startIndex) {
  let value = "";
  let depth = 1;
  let index = startIndex;

  while (index < content.length && depth > 0) {
    const char = content[index];

    if (char === "\\") {
      const escaped = readEscapedCharacter(content, index + 1);
      value += escaped.value;
      index = escaped.nextIndex;
      continue;
    }

    if (char === "(") {
      depth += 1;
      value += char;
      index += 1;
      continue;
    }

    if (char === ")") {
      depth -= 1;
      if (depth > 0) {
        value += char;
      }
      index += 1;
      continue;
    }

    value += char;
    index += 1;
  }

  return { value, nextIndex: index };
}

function readEscapedCharacter(content, startIndex) {
  const char = content[startIndex];
  const escaped = {
    n: "\n",
    r: "\r",
    t: "\t",
    b: "\b",
    f: "\f",
    "(": "(",
    ")": ")",
    "\\": "\\"
  };

  if (char === "\r" || char === "\n") {
    return { value: "", nextIndex: char === "\r" && content[startIndex + 1] === "\n" ? startIndex + 2 : startIndex + 1 };
  }

  if (/[0-7]/.test(char || "")) {
    const match = content.slice(startIndex, startIndex + 3).match(/^[0-7]{1,3}/);
    return { value: String.fromCharCode(Number.parseInt(match[0], 8)), nextIndex: startIndex + match[0].length };
  }

  return { value: escaped[char] ?? char ?? "", nextIndex: startIndex + 1 };
}

function readHexString(content, startIndex) {
  const endIndex = content.indexOf(">", startIndex);
  const rawHex = content.slice(startIndex, endIndex === -1 ? content.length : endIndex).replace(/[^0-9a-f]/gi, "");
  const pairs = rawHex.length % 2 === 0 ? rawHex.match(/.{1,2}/g) || [] : `${rawHex}0`.match(/.{1,2}/g) || [];
  const value = pairs.map((pair) => String.fromCharCode(Number.parseInt(pair, 16))).join("");

  return { value, nextIndex: endIndex === -1 ? content.length : endIndex + 1 };
}

function isOperatorBreak(content, index) {
  const before = content[index - 1] ?? " ";
  const after = content[index + 2] ?? " ";
  const twoCharOperator = content.slice(index, index + 2);

  if (twoCharOperator === "T*" && /\s/.test(before) && /\s/.test(after)) {
    return true;
  }

  if ((content[index] === "'" || content[index] === "\"") && /\s/.test(before)) {
    return true;
  }

  return false;
}

function normalizePdfText(text) {
  return text
    .replace(/\u0000/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \f\v]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}
