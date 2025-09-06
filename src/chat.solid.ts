import {
  AbstractChat,
  type ChatInit,
  type ChatState,
  type ChatStatus,
  type CreateUIMessage,
  type UIMessage,
} from "ai";
import { createSignal } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

export type { CreateUIMessage, UIMessage };

export class Chat<UI_MESSAGE extends UIMessage> extends AbstractChat<UI_MESSAGE> {
  constructor(init: Omit<ChatInit<UI_MESSAGE>, "state">) {
    super({
      ...init,
      state: new SolidChatState(init.messages),
    });
  }
}

class SolidChatState<UI_MESSAGE extends UIMessage> implements ChatState<UI_MESSAGE> {
  #store;
  #setStore;

  #statusSignal;
  #setStatusSignal;

  #errorSignal;
  #setErrorSignal;

  constructor(messages: UI_MESSAGE[] = []) {
    [this.#store, this.#setStore] = createStore<{
      messages: UI_MESSAGE[];
    }>({
      messages,
    });
    [this.#statusSignal, this.#setStatusSignal] = createSignal<ChatStatus>("ready");
    [this.#errorSignal, this.#setErrorSignal] = createSignal<Error | undefined>(undefined);
  }

  get messages(): UI_MESSAGE[] {
    return this.#store.messages;
  }
  set messages(next: UI_MESSAGE[]) {
    this.#setStore("messages", reconcile(next, { key: "id" }));
  }

  get status(): ChatStatus {
    return this.#statusSignal();
  }
  set status(value: ChatStatus) {
    this.#setStatusSignal(value);
  }

  get error(): Error | undefined {
    return this.#errorSignal();
  }
  set error(value: Error | undefined) {
    this.#setErrorSignal(value);
  }

  pushMessage(message: UI_MESSAGE) {
    const idx = this.#store.messages.length;
    // doing structured clone to strip off solid's symbol-keyed properties
    this.#setStore("messages", idx, structuredClone(message));
  }

  popMessage() {
    if (this.#store.messages.length > 0)
      this.#setStore("messages", (curr) => curr.slice(0, -1));
  }

  replaceMessage(index: number, message: UI_MESSAGE) {
    // doing structured clone to strip off solid's symbol-keyed properties
    this.#setStore("messages", index, structuredClone(message));
  }

  snapshot = <T>(thing: T): T => thing;

  /**
   * not used anymore but keeping it here for reference - superseded by `structuredClone`
   *
   * Deeply clones plain arrays/objects while stripping all symbol-keyed properties
   * (e.g. SolidJS internals: $RAW/$PROXY/$TRACK/$NODE/$HAS/$SELF/$ROOT) by copying
   * only own enumerable string keys. Cycle-safe via WeakMap. Optimized for speed.
   *
   * @internal
   */
  #purify<T>(value: T): T {
    const seen = new WeakMap<object, unknown>();
    const cloneValue = (val: unknown): unknown => {
      if (val === null || typeof val !== "object") return val;
      const obj = val as object;
      const cached = seen.get(obj);
      if (cached !== undefined) return cached;

      if (Array.isArray(val)) {
        const arr = val as unknown[];
        const out: unknown[] = new Array(arr.length);
        seen.set(obj, out);
        for (let i = 0; i < arr.length; i++) out[i] = cloneValue(arr[i]);
        return out;
      }

      const src = val as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      seen.set(obj, out);

      const keys = Object.keys(src); // own, enumerable string keys only
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        out[key] = cloneValue(src[key]);
      }
      // Symbol keys (including SolidJS internals) are intentionally ignored
      return out;
    };
    return cloneValue(value) as T;
  }
}
