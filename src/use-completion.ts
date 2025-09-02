import {
    CompletionRequestOptions,
    UseCompletionOptions,
    callCompletionApi,
} from 'ai';
import { createEffect, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';

export type { UseCompletionOptions };

export type UseCompletionHelpers = {
    /** The current completion result */
    completion: string;
    /**
     * Send a new prompt to the API endpoint and update the completion state.
     */
    complete: (
        prompt: string,
        options?: CompletionRequestOptions,
    ) => Promise<string | null | undefined>;
    /** The error object of the API request */
    error: undefined | Error;
    /**
     * Abort the current API request but keep the generated tokens.
     */
    stop: () => void;
    /**
     * Update the `completion` state locally.
     */
    setCompletion: (completion: string) => void;
    /** The current value of the input */
    input: string;
    /** setStore-powered method to update the input value */
    setInput: (v: string) => void;
    /**
     * An input/textarea-ready onChange handler to control the value of the input
     * @example
     * ```jsx
     * <input onInput={handleInputChange} value={input} />
     * ```
     */
    handleInputChange: (
        event: Event & { currentTarget: HTMLInputElement | HTMLTextAreaElement }
    ) => void;

    /**
     * Form submission handler to automatically reset input and append a user message
     * @example
     * ```jsx
     * <form onSubmit={handleSubmit}>
     *  <input onInput={handleInputChange} value={input} />
     * </form>
     * ```
     */
    handleSubmit: (event?: { preventDefault?: () => void }) => void;

    /** Whether the API request is in progress */
    isLoading: boolean;
};

export function useCompletion({
    api = '/api/completion',
    initialCompletion = '',
    initialInput = '',
    credentials,
    headers,
    body,
    streamProtocol = 'data',
    fetch,
    onFinish,
    onError,
}: UseCompletionOptions = {}): UseCompletionHelpers {
    const [state, setState] = createStore<{
        completion: string;
        isLoading: boolean;
        error?: Error;
        input: string;
        abortController: AbortController | null;
        extraMetadata: {
            credentials?: RequestCredentials;
            headers?: Record<string, string> | Headers;
            body?: Record<string, unknown> | object;
        };
    }>({
        completion: initialCompletion,
        isLoading: false,
        error: undefined,
        input: initialInput,
        abortController: null,
        extraMetadata: {
            credentials,
            headers,
            body,
        },
    });

    // Keep extraMetadata up to date
    createEffect(() => {
        setState('extraMetadata', {
            credentials,
            headers,
            body,
        });
    });

    // Clean up abort controller on unmount
    onCleanup(() => {
        if (state.abortController) {
            state.abortController.abort();
        }
    });

    // The main function to trigger the API request
    async function triggerRequest(prompt: string, options?: CompletionRequestOptions) {
        setState('isLoading', true);
        setState('error', undefined);

        return callCompletionApi({
            api,
            prompt,
            credentials: state.extraMetadata.credentials,
            headers: { ...state.extraMetadata.headers, ...options?.headers },
            body: {
                ...state.extraMetadata.body,
                ...options?.body,
            },
            streamProtocol,
            fetch,
            setCompletion: (v: string) => setState('completion', v),
            setLoading: (v: boolean) => setState('isLoading', v),
            setError: (e: Error | undefined) => setState('error', e),
            setAbortController: (ac: AbortController | null) => setState('abortController', ac),
            onFinish,
            onError,
        });
    }

    function stop() {
        if (state.abortController) {
            state.abortController.abort();
            setState('abortController', null);
        }
    }

    async function complete(prompt: string, options?: CompletionRequestOptions) {
        return triggerRequest(prompt, options);
    }

    function setCompletion(completion: string) {
        setState('completion', completion);
    }

    function setInput(v: string) {
        setState('input', v);
    }

    function handleInputChange(
        e: Event & { currentTarget: HTMLInputElement | HTMLTextAreaElement }
    ) {
        setInput(e.currentTarget.value);
    }

    function handleSubmit(event?: { preventDefault?: () => void }) {
        event?.preventDefault?.();
        if (state.input) {
            complete(state.input);
        }
    }

    return {
        completion: state.completion,
        complete,
        error: state.error,
        setCompletion,
        stop,
        input: state.input,
        setInput,
        handleInputChange,
        handleSubmit,
        isLoading: state.isLoading,
    };
}