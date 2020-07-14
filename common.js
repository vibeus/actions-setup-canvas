const process = require('process');
const path = require('path');
const crypto = require('crypto');
const util = require('util');
const stream = require('stream');
const fs = require('fs');
const glob = require('@actions/glob');

const HOME = process.env.HOME;
const WORKSPACE_ROOT = process.env.GITHUB_WORKSPACE;
const EMSDK_HOME = path.join(HOME, 'emsdk-master');
const EMSDK_SYS_CACHE = path.join(EMSDK_HOME, 'upstream/emscripten/cache');

const EMSDK_SYS_CACHE_KEY_STATE = 'EMSDK_SYS_CACHE_KEY';
const EMSDK_SYS_CACHE_RESTORE_KEY_STATE = 'EMSDK_SYS_CACHE_RESTORE_KEY';

async function hashFiles(pattern) {
  const result = crypto.createHash('sha256');
  const globber = await glob.create(pattern);

  for await (const file of globber.globGenerator()) {
    if (fs.statSync(file).isDirectory()) {
      continue;
    }

    const hash = crypto.createHash('sha256');
    const pipeline = util.promisify(stream.pipeline);
    await pipeline(fs.createReadStream(file), hash);

    result.write(hash.digest());
  }

  result.end();
  return result.digest('hex');
}

module.exports = {
  HOME,
  WORKSPACE_ROOT,
  EMSDK_HOME,
  EMSDK_SYS_CACHE,
  EMSDK_SYS_CACHE_KEY_STATE,
  EMSDK_SYS_CACHE_RESTORE_KEY_STATE,
  hashFiles,
};
