// Public, presentation-safe source metadata only. No experiment paths are imported here.
export type VideoSource = {
  id: string;
  shortLabel: string;
  label: string;
  description: string;
  src: string;
  accent: string;
  outcome?: string;
  aggregate?: string;
};

export const rolloutSources: VideoSource[] = [
  {
    id: "a",
    shortLabel: "Task gaze",
    label: "Task-specific GIAVA gaze",
    description:
      "A learned predictor trained on human gaze from this manipulation domain.",
    src: "media/rollouts/seed-2000/a-giava-unet.mp4",
    accent: "rust",
    outcome: "Success in this rollout",
    aggregate: "86.0% IID success"
  },
  {
    id: "d",
    shortLabel: "DeepGaze",
    label: "General visual saliency",
    description:
      "DeepGaze IIE with its natural-image MIT center prior; it is not task conditioned.",
    src: "media/rollouts/seed-2000/d-deepgaze-mit.mp4",
    accent: "blue",
    outcome: "Success in this rollout",
    aggregate: "70.0% IID success"
  },
  {
    id: "b",
    shortLabel: "Center",
    label: "Fixed center",
    description:
      "A non-adaptive control that always allocates the highest resolution to image center.",
    src: "media/rollouts/seed-2000/b-center.mp4",
    accent: "gray",
    outcome: "Stops at stage 3",
    aggregate: "63.3% IID success"
  },
  {
    id: "c",
    shortLabel: "Task prior",
    label: "Fixed task-specific prior",
    description:
      "A constant location equal to the mode of the human-gaze training distribution.",
    src: "media/rollouts/seed-2000/c-task-prior.mp4",
    accent: "gold",
    outcome: "Success in this rollout",
    aggregate: "71.3% IID success"
  },
  {
    id: "e",
    shortLabel: "DeepGaze, no prior",
    label: "General saliency, uniform prior",
    description:
      "The same DeepGaze weights with the natural-image center prior removed.",
    src: "media/rollouts/seed-2000/e-deepgaze-uniform.mp4",
    accent: "violet",
    outcome: "Success in this rollout",
    aggregate: "53.3% IID success"
  },
  {
    id: "full",
    shortLabel: "Full resolution",
    label: "Uniform full resolution",
    description:
      "A separately initialized full-resolution policy; it has no gaze source.",
    src: "media/rollouts/seed-2000/full.mp4",
    accent: "teal",
    outcome: "Success in this rollout",
    aggregate: "64.7% IID success"
  },
  {
    id: "low",
    shortLabel: "Low resolution",
    label: "Uniform low resolution",
    description:
      "A separately initialized low-resolution policy; it has no gaze source.",
    src: "media/rollouts/seed-2000/low.mp4",
    accent: "gray",
    outcome: "Stops at stage 3",
    aggregate: "53.3% IID success"
  }
];

export const observationSources: VideoSource[] = [
  {
    id: "human",
    shortLabel: "Recorded human",
    label: "Recorded human gaze",
    description: "Synchronized eye tracking from the original demonstration.",
    src: "media/observations/qa20/recorded-human.mp4",
    accent: "teal"
  },
  {
    id: "unet",
    shortLabel: "GIAVA U-Net",
    label: "Task-specific GIAVA predictor",
    description: "The task-domain predictor used by condition A.",
    src: "media/observations/qa20/giava-unet.mp4",
    accent: "rust"
  },
  {
    id: "kde",
    shortLabel: "Task prior",
    label: "Fixed human-gaze prior",
    description: "The stationary training-set gaze mode used by condition C.",
    src: "media/observations/qa20/task-kde.mp4",
    accent: "gold"
  },
  {
    id: "deepgaze-mit",
    shortLabel: "DeepGaze",
    label: "DeepGaze with MIT prior",
    description: "Generic natural-image saliency with its learned spatial prior.",
    src: "media/observations/qa20/deepgaze-mit.mp4",
    accent: "blue"
  },
  {
    id: "deepgaze-uniform",
    shortLabel: "DeepGaze, no prior",
    label: "DeepGaze with uniform prior",
    description: "The same saliency network without the MIT center prior.",
    src: "media/observations/qa20/deepgaze-uniform.mp4",
    accent: "violet"
  },
  {
    id: "center",
    shortLabel: "Center",
    label: "Fixed center",
    description: "A deliberately simple, task-agnostic spatial baseline.",
    src: "media/observations/qa20/center.mp4",
    accent: "gray"
  }
];
