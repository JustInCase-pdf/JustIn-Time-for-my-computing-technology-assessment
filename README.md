# Central Box - School Canteen Ordering
Justin Huynh's Computing Technology Assessment

## How to:
**The sign in logic works as follows:**
- For a Student, the domain (email suffix) should be "@education.nsw.gov.au"
- For a Teacher, the domain (email suffix) should be "@det.nsw.edu.au"
- For a staff member, the domain (email suffix) should be "@centralbox.com"
- **These email prefixes are PRE-REGISTERED. Thus, using the password "CVHS" to login.**
- For a parent, every other domain (email suffix) will work. However, they will have to sign up beforehand.

Additionally, depending on what version of the site the user is on, some features are added or removed.
## Key Functional Differences:
**Student Version**
- **Identity:** Focuses on the Year Group (7–12) for order distribution.
- **Pricing:** Standard menu pricing ($1.00 multiplier).
- **Navigation:** Standard grid access to Menu, Orders, Profile, and Settings.

**Teacher Version**
- **Identity:** Swaps Year Groups for Faculties (Math, Science, English, etc.).
- **Pricing:** Automatically applies a 20% discount across the entire menu.
- **Syncing:** Saves faculty and preferred pickup times to the cloud (Local Storage) for faster checkout.

**Staff Version**
- **The Dashboard:** The only version with the Statistics card enabled. This provides a high-level view of daily revenue and active order counts.
- **Pricing:** Also receives the 20% discount.
- **Identity:** Since Staff don't belong to a faculty or year group, this section is hidden in their profile to keep it clean.

**Parent Version**
- **Custom UI:** The standard "Order" grid is replaced with a Parental Dashboard.
- **Control:** Includes a Spending Limit slider (range $5–$50) and a Tracking view to monitor what their child is buying.
- **Restrictions:** Parents cannot place orders for themselves; their account is strictly for oversight and account management.

**Global Features (All Versions)**
- **Theme Persistence:** Dark Mode preference is saved to the account and restores upon login.
- **Smart Checkout:** The checkout placeholder automatically syncs with the "Default Pickup" set in the user's settings.
- **Monday Logic:** The system automatically shifts pickup times (10:20/1:10) if the user's device detects it is currently Monday.
