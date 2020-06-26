// Use polyfill if native Set is not available. This allows the `with set semantics` assertion
// to work despite Set not being available:
const SetOrPolyfill = require('es6-set');

// Had to copy this from unexpected's lib/defaultDepth.js because the value is not exposed to plugins :/
let defaultDepth = 3;
if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
  const m = window.location.search.match(/[?&]depth=(\d+)(?:$|&)/);
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
      indent: true,
      identify(obj) {
        return (
          obj instanceof SetOrPolyfill ||
          (obj && obj.constructor && obj.constructor.name === 'Set')
        );
      },
      equal(a, b) {
        if (a.size !== b.size) {
          return false;
        }
        for (const value of a) {
          if (!b.has(value)) {
            return false;
          }
        }
        return true;
      },
      prefix(output) {
        return output.jsKeyword('Set').text('([');
      },
      suffix(output) {
        return output.text('])');
      },
      inspect(set, depth, output, inspect) {
        // Mostly copied from array-like's inspect:
        const prefixOutput = this.prefix(output.clone(), set);
        const suffixOutput = this.suffix(output.clone(), set);
        if (set.size === 0) {
          return output.append(prefixOutput).append(suffixOutput);
        }

        if (depth === 1 && set.size > 10) {
          return output.append(prefixOutput).text('...').append(suffixOutput);
        }

        const inspectedItems = [];
        set.forEach((item) => {
          inspectedItems.push(inspect(item));
        });

        const currentDepth = defaultDepth - Math.min(defaultDepth, depth);
        const maxLineLength =
          output.preferredWidth -
          20 -
          currentDepth * output.indentationWidth -
          2;
        let width = 0;
        const multipleLines = inspectedItems.some((o) => {
          if (o.isMultiline()) {
            return true;
          }

          const size = o.size();
          width += size.width;
          return width > maxLineLength;
        });

        const type = this;
        inspectedItems.forEach((inspectedItem, index) => {
          inspectedItem.amend(
            type.delimiter(output.clone(), index, inspectedItems.length)
          );
        });

        output.append(prefixOutput);
        if (this.forceMultipleLines || multipleLines) {
          if (!prefixOutput.isEmpty()) {
            output.nl();
          }
          if (this.indent) {
            output.indentLines();
          }
          inspectedItems.forEach((inspectedItem, index) => {
            output
              .nl(index > 0 ? 1 : 0)
              .i()
              .block(inspectedItem);
          });
          if (this.indent) {
            output.outdentLines();
          }
          if (!suffixOutput.isEmpty()) {
            output.nl();
          }
        } else {
          output.sp(prefixOutput.isEmpty() ? 0 : 1);
          inspectedItems.forEach((inspectedItem, index) => {
            output.append(inspectedItem);
            const lastIndex = index === inspectedItems.length - 1;
            if (!lastIndex) {
              output.sp();
            }
          });
          output.sp(suffixOutput.isEmpty() ? 0 : 1);
        }
        output.append(suffixOutput);
      },
      diff(actual, expected, output, diff, inspect, equal) {
        output.inline = true;
        const prefixOutput = this.prefix(output.clone(), actual);
        const suffixOutput = this.suffix(output.clone(), actual);

        output.append(prefixOutput).nl(prefixOutput.isEmpty() ? 0 : 1);
        if (this.indent) {
          output.indentLines();
        }
        const type = this;
        let index = 0;
        actual.forEach((actualElement) => {
          output
            .nl(index > 0 ? 1 : 0)
            .i()
            .block(function () {
              this.appendInspected(actualElement);
              type.delimiter(this, index, actual.size);
              if (!expected.has(actualElement)) {
                this.sp().annotationBlock(function () {
                  this.error('should be removed');
                });
              }
            });
          index += 1;
        });
        expected.forEach((expectedElement) => {
          if (!actual.has(expectedElement)) {
            output
              .nl(index > 0 ? 1 : 0)
              .i()
              .annotationBlock(function () {
                this.error('missing').sp().appendInspected(expectedElement);
              });
            index += 1;
          }
        });
        if (this.indent) {
          output.outdentLines();
        }
        output.nl(suffixOutput.isEmpty() ? 0 : 1).append(suffixOutput);

        return output;
      },
    });

    expect.addAssertion(
      '<array-like> with set semantics <assertion?>',
      (expect, subject) => expect.shift(new SetOrPolyfill(subject))
    );

    expect.addAssertion(
      '<Set> [not] to contain <any>',
      (expect, subject, value) => {
        expect.withError(
          () => {
            expect(subject.has(value), '[not] to be true');
          },
          () => {
            expect.fail({
              diff(output, diff, inspect, equal) {
                output.inline = true;
                expect.subjectType.prefix(output, subject);
                output.nl().indentLines();

                const subjectElements = [];
                subject.forEach((element) => {
                  subjectElements.push(element);
                });

                subjectElements.forEach((subjectElement, subjectIndex) => {
                  output
                    .i()
                    .block(function () {
                      this.appendInspected(subjectElement);
                      expect.subjectType.delimiter(
                        this,
                        subjectIndex,
                        subjectElements.length
                      );
                      if (expect.flags.not && subjectElement === value) {
                        this.sp().annotationBlock(function () {
                          this.error('should be removed');
                        });
                      }
                    })
                    .nl();
                });
                if (!expect.flags.not) {
                  output
                    .i()
                    .block(function () {
                      this.annotationBlock(function () {
                        this.error('missing').sp().appendInspected(value);
                      });
                    })
                    .nl();
                }

                output.outdentLines();
                expect.subjectType.suffix(output, subject);

                return output;
              },
            });
          }
        );
      }
    );

    expect.addAssertion(
      [
        '<Set> to have items [exhaustively] satisfying <any+>',
        '<Set> to have items [exhaustively] satisfying <assertion>',
      ],
      (expect, subject, nextArg) => {
        expect.errorMode = 'nested';
        expect(subject.size, 'not to equal', 0);
        expect.errorMode = 'bubble';

        const subjectElements = [];
        subject.forEach((element) => {
          subjectElements.push(element);
        });

        const expected = [];
        subject.forEach((subjectElement) => {
          if (typeof nextArg === 'string') {
            expected.push(expect.it((s) => expect.shift(s, 0)));
          } else if (typeof nextArg === 'function') {
            expected.push(nextArg);
          } else {
            expected.push(nextArg);
          }
        });
        return expect.withError(
          () => expect(subjectElements, 'to [exhaustively] satisfy', expected),
          (err) => {
            expect.fail({
              message(output) {
                output.append(
                  expect.standardErrorMessage(output.clone(), { compact: true })
                );
              },
              diff(output) {
                output.inline = true;
                return output
                  .jsKeyword('Set')
                  .text('(')
                  .append(err.getDiff({ output }))
                  .text(')');
              },
            });
          }
        );
      }
    );

    expect.addAssertion(
      '<Set> to have elements satisfying <array-like>',
      (expect, subject, value) => {
        return expect(subject, 'to satisfy', new Set(value));
      }
    );

    expect.addAssertion(
      '<Set> to [exhaustively] satisfy <Set>',
      (expect, subject, value) => {
        const subjectElements = [];
        subject.forEach((element) => {
          subjectElements.push(element);
        });
        const valueElements = [];
        value.forEach((element) => {
          valueElements.push(element);
        });

        const promiseBySubjectIndexAndValueIndex = subjectElements.map(
          () => new Array(valueElements.length)
        );

        const promiseByValueIndexAndSubjectIndex = valueElements.map(
          (valueElement, valueIndex) =>
            subjectElements.map((subjectElement, subjectIndex) => {
              const promise = expect.promise(() => {
                const valueElementType = expect.findTypeOf(valueElement);
                if (valueElementType.is('function')) {
                  return valueElement(subjectElement);
                } else {
                  return expect(
                    subjectElement,
                    'to [exhaustively] satisfy',
                    valueElement
                  );
                }
              });
              promiseBySubjectIndexAndValueIndex[subjectIndex][
                valueIndex
              ] = promise;
              return promise;
            })
        );

        return expect.promise
          .settle(promiseByValueIndexAndSubjectIndex)
          .then(() => {
            if (
              !promiseByValueIndexAndSubjectIndex.every((row) =>
                row.some((promise) => promise.isFulfilled())
              ) ||
              !subjectElements.every((subjectElement, i) =>
                promiseByValueIndexAndSubjectIndex.some((row) =>
                  row[i].isFulfilled()
                )
              )
            ) {
              expect.fail({
                diff(output, diff, inspect, equal) {
                  output.inline = true;
                  const prefixOutput = expect.subjectType.prefix(
                    output.clone(),
                    subject
                  );
                  const suffixOutput = expect.subjectType.suffix(
                    output.clone(),
                    subject
                  );

                  output.append(prefixOutput);
                  if (!prefixOutput.isEmpty()) {
                    output.nl();
                  }
                  if (expect.subjectType.indent) {
                    output.indentLines();
                  }

                  let index = 0;
                  subjectElements.forEach((subjectElement, subjectIndex) => {
                    output
                      .nl(index > 0 ? 1 : 0)
                      .i()
                      .block(function () {
                        this.appendInspected(subjectElement);
                        expect.subjectType.delimiter(
                          this,
                          subjectIndex,
                          subjectElements.length
                        );
                        if (
                          !promiseBySubjectIndexAndValueIndex[
                            subjectIndex
                          ].some((promise, valueIndex) =>
                            promiseBySubjectIndexAndValueIndex[subjectIndex][
                              valueIndex
                            ].isFulfilled()
                          )
                        ) {
                          this.sp().annotationBlock(function () {
                            this.error('should be removed');
                          });
                        }
                      });
                    index += 1;
                  });
                  valueElements.forEach((valueElement, valueIndex) => {
                    if (
                      promiseByValueIndexAndSubjectIndex[
                        valueIndex
                      ].every((promise) => promise.isRejected())
                    ) {
                      output
                        .nl(index > 0 ? 1 : 0)
                        .i()
                        .annotationBlock(function () {
                          if (expect.findTypeOf(valueElement).is('function')) {
                            this.omitSubject = subjectElements[0];
                            this.error('missing:')
                              .sp()
                              .appendErrorMessage(
                                promiseByValueIndexAndSubjectIndex[
                                  valueIndex
                                ][0].reason()
                              );
                          } else {
                            this.error('missing')
                              .sp()
                              .appendInspected(valueElement);
                          }
                        });
                      index += 1;
                    }
                  });

                  if (expect.subjectType.indent) {
                    output.outdentLines();
                  }
                  if (!suffixOutput.isEmpty()) {
                    output.nl();
                  }
                  output.append(suffixOutput);

                  return output;
                },
              });
            }
          });
      }
    );
  },
};
