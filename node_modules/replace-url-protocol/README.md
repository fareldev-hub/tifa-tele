# README.md

    helper for avoid node.js can't update protocol for some url

see https://github.com/nodejs/node/issues/39732

## install

```bash
yarn add replace-url-protocol
yarn-tool replace set-url-protocol
yt add replace-url-protocol
```

```typescript
import { replaceURLProtocol, replaceProtocol } from 'replace-url-protocol';

describe('node.js#39732', () =>
{

	test(`git+https:`, () =>
	{
		let u = new URL( 'git+https://url-fake-hostname/zh-TW/scripts')
		let expected = 'https:';
		replaceURLProtocol(u, expected);
		expect(u).toHaveProperty('protocol', expected);
	});

	test(`fake:`, () =>
	{
		let u = new URL( 'fake://url-fake-hostname/zh-TW/scripts')
		let expected = 'https:';
		replaceURLProtocol(u, expected);
		expect(u).toHaveProperty('protocol', expected);
	});

	test(`fake+http:`, () =>
	{
		let u = new URL( 'fake+http://url-fake-hostname/zh-TW/scripts')
		let expected = 'https:';
		replaceURLProtocol(u, expected);
		expect(u).toHaveProperty('protocol', expected);
	});

})
```
