#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const ADDITIONAL_PARAMS_URL =
  process.env.ADDITIONAL_PARAMS_URL ||
  'https://res.17track.net/asset/carrier/info/additional_parameters.json';
const FALLBACK_URL = 'https://modriv.net/additional_parameters.json';
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'lib', 'additional-params.json');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    console.log('Downloading additional parameters from:', url);

    const protocol = url.startsWith('https') ? https : require('http');

    protocol
      .get(url, response => {
        if (response.statusCode === 403 || response.statusCode === 404) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        let data = '';

        response.on('data', chunk => {
          data += chunk;
        });

        response.on('end', () => {
          resolve(data);
        });
      })
      .on('error', reject);
  });
}

async function main() {
  let data;

  try {
    data = await fetchUrl(ADDITIONAL_PARAMS_URL);
  } catch (error) {
    console.warn(`Primary URL failed (${error.message}), trying fallback...`);
    try {
      data = await fetchUrl(FALLBACK_URL);
    } catch (fallbackError) {
      console.error('Both URLs failed:', fallbackError.message);
      process.exit(1);
    }
  }

  try {
    // Validate JSON
    JSON.parse(data);

    // Ensure directory exists
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write to file
    fs.writeFileSync(OUTPUT_PATH, data);
    console.log('✓ Additional parameters downloaded successfully to:', OUTPUT_PATH);
  } catch (error) {
    console.error('Failed to parse or write additional parameters:', error);
    process.exit(1);
  }
}

main();
