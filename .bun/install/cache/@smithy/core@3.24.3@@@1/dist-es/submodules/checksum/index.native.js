const no = Symbol.for("node-only");
export { blobHasher } from "./hash-blob-browser/blobHasher";
export const fileStreamHasher = no;
export const readableStreamHasher = no;
export { Md5 } from "./md5-js/md5";
export { blobReader } from "./chunked-blob-reader/chunked-blob-reader.native";
