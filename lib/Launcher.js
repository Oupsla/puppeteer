/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const os = require('os');
const path = require('path');
const removeFolder = require('rimraf');
const childProcess = require('child_process');
const {Connection} = require('./Connection');
const Browser = require('./Browser');
const readline = require('readline');
const fs = require('fs');
const {helper, debugError} = require('./helper');
const ChromiumRevision = '555668';

const mkdtempAsync = helper.promisify(fs.mkdtemp);
const removeFolderAsync = helper.promisify(removeFolder);

const CHROME_PROFILE_PATH = path.join(os.tmpdir(), 'puppeteer_dev_profile-');

const DEFAULT_ARGS = [
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-client-side-phishing-detection',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-extensions',
  '--disable-hang-monitor',
  '--disable-popup-blocking',
  '--disable-prompt-on-repost',
  '--disable-sync',
  '--disable-translate',
  '--metrics-recording-only',
  '--no-first-run',
  '--safebrowsing-disable-auto-update',
];

const AUTOMATION_ARGS = [
  '--enable-automation',
  '--password-store=basic',
  '--use-mock-keychain',
];

class Launcher {

  /**
   * @return {!Array<string>}
   */
  static defaultArgs() {
    return DEFAULT_ARGS.concat(AUTOMATION_ARGS);
  }

  /**
   * @return {string}
   */
  static executablePath() {
    return null;
  }

  /**
   * @param {!Object=} options
   * @return {!Promise<!Browser>}
   */
  static async connect(options = {}) {
    const connectionDelay = options.slowMo || 0;
    const connection = await Connection.createForWebSocket(options.browserWSEndpoint, connectionDelay);
    return Browser.create(connection, options, null, () => connection.send('Browser.close').catch(debugError));
  }
}

/**
 * @param {!Puppeteer.ChildProcess} chromeProcess
 * @param {number} timeout
 * @return {!Promise<string>}
 */
function waitForWSEndpoint(chromeProcess, timeout) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: chromeProcess.stderr });
    let stderr = '';
    const listeners = [
      helper.addEventListener(rl, 'line', onLine),
      helper.addEventListener(rl, 'close', () => onClose()),
      helper.addEventListener(chromeProcess, 'exit', () => onClose()),
      helper.addEventListener(chromeProcess, 'error', error => onClose(error))
    ];
    const timeoutId = timeout ? setTimeout(onTimeout, timeout) : 0;

    /**
     * @param {!Error=} error
     */
    function onClose(error) {
      cleanup();
      reject(new Error([
        'Failed to launch chrome!' + (error ? ' ' + error.message : ''),
        stderr,
        '',
        'TROUBLESHOOTING: https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md',
        '',
      ].join('\n')));
    }

    function onTimeout() {
      cleanup();
      reject(new Error(`Timed out after ${timeout} ms while trying to connect to Chrome! The only Chrome revision guaranteed to work is r${ChromiumRevision}`));
    }

    /**
     * @param {string} line
     */
    function onLine(line) {
      stderr += line + '\n';
      const match = line.match(/^DevTools listening on (ws:\/\/.*)$/);
      if (!match)
        return;
      cleanup();
      resolve(match[1]);
    }

    function cleanup() {
      if (timeoutId)
        clearTimeout(timeoutId);
      helper.removeEventListeners(listeners);
    }
  });
}

/**
 * @typedef {Object} LaunchOptions
 * @property {boolean=} ignoreHTTPSErrors
 * @property {boolean=} headless
 * @property {string=} executablePath
 * @property {number=} slowMo
 * @property {!Array<string>=} args
 * @property {boolean=} ignoreDefaultArgs
 * @property {boolean=} handleSIGINT
 * @property {boolean=} handleSIGTERM
 * @property {boolean=} handleSIGHUP
 * @property {number=} timeout
 * @property {boolean=} dumpio
 * @property {string=} userDataDir
 * @property {!Object<string, string | undefined>=} env
 * @property {boolean=} devtools
 * @property {boolean=} pipe
 * @property {boolean=} appMode
 */


module.exports = Launcher;
