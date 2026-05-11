import type { ClippyCursor } from "./cursor";
import type { Plan, Step } from "./types";
import {
  CLOSE_RADIUS,
  FAR_RADIUS,
  FAR_TIMEOUT,
  MAX_NUDGES,
  DOM_QUIET_MS,
  DOM_QUIET_MAX_MS,
} from "./types";
import { fetchPlan } from "./api";

export class Executor {
  private cursor: ClippyCursor;
  private apiKey: string;
  private sessionId = 0;
  private currentPlan: Plan | null = null;
  private stepIndex = 0;
  private completedSteps: Step[] = [];
  private abortController: AbortController | null = null;
  private running = false;
  private activeCleanup: (() => void) | null = null;

  constructor(cursor: ClippyCursor, apiKey: string) {
    this.cursor = cursor;
    this.apiKey = apiKey;
  }

  async start(question: string) {
    this.sessionId++;
    const sid = this.sessionId;
    this.abortPending();
    this.running = true;
    this.completedSteps = [];
    this.stepIndex = 0;
    this.currentPlan = null;

    this.cursor.showLoading(question);

    const plan = await this.callPlan(question, sid);
    if (!plan || sid !== this.sessionId) return;

    this.currentPlan = plan;
    this.cursor.setMode("guiding");
    await this.walkSteps(question, sid);
  }

  cancel() {
    this.sessionId++;
    this.running = false;
    this.abortPending();
    this.releaseIds();
    this.cursor.setMode("idle");
    this.cursor.hideBubble();
    this.cursor.hidePulse();
  }

  private releaseIds() {
    if (this.activeCleanup) {
      this.activeCleanup();
      this.activeCleanup = null;
    }
  }

  private async walkSteps(question: string, sid: number) {
    while (sid === this.sessionId) {
      while (
        this.currentPlan &&
        this.stepIndex < this.currentPlan.steps.length &&
        sid === this.sessionId
      ) {
        const step = this.currentPlan.steps[this.stepIndex];
        const success = await this.executeStep(step, sid);
        if (sid !== this.sessionId) return;

        if (!success) {
          const newPlan = await this.replan(question, sid);
          if (!newPlan || newPlan.steps.length === 0 || sid !== this.sessionId) return;
          this.currentPlan = newPlan;
          this.stepIndex = 0;
          continue;
        }

        this.completedSteps.push(step);
        this.stepIndex++;
      }

      if (sid !== this.sessionId) return;
      if (this.currentPlan?.completesGoal) break;

      await this.waitForDomQuiet(sid);
      if (sid !== this.sessionId) return;

      const continuePlan = await this.replan(question, sid);
      if (sid !== this.sessionId) return;

      if (!continuePlan || continuePlan.steps.length === 0) break;

      this.currentPlan = continuePlan;
      this.stepIndex = 0;
    }

    if (sid === this.sessionId) {
      this.running = false;
      this.releaseIds();
      this.cursor.hidePulse();
      this.cursor.showDone();
    }
  }

  private async executeStep(
    step: Step,
    sid: number
  ): Promise<boolean> {
    const el = document.querySelector(
      `[data-clippy-id="${step.targetId}"]`
    ) as HTMLElement | null;
    if (!el) return false;

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const inViewport =
      rect.top >= 0 && rect.bottom <= vh && rect.left >= 0 && rect.right <= vw;

    if (!inViewport) {
      const dir = this.getScrollDirection(rect, vw, vh);
      this.cursor.setMode("guiding");
      this.cursor.moveTo(vw / 2, dir === "up" ? 60 : vh - 60);
      this.cursor.showBubble(`Scroll ${dir} to find the next element`);

      const found = await this.waitForScrollThenInView(el, sid);
      if (!found || sid !== this.sessionId) return false;
    }

    const freshRect = el.getBoundingClientRect();
    const elCx = freshRect.left + freshRect.width / 2;
    const elCy = freshRect.top + freshRect.height / 2;

    const spaceRight = window.innerWidth - freshRect.right;
    const spaceLeft = freshRect.left;
    const nudge = 10;
    const cursorX = spaceRight > spaceLeft ? elCx + nudge : elCx - nudge;
    const cursorY = elCy;

    this.cursor.setMode("guiding");
    this.cursor.moveTo(cursorX, cursorY);
    this.cursor.showBubble(step.instruction);
    this.cursor.showPulse(freshRect);

    const reached = await this.waitForClickNear(elCx, elCy, step, sid, el);
    if (sid !== this.sessionId) return false;
    if (!reached) return false;

    await this.waitForDomQuiet(sid);
    this.cursor.hidePulse();

    return sid === this.sessionId;
  }

  private getScrollDirection(rect: DOMRect, vw: number, vh: number): string {
    if (rect.bottom < 0) return "up";
    if (rect.top > vh) return "down";
    if (rect.right < 0) return "left";
    if (rect.left > vw) return "right";
    if (rect.top < 0) return "up";
    return "down";
  }

  private async waitForScrollThenInView(
    el: HTMLElement,
    sid: number
  ): Promise<boolean> {
    const maxWait = 60000;
    const start = Date.now();

    while (sid === this.sessionId && Date.now() - start < maxWait) {
      await this.waitForScrollIdle(sid);
      if (sid !== this.sessionId) return false;

      const rect = el.getBoundingClientRect();
      const inView =
        rect.top >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.left >= 0 &&
        rect.right <= window.innerWidth;

      if (inView) return true;

      await this.sleep(200, sid);
    }

    return false;
  }

