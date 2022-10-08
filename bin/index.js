#!/usr/bin/env node
'use strict';

const fs = require('fs');
const PNG = require('pngjs').PNG;
const sharp = require('sharp');
const path = require('path');
const { prompt } = require('enquirer');

const filePath = process.argv[2];
const outPath = process.argv[3];
if (!filePath) {
  console.error('ERROR: 需要指定文件');
  process.exit(-1);
}
if (!outPath) {
  console.error('ERROR: 需要输出文件夹路径');
  process.exit(-1);
}

const src = path.resolve(process.cwd(), filePath);
const out = path.resolve(process.cwd(), outPath);

const main = async (src, out, W, H) => {
  if (!fs.existsSync(out)) {
    fs.mkdirSync(out);
  }
  sharp(src)
    .png()
    .pipe(
      new PNG({
        filterType: -1,
      })
    )
    .on('parsed', function () {
      const py = Math.ceil(this.height / H);
      const px = Math.ceil(this.width / W);
      for (let y = 0; y < py; y++) {
        for (let x = 0; x < px; x++) {
          const newfile = new PNG({ width: W, height: H });
          this.bitblt(newfile, x * W, this.height - (y + 1) * H, W, H);
          const targetName = path.join(out, `${x}x${y}.png`);
          newfile.pack().pipe(fs.createWriteStream(targetName));
        }
      }
      // node index.js test 48 48
      console.log('split success');
    });

  sharp(src)
    .png()
    .pipe(
      new PNG({
        colorType: 0,
      })
    )
    .on('parsed', function () {
      this.pack()
        .pipe(sharp().resize(W, H))
        .pipe(fs.createWriteStream(path.join(out, `thumb.png`)));
      // node index.js test 48 48
      console.log('thumb success');
    });
};
(async () => {
  const response = await prompt([
    {
      type: 'input',
      name: 'width',
      message: 'Width',
    },
    {
      type: 'input',
      name: 'height',
      message: 'Height',
    },
  ]);
  const { width, height } = response;

  if (!width) {
    console.error('ERROR: need width');
    process.exit(-1);
  }
  if (!height) {
    console.error('ERROR: need height');
    process.exit(-1);
  }
  await main(src, out, parseInt(width), parseInt(height));
})();
// DO NOTHING
//   .catch(error => {});
