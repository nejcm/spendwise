# Spendwise

Spendwise is a personal finance context for tracking money across calendar periods.

## Language

**Period**:
A calendar window used to summarize finance data.
_Avoid_: Range, filter

**Today**:
A dynamic **Period** representing the current local calendar day.
_Avoid_: Fixed day, selected date

**Day**:
A fixed **Period** representing one selected local calendar day.
_Avoid_: Today, custom range

**Custom Period**:
A fixed **Period** with a selected start date and end date.
_Avoid_: Day

**Budget Limit**:
A stored spending cap used to compare spending against a **Period**.
_Avoid_: Budget amount, spending target

**Preferred Currency**:
The global display currency chosen in Settings; used to normalize stored transaction totals across the app.
_Avoid_: Default currency, base currency

**View Currency**:
An ephemeral, screen-local currency for account summary display; may differ from **Preferred Currency** and uses the latest exchange rates when it does.
_Avoid_: Display currency, selected currency

## Relationships

- **Today** represents exactly one current local calendar **Day**
- Navigating from **Today** produces a fixed **Day**
- A **Custom Period** may span one or more **Days**, but it remains a **Custom Period**
- A **Budget Limit** can be prorated to a selected **Period**, including a fixed **Day**

## Example Dialogue

> **Dev:** "When the user moves back from **Today**, should it still be **Today**?"
> **Domain expert:** "No, navigating from **Today** lands on a fixed **Day**, such as yesterday."
>
> **Dev:** "When a user views one **Day**, should the monthly **Budget Limit** stay monthly?"
> **Domain expert:** "No, compare that **Day** against a prorated daily **Budget Limit**."

## Flagged Ambiguities

- "today value" was used to mean both dynamic **Today** and a fixed **Day**; resolved: **Today** stays dynamic, while navigation produces **Day**.
