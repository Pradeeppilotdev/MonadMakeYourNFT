import { R as RequestHandler } from './HttpResponse-CCdkF1fJ.js';
import '@mswjs/interceptors';
import './utils/internal/isIterable.js';
import './typeUtils.js';
import 'graphql';
import './utils/matching/matchRequestUrl.js';

/**
 * Finds a response for the given request instance
 * in the array of request handlers.
 * @param handlers The array of request handlers.
 * @param request The `Request` instance.
 * @returns {Response} A mocked response, if any.
 */
declare const getResponse: (handlers: Array<RequestHandler>, request: Request) => Promise<Response | undefined>;

export { getResponse };
