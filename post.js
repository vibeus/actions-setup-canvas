const core = require('@actions/core');
const cache = require('@actions/cache');

const {
  EMSDK_SYS_CACHE,
  EMSDK_SYS_CACHE_KEY_STATE,
  EMSDK_SYS_CACHE_RESTORE_KEY_STATE,
  hashFiles,
} = require('./common');

async function saveEmsdkSysLibs() {
  const restoreKey = core.getState(EMSDK_SYS_CACHE_RESTORE_KEY_STATE);
  if (!restoreKey) {
    core.info('[WARN] Cannot find EMSDK_SYS_CACHE_RESTORE_KEY_STATE. Give up.');
    return;
  }

  const hashKey = await hashFiles(`${EMSDK_SYS_CACHE}/**/*`);
  const key = restoreKey + hashKey;

  const cacheKey = core.getState(EMSDK_SYS_CACHE_KEY_STATE);
  if (key !== cacheKey) {
    const cacheId = await cache.saveCache([EMSDK_SYS_CACHE], key);
    core.info(`Saved emsdk syscache using key: ${key}; cacheId: ${cacheId}`);
  } else {
    core.info(
      `Skipped saving emsdk syscache because cacheKey matched: ${cacheKey}.`
    );
  }
}

async function run() {
  try {
    const inputs = {
      emsdkVersion: core.getInput('emsdk-version'),
      canvasHome: core.getInput('canvas-home'),
      arch: core.getInput('arch'),
    };

    if (inputs.emsdkVersion) {
      await saveEmsdkSysLibs();
    }
  } catch (err) {
    // FIXME(jiulongw): seems like GitHub Action cache logic requires lock-file like key.
    // For now ignore error if cache key conflicts.
    core.info(`[WARN] ${err.message}`);
  }
}

run();
