import { describe, it, expect } from 'vitest';
import { parseAIJson } from '../ai/constants.js';

describe('parseAIJson', () => {
  it('parses valid JSON', () => {
    const result = parseAIJson<{ name: string }>('{"name": "test"}');
    expect(result).toEqual({ name: 'test' });
  });

  it('extracts JSON from surrounding text', () => {
    const input = 'Here is the result:\n```json\n{"score": 85}\n```';
    const result = parseAIJson<{ score: number }>(input);
    expect(result).toEqual({ score: 85 });
  });

  it('handles trailing commas', () => {
    const input = '{"a": 1, "b": 2, }';
    const result = parseAIJson<{ a: number; b: number }>(input);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('handles trailing commas in arrays', () => {
    const input = '{"items": [1, 2, 3, ]}';
    const result = parseAIJson<{ items: number[] }>(input);
    expect(result).toEqual({ items: [1, 2, 3] });
  });

  it('handles whitespace around JSON', () => {
    const input = '   \n  {"key": "value"}  \n  ';
    const result = parseAIJson<{ key: string }>(input);
    expect(result).toEqual({ key: 'value' });
  });

  it('throws on completely invalid input', () => {
    expect(() => parseAIJson('not json at all')).toThrow();
  });

  it('parses nested objects', () => {
    const input = '{"outer": {"inner": 42}}';
    const result = parseAIJson<{ outer: { inner: number } }>(input);
    expect(result.outer.inner).toBe(42);
  });

  it('strips markdown code fences', () => {
    const input = '```\n{"value": true}\n```';
    const result = parseAIJson<{ value: boolean }>(input);
    expect(result.value).toBe(true);
  });
});
