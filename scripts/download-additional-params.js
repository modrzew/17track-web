#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const ADDITIONAL_PARAMS_URL = 'https://res.17track.net/asset/carrier/info/additional_parameters.json';
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'lib', 'additional_parameters.json');

console.log('Downloading additional parameters data from:', ADDITIONAL_PARAMS_URL);

https
  .get(ADDITIONAL_PARAMS_URL, response => {
    if (response.statusCode !== 200) {
      console.error(`Failed to download additional parameters data: HTTP ${response.statusCode}`);
      process.exit(1);
    }

    let data = '';

    response.on('data', chunk => {
      data += chunk;
    });

    response.on('end', () => {
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
        console.log('✓ Additional parameters data downloaded successfully to:', OUTPUT_PATH);
      } catch (error) {
        console.error('Failed to parse or write additional parameters data:', error);
        process.exit(1);
      }
    });
  })
  .on('error', error => {
    console.error('Failed to download additional parameters data:', error);
    process.exit(1);
  });
