# Gordon update

Quick update: I tested whether selectively allocating high-resolution visual tokens can preserve control in precision manipulation. In thread-needle, a policy trained with task-specific predicted gaze reached 86% success, compared with 70% using generic DeepGaze saliency and 53% with uniformly coarse visual tokens (150 rollouts per condition). The side-by-side video makes the mechanism intuitive: task-specific gaze stably follows the needle and target hole, while generic saliency often moves to visually conspicuous robot hardware. A separate PushT control shows the same principle causally—success falls as the fovea moves away from the manipulated object. Next I’m testing whether action-conditioned relevance from a generalist VLA/WAM can supervise a small causal gaze policy; the current study is post-acquisition and does not yet claim sensor-bandwidth savings.

Visual note:

https://bryandong24.github.io/research-notes/2026/where-should-a-robot-look/

Standalone side-by-side video:

https://bryandong24.github.io/research-notes/media/foveated-gaze/gordon-task-specific-deepgaze-low.mp4
