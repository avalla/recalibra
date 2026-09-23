import type { GuidedAction, GuidedPlan, GuidedStep } from '../types';
import type { SpeechService } from './speech';

export type GuidedRunnerStatus = 'idle' | 'running' | 'paused' | 'completed' | 'aborted';

export interface GuidedRunnerSnapshot {
  status: GuidedRunnerStatus;
  stepIndex: number;
  stepCount: number;
  instruction: string;
  visualCue?: string;
  elapsedMs: number;
  completedStepIds: readonly string[];
}

export interface GuidedRunnerTimer {
  now(): number;
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(id: unknown): void;
}

export interface GuidedRunnerDependencies {
  timer?: GuidedRunnerTimer;
  speech: SpeechService;
  haptic?: (pattern: 'light' | 'medium') => void | Promise<void>;
  speechOptions?: { rate?: number; language?: string };
  speechTimeoutMs?: number;
  onChange?: (snapshot: GuidedRunnerSnapshot) => void;
  onComplete?: (snapshot: GuidedRunnerSnapshot) => void;
}

const DEFAULT_SPEECH_TIMEOUT_MS = 10_000;

const realTimer: GuidedRunnerTimer = {
  now: () => Date.now(),
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
};

type AtomicAction = Exclude<GuidedAction, { type: 'repeat' }>;

function expandActions(actions: readonly GuidedAction[], result: AtomicAction[] = []): AtomicAction[] {
  for (const action of actions) {
    if (action.type === 'repeat') {
      const times = Math.max(0, Math.floor(action.times));
      for (let i = 0; i < times; i += 1) expandActions(action.actions, result);
      continue;
    }
    result.push(action);
  }
  return result;
}

function withVisualDuration(actions: readonly GuidedAction[]): AtomicAction[] {
  return expandActions(actions).flatMap((action) => (
    action.type === 'visual' && action.durationMs && action.durationMs > 0
      ? [action, { type: 'wait', durationMs: action.durationMs }]
      : [action]
  ));
}

export class GuidedSessionRunner {
  private readonly plan: GuidedPlan;
  private readonly timer: GuidedRunnerTimer;
  private readonly dependencies: GuidedRunnerDependencies;
  private readonly completedStepIds: string[] = [];
  private status: GuidedRunnerStatus = 'idle';
  private stepIndex = 0;
  private actionQueue: AtomicAction[] = [];
  private waitTimer: unknown | null = null;
  private waitDeadline: number | null = null;
  private waitResolve: ((completed: boolean) => void) | null = null;
  private pausedWaitMs: number | null = null;
  private speechTimer: unknown | null = null;
  private speechResolve: ((completed: boolean) => void) | null = null;
  private generation = 0;
  private driving = false;
  private elapsedBeforeRun = 0;
  private runningSince: number | null = null;
  private completedNotified = false;
  private visualCue: string | undefined;

  constructor(plan: GuidedPlan, dependencies: GuidedRunnerDependencies) {
    this.plan = plan;
    this.dependencies = dependencies;
    this.timer = dependencies.timer ?? realTimer;
  }

  snapshot(): GuidedRunnerSnapshot {
    const step = this.currentStep();
    return {
      status: this.status,
      stepIndex: this.stepIndex,
      stepCount: this.plan.steps.length,
      instruction: step?.instruction ?? '',
      visualCue: this.visualCue ?? step?.visualCue,
      elapsedMs: this.elapsedMs(),
      completedStepIds: [...this.completedStepIds],
    };
  }

  start(): void {
    if (this.status === 'completed' || this.status === 'aborted') return;
    if (this.status === 'running') return;
    this.status = 'running';
    if (this.runningSince === null) this.runningSince = this.timer.now();
    this.prepareCurrentStep();
    this.emit();
    if (this.plan.mode === 'automatic') void this.drive();
  }

  pause(): void {
    if (this.status !== 'running') return;
    this.freezeElapsed();
    this.status = 'paused';
    this.generation += 1;
    this.cancelWait(true);
    this.cancelSpeech();
    void this.dependencies.speech.stop().catch(() => undefined);
    this.emit();
  }

  resume(): void {
    if (this.status !== 'paused') return;
    this.status = 'running';
    this.runningSince = this.timer.now();
    this.emit();
    if (this.plan.mode === 'automatic') void this.drive();
  }

  next(): void {
    if (this.plan.mode !== 'manual' || this.status !== 'running') return;
    this.finishCurrentStep();
    if (this.status === 'running') this.emit();
  }

  repeatCurrentStep(): void {
    if (this.status !== 'running' && this.status !== 'paused') return;
    const wasPaused = this.status === 'paused';
    this.generation += 1;
    this.cancelWait(false);
    this.cancelSpeech();
    void this.dependencies.speech.stop().catch(() => undefined);
    this.prepareCurrentStep();
    if (wasPaused) this.status = 'paused';
    this.emit();
    if (!wasPaused && this.plan.mode === 'automatic') void this.drive();
  }

  skipCurrentStep(): void {
    if (this.status !== 'running' && this.status !== 'paused') return;
    const wasPaused = this.status === 'paused';
    this.generation += 1;
    this.cancelWait(false);
    this.cancelSpeech();
    void this.dependencies.speech.stop().catch(() => undefined);
    this.finishCurrentStep();
    if (!wasPaused && this.status === 'running' && this.plan.mode === 'automatic') void this.drive();
  }

