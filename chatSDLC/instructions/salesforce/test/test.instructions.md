# 🧪 Instruction: Generate Generic Test Cases in Table (Convert to Escaped CSV on Attach)

## 🎯 Goal

As a **Salesforce tester or UAT user**, generate a complete set of test cases for any given requirement. The test cases should be:

- Displayed in **markdown table** format in the chat.
- When the user says **"attach"**, the same test cases must be converted into **CSV format**, escaping commas and quotes properly.

---

## ✅ Output Format (Markdown Table)

Use this format to show test cases initially:

| Sl No | Test Scenario                             | Pre-Requisite                                     | Test Data                                                  | Test Step                                                                                                                                  | Step Name               | Expected Result                                            | Actual Result                                              | Test Result |
|-------|-------------------------------------------|--------------------------------------------------|-------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|--------------------------|-------------------------------------------------------------|-------------------------------------------------------------|-------------|
| 1     | Create record with valid input            | User logged in with correct permissions          | `{"firstName":"John","lastName":"Doe"}`                     | 1. Login to Salesforce<br>2. Navigate to record page<br>3. Fill all mandatory fields<br>4. Click Save                                     | Valid Record Creation   | Record is created successfully                             | Record is created successfully                             | PASS        |
| 2     | Submit form with missing required field   | User logged in and on form screen                | `{"firstName":""}`                                          | 1. Enter only first name<br>2. Leave required field blank<br>3. Click Submit                          | Missing Field Check      | Error shown: "Last Name is required"                        | Error shown: "Last Name is required"                        | PASS        |
| 3     | Invalid email format                      | User logged in                                   | `{"email":"abc.com"}`                                       | 1. Enter invalid email format<br>2. Click Save              | Email Format Validation  | Error: "Invalid email address"                             | Error: "Invalid email address"                             | PASS        |
| 4     | Create duplicate record                   | A similar record already exists                  | `{"email":"john.doe@test.com"}`                              | 1. Fill form with duplicate email<br>2. Submit              | Duplicate Check          | Error: "Record already exists"                             | Error: "Record already exists"                             | PASS        |
| 5     | Transformation from Lead to Opportunity   | Lead exists and is eligible for conversion       | `{"leadId":"00Q1x000002ABC"}`                               | 1. Open Lead<br>2. Click Convert<br>3. Complete conversion | Lead Conversion          | Opportunity is created with Contact                        | Opportunity created without Contact                        | FAIL        |

---

## 📥 When User Says: "Attach"

Convert the markdown table into **valid CSV format**.

### ✅ CSV Formatting Rules

- Use **comma-separated values** for fields.
- **Escape all commas and quotes properly**:
  - If a field contains a comma, **wrap it in double quotes**.
  - If a field contains quotes, **double the quotes** and wrap the whole value in double quotes.
- Replace `<br>` in steps with `\n`.

### 📌 Example CSV Output

```csv
Sl No,Test Scenario,Pre-Requisite,Test Data,Test Step,Step Name,Expected Result,Actual Result,Test Result
1,"Create record with valid input","User logged in with correct permissions","{""firstName"":""John"",""lastName"":""Doe""}","1. Login to Salesforce\n2. Navigate to record page\n3. Fill all mandatory fields\n4. Click Save","Valid Record Creation","Record is created successfully","Record is created successfully",PASS
2,"Submit form with missing required field","User logged in and on form screen","{""firstName"":""""}","1. Enter only first name\n2. Leave required field blank\n3. Click Submit","Missing Field Check","Error shown: ""Last Name is required""","Error shown: ""Last Name is required""",PASS
```

---

## 🧪 Test Types to Cover

- ✅ Positive tests
- ❌ Negative tests
- 🔁 Duplicate checks
- 🔒 Required fields and validation rules
- 🧾 Format validations (e.g., email, phone)
- 🔄 Record transformations (e.g., Lead → Opportunity)
- 🚫 Access or permission edge cases
- 🧱 Boundary conditions (empty input, long values, etc.)

---

## 📌 Final Note

Use markdown table format for visual clarity in chat. Only use CSV format when the user says "attach", and ensure **all values are escaped correctly for commas and quotes**.
