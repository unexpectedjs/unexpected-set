---
template: default.ejs
theme: dark
title: Unexpected-set
repository: https://github.com/unexpectedjs/unexpected-set
---

Add support to [Unexpected](http://unexpected.js.org) for testing [Set](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Set) instances.

[![NPM version](https://badge.fury.io/js/unexpected-set.svg)](http://badge.fury.io/js/unexpected-set)
[![Build Status](https://travis-ci.org/unexpectedjs/unexpected-set.svg?branch=master)](https://travis-ci.org/unexpectedjs/unexpected-set)
[![Coverage Status](https://coveralls.io/repos/unexpectedjs/unexpected-set/badge.svg)](https://coveralls.io/r/unexpectedjs/unexpected-set)
[![Dependency Status](https://david-dm.org/unexpectedjs/unexpected-set.svg)](https://david-dm.org/unexpectedjs/unexpected-set)

```js
expect(new Set([1, 2, 3]), 'to satisfy', new Set([1, 2, 3, 4]));
```

```output
expected Set([ 1, 2, 3 ]) to satisfy Set([ 1, 2, 3, 4 ])

Set([
  1,
  2,
  3
  // missing 4
])
```
