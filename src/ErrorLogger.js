export class ErrorLogger {
  static httpsError(url, statusCode, method='GET') {
    return `${method} ${url} returned ${statusCode} :(`;
  }
}