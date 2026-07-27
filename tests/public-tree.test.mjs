import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  auditTree,
  withTemporaryAuditTree
} from "../scripts/audit-public-tree.mjs";
import {
  claimGroupInitialization,
  sourceSwitchPlan,
  unavailableSourceIds
} from "../src/scripts/sync-video-state.mjs";
import {
  expectedMedia,
  expectedPosters,
  mediaManifest
} from "../scripts/expected-media.mjs";

test("accepts a small static site with a valid expected MP4", async () => {
  await withTemporaryAuditTree(async (root) => {
    await mkdir(path.join(root, "media"), { recursive: true });
    await writeFile(path.join(root, "index.html"), "<a href=\"/research-notes/\">Home</a>");
    const mp4 = Buffer.concat([
      Buffer.from([0, 0, 0, 24]),
      Buffer.from("ftyp"),
      Buffer.from("isom0000")
    ]);
    await writeFile(path.join(root, "media", "clip.mp4"), mp4);
    const result = await auditTree(root, {
      requireMedia: true,
      validateManifest: false,
      built: true,
      expected: ["media/clip.mp4"]
    });
    assert.deepEqual(result.issues, []);
  });
});

test("rejects model artifacts and absolute workstation paths", async () => {
  await withTemporaryAuditTree(async (root) => {
    await writeFile(path.join(root, "training_state.pt"), "weights");
    const privatePath = ["/", "home", "researcher", "private", "data"].join("/");
    await writeFile(
      path.join(root, "index.html"),
      `<p>Generated from ${privatePath}</p>`
    );
    const result = await auditTree(root, { expected: [] });
    assert.ok(result.issues.some((issue) => issue.includes("forbidden research artifact")));
    assert.ok(result.issues.some((issue) => issue.includes("absolute Linux home path")));
  });
});

test("rejects credential-like text and symlinks", async () => {
  await withTemporaryAuditTree(async (root) => {
    const syntheticToken = ["github", "pat", "abcdefghijklmnop1234"].join("_");
    await writeFile(path.join(root, "secret.txt"), syntheticToken);
    await symlink(path.join(root, "secret.txt"), path.join(root, "alias.txt"));
    const result = await auditTree(root, { expected: [] });
    assert.ok(result.issues.some((issue) => issue.includes("credential-like token")));
    assert.ok(result.issues.some((issue) => issue.includes("symbolic links")));
  });
});

test("requires every declared media file", async () => {
  await withTemporaryAuditTree(async (root) => {
    await writeFile(path.join(root, "index.html"), "<p>safe</p>");
    const result = await auditTree(root, {
      requireMedia: true,
      expected: ["media/missing.mp4"]
    });
    assert.ok(result.issues.some((issue) => issue.includes("required media file is missing")));
  });
});

test("rejects built URLs that bypass the project base", async () => {
  await withTemporaryAuditTree(async (root) => {
    await writeFile(path.join(root, "index.html"), "<img src=\"/media/private.png\">");
    const result = await auditTree(root, { built: true, expected: [] });
    assert.ok(result.issues.some((issue) => issue.includes("/research-notes base")));
  });
});

test("source switching preserves the shared timeline and playback state", () => {
  assert.deepEqual(
    sourceSwitchPlan({ timeline: 4.25, playing: true, duration: 10 }),
    {
      timeline: 4.25,
      playing: true,
      seekTime: 4.25,
      resume: true
    }
  );
  const ended = sourceSwitchPlan({ timeline: 10, playing: true, duration: 6 });
  assert.equal(ended.timeline, 10);
  assert.equal(ended.playing, true);
  assert.equal(ended.seekTime, 5.96);
  assert.equal(ended.resume, false);
});

test("each synchronization group initializes exactly once", () => {
  const group = { dataset: {} };
  assert.equal(claimGroupInitialization(group), true);
  assert.equal(claimGroupInitialization(group), false);
  assert.equal(group.dataset.initialized, "true");
});

test("source menus prevent selecting a condition already shown in another slot", () => {
  assert.deepEqual(
    [...unavailableSourceIds(["a", "d", "low"], "d")].sort(),
    ["a", "low"]
  );
});

test("manifest checks every public artifact path, byte count, and checksum", async () => {
  await withTemporaryAuditTree(async (root) => {
    const mp4Bytes = Buffer.concat([
      Buffer.from([0, 0, 0, 24]),
      Buffer.from("ftyp"),
      Buffer.from("isom0000")
    ]);
    const posterBytes = Buffer.from("RIFF0000WEBP");
    const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
    const artifacts = [];

    for (let index = 0; index < expectedMedia.length; index += 1) {
      const videoPath = expectedMedia[index];
      const posterPath = expectedPosters[index];
      await mkdir(path.dirname(path.join(root, videoPath)), { recursive: true });
      await mkdir(path.dirname(path.join(root, posterPath)), { recursive: true });
      await writeFile(path.join(root, videoPath), mp4Bytes);
      await writeFile(path.join(root, posterPath), posterBytes);
      artifacts.push({
        path: videoPath.replace(/^media\//, ""),
        bytes: mp4Bytes.length,
        sha256: sha256(mp4Bytes),
        poster_path: posterPath.replace(/^media\//, ""),
        poster_bytes: posterBytes.length,
        poster_sha256: sha256(posterBytes)
      });
    }

    await mkdir(path.dirname(path.join(root, mediaManifest)), { recursive: true });
    await writeFile(path.join(root, mediaManifest), JSON.stringify({ artifacts }));
    const clean = await auditTree(root, { requireMedia: true });
    assert.deepEqual(clean.issues, []);

    await writeFile(path.join(root, expectedMedia[0]), Buffer.concat([mp4Bytes, Buffer.from("x")]));
    const tampered = await auditTree(root, { requireMedia: true });
    assert.ok(tampered.issues.some((issue) => issue.includes("byte count")));
    assert.ok(tampered.issues.some((issue) => issue.includes("SHA-256 mismatch")));
  });
});
