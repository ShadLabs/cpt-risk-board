# CPT Risk Board

A live board for one outbound warehouse that shows whether each **CPT (critical pull time)** in the shift will be cleared at the current pack rate, how many units are at risk, and how many packers it would take to save them. When a CPT is cleared, the dock screen celebrates with confetti, a congratulations message and a fanfare.

**Live demo:** https://shadlabs.github.io/cpt-risk-board/
**Dock screen:** https://shadlabs.github.io/cpt-risk-board/dock.html
**Arabic version:** https://shadlabs.github.io/cpt-risk-board/?lang=ar

![Screenshot](docs/screenshot.png)

## The problem

On an outbound floor, a missed CPT means customer orders miss their promise date. The risk is usually spotted too late, when the truck is already at the dock and there's no time left to move people. Most teams check volume against the clock by hand and forget that every CPT has to wait for the volume of the CPTs before it.

I worked for almost two years as a Pack and Outbound Process Assistant. I built this board to show CPT risk early enough to act on it, and to give the team a moment to celebrate every CPT they clear.

## What it does

- Tracks **one facility** with a **Day shift** and a **Night shift**, each starting with **4 CPT times** that you can add to or remove
- For each CPT, you enter the **total units to clear**. **Packed so far counts up live** at packers × rate × actual pace, earliest CPT first, and a **Packing now** tag shows which CPT the line is working on. Type the real count from your system at any time to correct it.
- An **actual pace %** setting shows how risk builds when the line runs below plan, and a **demo speed** (10× or 60×) lets you watch a whole shift play out in minutes
- Opens with a **Shift at a glance** overview: a plain-language verdict, shift progress, a countdown to the next CPT, CPTs at risk, units at risk and packers needed
- Lists **top actions**, such as how many packers to add and by when, or when to escalate to transportation
- Shows a **live board** with a countdown, projected finish time and minutes of buffer for every CPT, updated every second
- Treats packing as a **shared line worked earliest-CPT-first**, so a large early CPT correctly pushes risk onto later ones, and accounts for **truck loading time**
- Includes a **dock screen** that opens in its own tab for a wall TV. Each CPT tile leads with **units remaining** and a countdown, then switches to a final **CPT cleared** or **CPT missed** result once the CPT time is up.
- **Celebrates every cleared CPT** with confetti, a congratulations message and a fanfare, plus a bigger celebration when the last CPT of the shift is cleared
- Works in **English and Arabic** with a full right-to-left layout, exports to **CSV**, and saves inputs in the browser

![Dock screen](docs/screenshot-dock.png)

## How the risk is calculated

| Step | Formula |
|---|---|
| Packed so far (live) | last entered count + packers × rate × pace × time worked, earliest CPT first; packing for a CPT stops at its pack deadline |
| Remaining units | total units to clear − packed so far |
| Line output | packers × rate per packer (UPH) × actual pace |
| Pack deadline | CPT time − load buffer |
| Projected finish | now + (remaining units for this CPT and all earlier CPTs ÷ line capacity) |
| Buffer | pack deadline − projected finish |
| Status (before CPT time) | All packed when every unit is packed · Miss risk if buffer < 0 · Watch if buffer < watch threshold · otherwise Safe |
| Result (once CPT time is up) | **CPT cleared** if every unit was packed, otherwise **CPT missed** with the units left behind |
| Units at risk | units that cannot be packed before the pack deadline at the current rate |
| Packers needed | the most packers any upcoming CPT needs to finish its own and all earlier volume before its pack deadline |

## Tech

Plain HTML, CSS, and JavaScript. No frameworks and no build step, hosted free on GitHub Pages.

## Project structure

```
cpt-risk-board/
├── index.html             # main board
├── dock.html              # dock screen (opens in a new tab)
├── css/
│   └── style.css          # styling, light and dark mode, dock screen, celebration
├── js/
│   ├── core.js            # shared state, shift and time logic, risk calculation
│   ├── app.js             # main board
│   ├── dock.js            # dock screen, live sync, sound control
│   ├── celebrate.js       # confetti, congratulations message, fanfare (no libraries)
│   └── i18n.js            # English and Arabic text
├── docs/                  # screenshots
├── LICENSE
└── README.md
```

## Run it

- **Online:** open the live demo link above, then click **Open dock screen**.
- **Locally:** download or clone the repo and open `index.html` in any browser.

**Using the dock screen:** open it on the TV's browser and tap **Enable sound** once, because browsers only play sound after a tap. Update "Packed so far" on the main board, or press **Mark cleared**, and the dock screen celebrates. The dock screen syncs with a main board open in the same browser.

The sample data is sized from the current time, so the demo always looks like a live shift. Click **Reset to sample** to refresh it.

**Demo tip:** set **Demo speed** to 60× and open the dock screen. Packed units climb about 53 per second and CPT 1 clears, with its celebration, in about two minutes. Lower **Actual pace** to 85% to show a CPT turning red, then add packers to bring it back.

## Data note

All volumes, rates, and times are **illustrative sample data**. They are not taken from any real site or employer system.

## Related project

[Labor Planning Calculator](https://shadlabs.github.io/labor-planning-calculator/): plans headcount per process path at the start of the shift. This board tracks whether the shift is meeting its departures as it runs.

## Ideas for next version

- Per-CPT pack rate for routes with different item mixes
- Units-packed history to show the real pace against plan
- Sound alert when a CPT turns red

---
Built by **Your Name** · [LinkedIn](https://www.linkedin.com/in/your-profile)
