const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

let value = 1;
for (let i = 0; i < 255; i += 1) {
  EXP[i] = value;
  LOG[value] = i;
  value <<= 1;
  if (value & 0x100) value ^= 0x11d;
}
for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];

const VERSIONS = {
  1: { size: 21, align: [], blocks: [[16, 10]] },
  2: { size: 25, align: [18], blocks: [[28, 16]] },
  3: { size: 29, align: [22], blocks: [[44, 26]] },
  4: { size: 33, align: [26], blocks: [[32, 18], [32, 18]] },
  5: { size: 37, align: [30], blocks: [[43, 24], [43, 24]] },
  6: { size: 41, align: [34], blocks: [[27, 16], [27, 16], [27, 16], [27, 16]] },
};

function mul(left, right) {
  if (!left || !right) return 0;
  return EXP[LOG[left] + LOG[right]];
}

function reedSolomon(data, length) {
  let generator = [1];
  for (let i = 0; i < length; i += 1) {
    const next = new Array(generator.length + 1).fill(0);
    generator.forEach((coef, index) => {
      next[index] ^= coef;
      next[index + 1] ^= mul(coef, EXP[i]);
    });
    generator = next;
  }
  const result = data.concat(new Array(length).fill(0));
  data.forEach((_, index) => {
    const factor = result[index];
    if (!factor) return;
    generator.forEach((coef, offset) => {
      result[index + offset] ^= mul(coef, factor);
    });
  });
  return result.slice(data.length);
}

function chooseVersion(byteLength) {
  return Object.keys(VERSIONS)
    .map(Number)
    .find((version) => {
      const data = VERSIONS[version].blocks.reduce((sum, block) => sum + block[0], 0);
      return byteLength + 2 <= data;
    });
}

