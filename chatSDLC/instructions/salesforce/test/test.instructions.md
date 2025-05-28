# 🧪 Instruction: Generate Comprehensive Test Cases in CSV Format (Salesforce Tester/UAT)

## 🎯 Goal

As a **Salesforce tester or UAT user**, you are responsible for verifying that all functional, validation, transformation, and error scenarios are covered. Generate **complete and exhaustive test cases** for a given requirement in the **CSV format** with the following structure:

```
Sl No,Test Scenario,Pre-Requisite,Test Data,Test Step,Step Name,Expected Result,Actual Result,Test Result
```

## 🧠 Generation Guidelines

1. Start with `Sl No = 1` and increment for each row.
2. Write **clear, business-oriented test scenarios** relevant to a UAT or Salesforce QA context.
3. Include test data as compact JSON.
4. Use `\n` to separate multiple steps in the `Test Step` field.
5. Use **realistic field names** such as `firstName`, `lastName`, `email`, `leadSource`, `recordTypeId`, `stageName`, etc.
6. **Pre-Requisite** should mention any Salesforce setup (e.g., login, permissions, test data).
7. `Test Result` should be `PASS` or `FAIL`. You may use `FAIL` to simulate actual failures.
8. Include:
   - ✅ Positive test cases
   - ❌ Negative test cases (e.g., missing fields, invalid data)
   - 🧪 Boundary/value edge cases
   - 🔁 Duplicate handling
   - 🔄 Transformation/record conversion (e.g., Lead → Opportunity)
   - 🔒 Validation rule enforcement
   - 🛠 Error messages and system behavior

## ✅ Example Output Format

```csv
Sl No,Test Scenario,Pre-Requisite,Test Data,Test Step,Step Name,Expected Result,Actual Result,Test Result
1,Create Lead using valid details,"User logged into Salesforce with Lead Create permission",{"firstName":"Jane","lastName":"Smith","leadSource":"Email"},"1. Login\n2. Navigate to Leads\n3. Fill mandatory fields\n4. Click Save","Valid Lead Creation","Lead record is created successfully with Lead Source = Email","Lead record is created successfully with Lead Source = Email",PASS
2,Attempt to create Lead with missing last name,"User logged in and at Lead create screen",{"firstName":"Jane"},"1. Enter First Name only\n2. Click Save","Missing Last Name","Error: Last Name is required","Error: Last Name is required",PASS
3,Verify invalid email format in Lead,"User logged in",{"email":"invalid_email.com"},"1. Enter invalid email\n2. Click Save","Email Validation","Error: Invalid email format","Error: Invalid email format",PASS
4,Prevent duplicate Lead creation,"Lead with same email exists",{"firstName":"Jane","lastName":"Smith","email":"jane.smith@test.com"},"1. Enter same lead data as existing\n2. Click Save","Duplicate Lead Prevention","Duplicate rule triggers: 'Lead already exists'","Duplicate rule triggers: 'Lead already exists'",PASS
5,Convert Lead to Opportunity,"Lead exists and conversion conditions met",{"leadId":"00Q5g00000ABCD1"},"1. Open Lead\n2. Click Convert\n3. Fill mandatory fields\n4. Submit","Lead Conversion","Opportunity and Contact are created","Opportunity created but Contact missing",FAIL
6,Stage validation fails during Opportunity update,"Opportunity record exists",{"stageName":"Closed - Won","closeDate":""},"1. Open Opportunity\n2. Set Stage to Closed - Won\n3. Leave Close Date blank\n4. Click Save","Stage Validation","Error: Close Date is required for Closed Stage","Error: Close Date is required for Closed Stage",PASS
```

## 📌 Format Requirements

- The output **must be a CSV** — not JSON, not Markdown tables.
- Columns must appear exactly as:
  ```
  Sl No,Test Scenario,Pre-Requisite,Test Data,Test Step,Step Name,Expected Result,Actual Result,Test Result
  ```
- Use escaped newlines (`\n`) inside cells that require multi-line steps.

## 🧩 Hint for Implementation Tools

If using an AI or automation script:
- Parse the requirement and generate **at least 6–10 test cases** covering every logical path.
- Focus on **UAT readiness**: end-to-end workflows, common user errors, and system behavior.
