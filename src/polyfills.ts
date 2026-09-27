import { Buffer } from 'buffer'
import process from 'process'

const browserGlobal = globalThis as typeof globalThis & {
  Buffer: typeof Buffer
  global: typeof globalThis
  process: typeof process
}

browserGlobal.Buffer = Buffer
browserGlobal.process = process
browserGlobal.global = globalThis