  private waitForScrollIdle(sid: number): Promise<void> {
    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      let resolved = false;

      const done = () => {
        if (resolved) return;
        resolved = true;
        window.removeEventListener("scroll", onScroll, true);
        resolve();
      };

      const onScroll = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(done, 500);
      };

      window.addEventListener("scroll", onScroll, { capture: true, passive: true });

      timer = setTimeout(done, 500);

      const maxTimeout = setTimeout(() => {
        done();
      }, 10000);

      const checkCancel = setInterval(() => {
        if (sid !== this.sessionId) {
          clearInterval(checkCancel);
          clearTimeout(maxTimeout);
          done();
        }
      }, 100);

      const origResolve = resolve;
      resolve = (v) => {
        clearInterval(checkCancel);
        clearTimeout(maxTimeout);
        origResolve(v);
      };
    });
  }

  private waitForClickNear(
    initialTx: number,
    initialTy: number,
    step: Step,
    sid: number,
    targetEl?: HTMLElement
  ): Promise<boolean> {
    return new Promise((resolve) => {
      let farTimer: ReturnType<typeof setTimeout> | null = null;
      let hasNudged = false;
      let done = false;
      let tx = initialTx;
      let ty = initialTy;

      const onClick = (e: MouseEvent) => {
        if (done) return;
        const dx = e.clientX - tx;
        const dy = e.clientY - ty;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CLOSE_RADIUS) {
          finish(true);
        }
      };

      const finish = (result: boolean) => {
        if (done) return;
        done = true;
        document.removeEventListener("click", onClick, true);
        if (farTimer) clearTimeout(farTimer);
        resolve(result);
      };

      document.addEventListener("click", onClick, true);

      const check = () => {
        if (done) return;
        if (sid !== this.sessionId) {
          finish(false);
          return;
        }

        if (targetEl) {
          const r = targetEl.getBoundingClientRect();
          const newTx = r.left + r.width / 2;
          const newTy = r.top + r.height / 2;
          if (Math.abs(newTx - tx) > 2 || Math.abs(newTy - ty) > 2) {
            tx = newTx;
            ty = newTy;
            const sr = window.innerWidth - r.right;
            const sl = r.left;
            this.cursor.moveTo(sr > sl ? tx + 10 : tx - 10, ty);
            this.cursor.showPulse(r);
          }
        }

        const dx = this.cursor.mouseX - tx;
        const dy = this.cursor.mouseY - ty;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > FAR_RADIUS && !hasNudged) {
          if (!farTimer) {
            farTimer = setTimeout(() => {
              hasNudged = true;
              farTimer = null;
              if (targetEl) {
                const r = targetEl.getBoundingClientRect();
                const sr = window.innerWidth - r.right;
                const sl = r.left;
                this.cursor.moveTo(sr > sl ? tx + 10 : tx - 10, ty);
              } else {
                this.cursor.moveTo(tx, ty);
              }
              this.cursor.showBubble(`Over here! ${step.instruction}`);
            }, FAR_TIMEOUT);
          }
        } else if (dist <= FAR_RADIUS) {
          hasNudged = false;
          if (farTimer) {
            clearTimeout(farTimer);
            farTimer = null;
          }
        }

        requestAnimationFrame(check);
      };

      requestAnimationFrame(check);
    });
  }

  private waitForDomQuiet(sid: number): Promise<void> {
    return new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        observer.disconnect();
        clearTimeout(maxTimer);
        if (timer) clearTimeout(timer);
        requestAnimationFrame(() => resolve());
      };

      let timer: ReturnType<typeof setTimeout> | null = null;
      const maxTimer = setTimeout(done, DOM_QUIET_MAX_MS);

      const observer = new MutationObserver(() => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(done, DOM_QUIET_MS);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      timer = setTimeout(done, DOM_QUIET_MS);
    });
  }

  private async callPlan(
    question: string,
    sid: number,
    previousPlan?: { completedSteps: Step[]; remainingSteps: Step[] }
  ): Promise<Plan | null> {
    try {
      this.abortController = new AbortController();

      this.releaseIds();

      const result = await fetchPlan(this.apiKey, {
        question,
        previousPlan,
        signal: this.abortController.signal,
      });

      if (sid !== this.sessionId) {
        result?.cleanup();
        return null;
      }
      if (!result) return null;

      this.activeCleanup = result.cleanup;
      return result.plan;
    } catch (err: any) {
      if (err.name === "AbortError") return null;
      console.error("[clippy] Plan fetch error:", err);
      return null;
    }
  }

  private async replan(question: string, sid: number): Promise<Plan | null> {
    this.cursor.showLoading(question);
    const plan = await this.callPlan(question, sid, {
      completedSteps: this.completedSteps,
      remainingSteps: this.currentPlan
        ? this.currentPlan.steps.slice(this.stepIndex)
        : [],
    });
    if (plan && sid === this.sessionId) {
      this.cursor.setMode("guiding");
    }
    return plan;
  }

  private abortPending() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  private sleep(ms: number, sid: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      const check = setInterval(() => {
        if (sid !== this.sessionId) {
          clearTimeout(timer);
          clearInterval(check);
          resolve();
        }
      }, 100);
      setTimeout(() => clearInterval(check), ms + 100);
    });
  }
}