function dataCodewords(text, version) {
  const spec = VERSIONS[version];
  const capacity = spec.blocks.reduce((sum, block) => sum + block[0], 0);
  const bytes = Array.from(new TextEncoder().encode(text));
  const bits = [];
  const push = (number, width) => {
    for (let shift = width - 1; shift >= 0; shift -= 1) bits.push((number >> shift) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, 8);
  bytes.forEach((byte) => push(byte, 8));
  const terminator = Math.min(4, capacity * 8 - bits.length);
  for (let i = 0; i < terminator; i += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const words = [];
  for (let i = 0; i < bits.length; i += 8) {
    words.push(bits.slice(i, i + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
  }
  for (let pad = 0; words.length < capacity; pad += 1) words.push(pad % 2 ? 0x11 : 0xec);
  return words;
}

function codewords(text, version) {
  const spec = VERSIONS[version];
  const words = dataCodewords(text, version);
  const dataBlocks = [];
  const eccBlocks = [];
  let cursor = 0;
  spec.blocks.forEach(([dataLength, eccLength]) => {
    const block = words.slice(cursor, cursor + dataLength);
    cursor += dataLength;
    dataBlocks.push(block);
    eccBlocks.push(reedSolomon(block, eccLength));
  });
  const out = [];
  const longest = Math.max(...dataBlocks.map((block) => block.length));
  for (let index = 0; index < longest; index += 1) {
    dataBlocks.forEach((block) => {
      if (index < block.length) out.push(block[index]);
    });
  }
  for (let index = 0; index < eccBlocks[0].length; index += 1) {
    eccBlocks.forEach((block) => out.push(block[index]));
  }
  return out;
}

function paint(matrix, reserved, row, col, dark) {
  if (row < 0 || col < 0 || row >= matrix.length || col >= matrix.length) return;
  matrix[row][col] = dark ? 1 : 0;
  reserved[row][col] = 1;
}

function finder(matrix, reserved, row, col) {
  for (let y = -1; y <= 7; y += 1) {
    for (let x = -1; x <= 7; x += 1) {
      const edge = y < 0 || x < 0 || y > 6 || x > 6;
      const frame = y === 0 || x === 0 || y === 6 || x === 6;
      const core = y >= 2 && y <= 4 && x >= 2 && x <= 4;
      paint(matrix, reserved, row + y, col + x, !edge && (frame || core));
    }
  }
}

export function qrMatrix(text) {
  const bytes = new TextEncoder().encode(text);
  const version = chooseVersion(bytes.length);
  if (!version) return [];
  const spec = VERSIONS[version];
  const size = spec.size;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));
  const reserved = Array.from({ length: size }, () => Array(size).fill(0));

  finder(matrix, reserved, 0, 0);
  finder(matrix, reserved, 0, size - 7);
  finder(matrix, reserved, size - 7, 0);
  for (let i = 0; i < size; i += 1) {
    if (!reserved[6][i]) paint(matrix, reserved, 6, i, i % 2 === 0);
    if (!reserved[i][6]) paint(matrix, reserved, i, 6, i % 2 === 0);
  }
  const inFinder = (row, col) =>
    [[0, 0], [0, size - 7], [size - 7, 0]].some(
      ([top, left]) => row >= top && row <= top + 6 && col >= left && col <= left + 6,
    );
  spec.align.forEach((row) => {
    [6, ...spec.align].forEach((col) => {
      if (inFinder(row, col)) return;
      for (let y = -2; y <= 2; y += 1) {
        for (let x = -2; x <= 2; x += 1) {
          const edge = Math.abs(y) === 2 || Math.abs(x) === 2;
          paint(matrix, reserved, row + y, col + x, edge || (y === 0 && x === 0));
        }
      }
    });
  });
  paint(matrix, reserved, size - 8, 8, 1);
  const reserveFormat = (row, col) => {
    if (row >= 0 && col >= 0 && row < size && col < size) reserved[row][col] = 1;
  };
  for (let i = 0; i <= 5; i += 1) reserveFormat(i, 8);
  reserveFormat(7, 8);
  reserveFormat(8, 8);
  reserveFormat(8, 7);
  for (let i = 9; i < 15; i += 1) reserveFormat(8, 14 - i);
  for (let i = 0; i < 8; i += 1) reserveFormat(8, size - 1 - i);
  for (let i = 8; i < 15; i += 1) reserveFormat(size - 15 + i, 8);

  const bits = [];
  codewords(text, version).forEach((word) => {
    for (let shift = 7; shift >= 0; shift -= 1) bits.push((word >> shift) & 1);
  });
  let cursor = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col = 5;
    for (let step = 0; step < size; step += 1) {
      const row = upward ? size - 1 - step : step;
      [0, 1].forEach((offset) => {
        const x = col - offset;
        if (reserved[row][x]) return;
        const bit = cursor < bits.length ? bits[cursor] : 0;
        cursor += 1;
        const masked = bit ^ ((row + x) % 2 === 0 ? 1 : 0);
        matrix[row][x] = masked;
      });
    }
    upward = !upward;
  }

  const format = 0x5412;
  const bit = (index) => (format >> index) & 1;
  for (let i = 0; i <= 5; i += 1) matrix[i][8] = bit(i);
  matrix[7][8] = bit(6);
  matrix[8][8] = bit(7);
  matrix[8][7] = bit(8);
  for (let i = 9; i < 15; i += 1) matrix[8][14 - i] = bit(i);
  for (let i = 0; i < 8; i += 1) matrix[8][size - 1 - i] = bit(i);
  for (let i = 8; i < 15; i += 1) matrix[size - 15 + i][8] = bit(i);
  return matrix;
}

export function qrSvg(text) {
  const matrix = qrMatrix(String(text || " "));
  if (!matrix.length) return "";
  const cells = [];
  matrix.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
    });
  });
  const size = matrix.length;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${size + 4} ${size + 4}" shape-rendering="crispEdges">${cells.join("")}</svg>`;
}
