[![Tests](https://github.com/chkt/states/workflows/tests/badge.svg)](https://github.com/chkt/states/actions)
[![Version](https://img.shields.io/npm/v/@chkt/states)](https://www.npmjs.com/package/@chkt/states)
![Node](https://img.shields.io/node/v/@chkt/states)
![Dependencies](https://img.shields.io/librariesio/release/npm/@chkt/states)
![Licence](https://img.shields.io/npm/l/@chkt/states)
![Language](https://img.shields.io/github/languages/top/chkt/states)
![Size](https://img.shields.io/bundlephobia/min/@chkt/states)

# States

## Install
```sh
npm install @chkt/states
```

## Use

**states** is a minimalistic state machine consisting of declared and undeclared states, written in typescript.
Each named state consists of a `transform` function and a list of one or more target states.

When transitioning from one state to the next, the `transform` function of the current state is run.
Its return value will determine the next target state.

Undeclared states represent states without any `targets` to transition into.

```typescript
import * as assert from 'assert';
import * as states from '@chkt/states';

const map = states.create({
    state : {
        transform : (context, next) => Promise.resolve(next.default(context)),
        targets : [{ id : 'undeclared_state' }]
    }
});

const contextToState = states.bindContextToState(map, 'state');
const end = contextToState({ foo : 'bar' });

assert.deepStrictEqual(end, {
    id : 'unnamed_state',
    context : { foo : 'bar' }
});
```
