import { crc32, deflateSync } from 'node:zlib'

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBuffer = Buffer.from(type, 'ascii')
  const crcValue = crc32(Buffer.concat([typeBuffer, data])) >>> 0
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crcValue, 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

export function createPngImage({ width, height }: { width: number; height: number }): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8
  ihdrData[9] = 2
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0
  const ihdr = pngChunk('IHDR', ihdrData)

  const rowSize = width * 3
  const raw = Buffer.alloc((rowSize + 1) * height)
  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowSize + 1)
    raw[rowStart] = 0
    for (let x = 0; x < rowSize; x++) {
      raw[rowStart + 1 + x] = (x + y) % 256
    }
  }
  const idat = pngChunk('IDAT', deflateSync(raw))
  const iend = pngChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

export function validBannerImage(): Buffer {
  return createPngImage({ width: 960, height: 480 })
}

export function undersizedBannerImage(): Buffer {
  return createPngImage({ width: 400, height: 300 })
}

export function nonLandscapeBannerImage(): Buffer {
  return createPngImage({ width: 900, height: 900 })
}
