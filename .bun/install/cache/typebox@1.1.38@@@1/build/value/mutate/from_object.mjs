// deno-fmt-ignore-file
import { Guard } from '../../guard/index.mjs';
import { Pointer } from '../pointer/index.mjs';
import { Clone } from '../clone/index.mjs';
import { FromValue } from './from_value.mjs';
// ------------------------------------------------------------------
// AssertKey
// ------------------------------------------------------------------
function AssertKey(key) {
    if (Guard.IsUnsafePropertyKey(key))
        throw Error('Attempted to Mutate with unsafe property key');
}
// ------------------------------------------------------------------
// AssertKey
// ------------------------------------------------------------------
export function FromObject(root, path, current, next) {
    if (!Guard.IsObjectNotArray(current)) {
        Pointer.Set(root, path, Clone(next));
    }
    else {
        const currentKeys = Guard.Keys(current);
        const nextKeys = Guard.Keys(next);
        for (const currentKey of currentKeys) {
            AssertKey(currentKey);
            if (!nextKeys.includes(currentKey)) {
                delete current[currentKey];
            }
        }
        for (const nextKey of nextKeys) {
            AssertKey(nextKey);
            if (!currentKeys.includes(nextKey)) {
                current[nextKey] = next[nextKey];
            }
        }
        for (const nextKey of nextKeys) {
            AssertKey(nextKey);
            FromValue(root, `${path}/${nextKey}`, current[nextKey], next[nextKey]);
        }
    }
}
