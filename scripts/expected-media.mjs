export const expectedMedia = [
  "media/rollouts/seed-2000/a-giava-unet.mp4",
  "media/rollouts/seed-2000/b-center.mp4",
  "media/rollouts/seed-2000/c-task-prior.mp4",
  "media/rollouts/seed-2000/d-deepgaze-mit.mp4",
  "media/rollouts/seed-2000/e-deepgaze-uniform.mp4",
  "media/rollouts/seed-2000/full.mp4",
  "media/rollouts/seed-2000/low.mp4",
  "media/observations/qa20/recorded-human.mp4",
  "media/observations/qa20/giava-unet.mp4",
  "media/observations/qa20/task-kde.mp4",
  "media/observations/qa20/deepgaze-mit.mp4",
  "media/observations/qa20/deepgaze-uniform.mp4",
  "media/observations/qa20/center.mp4",
  "media/foveated-gaze/gordon-task-specific-deepgaze-low.mp4"
];

export const expectedPosters = expectedMedia.map((path) =>
  path.replace(/\.mp4$/i, ".webp")
);

export const mediaManifest = "media/foveated-gaze/manifest.json";
