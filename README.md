# EKR Shucker

**Open your own EKR files in the tools you choose.**

EKR Shucker is a standalone, offline browser tool that decrypts EK1 `.ekr`
containers into raw `.bin` images for interoperability. It is intended for
people who own or are licensed to use their files and are authorized to access
and move their contents to another tool, including when the original workflow
is no longer supported.

No install, account, server, upload, or internet connection is required. The
complete app is in **[index.html](index.html)**. It decrypts only; it contains
no encryption or container creation routines.

## Quick start

1. Download this repository using **Code → Download ZIP**, then extract it.
2. Open `index.html` in a modern browser.
3. Choose your `.ekr` file and enter the 12-character device serial it was built
   for. The final nine characters are digits.
4. Click **Decrypt & save .bin**. If the browser blocks the automatic download,
   click **Save .bin**.

The original container is never overwritten. The decrypted image downloads as
`<original-name>.bin`. Header details and an image SHA-256 digest are shown for
inspection. SHA-256 may be unavailable in browsers that restrict Web Crypto on
local files; decryption still works.

## Optional no-read marker cleanup

After decryption, **Strip no-read / hidden sig** previews byte ranges beginning
with literal ASCII `noread` or `no read`, without regard to case. Each range
ends immediately before the next run of at least 64 bytes containing only `00`
or `FF` (including a mixture), or at the end of the image. Overlapping ranges
are merged. Preview ends are exclusive.

Review the ranges, choose `00` or `FF`, and click **Strip & save .bin** to
produce a separate `<original-name>.stripped.bin`. The original decrypted
image remains available. File size and offsets are preserved.

**This is a heuristic, not a WinOLS signature detector.** A marker may occur
in legitimate data, and the range after it may contain executable code or
calibration data. An end-of-image range may be large. The tool does not search
for arbitrary random data, guarantee removal of hidden signatures, validate
flash readiness, or repair checksums. Keep the original and independently
validate any changed image before using it elsewhere.

## Intended use and rights

Use EKR Shucker for authorized interoperability of files you own or are
licensed to use. Purchase, possession, or knowledge of a serial does not by
itself establish permission to decrypt, modify, or redistribute a file.
Decryption does not transfer ownership of firmware, tunes, calibration data,
or other third-party content.

The project does not authorize copyright infringement, unauthorized access,
redistribution of paid tunes, or unlawful vehicle modifications. It is not
affiliated with, endorsed by, or supported by the EK1Pro or WinOLS vendors;
their names identify compatibility only.

**The software is provided without warranty, to the extent permitted by law.**
There is no guarantee of fitness for an ECU, a flashing tool, or a particular
file. See [NOTICE.md](NOTICE.md) for the use notice, third-party rights, legal
limitations, and rights-reporting guidance. These statements describe intended
use; they do not add restrictions to the GPL license for the code.

## Privacy

The distributed HTML processes selected files in memory. It has no network
requests, remote scripts, telemetry, uploads, cookies, or persistent application
storage. Downloads use your browser's normal download mechanism. Files you save
remain on disk after closing the page. Browser extensions and modified or
third-party hosted copies are outside this project's control.

Do not attach customer files, paid tunes, actual device serials, VINs, or
proprietary firmware to public issues. Reproduce problems with synthetic data
and redact filenames, header details, and screenshots.

## Format and limitations

- 64-byte encrypted header followed by a positive multiple-of-eight image.
- XTEA-ECB, 32 rounds; recovery key derivation from the supplied device serial.
- Serial/key check before image decryption. A wrong serial produces no output.
- No ECU communication, flashing, encryption, checksums, or signature generation.
- The key check is not an integrity/authenticity check for the payload. A damaged
  image can decrypt without being usable.
- Size checks establish container shape, not authenticity. Very large files
  may exceed browser memory.

The implementation derives from the parent EK1 reverse-engineering project's
`ekr_core.js` and `bin_to_ekr.py`. Those files are not runtime dependencies or
part of this standalone release. Tests use synthetic known-answer vectors;
reference firmware, traces, and customer containers are not distributed here.

## Verification and contributions

The app runs six embedded checks on load. **Run self-test** repeats the key,
header, wrong-serial, marker, and copy-preservation checks.

With Node.js 20 or newer, run the standalone regression suite:

```sh
node selftest.js
```

It checks script syntax, synthetic Python vectors through chunk boundaries and
2.5/4 MiB images, accepted/rejected sizes, marker boundaries, overlapping ranges,
both fills, and preservation of the original. It requires no packages, internet,
parent checkout, or firmware. GitHub Actions runs it on pushes and pull requests.
Browser download behavior and hardware use require separate verification.

## Publishing this project

Use the **contents of this directory** as the GitHub repository root. Publish
`index.html`, `README.md`, `NOTICE.md`, `LICENSE`, `selftest.js`, `.gitignore`,
and `.github/workflows/checks.yml`. The workflow assumes this directory is the
repository root. Keep the license and notices with redistributed copies.

The parent reverse-engineering workspace contains reference firmware, captures,
and chat exports; it is not this project's public release. The ignore file helps
exclude local inputs and outputs, but review staged files before each push.

Keep the app self-contained and decrypt-only. Use synthetic fixtures when
contributing and run the checks before submitting a change. Do not commit
firmware, traces, private conversations, customer files, or generated outputs.

## License

Copyright (C) 2026 EKR Shucker contributors.

The code is licensed under **GNU GPL version 3 only** (`GPL-3.0-only`). See
[LICENSE](LICENSE) for the complete terms, including warranty and liability
provisions. When distributing modified versions, comply with GPL-3.0, including
its applicable source and notice requirements. The code license grants no
rights to third-party firmware, tunes, trademarks, or files processed by the app.
