/*
 * Browser compatibility shim adapted from Midnight's official wallet-dapp.
 * The upstream project is licensed under Apache-2.0.
 */
import cryptoBrowserify from 'crypto-browserify'

export function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) {
    throw new RangeError('Input buffers must have the same byte length')
  }

  let difference = 0
  for (let index = 0; index < left.byteLength; index += 1) {
    difference |= left[index] ^ right[index]
  }
  return difference === 0
}

export const {
  createHash,
  createHmac,
  randomBytes,
  randomFill,
  randomFillSync,
  pbkdf2,
  pbkdf2Sync,
  createCipheriv,
  createDecipheriv,
  createSign,
  createVerify,
  publicEncrypt,
  privateDecrypt,
  createDiffieHellman,
  createECDH,
  getCiphers,
  getCurves,
  getDiffieHellman,
  getHashes,
} = cryptoBrowserify

export default { ...cryptoBrowserify, timingSafeEqual }
