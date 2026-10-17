"use strict";
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 EKR Shucker contributors

// Developer checks; index.html remains the only file needed by end users.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
for (const script of scripts) new vm.Script(script[1]);
const core = html.match(/<script id="decrypt-core">([\s\S]*?)<\/script>/);
assert.ok(core, "embedded decrypt-only core exists");
const context = vm.createContext({ Uint8Array, Uint32Array });
vm.runInContext(core[1], context);
const decryptor = context.EKRDecrypt;
const checks = decryptor.selfTest();
assert.equal(checks.passed, checks.total, JSON.stringify(checks.results));
assert.ok(!Object.keys(decryptor).some(name => /encrypt|buildHeader/i.test(name)));

// Synthetic vectors generated with the reference Python implementation.
// No firmware, customer files, or encryption implementation is distributed.
const vectors = {
    TST000000001: "2a66b8b3d1c44fb5598e684d8722312901c08f612984a7395abdf793c8e5d36a97f85841c7a955b7e79a547d76e3a932709e301ccfb9095b2e83f5606e06430e48e9e74317ffe1a3",
    TST000000002: "10c7bdc10027f5eb7d430c5061f209fcf3b90c03554562fd2daa6bc9e2c1eb83f4a11a0ff7affa81f4de917763a5f45488a9d09be78abb401a642067b9063574de061cf52805fa4a",
};
for (const [serial, length] of [
    ["TST000000001", 8], ["TST000000002", 0x20008],
    ["TST000000001", 0x280000], ["TST000000002", 0x400000],
]) {
    const vector = Buffer.from(vectors[serial], "hex");
    const block = Buffer.from("0123456789abcdef", "hex");
    const image = Uint8Array.from({ length }, (_, i) => block[i % 8]);
    const container = new Uint8Array(64 + length);
    container.set(vector.subarray(0, 64));
    for (let off = 64; off < container.length; off += 8) container.set(vector.subarray(64), off);
    const key = decryptor.deriveKey(serial);
    assert.equal(decryptor.decryptHeader(container, key).serial, serial);
    const output = new Uint8Array(length);
    for (let off = 0; off < length; off += decryptor.CHUNK_SIZE) {
        decryptor.xteaDecryptInto(container, 64 + off,
            Math.min(decryptor.CHUNK_SIZE, length - off), output, off, key);
    }
    assert.deepEqual(output, image);
    console.log(`PASS: synthetic ${serial}, 0x${length.toString(16)} bytes match Python vector`);
}

function ranges(image) {
    return Array.from(decryptor.findMarkerRegions(image), r => [r.start, r.end]);
}
const bytes = text => new Uint8Array(Buffer.from(text, "ascii"));
assert.deepEqual(ranges(bytes("ordinary data without a marker")), []);
assert.deepEqual(ranges(bytes("prefixNO READpayload")), [[6, 20]]);
assert.deepEqual(ranges(bytes("noread---NO READpayload")), [[0, 23]]);
assert.deepEqual(ranges(bytes("noread")), [[0, 6]]);
assert.deepEqual(ranges(new Uint8Array(0)), []);
const shortGap = new Uint8Array(160).fill(0x42);
shortGap.set(bytes("noread"));
shortGap.fill(0, 8, 71); // 63 bytes must not terminate the region.
shortGap.fill(0xff, 80, 144);
assert.deepEqual(ranges(shortGap), [[0, 80]]);
for (const fill of [0x00, 0xff]) {
    const original = new Uint8Array(shortGap);
    const output = decryptor.stripImage(shortGap, decryptor.findMarkerRegions(shortGap), fill);
    assert.deepEqual(shortGap, original);
    assert.equal(output.length, original.length);
    assert.ok(output.subarray(0, 80).every(b => b === fill));
    assert.deepEqual(output.subarray(80), original.subarray(80));
}
assert.throws(() => decryptor.stripImage(shortGap, [], -1));
assert.throws(() => decryptor.stripImage(shortGap, [], 256));
for (const length of [0, 63, 64, 65, 71, 73, NaN, Infinity]) {
    assert.equal(decryptor.validContainerLength(length), false);
}
for (const length of [72, 80, 0x280040, 0x400040]) {
    assert.equal(decryptor.validContainerLength(length), true);
}
console.log(`PASS: ${checks.total} embedded checks; syntax, sizes, strip boundaries, merging, and both fills`);
