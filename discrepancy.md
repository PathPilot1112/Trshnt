# Location & Clue Data Discrepancies Audit Report

## Overview
This document logs all identified data discrepancies, missing GPS coordinates, naming inconsistencies, and structural mismatches across `clue.json`, `ROute.json`, `Test Routes.pdf`, and the provided Zone coordinates table.

---

## 1. Missing Coordinates Audit (7 Locations)

The provided Zone coordinate inventory is missing explicit GPS coordinates for 7 locations. All fallback coordinates have been completely removed, and these 7 locations are strictly accepted on the basis of **ML response only** (GPS geofence check is bypassed for these targets even when coordinate mapping is enabled):

| Zone | Location Name | Prompt Coordinate Status | GPS Fallback Status | Verification Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Zone 1** | **Perignar Anna** | ❌ Missing | 🚫 Removed (None) | ML Response Only |
| **Zone 1** | **Periyar** | ❌ Missing | 🚫 Removed (None) | ML Response Only |
| **Zone 2** | **Sports Complex** | ❌ Missing | 🚫 Removed (None) | ML Response Only |
| **Zone 3** | **Aaruush Logo (TP)** | ❌ Missing | 🚫 Removed (None) | ML Response Only |
| **Zone 3** | **#SRM (TP)** | ❌ Missing | 🚫 Removed (None) | ML Response Only |
| **Zone 4** | **Pickleball Court** | ❌ Missing | 🚫 Removed (None) | ML Response Only |
| **Zone 5** | **Architecture #SRM** | ❌ Missing | 🚫 Removed (None) | ML Response Only |

---

## 2. Naming & Spelling Inconsistencies

Different sources refer to identical physical campus locations using varying strings:

| Provided Prompt Name | Test Routes PDF | `clue.json` Title | Target Label | Discrepancy Severity |
| :--- | :--- | :--- | :--- | :--- |
| **Genz** | Genz Cafe | GENZ CAFÉ | `Zone 1 - GEN Z` | Minor (Normalized string fuzzy matcher handles this) |
| **Perignar Anna** | PERARIGNAR ANNA | PERIGNAR ANNA | `Zone 1 - Perignar Anna` | Medium (Spelling variant: Perarignar vs Perignar) |
| **Bell Block** | BEL BLOCK | BELL BLOCK | `Zone 5 - Bell Block` | Minor (Single 'L' vs double 'L') |
| **Architecture Stonehenge** | STONE HENGE | ARCHITECTURE STONEHENGE | `Zone 5 - Architecture Stonehenge` | Medium (Omission of 'Architecture' prefix) |
| **Architecture #SRM** | #SRM ARCHITECTURE BLOCK | ARCHITECTURE #SRM | `Zone 5 - Architecture #SRM` | Medium (Word order inversion) |
| **Slice of Life (Medical)** | SLICE OF LIFE | SLICE OF LIFE | `Zone 4 - Slice of Life` | Minor (Parenthetical note in prompt) |
| **Noon Meal Scheme(M BLOCK)** | NOON MEAL SCHEME | NOON MEAL SCHEME (M BLOCK) | `Zone 3 - Noon Meal Scheme` | Minor (Bracket formatting) |

---

## 3. Route Structure Discrepancies

- **`Test Routes.pdf` Structure**:
  - Consists of **5 distinct routes**, where each route is strictly grouped inside a single Zone:
    - Route 1: 6 locations in Zone 1
    - Route 2: 4 locations in Zone 2
    - Route 3: 5 locations in Zone 3
    - Route 4: 5 locations in Zone 4
    - Route 5: 5 locations in Zone 5
- **Standard `ROute.json` Structure**:
  - Consists of **7 cross-campus routes**, mixing locations across multiple zones into 5-stop paths starting/ending at TP Stairs.

### Resolution Applied in Codebase:
- Robust fuzzy normalization (`cleanStr`) cleans all non-alphanumeric characters, strips `zone \d+` prefixes, and uses alias mapping dictionary in `cluePath.js` (`srmtp`, `architecturesrm`, `bellblock`, `perignaranna`).
- `testRoutes.json` has been created specifically for Test Dev Mode to accurately map the PDF routes.
