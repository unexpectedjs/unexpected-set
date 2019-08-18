require('es6-set/implement');

const expect = require('unexpected')
  .clone()
  .use(require('../lib/unexpected-set'));
expect.output.preferredWidth = 80;

expect.addAssertion('<any> to inspect as <string>', (expect, subject, value) => {
  expect(expect.inspect(subject).toString(), 'to equal', value);
});

expect.addAssertion('<array> to produce a diff of <string>', (expect, subject, value) => {
  expect.errorMode = 'bubble';
  expect(expect.diff(subject[0], subject[1]).toString(), 'to equal', value);
});

describe('unexpected-set', () => {
  describe('Set type', () => {
    it('should inspect a Set instance correctly', () => {
      expect(new Set([1, 2]), 'to inspect as', 'Set([ 1, 2 ])');
    });

    it('should diff two Set instances correctly', () => {
      expect(
        [new Set([1, 2]), new Set([2, 3])],
        'to produce a diff of',
        'Set([\n' +
          '  1, // should be removed\n' +
          '  2\n' +
          '  // missing 3\n' +
          '])'
      );
    });

    describe('equality', () => {
      it('should consider two empty sets equal', () => {
        expect(new Set(), 'to equal', new Set());
      });

      it('should consider two sets with the same item equal', () => {
        expect(new Set(['abc']), 'to equal', new Set(['abc']));
      });

      it('should consider two sets with a different item unequal', () => {
        expect(new Set(['abc']), 'not to equal', new Set(['def']));
      });

      it('should consider two sets with a common and a different item unequal', () => {
        expect(
          new Set(['abc', 'def']),
          'not to equal',
          new Set(['abc', 'ghi'])
        );
      });

      it('should consider two sets with a different number of items unequal', () => {
        expect(new Set(['abc']), 'not to equal', new Set(['abc', 'def']));
        expect(new Set(['abc', 'def']), 'not to equal', new Set(['abc']));
      });
    });
  });

  describe('to contain assertion', () => {
    it('should succeed', () => {
      expect(new Set([1, 2, 3]), 'to contain', 3);
    });

    it('should fail with a diff', () => {
      expect(
        () => {
          expect(new Set([1, 2, 3]), 'to contain', 4);
        },
        'to throw',
        'expected Set([ 1, 2, 3 ]) to contain 4\n' +
          '\n' +
          'Set([\n' +
          '  1,\n' +
          '  2,\n' +
          '  3\n' +
          '  // missing 4\n' +
          '])'
      );
    });

    describe('with the not flag', () => {
      it('should succeed', () => {
        expect(new Set([1, 2, 3]), 'not to contain', 4);
      });

      it('should fail with a diff', () => {
        expect(
          () => {
            expect(new Set([1, 2, 3]), 'not to contain', 2);
          },
          'to throw',
          'expected Set([ 1, 2, 3 ]) not to contain 2\n' +
            '\n' +
            'Set([\n' +
            '  1,\n' +
            '  2, // should be removed\n' +
            '  3\n' +
            '])'
        );
      });
    });
  });

  describe('with set semantics assertion', () => {
    it('should succeed', () => {
      expect([1, 2, 3], 'with set semantics to satisfy', [3, 1, 2]);
    });

    it('should fail with a diff', () => {
      expect(
        () => {
          expect([1, 2, 3], 'with set semantics to satisfy', [1, 2, 4]);
        },
        'to throw',
        'expected [ 1, 2, 3 ] with set semantics to satisfy [ 1, 2, 4 ]\n' +
          '\n' +
          'Set([\n' +
          '  1,\n' +
          '  2,\n' +
          '  3\n' +
          '  // missing 4\n' +
          '])'
      );
    });
  });

  describe('to have items satisfying assertion', () => {
    it('should succeed', () => {
      expect(new Set([1, 2, 3]), 'to have items satisfying to be a number');
    });

    it('should fail with a diff', () => {
      expect(
        () => {
          expect(
            new Set([1, 2, 'foo']),
            'to have items satisfying to be a number'
          );
        },
        'to throw',
        "expected Set([ 1, 2, 'foo' ]) to have items satisfying to be a number\n" +
          '\n' +
          'Set([\n' +
          '  1,\n' +
          '  2,\n' +
          "  'foo' // should be a number\n" +
          '])'
      );
    });

    it('should fail for the empty set', () => {
      expect(() => {
        expect(new Set([]), 'to have items satisfying to be a number');
      }, 'to throw');
    });
  });

  describe('to satisfy assertion', () => {
    describe('with a Set instance', () => {
      describe('against another Set instance', () => {
        it('should succeed', () => {
          expect(new Set([1, 2]), 'to satisfy', new Set([2, 1]));
        });

        it('should fail with a diff', () => {
          expect(
            () => {
              expect(new Set([1, 2]), 'to satisfy', new Set([3]));
            },
            'to throw',
            'expected Set([ 1, 2 ]) to satisfy Set([ 3 ])\n' +
              '\n' +
              'Set([\n' +
              '  1,\n' +
              '  2\n' +
              '  // missing 3\n' +
              '])'
          );
        });

        it('should accept extraneous items', () => {
          expect(new Set([1, 2]), 'to satisfy', [1]);
        });

        describe('with the exhaustively flag', () => {
          it('should succeed', () => {
            expect(new Set([1, 2]), 'to exhaustively satisfy', [1, 2]);
          });

          it('should not accept extraneous items', () => {
            expect(
              () => {
                expect(new Set([1, 2]), 'to exhaustively satisfy', [1]);
              },
              'to throw',
              'expected Set([ 1, 2 ]) to exhaustively satisfy [ 1 ]\n' +
                '\n' +
                'Set([\n' +
                '  1,\n' +
                '  2 // should be removed\n' +
                '])'
            );
          });
        });
      });

      it('should point out missing items', () => {
        expect(
          () => {
            expect(new Set([1]), 'to satisfy', [1, 2]);
          },
          'to throw',
          'expected Set([ 1 ]) to satisfy [ 1, 2 ]\n' +
            '\n' +
            'Set([\n' +
            '  1\n' +
            '  // missing 2\n' +
            '])'
        );
      });

      it('should point out items that were supposed to satisfy an expect.it', () => {
        expect(
          () => {
            expect(new Set([1]), 'to satisfy', [1, expect.it('to equal', 2)]);
          },
          'to throw',
          "expected Set([ 1 ]) to satisfy [ 1, expect.it('to equal', 2) ]\n" +
            '\n' +
            'Set([\n' +
            '  1\n' +
            '  // missing: should equal 2\n' +
            '])'
        );
      });
    });
  });

  describe('with a subtype that disables indentation', () => {
    const clonedExpect = expect.clone();

    clonedExpect.addType({
      base: 'Set',
      name: 'bogusSet',
      identify(obj) {
        return obj && obj.constructor && obj.constructor.name === 'Set';
      },
      prefix(output) {
        return output;
      },
      suffix(output) {
        return output;
      },
      indent: false
    });

    it('should not render the indentation when an instance is inspected in a multi-line context', () => {
      expect(
        clonedExpect
          .inspect(
            new Set([
              'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
              'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
            ])
          )
          .toString(),
        'to equal',
        "'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',\n" +
          "'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'"
      );
    });

    it('should not render the indentation when an instance is diffed', () => {
      expect(
        clonedExpect.diff(new Set(['a', 'b']), new Set(['b', 'c'])).toString(),
        'to equal',
        "'a', // should be removed\n" + "'b'\n" + "// missing 'c'"
      );
    });

    it('should not render the indentation when an instance participates in a "to satisfy" diff', () => {
      expect(
        () => {
          clonedExpect(new Set(['aaa', 'bbb']), 'to satisfy', new Set(['foo']));
        },
        'to throw',
        "expected 'aaa', 'bbb' to satisfy 'foo'\n" +
          '\n' +
          "'aaa',\n" +
          "'bbb'\n" +
          "// missing 'foo'"
      );
    });
  });
});
