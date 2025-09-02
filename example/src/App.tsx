import { useChat, type UIMessage } from "ai-sdk-solid";
import { createSignal, For, Index, Match, Show, Switch } from "solid-js";
import { SolidMarkdown } from "solid-markdown";
import { DangerousBrowserTransport } from "./transport";

function App() {
  const chat = useChat({
    transport: new DangerousBrowserTransport(),
  });

  const [message, setMessage] = createSignal("");

  const isTextPart = (part: UIMessage["parts"][number]) =>
    part.type === "text" ? part : false;
  const isReasoningPart = (part: UIMessage["parts"][number]) =>
    part.type === "reasoning" ? part : false;
  const isFilePart = (part: UIMessage["parts"][number]) =>
    part.type === "file" ? part : false;

  return (
    <div>
      <div>
        <div>Status: {chat.status}</div>
        <Show when={chat.error}>
          <div>Error: {chat.error?.message}</div>
        </Show>
      </div>
      <div>
        <For each={chat.messages}>
          {(message) => (
            <div>
              {message.role}
              <div>
                <Index each={message.parts}>
                  {(part) => (
                    <div>
                      {part().type}
                      <Switch
                        fallback={<pre>{JSON.stringify(part(), null, 2)}</pre>}
                      >
                        <Match when={isTextPart(part())}>
                          {(part) => (
                            <SolidMarkdown renderingStrategy="reconcile">
                              {part().text}
                            </SolidMarkdown>
                          )}
                        </Match>
                        <Match when={isReasoningPart(part())}>
                          {(part) => (
                            <SolidMarkdown renderingStrategy="reconcile">
                              {part().text}
                            </SolidMarkdown>
                          )}
                        </Match>
                        <Match when={isFilePart(part())}>
                          {(part) => (
                            <div>
                              {part().mediaType} | {part().filename} |{" "}
                              {part().url}
                            </div>
                          )}
                        </Match>
                      </Switch>
                    </div>
                  )}
                </Index>
              </div>
            </div>
          )}
        </For>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          chat.sendMessage({
            text: message(),
          });
          setMessage("");
        }}
      >
        <input
          autofocus
          type="text"
          value={message()}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;
