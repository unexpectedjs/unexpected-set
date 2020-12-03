const expect = require('unexpected')
  .clone()
  .use(require('../lib/unexpected-set'));
expect.output.preferredWidth = 80;

expect.addAssertion(
  '<any> to inspect as <string>',
  (expect, subject, value) => {
    expect(expect.inspect(subject).toString(), 'to equal', value);
  }
);

expect.addAssertion(
  '<array> to produce a diff of <string>',
  (expect, subject, value) => {
    expect.errorMode = 'bubble';
    expect(expect.diff(subject[0], subject[1]).toString(), 'to equal', value);
  }
);

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
      expect([1, 2, 3], 'with set semantics to satisfy', new Set([3, 1, 2]));
    });

    it('should fail with a diff', () => {
      expect(
        () => {
          expect(
            [1, 2, 3],
            'with set semantics to satisfy',
            new Set([1, 2, 4])
          );
        },
        'to throw',
        'expected [ 1, 2, 3 ] with set semantics to satisfy Set([ 1, 2, 4 ])\n' +
          '\n' +
          'Set([\n' +
          '  1,\n' +
          '  2,\n' +
          '  3 // should be removed\n' +
          '  // missing 4\n' +
          '])'
      );
    });
  });

  describe('to have items satisfying assertion', () => {
    it('should succeed', () => {
      expect(new Set([[1], [2], [3]]), 'to have items satisfying', [
        expect.it('to be a number').and('to be greater than', 0),
      ]);
    });

    it('should fail with a diff', () => {
      expect(
        () => {
          expect(new Set([[1], [2], ['foo']]), 'to have items satisfying', [
            expect.it('to be a number').and('to be greater than', 0),
          ]);
        },
        'to throw',
        "expected Set([ [ 1 ], [ 2 ], [ 'foo' ] ]) to have items satisfying\n" +
          '[\n' +
          "  expect.it('to be a number')\n" +
          "          .and('to be greater than', 0)\n" +
          ']\n' +
          '\n' +
          'Set([\n' +
          '  [ 1 ],\n' +
          '  [ 2 ],\n' +
          '  [\n' +
          "    'foo' // ⨯ should be a number and\n" +
          '          // ⨯ should be greater than 0\n' +
          '  ]\n' +
          '])'
      );
    });

    it('should fail for the empty set', () => {
      expect(() => {
        expect(new Set([]), 'to have items satisfying to be a number');
      }, 'to throw');
    });

    describe('with a compound assertion on the RHS', () => {
      it('should succeed', () => {
        expect(
          new Set([1, 2, 3]),
          'to have items satisfying',
          'to be a number'
        );
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
    });
  });

  describe('to have an item satisfying assertion', () => {
    it('should succeed', () => {
      expect(new Set([[1], [2], [3]]), 'to have an item satisfying', [
        expect.it('to be a number').and('to be greater than', 2),
      ]);
    });

    it('should fail with a diff', () => {
      expect(
        () => {
          expect(new Set([[1], [2], ['foo']]), 'to have an item satisfying', [
            expect.it('to be a number').and('to be greater than', 2),
          ]);
        },
        'to throw',
        "expected Set([ [ 1 ], [ 2 ], [ 'foo' ] ]) to have an item satisfying\n" +
          '[\n' +
          "  expect.it('to be a number')\n" +
          "          .and('to be greater than', 2)\n" +
          ']\n' +
          '\n' +
          'Set([\n' +
          '  [\n' +
          '    1 // ✓ should be a number and\n' +
          '      // ⨯ should be greater than 2\n' +
          '  ],\n' +
          '  [\n' +
          '    2 // ✓ should be a number and\n' +
          '      // ⨯ should be greater than 2\n' +
          '  ],\n' +
          '  [\n' +
          "    'foo' // ⨯ should be a number and\n" +
          '          // ⨯ should be greater than 2\n' +
          '  ]\n' +
          '])'
      );
    });

    it('should fail for the empty set', () => {
      expect(() => {
        expect(new Set([]), 'to have an item satisfying to be a number');
      }, 'to throw');
    });
  });

  describe('to satisfy assertion', () => {
    describe('with a Set instance', () => {
      describe('against another Set instance', () => {
        it('should succeed', () => {
          expect(new Set([1, 2]), 'to satisfy', new Set([2, 1]));
        });

        it('should succeed with partial object matches', () => {
          expect(
            new Set([{ foo: true, bar: 1 }]),
            'to satisfy',
            new Set([{ foo: true }])
          );
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
              '  1, // should be removed\n' +
              '  2 // should be removed\n' +
              '  // missing 3\n' +
              '])'
          );
        });

        it('should not accept extraneous items', () => {
          expect(
            () => {
              expect(new Set([1, 2]), 'to exhaustively satisfy', new Set([1]));
            },
            'to throw',
            'expected Set([ 1, 2 ]) to exhaustively satisfy Set([ 1 ])\n' +
              '\n' +
              'Set([\n' +
              '  1,\n' +
              '  2 // should be removed\n' +
              '])'
          );
        });

        describe('with the exhaustively flag', () => {
          it('should succeed', () => {
            expect(
              new Set([{ foo: true, bar: 1 }]),
              'to exhaustively satisfy',
              new Set([{ foo: true, bar: 1 }])
            );
          });
        });
      });

      it('should point out missing items', () => {
        expect(
          () => {
            expect(new Set([1]), 'to satisfy', new Set([1, 2]));
          },
          'to throw',
          'expected Set([ 1 ]) to satisfy Set([ 1, 2 ])\n' +
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
            expect(
              new Set([1]),
              'to satisfy',
              new Set([1, expect.it('to equal', 2)])
            );
          },
          'to throw',
          "expected Set([ 1 ]) to satisfy Set([ 1, expect.it('to equal', 2) ])\n" +
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
      indent: false,
    });

    it('should not render the indentation when an instance is inspected in a multi-line context', () => {
      expect(
        clonedExpect
          .inspect(
            new Set([
              'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
              'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
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
          "'aaa', // should be removed\n" +
          "'bbb' // should be removed\n" +
          "// missing 'foo'"
      );
    });
  });

  describe('to have size assertion', () => {
    it('should succeed', () => {
      expect(new Set([1, 2, 3]), 'to have size', 3);
    });

    it('should fail', () => {
      expect(
        () => {
          expect(new Set([1, 2, 3]), 'to have size', 2);
        },
        'to throw',
        'expected Set([ 1, 2, 3 ]) to have size 2'
      );
    });

    describe('with the not flag', () => {
      it('should succeed', () => {
        expect(new Set([1, 2, 3]), 'not to have size', 2);
      });

      it('should fail', () => {
        expect(
          () => {
            expect(new Set([1, 2, 3]), 'not to have size', 3);
          },
          'to throw',
          'expected Set([ 1, 2, 3 ]) not to have size 3'
        );
      });
    });
  });

  describe('to be empty assertion', () => {
    it('should succeed', () => {
      expect(new Set(), 'to be empty');
    });

    it('should fail', () => {
      expect(
        () => {
          expect(new Set([1, 2, 3]), 'to be empty');
        },
        'to throw',
        'expected Set([ 1, 2, 3 ]) to be empty'
      );
    });

    describe('with the not flag', () => {
      it('should succeed', () => {
        expect(new Set([1, 2, 3]), 'not to be empty');
      });

      it('should fail', () => {
        expect(
          () => {
            expect(new Set(), 'not to be empty');
          },
          'to throw',
          'expected Set([]) not to be empty'
        );
      });
    });
  });
});
