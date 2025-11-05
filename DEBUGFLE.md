# Debug Log

Record every issue, its cause, and resolution for traceability.

| Date | Environment | Module | Description | Root Cause | Fix | Status |
|------|--------------|---------|-------------|-------------|------|---------|
| 2025-11-04 | local | payment | Adyen redirect loop | wrong returnUrl param | corrected path in config | ✅ |
| 2025-11-05 | staging | delivery | Wolt webhook 401 | expired API token | regenerate + update env | ✅ |

---

## Debugging Guidelines
1. Reproduce bug with detailed steps.
2. Add entry above immediately.
3. Commit fix on `debug/issue-#`.
4. Reference issue in PR description.
5. Close entry once verified in staging.