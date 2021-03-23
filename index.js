const process = require('process');
const core = require('@actions/core');
const cache = require('@actions/cache');
const exec = require('@actions/exec');
const os = require('os');
const path = require('path');

const {
  WORKSPACE_ROOT,
  EMSDK_HOME,
  EMSDK_VERSION,
  EMSDK_SYS_CACHE,
  EMSDK_SYS_CACHE_KEY_STATE,
  EMSDK_SYS_CACHE_RESTORE_KEY_STATE,
  hashFiles,
} = require('./common');

async function setupYarn(inputs) {
  let execErr = '';
  let cacheDir = '';

  await exec.exec('yarn', ['cache', 'dir'], {
    stdout: (data) => (cacheDir += data.toString()),
    stderr: (data) => (execErr += data.toString()),
  });

  if (execErr) {
    throw new Error(execErr);
  }

  const canvasPath = path.join(WORKSPACE_ROOT, inputs.canvasHome);

  const restoreKey = `${os.platform()}-yarn-canvas-`;
  const hashKey = await hashFiles(path.join(canvasPath, 'yarn.lock'));
  const key = restoreKey + hashKey;

  const cacheKey = await cache.restoreCache([cacheDir], key, [restoreKey]);
  if (cacheKey) {
    core.info(`Restored yarn cache from cache key: ${cacheKey}`);
  } else {
    core.info(`Did not find yarn cache using restore key: ${restoreKey}`);
  }

  // still need to install since cache only affect yarn's internal cache.
  await exec.exec('yarn', ['install'], { cwd: canvasPath });

  try {
    if (key !== cacheKey) {
      await cache.saveCache([cacheDir], key);
      core.info(`Saved yarn cache using key: ${key}`);
    } else {
      core.info(
        `Skipped saving yarn cache because key matches cacheKey: ${cacheKey}.`
      );
    }
  } catch (err) {
    // multiple concurrent job may save cache using same key. Ok to fail here.
    core.info(
      `[WARN] Save cache failed. Ignore and continue... Details: ${err}`
    );
  }
}

async function setupPython(inputs) {
  const canvasPath = path.join(WORKSPACE_ROOT, inputs.canvasHome);
  const restoreKey = `${os.platform()}-pip-canvas-`;
  const hashKey = await hashFiles(path.join(canvasPath, 'requirements.txt'));
  const key = restoreKey + hashKey;

  const cacheDir = path.join(process.env['HOME'], '.cache', 'pip');
  const cacheKey = await cache.restoreCache([cacheDir], key, [restoreKey]);
  if (cacheKey) {
    core.info(`Restored pip cache from cache key: ${cacheKey}`);
  } else {
    core.info(`Did not find pip cache using restore key: ${restoreKey}`);
  }

  // still need to install since cache only affect pip's internal cache.
  await exec.exec('pip', ['install', '-r', 'requirements.txt'], {
    cwd: canvasPath,
  });

  try {
    if (key !== cacheKey) {
      await cache.saveCache([cacheDir], key);
      core.info(`Saved pip cache using key: ${key}`);
    } else {
      core.info(
        `Skipped saving pip cache because key matches cacheKey: ${cacheKey}.`
      );
    }
  } catch (err) {
    // multiple concurrent job may save cache using same key. Ok to fail here.
    core.info(
      `[WARN] Save cache failed. Ignore and continue... Details: ${err}`
    );
  }
}

async function setupEmsdk() {
  core.setOutput('emsdk-path', EMSDK_HOME);

  const sysRestoreKey = `${os.platform()}-emsdk-${EMSDK_VERSION}-syscache-`;

  core.saveState(EMSDK_SYS_CACHE_RESTORE_KEY_STATE, sysRestoreKey);
  const sysCacheKey = await cache.restoreCache(
    [EMSDK_SYS_CACHE],
    sysRestoreKey,
    [sysRestoreKey]
  );
  if (sysCacheKey) {
    core.info(`Restored emscripten syscache from cache key: ${sysCacheKey}`);
    core.saveState(EMSDK_SYS_CACHE_KEY_STATE, sysCacheKey);
  } else {
    core.info(
      `Did not find emscripten syscache using restore key: ${sysRestoreKey}`
    );
  }
}

async function setupLibs(inputs) {
  const canvasPath = path.join(WORKSPACE_ROOT, inputs.canvasHome);
  const cacheDir = path.join(canvasPath, 'libs');

  const restoreKey = `canvas-libs-${inputs.arch}-`;
  const hashKey =
    inputs.arch === 'ALL'
      ? await hashFiles(`${cacheDir}/**/ETAG`)
      : await hashFiles(`${cacheDir}/**/${inputs.arch}/*/ETAG`);
  const key = restoreKey + hashKey;

  const cacheKey = await cache.restoreCache([cacheDir], key, [restoreKey]);
  if (cacheKey) {
    core.info(`Restored libs cache from cache key: ${cacheKey}`);
  } else {
    core.info(`Did not find libs cache using restore key: ${restoreKey}`);
  }

  // still need to sync to get latest libs
  await exec.exec('./sync-libs', ['--arch', inputs.arch, '--purge'], {
    cwd: canvasPath,
  });

  try {
    if (key !== cacheKey) {
      await cache.saveCache([cacheDir], key);
      core.info(`Saved libs cache using key: ${key}`);
    } else {
      core.info(
        `Skipped saving libs cache because key matches cacheKey: ${cacheKey}`
      );
    }
  } catch (err) {
    // multiple concurrent job may save cache using same key. Ok to fail here.
    core.info(
      `[WARN] Save cache failed. Ignore and continue... Details: ${err}`
    );
  }
}

async function run() {
  try {
    const inputs = {
      canvasHome: core.getInput('canvas-home'),
      arch: core.getInput('arch'),
    };

    await setupYarn(inputs);
    await setupPython(inputs);
    if (EMSDK_VERSION) {
      await setupEmsdk();
    }
    await setupLibs(inputs);
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
