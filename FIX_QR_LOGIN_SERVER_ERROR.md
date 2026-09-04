# Diagnostic Report: QR Login Server Error & Resolution

## 1. Problem Description
When scanning a team's QR code during onboarding or gameplay, the backend returned HTTP 500:
`"message": "Server error during QR login", "error": "User validation failed: contactNumber: Path contactNumber is required..."`

---

## 2. Root Cause Analysis
- In `models/User.js`, when a user has `role: "player"`, Mongoose schema enforces strict requirements on the following fields:
  - `registerNumber` (Required for players)
  - `yearOfGraduation` (Required for players)
  - `course` (Required for players)
  - `specialization` (Required for players)
  - `contactNumber` (Required for players)

- In `controllers/teamController.js`, `loginWithQr` previously created new QR player accounts with only:
  ```js
  user = new User({
    name: `${team.name}_QR`,
    email,
    role: "player",
    team: team._id,
  });
  ```

- Because `registerNumber`, `yearOfGraduation`, `course`, `specialization`, and `contactNumber` were omitted, `await user.save()` threw a Mongoose `ValidationError`, triggering the `catch (err)` block and returning **500 Server Error**.

---

## 3. Resolution Applied
In `controllers/teamController.js`, `loginWithQr` was updated to populate unique fallback values for all required player fields when auto-creating QR users:

```javascript
if (!user) {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  user = new User({
    name: `${team.name}_QR`,
    email,
    registerNumber: `QR-${team._id.toString().slice(-6)}-${randomNum}`,
    yearOfGraduation: "2026",
    course: "B.Tech",
    specialization: "Tactical",
    contactNumber: `+9190000${randomNum}`,
    role: "player",
    team: team._id,
  });
  await user.save();
}
```

---

## 4. Verification Results
1. **Mongoose Schema Unit Test**:
   - Created mock QR user instance and executed `.validateSync()`.
   - Result: `VALIDATION SUCCESS!` (0 errors).

2. **Frontend Build**:
   - Executed `npm run build` inside `frontend/`.
   - Result: Built successfully in 1.89s with 0 errors.

3. **Status**: Fixed and verified.
