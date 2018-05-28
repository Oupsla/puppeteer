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

if (process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD) {
  console.log('**INFO** Skipping Chromium download. "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" environment variable was found.');
  return;
}
if (process.env.NPM_CONFIG_PUPPETEER_SKIP_CHROMIUM_DOWNLOAD || process.env.npm_config_puppeteer_skip_chromium_download) {
  console.log('**INFO** Skipping Chromium download. "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" was set in npm config.');
  return;
}