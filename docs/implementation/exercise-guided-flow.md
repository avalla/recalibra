# Exercise guided flow

The mobile exercise flow is:

`Explore → Detail → Safety → Preparation → Session → Completion`

## Discovery and detail

The catalog keeps category tabs and search in the default browsing state. Duration, level, and category filters are opened from the Filters bottom sheet. Detail shows the concise exercise summary; safety text and the full instruction list are secondary or later flow states.

Safety is data-driven through the exercise's optional `safety_warning`. Exercises without a warning go directly from detail to preparation.

## Guided exercise representation

`GuidedPlan` is optional on the existing `Exercise` model. A plan contains typed `GuidedStep` values and typed `GuidedAction` values:

- `speak`: local/system speech
- `show`: visible instruction fallback/manual content
- `visual`: reusable visual cue, optionally timed
- `wait`: deterministic timed progression
- `haptic`: optional device feedback
- `repeat`: expands a nested action sequence

Exercises without a plan use their existing instruction list and the manual runner. Current guided examples include eye movement and timed breathing; the runner is not specialized to either one.

## Automatic and manual guidance

Automatic is recommended when content has meaningful timing. It advances through the plan without requiring the user to find the device. Manual mode remains available as an accessibility/fallback option for supported plans and is the default fallback for legacy exercises.

While an automatic session is running, the primary control is pause. Previous-step navigation is intentionally absent. When paused, the user can resume, repeat the current step, skip the current step, or end the session. Repeat restarts only the current step actions. Skip marks the current step as passed and advances; skipping the final step completes the plan. These controls do not create duplicate completion records.

## Speech and audio

Speech is local and provider-based. `SystemSpeechProvider` uses Expo's platform TTS; `SilentSpeechProvider` is used when voice guidance is disabled. Speech failures are non-fatal: the visible instruction and timing continue. Speech is stopped on pause, repeat, completion, abort, navigation away, and unmount. Session generation tokens prevent callbacks from an old step from mutating a newer one.

Existing ambient audio remains separate from spoken guidance and uses the existing audio preference/preset path.

## Timer and lifecycle semantics

Preparation and safety time do not start a persisted practice session. The session row is created when the guided session screen starts. The elapsed session timer begins at runner start, excludes paused time, and includes time spent in speech and guided waits. Repeating or skipping a step does not reset the overall elapsed timer. Pausing freezes both progression and elapsed time. Backgrounding pauses the runner; returning to the app leaves the user in the paused state so they explicitly resume. Aborting navigates away without completing the persisted session. Completion is emitted once and keeps the existing post-session persistence flow.

The optional pre-session stress check-in is retained as an explicitly optional preparation control. It currently records `pre_stress_level` for before/after comparison; it does not change exercise selection, duration, pacing, or the guided plan.

## Compatibility

No persisted-session schema change is required. Existing exercises without guided metadata continue through the manual fallback. Existing session completion and Journey continuation are preserved; Journey continuation now enters the same safety/preparation flow before the next exercise.
