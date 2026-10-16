# Quality cases
PASS is possible only with complete, fresh, source-attributed proofs. Test with the existing test runner before enabling publish enforcement.
- Missing competitor evidence => UNKNOWN; 3 distinct dated observed competitors required.
- No licensed hero or evidence for any asset => UNKNOWN.
- Fabricated business facts or missing proof => UNKNOWN.
- Location-only thin city text without genuine service proof => UNKNOWN.
- Any build/security/a11y/form/noindex/rollback check missing => UNKNOWN.
- Placeholder quality score without source and timestamp => UNKNOWN.
- Measured visual parity below 0.99 or wrong reference ID => UNKNOWN.
- Incomplete blueprint => FAIL.
- All supplied independent evidence current and PASS => PASS but production permission still separately required.
- Assert helper throws on UNKNOWN and FAIL.
Known limitation: contract cannot itself verify that a screenshot or source is genuine. Independent validators must check artifact identity and freshness. Before production integration, add runtime schema validation for untrusted payloads and regression tests in existing pipeline.
