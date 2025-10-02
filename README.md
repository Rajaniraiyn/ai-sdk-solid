## AI SDK: Solid provider

- **useChat**: build chat UIs with streaming, tools, and reconnection
- **useCompletion**: simple text completions with streaming
- **Chat**: Solid-backed `AbstractChat` state adapter

References: [`useChat` docs](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat), [`useCompletion` docs](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-completion).

### Install

```bash
bun add ai-sdk-solid
```
Or
```bash
bun add ai-sdk-solid
```
Or
```bash
bun add ai-sdk-solid
```

### Quickstart: Chat

```tsx
import { useChat } from "ai-sdk-solid";

function ChatUI() {
  const chat = useChat({
    // Uses AI SDK DefaultChatTransport hitting /api/chat by default
    // Or pass a custom transport
    // transport: new MyTransport(),
    // resume: true, // optionally resume an interrupted stream
  });

  let input!: HTMLInputElement;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        chat.sendMessage({ text: input.value });
        input.value = "";
      }}
    >
      <div>status: {chat.status()}</div>
      <For each={chat.messages}>{(m) => <pre>{JSON.stringify(m)}</pre>}</For>
      <input ref={input} type="text" />
      <button type="submit">Send</button>
    </form>
  );
}
```

What you get back from `useChat`:

- `id`, `messages`, `status`, `error`
- `sendMessage`, `regenerate`, `stop`, `resumeStream`, `addToolResult`, `clearError`
- `setMessages` for local optimistic edits

### Quickstart: Completion

```tsx
import { useCompletion } from "ai-sdk-solid";

function CompletionBox() {
  const {
    input,
    setInput,
    completion,
    isLoading,
    handleSubmit,
  } = useCompletion({ api: "/api/completion" });

  return (
    <form onSubmit={handleSubmit}>
      <textarea value={input()} onInput={(e) => setInput(e.currentTarget.value)} />
      <button disabled={isLoading()}>Go</button>
      <pre>{completion()}</pre>
    </form>
  );
}
```

### Solid-specific notes

- `Chat` uses Solid stores under the hood; `messages` is reconciled by `id`.
- `useCompletion` exposes Solid-first handlers: `handleInputChange` uses `onInput`, and `setInput` is a simple setter.

API mirrors the AI SDK where possible; only small ergonomic tweaks were made for Solid. See upstream docs for deeper details: [`useChat`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat), [`useCompletion`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-completion).

### Example app

There’s a minimal Solid app in `example/`.

### License

Apache-2.0

