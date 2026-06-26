const TEXT_EXTENSIONS = /\.(?:txt|csv|tsv)$/i;
const GZIP_EXTENSION = /\.gz$/i;
const TEXT_GZIP_EXTENSIONS = /\.(?:txt|csv|tsv)\.gz$/i;
const VCF_GZIP_EXTENSION = /\.vcf\.gz$/i;
const ZIP_EXTENSION = /\.zip$/i;
const ZIP_EOCD_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP_LOCAL_FILE_SIGNATURE = 0x04034b50;
const ZIP_METHOD_STORED = 0;
const ZIP_METHOD_DEFLATE = 8;

function textDecoder() {
  return new TextDecoder("utf-8", { fatal: false });
}

function stripByteOrderMark(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function cleanZipName(value) {
  return String(value || "").replace(/\\/g, "/").replace(/^\/+/, "");
}

function stripCompressionExtension(fileName) {
  return String(fileName || "genotype.txt").replace(/\.gz$/i, "");
}

function supportedGzipName(name) {
  const value = String(name || "");
  return !VCF_GZIP_EXTENSION.test(value) && (TEXT_GZIP_EXTENSIONS.test(value) || GZIP_EXTENSION.test(value));
}

function zipEntryScore(entry) {
  const name = cleanZipName(entry.name).toLowerCase();
  if (entry.directory) {
    return 100;
  }
  if (/(^|\/)(readme|metadata|manifest|license)(\.|$)/.test(name)) {
    return 50;
  }
  if (TEXT_EXTENSIONS.test(name)) {
    return 0;
  }
  if (supportedGzipName(name)) {
    return 1;
  }
  return 20;
}

function parseableZipEntry(entry) {
  return zipEntryScore(entry) <= 1;
}

function littleEndianView(bytes) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function readString(bytes, start, length) {
  return textDecoder().decode(bytes.subarray(start, start + length));
}

function findEndOfCentralDirectory(view) {
  const minOffset = Math.max(0, view.byteLength - 65557);
  for (let offset = view.byteLength - 22; offset >= minOffset; offset -= 1) {
    if (view.getUint32(offset, true) === ZIP_EOCD_SIGNATURE) {
      return offset;
    }
  }
  throw new Error("This ZIP file is missing a readable central directory.");
}

function listZipEntries(bytes) {
  const view = littleEndianView(bytes);
  const eocdOffset = findEndOfCentralDirectory(view);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const entries = [];
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(offset, true) !== ZIP_CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error("This ZIP file has an invalid central directory entry.");
    }

    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const name = cleanZipName(readString(bytes, offset + 46, nameLength));

    entries.push({
      name,
      flags,
      method,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
      directory: name.endsWith("/")
    });

    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function zipEntryData(bytes, entry) {
  const view = littleEndianView(bytes);
  const offset = entry.localHeaderOffset;
  if (view.getUint32(offset, true) !== ZIP_LOCAL_FILE_SIGNATURE) {
    throw new Error(`ZIP entry ${entry.name} has an invalid local header.`);
  }
  const nameLength = view.getUint16(offset + 26, true);
  const extraLength = view.getUint16(offset + 28, true);
  const start = offset + 30 + nameLength + extraLength;
  return bytes.subarray(start, start + entry.compressedSize);
}

async function streamDecompress(bytes, format) {
  if (typeof DecompressionStream !== "function") {
    throw new Error(`This browser cannot decompress ${format} files. Use an uncompressed .txt, .csv, or .tsv export.`);
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function browserDecompressors() {
  return {
    gzip: bytes => streamDecompress(bytes, "gzip"),
    deflateRaw: bytes => streamDecompress(bytes, "deflate-raw")
  };
}

async function inflateZipEntry(bytes, entry, decompressors) {
  if ((entry.flags & 1) !== 0) {
    throw new Error(`ZIP entry ${entry.name} is encrypted and cannot be read locally.`);
  }

  const data = zipEntryData(bytes, entry);
  if (entry.method === ZIP_METHOD_STORED) {
    return data;
  }
  if (entry.method === ZIP_METHOD_DEFLATE) {
    return decompressors.deflateRaw(data);
  }
  throw new Error(`ZIP entry ${entry.name} uses unsupported compression method ${entry.method}.`);
}

function decodeText(bytes) {
  return stripByteOrderMark(textDecoder().decode(bytes));
}

async function decodeGzip({ name, bytes, decompressors, containerName = null }) {
  const decompressed = await decompressors.gzip(bytes);
  const sourceName = stripCompressionExtension(name);
  return {
    text: decodeText(decompressed),
    label: containerName ? `${containerName} / ${sourceName}` : sourceName,
    metadata: {
      fileName: containerName || name,
      sourceName,
      containerName,
      compression: containerName ? "zip+gzip" : "gzip",
      importedFrom: sourceName,
      selectedZipEntry: containerName ? sourceName : null
    },
    warnings: []
  };
}

async function decodeZip({ name, bytes, decompressors }) {
  const entries = listZipEntries(bytes);
  const candidates = entries.filter(parseableZipEntry).sort((left, right) =>
    zipEntryScore(left) - zipEntryScore(right) ||
    right.uncompressedSize - left.uncompressedSize ||
    left.name.localeCompare(right.name)
  );

  if (!candidates.length) {
    throw new Error("The ZIP file does not contain a supported .txt, .csv, .tsv, or .gz genotype export.");
  }

  const entry = candidates[0];
  const entryBytes = await inflateZipEntry(bytes, entry, decompressors);
  const warnings = candidates.length > 1
    ? [`ZIP contained ${candidates.length} parseable files; selected ${entry.name}.`]
    : [];

  if (supportedGzipName(entry.name)) {
    const gzip = await decodeGzip({ name: entry.name, bytes: entryBytes, decompressors, containerName: name });
    return {
      ...gzip,
      label: `${name} / ${gzip.metadata.sourceName}`,
      warnings: [...warnings, ...gzip.warnings],
      metadata: {
        ...gzip.metadata,
        fileName: name,
        containerName: name,
        selectedZipEntry: entry.name,
        compression: "zip+gzip",
        importedFrom: gzip.metadata.sourceName
      }
    };
  }

  return {
    text: decodeText(entryBytes),
    label: `${name} / ${entry.name}`,
    metadata: {
      fileName: name,
      sourceName: entry.name,
      containerName: name,
      selectedZipEntry: entry.name,
      compression: entry.method === ZIP_METHOD_STORED ? "zip-stored" : "zip-deflate",
      importedFrom: entry.name
    },
    warnings
  };
}

export async function decodeGenotypeBytes({ name, bytes, decompressors = browserDecompressors() }) {
  const fileName = String(name || "genotype.txt");
  const inputBytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);

  if (ZIP_EXTENSION.test(fileName)) {
    return decodeZip({ name: fileName, bytes: inputBytes, decompressors });
  }

  if (VCF_GZIP_EXTENSION.test(fileName) || /\.vcf$/i.test(fileName)) {
    throw new Error("VCF and VCF.GZ files are not supported by the Lite analyzer yet.");
  }

  if (supportedGzipName(fileName)) {
    return decodeGzip({ name: fileName, bytes: inputBytes, decompressors });
  }

  return {
    text: decodeText(inputBytes),
    label: fileName,
    metadata: {
      fileName,
      sourceName: fileName,
      containerName: null,
      selectedZipEntry: null,
      compression: "none",
      importedFrom: fileName
    },
    warnings: []
  };
}

export async function readGenotypeFile(file) {
  if (!file) {
    throw new Error("No genotype file selected.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  return decodeGenotypeBytes({ name: file.name, bytes });
}
