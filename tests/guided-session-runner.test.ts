import { describe, expect, test } from 'bun:test';
import type { GuidedAction, GuidedPlan } from '../apps/mobile/src/types';
import { GuidedSessionRunner, type GuidedRunnerTimer } from '../apps/mobile/src/utils/guided-session-runner';
import type { SpeechService } from '../apps/mobile/src/utils/speech';

class FakeTimer implements GuidedRunnerTimer {
  time = 0;
  private nextId = 1;
  private readonly callbacks = new Map<number, { at: number; callback: () => void; cancelled: boolean }>();

  now() { return this.time; }
  setTimeout(callback: () => void, delayMs: number) {
    const id = this.nextId++;
    this.callbacks.set(id, { at: this.time + delayMs, callback, cancelled: false });
    return id;
  }
  clearTimeout(id: unknown) {
    const callback = this.callbacks.get(id as number);
    if (callback) callback.cancelled = true;
  }
  advance(ms: number) {
    this.time += ms;
    for (const [id, callback] of this.callbacks) {
      if (!callback.cancelled && callback.at <= this.time) {
        this.callbacks.delete(id);
        callback.callback();
      }
    }
  }
  fireCancelled(id: number) {
    this.callbacks.get(id)?.callback();
  }
  pendingIds() {
    return [...this.callbacks.keys()];
  }
}

class FakeSpeech implements SpeechService {
  pending: Array<{ resolve: () => void; reject: (error: Error) => void }> = [];
  stopCalls = 0;
  shouldFail = false;

  speak() {
    if (this.shouldFail) return Promise.reject(new Error('voice unavailable'));
    return new Promise<void>((resolve, reject) => this.pending.push({ resolve, reject }));
  }
  stop() {
    this.stopCalls += 1;
    return Promise.resolve();
  }
  resolveNext() {
    this.pending.shift()?.resolve();
  }
  rejectNext() {
    this.pending.shift()?.reject(new Error('speech failed'));
  }
}

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

const plan = (mode: 'automatic' | 'manual', steps: GuidedPlan['steps']): GuidedPlan => ({
  mode,
  recommendedMode: mode,
  steps,
});

const step = (id: string, actions: readonly GuidedAction[], instruction = id) => ({
  id,
  instruction,
  actions,
});

