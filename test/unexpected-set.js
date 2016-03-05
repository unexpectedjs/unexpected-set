/*global describe, it, Set*/
require('es6-set/implement');

var expect = require('unexpected').clone().use(require('../lib/unexpected-set'));

expect.addAssertion('<any> to inspect as <string>', function (expect, subject, value) {
    expect(expect.inspect(subject).toString(), 'to equal', value);
});

expect.addAssertion('<array> to produce a diff of <string>', function (expect, subject, value) {
    expect.errorMode = 'bubble';
    expect(expect.diff(
        subject[0],
        subject[1]
    ).diff.toString(), 'to equal', value);
});

describe('unexpected-set', function () {
    describe('Set type', function () {
        it('should inspect a Set instance correctly', function () {
            expect(new Set([1, 2]), 'to inspect as', 'Set([ 1, 2 ])');
        });

        it('should diff two Set instances correctly', function () {
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
    });

    describe('to contain assertion', function () {
        it('should succeed', function () {
            expect(new Set([1, 2, 3]), 'to contain', 3);
        });

        it('should fail with a diff', function () {
            expect(function () {
                expect(new Set([1, 2, 3]), 'to contain', 4);
            }, 'to throw',
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

        describe('with the not flag', function () {
            it('should succeed', function () {
                expect(new Set([1, 2, 3]), 'not to contain', 4);
            });

            it('should fail with a diff', function () {
                expect(function () {
                    expect(new Set([1, 2, 3]), 'not to contain', 2);
                }, 'to throw',
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

    describe('with set semantics assertion', function () {
        it('should succeed', function () {
            expect([1, 2, 3], 'with set semantics to satisfy', [3, 1, 2]);
        });

        it('should fail with a diff', function () {
            expect(function () {
                expect([1, 2, 3], 'with set semantics to satisfy', [1, 2, 4]);
            }, 'to throw',
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

    describe('to have items satisfying assertion', function () {
        it('should succeed', function () {
            expect(new Set([1, 2, 3]), 'to have items satisfying to be a number');
        });

        it('should fail with a diff', function () {
            expect(function () {
                expect(new Set([1, 2, 'foo']), 'to have items satisfying to be a number');
            }, 'to throw',
                "expected Set([ 1, 2, 'foo' ]) to have items satisfying to be a number\n" +
                "\n" +
                "Set([\n" +
                "  1,\n" +
                "  2,\n" +
                "  'foo' // should be a number\n" +
                "])"
            );
        });

        it('should fail for the empty set', function () {
            expect(function () {
                expect(new Set([]), 'to have items satisfying to be a number');
            }, 'to throw');
        });
    });

    describe('to satisfy assertion', function () {
        describe('with a Set instance', function () {
            describe('against another Set instance', function () {
                it('should succeed', function () {
                    expect(new Set([1, 2]), 'to satisfy', new Set([2, 1]));
                });

                it('should fail with a diff', function () {
                    expect(function () {
                        expect(new Set([1, 2]), 'to satisfy', new Set([3]));
                    }, 'to throw',
                        'expected Set([ 1, 2 ]) to satisfy Set([ 3 ])\n' +
                        '\n' +
                        'Set([\n' +
                        '  1,\n' +
                        '  2\n' +
                        '  // missing 3\n' +
                        '])'
                    );
                });

                it('should accept extraneous items', function () {
                    expect(new Set([1, 2]), 'to satisfy', [1]);
                });

                describe('with the exhaustively flag', function () {
                    it('should succeed', function () {
                        expect(new Set([1, 2]), 'to exhaustively satisfy', [1, 2]);
                    });

                    it('should not accept extraneous items', function () {
                        expect(function () {
                            expect(new Set([1, 2]), 'to exhaustively satisfy', [1]);
                        }, 'to throw',
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

            it('should point out missing items', function () {
                expect(function () {
                    expect(new Set([1]), 'to satisfy', [1, 2]);
                }, 'to throw',
                    'expected Set([ 1 ]) to satisfy [ 1, 2 ]\n' +
                    '\n' +
                    'Set([\n' +
                    '  1\n' +
                    '  // missing 2\n' +
                    '])'
                );
            });

            it('should point out items that were supposed to satisfy an expect.it', function () {
                expect(function () {
                    expect(new Set([1]), 'to satisfy', [1, expect.it('to equal', 2)]);
                }, 'to throw',
                    "expected Set([ 1 ]) to satisfy [ 1, expect.it('to equal', 2) ]\n" +
                    "\n" +
                    "Set([\n" +
                    "  1\n" +
                    "  // missing: should equal 2\n" +
                    "])"
                );
            });
        });
    });
});
