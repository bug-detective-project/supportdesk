# Code review: SD-263, only the official statuses and priorities are saved

Well done: this one is about where validation and data drift apart. Here is the reference approach, so you can compare it with yours.

## Why the bug happened

- Someone made the check friendlier (any capitalization) but forgot that the value is saved as it arrived. A validation that accepts a value must also define what gets stored.
- The API answered `200`, so the automation had no reason to notice anything was wrong.
- The damage shows up far from the cause: an empty select on the details page and missing rows in reports.

## Why the reference fix is right

- The API contract lists exact values, and other clients and reports depend on them. Rejecting other spellings keeps the contract and tells the caller what to fix.
- The fix is one line in the shared check, so status and priority are both covered.
- The regression test checks what was **saved**, which is what actually broke, and accepts either valid design (reject or normalize).

## Compare with your fix

- Did you normalize instead (save `Closed` for `closed`)? It is valid and friendlier, as long as you save the official value and not the input. Think about whether hiding the client's mistake is what you want.
- Did you also check the 38 tickets already saved with `closed`? A fix in the code does not repair existing data; in a real team you would plan a small data migration.

## Watch for next time

- Validate and convert in the same place, and save the converted value.
- When an API accepts something, test what it **stores**, not only the status code.
