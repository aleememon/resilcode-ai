# Benchmark results

Run on 2026-11-10 with Semgrep 1.100.0 and 34 custom rules.

## Core benchmark

| Metric | Result |
|---|---|
| Vulnerable files fully detected | 46 of 46 (100.0%) |
| Planted problems found | 69 of 69 |
| Safe files wrongly flagged | 0 of 26 (0.0%) |
| Precision | 100.0% |

## Including known limitations

| Metric | Result |
|---|---|
| Vulnerable files detected | 46 of 52 (88.5%) |
| Safe files wrongly flagged | 7 of 33 (21.2%) |

## Per rule

| Rule | Planted | Caught | False alarms |
|---|---|---|---|
| sql-injection | 3 | 3 | 0 |
| command-injection | 2 | 2 | 0 |
| code-injection-eval | 2 | 2 | 0 |
| py-sql-injection | 4 | 4 | 0 |
| py-command-injection | 2 | 2 | 0 |
| py-code-injection-eval | 2 | 2 | 0 |
| py-unsafe-deserialization | 1 | 1 | 0 |
| py-insecure-yaml-load | 1 | 1 | 0 |
| py-hardcoded-secret-assignment | 4 | 4 | 0 |
| py-hardcoded-jwt-secret | 1 | 1 | 0 |
| py-jwt-verification-disabled | 1 | 1 | 0 |
| py-weak-hash-algorithm | 2 | 2 | 0 |
| py-weak-cipher-algorithm | 2 | 2 | 0 |
| py-insecure-random-token | 1 | 1 | 0 |
| py-debug-enabled | 2 | 2 | 0 |
| py-tls-verification-disabled | 3 | 3 | 0 |
| py-cors-allows-any-origin | 2 | 2 | 0 |
| py-insecure-cookie-flags | 3 | 3 | 0 |
| py-ssti-render-template-string | 1 | 1 | 0 |
| py-xss-unescaped-response | 2 | 2 | 0 |
| hardcoded-secret-assignment | 3 | 3 | 0 |
| hardcoded-secret-known-format | 2 | 2 | 0 |
| hardcoded-secret-envfile | 2 | 2 | 0 |
| hardcoded-jwt-secret | 1 | 1 | 0 |
| weak-hash-algorithm | 2 | 2 | 0 |
| weak-cipher-algorithm | 2 | 2 | 0 |
| insecure-random-token | 1 | 1 | 0 |
| react-dangerously-set-inner-html | 2 | 2 | 0 |
| dom-xss-url-to-html | 3 | 3 | 0 |
| reflected-xss-express | 1 | 1 | 0 |
| cors-allows-any-origin | 3 | 3 | 0 |
| insecure-cookie-flags | 3 | 3 | 0 |
| tls-verification-disabled | 2 | 2 | 0 |
| compose-privileged-container | 1 | 1 | 0 |

## Known limitations

| Type | File | Rule | Why |
|---|---|---|---|
| False positive | etag_md5.js | weak-hash-algorithm | MD5 used as a cache ETag, not for security |
| False positive | trusted_html.jsx | react-dangerously-set-inner-html | HTML was sanitized elsewhere; Semgrep cannot see it |
| False positive | object_send.js | reflected-xss-express | res.send(object) returns JSON, but taint still flags it |
| False positive | regex_exec.js | reflected-xss-express | taint follows input through a regex match that only keeps digits |
| False negative | cmdi_wrapper_miss.js | command-injection | input reaches exec() through a helper function (no cross-function tracking) |
| False negative | sqli_koa_miss.js | sql-injection | sources only cover Express-style req.*, not Koa ctx.query |
| False negative | secret_dbpass_miss.js | hardcoded-secret-assignment | variable name dbPass has no keyword the rule recognises |
| False positive | py_debug_dev_settings.py | py-debug-enabled | DEBUG = True in a development-only settings file |
| False positive | py_etag_md5.py | py-weak-hash-algorithm | MD5 used as a cache ETag without usedforsecurity=False |
| False positive | py_session_theme.py | py-insecure-random-token | variable name contains 'session', so it is assumed to be a secret |
| False negative | py_sqli_wrapper_miss.py | py-sql-injection | input reaches execute() through a helper function (no cross-function tracking) |
| False negative | py_sqli_fastapi_miss.py | py-sql-injection | FastAPI passes input as function parameters, which are not recognised as sources |
| False negative | py_secret_dbpass_miss.py | py-hardcoded-secret-assignment | variable name db_pass has no keyword the rule recognises |
