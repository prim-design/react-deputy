/**
 * A standard implementation of the CopilotApiConfig interface.
 *
 * Pass in the base URL of the chat API, the headers to be sent with each request, and the body to be sent with each request.
 * The rest of the CopilotApiConfig interface is implemented by default.
 *
 */

export class StandardDeputyApiConfig implements DeputyApiConfig {
  chatApiEndpoint: string
  chatApiEndpointV2: string
  headers: Record<string, string>
  body: Record<string, unknown>

  constructor(
    chatApiEndpoint: string,
    chatApiEndpointV2: string,
    headers: Record<string, string>,
    body: Record<string, unknown>,
  ) {
    this.chatApiEndpoint = chatApiEndpoint
    this.chatApiEndpointV2 = chatApiEndpointV2
    this.headers = headers
    this.body = body
  }
}

export interface DeputyApiConfig {
  /**
   * The endpoint for the chat API.
   */
  chatApiEndpoint: string

  /**
   * The endpoint for the chat API v2.
   */
  chatApiEndpointV2: string

  /**
   * additional headers to be sent with the request
   * @default {}
   * @example
   * ```
   * {
   *   'Authorization': 'Bearer your_token_here'
   * }
   * ```
   */
  headers: Record<string, string>

  /**
   * Additional body params to be sent with the request
   * @default {}
   * @example
   * ```
   * {
   *   'message': 'Hello, world!'
   * }
   * ```
   */
  body: Record<string, unknown>
}
