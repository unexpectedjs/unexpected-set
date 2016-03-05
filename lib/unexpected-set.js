/*global window*/
// Use polyfill if native Set is not available. This allows the `with set semantics` assertion
// to work despite Set not being available:
var SetOrPolyfill = require('es6-set');

// Had to copy this from unexpected's lib/defaultDepth.js because the value is not exposed to plugins :/
var defaultDepth = 3;
if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
    var m = window.location.search.match(/[?&]depth=(\d+)(?:$|&)/);
    if (m) {
        defaultDepth = parseInt(m[1], 10);
    }
} else if (typeof process !== 'undefined' && process.env.UNEXPECTED_DEPTH) {
    defaultDepth = parseInt(process.env.UNEXPECTED_DEPTH, 10);
}

module.exports = {
    name: 'unexpected-set',
    version: require('../package.json').version,
    installInto: function unexpectedSet(expect) {
        expect.addType({
            name: 'Set',
            base: 'object',
            identify: function (obj) {
                return (
                    obj instanceof SetOrPolyfill ||
                    (obj && obj.constructor && obj.constructor.name === 'Set')
                );
            },
            equal: function (a, b) {
                if (a.size !== b.size) {
                    return false;
                }
                var iterator = a.entries();
                var entry = iterator.next();
                while (!entry.done) {
                    if (!b.has(entry.value)) {
                        return false;
                    }
                    entry = iterator.next();
                }
                return true;
            },
            prefix: function (output) {
                return output.jsKeyword('Set').text('([');
            },
            suffix: function (output) {
                return output.text('])');
            },
            inspect: function (set, depth, output, inspect) {
                // Mostly copied from array-like's inspect:
                var prefixOutput = this.prefix(output.clone(), set);
                var suffixOutput = this.suffix(output.clone(), set);
                if (set.size === 0) {
                    return output.append(prefixOutput).append(suffixOutput);
                }

                if (depth === 1 && set.size > 10) {
                    return output.append(prefixOutput).text('...').append(suffixOutput);
                }

                var inspectedItems = [];
                set.forEach(function (item) {
                    inspectedItems.push(inspect(item));
                });

                var currentDepth = defaultDepth - Math.min(defaultDepth, depth);
                var maxLineLength = (output.preferredWidth - 20) - currentDepth * output.indentationWidth - 2;
                var width = 0;
                var multipleLines = inspectedItems.some(function (o) {
                    if (o.isMultiline()) {
                        return true;
                    }

                    var size = o.size();
                    width += size.width;
                    return width > maxLineLength;
                });

                var type = this;
                inspectedItems.forEach(function (inspectedItem, index) {
                    inspectedItem.amend(type.delimiter(output.clone(), index, inspectedItems.length));
                });

                if (multipleLines) {
                    output.append(prefixOutput).nl().indentLines();

                    inspectedItems.forEach(function (inspectedItem, index) {
                        output.i().block(inspectedItem).nl();
                    });

                    output.outdentLines().append(suffixOutput);
                } else {
                    output.append(prefixOutput).sp();
                    inspectedItems.forEach(function (inspectedItem, index) {
                        output.append(inspectedItem);
                        var lastIndex = index === inspectedItems.length - 1;
                        if (!lastIndex) {
                            output.sp();
                        }
                    });
                    output.sp().append(suffixOutput);
                }
            },
            diff: function (actual, expected, output, diff, inspect, equal) {
                output.inline = true;
                output.append(this.prefix(output.clone(), actual)).nl().indentLines();
                var type = this;
                var actualIndex = 0;
                actual.forEach(function (actualElement) {
                    output.i().block(function () {
                        this.appendInspected(actualElement);
                        type.delimiter(this, actualIndex, actual.size);
                        if (!expected.has(actualElement)) {
                            this.sp().annotationBlock(function () {
                                this.error('should be removed');
                            });
                        }
                    }).nl();
                    actualIndex += 1;
                });
                expected.forEach(function (expectedElement) {
                    if (!actual.has(expectedElement)) {
                        output.i().annotationBlock(function () {
                            this.error('missing').sp().appendInspected(expectedElement);
                        }).nl();
                    }
                });
                output.outdentLines().append(this.suffix(output.clone(), actual));

                return output;
            }
        });

        expect.addAssertion('<array-like> with set semantics <assertion?>', function (expect, subject) {
            return expect.shift(new SetOrPolyfill(subject));
        });

        expect.addAssertion([
            '<Set> to have items satisfying <any+>',
            '<Set> to have items satisfying <assertion>'
        ], function (expect, subject, nextArg) {
            expect.errorMode = 'nested';
            expect(subject.size, 'not to equal', 0);
            expect.errorMode = 'bubble';

            var subjectElements = [];
            subject.forEach(function (element) {
                subjectElements.push(element);
            });

            var expected = [];
            subject.forEach(function (subjectElement) {
                if (typeof nextArg === 'string') {
                    expected.push(function (s) {
                        return expect.shift(s, 0);
                    });
                } else if (typeof nextArg === 'function') {
                    expected.push(nextArg);
                } else {
                    expected.push(nextArg);
                }
            });
            return expect.withError(function () {
                return expect(subjectElements, 'to satisfy', expected);
            }, function (err) {
                expect.fail({
                    message: function (output) {
                        output.append(expect.standardErrorMessage(output.clone(), { compact: true }));
                    },
                    diff: function (output) {
                        output.inline = true;
                        return output.jsKeyword('Set').text('(').append(err.getDiff({ output: output })).text(')');
                    }
                });
            });
        });

        expect.addAssertion('<Set> to [exhaustively] satisfy <Set>', function (expect, subject, value) {
            var valueElements = [];
            value.forEach(function (element) {
                valueElements.push(element);
            });
            return expect(subject, 'to [exhaustively] satisfy', valueElements);
        });

        expect.addAssertion('<Set> to [exhaustively] satisfy <array-like>', function (expect, subject, valueElements) {
            var subjectElements = [];
            subject.forEach(function (element) {
                subjectElements.push(element);
            });
            var promiseBySubjectIndexAndValueIndex = subjectElements.map(function () {
                return new Array(valueElements.length);
            });

            var promiseByValueIndexAndSubjectIndex = valueElements.map(function (valueElement, valueIndex) {
                return subjectElements.map(function (subjectElement, subjectIndex) {
                    var promise = expect.promise(function () {
                        var valueElementType = expect.findTypeOf(valueElement);
                        if (valueElementType.is('function')) {
                            return valueElement(subjectElement);
                        } else {
                            return expect(subjectElement, 'to [exhaustively] satisfy', valueElement);
                        }
                    });
                    promiseBySubjectIndexAndValueIndex[subjectIndex][valueIndex] = promise;
                    return promise;
                });
            });

            return expect.promise.settle(promiseByValueIndexAndSubjectIndex).then(function () {
                if (
                    !promiseByValueIndexAndSubjectIndex.every(function (row) {
                        return row.some(function (promise) {
                            return promise.isFulfilled();
                        });
                    }) || (expect.flags.exhaustively && !subjectElements.every(function (subjectElement, i) {
                        return promiseByValueIndexAndSubjectIndex.some(function (row) {
                            return row[i].isFulfilled();
                        });
                    }))
                ) {
                    expect.fail({
                        diff: function (output, diff, inspect, equal) {
                            output.inline = true;
                            expect.subjectType.prefix(output, subject);
                            output.nl().indentLines();

                            subjectElements.forEach(function (subjectElement, subjectIndex) {
                                output.i().block(function () {
                                    this.appendInspected(subjectElement);
                                    expect.subjectType.delimiter(this, subjectIndex, subjectElements.length);
                                    if (
                                        expect.flags.exhaustively &&
                                        !promiseBySubjectIndexAndValueIndex[subjectIndex].some(function (promise, valueIndex) {
                                            return promiseBySubjectIndexAndValueIndex[subjectIndex][valueIndex].isFulfilled();
                                        })
                                    ) {
                                        this.sp().annotationBlock(function () {
                                            this.error('should be removed');
                                        });
                                    }
                                }).nl();
                            });
                            valueElements.forEach(function (valueElement, valueIndex) {
                                if (
                                    promiseByValueIndexAndSubjectIndex[valueIndex].every(function (promise) {
                                        return promise.isRejected();
                                    })
                                ) {
                                    output.i().annotationBlock(function () {
                                        if (expect.findTypeOf(valueElement).is('function')) {
                                            this.omitSubject = subjectElements[0];
                                            this.error('missing:').sp().appendErrorMessage(promiseByValueIndexAndSubjectIndex[valueIndex][0].reason());
                                        } else {
                                            this.error('missing').sp().appendInspected(valueElement);
                                        }
                                    }).nl();
                                }
                            });

                            output.outdentLines();
                            expect.subjectType.suffix(output, subject);

                            return output;
                        }
                    });
                }
            });
        });
    }
};
