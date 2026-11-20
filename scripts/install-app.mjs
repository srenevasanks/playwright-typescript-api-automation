import { createHash } from 'node:crypto';
import {
  mkdirSync,
  writeFileSync,
  chmodSync,
  existsSync,
  readFileSync,
  copyFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const version = '0.40.6';
const assets = {
  win32: {
    platform: 'windows_amd64',
    sha256: '33a2a1d255cadded77346fc7f5de37dca21ba4bad0d9cae0235a50b3b703d6d9',
  },
  linux: {
    platform: 'linux_amd64',
    sha256: '0e1f609158ed945f809f8a02ae012aa0427129c66ebb63c1aee76f2c0309373f',
  },
};
const asset = assets[process.platform];
if (!asset || process.arch !== 'x64')
  throw new Error('Supported platforms: Windows x64 and Linux x64');
mkdirSync('.cache/pocketbase', { recursive: true });
const response = await fetch(
  `https://github.com/pocketbase/pocketbase/releases/download/v${version}/pocketbase_${version}_${asset.platform}.zip`,
  { signal: AbortSignal.timeout(120000) },
);
if (!response.ok) throw new Error(`Release download: ${response.status}`);
const zip = Buffer.from(await response.arrayBuffer());
if (createHash('sha256').update(zip).digest('hex') !== asset.sha256)
  throw new Error('Release SHA256 mismatch');
writeFileSync('.cache/pocketbase.zip', zip);
const archive = path.resolve('.cache/pocketbase.zip');
const destination = path.resolve('.cache/pocketbase-release');
const extracted =
  process.platform === 'win32'
    ? spawnSync(
        'powershell.exe',
        [
          '-NoProfile',
          '-Command',
          `$ErrorActionPreference = 'Stop'; Expand-Archive -LiteralPath '${archive.replaceAll("'", "''")}' -DestinationPath '${destination.replaceAll("'", "''")}' -Force`,
        ],
        { stdio: 'inherit' },
      )
    : spawnSync('unzip', ['-o', archive, '-d', destination], { stdio: 'inherit' });
if (extracted.status !== 0) throw new Error('Release extraction failed');
const binaryName = process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase';
const extractedBinary = `${destination}/${binaryName}`;
const executable = path.resolve('.cache/pocketbase', binaryName);
if (!existsSync(extractedBinary)) throw new Error('Executable missing');
if (!existsSync(executable) || !readFileSync(executable).equals(readFileSync(extractedBinary)))
  copyFileSync(extractedBinary, executable);
if (process.platform !== 'win32') chmodSync(executable, 0o755);
console.log(`Installed PocketBase ${version}, verified SHA256 ${asset.sha256}`);
