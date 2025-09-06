import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  streamText,
  type ChatRequestOptions,
  type ChatTransport,
  type UIMessage,
} from "ai";

const openai = createOpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export class DangerousBrowserTransport<UI_MESSAGE extends UIMessage>
  implements ChatTransport<UI_MESSAGE> {
  sendMessages = async (
    options: {
      messages: UI_MESSAGE[];
      abortSignal?: AbortSignal;
    } & ChatRequestOptions,
  ) => {
    // mimics as if this was sent over the wire
    // removes solid-js symbol-keyed properties - with the solid-js symbol keys the messages validation fails
    const strippedMessages = JSON.parse(JSON.stringify(options.messages));

    const result = streamText({
      model: openai("gpt-4.1-nano"),
      messages: convertToModelMessages(strippedMessages),
    });

    return result.toUIMessageStream({
      sendSources: true,
    });
  };
  reconnectToStream = async () => null;
}
