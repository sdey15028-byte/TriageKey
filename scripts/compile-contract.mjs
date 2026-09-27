import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const compilerVersion = '0.31.1'
const packageRoot = resolve('node_modules/@midnight-ntwrk/midnight-js-compact')
const fetcher = resolve(packageRoot, 'dist/fetch-compact.mjs')
const runner = resolve(packageRoot, 'dist/run-compactc.cjs')

if (!existsSync(runner)) {
  throw new Error('Install dependencies with npm install before compiling the Compact contract.')
}

if (process.platform === 'win32') {
  const docker = spawnSync('docker', ['--version'], { stdio: 'ignore' })
  if (docker.error || docker.status !== 0) {
    throw new Error('Compact compilation on Windows requires Docker Desktop. Install/start Docker, then rerun npm run contracts:compile.')
  }
} else {
  const fetched = spawnSync(process.execPath, [fetcher, `--version=${compilerVersion}`], { stdio: 'inherit' })
  if (fetched.status !== 0) process.exit(fetched.status ?? 1)
}

const compiled = spawnSync(
  process.execPath,
  [runner, 'contracts/TriageKey.compact', 'contracts/artifacts'],
  { stdio: 'inherit', env: { ...process.env, COMPACTC_VERSION: compilerVersion } },
)

process.exit(compiled.status ?? 1)
