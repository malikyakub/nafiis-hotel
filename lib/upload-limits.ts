// Leave room for multipart/base64 overhead in hosted function requests.
export const MAX_RECEIPT_BYTES = 4 * 1024 * 1024;
export const MAX_RECEIPT_REQUEST_BYTES = MAX_RECEIPT_BYTES + 64 * 1024;
