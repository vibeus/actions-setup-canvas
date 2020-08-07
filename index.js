const process = require('process');
const core = require('@actions/core');
const cache = require('@actions/cache');
const exec = require('@actions/exec');
const os = require('os');
const path = require('path');
const tc = require('@actions/tool-cache');

const {
  HOME,
  WORKSPACE_ROOT,
  EMSDK_HOME,
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

  if (key !== cacheKey) {
    await cache.saveCache([cacheDir], key);
    core.info(`Saved yarn cache using key: ${key}`);
  } else {
    core.info(
      `Skipped saving yarn cache because key matches cacheKey: ${cacheKey}.`
    );
  }
}

async function setupClang() {
  await exec.exec(
    'sudo update-alternatives --install /usr/bin/c++ c++ /usr/bin/clang++-9 10'
  );
  await exec.exec(
    'sudo update-alternatives --install /usr/bin/clang-format clang-format /usr/bin/clang-format-9 10'
  );
  await exec.exec('sudo update-alternatives --set c++ /usr/bin/clang++-9');
  await exec.exec(
    'sudo update-alternatives --set clang-format /usr/bin/clang-format-9'
  );

  core.info('Done setting up clang.');
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

  if (key !== cacheKey) {
    await cache.saveCache([cacheDir], key);
    core.info(`Saved pip cache using key: ${key}`);
  } else {
    core.info(
      `Skipped saving pip cache because key matches cacheKey: ${cacheKey}.`
    );
  }
}

async function setupEmsdk(inputs) {
  const restoreKey = `${os.platform()}-emsdk-${inputs.emsdkVersion}`;

  const cacheKey = await cache.restoreCache([EMSDK_HOME], restoreKey, [
    restoreKey,
  ]);
  if (cacheKey) {
    core.info(`Restored emsdk cache from cache key: ${cacheKey}`);
  } else {
    core.info(`Did not find emsdk cache using restore key: ${restoreKey}`);

    const downloaded = await tc.downloadTool(
      'https://github.com/emscripten-core/emsdk/archive/master.zip'
    );
    await tc.extractZip(downloaded, HOME);
    await exec.exec('./emsdk', ['install', inputs.emsdkVersion], {
      cwd: EMSDK_HOME,
    });

    const cacheId = await cache.saveCache([EMSDK_HOME], restoreKey);
    core.info(
      `Saved emsdk cache using key: ${restoreKey}; cacheId: ${cacheId}`
    );
  }

  await exec.exec('./emsdk', ['activate', inputs.emsdkVersion], {
    cwd: EMSDK_HOME,
  });
  core.setOutput('emsdk-path', EMSDK_HOME);

  const sysRestoreKey = `${os.platform()}-emsdk-${
    inputs.emsdkVersion
  }-syscache-`;

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
  const restoreKey = `${os.platform()}-canvas-libs-`;

  const cacheDir = path.join(canvasPath, 'libs');
  const cacheKey = await cache.restoreCache([cacheDir], restoreKey, [
    restoreKey,
  ]);
  if (cacheKey) {
    core.info(`Restored libs cache from cache key: ${cacheKey}`);
  } else {
    core.info(`Did not find libs cache using restore key: ${restoreKey}`);
  }

  // still need to sync to get latest libs
  await exec.exec('./sync-libs', [], { cwd: canvasPath });

  const hashKey = await hashFiles(`${cacheDir}/**/ETAG`);
  const key = restoreKey + hashKey;

  if (key !== cacheKey) {
    await cache.saveCache([cacheDir], key);
    core.info(`Saved libs cache using key: ${key}`);
  } else {
    core.info(
      `Skipped saving libs cache because key matches cacheKey: ${cacheKey}`
    );
  }
}

async function run() {
  try {
    const inputs = {
      emsdkVersion: core.getInput('emsdk-version'),
      canvasHome: core.getInput('canvas-home'),
    };

    await setupYarn(inputs);
    await setupClang();
    await setupPython(inputs);
    if (inputs.emsdkVersion) {
      await setupEmsdk(inputs);
    }
    await setupLibs(inputs);
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
