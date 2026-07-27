import {
  createHash,
} from "node:crypto";
import {
  lstat,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  expectedMedia,
  expectedPosters,
  mediaManifest
} from "./expected-media.mjs";

const forbiddenExtensions = new Set([
  ".ckpt",
  ".env",
  ".npy",
  ".npz",
  ".parquet",
  ".pickle",
  ".pkl",
  ".pt",
  ".pth",
  ".safetensors",
  ".zarr"
]);

const forbiddenNames = new Set([
  ".ds_store",
  ".env",
  ".env.local",
  ".npmrc",
  "acceptance.json",
  "claude.md",
  "implementation_plan.md",
  "roadmap.md",
  "status.md",
  "training_state.pt"
]);

const forbiddenDirectoryNames = new Set([
  ".cache",
  "data",
  "outputs",
  "third_party",
  "wandb"
]);

const textExtensions = new Set([
  ".astro",
  ".cjs",
  ".css",
  ".csv",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".map",
  ".md",
  ".mdx",
  ".mjs",
  ".svg",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml"
]);

const sensitivePatterns = [
  { label: "absolute Linux home path", regex: /\/home\/[A-Za-z0-9._-]+\// },
  { label: "absolute macOS home path", regex: /\/Users\/[A-Za-z0-9._-]+\// },
  { label: "absolute Windows home path", regex: /[A-Za-z]:\\Users\\/i },
  {
    label: "credential-like token",
    regex: /(?<![A-Za-z0-9])(?:github_pat_|ghp_|hf_|sk-)[A-Za-z0-9_-]{16,}/
  },
  { label: "private key material", regex: /BEGIN (?:RSA |OPENSSH )?PRIVATE KEY/ }
];

const toPosix = (value) => value.split(path.sep).join("/");

async function walk(root, excludedDirectories = new Set()) {
  const files = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isSymbolicLink()) {
        files.push({ full, symlink: true });
      } else if (entry.isDirectory()) {
        if (excludedDirectories.has(entry.name)) continue;
        stack.push(full);
      } else if (entry.isFile()) {
        files.push({ full, symlink: false });
      }
    }
  }
  return files;
}

