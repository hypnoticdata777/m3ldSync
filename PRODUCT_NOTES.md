# MeldSync Product Notes

## Portfolio Story

MeldSync is a reconciliation layer for recurring maintenance exports. It shows that an operations workflow can preserve human judgment across repeated system snapshots instead of forcing the same manual review cycle every week.

## Why It Matters

Property management exports are usually point-in-time reports. They are useful for seeing what the source system says today, but weak at answering:

- What changed since the last export?
- What disappeared from the current report?
- Which records did a human already verify?
- Which status labels are known to be misleading?
- Which properties are accumulating unresolved work?

MeldSync turns recurring exports into an operational memory.

## Demo Positioning

The public demo should show:

- CSV import
- Automatic diff summary
- Kanban status board
- Property-level triage
- Sticky manual status overrides
- Notes that survive future imports
- Per-record history

The public demo should not show:

- Real tenant data
- Real property names
- Real unit identifiers
- Real vendor notes
- Real import files

## Design Direction

The interface should feel:

- Calm
- Operational
- Fast to scan
- Trustworthy
- Practical

Recommended palette:

- Background: warm off-white / light gray
- Text: near-black slate
- Open/pending: blue, amber, teal
- Completed: green
- Canceled: neutral gray
- Emergency/high: red or rust accents

Avoid:

- Purple-heavy palettes
- Decorative gradients
- Marketing-style hero layouts
- Oversized empty cards
- Visual clutter

