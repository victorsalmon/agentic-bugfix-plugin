# Security policy

## Supported versions

Security fixes are applied to the current `main` branch and the latest
published release. Older releases should be upgraded before requesting a
backport.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability. Use the
repository host's private security-advisory channel or contact the maintainer
privately through the project profile. Include reproduction steps, affected
versions, impact, and any suggested mitigation. Do not include live
credentials, tokens, hostnames, or customer data.

You can expect an acknowledgement within five business days. The maintainer
will validate the report, coordinate a fix and disclosure timeline, and credit
the reporter unless anonymity is requested.

## Scope

Reports are especially useful for:

- skill wording that instructs an agent to exfiltrate credentials or run
  unsafe commands;
- validator or scanner scripts with command-injection or path-traversal flaws;
- committed secrets, private hostnames, or internal fleet references in
  skills, docs, or examples.

Contributions must stay portable: no hardcoded absolute paths, no
environment-specific references, and no real secrets. Run
`npm run check && npm run validate` before submitting.
