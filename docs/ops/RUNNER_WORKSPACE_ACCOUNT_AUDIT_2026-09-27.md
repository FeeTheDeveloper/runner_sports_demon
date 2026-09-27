# Runner Workspace account audit — repo@werunsportsandanalytics.com — September 27, 2026

Source: owner-supplied Google Admin console screenshot (`admin.google.com/ac/users/...`), captured 2026-09-27 08:21 local, plus read-only metadata from the connected CEO mailbox. No Workspace setting was changed and no password, activation URL or mailbox body was read into repository records.

## Confirmed from the screenshot

| Field | Observed value |
| --- | --- |
| Display name | Repo Boss |
| Primary address | `repo@werunsportsandanalytics.com` |
| Account status | Active |
| Last sign-in | 8 minutes before capture — the account has completed an interactive sign-in |
| Created | Sep 26, 2026 |
| Organizational unit | Runner Sports & Analytics LLC |
| Google services | 83 of 83 available services ON |
| Other cloud apps | None added at the organization level |
| VPP apps | 0 consumed |
| Managed devices | Organization has no mobile device management configured |
| Profile completeness | Incomplete — Google prompts for a secondary email address and phone number |

The console path segment `2bn6wsx2icj91v` appears in the captured URL. It is recorded as a provisional console identifier only. It is not a provider-verified immutable subject ID and must not be used as an identity binding.

## Admin status — NOT established by this screenshot

The **Admin roles and privileges** card is not visible in the capture, so no admin role for Repo Boss is confirmed or denied here. The only setting row above "User information" is cropped to its value: `Inherited from "Runner Sports & Analytics LLC"` / `OFF`. The section heading is cut off, so that OFF value cannot be attributed to a named setting and is not read as an admin-role indicator.

Treat admin status as **UNVERIFIED**. To resolve it, capture the user's *Admin roles and privileges* card, or the Account > Admin roles list.

Separately, the account viewing this page (avatar "R", "Work" profile) is operating the Admin console on this user, which implies a privileged viewing session. That is a property of the viewer, not of Repo Boss.

## Also not visible in this capture

2-Step Verification enrollment, security keys, app passwords, recovery email/phone, group memberships, license/SKU assignment, active sessions and OAuth app grants, and email delegation. None of these can be reported from this image.

## Mailbox corroboration (read-only, metadata only)

Four `workspace-noreply@google.com` new-account notifications reached `ceo@feethedeveloper.com`:

- 2026-09-26 16:37:53 and 16:37:56 Central — message references `1a0dfa73adc5f741`, `1a0dfa74549736a9` (already recorded in `RUNNER_REPRESENTATIVES_2026-09-26.md`).
- 2026-09-26 21:49:59 and 21:50:01 Central — message references `1a0e0c4f73c9513a`, `1a0e0c4fc4b6651b` (new since that record).

All four were retrieved in metadata-only form; bodies were deliberately not opened, because these notifications can carry temporary credentials. Consequently **no message is attributable to the Repo Boss account**. The count confirms at least four Runner-domain accounts were provisioned on Sep 26; it does not identify them.

## Findings and recommended hardening

1. **Admin role unknown.** Confirm whether Repo Boss holds Super Admin or any delegated admin role before it is used for automation. An account named for repository operations should not hold Super Admin.
2. **83/83 services ON.** The full Google service surface is enabled for this user. Least privilege suggests turning off services the Runner OU does not use.
3. **No recovery information.** No secondary email or phone is set, so self-service recovery and out-of-band verification are unavailable.
4. **2SV unverified.** The account is Active and signing in with no evidence of 2-Step Verification. Confirm and enforce it for the OU.
5. **Credential hygiene.** The Sep 26 provisioning wave issued temporary passwords. Apply the same reset requirement already recorded for `AGT-RSA-REP-001` and `AGT-RSA-REP-002` to this account.
6. **No device management.** Sessions from unmanaged devices cannot be posture-checked or remotely wiped.
7. **Left-rail action styling.** In the capture, `RESET PASSWORD`, `UPDATE USER`, `ADD ALTERNATE EMAILS`, `SUSPEND USER`, `DELETE USER` and `CHANGE ORGANIZATIONAL UNIT` render dimmed while `EMAIL` and `RESTORE DATA` render active. This may be a rendering artifact, or it may indicate the viewing admin lacks those privileges. Worth one confirmation pass; it is not treated as a finding until reproduced.

## Boundary

No Workspace user was created, modified, suspended or deleted by this session. No password was reset, no role was granted, no service was toggled, and no email was sent. Claude has no Admin SDK access in this session; all Workspace changes above are owner actions in the Admin console.
