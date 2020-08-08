Converts an array-like object to a Set (or Set polyfill), then delegates to another
assertion.

The purpose is to make the assertions defined for `Set` instances easily
accessible when you need to make assertions about an array without considering
the order or duplicate items.

```js
expect([3, 2, 1], 'with set semantics to satisfy', new Set([1, 2, 3]));
```

```js
expect([3, 2, 1], 'with set semantics to satisfy', new Set([1, 2]));
```

```output
expected [ 3, 2, 1 ] with set semantics to satisfy Set([ 1, 2 ])

Set([
  3, // should be removed
  2,
  1
])
```
