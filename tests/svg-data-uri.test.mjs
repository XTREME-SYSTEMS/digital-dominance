import test from 'node:test';
import assert from 'node:assert/strict';
import { svgToDataUri } from '../src/components/ui/svgDataUri.js';

test('SVG fallbacks support Unicode category review copy without btoa crashes', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>Category failed — do not substitute 🖼️</text></svg>';
  const uri = svgToDataUri(svg);
  assert.match(uri, /^data:image\/svg\+xml;charset=utf-8,/);
  assert.equal(decodeURIComponent(uri.split(',').slice(1).join(',')), svg);
});

test('rejects non-SVG input instead of forming an arbitrary image data URI', () => {
  assert.throws(() => svgToDataUri('<script>alert(1)</script>'), /SVG_REQUIRED/);
  assert.throws(() => svgToDataUri(null), /SVG_REQUIRED/);
});