  abort(): void {
    if (this.status === 'completed' || this.status === 'aborted') return;
    this.freezeElapsed();
    this.generation += 1;
    this.cancelWait(false);
    this.cancelSpeech();
    this.status = 'aborted';
    void this.dependencies.speech.stop().catch(() => undefined);
    this.emit();
  }

  private currentStep(): GuidedStep | undefined {
    return this.plan.steps[this.stepIndex];
  }

  private prepareCurrentStep(): void {
    const step = this.currentStep();
    if (!step) {
      this.complete();
      return;
    }
    this.actionQueue = this.plan.mode === 'automatic' ? withVisualDuration(step.actions) : [];
    this.visualCue = step.visualCue;
    this.pausedWaitMs = null;
  }

  private async drive(): Promise<void> {
    if (this.driving || this.status !== 'running' || this.plan.mode !== 'automatic') return;
    this.driving = true;
    try {
      while (this.status === 'running') {
        if (this.actionQueue.length === 0) {
          this.finishCurrentStep();
          if (this.status !== 'running') return;
        }
        const action = this.actionQueue[0]!;
        const token = this.generation;
        const completed = await this.execute(action, token);
        if (!completed || token !== this.generation || this.status !== 'running') return;
        this.actionQueue.shift();
        this.emit();
      }
    } finally {
      this.driving = false;
      if (this.status === 'running' && this.plan.mode === 'automatic' && this.actionQueue.length > 0) void this.drive();
    }
  }

  private async execute(action: AtomicAction, token: number): Promise<boolean> {
    switch (action.type) {
      case 'show':
        return true;
      case 'speak':
        return this.speak(action.text, token);
      case 'haptic':
        try {
          await this.dependencies.haptic?.(action.pattern);
        } catch {
          // Haptics are optional and must never stop a session.
        }
        return token === this.generation && this.status === 'running';
      case 'visual':
        this.visualCue = action.cue;
        return true;
      case 'wait':
        return this.wait(action.durationMs, token);
    }
    // Unknown actions are skipped so legacy/new content cannot strand a session.
    return true;
  }

  private speak(text: string, token: number): Promise<boolean> {
    const timeoutMs = Math.max(0, this.dependencies.speechTimeoutMs ?? DEFAULT_SPEECH_TIMEOUT_MS);

    return new Promise((resolve) => {
      let settled = false;
      const finish = (shouldAdvance: boolean) => {
        if (settled) return;
        settled = true;
        if (this.speechTimer !== null) {
          this.timer.clearTimeout(this.speechTimer);
          this.speechTimer = null;
        }
        if (this.speechResolve === finish) this.speechResolve = null;
        resolve(shouldAdvance && token === this.generation && this.status === 'running');
      };

      this.speechResolve = finish;
      this.speechTimer = this.timer.setTimeout(() => {
        // Some native voice engines fail without emitting onError/onDone.
        // Stop the stuck utterance, then let the visible timed flow continue.
        void this.dependencies.speech.stop().catch(() => undefined);
        finish(true);
      }, timeoutMs);

      try {
        void this.dependencies.speech.speak(text, this.dependencies.speechOptions)
          .then(() => finish(true), () => finish(true));
      } catch {
        finish(true);
      }
    });
  }

  private wait(durationMs: number, token: number): Promise<boolean> {
    const delayMs = this.pausedWaitMs ?? Math.max(0, durationMs);
    this.pausedWaitMs = null;
    return new Promise((resolve) => {
      const finish = () => {
        this.waitTimer = null;
        this.waitDeadline = null;
        this.waitResolve = null;
        resolve(token === this.generation && this.status === 'running');
      };
      this.waitResolve = resolve;
      this.waitDeadline = this.timer.now() + delayMs;
      this.waitTimer = this.timer.setTimeout(finish, delayMs);
    });
  }

  private cancelWait(preserveRemaining: boolean): void {
    if (this.waitTimer === null) return;
    if (preserveRemaining && this.waitDeadline !== null) {
      this.pausedWaitMs = Math.max(0, this.waitDeadline - this.timer.now());
    } else {
      this.pausedWaitMs = null;
    }
    this.timer.clearTimeout(this.waitTimer);
    this.waitTimer = null;
    this.waitDeadline = null;
    const resolveWait = this.waitResolve;
    this.waitResolve = null;
    resolveWait?.(false);
  }

  private cancelSpeech(): void {
    this.speechResolve?.(false);
  }

  private finishCurrentStep(): void {
    const step = this.currentStep();
    if (!step) {
      this.complete();
      return;
    }
    if (!this.completedStepIds.includes(step.id)) this.completedStepIds.push(step.id);
    if (this.stepIndex >= this.plan.steps.length - 1) {
      this.complete();
      return;
    }
    this.stepIndex += 1;
    this.prepareCurrentStep();
    this.emit();
  }

  private complete(): void {
    if (this.completedNotified) return;
    this.freezeElapsed();
    this.status = 'completed';
    this.generation += 1;
    this.cancelWait(false);
    this.cancelSpeech();
    void this.dependencies.speech.stop().catch(() => undefined);
    this.completedNotified = true;
    const snapshot = this.snapshot();
    this.emit();
    this.dependencies.onComplete?.(snapshot);
  }

  private elapsedMs(): number {
    return this.elapsedBeforeRun + (this.runningSince === null ? 0 : Math.max(0, this.timer.now() - this.runningSince));
  }

  private freezeElapsed(): void {
    if (this.runningSince !== null) {
      this.elapsedBeforeRun += Math.max(0, this.timer.now() - this.runningSince);
      this.runningSince = null;
    }
  }

  private emit(): void {
    this.dependencies.onChange?.(this.snapshot());
  }
}
