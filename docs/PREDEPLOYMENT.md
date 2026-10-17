# Pre-deployment status

The app remains local. Publish the hosted app last.

## Verified locally

- Live AI requires a separate invite code. Missing/wrong codes do not call the provider.
- Graph exploration and walkthrough remain public and do not require a provider key.
- Hour/day/lifetime operation reservations use SQLite transactions; concurrent callers share the cap.
- Failed provider operations consume a reservation. Unavailable usage storage blocks AI.
- Provider request size and completion tokens are bounded.
- Configured secret values were absent from tracked files and the production frontend build.
- Git ignores .env and the .data ledger directory. Docker excludes both from the image context.
- Compose uses a separate persistent usage-data volume.
- Local invite code generated in ignored .env; never copy it into public docs or video.
- 31 automated tests pass; no live model calls were used for protection tests.

## Still required before public access

- Select hosting and verify a persistent AI_USAGE_DB path. Use one app instance for this SQLite setup.
- Configure provider key and a separate random invite code in server secrets.
- Verify HTTPS and secure cookies. Send the invite code only over HTTPS.
- Configure provider-side spend controls. Application operation limits are not a guaranteed dollar cap.
- Verify limits survive a host restart/replacement, not only a local ledger reopen.
- Finish browser mobile/keyboard/failure checks. Browser automation was blocked by the local tab URL policy during this pass; no visual test is claimed.
- Complete the participant technical review and confirm registration.
- Review the blog and source. Record the final video after the public URL works.

## Deployment order

1. Prepare host configuration while live AI is disabled (AI_ACCESS_CODE unset).
2. Verify graph workflow and HTTPS on the public URL.
3. Mount persistent usage storage and verify restart behaviour.
4. Set the server-only invite and provider key; verify missing/wrong code refusal.
5. Perform one bounded live AI request, then clear the invite from the browser.
6. Record the demo, add public links, and submit Company Brain before the deadline.

A shared invite protects paid AI access. It does not provide employee identity, individual roles, or production HR security.