describe('GuidedSessionRunner', () => {
  test('automatically advances through waits and completes once', async () => {
    const timer = new FakeTimer();
    const speech = new FakeSpeech();
    let completions = 0;
    const runner = new GuidedSessionRunner(plan('automatic', [
      step('one', [{ type: 'wait', durationMs: 100 }]),
      step('two', [{ type: 'wait', durationMs: 50 }]),
    ]), { timer, speech, onComplete: () => { completions += 1; } });

    runner.start();
    timer.advance(100);
    await flush();
    timer.advance(50);
    await flush();

    expect(runner.snapshot().status).toBe('completed');
    expect(runner.snapshot().completedStepIds).toEqual(['one', 'two']);
    expect(completions).toBe(1);
  });

  test('repeat actions expand into repeated guided actions', async () => {
    const timer = new FakeTimer();
    const speech = new FakeSpeech();
    const spoken: string[] = [];
    speech.speak = (text?: string) => {
      spoken.push(text ?? '');
      return Promise.resolve();
    };
    const runner = new GuidedSessionRunner(plan('automatic', [
      step('repeat', [{ type: 'repeat', times: 3, actions: [{ type: 'speak', text: 'again' }, { type: 'wait', durationMs: 10 }] }]),
    ]), { timer, speech });

    runner.start();
    for (let i = 0; i < 4; i += 1) {
      await flush();
      timer.advance(10);
      await flush();
    }

    expect(spoken).toEqual(['again', 'again', 'again']);
    expect(runner.snapshot().status).toBe('completed');
  });

  test('manual plans retain explicit advancement', () => {
    const timer = new FakeTimer();
    const runner = new GuidedSessionRunner(plan('manual', [step('one', []), step('two', [])]), {
      timer,
      speech: new FakeSpeech(),
    });

    runner.start();
    expect(runner.snapshot().stepIndex).toBe(0);
    runner.next();
    expect(runner.snapshot().stepIndex).toBe(1);
    runner.next();
    expect(runner.snapshot().status).toBe('completed');
  });

  test('pause freezes waits and resume continues the remaining duration', async () => {
    const timer = new FakeTimer();
    const runner = new GuidedSessionRunner(plan('automatic', [step('one', [{ type: 'wait', durationMs: 100 }])]), {
      timer,
      speech: new FakeSpeech(),
    });

    runner.start();
    timer.advance(40);
    runner.pause();
    timer.advance(100);
    await flush();
    expect(runner.snapshot().status).toBe('paused');
    expect(runner.snapshot().elapsedMs).toBe(40);

    runner.resume();
    timer.advance(59);
    await flush();
    expect(runner.snapshot().status).toBe('running');
    timer.advance(1);
    await flush();
    expect(runner.snapshot().status).toBe('completed');
  });

  test('rapid pause and resume preserves one authoritative wait', async () => {
    const timer = new FakeTimer();
    const runner = new GuidedSessionRunner(plan('automatic', [step('one', [{ type: 'wait', durationMs: 100 }])]), {
      timer,
      speech: new FakeSpeech(),
    });

    runner.start();
    runner.pause();
    runner.resume();
    runner.pause();
    runner.resume();
    await flush();
    timer.advance(100);
    await flush();

    expect(runner.snapshot().status).toBe('completed');
  });

  test('a stale timer callback cannot advance a paused or newer step', async () => {
    const timer = new FakeTimer();
    const runner = new GuidedSessionRunner(plan('automatic', [step('one', [{ type: 'wait', durationMs: 100 }])]), {
      timer,
      speech: new FakeSpeech(),
    });

    runner.start();
    const staleTimerId = timer.pendingIds()[0]!;
    runner.pause();
    timer.fireCancelled(staleTimerId);
    await flush();
    expect(runner.snapshot().status).toBe('paused');

    runner.resume();
    expect(runner.snapshot().status).toBe('running');
    timer.fireCancelled(staleTimerId);
    await flush();
    expect(runner.snapshot().status).toBe('running');
  });

  test('a stale TTS callback cannot advance a paused session', async () => {
    const timer = new FakeTimer();
    const speech = new FakeSpeech();
    const runner = new GuidedSessionRunner(plan('automatic', [step('one', [{ type: 'speak', text: 'look' }])]), { timer, speech });

    runner.start();
    runner.pause();
    speech.resolveNext();
    await flush();
    expect(runner.snapshot().status).toBe('paused');

    runner.resume();
    speech.resolveNext();
    await flush();
    expect(runner.snapshot().status).toBe('completed');
    expect(speech.stopCalls).toBeGreaterThan(0);
  });

  test('paused repeat and skip controls remain paused and operate on the current step', async () => {
    const timer = new FakeTimer();
    const runner = new GuidedSessionRunner(plan('automatic', [
      step('one', [{ type: 'wait', durationMs: 100 }]),
      step('two', [{ type: 'wait', durationMs: 100 }]),
    ]), { timer, speech: new FakeSpeech() });

    runner.start();
    timer.advance(20);
    runner.pause();
    runner.repeatCurrentStep();
    expect(runner.snapshot().status).toBe('paused');
    expect(runner.snapshot().elapsedMs).toBe(20);
    runner.skipCurrentStep();
    expect(runner.snapshot().status).toBe('paused');
    expect(runner.snapshot().stepIndex).toBe(1);

    runner.resume();
    await flush();
    timer.advance(100);
    await flush();
    expect(runner.snapshot().status).toBe('completed');
  });

  test('repeat current step resets only the step actions, not elapsed time', async () => {
    const timer = new FakeTimer();
    const runner = new GuidedSessionRunner(plan('automatic', [step('one', [{ type: 'wait', durationMs: 100 }])]), {
      timer,
      speech: new FakeSpeech(),
    });

    runner.start();
    timer.advance(20);
    runner.repeatCurrentStep();
    expect(runner.snapshot().elapsedMs).toBe(20);
    await flush();
    timer.advance(99);
    await flush();
    expect(runner.snapshot().status).toBe('running');
    timer.advance(1);
    await flush();
    expect(runner.snapshot().status).toBe('completed');
  });

  test('skip completes the current step without duplicating completion', async () => {
    const timer = new FakeTimer();
    let completions = 0;
    const runner = new GuidedSessionRunner(plan('automatic', [
      step('one', [{ type: 'wait', durationMs: 100 }]),
      step('two', [{ type: 'wait', durationMs: 100 }]),
    ]), { timer, speech: new FakeSpeech(), onComplete: () => { completions += 1; } });

    runner.start();
    runner.skipCurrentStep();
    timer.advance(100);
    await flush();
    runner.skipCurrentStep();
    runner.skipCurrentStep();

    expect(runner.snapshot().status).toBe('completed');
    expect(runner.snapshot().completedStepIds).toEqual(['one', 'two']);
    expect(completions).toBe(1);
  });

  test('a speech provider that never settles cannot strand automatic progression', async () => {
    const timer = new FakeTimer();
    const speech = new FakeSpeech();
    const runner = new GuidedSessionRunner(plan('automatic', [step('one', [{ type: 'speak', text: 'look' }])]), {
      timer,
      speech,
      speechTimeoutMs: 100,
    });

    runner.start();
    await flush();
    expect(runner.snapshot().status).toBe('running');
    timer.advance(100);
    await flush();

    expect(runner.snapshot().status).toBe('completed');
    expect(speech.stopCalls).toBeGreaterThan(0);
  });

  test('speech failure and unknown actions fail safe and do not strand the session', async () => {
    const speech = new FakeSpeech();
    speech.shouldFail = true;
    const unknown = { type: 'future-action' } as unknown as GuidedAction;
    const runner = new GuidedSessionRunner(plan('automatic', [step('one', [{ type: 'speak', text: 'look' }, unknown])]), {
      speech,
    });

    runner.start();
    await flush();

    expect(runner.snapshot().status).toBe('completed');
  });

  test('aborted sessions never complete', async () => {
    const speech = new FakeSpeech();
    const runner = new GuidedSessionRunner(plan('automatic', [step('one', [{ type: 'speak', text: 'look' }])]), { speech });

    runner.start();
    runner.abort();
    speech.resolveNext();
    await flush();

    expect(runner.snapshot().status).toBe('aborted');
  });
});
