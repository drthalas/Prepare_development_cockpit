type ZipFileInput = {
  content: string;
  path: string;
};

const encoder = new TextEncoder();

export function buildStoredZip(files: ZipFileInput[]) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const contentBytes = encoder.encode(file.content);
    const crc = crc32(contentBytes);
    const localHeader = createLocalHeader({
      crc,
      nameBytes,
      size: contentBytes.length,
    });
    const centralHeader = createCentralHeader({
      crc,
      nameBytes,
      offset,
      size: contentBytes.length,
    });

    localParts.push(localHeader, contentBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + contentBytes.length;
  }

  const centralDirectorySize = centralParts.reduce(
    (size, part) => size + part.length,
    0,
  );
  const endRecord = createEndRecord({
    centralDirectoryOffset: offset,
    centralDirectorySize,
    fileCount: files.length,
  });

  return Buffer.concat([
    ...localParts.map(Buffer.from),
    ...centralParts.map(Buffer.from),
    Buffer.from(endRecord),
  ]);
}

function createLocalHeader(input: {
  crc: number;
  nameBytes: Uint8Array;
  size: number;
}) {
  const header = new Uint8Array(30 + input.nameBytes.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint32(14, input.crc, true);
  view.setUint32(18, input.size, true);
  view.setUint32(22, input.size, true);
  view.setUint16(26, input.nameBytes.length, true);
  view.setUint16(28, 0, true);
  header.set(input.nameBytes, 30);

  return header;
}

function createCentralHeader(input: {
  crc: number;
  nameBytes: Uint8Array;
  offset: number;
  size: number;
}) {
  const header = new Uint8Array(46 + input.nameBytes.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0, true);
  view.setUint32(16, input.crc, true);
  view.setUint32(20, input.size, true);
  view.setUint32(24, input.size, true);
  view.setUint16(28, input.nameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, input.offset, true);
  header.set(input.nameBytes, 46);

  return header;
}

function createEndRecord(input: {
  centralDirectoryOffset: number;
  centralDirectorySize: number;
  fileCount: number;
}) {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, input.fileCount, true);
  view.setUint16(10, input.fileCount, true);
  view.setUint32(12, input.centralDirectorySize, true);
  view.setUint32(16, input.centralDirectoryOffset, true);
  view.setUint16(20, 0, true);

  return header;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }

  return (crc ^ 0xffffffff) >>> 0;
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index;

  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }

  return crc >>> 0;
});
