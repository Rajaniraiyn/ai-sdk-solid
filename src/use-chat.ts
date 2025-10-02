import type {
	AbstractChat,
	ChatInit,
	ChatStatus,
	CreateUIMessage,
	UIMessage,
} from "ai";
import { type Accessor, onMount } from "solid-js";
import { Chat } from "./chat.solid";

export type { CreateUIMessage, UIMessage };

export type UseChatHelpers<UI_MESSAGE extends UIMessage> = {
	/**
	 * The id of the chat.
	 */
	readonly id: string;

	/**
	 * Update the `messages` state locally. This is useful when you want to
	 * edit the messages on the client, and then trigger the `reload` method
	 * manually to regenerate the AI response.
	 */
	setMessages: (
		messages: UI_MESSAGE[] | ((messages: UI_MESSAGE[]) => UI_MESSAGE[]),
	) => void;

	error: Accessor<Error | undefined>;
	status: Accessor<ChatStatus>;
} & Pick<
	AbstractChat<UI_MESSAGE>,
	| "sendMessage"
	| "regenerate"
	| "stop"
	| "resumeStream"
	| "addToolResult"
	| "messages"
	| "clearError"
>;

export type UseChatOptions<UI_MESSAGE extends UIMessage> = (
	| { chat: Chat<UI_MESSAGE> }
	| ChatInit<UI_MESSAGE>
) & {
	/**
	 * Whether to resume an ongoing chat generation stream.
	 */
	resume?: boolean;
};

export function useChat<UI_MESSAGE extends UIMessage = UIMessage>({
	resume = false,
	...options
}: UseChatOptions<UI_MESSAGE> = {}): UseChatHelpers<UI_MESSAGE> {
	const chat = "chat" in options ? options.chat : new Chat(options);

	onMount(() => {
		if (resume) {
			chat.resumeStream();
		}
	});

	const setMessages = (
		messages: UI_MESSAGE[] | ((messages: UI_MESSAGE[]) => UI_MESSAGE[]),
	) => {
		if (typeof messages === "function") {
			chat.messages = messages(chat.messages);
		} else {
			chat.messages = messages;
		}
	};

	return {
		id: chat.id,
		messages: chat.messages,
		// wrap in accessors to preserve reactivity
		error: () => chat.error,
		status: () => chat.status,
		setMessages,
		sendMessage: chat.sendMessage,
		regenerate: chat.regenerate,
		clearError: chat.clearError,
		stop: chat.stop,
		resumeStream: chat.resumeStream,
		addToolResult: chat.addToolResult,
	};
}
