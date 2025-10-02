import type { CompletionRequestOptions, UseCompletionOptions } from "ai";
import { callCompletionApi } from "ai";
import type { Accessor, Setter } from "solid-js";
import { createSignal, onCleanup } from "solid-js";

export type { UseCompletionOptions };

export interface UseCompletionHelpers {
	/** The current completion result */
	completion: Accessor<string>;
	/**
	 * Update the `completion` state locally.
	 */
	setCompletion: Setter<string>;
	/**
	 * Send a new prompt to the API endpoint and update the completion state.
	 */
	complete: (
		prompt: string,
		options?: CompletionRequestOptions,
	) => Promise<string | null | undefined>;
	/** The error object of the API request */
	error: Accessor<Error | undefined>;
	/**
	 * Abort the current API request but keep the generated tokens.
	 */
	stop: () => void;
	/** The current value of the input */
	input: Accessor<string>;
	/** setStore-powered method to update the input value */
	setInput: Setter<string>;
	/**
	 * An input/textarea-ready onChange handler to control the value of the input
	 * @example
	 * ```jsx
	 * <input value={input()} onInput={handleInputChange} />
	 * ```
	 */
	handleInputChange: (event: {
		currentTarget: HTMLInputElement | HTMLTextAreaElement;
	}) => void;

	/**
	 * Form submission handler to automatically reset input and append a user message
	 * @example
	 * ```jsx
	 * <form onSubmit={handleSubmit}>
	 *  <input value={input()} onInput={handleInputChange} />
	 * </form>
	 * ```
	 */
	handleSubmit: (event?: { preventDefault?: () => void }) => void;

	/** Whether the API request is in progress */
	isLoading: Accessor<boolean>;
}

export function useCompletion({
	api = "/api/completion",
	initialCompletion = "",
	initialInput = "",
	credentials,
	headers,
	body,
	streamProtocol = "data",
	fetch,
	onFinish,
	onError,
}: UseCompletionOptions = {}): UseCompletionHelpers {
	const [completion, setCompletion] = createSignal(initialCompletion);
	const [error, setError] = createSignal<Error>();
	const [isLoading, setIsLoading] = createSignal(false);
	const [input, setInput] = createSignal(initialInput);

	let controller: AbortController | null = null;
	const stop: UseCompletionHelpers["stop"] = () => {
		controller?.abort();
		controller = null;
	};
	onCleanup(stop);

	const complete: UseCompletionHelpers["complete"] = async (
		prompt,
		options,
	) => {
		setIsLoading(true);
		setError(undefined);

		const response = await callCompletionApi({
			api,
			prompt,
			credentials,
			headers: { ...headers, ...options?.headers },
			body: {
				...body,
				...options?.body,
			},
			streamProtocol,
			fetch,
			setCompletion,
			setLoading: setIsLoading,
			setError,
			setAbortController: (ac) => (controller = ac),
			onFinish,
			onError,
		});
		return response;
	};

	const handleInputChange: UseCompletionHelpers["handleInputChange"] = (
		event,
	) => {
		setInput(event.currentTarget.value);
	};

	const handleSubmit: UseCompletionHelpers["handleSubmit"] = (event?: {
		preventDefault?: () => void;
	}) => {
		event?.preventDefault?.();
		const inputValue = input();
		if (inputValue) {
			complete(inputValue);
		}
	};

	return {
		completion,
		complete,
		error,
		setCompletion,
		stop,
		input,
		setInput,
		handleInputChange,
		handleSubmit,
		isLoading,
	};
}
