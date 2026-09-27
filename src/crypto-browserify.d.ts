declare module 'crypto-browserify' {
  import * as nodeCrypto from 'node:crypto'

  const cryptoBrowserify: typeof nodeCrypto
  export default cryptoBrowserify
}
