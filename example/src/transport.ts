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
    const result = streamText({
      model: openai("gpt-4.1-nano"),
      messages: convertToModelMessages(options.messages),
    });

    return result.toUIMessageStream({
      sendSources: true,
    });
  };
  reconnectToStream = async () => null;
}
