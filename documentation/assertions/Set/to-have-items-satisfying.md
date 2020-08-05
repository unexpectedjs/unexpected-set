Asserts the items contained by a Set satisfy a particular list of items.

```js
expect(new Set([1, 2, 3]), 'to have items satisfying', [1, { foo: 'bar' }, 3]);
```

```output
expected Set([ 1, 2, 3 ]) to have items satisfying [ 1, { foo: 'bar' }, 3 ]

Set([
  1,
  2, // should equal { foo: 'bar' }
  3
])
```

In order to check a property holds for all the items, an assertion can be
passsed as the argument - in this example we assert that all the items in
the set are numbers:

```js
expect(new Set([1, 2, []]), 'to have items satisfying', 'to be a number');
```

```output
expected Set([ 1, 2, [] ]) to have items satisfying to be a number

Set([
  1,
  2,
  [] // should be a number
])
```

The exact number of elements in a Set must always be matched. However, nested
objects are, be default, compared using "satisfy" semantics which allow missing
properties. In order to enforce that all properties are present, the `exhaustively`
flag can be used:

```js
expect(
  new Set([{ foo: true, bar: true }, { baz: false }]),
  'to exhaustively satisfy',
  new Set([{ foo: true }, { baz: false }])
);
```

```output
expected Set([ { foo: true, bar: true }, { baz: false } ])
to exhaustively satisfy Set([ { foo: true }, { baz: false } ])

Set([
  { foo: true, bar: true }, // should be removed
  { baz: false }
  // missing { foo: true }
])
```