export async function auditTree(
  root,
  {
    requireMedia = false,
    validateManifest = requireMedia,
    built = false,
    repo = false,
    expected = [...expectedMedia, ...expectedPosters],
    maxFileBytes = 25 * 1024 * 1024,
    maxTreeBytes = 100 * 1024 * 1024
  } = {}
) {
  const absoluteRoot = path.resolve(root);
  const issues = [];
  let files;
  try {
    files = await walk(
      absoluteRoot,
      repo ? new Set([".astro", ".git", "dist", "node_modules"]) : new Set()
    );
  } catch (error) {
    return {
      issues: [`Cannot read audit root ${absoluteRoot}: ${error.message}`],
      fileCount: 0,
      totalBytes: 0
    };
  }

  let totalBytes = 0;
  for (const entry of files) {
    const relative = toPosix(path.relative(absoluteRoot, entry.full));
    if (entry.symlink) {
      issues.push(`${relative}: symbolic links are not allowed in the public tree`);
      continue;
    }

    const info = await stat(entry.full);
    totalBytes += info.size;
    if (info.size > maxFileBytes) {
      issues.push(
        `${relative}: ${(info.size / 1024 / 1024).toFixed(2)} MiB exceeds the 25 MiB file limit`
      );
    }

    const extension = path.extname(relative).toLowerCase();
    const basename = path.basename(relative).toLowerCase();
    if (forbiddenExtensions.has(extension) || forbiddenNames.has(basename)) {
      issues.push(`${relative}: forbidden research artifact type`);
    }
    if (
      repo &&
      relative
        .split("/")
        .some((part) => forbiddenDirectoryNames.has(part.toLowerCase()))
    ) {
      issues.push(`${relative}: file is inside a forbidden private-artifact directory`);
    }

    if (textExtensions.has(extension) && info.size <= 5 * 1024 * 1024) {
      const text = await readFile(entry.full, "utf8");
      for (const pattern of sensitivePatterns) {
        if (pattern.regex.test(text)) {
          issues.push(`${relative}: contains ${pattern.label}`);
        }
      }
      if (built && extension === ".html") {
        const rootRelativeAsset = /(?:href|src)="\/(?!research-notes\/)/;
        if (rootRelativeAsset.test(text)) {
          issues.push(
            `${relative}: contains a root-relative URL that bypasses the /research-notes base`
          );
        }
      }
    }
  }

  if (totalBytes > maxTreeBytes) {
    issues.push(
      `Public tree is ${(totalBytes / 1024 / 1024).toFixed(2)} MiB; limit is 100 MiB`
    );
  }

  if (requireMedia) {
    for (const relative of expected) {
      const full = path.join(absoluteRoot, relative);
      try {
        const info = await lstat(full);
        if (!info.isFile() || info.isSymbolicLink()) {
          issues.push(`${relative}: expected a regular media file`);
          continue;
        }
        if (info.size < 12) {
          issues.push(`${relative}: media file is empty or truncated`);
          continue;
        }
        if (path.extname(relative).toLowerCase() === ".mp4") {
          const header = await readFile(full);
          if (header.subarray(4, 8).toString("ascii") !== "ftyp") {
            issues.push(`${relative}: missing MP4 ftyp signature`);
          }
        }
      } catch {
        issues.push(`${relative}: required media file is missing`);
      }
    }

    if (validateManifest) {
      const manifestPath = path.join(absoluteRoot, mediaManifest);
      try {
      const rawManifest = await readFile(manifestPath, "utf8");
      const manifest = JSON.parse(rawManifest);
      if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length !== 14) {
        issues.push(
          `${mediaManifest}: expected exactly 14 artifact entries, found ${
            Array.isArray(manifest.artifacts) ? manifest.artifacts.length : "none"
          }`
        );
      } else {
        const declaredPaths = new Set();
        const expectedPaths = new Set([...expectedMedia, ...expectedPosters]);
        for (const [index, artifact] of manifest.artifacts.entries()) {
          const fields = [
            {
              path: artifact.path,
              bytes: artifact.bytes,
              sha256: artifact.sha256,
              kind: "MP4"
            },
            {
              path: artifact.poster_path,
              bytes: artifact.poster_bytes,
              sha256: artifact.poster_sha256,
              kind: "WebP"
            }
          ];
          for (const field of fields) {
            if (
              typeof field.path !== "string" ||
              path.isAbsolute(field.path) ||
              field.path.includes("..")
            ) {
              issues.push(
                `${mediaManifest}: artifact ${index} has an unsafe ${field.kind} path`
              );
              continue;
            }
            const publicRelative = `media/${toPosix(field.path)}`;
            declaredPaths.add(publicRelative);
            const full = path.join(absoluteRoot, "media", field.path);
            try {
              const info = await stat(full);
              if (!Number.isInteger(field.bytes) || field.bytes !== info.size) {
                issues.push(
                  `${mediaManifest}: ${publicRelative} byte count ${field.bytes} does not match ${info.size}`
                );
              }
              const digest = createHash("sha256")
                .update(await readFile(full))
                .digest("hex");
              if (
                typeof field.sha256 !== "string" ||
                !/^[a-f0-9]{64}$/.test(field.sha256) ||
                field.sha256 !== digest
              ) {
                issues.push(`${mediaManifest}: ${publicRelative} SHA-256 mismatch`);
              }
            } catch {
              issues.push(`${mediaManifest}: ${publicRelative} is missing`);
            }
          }
        }
        for (const expectedPath of expectedPaths) {
          if (!declaredPaths.has(expectedPath)) {
            issues.push(`${mediaManifest}: missing declaration for ${expectedPath}`);
          }
        }
        for (const declaredPath of declaredPaths) {
          if (!expectedPaths.has(declaredPath)) {
            issues.push(`${mediaManifest}: unexpected artifact ${declaredPath}`);
          }
        }
      }
      } catch (error) {
        issues.push(`${mediaManifest}: cannot parse required manifest (${error.message})`);
      }
    }
  }

  return { issues, fileCount: files.length, totalBytes };
}

async function main() {
  const [root = "public", ...flags] = process.argv.slice(2);
  const result = await auditTree(root, {
    requireMedia: flags.includes("--require-media"),
    built: flags.includes("--built"),
    repo: flags.includes("--repo")
  });
  if (result.issues.length) {
    console.error("Public-tree audit failed:");
    for (const issue of result.issues) console.error(`- ${issue}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `Public-tree audit passed: ${result.fileCount} files, ${(result.totalBytes / 1024 / 1024).toFixed(2)} MiB`
  );
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  await main();
}

// Exported only to make the safety policy unit-testable without touching the project tree.
export async function withTemporaryAuditTree(callback) {
  const directory = await mkdtemp(path.join(tmpdir(), "research-notes-audit-"));
  try {
    return await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
